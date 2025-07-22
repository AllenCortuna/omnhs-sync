import React from "react";
import { CalendarEvent } from "@/interface/calendar";

interface UpcomingEventsProps {
  events: CalendarEvent[];
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  const now = new Date();
  const upcoming = events
    .filter(e => new Date(e.startDate) >= now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  if (upcoming.length === 0) {
    return (
      <div className="card bg-base-100 shadow p-4 text-center text-base-content/60">
        No upcoming events.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {upcoming.map(event => (
        <div key={event.id} className="card bg-base-100 shadow p-4">
          <div className="font-bold text-primary mb-1">{event.title}</div>
          <div className="text-xs text-base-content/60 mb-1">
            {event.startDate} to {event.endDate}
          </div>
          {event.description && <div className="text-sm">{event.description}</div>}
        </div>
      ))}
    </div>
  );
}

export default UpcomingEvents; 