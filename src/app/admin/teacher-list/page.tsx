"use client";
// React and Firebase imports
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    collection,
    getDocs,
    query,
    orderBy,
} from "firebase/firestore";
import { db } from "../../../../firebase";

// Component imports
import { LoadingOverlay} from "../../../components/common";

// Icon imports from react-icons
import {
    MdSearch,
    MdPerson,
    MdEmail,
    MdRefresh,
    MdWork,
} from "react-icons/md";

// Toast imports
import { errorToast } from "../../../config/toast";
import { Teacher } from "@/interface/user";

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
    const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [teachersPerPage] = useState<number>(10);
    const [totalTeachers, setTotalTeachers] = useState<number>(0);

    /**
     * Fetches all teachers from Firestore
     */
    const fetchTeachers = async (): Promise<void> => {
        try {
            setLoading(true);
            const teachersRef = collection(db, "teachers");
            const q = query(teachersRef, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            
            const teachersData: Teacher[] = [];
            querySnapshot.forEach((doc) => {
                teachersData.push({ ...doc.data() } as Teacher);
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
     * Filters teachers based on search term
     */
    const filterTeachers = (): void => {
        if (!searchTerm.trim()) {
            setFilteredTeachers(teachers);
            setCurrentPage(1);
            return;
        }

        const filtered = teachers.filter((teacher) => {
            const searchLower = searchTerm.toLowerCase();
            return (
                teacher.firstName?.toLowerCase().includes(searchLower) ||
                teacher.lastName?.toLowerCase().includes(searchLower) ||
                teacher.middleName?.toLowerCase().includes(searchLower) ||
                teacher.email?.toLowerCase().includes(searchLower) ||
                teacher.employeeId.toLowerCase().includes(searchLower)
            );
        });

        setFilteredTeachers(filtered);
        setCurrentPage(1);
    };

    /**
     * Handles search input changes
     */
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setSearchTerm(e.target.value);
    };

    /**
     * Handles search form submission
     */
    const handleSearchSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        filterTeachers();
    };

    /**
     * Clears search and resets to show all teachers
     */
    const clearSearch = (): void => {
        setSearchTerm("");
        setFilteredTeachers(teachers);
        setCurrentPage(1);
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

    // Calculate pagination
    const indexOfLastTeacher = currentPage * teachersPerPage;
    const indexOfFirstTeacher = indexOfLastTeacher - teachersPerPage;
    const currentTeachers = filteredTeachers.slice(indexOfFirstTeacher, indexOfLastTeacher);
    const totalPages = Math.ceil(filteredTeachers.length / teachersPerPage);

    // Fetch teachers on component mount
    useEffect(() => {
        fetchTeachers();
    }, []);

    // Filter teachers when search term changes
    useEffect(() => {
        filterTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, teachers]);

    if (loading) {
        return <LoadingOverlay />;
    }

    return (
        <div className="min-h-screen p-2 text-zinc-700">
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => router.push("/admin/create-teacher")}
                    className="btn btn-accent shadow-lg text-white fixed bottom-10 right-10"
                >
                    Create Teacher
                </button>
                {/* Header */}
                <div className="mb-4">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="avatar placeholder">
                                <div className="bg-accent text-accent-content rounded-lg w-8 h-8 flex items-center justify-center">
                                    <MdWork className="text-lg" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold">Teacher List</h1>
                                <p className="text-xs text-base-content/60">Manage teacher accounts</p>
                            </div>
                        </div>
                        
                        <button
                            onClick={fetchTeachers}
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
                        <form onSubmit={handleSearchSubmit} className="flex-1">
                            <div className="join w-full">
                                <input
                                    type="text"
                                    placeholder="Search teachers..."
                                    className="input input-sm input-bordered join-item w-full"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                                <button
                                    type="submit"
                                    className="btn btn-accent btn-sm join-item"
                                    disabled={loading}
                                >
                                    <MdSearch className="text-sm" />
                                </button>
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        className="btn btn-outline btn-sm join-item"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Stats */}
                        <div className="stats stats-horizontal shadow-sm text-xs">
                            <div className="stat py-1 px-2">
                                <div className="stat-title text-xs">Total</div>
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
                                    {searchTerm ? "No teachers found" : "No teachers yet"}
                                </h3>
                                <p className="text-xs text-base-content/60">
                                    {searchTerm ? "Try adjusting your search" : "Teachers will appear here"}
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
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs">
                                            {currentTeachers.map((teacher) => (
                                                <tr key={teacher.employeeId} className="hover">
                                                    <td>
                                                        <div className="flex items-center gap-2">
                                                            <div className="avatar placeholder">
                                                                <div className="bg-accent text-accent-content rounded-lg w-7 h-7">
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
                                                            {formatDate(teacher.createdAt)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center p-2 border-t">
                                        <div className="join">
                                            <button
                                                className="join-item btn btn-xs"
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                «
                                            </button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                <button
                                                    key={page}
                                                    className={`join-item btn btn-xs ${
                                                        currentPage === page ? "btn-active" : ""
                                                    }`}
                                                    onClick={() => setCurrentPage(page)}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                            <button
                                                className="join-item btn btn-xs"
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                            >
                                                »
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherList; 