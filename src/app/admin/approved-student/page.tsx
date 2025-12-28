"use client";
// React and Firebase imports
import React, { useState, useEffect, useMemo } from "react";
import {
    collection,
    getDocs,
    query,
    orderBy,
    doc,
    updateDoc,
    deleteDoc,
} from "firebase/firestore";
import { db } from "../../../../firebase";
import { Student } from "@/interface/user";
import { formatDate } from "@/config/format";
import { successToast, errorToast } from "@/config/toast";
import { logService } from "@/services/logService";
import { useCurrentAdmin } from "@/hooks";
import { MdPerson, MdCheckCircle, MdRefresh, MdCancel } from "react-icons/md";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { MdWarning } from "react-icons/md";

const PAGE_SIZE = 10;

/**
 * @file ApprovedStudent.tsx - Admin page for approving student accounts
 * @module ApprovedStudent
 *
 * @description
 * This component provides a table view of unapproved students.
 * It handles:
 * 1. Fetching unapproved students from Firestore
 * 2. Displaying students in a paginated table
 * 3. Approving student accounts
 * 4. Search and filter functionality
 *
 * @requires react
 * @requires firebase/firestore
 * @requires react-icons/md
 * @requires ../../../../firebase
 */

/**
 * ApprovedStudent Component
 * Renders a table displaying unapproved students with approve functionality
 * @returns {JSX.Element} The rendered ApprovedStudent component
 */
const ApprovedStudent: React.FC = () => {
    const { admin } = useCurrentAdmin();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
    const [studentToApprove, setStudentToApprove] = useState<Student | null>(null);
    const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
    const [studentToReject, setStudentToReject] = useState<Student | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    /**
     * Fetches unapproved students from Firestore
     */
    const fetchStudents = async (): Promise<void> => {
        try {
            setLoading(true);
            // Fetch all students and filter for unapproved ones
            // (approved is false or doesn't exist)
            const studentsRef = collection(db, "students");
            const q = query(studentsRef, orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const studentsData: Student[] = [];
            snapshot.forEach((doc) => {
                const student = { id: doc.id, ...doc.data() } as Student;
                // Include students where approved is false or undefined
                if (student.approved === false || student.approved === undefined) {
                    studentsData.push(student);
                }
            });
            setStudents(studentsData);
        } catch (error) {
            console.error("Error fetching students:", error);
            errorToast("Failed to load students. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Opens the confirmation modal for approving a student
     * @param {Student} student - The student to approve
     */
    const handleApproveClick = (student: Student): void => {
        setStudentToApprove(student);
        setConfirmModalOpen(true);
    };

    /**
     * Handles approving a student account after confirmation
     */
    const handleApproveConfirm = async (): Promise<void> => {
        if (!studentToApprove || !studentToApprove.id) {
            errorToast("Student ID is missing");
            setConfirmModalOpen(false);
            setStudentToApprove(null);
            return;
        }

        try {
            setApprovingId(studentToApprove.id);
            const studentRef = doc(db, "students", studentToApprove.id);
            await updateDoc(studentRef, {
                approved: true,
            });

            // Log the student approval
            await logService.logStudentApproved(
                studentToApprove.studentId,
                `${studentToApprove.firstName} ${studentToApprove.lastName}`,
                admin?.name || "Admin"
            );

            successToast(
                `Student ${studentToApprove.firstName} ${studentToApprove.lastName} has been approved`
            );

            // Close modal and reset state
            setConfirmModalOpen(false);
            setStudentToApprove(null);

            // Refresh the list
            await fetchStudents();
        } catch (error) {
            console.error("Error approving student:", error);
            errorToast("Failed to approve student. Please try again.");
        } finally {
            setApprovingId(null);
        }
    };

    /**
     * Closes the confirmation modal
     */
    const handleCancelApprove = (): void => {
        setConfirmModalOpen(false);
        setStudentToApprove(null);
    };

    /**
     * Opens the rejection confirmation modal
     * @param {Student} student - The student to reject
     */
    const handleRejectClick = (student: Student): void => {
        setStudentToReject(student);
        setRejectModalOpen(true);
    };

    /**
     * Handles rejecting and deleting a student account after confirmation
     */
    const handleRejectConfirm = async (): Promise<void> => {
        if (!studentToReject || !studentToReject.id) {
            errorToast("Student ID is missing");
            setRejectModalOpen(false);
            setStudentToReject(null);
            return;
        }

        try {
            setRejectingId(studentToReject.id);

            // Delete from Firestore
            const studentRef = doc(db, "students", studentToReject.id);
            await deleteDoc(studentRef);

            // Log the student rejection/deletion
            await logService.logStudentDeleted(
                studentToReject.studentId,
                `${studentToReject.firstName} ${studentToReject.lastName}`,
                admin?.name || "Admin",
                admin?.name || "Admin"
            );

            successToast(
                `Student ${studentToReject.firstName} ${studentToReject.lastName} has been rejected and removed`
            );

            // Close modal and reset state
            setRejectModalOpen(false);
            setStudentToReject(null);

            // Refresh the list
            await fetchStudents();
        } catch (error) {
            console.error("Error rejecting student:", error);
            errorToast("Failed to reject student. Please try again.");
        } finally {
            setRejectingId(null);
        }
    };

    /**
     * Closes the rejection confirmation modal
     */
    const handleCancelReject = (): void => {
        setRejectModalOpen(false);
        setStudentToReject(null);
    };

    /**
     * Gets full name of student
     */
    const getFullName = (student: Student): string => {
        const parts = [
            student.firstName,
            student.middleName?.charAt(0) + ".",
            student.lastName,
            student.suffix,
        ].filter(Boolean);
        return parts.join(" ");
    };

    // Filter and search logic
    const filtered = useMemo(() => {
        let data = students;
        if (search.trim()) {
            const s = search.trim().toLowerCase();
            data = data.filter(
                (student) =>
                    getFullName(student).toLowerCase().includes(s) ||
                    student.studentId?.toLowerCase().includes(s) ||
                    student.email?.toLowerCase().includes(s)
            );
        }
        return data;
    }, [students, search]);

    // Pagination logic
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    function handlePageChange(page: number) {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Fetch students on component mount
    useEffect(() => {
        fetchStudents();
    }, []);

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="avatar placeholder">
                        <div className="bg-primary text-primary-content rounded-lg w-10 h-10 flex items-center justify-center">
                            <MdCheckCircle className="text-xl" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold martian-mono text-primary">
                            Approve Students
                        </h1>
                        <p className="text-xs text-base-content/60 font-normal italic">
                            Review and approve student accounts
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => fetchStudents()}
                    className="btn btn-outline btn-xs martian-mono text-xs text-primary"
                    disabled={loading}
                >
                    <MdRefresh className="text-sm" />
                    Refresh
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-4 flex items-center gap-2">
                <input
                    type="text"
                    className="input input-bordered input-sm w-full max-w-xs martian-mono text-xs text-primary rounded-none"
                    placeholder="Search by name, ID, or email"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                />
            </div>

            {/* Students Table */}
            {loading ? (
                <div className="text-center py-12 text-zinc-400">
                    Loading...
                </div>
            ) : (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-0">
                        {paginated.length === 0 ? (
                            <div className="p-4 text-center">
                                <MdPerson className="text-4xl text-base-content/20 mx-auto mb-2" />
                                <h3 className="text-sm font-semibold mb-1">
                                    {search
                                        ? "No students found"
                                        : "No unapproved students"}
                                </h3>
                                <p className="text-xs text-base-content/60">
                                    {search
                                        ? "Try adjusting your search"
                                        : "All students have been approved"}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra table-sm w-full">
                                        <thead>
                                            <tr>
                                                <th className="bg-base-200 text-xs">
                                                    Student
                                                </th>
                                                <th className="bg-base-200 text-xs">
                                                    LRN
                                                </th>
                                                <th className="bg-base-200 text-xs">
                                                    Email
                                                </th>
                                                <th className="bg-base-200 text-xs">
                                                    Gender
                                                </th>
                                                <th className="bg-base-200 text-xs">
                                                    Birth Date
                                                </th>
                                                <th className="bg-base-200 text-xs">
                                                    Created At
                                                </th>
                                                <th className="bg-base-200 text-xs">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs">
                                            {paginated.map((student) => (
                                                <tr
                                                    key={student.id}
                                                    className="hover"
                                                >
                                                    <td>
                                                        <div className="flex items-center gap-2">
                                                            <div>
                                                                <div className="font-bold martian-mono text-primary text-xs">
                                                                    {getFullName(
                                                                        student
                                                                    )}
                                                                </div>
                                                                <div className="text-[10px] text-base-content/60 font-normal">
                                                                    {student.address}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="text-xs font-normal text-primary martian-mono">
                                                            {student.studentId}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="text-xs font-normal text-primary">
                                                            {student.email || "N/A"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="text-xs font-normal">
                                                            {student.sex || "N/A"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="text-xs font-normal text-base-content/60">
                                                            {student.birthDate
                                                                ? formatDate(
                                                                      student.birthDate
                                                                  )
                                                                : "N/A"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="text-xs font-normal text-base-content/60">
                                                            {student.createdAt
                                                                ? formatDate(
                                                                      student.createdAt
                                                                  )
                                                                : "N/A"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="flex gap-2">
                                                            <button
                                                                className="btn btn-success btn-xs text-white martian-mono text-xs"
                                                                onClick={() =>
                                                                    handleApproveClick(
                                                                        student
                                                                    )
                                                                }
                                                                disabled={
                                                                    approvingId ===
                                                                        student.id ||
                                                                    rejectingId ===
                                                                        student.id
                                                                }
                                                            >
                                                                {approvingId ===
                                                                student.id ? (
                                                                    <>
                                                                        <span className="loading loading-spinner loading-xs"></span>
                                                                        Approving...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <MdCheckCircle className="text-sm" />
                                                                        Approve
                                                                    </>
                                                                )}
                                                            </button>
                                                            <button
                                                                className="btn btn-error btn-xs text-white martian-mono text-xs"
                                                                onClick={() =>
                                                                    handleRejectClick(
                                                                        student
                                                                    )
                                                                }
                                                                disabled={
                                                                    approvingId ===
                                                                        student.id ||
                                                                    rejectingId ===
                                                                        student.id
                                                                }
                                                            >
                                                                {rejectingId ===
                                                                student.id ? (
                                                                    <>
                                                                        <span className="loading loading-spinner loading-xs"></span>
                                                                        Rejecting...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <MdCancel className="text-sm" />
                                                                        Reject
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                        className="btn btn-sm btn-outline"
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                    >
                        <HiChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <span className="text-sm">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        className="btn btn-sm btn-outline"
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                    >
                        Next <HiChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Confirm Approve Modal */}
            {confirmModalOpen && studentToApprove && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-md">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="avatar placeholder">
                                <div className="bg-success rounded-lg w-8 h-8 flex items-center justify-center text-white">
                                    <MdWarning className="text-lg" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">
                                    Approve Student
                                </h3>
                                <p className="text-sm text-base-content/60">
                                    Confirm approval of this student account
                                </p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-base-content/80 mb-2">
                                Are you sure you want to approve this student?
                            </p>
                            <div className="bg-base-200 rounded-lg p-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-primary">
                                            {getFullName(studentToApprove)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-base-content/60">
                                        LRN: {studentToApprove.studentId}
                                    </div>
                                    {studentToApprove.email && (
                                        <div className="text-xs text-base-content/60">
                                            Email: {studentToApprove.email}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="modal-action">
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={handleCancelApprove}
                                disabled={approvingId === studentToApprove.id}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-success btn-sm text-white"
                                onClick={handleApproveConfirm}
                                disabled={approvingId === studentToApprove.id}
                            >
                                {approvingId === studentToApprove.id ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        Approving...
                                    </>
                                ) : (
                                    <>
                                        <MdCheckCircle className="text-sm" />
                                        Approve
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    <div
                        className="modal-backdrop"
                        onClick={handleCancelApprove}
                    ></div>
                </div>
            )}

            {/* Confirm Reject Modal */}
            {rejectModalOpen && studentToReject && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-md">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="avatar placeholder">
                                <div className="bg-error rounded-lg w-8 h-8 flex items-center justify-center text-white">
                                    <MdWarning className="text-lg" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-error">
                                    Reject Student
                                </h3>
                                <p className="text-sm text-base-content/60">
                                    This will permanently delete the account
                                </p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-base-content/80 mb-2">
                                Are you sure you want to reject and delete this
                                student account? This action cannot be undone.
                            </p>
                            <div className="bg-base-200 rounded-lg p-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-primary">
                                            {getFullName(studentToReject)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-base-content/60">
                                        LRN: {studentToReject.studentId}
                                    </div>
                                    {studentToReject.email && (
                                        <div className="text-xs text-base-content/60">
                                            Email: {studentToReject.email}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-3 p-2 bg-error/10 rounded-lg border border-error/20">
                                <p className="text-xs text-error">
                                    ⚠️ This will permanently delete the student
                                    from the database.
                                </p>
                            </div>
                        </div>

                        <div className="modal-action">
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={handleCancelReject}
                                disabled={rejectingId === studentToReject.id}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-error btn-sm text-white"
                                onClick={handleRejectConfirm}
                                disabled={rejectingId === studentToReject.id}
                            >
                                {rejectingId === studentToReject.id ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        Rejecting...
                                    </>
                                ) : (
                                    <>
                                        <MdCancel className="text-sm" />
                                        Reject & Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    <div
                        className="modal-backdrop"
                        onClick={handleCancelReject}
                    ></div>
                </div>
            )}
        </div>
    );
};

export default ApprovedStudent;

