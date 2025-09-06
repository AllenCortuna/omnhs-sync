"use client";
import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "../../../../../firebase";
import { FormInput, CreateButton, BackButton } from "@/components/common";
import { successToast, errorToast } from "@/config/toast";
import { logService } from "@/services/logService";
import type { Student } from "@/interface/user";
import {
    HiUser,
    HiPhone,
    HiHeart,
    HiHome,
    HiIdentification,
    HiCalendar,
    HiGlobe,
    HiAcademicCap,
    HiOfficeBuilding,
    HiLocationMarker,
    HiMail,
} from "react-icons/hi";

const EditStudent: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    const [student, setStudent] = useState<Student | null>(null);
    const [form, setForm] = useState<Partial<Student>>({});
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Fetch student data
    useEffect(() => {
        const fetchStudent = async () => {
            if (!id) return;
            
            try {
                setInitialLoading(true);
                const studentRef = doc(db, "students", id);
                const studentDoc = await getDoc(studentRef);
                if (studentDoc.exists()) {
                    const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;
                    setStudent(studentData);
                    setForm(studentData);
                } else {
                    errorToast("Student not found");
                    router.push("/admin/student-list");
                }
            } catch (error) {
                console.error("Error fetching student:", error);
                errorToast("Failed to load student data");
                router.push("/admin/student-list");
            } finally {
                setInitialLoading(false);
            }
        };
        
        fetchStudent();
    }, [id, router]);

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
        if (!student || !id) {
            errorToast("Student data not available");
            return;
        }

        setLoading(true);
        try {
            // Update student document in Firestore
            const studentRef = doc(db, "students", id);
            await updateDoc(studentRef, {
                ...form,
                updatedAt: new Date().toISOString(),
            });

            // Log the student update
            await logService.logStudentUpdated(
                student.studentId,
                `${form.firstName || student.firstName} ${form.lastName || student.lastName}`,
                'Admin'
            );

            successToast("Student updated successfully!");
            router.push("/admin/student-list");
        } catch (error) {
            console.error("Student update error:", error);
            errorToast(
                `Failed to update student: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        } finally {
            setLoading(false);
        }
    }

    if (initialLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Student not found
                </h3>
                <p className="text-gray-500 mb-6">
                    Unable to load student data. Please try again.
                </p>
                <BackButton />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <BackButton />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Edit Student
                        </h1>
                        <p className="text-gray-600">
                            Update student information and details
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information Section */}
                <div className="card bg-white shadow-md">
                    <div className="card-body">
                        <h2 className="card-title text-lg font-semibold mb-4 flex items-center gap-2">
                            <HiIdentification className="w-5 h-5 text-primary" />
                            Basic Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormInput
                                id="studentId"
                                name="studentId"
                                type="text"
                                icon={<HiIdentification className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                value={form.studentId || ""}
                                onChange={handleChange}
                                placeholder="Student ID"
                                disabled={loading}
                                required
                            />

                            <FormInput
                                id="email"
                                name="email"
                                type="email"
                                icon={<HiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                value={form.email || ""}
                                onChange={handleChange}
                                placeholder="Email Address"
                                disabled={loading}
                            />

                            <FormInput
                                id="firstName"
                                name="firstName"
                                type="text"
                                icon={<HiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                value={form.firstName || ""}
                                onChange={handleChange}
                                placeholder="First Name"
                                disabled={loading}
                                required
                            />

                            <FormInput
                                id="lastName"
                                name="lastName"
                                type="text"
                                icon={<HiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                value={form.lastName || ""}
                                onChange={handleChange}
                                placeholder="Last Name"
                                disabled={loading}
                                required
                            />

                            <FormInput
                                id="middleName"
                                name="middleName"
                                type="text"
                                icon={<HiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                value={form.middleName || ""}
                                onChange={handleChange}
                                placeholder="Middle Name"
                                disabled={loading}
                            />

                            <FormInput
                                id="suffix"
                                name="suffix"
                                type="text"
                                icon={<HiAcademicCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                value={form.suffix || ""}
                                onChange={handleChange}
                                placeholder="Suffix (Jr., Sr., etc.)"
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>

                {/* Personal Information Section */}
                <div className="card bg-white shadow-md">
                    <div className="card-body">
                        <h2 className="card-title text-lg font-semibold mb-4 flex items-center gap-2">
                            <HiUser className="w-5 h-5 text-primary" />
                            Personal Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs mb-1 text-gray-600">
                                    Sex
                                </label>
                                <select
                                    name="sex"
                                    value={form.sex || ""}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="select select-bordered select-xs w-full"
                                    required
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
                                value={form.birthDate || ""}
                                onChange={handleChange}
                                placeholder="Birth Date"
                                disabled={loading}
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
                                <label className="block text-xs mb-1 text-gray-600">
                                    Civil Status
                                </label>
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
                        <h2 className="card-title text-lg font-semibold mb-4 flex items-center gap-2">
                            <HiPhone className="w-5 h-5 text-primary" />
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
                        <h2 className="card-title text-lg font-semibold mb-4 flex items-center gap-2">
                            <HiIdentification className="w-5 h-5 text-primary" />
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
                        <h2 className="card-title text-lg font-semibold mb-4 flex items-center gap-2">
                            <HiHeart className="w-5 h-5 text-primary" />
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
                        <h2 className="card-title text-lg font-semibold mb-4 flex items-center gap-2">
                            <HiHome className="w-5 h-5 text-primary" />
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

                <div className="flex justify-end gap-4">
                    <CreateButton
                        loading={loading}
                        buttonText="Update Student"
                        loadingText="Updating Student..."
                    />
                </div>
            </form>
        </div>
    );
};

export default EditStudent;