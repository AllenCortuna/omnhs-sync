"use client";
import React, { useState, useEffect } from "react";
import { useSaveUserData } from "@/hooks";
import { subjectRecordService } from "@/services/subjectRecordService";
import { strandService } from "@/services/strandService";
import { sectionService } from "@/services/sectionService";
import { errorToast, successToast } from "@/config/toast";
import type { SubjectRecord, Strand, Section } from "@/interface/info";
import type { Teacher } from "@/interface/user";
import { LoadingOverlay } from "@/components/common";
import {
    HiAcademicCap,
    HiDocumentText,
    HiPlus,
    HiPencil,
    HiTrash,
} from "react-icons/hi";
import { formatDate } from "@/config/format";
import { getSchoolYearOptions, getDefaultSchoolYear, SEMESTER_OPTIONS } from "@/config/school";
import Link from "next/link";

const ClassSchedule: React.FC = () => {
    const { userData, isLoading: userLoading } = useSaveUserData({
        role: "teacher",
    });
    const [subjectRecords, setSubjectRecords] = useState<SubjectRecord[]>([]);
    const [strands, setStrands] = useState<Strand[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedStrandId, setSelectedStrandId] = useState<string>("");
    const [selectedSectionId, setSelectedSectionId] = useState<string>("");

    // Form state
    const [formData, setFormData] = useState({
        sectionId: "",
        sectionName: "",
        subjectId: "",
        subjectName: "",
        gradeLevel: "",
        semester: "",
        schoolYear: "",
        teacherId: "",
        teacherName: "",
    });

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [strandsData] = await Promise.all([
                    strandService.getAllStrands(),
                ]);
                setStrands(strandsData);
            } catch (error) {
                console.error("Error fetching initial data:", error);
                errorToast("Failed to load initial data");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

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

    // Fetch sections when strand changes
    useEffect(() => {
        const fetchSections = async () => {
            if (!selectedStrandId) {
                setSections([]);
                return;
            }

            try {
                const sectionsData = await sectionService.getSectionsByStrandId(
                    selectedStrandId
                );
                setSections(sectionsData);
            } catch (error) {
                console.error("Error fetching sections:", error);
                setSections([]);
            }
        };

        fetchSections();
    }, [selectedStrandId]);

    // Update form data when selections change
    useEffect(() => {
        if (selectedSectionId) {
            const section = sections.find((s) => s.id === selectedSectionId);
            setFormData((prev) => ({
                ...prev,
                sectionId: selectedSectionId,
                sectionName: section?.sectionName || "",
            }));
        }
    }, [selectedSectionId, sections]);

    const handleAddClass = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userData || !("employeeId" in userData)) {
            errorToast("User data is not a teacher");
            return;
        }

        // Validate required fields
        if (
            !formData.sectionId ||
            !formData.subjectId ||
            !formData.gradeLevel ||
            !formData.semester ||
            !formData.schoolYear
        ) {
            errorToast("Please fill in all required fields");
            return;
        }

        try {
            setLoading(true);
            const teacherData = userData as Teacher;

            const newSubjectRecord =
                await subjectRecordService.createSubjectRecord({
                    ...formData,
                    teacherId: teacherData.employeeId,
                    teacherName:
                        teacherData.firstName + " " + teacherData.lastName,
                });

            setSubjectRecords((prev) => [newSubjectRecord, ...prev]);
            successToast("Class added successfully!");
            setShowAddModal(false);
            resetForm();
        } catch (error) {
            console.error("Error adding class:", error);
            errorToast("Failed to add class. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            sectionId: "",
            sectionName: "",
            subjectId: "",
            subjectName: "",
            gradeLevel: "",
            semester: "",
            schoolYear: "",
            teacherId: "",
            teacherName: "",
        });
        setSelectedStrandId("");
        setSelectedSectionId("");
    };

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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-bold text-primary">
                        Class Schedule
                    </h1>
                    <p className="text-gray-500 mt-1 text-xs italic">
                        Manage your assigned classes and subjects
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary gap-2"
                >
                    <HiPlus className="w-4 h-4" />
                    Add New Class
                </button>
            </div>

            {subjectRecords.length === 0 ? (
                <div className="text-center py-12">
                    <HiAcademicCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        No Classes Found
                    </h3>
                    <p className="text-gray-500 mb-6">
                        You haven&apos;t been assigned any classes yet. Add your
                        first class to get started.
                    </p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary gap-2"
                    >
                        <HiPlus className="w-4 h-4" />
                        Add Your First Class
                    </button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th className="text-primary font-bold hidden sm:table-cell">Subject</th>
                                <th className="text-primary font-bold">Section</th>
                                <th className="text-primary font-bold hidden md:table-cell">Grade Level</th>
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
                                    <td className="hidden md:table-cell">
                                        <div className="font-medium text-xs text-zinc-600">
                                            {record.gradeLevel}
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

            {/* Add Class Modal */}
            {showAddModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-2xl">
                        <h3 className="font-bold text-lg mb-4">
                            Add New Class
                        </h3>
                        <form onSubmit={handleAddClass}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Strand Selection */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">
                                            Strand *
                                        </span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={selectedStrandId}
                                        onChange={(e) =>
                                            setSelectedStrandId(e.target.value)
                                        }
                                        required
                                    >
                                        <option value="">Select Strand</option>
                                        {strands.map((strand) => (
                                            <option
                                                key={strand.id}
                                                value={strand.id}
                                            >
                                                {strand.strandName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Section Selection */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">
                                            Section *
                                        </span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={selectedSectionId}
                                        onChange={(e) =>
                                            setSelectedSectionId(e.target.value)
                                        }
                                        required
                                        disabled={!selectedStrandId}
                                    >
                                        <option value="">Select Section</option>
                                        {sections.map((section) => (
                                            <option
                                                key={section.id}
                                                value={section.id}
                                            >
                                                {section.sectionName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Subject Name */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">
                                            Subject Name *
                                        </span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={formData.subjectName}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                subjectName: e.target.value,
                                                subjectId: e.target.value,
                                            }))
                                        }
                                        required
                                    >
                                        <option value="">Select Subject</option>
                                        <option value="Oral Communication">
                                            Oral Communication
                                        </option>
                                        <option value="Reading and Writing">
                                            Reading and Writing
                                        </option>
                                        <option value="Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino">
                                            Komunikasyon at Pananaliksik sa Wika
                                            at Kulturang Pilipino
                                        </option>
                                        <option value="Pagbasa at Pagsusuri ng Ibat-Ibang Teksto Tungo sa Pananaliksik">
                                            Pagbasa at Pagsusuri ng
                                            Iba&apos;t-Ibang Teksto Tungo sa
                                            Pananaliksik
                                        </option>
                                        <option value="21st Century Literature from the Philippines and the World">
                                            21st Century Literature from the
                                            Philippines and the World
                                        </option>
                                        <option value="Contemporary Philippine Arts from the Regions">
                                            Contemporary Philippine Arts from
                                            the Regions
                                        </option>
                                        <option value="Media and Information Literacy">
                                            Media and Information Literacy
                                        </option>
                                        <option value="General Math">
                                            General Math
                                        </option>
                                        <option value="Statistics and Probability">
                                            Statistics and Probability
                                        </option>
                                        <option value="Earth and Life Science">
                                            Earth and Life Science
                                        </option>
                                        <option value="Physical Science">
                                            Physical Science
                                        </option>
                                        <option value="Introduction to the Philosophy of the Human Person">
                                            Introduction to the Philosophy of
                                            the Human Person
                                        </option>
                                        <option value="Physical Education and Health">
                                            Physical Education and Health
                                        </option>
                                        <option value="Personal Development">
                                            Personal Development
                                        </option>
                                        <option value="Understanding Culture, Society and Politics">
                                            Understanding Culture, Society and
                                            Politics
                                        </option>
                                        <option value="Earth Science">
                                            Earth Science
                                        </option>
                                        <option value="Disaster Readiness and Risk Reduction">
                                            Disaster Readiness and Risk
                                            Reduction
                                        </option>
                                    </select>
                                </div>

                                {/* Grade Level */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">
                                            Grade Level *
                                        </span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={formData.gradeLevel}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                gradeLevel: e.target.value,
                                            }))
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select Grade Level
                                        </option>
                                        <option value="Grade 11">
                                            Grade 11
                                        </option>
                                        <option value="Grade 12">
                                            Grade 12
                                        </option>
                                    </select>
                                </div>

                                {/* Semester */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">
                                            Semester *
                                        </span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={formData.semester}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                semester: e.target.value,
                                            }))
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select Semester
                                        </option>
                                        {SEMESTER_OPTIONS.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* School Year */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">
                                            School Year *
                                        </span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={formData.schoolYear}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                schoolYear: e.target.value,
                                            }))
                                        }
                                    >
                                        {getSchoolYearOptions().map(
                                            (option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="modal-action">
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <HiPlus className="w-4 h-4" />
                                            Add Class
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassSchedule;
