"use client"
import React, { useState, useEffect } from 'react'
import { useSaveUserData } from '@/hooks'
import { subjectRecordService } from '@/services/subjectRecordService'
import { subjectService } from '@/services/subjectService'
import { sectionService } from '@/services/sectionService'
import { strandService } from '@/services/strandService'
import { errorToast } from '@/config/toast'
import type { SubjectRecord, StudentGrade, Subject, Strand } from '@/interface/info'
import { LoadingOverlay } from '@/components/common'
import { HiDocumentText, HiUser, HiAcademicCap } from 'react-icons/hi'

interface StudentGradeDisplay {
  subjectRecord: SubjectRecord;
  studentGrade: StudentGrade | undefined;
}

const StudentGrades = () => {
    const { userData, isLoading: userLoading } = useSaveUserData({ role: 'student' });
    const [grades, setGrades] = useState<StudentGradeDisplay[]>([]);
    const [allGrades, setAllGrades] = useState<StudentGradeDisplay[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSemester, setSelectedSemester] = useState<string>('all');
    const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('all');
    const [strandSubjects, setStrandSubjects] = useState<Subject[]>([]);
    const [strand, setStrand] = useState<Strand | null>(null);

    // Fetch student grades for all enrolled subjects and strand subjects
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

                setAllGrades(gradesData);
                setGrades(gradesData);

                // Fetch subjects based on student's strand
                if (userData.enrolledForSectionId) {
                    const sectionData = await sectionService.getSectionById(userData.enrolledForSectionId);
                    if (sectionData) {
                        // Get strand information
                        const strandData = await strandService.getStrandById(sectionData.strandId);
                        if (strandData) {
                            setStrand(strandData);
                            // Get subjects for this strand
                            const subjects = await subjectService.getSubjectsByStrandId(sectionData.strandId);
                            setStrandSubjects(subjects);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching grades:', error);
                errorToast('Failed to load grades');
            } finally {
                setLoading(false);
            }
        };

        fetchGrades();
    }, [userData, userLoading]);

    // Filter grades based on selected semester and school year
    useEffect(() => {
        if (allGrades.length === 0) return;

        let filteredGrades = allGrades;

        if (selectedSemester !== 'all') {
            filteredGrades = filteredGrades.filter(grade => 
                grade.subjectRecord.semester === selectedSemester
            );
        }

        if (selectedSchoolYear !== 'all') {
            filteredGrades = filteredGrades.filter(grade => 
                grade.subjectRecord.schoolYear === selectedSchoolYear
            );
        }

        setGrades(filteredGrades);
    }, [allGrades, selectedSemester, selectedSchoolYear]);

    // Get unique semesters and school years for filter options
    const semesters = Array.from(new Set(allGrades.map(grade => grade.subjectRecord.semester))).sort();
    const schoolYears = Array.from(new Set(allGrades.map(grade => grade.subjectRecord.schoolYear))).sort();

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

            {/* Filters */}
            {allGrades.length > 0 && (
                <div className="card bg-white shadow-md mb-6">
                    <div className="card-body">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex flex-wrap gap-3">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="text-xs italic font-normal text-zinc-500">Semester</span>
                                    </label>
                                    <select
                                        value={selectedSemester}
                                        onChange={(e) => setSelectedSemester(e.target.value)}
                                        className="select select-bordered select-sm w-full max-w-xs text-xs martian-mono text-primary rounded-none"
                                    >
                                        <option value="all">All Semesters</option>
                                        {semesters.map(semester => (
                                            <option key={semester} value={semester}>
                                                {semester} Semester
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="text-xs italic font-normal text-zinc-500">School Year</span>
                                    </label>
                                    <select
                                        value={selectedSchoolYear}
                                        onChange={(e) => setSelectedSchoolYear(e.target.value)}
                                        className="select select-bordered select-sm w-full max-w-xs text-xs martian-mono text-primary rounded-none"
                                    >
                                        <option value="all">All Years</option>
                                        {schoolYears.map(year => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="text-xs italic font-normal text-zinc-500">Actions</span>
                                    </label>
                                    <button
                                        onClick={() => {
                                            setSelectedSemester('all');
                                            setSelectedSchoolYear('all');
                                        }}
                                        className="btn btn-outline btn-sm text-xs martian-mono text-primary rounded-none"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* GPA Summary Card */}
            <div className="card bg-white shadow-md mb-6">
                <div className="card-body">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="martian-mono font-bold text-primary">Academic Summary</h2>
                        {(selectedSemester !== 'all' || selectedSchoolYear !== 'all') && (
                            <div className="text-xs text-gray-500 italic">
                                Showing filtered results
                            </div>
                        )}
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

            {/* Strand Subjects List */}
            {strand && strandSubjects.length > 0 && (
                <div className="card bg-white shadow-md mb-6">
                    <div className="card-body">
                        <div className="flex items-center gap-2 mb-4">
                            <HiAcademicCap className="w-5 h-5 text-primary" />
                            <h2 className="martian-mono font-bold text-primary">
                                Available Subjects - {strand.strandName}
                            </h2>
                        </div>
                        <p className="text-xs text-gray-500 italic mb-4">
                            {strand.strandDescription || 'Subjects available for your strand'}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {strandSubjects.map((subject) => {
                                const isEnrolled = allGrades.some(
                                    grade => grade.subjectRecord.subjectId === subject.id
                                );
                                return (
                                    <div
                                        key={subject.id}
                                        className={`p-3 rounded border ${
                                            isEnrolled
                                                ? 'bg-success/10 border-success'
                                                : 'bg-base-100 border-base-300'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className={`font-semibold text-sm martian-mono ${
                                                    isEnrolled ? 'text-success' : 'text-primary'
                                                }`}>
                                                    {subject.subjectName}
                                                </div>
                                                {subject.subjectDescription && (
                                                    <div className="text-xs text-gray-500 mt-1 italic">
                                                        {subject.subjectDescription}
                                                    </div>
                                                )}
                                            </div>
                                            {isEnrolled && (
                                                <span className="badge badge-success badge-sm text-xs">
                                                    Enrolled
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

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
                <div className="card bg-white shadow-md">
                    <div className="card-body p-0">
                        <div className="overflow-x-auto">
                            <table className="table table-zebra w-full">
                                <thead>
                                    <tr className="bg-base-200">
                                        <th className="text-xs font-bold martian-mono text-primary">Subject</th>
                                        <th className="text-xs font-bold martian-mono text-primary">Teacher</th>
                                        <th className="text-xs font-bold martian-mono text-primary">Section</th>
                                        <th className="text-xs font-bold martian-mono text-primary">Grade Level</th>
                                        <th className="text-xs font-bold martian-mono text-primary">Semester</th>
                                        <th className="text-xs font-bold martian-mono text-primary">School Year</th>
                                        <th className="text-xs font-bold martian-mono text-primary text-center">1st Quarter</th>
                                        <th className="text-xs font-bold martian-mono text-primary text-center">2nd Quarter</th>
                                        <th className="text-xs font-bold martian-mono text-primary text-center">Final Grade</th>
                                        <th className="text-xs font-bold martian-mono text-primary text-center">Rating</th>
                                        <th className="text-xs font-bold martian-mono text-primary">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {grades.map((gradeData) => (
                                        <tr key={gradeData.subjectRecord.id} className="hover">
                                            <td>
                                                <div className="font-semibold text-xs martian-mono text-primary">
                                                    {gradeData.subjectRecord.subjectName}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-xs martian-mono text-primary">
                                                    {gradeData.subjectRecord.teacherName}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-xs martian-mono text-primary">
                                                    {gradeData.subjectRecord.sectionName}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-xs martian-mono text-primary">
                                                    {gradeData.subjectRecord.gradeLevel}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-xs martian-mono text-primary">
                                                    {gradeData.subjectRecord.semester}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-xs martian-mono text-primary">
                                                    {gradeData.subjectRecord.schoolYear}
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                {gradeData.studentGrade?.firstQuarterGrade && gradeData.studentGrade.firstQuarterGrade > 0 ? (
                                                    <div className="text-sm font-bold martian-mono text-primary">
                                                        {gradeData.studentGrade.firstQuarterGrade}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-400">—</div>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                {gradeData.studentGrade?.secondQuarterGrade && gradeData.studentGrade.secondQuarterGrade > 0 ? (
                                                    <div className="text-sm font-bold martian-mono text-primary">
                                                        {gradeData.studentGrade.secondQuarterGrade}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-400">—</div>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                {gradeData.studentGrade?.finalGrade && gradeData.studentGrade.finalGrade > 0 ? (
                                                    <div className="text-sm font-bold martian-mono text-primary">
                                                        {gradeData.studentGrade.finalGrade}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-400">—</div>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                {gradeData.studentGrade?.finalGrade && gradeData.studentGrade.finalGrade > 0 ? (
                                                    <div className="text-xs font-semibold martian-mono text-primary">
                                                        {gradeData.studentGrade.rating || "—"}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-gray-400 italic">Not Graded</div>
                                                )}
                                            </td>
                                            <td>
                                                {gradeData.studentGrade?.remarks ? (
                                                    <div className="text-xs martian-mono text-primary max-w-xs truncate" title={gradeData.studentGrade.remarks}>
                                                        {gradeData.studentGrade.remarks}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-gray-400">—</div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default StudentGrades
