"use client"
import React, { useState, useEffect } from 'react'
import { useSaveUserData } from '@/hooks'
import { subjectRecordService } from '@/services/subjectRecordService'
import { errorToast } from '@/config/toast'
import type { SubjectRecord, StudentGrade } from '@/interface/info'
import { LoadingOverlay } from '@/components/common'
import { HiDocumentText, HiUser } from 'react-icons/hi'

interface StudentGradeDisplay {
  subjectRecord: SubjectRecord;
  studentGrade: StudentGrade | undefined;
}

const StudentGrades = () => {
    const { userData, isLoading: userLoading } = useSaveUserData({ role: 'student' });
    const [grades, setGrades] = useState<StudentGradeDisplay[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch student grades for all enrolled subjects
    useEffect(() => {
        const fetchGrades = async () => {
            if (!userData || userLoading) return;

            if (!('studentId' in userData)) {
                errorToast('User data is not a student');
                return;
            }

            try {
                setLoading(true);
                const studentId = userData.studentId;
                
                // Get all subject records where student is enrolled
                const subjectRecords = await subjectRecordService.getSubjectRecordsByStudent(studentId);

                console.log('subjectRecords', subjectRecords);
                
                // Map subject records to grades display
                const gradesData: StudentGradeDisplay[] = subjectRecords.map(record => {
                    const studentGrade = record.studentGrades?.find(grade => grade.studentId === studentId);
                    return {
                        subjectRecord: record,
                        studentGrade
                    };
                });

                setGrades(gradesData);
            } catch (error) {
                console.error('Error fetching grades:', error);
                errorToast('Failed to load grades');
            } finally {
                setLoading(false);
            }
        };

        fetchGrades();
    }, [userData, userLoading]);

    // Calculate GPA for all subjects
    const calculateGPA = (): number => {
        const validGrades = grades.filter(grade => grade.studentGrade?.finalGrade && grade.studentGrade.finalGrade > 0);
        if (validGrades.length === 0) return 0;
        
        const totalGrade = validGrades.reduce((sum, grade) => sum + (grade.studentGrade?.finalGrade || 0), 0);
        return Math.round((totalGrade / validGrades.length) * 100) / 100;
    };



    if (userLoading || loading) {
        return <LoadingOverlay />;
    }

    if (!userData || !('studentId' in userData)) {
        return (
            <div className="max-w-4xl mx-auto p-4">
                <div className="text-center py-12">
                    <HiUser className="w-16 h-16 text-error mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        Access Denied
                    </h3>
                    <p className="text-gray-500 mb-6">
                        You must be logged in as a student to view grades.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="mb-6">
                <h1 className="martian-mono font-bold text-primary">
                    My Grades
                </h1>
                <p className="text-gray-500 text-xs italic">
                    View your academic performance across all enrolled subjects
                </p>
                <hr className="mt-4" />
            </div>

            {/* GPA Summary Card */}
            <div className="card bg-white shadow-md mb-6">
                <div className="card-body">
                    <div className="flex items-center gap-3 mb-4">
                        <h2 className="martian-mono font-bold text-primary">Academic Summary</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary martian-mono">{grades.length}</div>
                            <div className="text-sm text-gray-600 italic">Enrolled Subjects</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary martian-mono">{calculateGPA()}</div>
                            <div className="text-sm text-gray-600 italic">GPA</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary martian-mono">
                                {grades.filter(g => g.studentGrade?.finalGrade && g.studentGrade.finalGrade > 0).length}
                            </div>
                            <div className="text-sm text-gray-600 italic">Graded Subjects</div>
                        </div>
                    </div>
                </div>
            </div>

            {grades.length === 0 ? (
                <div className="text-center py-12">
                    <HiDocumentText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-sm italic font-semibold text-gray-600 mb-2">
                        No Grades Available
                    </h3>
                    <p className="text-gray-500 mb-6 text-xs italic">
                        You are not enrolled in any subjects yet, or grades have not been posted.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {grades.map((gradeData) => (
                        <div key={gradeData.subjectRecord.id} className="card bg-white shadow-md">
                            <div className="card-body">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-primary martian-mono mb-2">
                                            {gradeData.subjectRecord.subjectName}
                                        </h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600 font-medium italic">Section:</span>
                                                <div className="text-primary text-xs font-semibold martian-mono">{gradeData.subjectRecord.sectionName}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 font-medium italic">Grade Level:</span>
                                                <div className="text-primary text-xs font-semibold martian-mono">{gradeData.subjectRecord.gradeLevel}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 font-medium italic">Semester:</span>
                                                <div className="text-primary text-xs font-semibold martian-mono">{gradeData.subjectRecord.semester}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 font-medium italic">School Year:</span>
                                                <div className="text-primary text-xs font-semibold martian-mono">{gradeData.subjectRecord.schoolYear}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {gradeData.studentGrade ? (
                                    <div className="mt-4">
                                        <h4 className="font-semibold text-gray-700 mb-3 italic">Grade Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                <div className="text-sm text-gray-600 mb-1 italic">1st Quarter</div>
                                                <div className={`text-xl font-bold martian-mono ${gradeData.studentGrade.firstQuarterGrade > 0 ? 'text-primary' : 'text-gray-400'}`}>
                                                    {gradeData.studentGrade.firstQuarterGrade > 0 ? gradeData.studentGrade.firstQuarterGrade : '—'}
                                                </div>
                                            </div>
                                            
                                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                <div className="text-sm text-gray-600 mb-1 italic">2nd Quarter</div>
                                                <div className={`text-xl font-bold martian-mono ${gradeData.studentGrade.secondQuarterGrade > 0 ? 'text-primary' : 'text-gray-400'}`}>
                                                    {gradeData.studentGrade.secondQuarterGrade > 0 ? gradeData.studentGrade.secondQuarterGrade : '—'}
                                                </div>
                                            </div>
                                            
                                            <div className="text-center p-3 bg-primary bg-opacity-10 rounded-lg">
                                                <div className="text-sm text-gray-600 mb-1 italic">Final Grade</div>
                                                <div className={`text-xl font-bold martian-mono ${gradeData.studentGrade.finalGrade > 0 ? 'text-primary' : 'text-gray-400'}`}>
                                                    {gradeData.studentGrade.finalGrade > 0 ? gradeData.studentGrade.finalGrade : '—'}
                                                </div>
                                            </div>
                                            
                                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                <div className="text-sm text-gray-600 mb-1 italic">Rating</div>
                                                {gradeData.studentGrade.finalGrade > 0 ? (
                                                    <div className="text-sm font-semibold martian-mono text-primary">
                                                        {gradeData.studentGrade.rating || "—"}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-400">Not Graded</div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {gradeData.studentGrade.remarks && (
                                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                                <div className="text-sm text-gray-600 mb-1 italic">Remarks</div>
                                                <div className="text-primary text-xs font-semibold martian-mono">{gradeData.studentGrade.remarks}</div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-4 text-center py-6">
                                        <HiDocumentText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">
                                            Grades have not been posted for this subject yet.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default StudentGrades
