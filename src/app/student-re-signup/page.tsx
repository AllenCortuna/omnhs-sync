"use client";
// React and Firebase imports
import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, query, addDoc, where, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { createUserSession } from "@/services/sessionService";

// Component imports
import { FormInput, FormSelect, CreateButton, BackButton } from "@/components/common";

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
 * @file StudentReSignup.tsx - Student account completion page for existing auth users
 * @module StudentReSignup
 *
 * @description
 * This component allows students with existing Firebase Auth accounts to complete
 * their student profile. It handles:
 * 1. Sign in for existing auth users
 * 2. Student data submission to Firestore
 * 3. Update existing student record or create new one
 *
 * @requires react
 * @requires firebase/auth
 * @requires firebase/firestore
 * @requires react-icons/md
 * @requires ../../firebase
 */

interface StudentReSignupFormData {
    email: string;
    password: string;
    studentId: string;
    firstName: string;
    lastName: string;
    middleName: string;
    suffix: string;
    sex: string;
    birthDate: string;
    address: string;
}

/**
 * StudentReSignup Component
 * Renders a form for students to complete their profile after sign in
 * @returns {JSX.Element} The rendered StudentReSignup component
 */
const StudentReSignup: React.FC = () => {
    const router = useRouter();
    const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
    const [userEmail, setUserEmail] = useState<string>("");

    // Form data state
    const [formData, setFormData] = useState<StudentReSignupFormData>({
        email: "",
        password: "",
        studentId: "",
        firstName: "",
        lastName: "",
        middleName: "",
        suffix: "",
        sex: "",
        birthDate: "",
        address: "",
    });

    // Loading state for async operations
    const [loading, setLoading] = useState<boolean>(false);
    const [signingIn, setSigningIn] = useState<boolean>(false);

    // Password visibility toggle state
    const [showPassword, setShowPassword] = useState<boolean>(false);

    // Check if user is already signed in
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsSignedIn(true);
                setUserEmail(user.email || "");
                setFormData((prev) => ({
                    ...prev,
                    email: user.email || "",
                }));
            } else {
                setIsSignedIn(false);
            }
        });

        return () => unsubscribe();
    }, []);

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
        if (!isSignedIn) {
            // Validate sign in fields
            if (!formData.email || !formData.password) {
                errorToast("Please enter your email and password to sign in");
                return false;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                errorToast("Please enter a valid email address");
                return false;
            }
            return false; // Will trigger sign in first
        }

        // Validate student data fields
        if (
            !formData.studentId ||
            !formData.firstName ||
            !formData.lastName ||
            !formData.middleName ||
            !formData.sex ||
            !formData.birthDate ||
            !formData.address
        ) {
            errorToast("All required fields must be filled");
            return false;
        }

        // Check if student ID contains spaces
        if (formData.studentId.includes(" ")) {
            errorToast("Student ID must not contain spaces");
            return false;
        }

        return true;
    };

    /**
     * Handles sign in for existing auth users
     */
    const handleSignIn = async (): Promise<void> => {
        if (!formData.email || !formData.password) {
            errorToast("Please enter your email and password");
            return;
        }

        try {
            setSigningIn(true);
            const userCredential = await signInWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );
            
            const user = userCredential.user;
            
            // Check if student document already exists and create session if it does
            const studentsRef = collection(db, "students");
            const studentQuery = query(studentsRef, where("email", "==", user.email));
            const studentSnapshot = await getDocs(studentQuery);
            
            if (!studentSnapshot.empty) {
                const studentDocId = studentSnapshot.docs[0].id;
                await createUserSession(studentDocId, "student");
            }
            // If no student document exists yet, session will be created when they complete their profile
            
            successToast("Signed in successfully! Please complete your profile.");
        } catch (error) {
            console.error("Error signing in:", error);
            let errorMessage = "Failed to sign in. Please try again.";
            switch ((error as { code: string }).code) {
                case "auth/user-not-found":
                    errorMessage = "No account found with this email.";
                    break;
                case "auth/wrong-password":
                    errorMessage = "Incorrect password.";
                    break;
                case "auth/invalid-email":
                    errorMessage = "The email address is not valid.";
                    break;
                case "auth/invalid-credential":
                    errorMessage = "Invalid email or password.";
                    break;
            }
            errorToast(errorMessage);
        } finally {
            setSigningIn(false);
        }
    };

    /**
     * Handles form submission to save student data
     * @param {React.FormEvent<HTMLFormElement>} e - Form submission event
     */
    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ): Promise<void> => {
        e.preventDefault();

        if (!isSignedIn) {
            await handleSignIn();
            return;
        }

        setLoading(true);

        // Validate form data
        if (!validateForm()) {
            setLoading(false);
            return;
        }

        try {
            const email = userEmail || formData.email;

            // Check if studentId already exists (case insensitive)
            const studentIdRef = query(
                collection(db, "students"),
                where("studentId", "==", formData.studentId.toUpperCase())
            );
            const studentIdDoc = await getDocs(studentIdRef);

            if (studentIdDoc.docs.length > 0) {
                const existingStudent = studentIdDoc.docs[0].data();
                // If the existing student has a different email, show error
                if (existingStudent.email && existingStudent.email !== email.toLowerCase()) {
                    errorToast("This LRN is already registered with a different email");
                    setLoading(false);
                    return;
                }
            }

            // Check if email already exists in students collection
            const emailRef = query(
                collection(db, "students"),
                where("email", "==", email.toLowerCase())
            );
            const emailDoc = await getDocs(emailRef);

            let studentDocId: string;
            
            if (emailDoc.docs.length > 0) {
                // Update existing student record
                const studentDoc = emailDoc.docs[0];
                studentDocId = studentDoc.id;
                await updateDoc(doc(db, "students", studentDocId), {
                    studentId: formData.studentId.toUpperCase(),
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    middleName: formData.middleName,
                    suffix: formData.suffix || "",
                    sex: formData.sex,
                    birthDate: formData.birthDate,
                    address: formData.address,
                    email: email.toLowerCase(),
                    profileComplete: true,
                    approved: false,
                    updatedAt: new Date().toISOString(),
                });

                successToast(
                    "Profile updated successfully! Redirecting to dashboard..."
                );
            } else {
                // Create new student record
                const newStudentRef = await addDoc(collection(db, "students"), {
                    studentId: formData.studentId.toUpperCase(),
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    middleName: formData.middleName,
                    suffix: formData.suffix || "",
                    sex: formData.sex,
                    birthDate: formData.birthDate,
                    address: formData.address,
                    email: email.toLowerCase(),
                    createdAt: new Date().toISOString(),
                    profileComplete: true,
                    approved: false,
                });
                studentDocId = newStudentRef.id;

                successToast(
                    "Profile created successfully! Redirecting to dashboard..."
                );
            }

            // Create session token for the student
            if (auth.currentUser && studentDocId) {
                await createUserSession(studentDocId, "student");
            }

            // Redirect to student dashboard
            router.push("/students/dashboard");
        } catch (error) {
            console.error("Error saving student data:", error);
            errorToast("Failed to save student data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
                <div className="fixed top-4 left-4">
                    <BackButton />
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
                            {isSignedIn
                                ? "Complete Your Profile"
                                : "Sign In & Complete Profile"}
                        </h1>
                        <p className="text-primary/60 text-xs mt-2">
                            {isSignedIn
                                ? "Please provide your student information"
                                : "Sign in with your existing account to complete your profile"}
                        </p>
                    </div>

                    {/* Signup Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Sign In Section - Only show if not signed in */}
                        {!isSignedIn && (
                            <>
                                <div className="divider">
                                    <span className="text-xs text-base-content/60">
                                        Sign In
                                    </span>
                                </div>

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
                                            disabled={signingIn || loading}
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
                                            disabled={signingIn || loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/40 hover:text-base-content/60"
                                            disabled={signingIn || loading}
                                        >
                                            {showPassword ? (
                                                <MdVisibilityOff className="text-lg" />
                                            ) : (
                                                <MdVisibility className="text-lg" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Student Information Section */}
                        <div className="divider mt-6">
                            <span className="text-xs text-base-content/60">
                                Student Information
                            </span>
                        </div>

                        {/* Personal Information - 2 Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Student ID Input Field */}
                            <div className="form-control">
                                <label
                                    className="label"
                                    htmlFor="studentId-input"
                                >
                                    <span className="label-text font-medium">
                                        LRN
                                    </span>
                                </label>
                                <FormInput
                                    id="studentId-input"
                                    name="studentId"
                                    type="text"
                                    value={formData.studentId}
                                    onChange={handleChange}
                                    placeholder="Enter LRN"
                                    className="uppercase"
                                    required
                                    disabled={loading || !isSignedIn}
                                />
                            </div>

                            {/* First Name Input Field */}
                            <div className="form-control">
                                <label
                                    className="label"
                                    htmlFor="firstName-input"
                                >
                                    <span className="label-text font-medium">
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
                                    disabled={loading || !isSignedIn}
                                />
                            </div>

                            {/* Last Name Input Field */}
                            <div className="form-control">
                                <label
                                    className="label"
                                    htmlFor="lastName-input"
                                >
                                    <span className="label-text font-medium">
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
                                    disabled={loading || !isSignedIn}
                                />
                            </div>

                            {/* Middle Name Input Field */}
                            <div className="form-control">
                                <label
                                    className="label"
                                    htmlFor="middleName-input"
                                >
                                    <span className="label-text font-medium">
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
                                    disabled={loading || !isSignedIn}
                                />
                            </div>

                            {/* Suffix Input Field */}
                            <div className="form-control">
                                <label className="label" htmlFor="suffix-input">
                                    <span className="label-text font-medium">
                                        Suffix
                                    </span>
                                </label>
                                <FormInput
                                    id="suffix-input"
                                    name="suffix"
                                    type="text"
                                    value={formData.suffix}
                                    onChange={handleChange}
                                    placeholder="e.g., Jr., Sr., III"
                                    disabled={loading || !isSignedIn}
                                />
                            </div>

                            {/* Gender Input Field */}
                            <div className="form-control">
                                <label className="label" htmlFor="gender-input">
                                    <span className="label-text font-medium">
                                        Gender
                                    </span>
                                </label>
                                <FormSelect
                                    id="gender-input"
                                    name="sex"
                                    value={formData.sex}
                                    onChange={handleChange}
                                    options={[
                                        { value: "Male", label: "Male" },
                                        { value: "Female", label: "Female" },
                                    ]}
                                    placeholder="Select Gender"
                                    required
                                    disabled={loading || !isSignedIn}
                                />
                            </div>

                            {/* Birth Date Input Field */}
                            <div className="form-control">
                                <label
                                    className="label"
                                    htmlFor="birthDate-input"
                                >
                                    <span className="label-text font-medium">
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
                                    disabled={loading || !isSignedIn}
                                />
                            </div>
                        </div>

                        {/* Address Input Field - Full Width */}
                        <div className="form-control">
                            <label className="label" htmlFor="address-input">
                                <span className="label-text font-medium">
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
                                disabled={loading || !isSignedIn}
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="form-control mt-6">
                            <CreateButton
                                loading={loading || signingIn}
                                buttonText={
                                    !isSignedIn
                                        ? "Sign In"
                                        : "Complete Profile"
                                }
                            />
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="divider mt-6 mb-2"></div>
                    <div className="text-center">
                        <p className="text-xs text-base-content/60">
                            {isSignedIn ? (
                                <>
                                    Signed in as:{" "}
                                    <span className="text-primary font-medium">
                                        {userEmail}
                                    </span>
                                </>
                            ) : (
                                <>
                                    Don&apos;t have an account?{" "}
                                    <a
                                        href="/student-signup"
                                        className="text-primary hover:underline"
                                    >
                                        Sign up here
                                    </a>
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentReSignup;

