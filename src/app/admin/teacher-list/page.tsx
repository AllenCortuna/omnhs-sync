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
    MdEmail,
    MdRefresh,
    MdWork,
} from "react-icons/md";

// Toast imports
import { errorToast } from "../../../config/toast";
import { logService } from "../../../services/logService";
import { Teacher } from "@/interface/user";
import { ButtonXs } from "@/components/common/ButtonXs";

/**
 * @file TeacherList.tsx - Admin page for displaying list of teachers
 * @module TeacherList
 * 
 * @description
 * This component provides a comprehensive view of all teachers in the system.
 * It handles:
 * 1. Fetching teacher data from Firestore
 * 2. Displaying teachers in a paginated table
 * 3. Search functionality by name, email, or employee ID
 * 4. Sorting and filtering options
 * 5. Loading states and error handling
 *
 * @requires react
 * @requires firebase/firestore
 * @requires react-icons/md
 * @requires ../../../../firebase
 */


/**
 * TeacherList Component
 * Renders a table displaying all teachers with search and pagination
 * @returns {JSX.Element} The rendered TeacherList component
 */
const TeacherList: React.FC = () => {
    const router = useRouter();
    // State for teachers data
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [searchField, setSearchField] = useState<string>("firstName");
    const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [teachersPerPage] = useState<number>(10);
    const [totalTeachers, setTotalTeachers] = useState<number>(0);
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
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
            }, 1000); // 1 second delay

            return () => clearTimeout(timeoutId);
        },
        []
    );

    /**
     * Fetches teachers from Firestore with pagination and search
     */
    const fetchTeachers = async (searchQuery?: string, searchBy?: string): Promise<void> => {
        try {
            setLoading(true);
            const teachersRef = collection(db, "teachers");
            
            let q;
            if (searchQuery && searchQuery.trim()) {
                // Search in Firebase using where clause
                q = query(
                    teachersRef,
                    where(searchBy || "firstName", ">=", searchQuery),
                    where(searchBy || "firstName", "<=", searchQuery + "\uf8ff"),
                    orderBy(searchBy || "firstName", "asc"),
                    limit(teachersPerPage)
                );
            } else {
                // Default query - latest teachers
                q = query(
                    teachersRef, 
                    orderBy("createdAt", "desc"),
                    limit(teachersPerPage)
                );
            }
            
            const querySnapshot = await getDocs(q);
            const teachersData: Teacher[] = [];
            querySnapshot.forEach((doc) => {
                teachersData.push({ id: doc.id, ...doc.data() } as unknown as Teacher);
            });

            setTeachers(teachersData);
            setFilteredTeachers(teachersData);
            setTotalTeachers(teachersData.length);
        } catch (error) {
            console.error("Error fetching teachers:", error);
            errorToast("Failed to load teachers. Please try again.");
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
     * Clears search and resets to show all teachers
     */
    const clearSearch = async (): Promise<void> => {
        setSearchTerm("");
        setSearchField("firstName");
        setIsSearching(true);
        try {
            await fetchTeachers();
        } finally {
            setIsSearching(false);
        }
    };

    /**
     * Formats date for display
     */
    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    /**
     * Gets full name of teacher
     */
    const getFullName = (teacher: Teacher): string => {
        const parts = [
            teacher.firstName,
            teacher.middleName?.charAt(0) + ".",
            teacher.lastName,
        ].filter(Boolean);
        return parts.join(" ");
    };

    const handleDeleteClick = (teacher: Teacher): void => {
        setTeacherToDelete(teacher);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async (): Promise<void> => {
        if (!teacherToDelete) return;

        try {
            setIsDeleting(true);
            const teacherQuery = query(
                collection(db, "teachers"),
                where("employeeId", "==", teacherToDelete.employeeId)
            );
            const querySnapshot = await getDocs(teacherQuery);
            if (!querySnapshot.empty) {
                await deleteDoc(querySnapshot.docs[0].ref);
                
                // Log the teacher deletion
                await logService.logTeacherDeleted(
                    teacherToDelete.employeeId,
                    `${teacherToDelete.firstName} ${teacherToDelete.lastName}`,
                    'Admin'
                );
            }
            
            // Remove from local state
            setTeachers(teachers.filter(t => t.employeeId !== teacherToDelete.employeeId));
            setFilteredTeachers(filteredTeachers.filter(t => t.employeeId !== teacherToDelete.employeeId));
            setTotalTeachers(prev => prev - 1);
            
            setDeleteModalOpen(false);
            setTeacherToDelete(null);
        } catch (error) {
            console.error("Error deleting teacher:", error);
            errorToast("Failed to delete teacher. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = (): void => {
        setDeleteModalOpen(false);
        setTeacherToDelete(null);
    };

    // Calculate pagination
    const indexOfLastTeacher = currentPage * teachersPerPage;
    const indexOfFirstTeacher = indexOfLastTeacher - teachersPerPage;
    const currentTeachers = filteredTeachers.slice(
        indexOfFirstTeacher,
        indexOfLastTeacher
    );
    const totalPages = Math.ceil(filteredTeachers.length / teachersPerPage);

    // Fetch teachers on component mount
    useEffect(() => {
        fetchTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Trigger search when debounced search term changes
    useEffect(() => {
        if (debouncedSearchTerm.trim()) {
            setIsSearching(true);
            fetchTeachers(debouncedSearchTerm, searchField).finally(() => {
                setIsSearching(false);
            });
        } else {
            setIsSearching(true);
            fetchTeachers().finally(() => {
                setIsSearching(false);
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchTerm, searchField]);

    return (
        <div className="min-h-screen text-zinc-700">
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => router.push("/admin/create-teacher")}
                    className="btn btn-primary shadow-lg text-white fixed bottom-10 right-10"
                >
                    Create Teacher
                </button>
                {/* Header */}
                <div className="mb-4">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="avatar placeholder">
                                <div className="bg-primary text-primary-content rounded-lg w-8 h-8 flex items-center justify-center">
                                    <MdWork className="text-lg" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold">Teacher List</h1>
                                <p className="text-xs text-base-content/60">Manage teacher accounts</p>
                            </div>
                        </div>
                        
                        <button
                            onClick={() => fetchTeachers()}
                            className="btn btn-outline btn-xs"
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
                                    className="select select-bordered select-sm join-item"
                                    disabled={loading || isSearching}
                                >
                                    <option value="firstName">First Name</option>
                                    <option value="lastName">Last Name</option>
                                    <option value="employeeId">Employee ID</option>
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
                                <div className="stat-value text-sm">{totalTeachers}</div>
                            </div>
                            <div className="stat py-1 px-2">
                                <div className="stat-title text-xs">Showing</div>
                                <div className="stat-value text-sm">{filteredTeachers.length}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Teachers Table */}
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-0">
                        {currentTeachers.length === 0 ? (
                            <div className="p-4 text-center">
                                <MdPerson className="text-4xl text-base-content/20 mx-auto mb-2" />
                                <h3 className="text-sm font-semibold mb-1">
                                    {searchTerm
                                        ? "No teachers found"
                                        : "No teachers loaded"}
                                </h3>
                                <p className="text-xs text-base-content/60">
                                    {searchTerm
                                        ? "Try adjusting your search"
                                        : "Latest 10 teachers will appear here"}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra table-sm w-full">
                                        <thead>
                                            <tr>
                                                <th className="bg-base-200 text-xs">Teacher</th>
                                                <th className="bg-base-200 text-xs">Contact</th>
                                                <th className="bg-base-200 text-xs">Position</th>
                                                <th className="bg-base-200 text-xs">Created</th>
                                                <th className="bg-base-200 text-xs">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs">
                                            {currentTeachers.map((teacher) => (
                                                <tr key={teacher.employeeId} className="hover">
                                                    <td>
                                                        <div className="flex items-center gap-2">
                                                            <div className="avatar placeholder">
                                                                <div className="bg-primary text-primary-content rounded-lg w-7 h-7">
                                                                    <span className="text-xs">
                                                                        {teacher.firstName?.charAt(0)}
                                                                        {teacher.lastName?.charAt(0)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">{getFullName(teacher)}</div>
                                                                <div className="text-xs text-base-content/60">
                                                                    ID: {teacher.employeeId}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center gap-1">
                                                            <MdEmail className="text-base-content/60 text-xs" />
                                                            <span className="text-xs">{teacher.email}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="text-xs text-base-content/60">
                                                            {teacher.designation || "N/A"}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="text-xs text-base-content/60">
                                                            {formatDate(teacher.createdAt)}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="text-xs text-base-content/60">
                                                            <ButtonXs
                                                                variant="primary"
                                                                onClick={() =>
                                                                    router.push(
                                                                            `/admin/teacher-list/view-teacher?id=${teacher.id}`
                                                                    )
                                                                }
                                                            >
                                                                View
                                                            </ButtonXs>
                                                            <ButtonXs
                                                                variant="secondary"
                                                                onClick={() =>
                                                                    router.push(
                                                                        `/admin/teacher-list/edit?id=${teacher.id}`
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </ButtonXs>
                                                            <ButtonXs
                                                                variant="error"
                                                                onClick={() =>
                                                                    handleDeleteClick(teacher)
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
                                    totalItems={filteredTeachers.length}
                                    itemsPerPage={teachersPerPage}
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
                title="Delete Teacher"
                message="Are you sure you want to delete this teacher? This action will permanently remove the teacher from the system."
                itemName={teacherToDelete ? `${teacherToDelete.firstName} ${teacherToDelete.lastName}` : undefined}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default TeacherList; 