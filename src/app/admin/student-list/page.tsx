"use client";
// React and Firebase imports
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    collection,
    getDocs,
    query,
    orderBy,
    deleteDoc,
    where,
    limit,
} from "firebase/firestore";
import { db } from "../../../../firebase";

// Component imports
import { ConfirmDeleteModal, Pagination } from "../../../components/common";

// Icon imports from react-icons
import {
    MdPerson,
    MdSchool,
    MdRefresh,
} from "react-icons/md";

// Toast imports
import { errorToast } from "../../../config/toast";
import { logService } from "../../../services/logService";
import { Student } from "@/interface/user";
import { ButtonXs } from "@/components/common/ButtonXs";

/**
 * @file StudentList.tsx - Admin page for displaying list of students
 * @module StudentList
 *
 * @description
 * This component provides a comprehensive view of all students in the system.
 * It handles:
 * 1. Fetching student data from Firestore
 * 2. Displaying students in a paginated table
 * 3. Search functionality by name, email, or student ID
 * 4. Sorting and filtering options
 * 5. Loading states and error handling
 *
 * @requires react
 * @requires firebase/firestore
 * @requires react-icons/md
 * @requires ../../../../firebase
 */

/**
 * StudentList Component
 * Renders a table displaying all students with search and pagination
 * @returns {JSX.Element} The rendered StudentList component
 */
const StudentList: React.FC = () => {
    const router = useRouter();
    // State for students data
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [searchField, setSearchField] = useState<string>("firstName");
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [studentsPerPage] = useState<number>(10);
    const [totalStudents, setTotalStudents] = useState<number>(0);
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");

    /**
     * Debounced search function
     */
    const debouncedSearch = useCallback(
        (searchQuery: string) => {
            const timeoutId = setTimeout(() => {
                setDebouncedSearchTerm(searchQuery);
            }, 1000); // 2 second delay

            return () => clearTimeout(timeoutId);
        },
        []
    );

    /**
     * Fetches students from Firestore with pagination and search
     */
    const fetchStudents = async (searchQuery?: string, searchBy?: string): Promise<void> => {
        try {
            setLoading(true);
            const studentsRef = collection(db, "students");
            
            let q;
            if (searchQuery && searchQuery.trim()) {
                // Search in Firebase using where clause
                q = query(
                    studentsRef,
                    where(searchBy || "firstName", ">=", searchQuery),
                    where(searchBy || "firstName", "<=", searchQuery + "\uf8ff"),
                    orderBy(searchBy || "firstName", "asc"),
                    limit(studentsPerPage)
                );
            } else {
                // Default query - latest students
                q = query(
                    studentsRef, 
                    orderBy("createdAt", "desc"),
                    limit(studentsPerPage)
                );
            }
            
            const querySnapshot = await getDocs(q);
            const studentsData: Student[] = [];
            querySnapshot.forEach((doc) => {
                studentsData.push({ id: doc.id, ...doc.data() } as Student);
            });

            setStudents(studentsData);
            setFilteredStudents(studentsData);
            setTotalStudents(studentsData.length);
        } catch (error) {
            console.error("Error fetching students:", error);
            errorToast("Failed to load students. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handles search input changes with debouncing
     */
    const handleSearchChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ): void => {
        const value = e.target.value;
        setSearchTerm(value);
        debouncedSearch(value);
    };

    /**
     * Handles search field dropdown changes
     */
    const handleSearchFieldChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ): void => {
        setSearchField(e.target.value);
    };



    /**
     * Clears search and resets to show all students
     */
    const clearSearch = async (): Promise<void> => {
        setSearchTerm("");
        setSearchField("firstName");
        setIsSearching(true);
        try {
            await fetchStudents();
        } finally {
            setIsSearching(false);
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
        ].filter(Boolean);
        return parts.join(" ");
    };

    const handleDeleteClick = (student: Student): void => {
        setStudentToDelete(student);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async (): Promise<void> => {
        if (!studentToDelete) return;

        try {
            setIsDeleting(true);
            const studentQuery = query(
                collection(db, "students"),
                where("studentId", "==", studentToDelete.studentId)
            );
            const querySnapshot = await getDocs(studentQuery);
            if (!querySnapshot.empty) {
                await deleteDoc(querySnapshot.docs[0].ref);
                
                // Log the student deletion
                await logService.logStudentDeleted(
                    studentToDelete.studentId,
                    `${studentToDelete.firstName} ${studentToDelete.lastName}`,
                    'Admin'
                );
            }
            
            // Remove from local state
            setStudents(students.filter(s => s.studentId !== studentToDelete.studentId));
            setFilteredStudents(filteredStudents.filter(s => s.studentId !== studentToDelete.studentId));
            setTotalStudents(prev => prev - 1);
            
            setDeleteModalOpen(false);
            setStudentToDelete(null);
        } catch (error) {
            console.error("Error deleting student:", error);
            errorToast("Failed to delete student. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = (): void => {
        setDeleteModalOpen(false);
        setStudentToDelete(null);
    };

    // Calculate pagination
    const indexOfLastStudent = currentPage * studentsPerPage;
    const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
    const currentStudents = filteredStudents.slice(
        indexOfFirstStudent,
        indexOfLastStudent
    );
    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

    // Fetch students on component mount
    useEffect(() => {
        fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Trigger search when debounced search term changes
    useEffect(() => {
        if (debouncedSearchTerm.trim()) {
            setIsSearching(true);
            fetchStudents(debouncedSearchTerm, searchField).finally(() => {
                setIsSearching(false);
            });
        } else {
            setIsSearching(true);
            fetchStudents().finally(() => {
                setIsSearching(false);
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchTerm, searchField]);

    // Remove the old useEffect that called filterStudents

    return (
        <div className="min-h-screen text-zinc-700">
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => router.push("/admin/create-student")}
                    className="btn btn-primary shadow-lg text-white fixed bottom-10 right-10 martian-mono text-xs"
                >
                    Create Student
                </button>
                {/* Header */}
                <div className="mb-4">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="avatar placeholder">
                                <div className="bg-primary text-primary-content rounded-lg w-10 h-10 flex items-center justify-center">
                                    <MdSchool className="text-xl" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-lg font-bold martian-mono text-primary">
                                    Student List
                                </h1>
                                <p className="text-xs text-base-content/60 font-normal italic">
                                    Manage student accounts
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
                </div>

                {/* Search and Stats */}
                <div className="card bg-base-100 shadow-sm mb-4 p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        {/* Search Form */}
                        <div className="flex-1">
                            <div className="join w-full">
                                <select
                                    value={searchField}
                                    onChange={handleSearchFieldChange}
                                    className="select select-bordered select-sm join-item martian-mono text-xs text-primary"
                                    disabled={loading || isSearching}
                                >
                                    <option value="firstName">First Name</option>
                                    <option value="lastName">Last Name</option>
                                    <option value="studentId">Student ID</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder={`Search by ${searchField}...`}
                                    className="input input-sm input-bordered join-item w-full"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                                {(searchTerm || isSearching) && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        className="btn btn-outline btn-sm join-item"
                                        disabled={loading || isSearching}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="stats stats-horizontal shadow-sm text-xs">
                            <div className="stat py-1 px-2">
                                <div className="stat-title text-xs">Loaded</div>
                                <div className="stat-value text-sm">
                                    {totalStudents}
                                </div>
                            </div>
                            <div className="stat py-1 px-2">
                                <div className="stat-title text-xs">
                                    Showing
                                </div>
                                <div className="stat-value text-sm">
                                    {filteredStudents.length}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Students Table */}
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-0">
                        {currentStudents.length === 0 ? (
                            <div className="p-4 text-center">
                                <MdPerson className="text-4xl text-base-content/20 mx-auto mb-2" />
                                <h3 className="text-sm font-semibold mb-1">
                                    {searchTerm
                                        ? "No students found"
                                        : "No students loaded"}
                                </h3>
                                <p className="text-xs text-base-content/60">
                                    {searchTerm
                                        ? "Try adjusting your search"
                                        : "Latest 10 students will appear here"}
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
                                                    Contact
                                                </th>
                                                <th className="bg-base-200 text-xs">
                                                    Details
                                                </th>
                                                <th className="bg-base-200 text-xs">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs">
                                            {currentStudents.map((student) => (
                                                <tr
                                                    key={student.studentId}
                                                    className="hover"
                                                >
                                                    <td>
                                                        <div className="flex items-center gap-2">
                                                            <div>
                                                                <div className="font-bold martian-mono text-primary text-xs">
                                                                    {getFullName(student)}
                                                                </div>
                                                                <div className="text-xs text-base-content/60 font-normal italic">
                                                                    {student.studentId}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="text-xs font-normal italic">
                                                            {student.email}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="space-y-0.5">
                                                            <span className="text-xs font-normal">
                                                                {student.sex}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="text-xs text-base-content/60">
                                                            <ButtonXs
                                                                variant="primary"
                                                                onClick={() =>
                                                                    router.push(
                                                                        `/admin/student-list/view-student?id=${student.id}`
                                                                    )
                                                                }
                                                            >
                                                                View
                                                            </ButtonXs>
                                                            <ButtonXs
                                                                variant="secondary"
                                                                onClick={() =>
                                                                    router.push(
                                                                        `/admin/student-list/edit?id=${student.id}`
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </ButtonXs>
                                                            <ButtonXs
                                                                variant="error"
                                                                onClick={() =>
                                                                    handleDeleteClick(student)
                                                                }
                                                                className="text-white"
                                                            >
                                                                Delete
                                                            </ButtonXs>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    totalItems={filteredStudents.length}
                                    itemsPerPage={studentsPerPage}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirm Delete Modal */}
            <ConfirmDeleteModal
                isOpen={deleteModalOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Delete Student"
                message="Are you sure you want to delete this student? This action will permanently remove the student from the system."
                itemName={studentToDelete ? `${studentToDelete.firstName} ${studentToDelete.lastName}` : undefined}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default StudentList;
