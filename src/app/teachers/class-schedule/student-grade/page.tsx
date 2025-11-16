"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../../../../../firebase";
import { subjectRecordService } from "@/services/subjectRecordService";
import { logService } from "@/services/logService";
import { errorToast, successToast } from "@/config/toast";
import type { SubjectRecord, StudentGrade } from "@/interface/info";
import type { Student } from "@/interface/user";
import { LoadingOverlay, BackButton } from "@/components/common";
import {
    HiUserGroup,
    HiX,
    HiPencil,
    HiExclamation,
} from "react-icons/hi";
import Link from "next/link";
import { IoSave } from "react-icons/io5";

interface GradeFormData {
    studentId: string;
    studentName: string;
    firstQuarterGrade: number | "";
    secondQuarterGrade: number | "";
    finalGrade: number | "";
    rating: string;
    remarks: string;
}

const StudentGradePage: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const subjectRecordId = searchParams.get("subjectRecordId");
    const [subjectRecord, setSubjectRecord] = useState<SubjectRecord | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [existingGrades, setExistingGrades] = useState<StudentGrade[]>([]);
    const [gradeForms, setGradeForms] = useState<GradeFormData[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    // const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

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

                // Fetch students enrolled in this class
                if (record.studentList && record.studentList.length > 0) {
                    const studentsQuery = query(
                        collection(db, "students"),
                        where("studentId", "in", record.studentList),
                        orderBy("lastName", "asc")
                    );
                    
                    const studentsSnapshot = await getDocs(studentsQuery);
                    const studentsData: Student[] = [];
                    studentsSnapshot.forEach((doc) => {
                        studentsData.push({ id: doc.id, ...doc.data() } as Student);
                    });
                    setStudents(studentsData);

                    // Initialize grade forms for each student
                    const initialGradeForms: GradeFormData[] = studentsData.map(student => {
                        const existingGrade = record.studentGrades?.find(g => g.studentId === student.studentId);
                        return {
                            studentId: student.studentId,
                            studentName: `${student.lastName || ""}, ${student.firstName || ""}`.trim(),
                            firstQuarterGrade: existingGrade?.firstQuarterGrade || "",
                            secondQuarterGrade: existingGrade?.secondQuarterGrade || "",
                            finalGrade: existingGrade?.finalGrade || "",
                            rating: existingGrade?.rating || "",
                            remarks: existingGrade?.remarks || "",
                        };
                    });
                    setGradeForms(initialGradeForms);
                    setExistingGrades(record.studentGrades || []);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                errorToast("Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [subjectRecordId, router]);

    // Calculate final grade automatically
    const calculateFinalGrade = (firstQuarter: number, secondQuarter: number): number => {
        return Math.round((firstQuarter + secondQuarter) / 2);
    };

    // Calculate rating based on final grade
    const calculateRating = (finalGrade: number): string => {
        if (finalGrade >= 98) return "With Highest Honors";
        if (finalGrade >= 95) return "With High Honors";
        if (finalGrade >= 90) return "With Honors";
        return "";
    };

    // Check if a field is submitted (has a value in existingGrades)
    const isFieldSubmitted = (studentId: string, field: 'firstQuarterGrade' | 'secondQuarterGrade' | 'remarks'): boolean => {
        const existingGrade = existingGrades.find(g => g.studentId === studentId);
        if (!existingGrade) return false;
        
        if (field === 'firstQuarterGrade') {
            return existingGrade.firstQuarterGrade > 0;
        }
        if (field === 'secondQuarterGrade') {
            return existingGrade.secondQuarterGrade > 0;
        }
        if (field === 'remarks') {
            return existingGrade.remarks !== "";
        }
        return false;
    };

    // Handle grade input changes - only allow editing empty fields
    const handleGradeChange = (studentId: string, field: keyof GradeFormData, value: string | number) => {
        // Prevent editing submitted fields
        if (field === 'firstQuarterGrade' && isFieldSubmitted(studentId, 'firstQuarterGrade')) {
            return;
        }
        if (field === 'secondQuarterGrade' && isFieldSubmitted(studentId, 'secondQuarterGrade')) {
            return;
        }
        if (field === 'remarks' && isFieldSubmitted(studentId, 'remarks')) {
            return;
        }
        
        setGradeForms(prev => prev.map(form => {
            if (form.studentId === studentId) {
                const updatedForm = { ...form, [field]: value };
                
                // Auto-calculate final grade if both quarters are filled
                if (field === 'firstQuarterGrade' || field === 'secondQuarterGrade') {
                    const firstQuarter = field === 'firstQuarterGrade' ? Number(value) : Number(updatedForm.firstQuarterGrade);
                    const secondQuarter = field === 'secondQuarterGrade' ? Number(value) : Number(updatedForm.secondQuarterGrade);
                    
                    if (!isNaN(firstQuarter) && !isNaN(secondQuarter) && firstQuarter > 0 && secondQuarter > 0) {
                        updatedForm.finalGrade = calculateFinalGrade(firstQuarter, secondQuarter);
                        // Auto-calculate rating based on final grade
                        updatedForm.rating = calculateRating(updatedForm.finalGrade);
                    }
                }
                
                return updatedForm;
            }
            return form;
        }));
    };

    // Validate grade input
    const validateGrade = (grade: number): boolean => {
        return grade >= 60 && grade <= 100;
    };

    // Get grade validation status
    const getGradeStatus = (grade: number | ""): "valid" | "invalid" | "empty" => {
        if (grade === "") return "empty";
        return validateGrade(Number(grade)) ? "valid" : "invalid";
    };

    // Get grade color class
    const getGradeColor = (grade: number | ""): string => {
        const status = getGradeStatus(grade);
        switch (status) {
            case "valid": return "text-success";
            case "invalid": return "text-error";
            default: return "text-gray-500";
        }
    };

    // Handle save grades - show confirmation modal first
    const handleSaveClick = () => {
        if (!subjectRecord) return;

        // Validate all grades
        const invalidGrades = gradeForms.filter(form => {
            const firstQuarterValid = form.firstQuarterGrade === "" || validateGrade(Number(form.firstQuarterGrade));
            const secondQuarterValid = form.secondQuarterGrade === "" || validateGrade(Number(form.secondQuarterGrade));
            return !firstQuarterValid || !secondQuarterValid;
        });

        if (invalidGrades.length > 0) {
            errorToast("Please ensure all grades are between 75-100");
            return;
        }

        // Check if there are any new grades to save
        const hasNewGrades = gradeForms.some(form => {
            const existingGrade = existingGrades.find(g => g.studentId === form.studentId);
            const hasNewFirstQuarter = form.firstQuarterGrade !== "" && (!existingGrade || existingGrade.firstQuarterGrade === 0);
            const hasNewSecondQuarter = form.secondQuarterGrade !== "" && (!existingGrade || existingGrade.secondQuarterGrade === 0);
            const hasNewRemarks = form.remarks !== "" && (!existingGrade || existingGrade.remarks === "");
            return hasNewFirstQuarter || hasNewSecondQuarter || hasNewRemarks;
        });

        if (!hasNewGrades) {
            errorToast("No new grades to save");
            return;
        }

        setShowConfirmModal(true);
    };

    // Handle confirmed save
    const handleSaveGrades = async () => {
        if (!subjectRecord) return;

        setShowConfirmModal(false);

        try {
            setSaving(true);

            // Merge existing grades with new grades (only update empty fields)
            const updatedGrades: StudentGrade[] = gradeForms
                .filter(form => form.firstQuarterGrade !== "" || form.secondQuarterGrade !== "")
                .map(form => {
                    const existingGrade = existingGrades.find(g => g.studentId === form.studentId);
                    
                    // Use existing values if they exist, otherwise use new values
                    return {
                        id: existingGrade?.id || `grade_${form.studentId}`,
                        studentId: form.studentId,
                        studentName: form.studentName,
                        firstQuarterGrade: existingGrade && existingGrade.firstQuarterGrade > 0 
                            ? existingGrade.firstQuarterGrade 
                            : (Number(form.firstQuarterGrade) || 0),
                        secondQuarterGrade: existingGrade && existingGrade.secondQuarterGrade > 0 
                            ? existingGrade.secondQuarterGrade 
                            : (Number(form.secondQuarterGrade) || 0),
                        finalGrade: existingGrade && existingGrade.finalGrade > 0
                            ? existingGrade.finalGrade
                            : (Number(form.finalGrade) || 0),
                        rating: existingGrade && existingGrade.rating
                            ? existingGrade.rating
                            : form.rating,
                        remarks: existingGrade && existingGrade.remarks !== ""
                            ? existingGrade.remarks
                            : form.remarks,
                        subjectRecordId: subjectRecord.id,
                        subjectName: subjectRecord.subjectName,
                        gradeLevel: subjectRecord.gradeLevel,
                        semester: subjectRecord.semester,
                        schoolYear: subjectRecord.schoolYear,
                        teacherId: subjectRecord.teacherId,
                        teacherName: subjectRecord.teacherName,
                        createdAt: existingGrade?.createdAt || new Date().toISOString(),
                    };
                });

            // Update subject record with merged grades
            await subjectRecordService.updateSubjectRecord(subjectRecord.id, {
                studentGrades: updatedGrades
            });

            // Log grade updates for new grades only
            for (const grade of updatedGrades) {
                const existingGrade = existingGrades.find(g => g.studentId === grade.studentId);
                const isNewGrade = !existingGrade || existingGrade.finalGrade === 0;
                
                if (grade.finalGrade > 0 && isNewGrade) {
                    await logService.logGradeUpdated(
                        grade.studentId,
                        grade.studentName,
                        grade.subjectName,
                        grade.finalGrade,
                        subjectRecord.teacherId || 'Teacher',
                        subjectRecord.teacherName || 'Teacher'
                    );
                }
            }

            // Update local state
            setSubjectRecord(prev => prev ? {
                ...prev,
                studentGrades: updatedGrades
            } : null);
            setExistingGrades(updatedGrades);

            // Refresh grade forms to reflect read-only state
            const refreshedGradeForms: GradeFormData[] = students.map(student => {
                const updatedGrade = updatedGrades.find(g => g.studentId === student.studentId);
                return {
                    studentId: student.studentId,
                    studentName: `${student.lastName || ""}, ${student.firstName || ""}`.trim(),
                    firstQuarterGrade: updatedGrade?.firstQuarterGrade || "",
                    secondQuarterGrade: updatedGrade?.secondQuarterGrade || "",
                    finalGrade: updatedGrade?.finalGrade || "",
                    rating: updatedGrade?.rating || "",
                    remarks: updatedGrade?.remarks || "",
                };
            });
            setGradeForms(refreshedGradeForms);

            successToast("Grades saved successfully!");
        } catch (error) {
            console.error("Error saving grades:", error);
            errorToast("Failed to save grades");
        } finally {
            setSaving(false);
        }
    };

    // Get student display name
    // const getStudentDisplayName = (student: Student) => {
    //     return `${student.lastName || ""}, ${student.firstName || ""}${student.middleName ? ` ${student.middleName.charAt(0)}.` : ""}`.trim();
    // };

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
                        Student Grades
                    </h1>
                    <hr />
                    <div className="bg-white rounded-none shadow p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <h2 className="font-bold text-sm martian-mono text-primary">{subjectRecord.subjectName}</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-semibold">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-600">{subjectRecord.sectionName}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <span className="text-gray-600">
                                    {subjectRecord.gradeLevel} - {subjectRecord.semester} Semester
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <span className="text-gray-600">{subjectRecord.schoolYear}</span>
                            </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2 text-zinc-500">
                                <span className="font-medium text-[10px] italic martian-mono">
                                    Total Students: {students.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {students.length === 0 ? (
                <div className="text-center py-12">
                    <HiUserGroup className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        No Students Enrolled
                    </h3>
                    <p className="text-gray-500 mb-6">
                        There are no students enrolled in this class yet.
                    </p>
                    <Link
                        href={`/teachers/class-schedule/add-student?subjectRecordId=${subjectRecord.id}`}
                        className="btn btn-primary gap-2"
                    >
                        <HiPencil className="w-4 h-4" />
                        Add Students
                    </Link>
                </div>
            ) : (
                <div className="card bg-white shadow-md">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-6">
                            <button
                                onClick={handleSaveClick}
                                disabled={saving}
                                className="btn btn-primary gap-2 text-white text-xs martian-mono font-medium rounded-none"
                            >
                                {saving ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <IoSave className="w-4 h-4" />
                                        Save All Grades
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="table table-zebra w-full">
                                <thead>
                                    <tr>
                                        <th className="text-sm">Student</th>
                                        <th className="text-sm">Student ID</th>
                                        <th className="text-sm">1st Quarter</th>
                                        <th className="text-sm">2nd Quarter</th>
                                        <th className="text-sm">Final Grade</th>
                                        <th className="text-sm">Rating</th>
                                        <th className="text-sm">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gradeForms.map((form) => (
                                        <tr key={form.studentId}>
                                            <td className="font-semibold text-xs martian-mono text-primary">
                                                {form.studentName}
                                            </td>
                                            <td className="text-xs text-zinc-600 italic">
                                                {form.studentId}
                                            </td>
                                            <td>
                                                {isFieldSubmitted(form.studentId, 'firstQuarterGrade') ? (
                                                    <span className={`font-bold ${getGradeColor(form.firstQuarterGrade)}`}>
                                                        {form.firstQuarterGrade || "—"}
                                                    </span>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        min="75"
                                                        max="100"
                                                        className={`input input-bordered rounded-none text-xs martian-mono input-sm w-20 ${getGradeColor(form.firstQuarterGrade)}`}
                                                        value={form.firstQuarterGrade}
                                                        onChange={(e) => handleGradeChange(form.studentId, 'firstQuarterGrade', e.target.value)}
                                                        placeholder="Grade"
                                                    />
                                                )}
                                            </td>
                                            <td>
                                                {isFieldSubmitted(form.studentId, 'secondQuarterGrade') ? (
                                                    <span className={`font-bold ${getGradeColor(form.secondQuarterGrade)}`}>
                                                        {form.secondQuarterGrade || "—"}
                                                    </span>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        min="75"
                                                        max="100"
                                                        className={`input input-bordered rounded-none text-xs martian-mono input-sm w-20 ${getGradeColor(form.secondQuarterGrade)}`}
                                                        value={form.secondQuarterGrade}
                                                        onChange={(e) => handleGradeChange(form.studentId, 'secondQuarterGrade', e.target.value)}
                                                        placeholder="Grade"
                                                    />
                                                )}
                                            </td>
                                            <td>
                                                <span className={`font-bold ${getGradeColor(form.finalGrade)}`}>
                                                    {form.finalGrade || "—"}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-xs font-medium text-primary martian-mono">
                                                    {form.rating || "—"}
                                                </span>
                                            </td>
                                            <td>
                                                {isFieldSubmitted(form.studentId, 'remarks') ? (
                                                    <span className="text-xs text-base-content/80">
                                                        {form.remarks || "—"}
                                                    </span>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        className="input input-bordered rounded-none text-xs martian-mono input-sm w-32"
                                                        value={form.remarks}
                                                        onChange={(e) => handleGradeChange(form.studentId, 'remarks', e.target.value)}
                                                        placeholder="Remarks"
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-bold text-sm mb-2 text-primary martian-mono">Grade Guidelines:</h4>
                            <ul className="text-xs italic text-gray-600 space-y-1">
                                <li>• Grades must be between 75-100</li>
                                <li>• Final grade is automatically calculated as the average of both quarters</li>
                                <li>• Rating is automatically assigned based on final grade:</li>
                                <li className="ml-4">  - &quot;With Highest Honors&quot;: 98-100%</li>
                                <li className="ml-4">  - &quot;With High Honors&quot;: 95-97%</li>
                                <li className="ml-4">  - &quot;With Honors&quot;: 90-94%</li>
                                <li>• Leave fields empty if grades are not yet available</li>
                                <li>• <strong>Once submitted, grades cannot be edited</strong> - only empty fields can be filled</li>
                                <li>• Click &quot;Save All Grades&quot; to submit the grade records</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <>
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-50"
                        onClick={() => setShowConfirmModal(false)}
                    />
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div className="modal-box max-w-md">
                            <div className="flex items-center gap-3 mb-4">
                                <HiExclamation className="w-6 h-6 text-warning" />
                                <h3 className="font-bold text-lg text-primary martian-mono">
                                    Confirm Grade Submission
                                </h3>
                            </div>
                            <p className="text-sm text-base-content/80 mb-6">
                                Are you sure you want to submit these grades? Once submitted, 
                                grades with values cannot be edited. Only empty fields can be 
                                filled in future submissions.
                            </p>
                            <div className="modal-action">
                                <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => setShowConfirmModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary btn-sm text-white"
                                    onClick={handleSaveGrades}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Submitting...
                                        </>
                                    ) : (
                                        "Confirm & Submit"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default StudentGradePage;