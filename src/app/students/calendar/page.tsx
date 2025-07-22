"use client";
import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import { EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { db } from "../../../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { CalendarEvent } from "@/interface/calendar";
import UpcomingEvents from '@/components/student/UpcomingEvents';

interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

function EventModal({ event, onClose }: EventModalProps) {
  if (!event) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-base-100 rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 btn btn-xs btn-circle" onClick={onClose}>
          ✕
        </button>
        <h2 className="text-xl font-bold mb-2">{event.title}</h2>
        <div className="text-sm text-base-content/60 mb-2">
          {event.startDate} to {event.endDate}
        </div>
        {event.description && <div className="mb-2">{event.description}</div>}
      </div>
    </div>
  );
}

export function StudentsCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalEvent, setModalEvent] = useState<CalendarEvent | null>(null);

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

  function handleEventClick(arg: EventClickArg) {
    const event = events.find(e => e.id === arg.event.id);
    setModalEvent(event || null);
  }

  const fullCalendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.startDate,
    end: event.endDate,
    description: event.description,
  }));

  return (
    <div className="min-h-screen text-zinc-700">
      <div className="ma mx-auto">
        <h1 className="text-2xl font-bold mb-4">School Calendar</h1>
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Upcoming Events</h2>
          <UpcomingEvents events={events} />
        </div>
        <div className="calendar-contain bg-base-100 shadow-xl rounded-lg p-4">
          {isLoading ? (
            <div className="text-center py-8">Loading events...</div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={fullCalendarEvents}
              eventClick={handleEventClick}
              height="auto"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,dayGridWeek,dayGridDay",
              }}
            />
          )}
        </div>
        <EventModal event={modalEvent} onClose={() => setModalEvent(null)} />
      </div>
    </div>
  );
}

export default StudentsCalendarPage; 