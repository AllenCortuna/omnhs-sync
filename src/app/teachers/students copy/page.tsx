"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSaveUserData } from "@/hooks";
import { subjectRecordService } from "@/services/subjectRecordService";
import { errorToast } from "@/config/toast";
import type { SubjectRecord } from "@/interface/info";
import type { Teacher, Student } from "@/interface/user";
import { LoadingOverlay } from "@/components/common";
import {
    HiUser,
    HiPencil,
} from "react-icons/hi";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../../../../firebase";
import Link from "next/link";

interface StudentWithClasses {
    student: Student;
    enrolledClasses: {
        subjectRecordId: string;
        subjectName: string;
        sectionName: string;
        gradeLevel: string;
        semester: string;
        schoolYear: string;
        grades?: {
            firstQuarterGrade: number;
            secondQuarterGrade: number;
            finalGrade: number;
            rating: string;
        };
    }[];
}

const StudentsPage: React.FC = () => {
    const { userData, isLoading: userLoading } = useSaveUserData({
        role: "teacher",
    });
    
    const [subjectRecords, setSubjectRecords] = useState<SubjectRecord[]>([]);
    const [studentsWithClasses, setStudentsWithClasses] = useState<StudentWithClasses[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch teacher's subject records and student data
    useEffect(() => {
        const fetchData = async () => {
            if (!userData || userLoading) return;

            if (!("employeeId" in userData)) {
                errorToast("User data is not a teacher");
                return;
            }

            try {
                setLoading(true);
                const teacherData = userData as Teacher;
                
                // Fetch all subject records for the current teacher
                const records = await subjectRecordService.getSubjectRecordsByTeacher(
                    teacherData.employeeId
                );
                
                setSubjectRecords(records);

                // Collect all unique student IDs from all classes
                const allStudentIds = new Set<string>();
                records.forEach((record) => {
                    if (record.studentList && Array.isArray(record.studentList)) {
                        record.studentList.forEach((studentId) => {
                            allStudentIds.add(studentId);
                        });
                    }
                });

                // Fetch all student documents
                const studentsData: Student[] = [];
                if (allStudentIds.size > 0) {
                    const studentsQuery = query(
                        collection(db, "students"),
                        where("studentId", "in", Array.from(allStudentIds)),
                        orderBy("lastName", "asc")
                    );
                    
                    const studentsSnapshot = await getDocs(studentsQuery);
                    studentsSnapshot.forEach((doc) => {
                        studentsData.push({ id: doc.id, ...doc.data() } as Student);
                    });
                }

                // Create a map of student IDs to their enrolled classes
                const studentClassMap = new Map<string, StudentWithClasses>();

                // Initialize student entries with actual student data
                studentsData.forEach((student) => {
                    studentClassMap.set(student.studentId, {
                        student: student,
                        enrolledClasses: []
                    });
                });

                // Add class information to each student
                records.forEach((record) => {
                    if (record.studentList && Array.isArray(record.studentList)) {
                        record.studentList.forEach((studentId) => {
                            const studentEntry = studentClassMap.get(studentId);
                            if (studentEntry) {
                                // Find grades for this student in this subject
                                const studentGrade = record.studentGrades?.find(g => g.studentId === studentId);
                                
                                studentEntry.enrolledClasses.push({
                                    subjectRecordId: record.id,
                                    subjectName: record.subjectName,
                                    sectionName: record.sectionName,
                                    gradeLevel: record.gradeLevel,
                                    semester: record.semester,
                                    schoolYear: record.schoolYear,
                                    grades: studentGrade ? {
                                        firstQuarterGrade: studentGrade.firstQuarterGrade,
                                        secondQuarterGrade: studentGrade.secondQuarterGrade,
                                        finalGrade: studentGrade.finalGrade,
                                        rating: studentGrade.rating || ""
                                    } : undefined
                                });
                            }
                        });
                    }
                });

                // Convert map to array and sort by student name
                const studentsArray = Array.from(studentClassMap.values());
                studentsArray.sort((a, b) => {
                    const nameA = `${a.student.lastName || ""} ${a.student.firstName || ""}`.toLowerCase();
                    const nameB = `${b.student.lastName || ""} ${b.student.firstName || ""}`.toLowerCase();
                    return nameA.localeCompare(nameB);
                });

                setStudentsWithClasses(studentsArray);
            } catch (error) {
                console.error("Error fetching data:", error);
                errorToast("Failed to load student data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userData, userLoading]);

    // Filter students based on search term
    const filteredStudents = useMemo(() => {
        if (!searchTerm.trim()) return studentsWithClasses;
        
        const searchLower = searchTerm.toLowerCase();
        return studentsWithClasses.filter(studentWithClass => {
            const student = studentWithClass.student;
            const fullName = `${student.firstName || ""} ${student.lastName || ""}`.toLowerCase();
            const studentId = student.studentId.toLowerCase();
            const subjectNames = studentWithClass.enrolledClasses
                .map(cls => cls.subjectName.toLowerCase())
                .join(" ");
            const sectionNames = studentWithClass.enrolledClasses
                .map(cls => cls.sectionName.toLowerCase())
                .join(" ");
            
            return fullName.includes(searchLower) || 
                   studentId.includes(searchTerm) ||
                   subjectNames.includes(searchLower) ||
                   sectionNames.includes(searchLower);
        });
    }, [studentsWithClasses, searchTerm]);

    const getStudentDisplayName = (student: Student) => {
        return `${student.lastName || ""}, ${student.firstName || ""}${student.middleName ? ` ${student.middleName.charAt(0)}.` : ""}`.trim();
    };

    if (userLoading || loading) {
        return <LoadingOverlay />;
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="mb-6">
                <h1 className="text-lg font-bold text-primary martian-mono">
                    My Students
                </h1>
                <p className="text-gray-500 text-xs italic">
                    View all students enrolled in your classes
                </p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="form-control">
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Search students, subjects, or sections..."
                            className="input input-bordered rounded-none text-xs martian-mono text-zinc-600 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <div className="stats shadow mb-3 text-xs martian-mono">
                <div className="stat">
                    <div className="stat-title text-xs martian-mono">Total Students</div>
                    <div className="stat-value text-primary">{studentsWithClasses.length}</div>
                </div>
                
                <div className="stat">
                    <div className="stat-title text-xs martian-mono">Total Classes</div>
                    <div className="stat-value text-secondary">{subjectRecords.length}</div>
                </div>
                
                <div className="stat">
                    <div className="stat-title text-xs martian-mono">Students with Grades</div>
                    <div className="stat-value text-success">
                        {studentsWithClasses.filter(student => 
                            student.enrolledClasses.some(cls => cls.grades)
                        ).length}
                    </div>
                </div>
                
                <div className="stat">
                    <div className="stat-title text-xs martian-mono">Students with Honors</div>
                    <div className="stat-value text-warning">
                        {studentsWithClasses.filter(student => 
                            student.enrolledClasses.some(cls => 
                                cls.grades?.rating && cls.grades.rating.includes("Honors")
                            )
                        ).length}
                    </div>
                </div>
            </div>

            {/* Students List */}
            {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                    <HiUser className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        {searchTerm ? "No students found" : "No students enrolled"}
                    </h3>
                    <p className="text-gray-500">
                        {searchTerm 
                            ? "Try adjusting your search terms" 
                            : "Students will appear here once they are enrolled in your classes"
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-0">
                    {filteredStudents.map((studentWithClass) => (
                        <div
                            key={studentWithClass.student.studentId}
                            className="card bg-white shadow rounded-none hover:shadow-md transition-shadow"
                        >
                            <div className="card-body">
                                {/* Student Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="avatar placeholder">
                                            <div className="bg-primary text-primary-content rounded-full w-12">
                                                <span className="text-lg font-bold">
                                                    {studentWithClass.student.lastName?.charAt(0) || "S"}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-primary">
                                                {getStudentDisplayName(studentWithClass.student)}
                                            </h3>
                                            <p className="text-xs italic text-zinc-500">
                                                {studentWithClass.student.studentId}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right">
                                        <div className="badge badge-primary text-[10px] martian-mono text-white p-3">
                                            {studentWithClass.enrolledClasses.length} Classes
                                        </div>
                                    </div>
                                </div>

                                {/* Enrolled Classes */}
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {studentWithClass.enrolledClasses.map((cls, index) => (
                                            <div
                                                key={`${cls.subjectRecordId}-${index}`}
                                                className="bg-gray-50 p-3 shadow rounded-none"
                                            >
                                                <div className="font-bold text-xs martian-mono text-primary mb-1">
                                                    {cls.subjectName}
                                                </div>
                                                <div className="text-xs italic font-semibold text-zinc-500 space-y-1">
                                                    <div className="flex items-center gap-1">
                                                        <span>{cls.sectionName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span>{cls.gradeLevel} - {cls.semester}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span>{cls.schoolYear}</span>
                                                    </div>
                                                </div>
                                                
                                                {/* Grades Section */}
                                                {cls.grades && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                                        <div className="text-xs font-semibold text-primary mb-2 martian-mono">
                                                            Grades
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div>
                                                                <span className="text-gray-600">1st Quarter:</span>
                                                                <span className={`ml-1 font-bold martian-mono ${cls.grades.firstQuarterGrade >= 75 ? 'text-success' : 'text-error'}`}>
                                                                    {cls.grades.firstQuarterGrade || "—"}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">2nd Quarter:</span>
                                                                <span className={`ml-1 font-bold martian-mono ${cls.grades.secondQuarterGrade >= 75 ? 'text-success' : 'text-error'}`}>
                                                                    {cls.grades.secondQuarterGrade || "—"}
                                                                </span>
                                                            </div>
                                                            <div className="col-span-2">
                                                                <span className="text-gray-600">Final Grade:</span>
                                                                <span className={`ml-1 font-bold martian-mono ${cls.grades.finalGrade >= 75 ? 'text-success' : 'text-error'}`}>
                                                                    {cls.grades.finalGrade || "—"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Rating */}
                                                        {cls.grades.rating && (
                                                            <div className="mt-2 pt-2 border-t border-gray-200">
                                                                <div className="text-xs">
                                                                    <span className="text-gray-600">Rating:</span>
                                                                    <span className="ml-1 font-bold text-primary martian-mono text-xs">
                                                                        {cls.grades.rating}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {/* No Grades Message */}
                                                {!cls.grades && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                                        <div className="text-xs text-gray-500 italic">
                                                            No grades recorded yet
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Edit Grades Button */}
                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                    <Link
                                                        href={`/teachers/class-schedule/student-grade?subjectRecordId=${cls.subjectRecordId}`}
                                                        className="btn btn-xs btn-primary gap-1 text-white rounded-none"
                                                    >
                                                        <HiPencil className="w-3 h-3" />
                                                        {cls.grades ? 'Edit Grades' : 'Input Grades'}
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentsPage;
