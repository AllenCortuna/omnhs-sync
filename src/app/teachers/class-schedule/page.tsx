"use client";
import React, { useState, useEffect } from "react";
import { useSaveUserData } from "@/hooks";
import { subjectRecordService } from "@/services/subjectRecordService";
import { errorToast, successToast } from "@/config/toast";
import type { SubjectRecord } from "@/interface/info";
import type { Teacher } from "@/interface/user";
import { LoadingOverlay } from "@/components/common";
import {
    HiAcademicCap,
    HiDocumentText,
    HiPencil,
    HiTrash,
} from "react-icons/hi";
import { formatDate } from "@/config/format";
import { getDefaultSchoolYear } from "@/config/school";
import Link from "next/link";

const ClassSchedule: React.FC = () => {
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
                errorToast("Failed to load class schedule");
            } finally {
                setLoading(false);
            }
        };

        fetchSubjectRecords();
    }, [userData, userLoading]);

    const handleDeleteClass = async (recordId: string) => {
        if (!confirm("Are you sure you want to delete this class?")) {
            return;
        }

        try {
            setLoading(true);
            await subjectRecordService.deleteSubjectRecord(recordId);
            setSubjectRecords((prev) =>
                prev.filter((record) => record.id !== recordId)
            );
            successToast("Class deleted successfully!");
        } catch (error) {
            console.error("Error deleting class:", error);
            errorToast("Failed to delete class. Please try again.");
        } finally {
            setLoading(false);
        }
    };


    if (userLoading || loading) {
        return <LoadingOverlay />;
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="mb-6">
                <div>
                    <h1 className="text-xl font-bold text-primary">
                        Class Schedule
                    </h1>
                    <p className="text-gray-500 mt-1 text-xs italic">
                        View your assigned classes and subjects
                    </p>
                </div>
            </div>

            {subjectRecords.length === 0 ? (
                <div className="text-center py-12">
                    <HiAcademicCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        No Classes Found
                    </h3>
                    <p className="text-gray-500 mb-6">
                        You haven&apos;t been assigned any classes yet. Please contact the administrator to assign classes.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th className="text-primary font-bold hidden sm:table-cell">Subject</th>
                                <th className="text-primary font-bold">Section/Grade Level</th>
                                <th className="text-primary font-bold hidden lg:table-cell">Semester</th>
                                <th className="text-primary font-bold hidden lg:table-cell">School Year</th>
                                <th className="text-primary font-bold">Students</th>
                                <th className="text-primary font-bold hidden xl:table-cell">Created</th>
                                <th className="text-primary font-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjectRecords.map((record) => (
                                <tr key={record.id} className="hover">
                                    <td className="hidden sm:table-cell">
                                        <div className="font-bold w-28 text-primary text-xs">
                                            {record.subjectName}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="font-medium text-xs text-primary">
                                            {record.sectionName}
                                        </div>
                                        <div className="text-xs text-gray-500 sm:hidden">
                                            {record.subjectName}
                                        </div>
                                    </td>
                                    <td className="hidden lg:table-cell">
                                        <div className="font-medium text-xs text-zinc-600">
                                            {record.semester}
                                        </div>
                                    </td>
                                    <td className="hidden lg:table-cell">
                                        <div className="font-medium text-xs text-zinc-600">
                                            {record.schoolYear}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="badge badge-neutral badge-xs text-white text-[9px] p-2 rounded-full">
                                            {record.studentList?.length || 0}
                                        </div>
                                        <div className="text-xs text-gray-500 sm:hidden mt-1">
                                            {record.gradeLevel} • {record.semester}
                                        </div>
                                    </td>
                                    <td className="hidden xl:table-cell">
                                        <div className="text-xs text-gray-500 italic">
                                            {formatDate(record.createdAt)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <Link
                                                className="btn btn-xs btn-outline btn-secondary rounded-none"
                                                title="Edit class"
                                                href={`/teachers/class-schedule/add-student?subjectRecordId=${record.id}`}
                                            >
                                                <HiPencil className="w-3 h-3" />
                                                <span className="hidden sm:inline">Edit</span>
                                            </Link>
                                            <Link
                                                className="btn btn-xs btn-outline btn-accent rounded-none"
                                                title="Manage grades"
                                                href={`/teachers/class-schedule/student-grade?subjectRecordId=${record.id}`}
                                            >
                                                <HiDocumentText className="w-3 h-3" />
                                                <span className="hidden sm:inline">Grades</span>
                                            </Link>
                                            <button
                                                onClick={() =>
                                                    handleDeleteClass(record.id)
                                                }
                                                className="btn btn-xs btn-outline btn-error rounded-none"
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
            )}
        </div>
    );
};

export default ClassSchedule;
