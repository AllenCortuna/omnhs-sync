"use client";
import React from "react";
import { HiX } from "react-icons/hi";
import type { SubjectRecord } from "@/interface/info";
import Link from "next/link";
import { HiPencil, HiDocumentText, HiTrash } from "react-icons/hi";

interface SectionClassScheduleModalProps {
    open: boolean;
    onClose: () => void;
    sectionName: string;
    classSchedules: SubjectRecord[];
    onDelete: (recordId: string) => void;
}

export function SectionClassScheduleModal({
    open,
    onClose,
    sectionName,
    classSchedules,
    onDelete,
}: SectionClassScheduleModalProps) {
    if (!open) return null;

    return (
        <>
            <div className="modal modal-open">
                <div className="modal-box max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-bold text-lg text-primary martian-mono">
                            {sectionName}
                        </h3>
                        <p className="text-sm text-secondary mt-1">
                            Class Schedules ({classSchedules.length})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn btn-sm btn-circle btn-ghost"
                    >
                        <HiX className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {classSchedules.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">
                                No class schedules found for this section.
                            </p>
                        </div>
                    ) : (
                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body p-0">
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra table-sm w-full">
                                        <thead className="sticky top-0 bg-base-200 z-10">
                                            <tr>
                                                <th className="bg-base-200 text-xs">Subject</th>
                                                <th className="bg-base-200 text-xs">Teacher</th>
                                                <th className="bg-base-200 text-xs">Grade Level</th>
                                                <th className="bg-base-200 text-xs">Semester</th>
                                                <th className="bg-base-200 text-xs">School Year</th>
                                                <th className="bg-base-200 text-xs">Students</th>
                                                <th className="bg-base-200 text-xs">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs">
                                            {classSchedules.map((record) => (
                                                <tr key={record.id} className="hover">
                                                    <td>
                                                        <div className="font-bold text-xs martian-mono text-primary">
                                                            {record.subjectName}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="font-medium text-xs text-zinc-600">
                                                            {record.teacherName}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="font-medium text-xs text-zinc-600">
                                                            {record.gradeLevel}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="font-medium text-xs text-zinc-600">
                                                            {record.semester}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="font-medium text-xs text-zinc-600">
                                                            {record.schoolYear}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="badge badge-neutral badge-xs text-white text-[9px] p-2 rounded-full">
                                                            {record.studentList?.length || 0}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="flex flex-col gap-1 w-20">
                                                            <Link
                                                                className="btn btn-xs text-[10px] flex flex-col gap-1 btn-outline btn-secondary rounded-none"
                                                                title="Edit class"
                                                                href={`/admin/class-schedule/add-student?subjectRecordId=${record.id}`}
                                                            >
                                                                <HiPencil className="w-3 h-3" />
                                                                <span className="hidden sm:inline">Edit</span>
                                                            </Link>
                                                            <Link
                                                                className="btn btn-xs text-[10px] flex flex-col gap-1 btn-outline btn-accent rounded-none"
                                                                title="Manage grades"
                                                                href={`/admin/class-schedule/student-grade?subjectRecordId=${record.id}`}
                                                            >
                                                                <HiDocumentText className="w-3 h-3" />
                                                                <span className="hidden sm:inline">Grades</span>
                                                            </Link>
                                                            <button
                                                                onClick={() => onDelete(record.id)}
                                                                className="btn btn-xs text-[10px] flex flex-col gap-1 btn-outline btn-error rounded-none"
                                                                title="Delete class"
                                                            >
                                                                <HiTrash className="w-3 h-3" />
                                                                <span className="hidden sm:inline">Delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-action mt-4">
                    <button
                        onClick={onClose}
                        className="btn btn-primary"
                    >
                        Close
                    </button>
                </div>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </>
    );
}

