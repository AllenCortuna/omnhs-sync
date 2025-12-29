"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSaveUserData } from "@/hooks";
import { subjectRecordService } from "@/services/subjectRecordService";
import { errorToast } from "@/config/toast";
import type { SubjectRecord } from "@/interface/info";
import type { Teacher } from "@/interface/user";
import { LoadingOverlay } from "@/components/common";
import { HiCalendar, HiClock } from "react-icons/hi";
import { getDefaultSchoolYear } from "@/config/school";

const DAYS_OF_WEEK = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface ScheduleSlot {
    record: SubjectRecord;
    startTime: string;
    endTime: string;
}

const TimeSlot: React.FC = () => {
    const { userData, isLoading: userLoading } = useSaveUserData({
        role: "teacher",
    });
    const [subjectRecords, setSubjectRecords] = useState<SubjectRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch subject records for the current teacher
    useEffect(() => {
        const fetchSubjectRecords = async () => {
            if (!userData || userLoading) return;

            if (!("employeeId" in userData)) {
                errorToast("User data is not a teacher");
                return;
            }

            try {
                setLoading(true);
                const teacherData = userData as Teacher;
                const currentSchoolYear = getDefaultSchoolYear();
                const records =
                    await subjectRecordService.getSubjectRecordsByTeacher(
                        teacherData.employeeId,
                        currentSchoolYear
                    );
                setSubjectRecords(records);
            } catch (error) {
                console.error("Error fetching subject records:", error);
                errorToast("Failed to load schedule");
            } finally {
                setLoading(false);
            }
        };

        fetchSubjectRecords();
    }, [userData, userLoading]);

    // Parse time slot and organize by day
    const scheduleByDay = useMemo(() => {
        const schedule: { [day: string]: ScheduleSlot[] } = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
            Sunday: [],
        };

        subjectRecords.forEach((record) => {
            if (!record.days || record.days.length === 0) return;

            // Parse time slot (format: "HH:MM - HH:MM")
            const timeParts = record.timeSlot?.split(" - ") || [];
            if (timeParts.length !== 2) return;

            const startTime = timeParts[0].trim();
            const endTime = timeParts[1].trim();

            const slot: ScheduleSlot = {
                record,
                startTime,
                endTime,
            };

            // Add to each day the class is scheduled
            record.days.forEach((day) => {
                if (schedule[day]) {
                    schedule[day].push(slot);
                }
            });
        });

        // Sort each day's slots by start time
        Object.keys(schedule).forEach((day) => {
            schedule[day].sort((a, b) => {
                const timeA = a.startTime.split(":").map(Number);
                const timeB = b.startTime.split(":").map(Number);
                const minutesA = timeA[0] * 60 + timeA[1];
                const minutesB = timeB[0] * 60 + timeB[1];
                return minutesA - minutesB;
            });
        });

        return schedule;
    }, [subjectRecords]);

    // Get all unique start time slots for the grid
    const allTimeSlots = useMemo(() => {
        const timeSet = new Set<string>();
        subjectRecords.forEach((record) => {
            const timeParts = record.timeSlot?.split(" - ") || [];
            if (timeParts.length === 2) {
                timeSet.add(timeParts[0].trim());
            }
        });
        return Array.from(timeSet).sort((a, b) => {
            const timeA = a.split(":").map(Number);
            const timeB = b.split(":").map(Number);
            const minutesA = timeA[0] * 60 + timeA[1];
            const minutesB = timeB[0] * 60 + timeB[1];
            return minutesA - minutesB;
        });
    }, [subjectRecords]);

    // Format time for display
    const formatTime = (time: string): string => {
        const [hours, minutes] = time.split(":");
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    // Get slot for a specific day and time (check if time falls within the slot's time range)
    const getSlotForTime = (day: string, time: string): ScheduleSlot | null => {
        const daySlots = scheduleByDay[day] || [];
        const [timeHour, timeMin] = time.split(":").map(Number);
        const timeMinutes = timeHour * 60 + timeMin;

        return (
            daySlots.find((slot) => {
                const [startHour, startMin] = slot.startTime
                    .split(":")
                    .map(Number);
                const startMinutes = startHour * 60 + startMin;

                // Check if this time is the start time of a slot
                return timeMinutes === startMinutes;
            }) || null
        );
    };

    if (userLoading || loading) {
        return <LoadingOverlay />;
    }

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <div className="avatar placeholder">
                        <div className="bg-primary text-primary-content rounded-lg w-10 h-10 flex items-center justify-center">
                            <HiCalendar className="text-xl" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-primary martian-mono">
                            Weekly Schedule
                        </h1>
                        <p className="text-gray-500 mt-1 text-xs italic">
                            View your class schedule for the week
                        </p>
                    </div>
                </div>
            </div>

            {subjectRecords.length === 0 ? (
                <div className="text-center py-12">
                    <HiCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        No Schedule Found
                    </h3>
                    <p className="text-gray-500">
                        You haven&apos;t been assigned any classes yet. Please contact the administrator to assign classes.
                    </p>
                </div>
            ) : (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-0">
                        <div className="overflow-x-auto">
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th className="bg-base-200 text-xs font-bold text-primary sticky left-0 z-20 min-w-[100px]">
                                            Time
                                        </th>
                                        {DAYS_OF_WEEK.map((day) => (
                                            <th
                                                key={day}
                                                className="bg-base-200 text-xs font-bold text-primary text-center min-w-[150px]"
                                            >
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm">
                                                        {DAYS_SHORT[DAYS_OF_WEEK.indexOf(day)]}
                                                    </span>
                                                    <span className="text-[10px] text-base-content/60 font-normal">
                                                        {day}
                                                    </span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {allTimeSlots.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="text-center py-8 text-gray-500"
                                            >
                                                No time slots found
                                            </td>
                                        </tr>
                                    ) : (
                                        allTimeSlots.map((time) => (
                                            <tr key={time} className="hover">
                                                <td className="sticky left-0 bg-base-100 z-10 font-medium text-xs text-primary">
                                                    <div className="flex items-center gap-1">
                                                        {formatTime(time)}
                                                    </div>
                                                </td>
                                                {DAYS_OF_WEEK.map((day) => {
                                                    const slot = getSlotForTime(
                                                        day,
                                                        time
                                                    );
                                                    return (
                                                        <td
                                                            key={`${day}-${time}`}
                                                            className="align-top border-r border-base-200 p-1"
                                                        >
                                                            {slot ? (
                                                                <div className="card bg-primary text-primary-content shadow-sm m-1 rounded-none p-2 hover:shadow-md transition-shadow">
                                                                    <div className="card-body p-2">
                                                                        <div className="space-y-1">
                                                                            <div className="font-bold text-xs martian-mono line-clamp-2">
                                                                                {slot.record.subjectName}
                                                                            </div>
                                                                            <div className="text-[10px] opacity-90 font-medium">
                                                                                {slot.record.sectionName}
                                                                            </div>
                                                                            <div className="text-[10px] opacity-75 flex items-center gap-1">
                                                                                {formatTime(
                                                                                    slot.startTime
                                                                                )}{" "}
                                                                                -{" "}
                                                                                {formatTime(
                                                                                    slot.endTime
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="h-20"></div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Stats */}
            {subjectRecords.length > 0 && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="stat bg-base-100 shadow-sm rounded-lg">
                        <div className="stat-figure text-primary">
                            <HiCalendar className="w-8 h-8" />
                        </div>
                        <div className="stat-title text-xs">Total Classes</div>
                        <div className="stat-value text-lg text-primary">
                            {subjectRecords.length}
                        </div>
                    </div>
                    <div className="stat bg-base-100 shadow-sm rounded-lg">
                        <div className="stat-figure text-secondary">
                            <HiClock className="w-8 h-8" />
                        </div>
                        <div className="stat-title text-xs">Time Slots</div>
                        <div className="stat-value text-lg text-secondary">
                            {allTimeSlots.length}
                        </div>
                    </div>
                    <div className="stat bg-base-100 shadow-sm rounded-lg">
                        <div className="stat-figure text-accent">
                            <HiCalendar className="w-8 h-8" />
                        </div>
                        <div className="stat-title text-xs">Scheduled Days</div>
                        <div className="stat-value text-lg text-accent">
                            {
                                Object.values(scheduleByDay).filter(
                                    (slots) => slots.length > 0
                                ).length
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeSlot;

