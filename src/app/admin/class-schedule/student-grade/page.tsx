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

    // Handle grade input changes
    const handleGradeChange = (studentId: string, field: keyof GradeFormData, value: string | number) => {
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

    // Handle save grades
    const handleSaveGrades = async () => {
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

        try {
            setSaving(true);

            // Convert grade forms to StudentGrade objects
            const updatedGrades: StudentGrade[] = gradeForms
                .filter(form => form.firstQuarterGrade !== "" || form.secondQuarterGrade !== "")
                .map(form => ({
                    id: existingGrades.find(g => g.studentId === form.studentId)?.id || `grade_${form.studentId}`,
                    studentId: form.studentId,
                    studentName: form.studentName,
                    firstQuarterGrade: Number(form.firstQuarterGrade) || 0,
                    secondQuarterGrade: Number(form.secondQuarterGrade) || 0,
                    finalGrade: Number(form.finalGrade) || 0,
                    rating: form.rating,
                    remarks: form.remarks,
                    subjectRecordId: subjectRecord.id,
                    subjectName: subjectRecord.subjectName,
                    gradeLevel: subjectRecord.gradeLevel,
                    semester: subjectRecord.semester,
                    schoolYear: subjectRecord.schoolYear,
                    teacherId: subjectRecord.teacherId,
                    teacherName: subjectRecord.teacherName,
                    createdAt: new Date().toISOString(),
                }));

            // Update subject record with new grades
            await subjectRecordService.updateSubjectRecord(subjectRecord.id, {
                studentGrades: updatedGrades
            });

            // Log grade updates for each student
            for (const grade of updatedGrades) {
                if (grade.finalGrade > 0) {
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
                                onClick={handleSaveGrades}
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
                                                <input
                                                    type="number"
                                                    min="75"
                                                    max="100"
                                                    className={`input input-bordered rounded-none text-xs martian-mono input-sm w-20 ${getGradeColor(form.firstQuarterGrade)}`}
                                                    value={form.firstQuarterGrade}
                                                    onChange={(e) => handleGradeChange(form.studentId, 'firstQuarterGrade', e.target.value)}
                                                    placeholder="Grade"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="75"
                                                    max="100"
                                                    className={`input input-bordered rounded-none text-xs martian-mono input-sm w-20 ${getGradeColor(form.secondQuarterGrade)}`}
                                                    value={form.secondQuarterGrade}
                                                    onChange={(e) => handleGradeChange(form.studentId, 'secondQuarterGrade', e.target.value)}
                                                    placeholder="Grade"
                                                />
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
                                                <input
                                                    type="text"
                                                    className="input input-bordered rounded-none text-xs martian-mono input-sm w-32"
                                                    value={form.remarks}
                                                    onChange={(e) => handleGradeChange(form.studentId, 'remarks', e.target.value)}
                                                    placeholder="Remarks"
                                                />
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
                                <li>• Click &quot;Save All Grades&quot; to update the grade records</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentGradePage;