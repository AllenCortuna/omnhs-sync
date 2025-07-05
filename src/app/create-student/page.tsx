"use client";
// React and Firebase imports
import React, { useState } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import {
    collection,
    doc,
    getDocs,
    query,
    setDoc,
    where,
} from "firebase/firestore";
import { auth, db } from "../../../firebase";

// Component imports
import { FormInput, FormSelect, CreateButton } from "../../components/common";

// Toast imports
import { successToast, errorToast } from "../../../config/toast";

// Icon imports from react-icons
import {
    MdAdd,
} from "react-icons/md";

/**
 * @file CreateStudent.tsx - Component for creating new student accounts
 * @module CreateStudent
 * 
 * @description
 * This component provides a form for creating new student accounts.
 * It handles:
 * 1. Collection of student information including personal details and credentials
 * 2. Client-side validation of form data
 * 3. Creation of student account in Firebase Authentication
 * 4. Storage of student profile data in Firestore
 * 5. Authentication flow:
 *    - Creates new student user account
 *    - Immediately signs out the new account
 * 6. Success/error message display
 *
 * @requires react
 * @requires firebase/auth
 * @requires firebase/firestore
 * @requires react-icons/md
 * @requires ../../../firebase
 */

interface AdminAddAccountFormData {
    email: string;
    password: string;
    confirmPassword: string;
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
 * CreateStudent Component
 * Renders a form for creating new student accounts with personal information and credentials
 * @returns {JSX.Element} The rendered CreateStudent component
 */
const CreateStudent: React.FC = () => {
    // Form data state containing student details and credentials
    const [formData, setFormData] = useState<AdminAddAccountFormData>({
        email: "",
        password: "",
        confirmPassword: "",
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



    // Password visibility toggle states
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState<boolean>(false);

    /**
     * Updates form data state when input fields change
     * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - Input change event
     */
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ): void => {
        const { name, value } = e.target;
        console.log(`Field ${name} changed to:`, value);
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    /**
     * Validates form data before submission
     * Checks:
     * - Required fields
     * - Student ID format
     * - Email format
     * - Password requirements
     * @returns {Promise<boolean>} True if validation passes, false otherwise
     */
    const validateForm = async (): Promise<boolean> => {
        // Check if student ID contains spaces
        if (formData.studentID.includes(" ")) {
            errorToast("Student ID must not contain spaces");
            return false;
        }

        //validate email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errorToast("Email is not valid");
            return false;
        }

        if (
            !formData.email ||
            !formData.password ||
            !formData.confirmPassword ||
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

        // Check if passwords match
        if (formData.password !== formData.confirmPassword) {
            errorToast("Passwords do not match");
            return false;
        }

        // Check password length (aligning with minLength=8 in JSX)
        if (formData.password.length < 8) {
            errorToast("Password must be at least 8 characters long");
            return false;
        }

        // All checks passed
        return true;
    };

    /**
     * Handles form submission to create new student account
     * Steps:
     * 1. Validates form data
     * 2. Checks for existing student ID
     * 3. Creates Firebase auth account
     * 4. Stores student profile in Firestore
     * 5. Signs out new account
     * @param {React.FormEvent<HTMLFormElement>} e - Form submission event
     */
    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ): Promise<void> => {
        e.preventDefault();
        setLoading(true);

        //check if studentID is already in the database
        const studentIDRef = query(
            collection(db, "students"),
            where("studentID", "==", formData.studentID)
        );
        const studentIDDoc = await getDocs(studentIDRef);
        console.log("studentIDDoc ===>", studentIDDoc.docs.length > 0);
        if (studentIDDoc.docs.length > 0) {
            errorToast("Student ID already exists");
            setLoading(false);
            return;
        }

        // Validate form data
        if (!validateForm()) {
            setLoading(false);
            return;
        }

        try {
            // Create Firebase auth account
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );
            const newUser = userCredential.user;

            // Store student profile in Firestore
            await setDoc(doc(db, "students", newUser.uid), {
                email: formData.email,
                studentID: formData.studentID,
                firstName: formData.firstName,
                lastName: formData.lastName,
                middleName: formData.middleName,
                suffix: formData?.suffix || "",
                gender: formData.gender,
                birthDate: formData.birthDate,
                address: formData.address,
                uid: newUser.uid,
                createdAt: new Date().toISOString(),
                role: "student",
            });

            // Sign out new account
            await signOut(auth);

            successToast("Account created successfully!");

            // Reset form
            setFormData({
                email: "",
                password: "",
                confirmPassword: "",
                studentID: "",
                firstName: "",
                lastName: "",
                middleName: "",
                suffix: "",
                gender: "",
                birthDate: "",
                address: "",
            });
        } catch (error) {
            console.error("Error creating account:", error);

            // Handle specific Firebase auth errors
            let errorMessage = "Failed to create account. Please try again.";
            switch ((error as { code: string }).code) {
                case "auth/email-already-in-use":
                    errorMessage = "This email address is already registered.";
                    break;
                case "auth/invalid-email":
                    errorMessage = "The email address is not valid.";
                    break;
                case "auth/weak-password":
                    errorMessage =
                        "The password is too weak. Please choose a stronger password.";
                    break;
            }
            errorToast(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // JSX Rendering
    return (
        <div className="min-h-screen overflow-scroll flex items-center justify-center p-4 text-zinc-700">
            <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
                <div className="card-body border">
                    {/* Card Header: Icon and Title */}
                    <div className="flex flex-row gap-5 mx-auto items-center mb-6">
                        {" "}
                        {/* Centered items and added items-center */}
                        <div className="flex items-center justify-center">
                            <div className="avatar placeholder">
                                <div className="bg-primary text-primary-content rounded-full w-10 h-10 flex items-center justify-center">
                                    {" "}
                                    {/* Ensured icon is centered */}
                                    <MdAdd className="text-xl" />
                                </div>
                            </div>
                        </div>
                        <h2 className="card-title justify-center text-lg font-bold">
                            {" "}
                            {/* Removed mb-6 from here */}
                            Create New Student Account
                        </h2>
                    </div>
                    {/* Account Creation Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Personal Information Section - 2 Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Email Input Field */}
                            <div className="form-control">
                                <label className="label" htmlFor="email-input">
                                    <span className="text-xs text-zinc-700">
                                        Email
                                    </span>
                                </label>
                                <FormInput
                                    id="email-input"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter email address"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            {/* Student ID Input Field */}
                            <div className="form-control">
                                <label
                                    className="label"
                                    htmlFor="studentID-input"
                                >
                                    <span className="text-xs text-zinc-700">
                                        Student ID
                                    </span>
                                </label>
                                <FormInput
                                    id="studentID-input"
                                    name="studentID"
                                    type="text"
                                    value={formData.studentID}
                                    onChange={handleChange}
                                    placeholder="Enter student ID"
                                    className="uppercase"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            {/* First Name Input Field */}
                            <div className="form-control">
                                <label
                                    className="label"
                                    htmlFor="firstName-input"
                                >
                                    <span className="text-xs text-zinc-700">
                                        First Name
                                    </span>
                                </label>
                                <FormInput
                                    id="firstName-input"
                                    name="firstName"
                                    type="text"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="Enter first name"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            {/* Last Name Input Field */}
                            <div className="form-control">
                                <label
                                    className="label"
                                    htmlFor="lastName-input"
                                >
                                    <span className="text-xs text-zinc-700">
                                        Last Name
                                    </span>
                                </label>
                                <FormInput
                                    id="lastName-input"
                                    name="lastName"
                                    type="text"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Enter last name"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            {/* Middle Name Input Field */}
                            <div className="form-control">
                                <label
                                    className="label"
                                    htmlFor="middleName-input"
                                >
                                    <span className="text-xs text-zinc-700">
                                        Middle Name
                                    </span>
                                </label>
                                <FormInput
                                    id="middleName-input"
                                    name="middleName"
                                    type="text"
                                    value={formData.middleName}
                                    onChange={handleChange}
                                    placeholder="Enter middle name"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            {/* Suffix Input Field */}
                            <div className="form-control">
                                <label className="label" htmlFor="suffix-input">
                                    <span className="text-xs text-zinc-700">
                                        Suffix
                                    </span>
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
                                    <span className="text-xs text-zinc-700">
                                        Gender
                                    </span>
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
                                {/* Debug: Show current gender value */}
                                {process.env.NODE_ENV === 'development' && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        Debug - Current gender: &quot;{formData.gender}&quot;
                                    </div>
                                )}
                            </div>

                            {/* Birth Date Input Field */}
                            <div className="form-control">
                                <label
                                    className="label"
                                    htmlFor="birthDate-input"
                                >
                                    <span className="text-xs text-zinc-700">
                                        Birth Date
                                    </span>
                                </label>
                                <FormInput
                                    id="birthDate-input"
                                    name="birthDate"
                                    type="date"
                                    value={formData.birthDate}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Address Input Field - Full Width */}
                        <div className="form-control">
                            <label className="label" htmlFor="address-input">
                                <span className="text-xs text-zinc-700">
                                    Address
                                </span>
                            </label>
                            <FormInput
                                id="address-input"
                                name="address"
                                type="text"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter complete address"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Password Section - 2 Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Password Input Field */}
                            <div className="form-control">
                                <label
                                    className="label"
                                    htmlFor="password-input"
                                >
                                    <span className="text-xs text-zinc-700">
                                        Password
                                    </span>
                                </label>
                                <FormInput
                                    id="password-input"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter password"
                                    required
                                    disabled={loading}
                                    minLength={8}
                                    showPassword={showPassword}
                                    onTogglePassword={() => setShowPassword(!showPassword)}
                                />
                                <label className="label">
                                    <span className="label-text-alt text-xs text-base-content/60">
                                        Minimum 8 characters
                                    </span>
                                </label>
                            </div>

                            {/* Confirm Password Input Field */}
                            <div className="form-control">
                                <label
                                    className="label"
                                    htmlFor="confirmPassword-input"
                                >
                                    <span className="text-xs text-zinc-700">
                                        Confirm Password
                                    </span>
                                </label>
                                <FormInput
                                    id="confirmPassword-input"
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm password"
                                    required
                                    disabled={loading}
                                    minLength={8}
                                    showPassword={showConfirmPassword}
                                    onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="form-control mt-6">
                            <CreateButton loading={loading} />
                        </div>
                    </form>
                    </div>
            </div>
        </div>
    );
};

export default CreateStudent;
