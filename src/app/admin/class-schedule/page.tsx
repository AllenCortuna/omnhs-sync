"use client";
import React, { useState, useEffect, useMemo } from "react";
import { subjectRecordService } from "@/services/subjectRecordService";
import { strandService } from "@/services/strandService";
import { sectionService } from "@/services/sectionService";
import { teacherService } from "@/services/teacherService";
import { errorToast, successToast } from "@/config/toast";
import type { SubjectRecord, Strand, Section } from "@/interface/info";
import type { Teacher } from "@/interface/user";
import { LoadingOverlay } from "@/components/common";
import { SectionClassScheduleModal } from "@/components/admin/SectionClassScheduleModal";
import {
    HiAcademicCap,
    HiPlus,
} from "react-icons/hi";
import { getDefaultSchoolYear, SEMESTER_OPTIONS } from "@/config/school";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../../../../firebase";

const ClassSchedule: React.FC = () => {
    const [subjectRecords, setSubjectRecords] = useState<SubjectRecord[]>([]);
    const [strands, setStrands] = useState<Strand[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedStrandId, setSelectedStrandId] = useState<string>("");
    const [selectedSectionId, setSelectedSectionId] = useState<string>("");
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
    const [selectedSectionName, setSelectedSectionName] = useState<string>("");
    const [showSectionModal, setShowSectionModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        sectionId: "",
        sectionName: "",
        subjectId: "",
        subjectName: "",
        gradeLevel: "",
        semester: "",
        schoolYear: getDefaultSchoolYear(),
        teacherId: "",
        teacherName: "",
    });

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [strandsData, teachersData] = await Promise.all([
                    strandService.getAllStrands(),
                    teacherService.getAllTeachers(),
                ]);
                setStrands(strandsData);
                setTeachers(teachersData);
            } catch (error) {
                console.error("Error fetching initial data:", error);
                errorToast("Failed to load initial data");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // Fetch all subject records for current school year
    const fetchSubjectRecords = async () => {
        try {
            setLoading(true);
            const currentSchoolYear = getDefaultSchoolYear();
            const allRecords = await subjectRecordService.getAllSubjectRecords();
            // Filter by current school year only
            const filteredRecords = allRecords.filter(
                (record) => record.schoolYear === currentSchoolYear
            );
            setSubjectRecords(filteredRecords);
        } catch (error) {
            console.error("Error fetching subject records:", error);
            errorToast("Failed to load class schedule");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjectRecords();
    }, []);

    // Group subject records by section
    const groupedBySection = useMemo(() => {
        const grouped = new Map<string, SubjectRecord[]>();
        
        subjectRecords.forEach((record) => {
            const sectionKey = record.sectionName;
            if (!grouped.has(sectionKey)) {
                grouped.set(sectionKey, []);
            }
            grouped.get(sectionKey)!.push(record);
        });

        // Convert to array and sort by section name
        return Array.from(grouped.entries())
            .map(([sectionName, records]) => ({
                sectionName,
                records: records.sort((a, b) => 
                    a.subjectName.localeCompare(b.subjectName)
                ),
            }))
            .sort((a, b) => a.sectionName.localeCompare(b.sectionName));
    }, [subjectRecords]);

    const handleSectionClick = (sectionName: string) => {
        setSelectedSectionName(sectionName);
        setShowSectionModal(true);
    };

    const handleCloseSectionModal = () => {
        setShowSectionModal(false);
        setSelectedSectionName("");
    };

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

    // Update form data when teacher is selected
    useEffect(() => {
        if (selectedTeacherId) {
            const teacher = teachers.find((t) => t.employeeId === selectedTeacherId);
            setFormData((prev) => ({
                ...prev,
                teacherId: selectedTeacherId,
                teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : "",
            }));
        }
    }, [selectedTeacherId, teachers]);

    const handleAddClass = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (
            !formData.sectionId ||
            !formData.subjectId ||
            !formData.gradeLevel ||
            !formData.semester ||
            !formData.schoolYear ||
            !formData.teacherId
        ) {
            errorToast("Please fill in all required fields");
            return;
        }

        // Ensure school year is set to current school year
        const currentSchoolYear = getDefaultSchoolYear();
        const formDataWithSchoolYear = {
            ...formData,
            schoolYear: currentSchoolYear,
        };

        // Check for duplicate class schedule
        const duplicateExists = subjectRecords.some(
            (record) =>
                record.sectionId === formDataWithSchoolYear.sectionId &&
                record.schoolYear === currentSchoolYear &&
                record.semester === formDataWithSchoolYear.semester
        );

        if (duplicateExists) {
            errorToast(
                `A class schedule already exists for this section in ${currentSchoolYear} ${formDataWithSchoolYear.semester} semester.`
            );
            return;
        }

        try {
            setLoading(true);

            // Fetch all students enrolled in this section for the same school year and semester
            let studentIds: string[] = [];
            
            try {
                // Try query with orderBy first
                const studentsQuery = query(
                    collection(db, "students"),
                    where("enrolledForSectionId", "==", formDataWithSchoolYear.sectionId),
                    where("enrolledForSchoolYear", "==", currentSchoolYear),
                    where("enrolledForSemester", "==", formDataWithSchoolYear.semester),
                    orderBy("lastName", "asc")
                );
                
                const studentsSnapshot = await getDocs(studentsQuery);
                studentsSnapshot.forEach((doc) => {
                    const student = doc.data();
                    if (student.studentId) {
                        studentIds.push(student.studentId);
                    }
                });
            } catch (queryError) {
                // If orderBy fails (index issue), try without orderBy and sort in memory
                const error = queryError as { code?: string; message?: string };
                if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
                    console.warn("Composite index not found, fetching without orderBy");
                    const studentsQuery = query(
                        collection(db, "students"),
                        where("enrolledForSectionId", "==", formDataWithSchoolYear.sectionId),
                        where("enrolledForSchoolYear", "==", currentSchoolYear),
                        where("enrolledForSemester", "==", formDataWithSchoolYear.semester)
                    );
                    
                    const studentsSnapshot = await getDocs(studentsQuery);
                    const students: Array<{ studentId: string; lastName?: string }> = [];
                    
                    studentsSnapshot.forEach((doc) => {
                        const student = doc.data();
                        if (student.studentId) {
                            students.push({
                                studentId: student.studentId,
                                lastName: student.lastName || ""
                            });
                        }
                    });
                    
                    // Sort in memory
                    students.sort((a, b) => (a.lastName || "").localeCompare(b.lastName || ""));
                    studentIds = students.map(s => s.studentId);
                } else {
                    throw queryError;
                }
            }

            // Create subject record with automatically added students
            const newSubjectRecord =
                await subjectRecordService.createSubjectRecord({
                    ...formDataWithSchoolYear,
                    studentList: studentIds,
                });

            // Only add to state if it matches current school year
            if (newSubjectRecord.schoolYear === currentSchoolYear) {
                setSubjectRecords((prev) => [newSubjectRecord, ...prev]);
            }
            
            // Refetch to ensure consistency
            await fetchSubjectRecords();
            
            successToast(
                `Class added successfully! ${studentIds.length} student${studentIds.length !== 1 ? 's' : ''} automatically enrolled.`
            );
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
            schoolYear: getDefaultSchoolYear(),
            teacherId: "",
            teacherName: "",
        });
        setSelectedStrandId("");
        setSelectedSectionId("");
        setSelectedTeacherId("");
    };

    const handleDeleteClass = async (recordId: string) => {
        if (!confirm("Are you sure you want to delete this class?")) {
            return;
        }

        try {
            setLoading(true);
            await subjectRecordService.deleteSubjectRecord(recordId);
            // Refetch to ensure we only show current school year records
            await fetchSubjectRecords();
            successToast("Class deleted successfully!");
        } catch (error) {
            console.error("Error deleting class:", error);
            errorToast("Failed to delete class. Please try again.");
        } finally {
            setLoading(false);
        }
    };


    if (loading) {
        return <LoadingOverlay />;
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-bold text-primary">
                        Class Schedule Management
                    </h1>
                    <p className="text-gray-500 mt-1 text-xs italic">
                        Manage all class schedules and assign teachers
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

            {groupedBySection.length === 0 ? (
                <div className="text-center py-12">
                    <HiAcademicCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        No Classes Found
                    </h3>
                    <p className="text-gray-500 mb-6">
                        No class schedules found for the current school year. Add a
                        new class schedule to get started.
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedBySection.map((group) => {
                        const totalStudents = group.records.reduce(
                            (sum, record) => sum + (record.studentList?.length || 0),
                            0
                        );
                        return (
                            <div
                                key={group.sectionName}
                                onClick={() => handleSectionClick(group.sectionName)}
                                className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-base-300"
                            >
                                <div className="card-body p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-sm text-primary martian-mono">
                                                {group.sectionName}
                                            </h3>
                                        </div>
                                        <div className="badge badge-primary badge-sm text-white">
                                            {group.records.length}
                                        </div>
                                    </div>
                                    <div className="space-y-1 mt-3 pt-3 border-t border-base-200">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-base-content/60">Class Schedules:</span>
                                            <span className="font-medium text-primary">
                                                {group.records.length}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-base-content/60">Total Students:</span>
                                            <span className="font-medium text-secondary">
                                                {totalStudents}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs mt-2 pt-2 border-t border-base-200">
                                            <span className="text-base-content/60">Subjects:</span>
                                            <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                                                {group.records.slice(0, 3).map((record) => (
                                                    <span
                                                        key={record.id}
                                                        className="badge badge-xs badge-outline text-[9px]"
                                                    >
                                                        {record.subjectName.split(' ').slice(0, 2).join(' ')}
                                                    </span>
                                                ))}
                                                {group.records.length > 3 && (
                                                    <span className="badge badge-xs badge-outline text-[9px]">
                                                        +{group.records.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Section Class Schedule Modal */}
            {selectedSectionName && (
                <SectionClassScheduleModal
                    open={showSectionModal}
                    onClose={handleCloseSectionModal}
                    sectionName={selectedSectionName}
                    classSchedules={
                        groupedBySection.find(
                            (g) => g.sectionName === selectedSectionName
                        )?.records || []
                    }
                    onDelete={handleDeleteClass}
                />
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
                                {/* Teacher Selection */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">
                                            Teacher *
                                        </span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={selectedTeacherId}
                                        onChange={(e) =>
                                            setSelectedTeacherId(e.target.value)
                                        }
                                        required
                                    >
                                        <option value="">Select Teacher</option>
                                        {teachers.map((teacher) => (
                                            <option
                                                key={teacher.employeeId}
                                                value={teacher.employeeId}
                                            >
                                                {teacher.lastName}, {teacher.firstName} {teacher.middleName ? `${teacher.middleName.charAt(0)}.` : ""} ({teacher.employeeId})
                                            </option>
                                        ))}
                                    </select>
                                </div>

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
                                    <input
                                        type="text"
                                        className="input input-bordered w-full"
                                        value={formData.schoolYear || getDefaultSchoolYear()}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                schoolYear: e.target.value,
                                            }))
                                        }
                                        disabled
                                        required
                                    />
                                    <label className="label">
                                        <span className="label-text-alt text-gray-500">
                                            Automatically set to current school year
                                        </span>
                                    </label>
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
