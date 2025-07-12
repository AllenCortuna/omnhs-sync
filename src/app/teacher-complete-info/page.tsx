"use client";
import React, { useState } from "react";
import { CreateButton, FormInput } from "@/components/common";
import { errorToast, successToast } from "@/config/toast";
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
    HiUserCircle,
    HiUser,
    HiAcademicCap,
    HiUserGroup,
    HiMail,
    HiIdentification,
} from "react-icons/hi";
import { useRouter } from "next/navigation";
import IncompleteRouteGuard from "@/components/common/IncompleteRouteGuard";

interface TeacherData {
    employeeId: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    position?: string;
    contactNumber?: string;
    address?: string;
    email?: string;
    [key: string]: string | undefined;
}

const CompleteInfo = () => {
    console.log("CompleteInfo");
    const router = useRouter();
    const [formData, setFormData] = useState({
        employeeId: "",
        contactNumber: "",
    });
    const [loading, setLoading] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [foundTeacherData, setFoundTeacherData] =
        useState<TeacherData | null>(null);
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

    // Get current user on component mount
    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (formData.employeeId === "" || formData.contactNumber === "") {
            errorToast("Please fill all the fields");
            return;
        }
        setLoading(true);
        try {
            const teacherRef = collection(db, "teachers");
            const q = query(
                teacherRef,
                where("employeeId", "==", formData.employeeId.toUpperCase()),
                where("contactNumber", "==", formData.contactNumber)
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                errorToast("Teacher not found");
                setFoundTeacherData(null);
            } else {
                // Filter to find documents without email (unlinked accounts)
                const unlinkedTeachers = querySnapshot.docs.filter((doc) => {
                    const data = doc.data();
                    return !data.email; // Only return documents without email field
                });

                if (unlinkedTeachers.length === 0) {
                    errorToast(
                        "This teacher data is already linked to an account"
                    );
                    setFoundTeacherData(null);
                } else {
                    successToast("Teacher found");
                    const teacherData =
                        unlinkedTeachers[0].data() as TeacherData;
                    setFoundTeacherData(teacherData);
                }
            }
        } catch (error) {
            console.error("Error searching for teacher:", error);
            errorToast("An error occurred while searching for teacher");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!currentUser || !foundTeacherData) {
            errorToast("No user logged in or teacher data not found");
            return;
        }

        setConfirmLoading(true);
        try {
            // Update the current teacher's document with the found data
            const teachersRef = collection(db, "teachers");
            const q = query(
                teachersRef,
                where(
                    "employeeId",
                    "==",
                    foundTeacherData.employeeId.toUpperCase()
                ),
                where("contactNumber", "==", foundTeacherData.contactNumber)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const teacherDoc = querySnapshot.docs[0];
                await updateDoc(doc(db, "teachers", teacherDoc.id), {
                    ...foundTeacherData,
                    email: currentUser.email,
                    profileComplete: true,
                    updatedAt: new Date().toISOString(),
                });
            }

            successToast("Profile completed successfully!");
            // Reset form and found data
            router.push("/teachers/dashboard");
            setFormData({ employeeId: "", contactNumber: "" });
            setFoundTeacherData(null);
        } catch (error) {
            console.error("Error updating teacher profile:", error);
            errorToast("Failed to complete profile. Please try again.");
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({ employeeId: "", contactNumber: "" });
        setFoundTeacherData(null);
    };

    return (
        <IncompleteRouteGuard>
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-accent/5 to-primary/5">
                <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
                    <div className="card-body">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-base-content">
                                Complete Your Profile
                            </h1>
                            <p className="text-base-content/60 text-sm mt-2">
                                Enter your employee ID and contact number to link
                                your account
                            </p>
                        </div>

                        {!foundTeacherData ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="form-control">
                                    <label
                                        className="label"
                                        htmlFor="employeeId"
                                    >
                                        <span className="label-text font-medium">
                                            Employee ID
                                        </span>
                                    </label>
                                    <FormInput
                                        id="employeeId"
                                        name="employeeId"
                                        type="text"
                                        placeholder="Enter your employee ID"
                                        value={formData.employeeId}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                employeeId: e.target.value,
                                            })
                                        }
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <div className="form-control">
                                    <label
                                        className="label"
                                        htmlFor="contactNumber"
                                    >
                                        <span className="label-text font-medium">
                                            Contact Number
                                        </span>
                                    </label>
                                    <FormInput
                                        id="contactNumber"
                                        name="contactNumber"
                                        type="text"
                                        placeholder="Enter your contact number"
                                        value={formData.contactNumber}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                contactNumber: e.target.value,
                                            })
                                        }
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <div className="form-control mt-6">
                                    <CreateButton
                                        buttonText="Search Teacher Data"
                                        loading={loading}
                                        loadingText="Searching..."
                                    />
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                {/* Display Found Teacher Data */}
                                <div className="card bg-base-200 shadow-sm">
                                    <div className="card-body p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <HiUserCircle className="text-xl text-accent" />
                                            <h3 className="card-title text-base">
                                                Found Teacher Information
                                            </h3>
                                        </div>

                                        <div className="grid gap-4">
                                            <div className="flex items-center gap-3">
                                                <span className="badge badge-accent text-sm">
                                                    {foundTeacherData.employeeId}
                                                </span>
                                            </div>

                                            {foundTeacherData.firstName && (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 text-base-content/70 min-w-[120px]">
                                                        <HiUser className="text-xs" />
                                                        <span>First Name</span>
                                                    </div>
                                                    <span className="font-medium text-sm">
                                                        {
                                                            foundTeacherData.firstName
                                                        }
                                                    </span>
                                                </div>
                                            )}

                                            {foundTeacherData.lastName && (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 text-base-content/70 min-w-[120px]">
                                                        <HiUser className="text-xs" />
                                                        <span>Last Name</span>
                                                    </div>
                                                    <span className="font-medium text-sm">
                                                        {
                                                            foundTeacherData.lastName
                                                        }
                                                    </span>
                                                </div>
                                            )}

                                            {foundTeacherData.position && (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 text-base-content/70 min-w-[120px]">
                                                        <HiAcademicCap className="text-xs" />
                                                        <span>Position</span>
                                                    </div>
                                                    <span className="badge badge-secondary text-sm">
                                                        {foundTeacherData.position}
                                                    </span>
                                                </div>
                                            )}

                                            {foundTeacherData.contactNumber && (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 text-base-content/70 min-w-[120px]">
                                                        <HiIdentification className="text-xs" />
                                                        <span>Contact Number</span>
                                                    </div>
                                                    <span className="font-medium text-sm">
                                                        {
                                                            foundTeacherData.contactNumber
                                                        }
                                                    </span>
                                                </div>
                                            )}

                                            {foundTeacherData.address && (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 text-base-content/70 min-w-[120px]">
                                                        <HiUserGroup className="text-xs" />
                                                        <span>Address</span>
                                                    </div>
                                                    <span className="font-medium text-xs break-all text-wrap">
                                                        {foundTeacherData.address}
                                                    </span>
                                                </div>
                                            )}

                                            {foundTeacherData.email && (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 text-base-content/70 min-w-[120px]">
                                                        <HiMail className="text-xs" />
                                                        <span>Email</span>
                                                    </div>
                                                    <span className="font-medium text-xs break-all text-wrap">
                                                        {foundTeacherData.email}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Confirmation Actions */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={handleConfirm}
                                        disabled={confirmLoading}
                                        className="btn btn-accent flex-1"
                                    >
                                        {confirmLoading ? (
                                            <>
                                                <span className="loading loading-spinner loading-sm"></span>
                                                Confirming...
                                            </>
                                        ) : (
                                            "Confirm and Complete Profile"
                                        )}
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        disabled={confirmLoading}
                                        className="btn btn-outline flex-1"
                                    >
                                        Search Again
                                    </button>
                                </div>

                                <div className="text-center">
                                    <p className="text-xs text-base-content/60">
                                        By confirming, you agree to link this
                                        teacher data to your account.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </IncompleteRouteGuard>
    );
};

export default CompleteInfo; 