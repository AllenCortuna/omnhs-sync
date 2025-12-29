"use client";
import React, { useState, useEffect, useMemo } from "react";
import { subjectRecordService } from "@/services/subjectRecordService";
import { strandService } from "@/services/strandService";
import { sectionService } from "@/services/sectionService";
import { teacherService } from "@/services/teacherService";
import { subjectService } from "@/services/subjectService";
import { errorToast, successToast } from "@/config/toast";
import type { SubjectRecord, Strand, Section, Subject } from "@/interface/info";
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
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedStrandId, setSelectedStrandId] = useState<string>("");
    const [selectedSectionId, setSelectedSectionId] = useState<string>("");
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
    const [selectedSectionName, setSelectedSectionName] = useState<string>("");
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [startTime, setStartTime] = useState<string>("");
    const [endTime, setEndTime] = useState<string>("");

    // Form state
    const [formData, setFormData] = useState({
        sectionId: "",
        sectionName: "",
        subjectId: "",
        subjectName: "",
        gradeLevel: "",
        semester: "",
        days: [] as string[],
        timeSlot: "",
        schoolYear: getDefaultSchoolYear(),
        teacherId: "",
        teacherName: "",
    });

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [strandsData, teachersData, subjectsData] = await Promise.all([
                    strandService.getAllStrands(),
                    teacherService.getAllTeachers(),
                    subjectService.getAllSubjects(),
                ]);
                setStrands(strandsData);
                setTeachers(teachersData);
                setSubjects(subjectsData);
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

    // Filter subjects by selected strand
    const filteredSubjects = useMemo(() => {
        if (!selectedStrandId) {
            return [];
        }
        return subjects.filter(subject => {
            // Handle both array and legacy string format
            if (Array.isArray(subject.strandId)) {
                return subject.strandId.includes(selectedStrandId);
            }
            // Legacy support: if strandId is a string, check for equality
            return subject.strandId === selectedStrandId;
        });
    }, [subjects, selectedStrandId]);

    // Clear subject selection when strand changes
    useEffect(() => {
        if (!selectedStrandId) {
            setFormData((prev) => ({
                ...prev,
                subjectId: "",
                subjectName: "",
            }));
        }
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
            !formData.teacherId ||
            !startTime ||
            !endTime ||
            formData.days.length === 0
        ) {
            errorToast("Please fill in all required fields including at least one day");
            return;
        }

        // Validate time range
        if (startTime >= endTime) {
            errorToast("End time must be after start time");
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
                record.semester === formDataWithSchoolYear.semester &&
                record.subjectId === formDataWithSchoolYear.subjectId
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
            days: [],
            timeSlot: "",
            schoolYear: getDefaultSchoolYear(),
            teacherId: "",
            teacherName: "",
        });
        setStartTime("");
        setEndTime("");
        setSelectedStrandId("");
        setSelectedSectionId("");
        setSelectedTeacherId("");
    };

    // Parse timeSlot into start and end times when modal opens or form data changes
    useEffect(() => {
        if (showAddModal && formData.timeSlot) {
            const parts = formData.timeSlot.split(" - ");
            if (parts.length === 2) {
                setStartTime(parts[0].trim());
                setEndTime(parts[1].trim());
            } else {
                setStartTime("");
                setEndTime("");
            }
        } else if (showAddModal && !formData.timeSlot) {
            setStartTime("");
            setEndTime("");
        }
    }, [showAddModal, formData.timeSlot]);

    // Update timeSlot when startTime or endTime changes
    useEffect(() => {
        if (startTime && endTime) {
            setFormData((prev) => ({
                ...prev,
                timeSlot: `${startTime} - ${endTime}`,
            }));
        } else if (!startTime && !endTime) {
            setFormData((prev) => ({
                ...prev,
                timeSlot: "",
            }));
        }
    }, [startTime, endTime]);

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
                                        value={formData.subjectId}
                                        onChange={(e) => {
                                            const selectedSubject = filteredSubjects.find(
                                                s => s.id === e.target.value
                                            );
                                            setFormData((prev) => ({
                                                ...prev,
                                                subjectId: e.target.value,
                                                subjectName: selectedSubject?.subjectName || "",
                                            }));
                                        }}
                                        required
                                        disabled={!selectedStrandId || filteredSubjects.length === 0}
                                    >
                                        <option value="">
                                            {!selectedStrandId 
                                                ? "Select Strand First" 
                                                : filteredSubjects.length === 0
                                                ? "No Subjects Available"
                                                : "Select Subject"}
                                        </option>
                                        {filteredSubjects.map((subject) => (
                                            <option
                                                key={subject.id}
                                                value={subject.id}
                                            >
                                                {subject.subjectName}
                                            </option>
                                        ))}
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

                                {/* Days Selection */}
                                <div className="form-control md:col-span-2">
                                    <label className="label">
                                        <span className="label-text">
                                            Days * (Select at least one day)
                                        </span>
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                                        {[
                                            "Monday",
                                            "Tuesday",
                                            "Wednesday",
                                            "Thursday",
                                            "Friday",
                                            "Saturday",
                                            "Sunday",
                                        ].map((day) => (
                                            <label
                                                key={day}
                                                className="label cursor-pointer justify-start gap-2 p-3 border border-base-300 rounded-lg hover:bg-base-200 transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-primary checkbox-sm"
                                                    checked={formData.days.includes(day)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                days: [...prev.days, day],
                                                            }));
                                                        } else {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                days: prev.days.filter(
                                                                    (d) => d !== day
                                                                ),
                                                            }));
                                                        }
                                                    }}
                                                />
                                                <span className="label-text text-sm">
                                                    {day.substring(0, 3)}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    {formData.days.length > 0 && (
                                        <label className="label">
                                            <span className="label-text-alt text-primary">
                                                Selected: {formData.days.join(", ")}
                                            </span>
                                        </label>
                                    )}
                                </div>

                                {/* Time Slot */}
                                <div className="form-control md:col-span-2">
                                    <label className="label">
                                        <span className="label-text">
                                            Time Slot * (Time Range)
                                        </span>
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <label className="label py-1">
                                                <span className="label-text-alt text-base-content/60">
                                                    Start Time
                                                </span>
                                            </label>
                                            <input
                                                type="time"
                                                className="input input-bordered w-full"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="flex items-center pt-6">
                                            <span className="text-base-content/60 font-medium">-</span>
                                        </div>
                                        <div className="flex-1">
                                            <label className="label py-1">
                                                <span className="label-text-alt text-base-content/60">
                                                    End Time
                                                </span>
                                            </label>
                                            <input
                                                type="time"
                                                className="input input-bordered w-full"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    {startTime && endTime && (
                                        <label className="label">
                                            <span className="label-text-alt text-primary">
                                                {startTime} - {endTime}
                                            </span>
                                        </label>
                                    )}
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
