// Use client directive for interactivity
"use client";
import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, AuthError } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
    HiUser,
    HiLockClosed,
    HiEye,
    HiEyeOff,
    HiChevronLeft,
} from "react-icons/hi";
import { FaUserCog, FaUserGraduate, FaUserTie, FaSignInAlt, FaLockOpen } from "react-icons/fa";
import { auth } from "../../firebase";
import { successToast, errorToast } from "../config/toast"; // Assuming these are defined elsewhere
import Link from "next/link";


// ============================================================================
// TYPES & INTERFACES (UNCHANGED)
// ============================================================================
interface FormData {
    email: string;
    password: string;
}

// ============================================================================
// CONSTANTS (UNCHANGED)
// ============================================================================
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 30000;

// ============================================================================
// MAIN COMPONENT (DESIGN CHANGES ONLY)
// ============================================================================
const LoginAdmin: React.FC = () => {
    // ========================================================================
    // STATE MANAGEMENT & LOGIC (UNCHANGED)
    // ========================================================================
    const [formData, setFormData] = useState<FormData>({ email: "", password: "" });
    const [role, setRole] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [attempts, setAttempts] = useState<number>(0);
    const [isLocked, setIsLocked] = useState<boolean>(false);
    const router = useRouter();

    useEffect(() => {
        if (isLocked) {
            const timer = setTimeout(() => {
                setIsLocked(false);
                setAttempts(0);
            }, LOCKOUT_TIME);
            return () => clearTimeout(timer);
        }
    }, [isLocked]);

    const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>): void => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value.trim() }));
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        // ... (All original logic for validation, lockout, and Firebase auth is retained here)
        if (!formData.email || !formData.password) {
            errorToast("Please enter both email and password");
            return;
        }

        if (isLocked) {
            errorToast(
                `Too many attempts. Please try again in ${
                    LOCKOUT_TIME / 1000
                } seconds.`
            );
            return;
        }

        setLoading(true);

        try {
            await signInWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            // ... (Commented out firestore logic retained as is)

            successToast("Login successful! Redirecting...");
            router.push(`/${role}/dashboard`);
        } catch (err) {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);

            if (newAttempts >= MAX_ATTEMPTS) {
                setIsLocked(true);
                errorToast(
                    `Too many failed attempts. Please try again in ${
                        LOCKOUT_TIME / 1000
                    } seconds.`
                );
            } else {
                let errorMessage = "Login failed. Please try again.";
                // ... (Firebase error parsing logic retained)
                if (err instanceof Error) {
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
                            case "auth/invalid-credential":
                                errorMessage =
                                    "Invalid credentials. Please check your email and password.";
                                break;
                            default:
                                if (err.message.includes("Account not found")) {
                                    errorMessage =
                                        "Email not found. Please check your email and try again.";
                                } else {
                                    errorMessage =
                                        "Authentication failed. Please check your credentials and try again.";
                                }
                        }
                    } else {
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
    // RENDER: ROLE SELECTION SCREEN (UI/UX REDESIGN)
    // ========================================================================

    const roleOptions = [
        {
            role: "admin",
            label: "Admin",
            icon: FaUserCog,
            // Use Accent for Admin (most privileged)
            color: "text-accent border-accent", 
            hoverBg: "hover:bg-accent",
        },
        {
            role: "teachers",
            label: "Teacher",
            icon: FaUserTie,
            // Use Primary for Teachers
            color: "text-primary border-primary",
            hoverBg: "hover:bg-primary",
        },
        {
            role: "students",
            label: "Student",
            icon: FaUserGraduate,
            // Use Secondary for Students
            color: "text-secondary border-secondary", 
            hoverBg: "hover:bg-secondary",
        },
    ];

    const signUpLinks = [
        {
            href: "/teacher-signup",
            label: "Teacher",
            icon: FaUserTie,
        },
        {
            href: "/student-signup",
            label: "Student",
            icon: FaUserGraduate,
        },
    ];

    if (role === "") {
        return (
            <div className="min-h-screen bg-neutral text-base-100 flex items-center justify-center p-6">
                <div className="w-full max-w-xl space-y-10 animate-fade-in">
                    
                    {/* Header: Title and Slogan */}
                    <div className="text-center space-y-2">
                        <h1 className="text-5xl font-extrabold text-base-100 tracking-wider martian-mono animate-pulse-slow">
                            OMNHSYNC
                        </h1>
                        <p className="text-sm font-medium italic text-gray-400">
                            Occidental Mindoro National High School
                        </p>
                    </div>

                    {/* Role Selection Cards */}
                    <div className="space-y-4">
                        <p className="text-lg font-semibold text-gray-300 border-b border-neutral/50 pb-2 mb-4">
                            Select your Sign-In Role:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {roleOptions.map((option) => {
                                const IconComponent = option.icon;
                                return (
                                    <button
                                        key={option.role}
                                        className={`flex flex-col p-6 items-center justify-center gap-2 border-2 ${option.color} w-full normal-case text-sm font-semibold shadow-2xl transition-all duration-300 rounded-xl ${option.hoverBg} hover:text-base-100 transform hover:scale-[1.03] bg-neutral/50 backdrop-blur-sm`}
                                        onClick={() => setRole(option.role)}
                                    >
                                        <IconComponent className="w-8 h-8" />
                                        <span className="mt-1">Sign In as {option.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sign Up Links */}
                    <div className="text-center pt-8">
                        <p className="text-base font-semibold text-gray-400 mb-4">
                            New User? Register Here:
                        </p>
                        <div className="flex justify-center gap-4">
                            {signUpLinks.map((link) => {
                                const IconComponent = link.icon;
                                return (
                                    <Link key={link.label} href={link.href}
                                        className="flex items-center gap-2 px-6 py-3 border border-accent text-accent hover:text-base-100 hover:bg-accent transition-colors duration-300 rounded-full text-sm font-medium shadow-md">
                                        <IconComponent className="w-4 h-4" />
                                        <span>Sign Up as {link.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================================
    // RENDER: LOGIN FORM SCREEN (UI/UX REDESIGN)
    // ========================================================================
    const displayName = role.charAt(0).toUpperCase() + role.slice(1).replace('s', ''); 

    return (
        <div className="min-h-screen bg-neutral text-base-100 flex items-center justify-center p-6">
            <div className="w-full max-w-sm space-y-8 animate-fade-in">
                
                {/* Header Section */}
                <div className="text-center space-y-1">
                    <h1 className="text-4xl font-extrabold text-base-100 tracking-wider martian-mono">
                        OMNHSYNC
                    </h1>
                    <p className="text-sm text-gray-400">
                        Sign In as <span className="text-accent font-bold">{displayName}</span>
                    </p>
                </div>

                {/* Login Form Card */}
                <div className="p-8 bg-neutral/80 rounded-2xl shadow-2xl space-y-6 border border-neutral/50">
                    <form onSubmit={handleLogin} className="space-y-6">
                        
                        {/* Email Input */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text text-gray-400 font-medium text-sm">
                                    Email Address
                                </span>
                            </label>
                            <div className="relative group">
                                <input
                                    type="email"
                                    placeholder="your.email@omnhs.edu.ph"
                                    className="input w-full pl-12 pr-4 bg-neutral border-neutral/50 text-base-100 focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-300 rounded-lg"
                                    value={formData.email}
                                    onChange={handleInputChange("email")}
                                    required
                                    autoComplete="email"
                                    disabled={isLocked || loading}
                                />
                                <HiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-accent transition-colors duration-300" />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text text-gray-400 font-medium text-sm">
                                    Password
                                </span>
                            </label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="input w-full pl-12 pr-12 bg-neutral border-neutral/50 text-base-100 focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-300 rounded-lg"
                                    value={formData.password}
                                    onChange={handleInputChange("password")}
                                    required
                                    autoComplete="current-password"
                                    disabled={isLocked || loading}
                                />
                                <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-accent transition-colors duration-300" />
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-accent transition-colors duration-300"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    disabled={isLocked || loading}
                                >
                                    {showPassword ? (
                                        <HiEyeOff className="w-5 h-5" />
                                    ) : (
                                        <HiEye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {/* Lockout Message */}
                            {isLocked && (
                                <div className="mt-3 text-center p-3 rounded-lg bg-error/20 text-error border border-error text-sm font-semibold flex items-center justify-center gap-2 animate-bounce-slow">
                                    <FaLockOpen className="w-4 h-4 transform rotate-12" />
                                    Account Locked. Try in {LOCKOUT_TIME / 1000}s
                                </div>
                            )}
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            className="w-full mt-8 py-3 bg-accent text-neutral font-bold rounded-lg shadow-xl hover:bg-accent/90 transition-all duration-300 transform hover:scale-[1.01] flex items-center justify-center gap-2"
                            disabled={loading || isLocked}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <span className="w-5 h-5 border-2 border-neutral border-t-transparent rounded-full animate-spin"></span>
                                    <span>Authenticating...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <FaSignInAlt className="w-4 h-4" />
                                    <span>Sign In</span>
                                </div>
                            )}
                        </button>
                    </form>
                </div>
                
                {/* Footer Links and Change Role Button */}
                <div className="text-center pt-4 space-y-3">
                    <button
                        className="flex items-center justify-center gap-1 mx-auto text-sm text-gray-400 hover:text-base-100 transition-colors duration-300"
                        onClick={() => setRole("")}
                    >
                        <HiChevronLeft className="w-4 h-4" />
                        Back to Role Selection
                    </button>
                    
                    {/* Simplified Signup Links for Login Screen */}
                    <div className="flex justify-center gap-4 text-xs">
                        <Link
                            href="/student-signup"
                            className="text-accent hover:underline transition-colors duration-300"
                        >
                            Sign up as Student
                        </Link>
                        <span className="text-gray-500">|</span>
                        <Link
                            href="/teacher-signup"
                            className="text-accent hover:underline transition-colors duration-300"
                        >
                            Sign up as Teacher
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginAdmin;