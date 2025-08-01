"use client";
import React, { useState, useEffect } from "react";
import { useSaveUserData } from "@/hooks";
import { subjectRecordService } from "@/services/subjectRecordService";
import { strandService } from "@/services/strandService";
import { sectionService } from "@/services/sectionService";
import { subjectService } from "@/services/subjectService";
import { errorToast, successToast } from "@/config/toast";
import type { SubjectRecord, Strand, Section, Subject } from "@/interface/info";
import type { Teacher } from "@/interface/user";
import { LoadingOverlay } from "@/components/common";
import { 
    HiAcademicCap, 
    HiCalendar, 
    HiDocumentText, 
    HiPlus,
    HiEye,
    HiPencil,
    HiTrash,
    HiUserGroup,
    HiClock,
} from "react-icons/hi";
import { formatDate } from "@/config/format";


const ClassSchedule: React.FC = () => {
    const { userData, isLoading: userLoading } = useSaveUserData({
        role: "teacher",
    });
    const [subjectRecords, setSubjectRecords] = useState<SubjectRecord[]>([]);
    const [strands, setStrands] = useState<Strand[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedStrandId, setSelectedStrandId] = useState<string>("");
    const [selectedSectionId, setSelectedSectionId] = useState<string>("");
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

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
        teacherName: ""
    });

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [strandsData] = await Promise.all([
                    strandService.getAllStrands()
                ]);
                setStrands(strandsData);
            } catch (error) {
                console.error('Error fetching initial data:', error);
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
            
            if (!("teacherId" in userData)) {
                errorToast("User data is not a teacher");
                return;
            }

            try {
                setLoading(true);
                const teacherData = userData as Teacher;
                const records = await subjectRecordService.getSubjectRecordsByTeacher(teacherData.employeeId);
                setSubjectRecords(records);
            } catch (error) {
                console.error('Error fetching subject records:', error);
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
                const sectionsData = await sectionService.getSectionsByStrandId(selectedStrandId);
                setSections(sectionsData);
            } catch (error) {
                console.error('Error fetching sections:', error);
                setSections([]);
            }
        };

        fetchSections();
    }, [selectedStrandId]);

    // Fetch subjects when strand changes
    useEffect(() => {
        const fetchSubjects = async () => {
            if (!selectedStrandId) {
                setSubjects([]);
                return;
            }

            try {
                const subjectsData = await subjectService.getSubjectsByStrandId(selectedStrandId);
                setSubjects(subjectsData);
            } catch (error) {
                console.error('Error fetching subjects:', error);
                setSubjects([]);
            }
        };

        fetchSubjects();
    }, [selectedStrandId]);

    // Update form data when selections change
    useEffect(() => {
        if (selectedSectionId) {
            const section = sections.find(s => s.id === selectedSectionId);
            setFormData(prev => ({
                ...prev,
                sectionId: selectedSectionId,
                sectionName: section?.sectionName || ""
            }));
        }
    }, [selectedSectionId, sections]);

    useEffect(() => {
        if (selectedSubjectId) {
            const subject = subjects.find(s => s.id === selectedSubjectId);
            setFormData(prev => ({
                ...prev,
                subjectId: selectedSubjectId,
                subjectName: subject?.subjectName || ""
            }));
        }
    }, [selectedSubjectId, subjects]);

    const handleAddClass = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!userData || !("employeeId" in userData)) {
            errorToast("User data is not a teacher");
            return;
        }

        // Validate required fields
        if (!formData.sectionId || !formData.subjectId || !formData.gradeLevel || 
            !formData.semester || !formData.schoolYear) {
            errorToast("Please fill in all required fields");
            return;
        }

        try {
            setLoading(true);
            const teacherData = userData as Teacher;
            
            const newSubjectRecord = await subjectRecordService.createSubjectRecord({
                ...formData,
                teacherId: teacherData.employeeId,
                teacherName: teacherData.firstName + " " + teacherData.lastName
            });

            setSubjectRecords(prev => [newSubjectRecord, ...prev]);
            successToast("Class added successfully!");
            setShowAddModal(false);
            resetForm();
        } catch (error) {
            console.error('Error adding class:', error);
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
            teacherName: ""
        });
        setSelectedStrandId("");
        setSelectedSectionId("");
        setSelectedSubjectId("");
    };

    const handleDeleteClass = async (recordId: string) => {
        if (!confirm("Are you sure you want to delete this class?")) {
            return;
        }

        try {
            setLoading(true);
            await subjectRecordService.deleteSubjectRecord(recordId);
            setSubjectRecords(prev => prev.filter(record => record.id !== recordId));
            successToast("Class deleted successfully!");
        } catch (error) {
            console.error('Error deleting class:', error);
            errorToast("Failed to delete class. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (studentCount: number) => {
        if (studentCount === 0) {
            return (
                <div className="badge badge-warning gap-1 text-white">
                    <HiClock className="w-3 h-3" />
                    No Students
                </div>
            );
        }
        return (
            <div className="badge badge-success gap-1 text-white">
                <HiUserGroup className="w-3 h-3" />
                {studentCount} Students
            </div>
        );
    };

    if (userLoading || loading) {
        return <LoadingOverlay />;
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Class Schedule</h1>
                    <p className="text-gray-600 mt-1">
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
                        You haven&apos;t been assigned any classes yet. Add your first class to get started.
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
                <div className="grid gap-4">
                    {subjectRecords.map((record) => (
                        <div
                            key={record.id}
                            className="card bg-white shadow-md hover:shadow-lg transition-shadow"
                        >
                            <div className="card-body">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                {record.subjectName}
                                            </h3>
                                            {getStatusBadge(record.studentList?.length || 0)}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <HiAcademicCap className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-600">
                                                    {record.sectionName}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <HiCalendar className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-600">
                                                    {record.gradeLevel} Level
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <HiCalendar className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-600">
                                                    {record.semester} Semester
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <HiDocumentText className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-600">
                                                    {record.schoolYear}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 text-xs">
                                                    {formatDate(record.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2">
                                        <button
                                            className="btn btn-sm btn-outline btn-primary"
                                            title="View class details"
                                        >
                                            <HiEye className="w-4 h-4" />
                                            View
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline btn-secondary"
                                            title="Edit class"
                                        >
                                            <HiPencil className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClass(record.id)}
                                            className="btn btn-sm btn-outline btn-error"
                                            title="Delete class"
                                        >
                                            <HiTrash className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Class Modal */}
            {showAddModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-2xl">
                        <h3 className="font-bold text-lg mb-4">Add New Class</h3>
                        <form onSubmit={handleAddClass}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Strand Selection */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Strand *</span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={selectedStrandId}
                                        onChange={(e) => setSelectedStrandId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Strand</option>
                                        {strands.map((strand) => (
                                            <option key={strand.id} value={strand.id}>
                                                {strand.strandName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Section Selection */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Section *</span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={selectedSectionId}
                                        onChange={(e) => setSelectedSectionId(e.target.value)}
                                        required
                                        disabled={!selectedStrandId}
                                    >
                                        <option value="">Select Section</option>
                                        {sections.map((section) => (
                                            <option key={section.id} value={section.id}>
                                                {section.sectionName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Subject Selection */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Subject *</span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={selectedSubjectId}
                                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                                        required
                                        disabled={!selectedStrandId}
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects.map((subject) => (
                                            <option key={subject.id} value={subject.id}>
                                                {subject.subjectName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Grade Level */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Grade Level *</span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={formData.gradeLevel}
                                        onChange={(e) => setFormData(prev => ({ ...prev, gradeLevel: e.target.value }))}
                                        required
                                    >
                                        <option value="">Select Grade Level</option>
                                        <option value="Grade 11">Grade 11</option>
                                        <option value="Grade 12">Grade 12</option>
                                    </select>
                                </div>

                                {/* Semester */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Semester *</span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={formData.semester}
                                        onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                                        required
                                    >
                                        <option value="">Select Semester</option>
                                        <option value="First">First Semester</option>
                                        <option value="Second">Second Semester</option>
                                    </select>
                                </div>

                                {/* School Year */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">School Year *</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., 2024-2025"
                                        className="input input-bordered w-full"
                                        value={formData.schoolYear}
                                        onChange={(e) => setFormData(prev => ({ ...prev, schoolYear: e.target.value }))}
                                        required
                                    />
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