"use client";
import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import { EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { db } from "../../../../firebase";
import { collection, getDocs, query, where, or } from "firebase/firestore";
import { CalendarEvent } from "@/interface/calendar";
import UpcomingEvents from '@/components/student/UpcomingEvents';
import { CreateButton } from "@/components/common";
import { useRouter } from "next/navigation";
import { useSaveUserData } from "@/hooks";
import { Teacher } from "@/interface/user";
import { errorToast } from "@/config/toast";
interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

function EventModal({ event, onClose }: EventModalProps) {
  if (!event) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-base-100 shadow-xl p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 btn btn-xs btn-primary text-white rounded-none martian-mono text-xs font-medium" onClick={onClose}>
          close
        </button>
        <h2 className="text-xl font-bold text-primary martian-mono">{event.title}</h2>
        <div className="text-xs text-zinc-500 italic mb-5">
          {event.startDate} to {event.endDate}
        </div>
        {event.description && <div className="mb-2 text-zinc-600 italic">{event.description}</div>}
      </div>
    </div>
  );
}

const TeachersCalendarPage = () => {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalEvent, setModalEvent] = useState<CalendarEvent | null>(null);
  const { userData, isLoading: userLoading } = useSaveUserData({
    role: "teacher",
  });
  useEffect(() => {
    async function fetchEvents() {
      if (!userData || userLoading) return;

      // Type guard to ensure userData is a Teacher
      if (!("employeeId" in userData)) {
        errorToast("Invalid user data. Please try again.");
        return;
      }

      const teacherData = userData as Teacher;

      try {
        setIsLoading(true);
        const eventsRef = collection(db, "events");
        const q = query(
          eventsRef,
          or(
            where("teacherId", "==", teacherData.employeeId)
          )
        );
        const snapshot = await getDocs(q);
        const data: CalendarEvent[] = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
        setEvents(data);
      } catch (error) {
        console.error("Error fetching events:", error);
        errorToast("Failed to fetch events");
      } finally {
        setIsLoading(false);
      }
    }
    fetchEvents();
  }, [userData, userLoading]);

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

  if (userLoading) {
    return (
      <div className="min-h-screen text-zinc-600 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-zinc-700">
      <div className="ma mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-4 text-primary martian-mono">Teachers&apos; Calendar</h1>
            <p className="text-sm text-base-content/60 font-normal italic">
              View and manage school events
            </p>
          </div>
          <div
            onClick={() =>
              router.push("/teachers/my-calendar/create-event")
            }
            className="w-auto px-4 cursor-pointer martian-mono text-xs text-primary"
          >
            <CreateButton loading={false} buttonText={"Create Event"} className="w-auto" />
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-2 text-primary martian-mono">Upcoming Events</h2>
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

export default TeachersCalendarPage; 