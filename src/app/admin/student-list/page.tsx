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
    MdMoreHoriz,
} from "react-icons/md";

// Toast imports
import { errorToast } from "../../../config/toast";
import { logService } from "../../../services/logService";
import { Student } from "@/interface/user";

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
    const [statusFilter, setStatusFilter] = useState<string>("all");
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
     * Handles status filter changes
     */
    const handleStatusFilterChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ): void => {
        setStatusFilter(e.target.value);
        setCurrentPage(1); // Reset to first page when filter changes
    };

    /**
     * Filters students based on search term and status
     */
    const filterStudents = (): void => {
        let filtered = [...students];

        // Filter by search term
        if (debouncedSearchTerm.trim()) {
            const searchLower = debouncedSearchTerm.toLowerCase();
            filtered = filtered.filter((student) => {
                const searchValue = searchField === "firstName" 
                    ? student.firstName?.toLowerCase() || ""
                    : searchField === "lastName"
                    ? student.lastName?.toLowerCase() || ""
                    : student.studentId?.toLowerCase() || "";
                
                return searchValue.includes(searchLower);
            });
        }

        // Filter by status
        if (statusFilter !== "all") {
            filtered = filtered.filter((student) => {
                if (statusFilter === "not-set") {
                    return !student.status;
                }
                return student.status === statusFilter;
            });
        }

        setFilteredStudents(filtered);
    };



    /**
     * Clears search and resets to show all students
     */
    const clearSearch = async (): Promise<void> => {
        setSearchTerm("");
        setSearchField("firstName");
        setStatusFilter("all");
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

    // Filter students when status filter changes or when students data changes
    useEffect(() => {
        filterStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, students, debouncedSearchTerm, searchField]);

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
                    <div className="flex flex-col gap-3">
                        {/* Search and Filter Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
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

                            {/* Status Filter */}
                            <div className="sm:w-48">
                                <select
                                    value={statusFilter}
                                    onChange={handleStatusFilterChange}
                                    className="select select-bordered select-sm w-full martian-mono text-xs text-primary"
                                    disabled={loading || isSearching}
                                >
                                    <option value="all">All Status</option>
                                    <option value="enrolled">Enrolled</option>
                                    <option value="transfer-in">Transfer In</option>
                                    <option value="transfer-out">Transfer Out</option>
                                    <option value="incomplete">Incomplete</option>
                                    <option value="graduated">Graduated</option>
                                    <option value="not-set">Not Set</option>
                                </select>
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
                            {statusFilter !== "all" && (
                                <div className="stat py-1 px-2">
                                    <div className="stat-title text-xs">
                                        {statusFilter === "not-set" ? "Not Set" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).replace("-", " ")}
                                    </div>
                                    <div className="stat-value text-sm">
                                        {filteredStudents.length}
                                    </div>
                                </div>
                            )}
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
                                                    Status
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
                                            {currentStudents.map((student) => {
                                                const getStatusColor = (status?: string) => {
                                                    switch (status) {
                                                        case "enrolled": return "badge-success";
                                                        case "transfer-in": return "badge-info";
                                                        case "transfer-out": return "badge-warning";
                                                        case "incomplete": return "badge-warning";
                                                        case "graduated": return "badge-primary";
                                                        default: return "badge-neutral";
                                                    }
                                                };

                                                const getStatusLabel = (status?: string) => {
                                                    switch (status) {
                                                        case "enrolled": return "Enrolled";
                                                        case "transfer-in": return "Transfer In";
                                                        case "transfer-out": return "Transfer Out";
                                                        case "incomplete": return "Incomplete";
                                                        case "graduated": return "Graduated";
                                                        default: return "Not Set";
                                                    }
                                                };

                                                return (
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
                                                                    <div className="text-[10px] text-base-content/60 font-normal">
                                                                        {student.studentId}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`badge badge-xs p-2 text-white text-[10px] ${getStatusColor(student.status)}`}>
                                                                {getStatusLabel(student.status)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="text-xs font-normal text-primary">
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
                                                                <div className="dropdown dropdown-end">
                                                                    <button tabIndex={0} className="btn btn-ghost btn-xs">
                                                                        <span className="text-lg"><MdMoreHoriz/></span>
                                                                    </button>
                                                                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-32 border border-base-300" style={{zIndex: 9999, position: 'fixed', marginRight: '40px'}}>
                                                                        <li>
                                                                            <button
                                                                                className="text-primary hover:bg-base-200"
                                                                                onClick={() =>
                                                                                    router.push(
                                                                                        `/admin/student-list/view-student?id=${student.id}`
                                                                                    )
                                                                                }
                                                                            >
                                                                                View
                                                                            </button>
                                                                        </li>
                                                                        <li>
                                                                            <button
                                                                                className="text-secondary hover:bg-base-200"
                                                                                onClick={() =>
                                                                                    router.push(
                                                                                        `/admin/student-list/edit?id=${student.id}`
                                                                                    )
                                                                                }
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                        </li>
                                                                        <li>
                                                                            <button
                                                                                className="text-error hover:bg-base-200"
                                                                                onClick={() => handleDeleteClick(student)}
                                                                            >
                                                                                Delete
                                                                            </button>
                                                                        </li>
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
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
