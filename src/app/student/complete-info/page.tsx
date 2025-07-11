"use client";
// React and Firebase imports
import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../../firebase";

// Component imports
import { FormInput, FormSelect, CreateButton } from "../../../components/common";

// Toast imports
import { successToast, errorToast } from "../../../../config/toast";

// Icon imports from react-icons
import {
    MdPerson,
    MdSchool,
    MdCalendarToday,
    MdLocationOn,
    MdCheck,
} from "react-icons/md";

/**
 * @file CompleteInfo.tsx - Student profile completion page
 * @module CompleteInfo
 * 
 * @description
 * This component allows students to complete their profile information
 * after creating their account. It handles:
 * 1. Collection of personal student information
 * 2. Client-side validation of form data
 * 3. Updating student profile in Firestore
 * 4. Redirect to dashboard after completion
 *
 * @requires react
 * @requires firebase/firestore
 * @requires react-icons/md
 * @requires ../../../firebase
 */

interface CompleteInfoFormData {
    studentID: string;
    firstName: string;
    lastName: string;
    middleName: string;
    suffix?: string;
    gender: string;
    birthDate: string;
    address: string;
}

/**
 * CompleteInfo Component
 * Renders a form for students to complete their profile information
 * @returns {JSX.Element} The rendered CompleteInfo component
 */
const CompleteInfo: React.FC = () => {
    const router = useRouter();
    
    // Form data state
    const [formData, setFormData] = useState<CompleteInfoFormData>({
        studentID: "",
        firstName: "",
        lastName: "",
        middleName: "",
        suffix: "",
        gender: "",
        birthDate: "",
        address: "",
    });

    // Loading state for async operations
    const [loading, setLoading] = useState<boolean>(false);

    /**
     * Updates form data state when input fields change
     * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - Input change event
     */
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ): void => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    /**
     * Validates form data before submission
     * @returns {boolean} True if validation passes, false otherwise
     */
    const validateForm = (): boolean => {
        // Check if student ID contains spaces
        if (formData.studentID.includes(" ")) {
            errorToast("Student ID must not contain spaces");
            return false;
        }

        // Check if all required fields are filled
        if (
            !formData.studentID ||
            !formData.firstName ||
            !formData.lastName ||
            !formData.middleName ||
            !formData.gender ||
            !formData.birthDate ||
            !formData.address
        ) {
            errorToast("All fields are required");
            return false;
        }

        return true;
    };

    /**
     * Handles form submission to complete student profile
     * @param {React.FormEvent<HTMLFormElement>} e - Form submission event
     */
    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ): Promise<void> => {
        e.preventDefault();
        setLoading(true);

        // Validate form data
        if (!validateForm()) {
            setLoading(false);
            return;
        }

        try {
            // Get current user
            const currentUser = auth.currentUser;
            if (!currentUser) {
                errorToast("Please sign in to complete your profile");
                setLoading(false);
                return;
            }

            // Update student profile in Firestore
            await updateDoc(doc(db, "students", currentUser.uid), {
                studentID: formData.studentID,
                firstName: formData.firstName,
                lastName: formData.lastName,
                middleName: formData.middleName,
                suffix: formData.suffix || "",
                gender: formData.gender,
                birthDate: formData.birthDate,
                address: formData.address,
                profileComplete: true, // Mark profile as complete
                updatedAt: new Date().toISOString(),
            });

            successToast("Profile completed successfully!");

            // Redirect to student dashboard
            router.push("/student/dashboard");
        } catch (error) {
            console.error("Error completing profile:", error);
            errorToast("Failed to complete profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
                <div className="card-body">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="avatar placeholder mb-4">
                            <div className="bg-primary text-primary-content rounded-full w-16 h-16 flex items-center justify-center">
                                <MdCheck className="text-2xl" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-base-content">Complete Your Profile</h1>
                        <p className="text-base-content/60 text-sm mt-2">
                            Please provide your personal information to complete your student profile
                        </p>
                    </div>

                    {/* Profile Completion Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Personal Information Section - 2 Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Student ID Input Field */}
                            <div className="form-control">
                                <label className="label" htmlFor="studentID-input">
                                    <span className="label-text font-medium">Student ID</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MdSchool className="text-base-content/40" />
                                    </div>
                                    <FormInput
                                        id="studentID-input"
                                        name="studentID"
                                        type="text"
                                        value={formData.studentID}
                                        onChange={handleChange}
                                        placeholder="Enter your student ID"
                                        className="pl-10 uppercase"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {/* First Name Input Field */}
                            <div className="form-control">
                                <label className="label" htmlFor="firstName-input">
                                    <span className="label-text font-medium">First Name</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MdPerson className="text-base-content/40" />
                                    </div>
                                    <FormInput
                                        id="firstName-input"
                                        name="firstName"
                                        type="text"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="Enter your first name"
                                        className="pl-10"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {/* Last Name Input Field */}
                            <div className="form-control">
                                <label className="label" htmlFor="lastName-input">
                                    <span className="label-text font-medium">Last Name</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MdPerson className="text-base-content/40" />
                                    </div>
                                    <FormInput
                                        id="lastName-input"
                                        name="lastName"
                                        type="text"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Enter your last name"
                                        className="pl-10"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {/* Middle Name Input Field */}
                            <div className="form-control">
                                <label className="label" htmlFor="middleName-input">
                                    <span className="label-text font-medium">Middle Name</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MdPerson className="text-base-content/40" />
                                    </div>
                                    <FormInput
                                        id="middleName-input"
                                        name="middleName"
                                        type="text"
                                        value={formData.middleName}
                                        onChange={handleChange}
                                        placeholder="Enter your middle name"
                                        className="pl-10"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {/* Suffix Input Field */}
                            <div className="form-control">
                                <label className="label" htmlFor="suffix-input">
                                    <span className="label-text font-medium">Suffix</span>
                                </label>
                                <FormInput
                                    id="suffix-input"
                                    name="suffix"
                                    type="text"
                                    value={formData.suffix || ""}
                                    onChange={handleChange}
                                    placeholder="e.g., Jr., Sr., III"
                                    disabled={loading}
                                />
                            </div>

                            {/* Gender Input Field */}
                            <div className="form-control">
                                <label className="label" htmlFor="gender-input">
                                    <span className="label-text font-medium">Gender</span>
                                </label>
                                <FormSelect
                                    id="gender-input"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    options={[
                                        { value: "Male", label: "Male" },
                                        { value: "Female", label: "Female" },
                                        { value: "Other", label: "Other" },
                                    ]}
                                    placeholder="Select gender"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            {/* Birth Date Input Field */}
                            <div className="form-control">
                                <label className="label" htmlFor="birthDate-input">
                                    <span className="label-text font-medium">Birth Date</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MdCalendarToday className="text-base-content/40" />
                                    </div>
                                    <FormInput
                                        id="birthDate-input"
                                        name="birthDate"
                                        type="date"
                                        value={formData.birthDate}
                                        onChange={handleChange}
                                        className="pl-10"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address Input Field - Full Width */}
                        <div className="form-control">
                            <label className="label" htmlFor="address-input">
                                <span className="label-text font-medium">Address</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MdLocationOn className="text-base-content/40" />
                                </div>
                                <FormInput
                                    id="address-input"
                                    name="address"
                                    type="text"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Enter your complete address"
                                    className="pl-10"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="form-control mt-6">
                            <CreateButton loading={loading} />
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="divider mt-6 mb-2"></div>
                    <div className="text-center">
                        <p className="text-xs text-base-content/60">
                            Complete your profile to access your student dashboard
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompleteInfo; 