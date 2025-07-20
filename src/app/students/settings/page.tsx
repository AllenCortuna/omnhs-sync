"use client";
import React, { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import { FormInput, CreateButton } from "@/components/common";
import { useSaveUserData } from "@/hooks";
import { successToast, errorToast } from "@/config/toast";
import type { Student } from "@/interface/user";
import { useStudentByEmail } from "@/hooks/useStudentByEmail";
import { useRouter } from "next/navigation";
import { 
    HiUser, 
    HiPhone, 
    HiHeart,
    HiHome,
    HiIdentification
} from "react-icons/hi";

const StudentSettings: React.FC = () => {
    const { userData, isLoading: userLoading } = useSaveUserData({
        role: "student",
    });
    const email =
        typeof userData === "object" && userData && "email" in userData
            ? userData.email
            : undefined;
    const { student: fetchedStudent } = useStudentByEmail(email);
    const [form, setForm] = useState<Partial<Student>>({});
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const router = useRouter();

    // Initialize form with student data
    useEffect(() => {
        if (fetchedStudent && !initialLoading) {
            setForm({
                middleName: fetchedStudent.middleName || "",
                suffix: fetchedStudent.suffix || "",
                sex: fetchedStudent.sex || "",
                birthDate: fetchedStudent.birthDate || "",
                birthPlace: fetchedStudent.birthPlace || "",
                civilStatus: fetchedStudent.civilStatus || "",
                nationality: fetchedStudent.nationality || "",
                religion: fetchedStudent.religion || "",
                motherTongue: fetchedStudent.motherTongue || "",
                contactNumber: fetchedStudent.contactNumber || "",
                address: fetchedStudent.address || "",
                fatherName: fetchedStudent.fatherName || "",
                fatherOccupation: fetchedStudent.fatherOccupation || "",
                fatherContactNumber: fetchedStudent.fatherContactNumber || "",
                motherName: fetchedStudent.motherName || "",
                motherOccupation: fetchedStudent.motherOccupation || "",
                motherContactNumber: fetchedStudent.motherContactNumber || "",
                guardianName: fetchedStudent.guardianName || "",
                guardianOccupation: fetchedStudent.guardianOccupation || "",
                guardianContactNumber: fetchedStudent.guardianContactNumber || "",
            });
        }
    }, [fetchedStudent, initialLoading]);

    // Set initial loading to false when student data is loaded
    useEffect(() => {
        if (fetchedStudent) {
            setInitialLoading(false);
        }
    }, [fetchedStudent]);

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!userData || userLoading || !fetchedStudent) {
            errorToast("User data is still loading. Please wait.");
            return;
        }

        setLoading(true);
        try {
            // Update student document in Firestore
            const studentRef = doc(db, "students", fetchedStudent.id!);
            await updateDoc(studentRef, {
                ...form,
                updatedAt: new Date().toISOString(),
            });

            successToast("Profile updated successfully!");
            router.push("/students/dashboard");
        } catch (error) {
            console.error("Profile update error:", error);
            errorToast(`Failed to update profile: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    }

    if (userLoading || initialLoading) {
        return <div className="flex justify-center items-center min-h-screen">
            <span className="loading loading-spinner loading-lg"></span>
        </div>;
    }

    if (!fetchedStudent) {
        return <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Student not found</h3>
            <p className="text-gray-500 mb-6">Unable to load student data. Please try again.</p>
        </div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Student Settings</h1>
                <p className="text-gray-600">Update your personal information and contact details</p>
            </div>

            <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded text-blue-800 text-sm">
                <strong>Note:</strong> Student ID, First Name, and Last Name cannot be changed. Contact the administrator for these changes.
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information Section */}
                <div className="card bg-white shadow-md">
                    <div className="card-body">
                        <h2 className="card-title text-lg font-semibold mb-4 flex items-center gap-2">
                            <HiUser className="w-5 h-5 text-primary" />
                            Personal Information
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormInput
                                id="middleName"
                                name="middleName"
                                type="text"
                                value={form.middleName || ""}
                                onChange={handleChange}
                                placeholder="Middle Name"
                                disabled={loading}
                            />
                            
                            <FormInput
                                id="suffix"
                                name="suffix"
                                type="text"
                                value={form.suffix || ""}
                                onChange={handleChange}
                                placeholder="Suffix (Jr., Sr., etc.)"
                                disabled={loading}
                            />
                            
                            <div>
                                <label className="block text-xs mb-1 text-gray-600">Sex</label>
                                <select
                                    name="sex"
                                    value={form.sex || ""}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="select select-bordered select-xs w-full"
                                >
                                    <option value="">Select Sex</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            
                            <FormInput
                                id="birthDate"
                                name="birthDate"
                                type="date"
                                value={form.birthDate || ""}
                                onChange={handleChange}
                                placeholder="Birth Date"
                                disabled={loading}
                            />
                            
                            <FormInput
                                id="birthPlace"
                                name="birthPlace"
                                type="text"
                                value={form.birthPlace || ""}
                                onChange={handleChange}
                                placeholder="Birth Place"
                                disabled={loading}
                            />
                            
                            <div>
                                <label className="block text-xs mb-1 text-gray-600">Civil Status</label>
                                <select
                                    name="civilStatus"
                                    value={form.civilStatus || ""}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="select select-bordered select-xs w-full"
                                >
                                    <option value="">Select Civil Status</option>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Widowed">Widowed</option>
                                    <option value="Divorced">Divorced</option>
                                </select>
                            </div>
                            
                            <FormInput
                                id="nationality"
                                name="nationality"
                                type="text"
                                value={form.nationality || ""}
                                onChange={handleChange}
                                placeholder="Nationality"
                                disabled={loading}
                            />
                            
                            <FormInput
                                id="religion"
                                name="religion"
                                type="text"
                                value={form.religion || ""}
                                onChange={handleChange}
                                placeholder="Religion"
                                disabled={loading}
                            />
                            
                            <FormInput
                                id="motherTongue"
                                name="motherTongue"
                                type="text"
                                value={form.motherTongue || ""}
                                onChange={handleChange}
                                placeholder="Mother Tongue"
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Information Section */}
                <div className="card bg-white shadow-md">
                    <div className="card-body">
                        <h2 className="card-title text-lg font-semibold mb-4 flex items-center gap-2">
                            <HiPhone className="w-5 h-5 text-primary" />
                            Contact Information
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput
                                id="contactNumber"
                                name="contactNumber"
                                type="text"
                                value={form.contactNumber || ""}
                                onChange={handleChange}
                                placeholder="Contact Number"
                                disabled={loading}
                            />
                            
                            <FormInput
                                id="address"
                                name="address"
                                type="text"
                                value={form.address || ""}
                                onChange={handleChange}
                                placeholder="Complete Address"
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>

                {/* Father's Information Section */}
                <div className="card bg-white shadow-md">
                    <div className="card-body">
                        <h2 className="card-title text-lg font-semibold mb-4 flex items-center gap-2">
                            <HiIdentification className="w-5 h-5 text-primary" />
                            Father&apos;s Information
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormInput
                                id="fatherName"
                                name="fatherName"
                                type="text"
                                value={form.fatherName || ""}
                                onChange={handleChange}
                                placeholder="Father's Name"
                                disabled={loading}
                            />
                            
                            <FormInput
                                id="fatherOccupation"
                                name="fatherOccupation"
                                type="text"
                                value={form.fatherOccupation || ""}
                                onChange={handleChange}
                                placeholder="Father's Occupation"
                                disabled={loading}
                            />
                            
                            <FormInput
                                id="fatherContactNumber"
                                name="fatherContactNumber"
                                type="text"
                                value={form.fatherContactNumber || ""}
                                onChange={handleChange}
                                placeholder="Father's Contact Number"
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>

                {/* Mother's Information Section */}
                <div className="card bg-white shadow-md">
                    <div className="card-body">
                        <h2 className="card-title text-lg font-semibold mb-4 flex items-center gap-2">
                            <HiHeart className="w-5 h-5 text-primary" />
                            Mother&apos;s Information
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormInput
                                id="motherName"
                                name="motherName"
                                type="text"
                                value={form.motherName || ""}
                                onChange={handleChange}
                                placeholder="Mother's Name"
                                disabled={loading}
                            />
                            
                            <FormInput
                                id="motherOccupation"
                                name="motherOccupation"
                                type="text"
                                value={form.motherOccupation || ""}
                                onChange={handleChange}
                                placeholder="Mother's Occupation"
                                disabled={loading}
                            />
                            
                            <FormInput
                                id="motherContactNumber"
                                name="motherContactNumber"
                                type="text"
                                value={form.motherContactNumber || ""}
                                onChange={handleChange}
                                placeholder="Mother's Contact Number"
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>

                {/* Guardian's Information Section */}
                <div className="card bg-white shadow-md">
                    <div className="card-body">
                        <h2 className="card-title text-lg font-semibold mb-4 flex items-center gap-2">
                            <HiHome className="w-5 h-5 text-primary" />
                            Guardian&apos;s Information
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormInput
                                id="guardianName"
                                name="guardianName"
                                type="text"
                                value={form.guardianName || ""}
                                onChange={handleChange}
                                placeholder="Guardian's Name"
                                disabled={loading}
                            />
                            
                            <FormInput
                                id="guardianOccupation"
                                name="guardianOccupation"
                                type="text"
                                value={form.guardianOccupation || ""}
                                onChange={handleChange}
                                placeholder="Guardian's Occupation"
                                disabled={loading}
                            />
                            
                            <FormInput
                                id="guardianContactNumber"
                                name="guardianContactNumber"
                                type="text"
                                value={form.guardianContactNumber || ""}
                                onChange={handleChange}
                                placeholder="Guardian's Contact Number"
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>

                <CreateButton
                    loading={loading}
                    buttonText="Update Profile"
                    loadingText="Updating..."
                />
            </form>
        </div>
    );
};

export default StudentSettings; 