"use client";

// React and Firebase imports
import React, { useState } from "react";
import { createUserWithEmailAndPassword, signOut, User } from "firebase/auth";
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { auth, db } from "../../../../../firebase";
import { useRouter } from "next/navigation";

// Icon imports from react-icons
import {
    MdEmail,
    MdPerson,
    MdLock,
    MdVisibility,
    MdVisibilityOff,
    MdAdd,
    MdCheck,
    MdError,
} from "react-icons/md";
import Link from "next/link";

interface AdminAddAccountFormData {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    role: string;
}

const AdminAddAccount: React.FC = () => {
    const router = useRouter();
    const [formData, setFormData] = useState<AdminAddAccountFormData>({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        role: "staff",
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const validateForm = async (): Promise<boolean> => {

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError("Email is not valid");
            return false;
        }

        if (
            !formData.email ||
            !formData.password ||
            !formData.confirmPassword ||
            !formData.name ||
            !formData.role
        ) {
            setError("All fields are required");
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return false;
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long");
            return false;
        }

        setError("");
        return true;
    };

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ): Promise<void> => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        const nameRef = query(collection(db, "admin"), where("name", "==", formData.name));
        const nameDoc = await getDocs(nameRef);
        if (nameDoc.docs.length > 0) {
            setError("Name already exists");
            setLoading(false);
            return;
        }

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        const currentAdminUser: User | null = auth.currentUser;
        if (!currentAdminUser) {
            setError("Admin session not found. Please log in again to create accounts.");
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );
            const newUser = userCredential.user;

            await setDoc(doc(db, "admin", newUser.uid), {
                name: formData.name,
                email: formData.email,
                uid: newUser.uid,
                createdAt: new Date().toISOString(),
                role: formData.role,
            });

            await signOut(auth);

            if (auth.updateCurrentUser) {
                await auth.updateCurrentUser(currentAdminUser);
                router.push("/admin/account");
            } else {
                console.warn(
                    "auth.updateCurrentUser is not available. Admin session might need manual refresh if issues occur."
                );
            }
            setSuccess("Account created successfully!");
            setFormData({
                email: "",
                password: "",
                confirmPassword: "",
                name: "",
                role: "pho-sub",
            });
        } catch (error) {
            console.error("Error creating account:", error);

            let errorMessage = "Failed to create account. Please try again.";
            switch ((error as { code: string }).code) {
                case "auth/email-already-in-use":
                    errorMessage = "This email address is already registered.";
                    break;
                case "auth/invalid-email":
                    errorMessage = "The email address is not valid.";
                    break;
                case "auth/weak-password":
                    errorMessage = "The password is too weak. Please choose a stronger password.";
                    break;
            }
            setError(errorMessage);

            if (
                currentAdminUser &&
                !auth.currentUser &&
                auth.updateCurrentUser
            ) {
                try {
                    await auth.updateCurrentUser(currentAdminUser);
                    console.log("Admin session restored after error.");
                } catch (restoreError) {
                    console.error(
                        "Failed to restore admin session after error:",
                        restoreError
                    );
                    setError(
                        `${errorMessage} Additionally, the admin session might have been lost. Please try logging in again.`
                    );
                }
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Smaller Text and Input Sizing for Compact Form ---
    return (
        <div className="min-h-screen flex items-center justify-center p-2 text-zinc-700 text-[11px]">

            <Link
                href="/admin/account"
                className="btn btn-primary btn-xs mb-2 text-white font-medium rounded-none fixed right-6 top-6 z-40 text-[11px] h-7 min-h-[1.75rem]"
            >
                Back
            </Link>

            <div className="w-full max-w-sm bg-base-100 shadow-xl text-[11px]">
                <div className="card-body border px-8 py-6 text-[11px]">
                    {/* Header */}
                    <div className="flex flex-row gap-3 mx-auto items-center mb-3">
                        <div className="flex items-center justify-center">
                            <div className="avatar placeholder">
                                <div className="bg-primary text-primary-content rounded-full w-8 h-8 flex items-center justify-center">
                                    <MdAdd className="text-base" />
                                </div>
                            </div>
                        </div>
                        <h2 className="card-title justify-center text-xs font-bold mb-0 p-0">
                            Create New Account
                        </h2>
                    </div>
                    {/* Alerts */}
                    {error && (
                        <div
                            role="alert"
                            className="alert alert-error text-white text-[10px] mb-3 py-1 px-2 h-6 min-h-0"
                        >
                            <MdError className="text-base mr-1" />
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div
                            role="alert"
                            className="alert alert-success text-white text-[10px] mb-3 py-1 px-2 h-6 min-h-0"
                        >
                            <MdCheck className="text-base mr-1" />
                            <span>{success}</span>
                        </div>
                    )}
                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-2 text-[11px]">
                        {/* Email */}
                        <div className="form-control">
                            <label className="label p-0 pb-0 my-2" htmlFor="email-input">
                                <span className="text-[10px] text-zinc-500">Email</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="email-input"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter email address"
                                    className="input-xs input text-[11px] input-bordered w-full pl-8 h-7"
                                    required
                                    disabled={loading}
                                />
                                <MdEmail className="absolute left-2 top-1/2 transform -translate-y-1/2 text-base-content/60 text-[15px]" />
                            </div>
                        </div>
                        {/* Name */}
                        <div className="form-control">
                            <label className="label p-0 pb-0 my-2" htmlFor="name-input">
                                <span className="text-[10px] text-zinc-500">Name</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="name-input"
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter name"
                                    className="input input-xs text-[11px] input-bordered w-full pl-8 h-7"
                                    required
                                    disabled={loading}
                                />
                                <MdPerson className="absolute left-2 top-1/2 transform -translate-y-1/2 text-base-content/60 text-[15px]" />
                            </div>
                        </div>
                        {/* Role */}
                        <div className="form-control">
                            <label className="label p-0 pb-0 my-2" htmlFor="role-input">
                                <span className="text-[10px] text-zinc-500">Account Role</span>
                            </label>
                            <div className="relative">
                                <select
                                    id="role-input"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="input input-xs text-[11px] input-bordered w-full pl-8 h-7 appearance-none"
                                    required
                                    disabled={loading}
                                >
                                    <option value="" disabled>
                                        Select role
                                    </option>
                                    <option value="admin">Admin</option>
                                    <option value="staff">Staff</option>
                                </select>
                                <MdPerson className="absolute left-2 top-1/2 transform -translate-y-1/2 text-base-content/60 text-[15px]" />
                            </div>
                        </div>
                        {/* Password */}
                        <div className="form-control">
                            <label className="label p-0 pb-0 my-2" htmlFor="password-input">
                                <span className="text-[10px] text-zinc-500">Password</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="password-input"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter password"
                                    className="input input-xs text-[11px] input-bordered w-full pl-8 pr-8 h-7"
                                    required
                                    disabled={loading}
                                    minLength={8}
                                />
                                <MdLock className="absolute left-2 top-1/2 transform -translate-y-1/2 text-base-content/60 text-[15px]" />
                                <button
                                    type="button"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-base-content/60 hover:text-base-content p-0"
                                    disabled={loading}
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <MdVisibilityOff className="text-[15px]" />
                                    ) : (
                                        <MdVisibility className="text-[15px]" />
                                    )}
                                </button>
                            </div>
                            <label className="label p-0 pt-0 mt-0">
                                <span className="label-text-alt text-[9px] text-base-content/60">
                                    Minimum 8 characters
                                </span>
                            </label>
                        </div>
                        {/* Confirm Password */}
                        <div className="form-control">
                            <label className="label p-0 pb-0 my-2" htmlFor="confirmPassword-input">
                                <span className="text-[10px] text-zinc-500">Confirm Password</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="confirmPassword-input"
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm password"
                                    className="input input-xs text-[11px] input-bordered w-full pl-8 pr-8 h-7"
                                    required
                                    disabled={loading}
                                    minLength={8}
                                />
                                <MdLock className="absolute left-2 top-1/2 transform -translate-y-1/2 text-base-content/60 text-[15px]" />
                                <button
                                    type="button"
                                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-base-content/60 hover:text-base-content p-0"
                                    disabled={loading}
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? (
                                        <MdVisibilityOff className="text-[15px]" />
                                    ) : (
                                        <MdVisibility className="text-[15px]" />
                                    )}
                                </button>
                            </div>
                        </div>
                        {/* Submit Button */}
                        <div className="form-control mt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`btn btn-primary btn-xs w-full text-[11px] py-0 min-h-0 h-7 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                {loading ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <MdAdd className="text-[14px] mr-1" />
                                        Create Account
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                    {/* Footer */}
                    <div className="divider my-3"></div>
                    <div className="text-center mt-0">
                        <p className="text-[10px] text-base-content/60">
                            Admin Panel - Account Management
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAddAccount;