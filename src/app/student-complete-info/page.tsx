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
    HiCalendar,
} from "react-icons/hi";
import { useRouter } from "next/navigation";
import IncompleteRouteGuard from "@/components/common/IncompleteRouteGuard";

interface StudentData {
    studentId: string;
    birthDate: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    grade?: string;
    section?: string;
    email?: string;
    [key: string]: string | undefined;
}

const CompleteInfo = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        studentId: "",
        birthDate: "",
        
    });
    const [loading, setLoading] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [foundStudentData, setFoundStudentData] =
        useState<StudentData | null>(null);
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
        if (formData.studentId === "" || formData.birthDate === "") {
            errorToast("Please fill all the fields");
            return;
        }
        setLoading(true);
        try {
            const studentRef = collection(db, "students");
            const q = query(
                studentRef,
                where("studentId", "==", formData.studentId.toUpperCase()),
                where("birthDate", "==", formData.birthDate)
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                errorToast("Student not found");
                setFoundStudentData(null);
            } else {
                // Filter to find documents without email (unlinked accounts)
                const unlinkedStudents = querySnapshot.docs.filter((doc) => {
                    const data = doc.data();
                    return !data.email; // Only return documents without email field
                });

                if (unlinkedStudents.length === 0) {
                    errorToast(
                        "This student data is already linked to an account"
                    );
                    setFoundStudentData(null);
                } else {
                    successToast("Student found");
                    const studentData =
                        unlinkedStudents[0].data() as StudentData;
                    setFoundStudentData(studentData);
                }
            }
        } catch (error) {
            console.error("Error searching for student:", error);
            errorToast("An error occurred while searching for student");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!currentUser || !foundStudentData) {
            errorToast("No user logged in or student data not found");
            return;
        }

        setConfirmLoading(true);
        try {
            // Update the current student's document with the found data
            const studentsRef = collection(db, "students");
            const q = query(
                studentsRef,
                where(
                    "studentId",
                    "==",
                    foundStudentData.studentId.toUpperCase()
                ),
                where("birthDate", "==", foundStudentData.birthDate)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const studentDoc = querySnapshot.docs[0];
                await updateDoc(doc(db, "students", studentDoc.id), {
                    ...foundStudentData,
                    email: currentUser.email,
                    profileComplete: true,
                    updatedAt: new Date().toISOString(),
                });
            }

            successToast("Profile completed successfully!");
            // Reset form and found data
            router.push("/students/dashboard");
            setFormData({ studentId: "", birthDate: "" });
            setFoundStudentData(null);
        } catch (error) {
            console.error("Error updating student profile:", error);
            errorToast("Failed to complete profile. Please try again.");
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({ studentId: "", birthDate: "" });
        setFoundStudentData(null);
    };

    return (
        <IncompleteRouteGuard>
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
                    <div className="card-body">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-base-content">
                                Complete Your Profile
                            </h1>
                            <p className="text-base-content/60 text-sm mt-2">
                                Enter your student ID and birth date to link
                                your account
                            </p>
                        </div>

                        {!foundStudentData ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="form-control">
                                    <label
                                        className="label"
                                        htmlFor="studentId"
                                    >
                                        <span className="label-text font-medium">
                                            Student ID
                                        </span>
                                    </label>
                                    <FormInput
                                        id="studentId"
                                        name="studentId"
                                        type="text"
                                        placeholder="Enter your student ID"
                                        value={formData.studentId}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                studentId: e.target.value,
                                            })
                                        }
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <div className="form-control">
                                    <label
                                        className="label"
                                        htmlFor="birthDate"
                                    >
                                        <span className="label-text font-medium">
                                            Birth Date
                                        </span>
                                    </label>
                                    <FormInput
                                        id="birthDate"
                                        name="birthDate"
                                        type="date"
                                        placeholder="Enter your birth date"
                                        value={formData.birthDate}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                birthDate: e.target.value,
                                            })
                                        }
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <div className="form-control mt-6">
                                    <CreateButton
                                        buttonText="Search Student Data"
                                        loading={loading}
                                        loadingText="Searching..."
                                    />
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                {/* Display Found Student Data */}
                                <div className="card bg-base-200 shadow-sm">
                                    <div className="card-body p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <HiUserCircle className="text-xl text-primary" />
                                            <h3 className="card-title text-base">
                                                Found Student Information
                                            </h3>
                                        </div>

                                        <div className="grid gap-4">
                                            <div className="flex items-center gap-3">
                                                <span className="badge badge-primary text-sm">
                                                    {foundStudentData.studentId}
                                                </span>
                                            </div>

                                            {foundStudentData.firstName && (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 text-base-content/70 min-w-[120px]">
                                                        <HiUser className="text-xs" />
                                                        <span>First Name</span>
                                                    </div>
                                                    <span className="font-medium text-sm">
                                                        {
                                                            foundStudentData.firstName
                                                        }
                                                    </span>
                                                </div>
                                            )}

                                            {foundStudentData.lastName && (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 text-base-content/70 min-w-[120px]">
                                                        <HiUser className="text-xs" />
                                                        <span>Last Name</span>
                                                    </div>
                                                    <span className="font-medium text-sm">
                                                        {
                                                            foundStudentData.lastName
                                                        }
                                                    </span>
                                                </div>
                                            )}

                                            {foundStudentData.grade && (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 text-base-content/70 min-w-[120px]">
                                                        <HiAcademicCap className="text-xs" />
                                                        <span>Grade</span>
                                                    </div>
                                                    <span className="badge badge-secondary text-sm">
                                                        {foundStudentData.grade}
                                                    </span>
                                                </div>
                                            )}

                                            {foundStudentData.section && (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 text-base-content/70 min-w-[120px]">
                                                        <HiUserGroup className="text-xs" />
                                                        <span>Section</span>
                                                    </div>
                                                    <span className="badge badge-accent text-sm">
                                                        {
                                                            foundStudentData.section
                                                        }
                                                    </span>
                                                </div>
                                            )}

                                            {foundStudentData.email && (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 text-base-content/70 min-w-[120px]">
                                                        <HiMail className="text-xs" />
                                                        <span>Email</span>
                                                    </div>
                                                    <span className="font-medium text-xs break-all text-wrap">
                                                        {foundStudentData.email}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 text-base-content/70 min-w-[120px]">
                                                    <HiCalendar className="text-xs" />
                                                    <span>Birth Date</span>
                                                </div>
                                                <span className="font-medium text-xs">
                                                    {foundStudentData.birthDate}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Confirmation Actions */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={handleConfirm}
                                        disabled={confirmLoading}
                                        className="btn btn-primary flex-1"
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
                                        student data to your account.
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
