"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSaveUserData } from "@/hooks";
import { subjectRecordService } from "@/services/subjectRecordService";
import { errorToast } from "@/config/toast";
import type { Teacher, Student } from "@/interface/user";
import { LoadingOverlay } from "@/components/common";
import {
    HiPencil,
    HiX,
    HiAcademicCap,
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

interface GroupedClass {
    subjectName: string;
    sectionName: string;
    gradeLevel: string;
    semester: string;
    schoolYear: string;
    subjectRecordId: string;
    students: {
        student: Student;
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
    
    const [studentsWithClasses, setStudentsWithClasses] = useState<StudentWithClasses[]>([]);
    const [groupedClasses, setGroupedClasses] = useState<GroupedClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedClass, setSelectedClass] = useState<GroupedClass | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

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

                // Group students by subject and section
                const groupedMap = new Map<string, GroupedClass>();
                
                records.forEach((record) => {
                    const key = `${record.subjectName}-${record.sectionName}`;
                    
                    if (!groupedMap.has(key)) {
                        groupedMap.set(key, {
                            subjectName: record.subjectName,
                            sectionName: record.sectionName,
                            gradeLevel: record.gradeLevel,
                            semester: record.semester,
                            schoolYear: record.schoolYear,
                            subjectRecordId: record.id,
                            students: []
                        });
                    }
                    
                    const group = groupedMap.get(key)!;
                    
                    // Add students from this record
                    if (record.studentList && Array.isArray(record.studentList)) {
                        record.studentList.forEach((studentId) => {
                            const student = studentsData.find(s => s.studentId === studentId);
                            if (student) {
                                const studentGrade = record.studentGrades?.find(g => g.studentId === studentId);
                                
                                group.students.push({
                                    student: student,
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
                
                // Convert map to array and sort
                const groupedArray = Array.from(groupedMap.values());
                groupedArray.sort((a, b) => {
                    const nameA = `${a.subjectName} ${a.sectionName}`.toLowerCase();
                    const nameB = `${b.subjectName} ${b.sectionName}`.toLowerCase();
                    return nameA.localeCompare(nameB);
                });
                
                // Sort students within each group
                groupedArray.forEach(group => {
                    group.students.sort((a, b) => {
                        const nameA = `${a.student.lastName || ""} ${a.student.firstName || ""}`.toLowerCase();
                        const nameB = `${b.student.lastName || ""} ${b.student.firstName || ""}`.toLowerCase();
                        return nameA.localeCompare(nameB);
                    });
                });
                
                setGroupedClasses(groupedArray);
            } catch (error) {
                console.error("Error fetching data:", error);
                errorToast("Failed to load student data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userData, userLoading]);

    // Filter grouped classes based on search term
    const filteredClasses = useMemo(() => {
        if (!searchTerm.trim()) return groupedClasses;
        
        const searchLower = searchTerm.toLowerCase();
        return groupedClasses.filter(group => {
            return group.subjectName.toLowerCase().includes(searchLower) ||
                   group.sectionName.toLowerCase().includes(searchLower) ||
                   group.gradeLevel.toLowerCase().includes(searchLower) ||
                   group.semester.toLowerCase().includes(searchLower);
        });
    }, [groupedClasses, searchTerm]);

    const getStudentDisplayName = (student: Student) => {
        return `${student.lastName || ""}, ${student.firstName || ""}${student.middleName ? ` ${student.middleName.charAt(0)}.` : ""}`.trim();
    };

    const handleClassClick = (groupedClass: GroupedClass) => {
        setSelectedClass(groupedClass);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedClass(null);
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
                            placeholder="Search subjects or sections..."
                            className="input input-bordered rounded-none text-xs martian-mono text-zinc-600 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <div className="stats shadow mb-3 text-xs martian-mono">
                <div className="stat flex flex-row gap-2 items-center">
                    <div className="stat-value text-2xl text-primary">{studentsWithClasses.length}</div>
                    <div className="stat-title text-xs martian-mono font-medium text-zinc-500">Total Students</div>
                </div>
                
                <div className="stat flex flex-row gap-2 items-center">
                    <div className="stat-value text-secondary text-2xl">{groupedClasses.length}</div>
                    <div className="stat-title text-xs martian-mono font-medium text-zinc-500">Subject/Section Groups</div>
                </div>
                
                <div className="stat flex flex-row gap-2 items-center">
                    <div className="stat-value text-success text-2xl">
                        {studentsWithClasses.filter(student => 
                            student.enrolledClasses.some(cls => cls.grades)
                        ).length}
                    </div>
                    <div className="stat-title text-xs martian-mono font-medium text-zinc-500">Students with Grades</div>
                </div>
                
                <div className="stat flex flex-row gap-2 items-center">
                    <div className="stat-value text-success text-2xl">
                        {studentsWithClasses.filter(student => 
                            student.enrolledClasses.some(cls => 
                                cls.grades?.rating && cls.grades.rating.includes("Honors")
                            )
                        ).length}
                    </div>
                    <div className="stat-title text-xs martian-mono font-medium text-zinc-500">Students with Honors</div>
                </div>
            </div>

            {/* Subject/Section Groups */}
            {filteredClasses.length === 0 ? (
                <div className="text-center py-12">
                    <HiAcademicCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        {searchTerm ? "No classes found" : "No classes available"}
                    </h3>
                    <p className="text-gray-500">
                        {searchTerm 
                            ? "Try adjusting your search terms" 
                            : "Classes will appear here once students are enrolled"
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClasses.map((groupedClass, index) => (
                        <div
                            key={`${groupedClass.subjectName}-${groupedClass.sectionName}-${index}`}
                            onClick={() => handleClassClick(groupedClass)}
                            className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-base-300"
                        >
                            <div className="card-body p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-sm text-primary martian-mono line-clamp-2">
                                            {groupedClass.subjectName}
                                        </h3>
                                        <p className="text-xs text-secondary mt-1 font-medium">
                                            {groupedClass.sectionName}
                                        </p>
                                    </div>
                                    <div className="badge badge-primary badge-sm text-white">
                                        {groupedClass.students.length}
                                    </div>
                                </div>
                                <div className="space-y-1 mt-3 pt-3 border-t border-base-200">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-base-content/60">Grade Level:</span>
                                        <span className="font-medium text-primary">{groupedClass.gradeLevel}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-base-content/60">Semester:</span>
                                        <span className="font-medium text-primary">{groupedClass.semester}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-base-content/60">School Year:</span>
                                        <span className="font-medium text-primary">{groupedClass.schoolYear}</span>
                                    </div>
                                    <div className="flex justify-between text-xs mt-2 pt-2 border-t border-base-200">
                                        <span className="text-base-content/60">With Grades:</span>
                                        <span className="font-medium text-success">
                                            {groupedClass.students.filter(s => s.grades).length} / {groupedClass.students.length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Student List Modal */}
            {modalOpen && selectedClass && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-primary martian-mono">
                                    {selectedClass.subjectName}
                                </h3>
                                <p className="text-sm text-secondary mt-1">
                                    {selectedClass.sectionName} • {selectedClass.gradeLevel} • {selectedClass.semester} • {selectedClass.schoolYear}
                                </p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="btn btn-sm btn-circle btn-ghost"
                            >
                                <HiX className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                            <div className="card bg-base-100 shadow-sm">
                                <div className="card-body p-0">
                                    <div className="overflow-x-auto">
                                        <table className="table table-zebra table-sm w-full">
                                            <thead className="sticky top-0 bg-base-200 z-10">
                                                <tr>
                                                    <th className="bg-base-200 text-xs">Student</th>
                                                    <th className="bg-base-200 text-xs">1st Quarter</th>
                                                    <th className="bg-base-200 text-xs">2nd Quarter</th>
                                                    <th className="bg-base-200 text-xs">Final Grade</th>
                                                    <th className="bg-base-200 text-xs">Rating</th>
                                                    <th className="bg-base-200 text-xs">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-xs">
                                                {selectedClass.students.map((studentData) => (
                                                    <tr key={studentData.student.studentId} className="hover">
                                                        <td>
                                                            <div className="flex items-center gap-2">
                                                                <div className="avatar placeholder">
                                                                    <div className="bg-primary text-primary-content rounded-full w-8">
                                                                        <span className="text-sm font-bold">
                                                                            {studentData.student.lastName?.charAt(0) || "S"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold martian-mono text-primary text-xs">
                                                                        {getStudentDisplayName(studentData.student)}
                                                                    </div>
                                                                    <div className="text-xs text-base-content/60">
                                                                        {studentData.student.studentId}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="text-center">
                                                                {studentData.grades ? (
                                                                    <span className={`font-bold martian-mono text-xs ${studentData.grades.firstQuarterGrade >= 75 ? 'text-success' : 'text-error'}`}>
                                                                        {studentData.grades.firstQuarterGrade || "—"}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-400 text-xs">—</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="text-center">
                                                                {studentData.grades ? (
                                                                    <span className={`font-bold martian-mono text-xs ${studentData.grades.secondQuarterGrade >= 75 ? 'text-success' : 'text-error'}`}>
                                                                        {studentData.grades.secondQuarterGrade || "—"}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-400 text-xs">—</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="text-center">
                                                                {studentData.grades ? (
                                                                    <span className={`font-bold martian-mono text-xs ${studentData.grades.finalGrade >= 75 ? 'text-success' : 'text-error'}`}>
                                                                        {studentData.grades.finalGrade || "—"}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-400 text-xs">—</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="text-center">
                                                                {studentData.grades?.rating ? (
                                                                    <div className="bg-primary text-white text-[9px] p-2 rounded-none">
                                                                        {studentData.grades.rating}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-400 text-xs">—</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <Link
                                                                href={`/teachers/class-schedule/student-grade?subjectRecordId=${selectedClass.subjectRecordId}`}
                                                                className="btn btn-xs text-[10px] btn-primary gap-1 text-white"
                                                            >
                                                                <span className="flex items-center flex-row gap-1">
                                                                    <HiPencil className="w-3 h-3" />
                                                                    {studentData.grades ? 'Edit' : 'Input'}
                                                                </span>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="modal-action mt-4">
                            <button
                                onClick={handleCloseModal}
                                className="btn btn-primary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentsPage;
