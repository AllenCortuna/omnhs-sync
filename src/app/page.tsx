"use client";
import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, AuthError } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
    HiUser,
    HiLockClosed,
    HiEye,
    HiEyeOff,
    HiShieldCheck,
} from "react-icons/hi";
import { auth } from "../../firebase";
import { successToast, errorToast } from "../config/toast";
import Link from "next/link";
import { FaUserCog, FaUserGraduate, FaUserTie } from "react-icons/fa";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Form data structure for admin login
 */
interface FormData {
    email: string;
    password: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum number of failed login attempts before lockout */
const MAX_ATTEMPTS = 5;

/** Lockout duration in milliseconds (30 seconds) */
const LOCKOUT_TIME = 30000;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * LoginPage Component
 *
 * Provides secure authentication for admin users with the following features:
 * - Username/password authentication via Firebase
 * - Rate limiting with temporary lockout after failed attempts
 * - Password visibility toggle
 * - Form validation and error handling
 * - Responsive design with loading states
 */
const LoginAdmin: React.FC = () => {
    // ========================================================================
    // STATE MANAGEMENT
    // ========================================================================

    /** Form input data */
    const [formData, setFormData] = useState<FormData>({
        email: "",
        password: "",
    });
    const [role, setRole] = useState<string>("");

    /** Password visibility toggle state */
    const [showPassword, setShowPassword] = useState<boolean>(false);

    /** Loading state during authentication */
    const [loading, setLoading] = useState<boolean>(false);

    /** Failed login attempts counter */
    const [attempts, setAttempts] = useState<number>(0);

    /** Account lockout state */
    const [isLocked, setIsLocked] = useState<boolean>(false);

    // ========================================================================
    // HOOKS
    // ========================================================================

    const router = useRouter();

    // ========================================================================
    // EFFECTS
    // ========================================================================

    /**
     * Auto-unlock account after lockout period expires
     * Resets attempts counter and clears error messages
     */
    useEffect(() => {
        if (isLocked) {
            const timer = setTimeout(() => {
                setIsLocked(false);
                setAttempts(0);
            }, LOCKOUT_TIME);

            // Cleanup timer on component unmount or dependency change
            return () => clearTimeout(timer);
        }
    }, [isLocked]);

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    /**
     * Handles input field changes with automatic error clearing
     * @param field - The form field being updated
     * @returns Event handler function
     */
    const handleInputChange =
        (field: keyof FormData) =>
        (e: React.ChangeEvent<HTMLInputElement>): void => {
            setFormData((prev) => ({
                ...prev,
                [field]: e.target.value.trim(),
            }));
        };

    /**
     * Handles form submission and authentication process
     * @param e - Form submission event
     */
    const handleLogin = async (
        e: React.FormEvent<HTMLFormElement>
    ): Promise<void> => {
        e.preventDefault();

        // ====================================================================
        // VALIDATION
        // ====================================================================

        // Check for empty fields
        if (!formData.email || !formData.password) {
            errorToast("Please enter both email and password");
            return;
        }

        // Check if account is locked
        if (isLocked) {
            errorToast(
                `Too many attempts. Please try again in ${
                    LOCKOUT_TIME / 1000
                } seconds.`
            );
            return;
        }

        // ====================================================================
        // AUTHENTICATION PROCESS
        // ====================================================================

        setLoading(true);

        try {
            // Step 1: Authenticate with Firebase Auth using email/password
            await signInWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            // const { setUserData } = useUserDataStore();

            // // Step 2: Find user by email in Firestore
            // const accountsRef = collection(db, role);
            // const q = query(
            //     accountsRef,
            //     where("email", "==", formData.email),
            //     limit(1)
            // );
            // console.log("query ===>", q);

            // let querySnapshot;
            // try {
            //     querySnapshot = await getDocs(q);
            // } catch (firestoreError) {
            //     console.error("Firestore connection error:", firestoreError);
            //     errorToast(
            //         "Database connection error. Please check your internet connection and try again."
            //     );
            //     return;
            // }

            // // Check if user exists
            // if (querySnapshot.empty) {
            //     throw new Error("Account not found");
            // }

            // // Step 3: Extract user data and validate email
            // const accountData = querySnapshot.docs[0].data() as Admin;
            // if (!accountData.email) {
            //     throw new Error("Account not found");
            // }

            // // Step 4: Save user data to global store and redirect based on role
            // setUserData(accountData, role as UserType);
            successToast("Login successful! Redirecting...");
            router.push(`/${role}/dashboard`);
        } catch (err) {
            // ================================================================
            // ERROR HANDLING
            // ================================================================

            const newAttempts = attempts + 1;
            setAttempts(newAttempts);

            // Check if max attempts reached
            if (newAttempts >= MAX_ATTEMPTS) {
                setIsLocked(true);
                errorToast(
                    `Too many failed attempts. Please try again in ${
                        LOCKOUT_TIME / 1000
                    } seconds.`
                );
            } else {
                // Parse and display appropriate error message
                let errorMessage = "Login failed. Please try again.";

                if (err instanceof Error) {
                    // Handle Firebase Auth specific errors
                    if ((err as AuthError).code) {
                        switch ((err as AuthError).code) {
                            case "auth/wrong-password":
                                errorMessage =
                                    "Incorrect password. Please check your password and try again.";
                                break;
                            case "auth/user-not-found":
                                errorMessage =
                                    "Email not found. Please check your email and try again.";
                                break;
                            case "auth/invalid-email":
                                errorMessage =
                                    "Invalid email format. Please contact administrator.";
                                break;
                            case "auth/user-disabled":
                                errorMessage =
                                    "This account has been disabled. Please contact administrator.";
                                break;
                            case "auth/too-many-requests":
                                errorMessage =
                                    "Too many failed attempts. Please try again later.";
                                setIsLocked(true);
                                break;
                            case "auth/network-request-failed":
                                errorMessage =
                                    "Network error. Please check your internet connection and try again.";
                                break;
                            case "auth/operation-not-allowed":
                                errorMessage =
                                    "Email/password sign-in is not enabled. Please contact administrator.";
                                break;
                            case "auth/invalid-credential":
                                errorMessage =
                                    "Invalid credentials. Please check your email and password.";
                                break;
                            case "auth/account-exists-with-different-credential":
                                errorMessage =
                                    "An account already exists with this email using a different sign-in method.";
                                break;
                            case "auth/requires-recent-login":
                                errorMessage =
                                    "Please log in again to continue. This is required for security.";
                                break;
                            case "auth/user-token-expired":
                                errorMessage =
                                    "Your session has expired. Please log in again.";
                                break;
                            case "auth/invalid-user-token":
                                errorMessage =
                                    "Invalid session. Please log in again.";
                                break;
                            case "auth/weak-password":
                                errorMessage =
                                    "Password is too weak. Please contact administrator.";
                                break;
                            default:
                                // For unknown Firebase errors, show a generic but helpful message
                                if (err.message.includes("Account not found")) {
                                    errorMessage =
                                        "Email not found. Please check your email and try again.";
                                } else {
                                    errorMessage =
                                        "Authentication failed. Please check your credentials and try again.";
                                }
                        }
                    } else {
                        // Handle general errors (non-Firebase Auth errors)
                        if (err.message.includes("Account not found")) {
                            errorMessage =
                                "Email not found. Please check your email and try again.";
                        } else if (
                            err.message.includes("network") ||
                            err.message.includes("fetch")
                        ) {
                            errorMessage =
                                "Network error. Please check your internet connection and try again.";
                        } else if (err.message.includes("timeout")) {
                            errorMessage =
                                "Request timed out. Please try again.";
                        } else {
                            errorMessage =
                                "Login failed. Please check your credentials and try again.";
                        }
                    }
                }

                errorToast(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    // ========================================================================
    // RENDER
    // ========================================================================

    if (role === "") {
        return (
            <div className="min-h-screen bg-[#ffffff] flex items-center justify-center p-4 animate-gradient-x">
                <div className="w-full max-w-md space-y-8 transform hover:scale-[1.01] transition-transform duration-300">
                    <div> 
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {/* <img src="/img/logo.png" alt="OMNHSYNC" className="w-20 h-20 mx-auto" /> */}
                        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent martian-mono">
                            OMNHSYNC
                        </h1>
                        <p className="text-xs text-gray-500 mt-2 ">
                            Occidental Mindanao National High School
                        </p>
                    </div>

                    <div className="flex flex-row gap-2 martian-mono">
                        <button
                            className="flex flex-col p-4 items-center justify-center gap-2 border-2 border-secondary text-primary w-1/3 normal-case text-xs font-semibold shadow-lg hover:shadow-primary/30 transition-all duration-300 rounded-xl hover:bg-primary hover:text-white"
                            onClick={() => setRole("admin")}
                        >
                            <FaUserCog className="w-5 h-5" />
                            <span>Sign In as Admin</span>
                        </button>

                        <button
                            className="flex flex-col p-4 items-center justify-center gap-2 border-2 border-secondary text-primary w-1/3 normal-case text-xs font-semibold shadow-lg hover:shadow-primary/30 transition-all duration-300 rounded-xl hover:bg-primary hover:text-white"
                            onClick={() => setRole("teachers")}
                        >
                            <FaUserTie className="w-5 h-5" />
                            <span>Sign In as Teacher</span>
                        </button>
                        <button
                            className="flex flex-col p-4 items-center justify-center gap-2 border-2 border-secondary text-primary w-1/3 normal-case text-xs font-semibold shadow-lg hover:shadow-primary/30 transition-all duration-300 rounded-xl hover:bg-primary hover:text-white"
                            onClick={() => setRole("students")}
                        >
                            <FaUserGraduate className="w-5 h-5" />
                            <span>Sign In as Student</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#ffffff] flex items-center justify-center p-4 animate-gradient-x">
            <div className="w-full max-w-md space-y-8 transform hover:scale-[1.01] transition-transform duration-300">
                {/* Header Section */}
                <div className="text-center space-y-4">
                    <div>
                        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent martian-mono">
                            OMNHSYNC
                        </h1>
                        <p className="text-xs text-gray-500 mt-2 ">
                            Occidental Mindanao National High School
                        </p>
                    </div>
                </div>

                {/* Login Form Card */}
                <div className="card w-80 bg-white mx-auto shadow-lg text-xs border border-base-300">
                    <div className="card-body p-8">
                        <form onSubmit={handleLogin} className="space-y-10">
                            {/* Role Selector */}
                            <div className="form-control">
                                <span className="text-primary font-semibold martian-mono text-xs text-center">
                                    Sign In as {role}
                                </span>
                            </div>

                            {/* Email Input */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-zinc-500 font-medium text-base-content/80 text-xs">
                                        Email
                                    </span>
                                </label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="input input-bordered w-full pl-12 focus:input-primary transition-all duration-300 bg-base-100 text-xs text-primary"
                                        value={formData.email}
                                        onChange={handleInputChange("email")}
                                        required
                                        autoComplete="email"
                                        disabled={isLocked}
                                    />
                                    <HiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50 group-focus-within:text-primary transition-colors duration-300" />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-zinc-500 font-medium text-base-content/80 text-xs">
                                        Password
                                    </span>
                                </label>
                                <div className="relative group">
                                    <input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        placeholder="Enter your password"
                                        className="input input-bordered w-full pl-12 pr-12 focus:input-primary transition-all duration-300 bg-base-100 text-xs text-primary"
                                        value={formData.password}
                                        onChange={handleInputChange("password")}
                                        required
                                        autoComplete="current-password"
                                        disabled={isLocked}
                                    />
                                    <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50 group-focus-within:text-primary transition-colors duration-300" />
                                    <button
                                        type="button"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-primary transition-colors duration-300"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                        disabled={isLocked}
                                    >
                                        {showPassword ? (
                                            <HiEyeOff className="w-5 h-5" />
                                        ) : (
                                            <HiEye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                className="btn btn-primary w-full normal-case text-xs font-semibold shadow-lg hover:shadow-primary/30 transition-all duration-300 min-h-12"
                                disabled={loading || isLocked}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="loading loading-spinner"></span>
                                        <span>Authenticating...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <HiShieldCheck className="w-5 h-5" />
                                        <span>Sign In</span>
                                    </div>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
                <div className="text-center flex flex-col gap-2">
                    <p className="text-xs text-base-content/60 underline">
                        <Link
                            href="/student-signup"
                            className="text-primary cursor-pointer"
                        >
                            Sign up as Student?
                        </Link>
                    </p>
                    <p className="text-xs text-base-content/60 underline">
                        <Link
                            href="/teacher-signup"
                            className="text-primary cursor-pointer"
                        >
                            Sign up as Teacher?
                        </Link>
                    </p>
                    <button
                        className="btn btn-secondary text-white text-xs font-semibold shadow-lg hover:shadow-primary/30 transition-all duration-300 min-h-12 w-20 mx-auto"
                        onClick={() => setRole("")}
                    >
                        Change Role
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginAdmin;
