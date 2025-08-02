"use client";
import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import { useRouter } from "next/navigation";
import { db } from "../../../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { CalendarEvent } from "@/interface/calendar";
import CreateButton from "@/components/common/CreateButton";
import { formatDate } from "@/config/format";

function groupEventsByDate(events: CalendarEvent[]) {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((event) => {
        const date = event.startDate;
        if (!map[date]) map[date] = [];
        map[date].push(event);
    });
    return map;
}

const AdminCalendarPage = () => {
    const router = useRouter();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    useEffect(() => {
        async function fetchEvents() {
            setIsLoading(true);
            const snapshot = await getDocs(collection(db, "events"));
            const data: CalendarEvent[] = snapshot.docs.map(
                (doc) => ({ id: doc.id, ...doc.data() } as CalendarEvent)
            );
            setEvents(data);
            setIsLoading(false);
        }
        fetchEvents();
    }, []);

    const eventsByDate = groupEventsByDate(events);

    function handleDateClick(arg: DateClickArg) {
        setSelectedDate(arg.dateStr);
    }

    // FullCalendar expects events in a specific format
    const fullCalendarEvents = events.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        description: event.description,
    }));

    return (
        <div className="min-h-screen text-zinc-600">
            <div className="ma mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">School Calendar</h1>
                        <p className="text-sm text-base-content/60">
                            View and manage school events
                        </p>
                    </div>
                    <div
                        onClick={() =>
                            router.push("/admin/calendar/create-event")
                        }
                        className="w-auto px-4 cursor-pointer"
                    >
                        <CreateButton
                            loading={false}
                            buttonText={"Create Event"}
                            className="w-auto"
                        />
                    </div>
                </div>
                <div className="rounded-lg p-4 flex flex-col md:flex-row gap-8">
                    <div className="mt-8">
                        <h2 className="text-lg font-semibold text-primary mb-2">
                            Events <br /> <span className="text-base-content/60 text-sm">{formatDate(selectedDate || "")}</span>
                        </h2>
                        {isLoading ? (
                            <div className="text-center py-8">
                                Loading events...
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {selectedDate &&
                                eventsByDate[selectedDate]?.length ? (
                                    eventsByDate[selectedDate].map((event) => (
                                        <li
                                            key={event.id}
                                            className="card bg-base-100 shadow p-4 flex flex-col gap-1"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold">
                                                    {event.title}
                                                </span>
                                                <button
                                                    className="btn btn-xs btn-outline"
                                                    onClick={() =>
                                                        router.push(
                                                            `/admin/calendar/edit-event?id=${event.id}`
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                            <span className="text-xs text-base-content/60">
                                                {event.startDate} to{" "}
                                                {event.endDate}
                                            </span>
                                            {event.description && (
                                                <span className="text-sm">
                                                    {event.description}
                                                </span>
                                            )}
                                        </li>
                                    ))
                                ) : (
                                    <div className="text-base-content/60 text-xs">
                                        No events for this date.
                                    </div>
                                )}
                            </ul>
                        )}
                    </div>
                    <div className="m-4 w-full">
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            events={fullCalendarEvents}
                            dateClick={handleDateClick}
                            height="auto"
                            headerToolbar={{
                                left: "prev,next today",
                                center: "title",
                                right: "dayGridMonth,dayGridWeek,dayGridDay",
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminCalendarPage;
