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
import StudentSettingsComponent from "@/components/student/StudentSettings";
import {
    HiUser,
    HiPhone,
    HiCalendar,
    HiGlobe,
    HiAcademicCap,
    HiOfficeBuilding,
    HiLocationMarker
} from "react-icons/hi";

const StudentSettingsPage: React.FC = () => {
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
                guardianContactNumber:
                    fetchedStudent.guardianContactNumber || "",
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
            errorToast(
                `Failed to update profile: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        } finally {
            setLoading(false);
        }
    }

    if (userLoading || initialLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (!fetchedStudent) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Student not found
                </h3>
                <p className="text-gray-500 mb-6">
                    Unable to load student data. Please try again.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-8">
            {/* Account Settings Section */}
            <div>
                <StudentSettingsComponent studentId={fetchedStudent.id!} />
            </div>

            {/* Profile Information Section */}
            <div>
                <div className="mb-6">
                    <h1 className="text-2xl martian-mono font-bold text-primary mb-2">
                        Profile Information
                    </h1>
                    <p className="text-gray-500 italic text-xs">
                        Update your personal information and contact details
                    </p>
                </div>

                <div className="mb-4 p-3 bg-blue-50 border border-blue-300 rounded text-blue-800 text-sm italic">
                    <strong>Note:</strong> Student ID, First Name, Last Name, Middle
                    Name, Suffix, Birth Date, and Sex cannot be changed. Contact the
                    administrator for these changes.
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information Section */}
                <div className="card bg-white shadow-md">
                    <div className="card-body">
                        <h2 className="card-title text-lg font-semibold mb-4 flex items-center gap-2 martian-mono text-primary">
                            Personal Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                         <FormInput
                                 id="firstName"
                                 name="firstName"
                                 type="text"
                                 icon={<HiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                 value={fetchedStudent.firstName || ""}
                                 onChange={() => {}}
                                 placeholder="First Name"
                                 disabled={true}
                             />
                             
                             <FormInput
                                 id="lastName"
                                 name="lastName"
                                 type="text"
                                 icon={<HiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                 value={fetchedStudent.lastName || ""}
                                 onChange={() => {}}
                                 placeholder="Last Name"
                                 disabled={true}
                             />
                             
                             <FormInput
                                 id="middleName"
                                 name="middleName"
                                 type="text"
                                 icon={<HiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                 value={fetchedStudent.middleName || ""}
                                 onChange={() => {}}
                                 placeholder="Middle Name"
                                 disabled={true}
                             />
                             
                             <FormInput
                                 id="suffix"
                                 name="suffix"
                                 type="text"
                                 icon={<HiAcademicCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                 value={fetchedStudent.suffix || ""}
                                 onChange={() => {}}
                                 placeholder="Suffix (Jr., Sr., etc.)"
                                 disabled={true}
                             />

                            <div>
                                <select
                                    name="sex"
                                    value={fetchedStudent.sex || ""}
                                    onChange={() => {}}
                                    disabled={true}
                                    className="select select-bordered select-sm w-full"
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
                                 icon={<HiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                 value={fetchedStudent.birthDate || ""}
                                 onChange={() => {}}
                                 placeholder="Birth Date"
                                 disabled={true}
                             />

                            <FormInput
                                id="birthPlace"
                                name="birthPlace"
                                type="text"
                                icon={<HiLocationMarker className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                value={form.birthPlace || ""}
                                onChange={handleChange}
                                placeholder="Birth Place"
                                disabled={loading}
                            />

                            <div>
                                <select
                                    name="civilStatus"
                                    value={form.civilStatus || ""}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="select select-bordered select-sm w-full"
                                >
                                    <option value="">
                                        Select Civil Status
                                    </option>
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
                                icon={<HiGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                value={form.nationality || ""}
                                onChange={handleChange}
                                placeholder="Nationality"
                                disabled={loading}
                            />

                            <FormInput
                                id="religion"
                                name="religion"
                                type="text"
                                icon={<HiAcademicCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                value={form.religion || ""}
                                onChange={handleChange}
                                placeholder="Religion"
                                disabled={loading}
                            />

                            <FormInput
                                id="motherTongue"
                                name="motherTongue"
                                type="text"
                                icon={<HiAcademicCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
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
                        <h2 className="card-title text-lg font-semibold mb-4 flex items-center gap-2 martian-mono text-primary">
                            Contact Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <FormInput
                                id="contactNumber"
                                name="contactNumber"
                                type="text"
                                icon={<HiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                value={form.contactNumber || ""}
                                onChange={handleChange}
                                placeholder="Contact Number"
                                disabled={loading}
                            />
                            
                            <FormInput
                                id="address"
                                name="address"
                                type="text"
                                icon={<HiLocationMarker className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
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
                        <h2 className="card-title text-lg font-semibold mb-4 flex items-center gap-2 martian-mono text-primary">
                            Father&apos;s Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormInput
                                id="fatherName"
                                name="fatherName"
                                type="text"
                                icon={<HiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                value={form.fatherName || ""}
                                onChange={handleChange}
                                placeholder="Father's Name"
                                disabled={loading}
                            />

                            <FormInput
                                id="fatherOccupation"
                                name="fatherOccupation"
                                type="text"
                                icon={<HiOfficeBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                value={form.fatherOccupation || ""}
                                onChange={handleChange}
                                placeholder="Father's Occupation"
                                disabled={loading}
                            />

                            <FormInput
                                id="fatherContactNumber"
                                name="fatherContactNumber"
                                type="text"
                                icon={<HiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
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
                        <h2 className="card-title text-lg font-semibold mb-4 flex items-center gap-2 martian-mono text-primary">
                            Mother&apos;s Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormInput
                                id="motherName"
                                name="motherName"
                                type="text"
                                icon={<HiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                value={form.motherName || ""}
                                onChange={handleChange}
                                placeholder="Mother's Name"
                                disabled={loading}
                            />

                            <FormInput
                                id="motherOccupation"
                                name="motherOccupation"
                                type="text"
                                icon={<HiOfficeBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                value={form.motherOccupation || ""}
                                onChange={handleChange}
                                placeholder="Mother's Occupation"
                                disabled={loading}
                            />

                            <FormInput
                                id="motherContactNumber"
                                name="motherContactNumber"
                                type="text"
                                icon={<HiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
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
                        <h2 className="card-title text-lg font-semibold mb-4 flex items-center gap-2 martian-mono text-primary">
                            Guardian&apos;s Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormInput
                                id="guardianName"
                                name="guardianName"
                                type="text"
                                icon={<HiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                value={form.guardianName || ""}
                                onChange={handleChange}
                                placeholder="Guardian's Name"
                                disabled={loading}
                            />

                            <FormInput
                                id="guardianOccupation"
                                name="guardianOccupation"
                                type="text"
                                icon={<HiOfficeBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                value={form.guardianOccupation || ""}
                                onChange={handleChange}
                                placeholder="Guardian's Occupation"
                                disabled={loading}
                            />

                            <FormInput
                                id="guardianContactNumber"
                                name="guardianContactNumber"
                                type="text"
                                icon={<HiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
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
        </div>
    );
};

export default StudentSettingsPage;
