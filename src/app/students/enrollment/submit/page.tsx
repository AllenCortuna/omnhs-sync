"use client";
import React, { useState, useEffect } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../../../firebase";
import { FormInput, CreateButton, FormSelect, BackButton } from "@/components/common";
import { strandService } from "@/services/strandService";
import { useSaveUserData } from "@/hooks";
import { successToast, errorToast } from "@/config/toast";
import type { Enrollment } from "@/interface/info";
import { useStudentByEmail } from "@/hooks/useStudentByEmail";
import { useRouter } from "next/navigation";

function getFileExtension(filename: string): string {
    return filename.split(".").pop() || "";
}

async function uploadFileToStorage(file: File, path: string): Promise<string> {
    try {
        console.log(`Uploading file to path: ${path}`);
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        console.log('Upload successful:', snapshot);
        const downloadURL = await getDownloadURL(storageRef);
        console.log('Download URL:', downloadURL);
        return downloadURL;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

async function checkExistingEnrollment(studentId: string, semester: string, schoolYear: string): Promise<boolean> {
    try {
        console.log(`Checking existing enrollment for student ${studentId}, semester ${semester}, school year ${schoolYear}`);
        
        const enrollmentQuery = query(
            collection(db, "enrollment"),
            where("studentId", "==", studentId),
            where("semester", "==", semester),
            where("schoolYear", "==", schoolYear)
        );
        
        const querySnapshot = await getDocs(enrollmentQuery);
        const exists = !querySnapshot.empty;
        
        console.log(`Existing enrollment found: ${exists}`);
        return exists;
    } catch (error) {
        console.error('Error checking existing enrollment:', error);
        throw error;
    }
}

function isInputElement(target: EventTarget): target is HTMLInputElement {
    return typeof target === "object" && target !== null && "checked" in target;
}

function validateFile(file: File): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif'
    ];
    
    if (file.size > maxSize) {
        errorToast(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
    }
    
    if (!allowedTypes.includes(file.type)) {
        errorToast(`File ${file.name} has unsupported format. Please use PDF or image files.`);
        return false;
    }
    
    return true;
}

const initialForm: Partial<Enrollment> = {
    gradeLevel: "",
    strandId: "",
    schoolYear: "",
    semester: "",
    clearance: undefined,
    copyOfGrades: undefined,
    isPWD: false,
    returningStudent: false,
    lastGradeLevel: "",
    lastSchoolAttended: "",
    lastSchoolYear: "",
};

const SEMESTER_OPTIONS = [
  { value: "1st", label: "1st Semester" },
  { value: "2nd", label: "2nd Semester" },
];

function getSchoolYearOptions(): { value: string; label: string }[] {
  const now = new Date();
  const thisYear = now.getFullYear();
  const lastYear = thisYear - 1;
  return [
    { value: `${lastYear}-${thisYear}`, label: `${lastYear}-${thisYear}` },
    { value: `${thisYear}-${thisYear + 1}`, label: `${thisYear}-${thisYear + 1}` },
  ];
}

const StudentEnrollment: React.FC = () => {
    const { userData, isLoading: userLoading } = useSaveUserData({
        role: "student",
    });
    const email =
        typeof userData === "object" && userData && "email" in userData
            ? userData.email
            : undefined;
    const { student: fetchedStudent } = useStudentByEmail(email);
    const [strands, setStrands] = useState<{ value: string; label: string }[]>([]);
    const [form, setForm] = useState<Partial<Enrollment>>(initialForm);
    const [clearanceFile, setClearanceFile] = useState<File | null>(null);
    const [gradesFile, setGradesFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [checkingDuplicate, setCheckingDuplicate] = useState(false);
    const router = useRouter();

    useEffect(() => {
        strandService
            .getAllStrands()
            .then((data) => setStrands(data.map((s) => ({ value: s.id, label: s.strandName }))))
            .catch((error) => {
                console.error('Error fetching strands:', error);
                setStrands([]);
            });
    }, []);

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) {
        const { name, value, type } = e.target;
        if (type === "checkbox" && isInputElement(e.target)) {
            setForm((prev) => ({
                ...prev,
                [name]: (e.target as HTMLInputElement).checked,
            }));
        } else {
            setForm((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    }

    // Check for duplicate enrollment when semester or school year changes
    useEffect(() => {
        if (userData && "studentId" in userData && form.semester && form.schoolYear) {
            const checkDuplicate = async () => {
                setCheckingDuplicate(true);
                try {
                    const exists = await checkExistingEnrollment(
                        userData.studentId,
                        form.semester || "",
                        form.schoolYear || ""
                    );
                    if (exists) {
                        errorToast(`You have already enrolled for ${form.semester} semester in ${form.schoolYear}. Only one enrollment per semester is allowed.`);
                    }
                } catch (error) {
                    console.error('Error checking duplicate enrollment:', error);
                } finally {
                    setCheckingDuplicate(false);
                }
            };
            
            checkDuplicate();
        }
    }, [userData, form.semester, form.schoolYear]);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, files } = e.target;
        if (!files || files.length === 0) return;
        
        const file = files[0];
        if (!validateFile(file)) {
            // Clear the input if validation fails
            e.target.value = '';
            return;
        }
        
        if (name === "clearance") {
            setClearanceFile(file);
            console.log('Clearance file selected:', file.name, file.type, file.size);
        }
        if (name === "copyOfGrades") {
            setGradesFile(file);
            console.log('Grades file selected:', file.name, file.type, file.size);
        }
    }

    function resetForm() {
        setForm(initialForm);
        setClearanceFile(null);
        setGradesFile(null);
        
        // Clear file inputs
        const clearanceInput = document.querySelector('input[name="clearance"]') as HTMLInputElement;
        const gradesInput = document.querySelector('input[name="copyOfGrades"]') as HTMLInputElement;
        if (clearanceInput) clearanceInput.value = '';
        if (gradesInput) gradesInput.value = '';
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!userData || userLoading) {
            errorToast("User data is still loading. Please wait.");
            return;
        }
        
        // Only allow if userData is a Student (has studentId)
        if (!("studentId" in userData)) {
            errorToast("User data is not a student");
            return;
        }

        // Validate required form fields
        if (!form.strandId || !form.schoolYear || !form.semester) {
            errorToast("Please fill in all required fields");
            return;
        }

        // Check for duplicate enrollment before proceeding
        try {
            const exists = await checkExistingEnrollment(
                userData.studentId,
                form.semester || "",
                form.schoolYear || ""
            );
            if (exists) {
                errorToast(`You have already enrolled for ${form.semester} semester in ${form.schoolYear}. Only one enrollment per semester is allowed.`);
                return;
            }
        } catch (error) {
            console.error("Error checking existing enrollment:", error);
            errorToast("Error checking existing enrollment. Please try again.");
            return;
        }

        setLoading(true);
        try {
            let clearanceUrl = "";
            let gradesUrl = "";
            
            console.log('Starting file uploads...');
            console.log('Clearance file:', clearanceFile);
            console.log('Grades file:', gradesFile);
            
            if (clearanceFile) {
                const ext = getFileExtension(clearanceFile.name);
                const clearancePath = `enrollment/clearance/${userData.studentId}_${Date.now()}.${ext}`;
                console.log('Uploading clearance to:', clearancePath);
                clearanceUrl = await uploadFileToStorage(clearanceFile, clearancePath);
                console.log('Clearance uploaded successfully:', clearanceUrl);
            }
            
            if (gradesFile) {
                const ext = getFileExtension(gradesFile.name);
                const gradesPath = `enrollment/grades/${userData.studentId}_${Date.now()}.${ext}`;
                console.log('Uploading grades to:', gradesPath);
                gradesUrl = await uploadFileToStorage(gradesFile, gradesPath);
                console.log('Grades uploaded successfully:', gradesUrl);
            }
            
            const enrollment: Enrollment = {
                id: "", // Firestore will generate
                studentId: userData.studentId,
                gradeLevel: form.gradeLevel || "",
                strandId: form.strandId || "",
                semester: form.semester || "",
                schoolYear: form.schoolYear || "",
                studentName: `${userData.lastName || ""}, ${userData.firstName || ""}`.trim(),
                clearance: clearanceUrl,
                copyOfGrades: gradesUrl,
                isPWD: !!form.isPWD,
                status: "pending",
                returningStudent: !!form.returningStudent,
                lastGradeLevel: form.lastGradeLevel || "",
                lastSchoolAttended: form.lastSchoolAttended || "",
                lastSchoolYear: form.lastSchoolYear || "",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            
            console.log('Saving enrollment to Firestore:', enrollment);
            await addDoc(collection(db, "enrollment"), enrollment);
            console.log('Enrollment saved successfully');
            
            successToast("Enrollment submitted successfully!");
            router.push("/students/enrollment");
            resetForm();
        } catch (error) {
            console.error("Enrollment submission error:", error);
            errorToast(`Failed to submit enrollment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    }

    // Check if current selection would create a duplicate
    const wouldCreateDuplicate = userData && 
        "studentId" in userData && 
        form.semester && 
        form.schoolYear;

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h2 className="text-lg font-bold mb-4">Student Enrollment</h2>
            <BackButton />
            <hr className="my-4" />
            {checkingDuplicate && (
                <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded text-blue-800 text-sm">
                    Checking for existing enrollment...
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                    id="studentId"
                    name="studentId"
                    type="text"
                    value={fetchedStudent?.studentId || ""}
                    onChange={() => {}}
                    placeholder="Student ID"
                    disabled={true}
                />
                <FormSelect
                    id="strandId"
                    name="strandId"
                    value={form.strandId || ""}
                    onChange={handleChange}
                    options={strands}
                    placeholder="Select Strand"
                    required
                    disabled={loading}
                />
                <FormSelect
                    id="gradeLevel"
                    name="gradeLevel"
                    value={form.gradeLevel || ""}
                    onChange={handleChange}
                    options={[
                        { value: "Grade 11", label: "Grade 11" },
                        { value: "Grade 12", label: "Grade 12" },
                    ]}
                    placeholder="Select Grade Level"
                    required
                    disabled={loading}
                />
                <FormSelect
                    id="schoolYear"
                    name="schoolYear"
                    value={form.schoolYear || ""}
                    onChange={handleChange}
                    options={getSchoolYearOptions()}
                    placeholder="Select School Year"
                    required
                    disabled={loading}
                />
                <FormSelect
                    id="semester"
                    name="semester"
                    value={form.semester || ""}
                    onChange={handleChange}
                    options={SEMESTER_OPTIONS}
                    placeholder="Select Semester"
                    required
                    disabled={loading}
                />

                {/* Show warning if duplicate would be created */}
                {wouldCreateDuplicate && (
                    <div className="p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
                        <strong>Note:</strong> You can only submit one enrollment per semester in each school year.
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {form.returningStudent && (
                        <>
                            <FormInput
                                id="lastGradeLevel"
                                name="lastGradeLevel"
                                type="text"
                                value={form.lastGradeLevel || ""}
                                onChange={handleChange}
                                placeholder="Last Grade Level"
                                disabled={loading}
                            />
                            <FormInput
                                id="lastSchoolAttended"
                                name="lastSchoolAttended"
                                type="text"
                                value={form.lastSchoolAttended || ""}
                                onChange={handleChange}
                                placeholder="Last School Attended"
                                disabled={loading}
                            />
                            <FormInput
                                id="lastSchoolYear"
                                name="lastSchoolYear"
                                type="text"
                                value={form.lastSchoolYear || ""}
                                onChange={handleChange}
                                placeholder="Last School Year"
                                disabled={loading}
                            />
                        </>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="isPWD"
                            checked={!!form.isPWD}
                            onChange={handleChange}
                            disabled={loading}
                            className="checkbox checkbox-xs"
                        />
                        <span className="text-xs">PWD</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="returningStudent"
                            checked={!!form.returningStudent}
                            onChange={handleChange}
                            disabled={loading}
                            className="checkbox checkbox-xs"
                        />
                        <span className="text-xs">Returning Student</span>
                    </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs mb-1">
                            Clearance (PDF/Image) {clearanceFile && <span className="text-green-600">✓ {clearanceFile.name}</span>}
                        </label>
                        <input
                            type="file"
                            name="clearance"
                            accept=".pdf,image/*"
                            onChange={handleFileChange}
                            disabled={loading}
                            className="file-input file-input-xs w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-xs mb-1">
                            Copy of Grades (PDF/Image) {gradesFile && <span className="text-green-600">✓ {gradesFile.name}</span>}
                        </label>
                        <input
                            type="file"
                            name="copyOfGrades"
                            accept=".pdf,image/*"
                            onChange={handleFileChange}
                            disabled={loading}
                            className="file-input file-input-xs w-full"
                        />
                    </div>
                </div>
                <CreateButton
                    loading={loading || checkingDuplicate}
                    buttonText="Submit Enrollment"
                    loadingText="Submitting..."
                />
            </form>
        </div>
    );
};

export default StudentEnrollment;