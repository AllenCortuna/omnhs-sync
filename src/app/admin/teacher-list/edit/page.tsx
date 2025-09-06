"use client";
import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "../../../../../firebase";
import { FormInput, CreateButton, BackButton } from "@/components/common";
import { successToast, errorToast } from "@/config/toast";
import { logService } from "@/services/logService";
import type { Teacher } from "@/interface/user";
import {
    HiUser,
    HiPhone,
    HiIdentification,
    HiMail,
    HiLocationMarker,
    HiAcademicCap,
} from "react-icons/hi";

const EditTeacher: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [form, setForm] = useState<Partial<Teacher>>({});
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Fetch teacher data
    useEffect(() => {
        const fetchTeacher = async () => {
            if (!id) return;
            
            try {
                setInitialLoading(true);
                const teacherRef = doc(db, "teachers", id);
                const teacherDoc = await getDoc(teacherRef);
                if (teacherDoc.exists()) {
                    const teacherData = { id: teacherDoc.id, ...teacherDoc.data() } as unknown as Teacher;
                    setTeacher(teacherData);
                    setForm(teacherData);
                } else {
                    errorToast("Teacher not found");
                    router.push("/admin/teacher-list");
                }
            } catch (error) {
                console.error("Error fetching teacher:", error);
                errorToast("Failed to load teacher data");
                router.push("/admin/teacher-list");
            } finally {
                setInitialLoading(false);
            }
        };
        
        fetchTeacher();
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
        if (!teacher || !id) {
            errorToast("Teacher data not available");
            return;
        }

        setLoading(true);
        try {
            // Update teacher document in Firestore
            const teacherRef = doc(db, "teachers", id);
            await updateDoc(teacherRef, {
                ...form,
                updatedAt: new Date().toISOString(),
            });

            // Log the teacher update
            await logService.logTeacherUpdated(
                teacher.employeeId,
                `${form.firstName || teacher.firstName} ${form.lastName || teacher.lastName}`,
                'Admin'
            );

            successToast("Teacher updated successfully!");
            router.push("/admin/teacher-list");
        } catch (error) {
            console.error("Teacher update error:", error);
            errorToast(
                `Failed to update teacher: ${
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

    if (!teacher) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Teacher not found
                </h3>
                <p className="text-gray-500 mb-6">
                    Unable to load teacher data. Please try again.
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
                            Edit Teacher
                        </h1>
                        <p className="text-gray-600">
                            Update teacher information and details
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information Section */}
                <div className="card bg-white shadow-md">
                    <div className="card-body">
                        <h2 className="card-title text-lg font-semibold mb-4 flex items-center gap-2">
                            <HiIdentification className="w-5 h-5 text-accent" />
                            Basic Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormInput
                                id="employeeId"
                                name="employeeId"
                                type="text"
                                icon={<HiIdentification className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                value={form.employeeId || ""}
                                onChange={handleChange}
                                placeholder="Employee ID"
                                disabled={true}
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
                                required
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
                                id="designation"
                                name="designation"
                                type="text"
                                icon={<HiAcademicCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />}
                                value={form.designation || ""}
                                onChange={handleChange}
                                placeholder="Designation/Position"
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Information Section */}
                <div className="card bg-white shadow-md">
                    <div className="card-body">
                        <h2 className="card-title text-lg font-semibold mb-4 flex items-center gap-2">
                            <HiPhone className="w-5 h-5 text-accent" />
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

                <div className="flex justify-end gap-4">
                    <CreateButton
                        loading={loading}
                        buttonText="Update Teacher"
                        loadingText="Updating Teacher..."
                    />
                </div>
            </form>
        </div>
    );
};

export default EditTeacher; 