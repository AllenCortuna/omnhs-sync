"use client";
import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import { useRouter } from "next/navigation";
import { db } from '../../../../firebase';
import { collection, getDocs } from "firebase/firestore";
import { CalendarEvent } from '@/interface/calendar';
import CreateButton from '@/components/common/CreateButton';

function groupEventsByDate(events: CalendarEvent[]) {
  const map: Record<string, CalendarEvent[]> = {};
  events.forEach(event => {
    const date = event.startDate;
    if (!map[date]) map[date] = [];
    map[date].push(event);
  });
  return map;
}

export function AdminCalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true);
      const snapshot = await getDocs(collection(db, "events"));
      const data: CalendarEvent[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
      setEvents(data);
      setIsLoading(false);
    }
    fetchEvents();
  }, []);

  const eventsByDate = groupEventsByDate(events);
  const formattedSelected = selectedDate ? selectedDate.toISOString().slice(0, 10) : null;

  return (
    <div className="min-h-screen bg-base-200 text-zinc-700">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">School Calendar</h1>
            <p className="text-sm text-base-content/60">View and manage school events</p>
          </div>
          <div onClick={() => router.push('/admin/calendar/create-event')} className="w-auto px-4 cursor-pointer">
            <CreateButton
              loading={false}
              buttonText={"+ Create Event"}
              className="w-auto"
            />
          </div>
        </div>
        <div className="bg-base-100 shadow-xl rounded-lg p-4 flex flex-col md:flex-row gap-8">
          <div>
            <Calendar
              onChange={date => setSelectedDate(date as Date)}
              value={selectedDate}
              tileContent={({ date }) => {
                const key = date.toISOString().slice(0, 10);
                if (eventsByDate[key]) {
                  return <span className="block w-2 h-2 bg-primary rounded-full mx-auto mt-1" />;
                }
                return null;
              }}
            />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-2">Events{formattedSelected ? ` on ${formattedSelected}` : ''}</h2>
            {isLoading ? (
              <div className="text-center py-8">Loading events...</div>
            ) : (
              <ul className="space-y-3">
                {(formattedSelected && eventsByDate[formattedSelected]?.length)
                  ? eventsByDate[formattedSelected].map(event => (
                      <li key={event.id} className="card bg-base-100 shadow p-4 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{event.title}</span>
                          <button
                            className="btn btn-xs btn-outline"
                            onClick={() => router.push(`/admin/calendar/edit-event?id=${event.id}`)}
                          >Edit</button>
                        </div>
                        <span className="text-xs text-base-content/60">{event.startDate} to {event.endDate}</span>
                        {event.description && <span className="text-sm">{event.description}</span>}
                      </li>
                    ))
                  : <div className="text-base-content/60">No events for this date.</div>
                }
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminCalendarPage; 