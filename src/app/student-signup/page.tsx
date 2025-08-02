"use client";
// React and Firebase imports
import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebase";
import { useRouter } from "next/navigation";

// Component imports
import { FormInput, CreateButton, BackButton } from "@/components/common";

// Toast imports
import { successToast, errorToast } from "@/config/toast";

// Icon imports from react-icons
import {
    MdPerson,
    MdEmail,
    MdLock,
    MdVisibility,
    MdVisibilityOff,
} from "react-icons/md";

/**
 * @file StudentSignup.tsx - Student account creation page
 * @module StudentSignup
 *
 * @description
 * This component provides a form for students to create their accounts.
 * It handles:
 * 1. Email and password validation
 * 2. Firebase Authentication account creation
 * 3. Basic user data storage in Firestore
 * 4. Redirect to complete-info page after success
 * 5. Password visibility toggle
 *
 * @requires react
 * @requires firebase/auth
 * @requires firebase/firestore
 * @requires react-icons/md
 * @requires ../../firebase
 */

interface StudentSignupFormData {
    email: string;
    password: string;
    confirmPassword: string;
}

/**
 * StudentSignup Component
 * Renders a form for students to create their accounts
 * @returns {JSX.Element} The rendered StudentSignup component
 */
const StudentSignup: React.FC = () => {
    const router = useRouter();

    // Form data state
    const [formData, setFormData] = useState<StudentSignupFormData>({
        email: "",
        password: "",
        confirmPassword: "",
    });

    // Loading state for async operations
    const [loading, setLoading] = useState<boolean>(false);

    // Password visibility toggle states
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState<boolean>(false);

    /**
     * Updates form data state when input fields change
     * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
     */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
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
        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errorToast("Please enter a valid email address");
            return false;
        }

        // Check if all fields are filled
        if (
            !formData.email ||
            !formData.password ||
            !formData.confirmPassword
        ) {
            errorToast("All fields are required");
            return false;
        }

        // Check if passwords match
        if (formData.password !== formData.confirmPassword) {
            errorToast("Passwords do not match");
            return false;
        }

        // Check password length
        if (formData.password.length < 8) {
            errorToast("Password must be at least 8 characters long");
            return false;
        }

        return true;
    };

    /**
     * Handles form submission to create student account
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
            // Create Firebase auth account
            await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            successToast(
                "Account created successfully! Please complete your profile."
            );

            // Redirect to complete-info page
            router.push("/student-complete-info");
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

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="fixed top-4 left-4">
                    <BackButton variant="primary" size="sm" label="Back" />
                </div>
                <div className="card-body">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="avatar placeholder mb-4">
                            <div className="bg-primary text-primary-content rounded-full w-16 h-16 flex items-center justify-center">
                                <MdPerson className="text-2xl" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-primary">
                            Student Signup
                        </h1>
                        <p className="text-primary/60 text-xs mt-2">
                            Create your student account to get started
                        </p>
                    </div>

                    {/* Signup Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email Field */}
                        <div className="form-control">
                            <label className="label" htmlFor="email">
                                <span className="label-text font-medium">
                                    Email Address
                                </span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MdEmail className="text-base-content/40" />
                                </div>
                                <FormInput
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email address"
                                    className="pl-10"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="form-control">
                            <label className="label" htmlFor="password">
                                <span className="label-text font-medium">
                                    Password
                                </span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MdLock className="text-base-content/40" />
                                </div>
                                <FormInput
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    className="pl-10 pr-12"
                                    required
                                    disabled={loading}
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/40 hover:text-base-content/60"
                                    disabled={loading}
                                >
                                    {showPassword ? (
                                        <MdVisibilityOff className="text-lg" />
                                    ) : (
                                        <MdVisibility className="text-lg" />
                                    )}
                                </button>
                            </div>
                            <label className="label">
                                <span className="label-text-alt text-xs text-base-content/60">
                                    Minimum 8 characters
                                </span>
                            </label>
                        </div>

                        {/* Confirm Password Field */}
                        <div className="form-control">
                            <label className="label" htmlFor="confirmPassword">
                                <span className="label-text font-medium">
                                    Confirm Password
                                </span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MdLock className="text-base-content/40" />
                                </div>
                                <FormInput
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm your password"
                                    className="pl-10 pr-12"
                                    required
                                    disabled={loading}
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/40 hover:text-base-content/60"
                                    disabled={loading}
                                >
                                    {showConfirmPassword ? (
                                        <MdVisibilityOff className="text-lg" />
                                    ) : (
                                        <MdVisibility className="text-lg" />
                                    )}
                                </button>
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
                            Already have an account?{" "}
                            <a
                                href="/login"
                                className="text-primary hover:underline"
                            >
                                Sign in here
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentSignup;
