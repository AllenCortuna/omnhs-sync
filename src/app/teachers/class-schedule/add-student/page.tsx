"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../../../../../firebase";
import { subjectRecordService } from "@/services/subjectRecordService";
import { errorToast, successToast } from "@/config/toast";
import type { SubjectRecord } from "@/interface/info";
import type { Student } from "@/interface/user";
import { LoadingOverlay, BackButton } from "@/components/common";
import {
    HiAcademicCap,
    HiCalendar,
    HiDocumentText,
    HiPlus,
    HiMinus,
    HiSearch,
    HiUser,
    HiUserGroup,
    HiX,
} from "react-icons/hi";

const AddStudentToClass: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const subjectRecordId = searchParams.get("subjectRecordId");

    const [subjectRecord, setSubjectRecord] = useState<SubjectRecord | null>(null);
    const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
    const [addedStudents, setAddedStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [studentToRemove, setStudentToRemove] = useState<Student | null>(null);

    // Fetch subject record and students
    useEffect(() => {
        const fetchData = async () => {
            if (!subjectRecordId) {
                errorToast("Subject record ID is required");
                router.push("/teachers/class-schedule");
                return;
            }

            try {
                setLoading(true);
                
                // Fetch subject record
                const record = await subjectRecordService.getSubjectRecordById(subjectRecordId);
                if (!record) {
                    errorToast("Subject record not found");
                    router.push("/teachers/class-schedule");
                    return;
                }
                setSubjectRecord(record);

                // Fetch all students enrolled for the same school year and semester
                const studentsQuery = query(
                    collection(db, "students"),
                    where("enrolledForSchoolYear", "==", record.schoolYear),
                    where("enrolledForSemester", "==", record.semester),
                    orderBy("lastName", "asc")
                );
                
                const studentsSnapshot = await getDocs(studentsQuery);
                const students: Student[] = [];
                const alreadyAdded: Student[] = [];

                studentsSnapshot.forEach((doc) => {
                    const student = { id: doc.id, ...doc.data() } as Student;
                    
                    // Check if student is already in the class
                    if (record.studentList.includes(student.studentId)) {
                        alreadyAdded.push(student);
                    } else {
                        students.push(student);
                    }
                });

                setAvailableStudents(students);
                setAddedStudents(alreadyAdded);
            } catch (error) {
                console.error("Error fetching data:", error);
                errorToast("Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [subjectRecordId, router]);

    // Filter students based on search term
    const filteredAvailableStudents = useMemo(() => {
        if (!searchTerm.trim()) return availableStudents;
        
        const searchLower = searchTerm.toLowerCase();
        return availableStudents.filter(student => {
            const fullName = `${student.firstName || ""} ${student.lastName || ""}`.toLowerCase();
            const studentId = student.studentId.toLowerCase();
            return fullName.includes(searchLower) || studentId.includes(searchLower);
        });
    }, [availableStudents, searchTerm]);

    const handleAddStudent = async (student: Student) => {
        if (!subjectRecord) return;

        try {
            setIsUpdating(true);
            
            // Update the subject record with the new student
            const updatedStudentList = [...subjectRecord.studentList, student.studentId];
            
            await subjectRecordService.updateSubjectRecord(subjectRecord.id, {
                studentList: updatedStudentList
            });

            // Update local state
            setSubjectRecord(prev => prev ? {
                ...prev,
                studentList: updatedStudentList
            } : null);
            
            setAvailableStudents(prev => prev.filter(s => s.studentId !== student.studentId));
            setAddedStudents(prev => [...prev, student]);
            
            successToast(`${student.firstName} ${student.lastName} added to class`);
        } catch (error) {
            console.error("Error adding student:", error);
            errorToast("Failed to add student");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemoveStudentClick = (student: Student) => {
        setStudentToRemove(student);
        setShowRemoveModal(true);
    };

    const handleConfirmRemove = async () => {
        if (!subjectRecord || !studentToRemove) return;

        try {
            setIsUpdating(true);
            
            // Update the subject record by removing the student
            const updatedStudentList = subjectRecord.studentList.filter(id => id !== studentToRemove.studentId);
            
            await subjectRecordService.updateSubjectRecord(subjectRecord.id, {
                studentList: updatedStudentList
            });

            // Update local state
            setSubjectRecord(prev => prev ? {
                ...prev,
                studentList: updatedStudentList
            } : null);
            
            setAddedStudents(prev => prev.filter(s => s.studentId !== studentToRemove.studentId));
            setAvailableStudents(prev => [...prev, studentToRemove].sort((a, b) => 
                (a.lastName || "").localeCompare(b.lastName || "")
            ));
            
            successToast(`${studentToRemove.firstName} ${studentToRemove.lastName} removed from class`);
            setShowRemoveModal(false);
            setStudentToRemove(null);
        } catch (error) {
            console.error("Error removing student:", error);
            errorToast("Failed to remove student");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancelRemove = () => {
        setShowRemoveModal(false);
        setStudentToRemove(null);
    };

    const getStudentDisplayName = (student: Student) => {
        return `${student.lastName || ""}, ${student.firstName || ""}${student.middleName ? ` ${student.middleName.charAt(0)}.` : ""}`.trim();
    };

    if (loading) {
        return <LoadingOverlay />;
    }

    if (!subjectRecord) {
        return (
            <div className="max-w-4xl mx-auto p-4">
                <div className="text-center py-12">
                    <HiX className="w-16 h-16 text-error mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        Subject Record Not Found
                    </h3>
                    <p className="text-gray-500 mb-6">
                        The requested class could not be found.
                    </p>
                    <BackButton />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="mb-6">
                <BackButton />
                <div className="mt-4">
                    <h1 className="text-xl font-bold text-primary mb-2">
                        Manage Class Students
                    </h1>
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <HiAcademicCap className="w-5 h-5 text-primary" />
                            <h2 className="font-semibold text-lg">{subjectRecord.subjectName}</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <HiUserGroup className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">{subjectRecord.sectionName}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <HiCalendar className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">
                                    {subjectRecord.gradeLevel} - {subjectRecord.semester} Semester
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <HiDocumentText className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">{subjectRecord.schoolYear}</span>
                            </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2">
                                <HiUserGroup className="w-4 h-4 text-primary" />
                                <span className="font-medium text-sm">
                                    {subjectRecord.studentList.length} students enrolled
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Available Students */}
                <div className="card bg-white shadow-md">
                    <div className="card-body">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="card-title text-lg">
                                <HiUser className="w-5 h-5" />
                                Available Students
                                <div className="badge badge-primary">{filteredAvailableStudents.length}</div>
                            </h3>
                        </div>

                        {/* Search */}
                        <div className="form-control mb-4">
                            <div className="input-group">
                                <span>
                                    <HiSearch className="w-4 h-4" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search students..."
                                    className="input input-bordered w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Student List */}
                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {filteredAvailableStudents.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <HiUser className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>
                                        {searchTerm ? "No students found matching search" : "No available students"}
                                    </p>
                                </div>
                            ) : (
                                filteredAvailableStudents.map((student) => (
                                    <div
                                        key={student.studentId}
                                        className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                                    >
                                        <div>
                                            <div className="font-medium text-sm">
                                                {getStudentDisplayName(student)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                ID: {student.studentId}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAddStudent(student)}
                                            disabled={isUpdating}
                                            className="btn btn-sm btn-primary"
                                        >
                                            <HiPlus className="w-4 h-4" />
                                            Add
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Enrolled Students */}
                <div className="card bg-white shadow-md">
                    <div className="card-body">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="card-title text-lg">
                                <HiUserGroup className="w-5 h-5" />
                                Enrolled in Class
                                <div className="badge badge-success">{addedStudents.length}</div>
                            </h3>
                        </div>

                        {/* Student List */}
                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {addedStudents.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <HiUserGroup className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No students enrolled in this class</p>
                                </div>
                            ) : (
                                addedStudents.map((student) => (
                                    <div
                                        key={student.studentId}
                                        className="flex items-center justify-between p-3 border rounded bg-green-50 border-green-200"
                                    >
                                        <div>
                                            <div className="font-medium text-sm">
                                                {getStudentDisplayName(student)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                ID: {student.studentId}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveStudentClick(student)}
                                            disabled={isUpdating}
                                            className="btn btn-xs text-error btn-outline rounded-none"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Remove Student Confirmation Modal */}
            {showRemoveModal && studentToRemove && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-primary martian-mono mb-4">Confirm Student Removal</h3>
                        <p className="mb-6 text-xs text-gray-500">
                            Are you sure you want to remove{" "}
                            <span className="font-semibold text-primary">
                                {getStudentDisplayName(studentToRemove)}
                            </span>{" "}
                            from this class?
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-6">
                            <HiUser className="w-4 h-4" />
                            <span>Student ID: {studentToRemove.studentId}</span>
                        </div>
                        <div className="modal-action">
                            <button
                                type="button"
                                className="btn btn-ghost text-gray-500"
                                onClick={handleCancelRemove}
                                disabled={isUpdating}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-error text-white"
                                onClick={handleConfirmRemove}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Removing...
                                    </>
                                ) : (
                                    <>
                                        <HiMinus className="w-4 h-4" />
                                        Remove Student
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading Overlay for Updates */}
            {isUpdating && !showRemoveModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 flex items-center gap-3">
                        <span className="loading loading-spinner loading-md"></span>
                        <span>Updating class roster...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddStudentToClass;