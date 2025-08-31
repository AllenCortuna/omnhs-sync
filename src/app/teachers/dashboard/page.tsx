"use client"
import React, { useState, useEffect } from 'react';
import { useSaveUserData } from '@/hooks';
import { subjectRecordService } from '@/services/subjectRecordService';
import { errorToast } from '@/config/toast';
import type { SubjectRecord } from '@/interface/info';
import type { Teacher, Student } from '@/interface/user';
import { LoadingOverlay } from '@/components/common';
import {
    HiAcademicCap,
    HiCalendar,
    HiDocumentText,
    HiUserGroup,
    HiUsers,
    HiPencil,
    HiChartBar
} from 'react-icons/hi';
import { formatDate } from '@/config/format';
import Link from 'next/link';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebase';

const TeacherDashboard = () => {
    const { userData, isLoading: userLoading } = useSaveUserData({
        role: "teacher",
    });
    const [subjectRecords, setSubjectRecords] = useState<SubjectRecord[]>([]);
    const [studentsByClass, setStudentsByClass] = useState<{ [key: string]: Student[] }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch teacher's classes and students
    useEffect(() => {
        const fetchTeacherData = async () => {
            if (!userData || userLoading) return;

            if (!("employeeId" in userData)) {
                errorToast("User data is not a teacher");
                return;
            }

            try {
                setLoading(true);
                setError(null);
                
                const teacherData = userData as Teacher;
                
                // Fetch all subject records for the current teacher
                const records = await subjectRecordService.getSubjectRecordsByTeacher(
                    teacherData.employeeId
                );
                setSubjectRecords(records);

                // Fetch students for each class
                const studentsData: { [key: string]: Student[] } = {};
                
                for (const record of records) {
                    if (record.studentList && record.studentList.length > 0) {
                        try {
                            const studentsQuery = query(
                                collection(db, "students"),
                                where("studentId", "in", record.studentList),
                                orderBy("lastName", "asc")
                            );
                            
                            const studentsSnapshot = await getDocs(studentsQuery);
                            const students: Student[] = [];
                            studentsSnapshot.forEach((doc) => {
                                students.push({ id: doc.id, ...doc.data() } as Student);
                            });
                            studentsData[record.id] = students;
                        } catch (error) {
                            console.error(`Error fetching students for class ${record.id}:`, error);
                            studentsData[record.id] = [];
                        }
                    } else {
                        studentsData[record.id] = [];
                    }
                }
                
                setStudentsByClass(studentsData);
            } catch (err) {
                console.error('Error fetching teacher data:', err);
                setError('Failed to load dashboard data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchTeacherData();
    }, [userData, userLoading]);



    const getAverageGrade = (recordId: string) => {
        const students = studentsByClass[recordId] || [];
        if (students.length === 0) return 0;
        
        // For now, return 0 as we need to implement proper grade fetching
        // This will be enhanced when we implement the grade system
        return 0;
    };

    if (userLoading || loading) {
        return <LoadingOverlay />;
    }

    if (error) {
        return (
            <div className="alert alert-error">
                <HiAcademicCap className="w-5 h-5 text-white" />
                <span className="text-sm text-white">{error}</span>
            </div>
        );
    }

    if (!userData || !("employeeId" in userData)) {
        return (
            <div className="text-center py-12">
                <HiAcademicCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Access denied. Please log in as a teacher.</p>
            </div>
        );
    }

    const teacherData = userData as Teacher;
    const totalClasses = subjectRecords.length;
    const totalStudents = Object.values(studentsByClass).reduce((sum, students) => sum + students.length, 0);

    return (
        <div className="max-w-7xl mx-auto p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-2xl martian-mono font-bold text-primary">Teacher Dashboard</h1>
                    <p className="text-gray-500 italic text-xs">
                        Welcome back, {teacherData.firstName} {teacherData.lastName}
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3 martian-mono">
                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-figure text-primary">
                            <HiAcademicCap className="w-8 h-8" />
                        </div>
                        <div className="stat-title text-xs">Total Classes</div>
                        <div className="stat-value text-primary">{totalClasses}</div>
                    </div>
                </div>

                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-figure text-primary">
                            <HiUsers className="w-8 h-8" />
                        </div>
                        <div className="stat-title text-xs">Total Students</div>
                        <div className="stat-value text-primary">{totalStudents}</div>
                    </div>
                </div>

                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-figure text-primary">
                            <HiChartBar className="w-8 h-8" />
                        </div>
                        <div className="stat-title text-xs">Avg Students/Class</div>
                        <div className="stat-value text-primary">
                            {totalClasses > 0 ? Math.round((totalStudents / totalClasses) * 10) / 10 : 0}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl p-6">
                <h2 className="font-bold text-primary martian-mono mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-3 martian-mono">
                    <Link 
                        href="/teachers/class-schedule" 
                        className="btn btn-primary rounded-none btn-sm gap-2 text-white text-xs"
                    >
                        <HiAcademicCap className="w-4 h-4" />
                        Manage Classes
                    </Link>
                    <Link 
                        href="/teachers/grades" 
                        className="btn btn-outline rounded-none btn-sm gap-2 text-primary text-xs"
                    >
                        <HiDocumentText className="w-4 h-4" />
                        View All Grades
                    </Link>
                    <Link 
                        href="/teachers/calendar" 
                        className="btn btn-outline rounded-none btn-sm gap-2 text-primary text-xs"
                    >
                        <HiCalendar className="w-4 h-4" />
                        View Calendar
                    </Link>
                </div>
            </div>

            {/* Classes Overview */}
            <div className="shadow bg-white rounded-none p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-xl text-primary martian-mono">My Classes</h2>
                    <Link 
                        href="/teachers/class-schedule" 
                        className="btn btn-primary rounded-none martian-mono btn-sm gap-2 text-white text-xs"
                    >
                        <HiAcademicCap className="w-4 h-4" />
                        Manage Classes
                    </Link>
                </div>

                {subjectRecords.length === 0 ? (
                    <div className="text-center py-12">
                        <HiAcademicCap className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <HiAcademicCap className="w-8 h-8 text-base-content/40" />
                        </HiAcademicCap>
                        <h3 className="text-lg font-medium text-base-content mb-2">No Classes Found</h3>
                        <p className="text-base-content/60 mb-6">
                            You haven&apos;t been assigned any classes yet. Add your first class to get started.
                        </p>
                        <Link 
                            href="/teachers/class-schedule" 
                            className="btn btn-primary btn-sm"
                        >
                            <HiAcademicCap className="w-4 h-4" />
                            Add Your First Class
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {subjectRecords.map((record) => {
                            const students = studentsByClass[record.id] || [];
                            const studentCount = students.length;
                            const averageGrade = getAverageGrade(record.id);
                            
                            return (
                                <div 
                                    key={record.id} 
                                    className="shadow bg-white rounded-none p-6 hover:shadow-md transition-shadow"
                                >
                                    {/* Class Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-bold text-primary martian-mono">
                                                    {record.subjectName}
                                                </h3>
                                                <span className="badge badge-primary badge-sm">
                                                    {record.gradeLevel}
                                                </span>
                                                <span className="badge badge-secondary badge-sm text-white italic">
                                                    {record.semester} Semester
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-500 italic font-medium">
                                                    <span>{record.sectionName}</span>
                                                    <span>{record.schoolYear}</span>
                                                    <span>{formatDate(record.createdAt)}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 martian-mono">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-primary">{studentCount}</p>
                                                <p className="text-xs text-base-content/60">Students</p>
                                            </div>
                                            {averageGrade > 0 && (
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-success">{averageGrade}</p>
                                                    <p className="text-xs text-base-content/60">Avg Grade</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Students List */}
                                    <div className="border-t border-base-200 pt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-primary martian-mono text-xs font-bold">Students List</h4>
                                            <div className="flex gap-2">
                                                <Link
                                                    href={`/teachers/class-schedule/add-student?subjectRecordId=${record.id}`}
                                                    className="btn btn-xs btn-outline btn-primary rounded-none martian-mono text-xs"
                                                >
                                                    <HiPencil className="w-3 h-3" />
                                                    Manage Students
                                                </Link>
                                                <Link
                                                    href={`/teachers/class-schedule/student-grade?subjectRecordId=${record.id}`}
                                                    className="btn btn-xs btn-outline btn-secondary rounded-none martian-mono text-xs"
                                                >
                                                    <HiDocumentText className="w-3 h-3" />
                                                    Manage Grades
                                                </Link>
                                            </div>
                                        </div>

                                        {students.length === 0 ? (
                                            <div className="text-center py-6 bg-base-100 rounded-lg">
                                                <HiUserGroup className="w-8 h-8 text-base-content/40 mx-auto mb-2" />
                                                <p className="text-sm text-base-content/60">No students enrolled yet</p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                                {students.map((student) => (
                                                    <div 
                                                        key={student.id}
                                                        className="flex items-center gap-3 p-3 rounded-none border border-base-200 bg-base-200 transition-colors shadow-sm"
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-xs text-primary truncate martian-mono">
                                                                {student.lastName}, {student.firstName}
                                                            </p>
                                                            <p className="text-xs text-zinc-500 italic">
                                                                {student.studentId}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Recent Activity or Additional Stats */}
            <div className="bg-secondary rounded-xl border border-base-300 p-6">
                <h2 className="text-lg font-bold text-white mb-4 martian-mono">Class Statistics</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="text-center p-4 bg-secondary rounded-lg">
                        <p className="text-2xl font-bold text-white martian-mono">{totalClasses}</p>
                        <p className="text-zinc-200 text-xs">Total Classes</p>
                    </div>
                    <div className="text-center p-4 bg-secondary rounded-lg">
                        <p className="text-2xl font-bold text-white martian-mono">{totalStudents}</p>
                        <p className="text-zinc-200 text-xs italic">Total Students</p>
                    </div>
                    <div className="text-center p-4 bg-secondary rounded-lg">
                        <p className="text-2xl font-bold text-white martian-mono">
                            {totalClasses > 0 ? Math.round((totalStudents / totalClasses) * 10) / 10 : 0}
                        </p>
                        <p className="text-zinc-200 text-xs italic">Avg Students/Class</p>
                    </div>
                    <div className="text-center p-4 bg-secondary rounded-lg">
                        <p className="text-2xl font-bold text-white martian-mono">
                            {subjectRecords.filter(record => 
                                (studentsByClass[record.id]?.length || 0) > 0
                            ).length}
                        </p>
                        <p className="text-zinc-200 text-xs italic">Active Classes</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;