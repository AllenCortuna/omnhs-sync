"use client";
import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../../../../../firebase";
import { FormInput, CreateButton, FormSelect, BackButton } from "@/components/common";
import { strandService } from "@/services/strandService";
import { useSaveUserData } from "@/hooks";
import { successToast, errorToast } from "@/config/toast";
import type { Enrollment } from "@/interface/info";
import { useStudentByEmail } from "@/hooks/useStudentByEmail";
import { useRouter, useSearchParams } from "next/navigation";

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

async function deleteFileFromStorage(fileUrl: string): Promise<void> {
    try {
        if (!fileUrl) return;
        
        // Extract the path from the URL
        const urlParts = fileUrl.split('/');
        const pathIndex = urlParts.findIndex(part => part === 'o') + 1;
        const encodedPath = urlParts[pathIndex];
        const decodedPath = decodeURIComponent(encodedPath);
        
        const storageRef = ref(storage, decodedPath);
        await deleteObject(storageRef);
        console.log('File deleted successfully:', decodedPath);
    } catch (error) {
        console.error('Error deleting file:', error);
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

const EditEnrollment: React.FC = () => {
    const { userData, isLoading: userLoading } = useSaveUserData({
        role: "student",
    });
    const email =
        typeof userData === "object" && userData && "email" in userData
            ? userData.email
            : undefined;
    const { student: fetchedStudent } = useStudentByEmail(email);
    const [strands, setStrands] = useState<{ value: string; label: string }[]>([]);
    const [form, setForm] = useState<Partial<Enrollment>>({});
    const [clearanceFile, setClearanceFile] = useState<File | null>(null);
    const [gradesFile, setGradesFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const enrollmentId = searchParams.get('id');

    // Fetch strands
    useEffect(() => {
        strandService
            .getAllStrands()
            .then((data) => setStrands(data.map((s) => ({ value: s.id, label: s.strandName }))))
            .catch((error) => {
                console.error('Error fetching strands:', error);
                setStrands([]);
            });
    }, []);

    // Fetch enrollment data
    useEffect(() => {
        const fetchEnrollment = async () => {
            if (!enrollmentId || !userData || userLoading) return;

            // Defensive check for invalid enrollmentId
            if (enrollmentId === 'undefined' || enrollmentId === 'null') {
                errorToast("Invalid enrollment ID.");
                router.push("/students/enrollment");
                return;
            }

            try {
                setInitialLoading(true);
                const enrollmentRef = doc(db, "enrollment", enrollmentId);
                const enrollmentDoc = await getDoc(enrollmentRef);

                if (!enrollmentDoc.exists()) {
                    errorToast("Enrollment not found");
                    router.push("/students/enrollment");
                    return;
                }

                const enrollmentData = { id: enrollmentDoc.id, ...enrollmentDoc.data() } as Enrollment;

                // Verify this enrollment belongs to the current student
                if (enrollmentData.studentId !== (userData as { studentId: string }).studentId) {
                    errorToast("You can only edit your own enrollments");
                    router.push("/students/enrollment");
                    return;
                }

                // Only allow editing pending enrollments
                if (enrollmentData.status !== "pending") {
                    errorToast("Only pending enrollments can be edited");
                    router.push("/students/enrollment");
                    return;
                }

                setEnrollment(enrollmentData);
                setForm({
                    strandId: enrollmentData.strandId,
                    schoolYear: enrollmentData.schoolYear,
                    semester: enrollmentData.semester,
                    isPWD: enrollmentData.isPWD,
                    returningStudent: enrollmentData.returningStudent,
                    lastGradeLevel: enrollmentData.lastGradeLevel || "",
                    lastSchoolAttended: enrollmentData.lastSchoolAttended || "",
                    lastSchoolYear: enrollmentData.lastSchoolYear || "",
                });
            } catch (error) {
                console.error('Error fetching enrollment:', error);
                errorToast("Failed to load enrollment data");
                router.push("/students/enrollment");
            } finally {
                setInitialLoading(false);
            }
        };

        fetchEnrollment();
    }, [enrollmentId, userData, userLoading, router]);

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

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!userData || userLoading || !enrollment) {
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

        setLoading(true);
        try {
            let clearanceUrl = enrollment.clearance || "";
            let gradesUrl = enrollment.copyOfGrades || "";
            
            console.log('Starting file uploads...');
            console.log('Clearance file:', clearanceFile);
            console.log('Grades file:', gradesFile);
            
            // Only upload new clearance file if a new file is provided
            if (clearanceFile) {
                // Delete old clearance file if it exists
                if (enrollment.clearance) {
                    try {
                        await deleteFileFromStorage(enrollment.clearance);
                        console.log('Old clearance file deleted successfully');
                    } catch (error) {
                        console.warn('Failed to delete old clearance file:', error);
                    }
                }
                
                const ext = getFileExtension(clearanceFile.name);
                const clearancePath = `enrollment/clearance/${userData.studentId}_${Date.now()}.${ext}`;
                console.log('Uploading new clearance to:', clearancePath);
                clearanceUrl = await uploadFileToStorage(clearanceFile, clearancePath);
                console.log('New clearance uploaded successfully:', clearanceUrl);
            } else {
                // Keep existing clearance file if no new file is provided
                clearanceUrl = enrollment.clearance || "";
                console.log('Keeping existing clearance file:', clearanceUrl);
            }
            
            // Only upload new grades file if a new file is provided
            if (gradesFile) {
                // Delete old grades file if it exists
                if (enrollment.copyOfGrades) {
                    try {
                        await deleteFileFromStorage(enrollment.copyOfGrades);
                        console.log('Old grades file deleted successfully');
                    } catch (error) {
                        console.warn('Failed to delete old grades file:', error);
                    }
                }
                
                const ext = getFileExtension(gradesFile.name);
                const gradesPath = `enrollment/grades/${userData.studentId}_${Date.now()}.${ext}`;
                console.log('Uploading new grades to:', gradesPath);
                gradesUrl = await uploadFileToStorage(gradesFile, gradesPath);
                console.log('New grades uploaded successfully:', gradesUrl);
            } else {
                // Keep existing grades file if no new file is provided
                gradesUrl = enrollment.copyOfGrades || "";
                console.log('Keeping existing grades file:', gradesUrl);
            }
            
            // Update enrollment in Firestore
            console.log('Updating enrollment:', enrollment.id);
            const enrollmentRef = doc(db, "enrollment", enrollmentId || "");
            await updateDoc(enrollmentRef, {
                strandId: form.strandId || "",
                semester: form.semester || "",
                schoolYear: form.schoolYear || "",
                clearance: clearanceUrl,
                copyOfGrades: gradesUrl,
                isPWD: !!form.isPWD,
                returningStudent: !!form.returningStudent,
                lastGradeLevel: form.lastGradeLevel || "",
                lastSchoolAttended: form.lastSchoolAttended || "",
                lastSchoolYear: form.lastSchoolYear || "",
                updatedAt: new Date().toISOString(),
            });
            successToast("Enrollment updated successfully!");
            router.push("/students/enrollment");
        } catch (error) {
            console.error("Enrollment update error:", error);
            errorToast(`Failed to update enrollment: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    }

    if (userLoading || initialLoading) {
        return <div className="flex justify-center items-center min-h-screen">
            <span className="loading loading-spinner loading-lg"></span>
        </div>;
    }

    if (!enrollment) {
        return <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Enrollment not found</h3>
            <p className="text-gray-500 mb-6">The enrollment you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to edit it.</p>
            <BackButton />
        </div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h2 className="text-lg font-bold mb-4">Edit Enrollment</h2>
            <BackButton />
            <hr className="my-4" />
            
            <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded text-blue-800 text-sm">
                <strong>Note:</strong> You can only edit pending enrollments. Once approved or rejected, enrollments cannot be modified.
            </div>
            
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
                            {enrollment.clearance && !clearanceFile && <span className="text-blue-600">✓ Current file uploaded</span>}
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
                            {enrollment.copyOfGrades && !gradesFile && <span className="text-blue-600">✓ Current file uploaded</span>}
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
                    loading={loading}
                    buttonText="Update Enrollment"
                    loadingText="Updating..."
                />
            </form>
        </div>
    );
};

export default EditEnrollment; 