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
} from "firebase/firestore";
import { db } from "../../../../firebase";
import { Student } from "@/interface/user";
import { formatDate } from "@/config/format";
import { successToast, errorToast } from "@/config/toast";
import { logService } from "@/services/logService";
import { useCurrentAdmin } from "@/hooks";
import { MdPerson, MdCheckCircle, MdRefresh } from "react-icons/md";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

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
     * Handles approving a student account
     * @param {Student} student - The student to approve
     */
    const handleApprove = async (student: Student): Promise<void> => {
        if (!student.id) {
            errorToast("Student ID is missing");
            return;
        }

        try {
            setApprovingId(student.id);
            const studentRef = doc(db, "students", student.id);
            await updateDoc(studentRef, {
                approved: true,
            });

            // Log the student approval
            await logService.logStudentApproved(
                student.studentId,
                `${student.firstName} ${student.lastName}`,
                admin?.name || "Admin"
            );

            successToast(
                `Student ${student.firstName} ${student.lastName} has been approved`
            );

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
                                                        <button
                                                            className="btn btn-success btn-xs text-white martian-mono text-xs"
                                                            onClick={() =>
                                                                handleApprove(
                                                                    student
                                                                )
                                                            }
                                                            disabled={
                                                                approvingId ===
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
        </div>
    );
};

export default ApprovedStudent;

