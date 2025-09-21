"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MdSchool, MdPerson, MdCalendarToday, MdAssignment, MdGrade } from "react-icons/md";
import { useSaveUserData } from '@/hooks';
import { subjectRecordService } from '@/services/subjectRecordService';
import { sectionService } from '@/services/sectionService';
import { strandService } from '@/services/strandService';
import { LoadingOverlay } from '@/components/common';
import { errorToast } from '@/config/toast';
import { formatDate } from '@/config/format';
import type { SubjectRecord, Section, Strand } from '@/interface/info';
import type { Student } from '@/interface/user';
import { FaAddressCard, FaBook } from "react-icons/fa6";

/**
 * @file StudentDashboard.tsx - Student dashboard page
 * @module StudentDashboard
 * 
 * @description
 * This component provides a dashboard for students after they complete their profile.
 * It displays basic student information and provides navigation to various features.
 *
 * @requires react
 * @requires react-icons/md
 */

const StudentDashboard: React.FC = () => {
    const router = useRouter();
    const { userData, isLoading: userLoading } = useSaveUserData({ role: 'student' });
    const [subjectRecords, setSubjectRecords] = useState<SubjectRecord[]>([]);
    const [section, setSection] = useState<Section | null>(null);
    const [strand, setStrand] = useState<Strand | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch student data
    useEffect(() => {
        const fetchStudentData = async () => {
            if (!userData || userLoading) return;

            if (!('studentId' in userData)) {
                errorToast('User data is not a student');
                return;
            }

            try {
                setLoading(true);
                const studentId = userData.studentId;
                
                // Get all subject records where student is enrolled
                const records = await subjectRecordService.getSubjectRecordsByStudent(studentId);
                setSubjectRecords(records);

                // Get section and strand information if student is enrolled in a section
                if (userData.enrolledForSectionId) {
                    const sectionData = await sectionService.getSectionById(userData.enrolledForSectionId);
                    if (sectionData) {
                        setSection(sectionData);
                        // Get strand information
                        const strandData = await strandService.getStrandById(sectionData.strandId);
                        if (strandData) {
                            setStrand(strandData);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching student data:', error);
                errorToast('Failed to load student data');
            } finally {
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [userData, userLoading]);

    // Calculate GPA
    const calculateGPA = (): number => {
        if (!userData || !('studentId' in userData)) return 0;
        
        const studentId = userData.studentId;
        const validGrades = subjectRecords
            .flatMap(record => record.studentGrades || [])
            .filter(grade => grade.studentId === studentId && grade.finalGrade > 0);
        
        if (validGrades.length === 0) return 0;
        
        const totalGrade = validGrades.reduce((sum, grade) => sum + grade.finalGrade, 0);
        return Math.round((totalGrade / validGrades.length) * 100) / 100;
    };

    // Navigation handlers
    const handleNavigation = (path: string) => {
        router.push(path);
    };

    if (userLoading || loading) {
        return <LoadingOverlay />;
    }

    if (!userData || !('studentId' in userData)) {
        return (
            <div className="h-full p-8 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg">
                <div className="max-w-6xl mx-auto text-center">
                    <MdPerson className="w-16 h-16 text-error mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Access Denied</h3>
                    <p className="text-gray-500">You must be logged in as a student to view this dashboard.</p>
                </div>
            </div>
        );
    }

    const studentData = userData as Student;
    const gpa = calculateGPA();
    const enrolledSubjects = subjectRecords.length;
    const gradedSubjects = subjectRecords
        .flatMap(record => record.studentGrades || [])
        .filter(grade => grade.studentId === studentData.studentId && grade.finalGrade > 0).length;

    return (
        <div className="h-full p-8 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="avatar placeholder">
                            <div className="bg-primary text-primary-content rounded-full w-12 h-12 flex items-center justify-center">
                                <MdSchool className="text-xl text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl martian-mono font-bold text-primary">Student Dashboard</h1>
                            <p className="text-xs text-zinc-500 italic">
                                Welcome back, {studentData.firstName} {studentData.lastName}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Student Info Card */}
                <div className="card bg-base-100 shadow mb-6">
                    <div className="card-body">
                        <div className="flex items-center gap-4">
                            <div className="avatar placeholder">
                                <div className="bg-primary text-primary-content rounded-full w-10 h-10 flex items-center justify-center">
                                    <MdPerson className="text-xl text-white" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-primary martian-mono">
                                    {studentData.firstName} {studentData.lastName}
                                </h2>
                                <p className="text-xs text-zinc-500 italic">
                                    Student ID: {studentData.studentId} | {studentData.email}
                                </p>
                                {section && strand && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="badge badge-primary badge-sm">
                                            {section.sectionName}
                                        </div>
                                        <span className="text-xs text-zinc-500">•</span>
                                        <span className="text-xs text-zinc-500">{strand.strandName}</span>
                                        {section.adviserName && (
                                            <>
                                                <span className="text-xs text-zinc-500">•</span>
                                                <span className="text-xs text-zinc-500">Adviser: {section.adviserName}</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Information Card */}
                {section && strand && (
                    <div className="card bg-white border border-primary/20 mb-6">
                        <div className="card-body">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/20 p-3 rounded-lg">
                                    <FaBook className="text-primary text-xl" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-primary martian-mono">
                                        Current Section
                                    </h3>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-zinc-500">Section:</span>
                                            <span className="badge badge-primary badge-xs p-2 text-white">{section.sectionName}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-zinc-500">Strand:</span>
                                            <span className="text-sm text-primary font-bold">{strand.strandName}</span>
                                        </div>
                                        {section.adviserName && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-base-content">Adviser:</span>
                                                <span className="text-sm text-base-content/80">{section.adviserName}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* No Section Assigned Message */}
                {!section && studentData.enrolledForSectionId === undefined && (
                    <div className="card bg-warning/10 border border-warning/20 mb-6">
                        <div className="card-body">
                            <div className="flex items-center gap-4">
                                <div className="bg-warning/20 p-3 rounded-lg">
                                    <MdSchool className="text-warning text-xl" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-warning martian-mono">
                                        No Section Assigned
                                    </h3>
                                    <p className="text-sm text-base-content/80 mt-1">
                                        You haven&apos;t been assigned to a section yet. Please contact your administrator or complete your enrollment.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Academic Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/20 p-3 rounded-lg">
                                    <MdSchool className="text-primary text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary martian-mono">{enrolledSubjects}</h3>
                                    <p className="text-xs text-zinc-500 italic">Enrolled Subjects</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="flex items-center gap-3">
                                <div className="bg-secondary/20 p-3 rounded-lg">
                                    <MdGrade className="text-secondary text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary martian-mono">{gpa}</h3>
                                    <p className="text-xs text-zinc-500 italic">Current GPA</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="flex items-center gap-3">
                                <div className="bg-accent/20 p-3 rounded-lg">
                                    <MdAssignment className="text-accent text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary martian-mono">{gradedSubjects}</h3>
                                    <p className="text-xs text-zinc-500 italic">Graded Subjects</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="flex items-center gap-3">
                                <div className="bg-info/20 p-3 rounded-lg">
                                    <MdCalendarToday className="text-info text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary martian-mono">
                                        {formatDate(studentData.createdAt)}
                                    </h3>
                                    <p className="text-xs text-zinc-500 italic">Member Since</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">

                    <div 
                        className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleNavigation('/students/settings')}
                    >
                        <div className="card-body">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/20 p-3 rounded-lg">
                                    <MdPerson className="text-primary text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary martian-mono">View Profile</h3>
                                    <p className="text-xs text-zinc-500 italic">View and edit your information</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div 
                        className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleNavigation('/students/grades')}
                    >
                        <div className="card-body">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/20 p-3 rounded-lg">
                                    <FaAddressCard className="text-primary text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary martian-mono">View Grades</h3>
                                    <p className="text-xs text-zinc-500 italic">Check your academic performance</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div 
                        className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleNavigation('/students/calendar')}
                    >
                        <div className="card-body">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/20 p-3 rounded-lg">
                                    <MdCalendarToday className="text-primary text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary martian-mono">Calendar</h3>
                                    <p className="text-xs text-zinc-500 italic">View school events and schedule</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div 
                        className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleNavigation('/students/enrollment')}
                    >
                        <div className="card-body">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/20 p-3 rounded-lg">
                                    <MdSchool className="text-primary text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary martian-mono">Enrollment</h3>
                                    <p className="text-xs text-zinc-500 italic">Manage your enrollment status</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* <div 
                        className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer opacity-50"
                        onClick={() => errorToast('Feature coming soon!')}
                    >
                        <div className="card-body">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/20 p-3 rounded-lg">
                                    <MdAssignment className="text-primary text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary martian-mono">Assignments</h3>
                                    <p className="text-xs text-zinc-500 italic">Check pending assignments (Coming Soon)</p>
                                </div>
                            </div>
                        </div>
                    </div> */}

                    {/* <div 
                        className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer opacity-50"
                        onClick={() => errorToast('Feature coming soon!')}
                    >
                        <div className="card-body">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/20 p-3 rounded-lg">
                                    <MdMessage className="text-primary text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary martian-mono">Messages</h3>
                                    <p className="text-xs text-zinc-500 italic">View messages from teachers (Coming Soon)</p>
                                </div>
                            </div>
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard; 