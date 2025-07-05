"use client";
// React and Firebase imports
import React, { useState, useEffect } from "react";
import {
    collection,
    getDocs,
    query,
    orderBy,
} from "firebase/firestore";
import { db } from "../../../../firebase";

// Component imports
import { LoadingOverlay } from "../../../components/common";

// Icon imports from react-icons
import {
    MdSearch,
    MdPerson,
    MdEmail,
    MdSchool,
    MdCalendarToday,
    MdLocationOn,
    MdRefresh,
} from "react-icons/md";

// Toast imports
import { errorToast } from "../../../../config/toast";

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

interface Student {
    uid: string;
    email: string;
    studentID: string;
    firstName: string;
    lastName: string;
    middleName: string;
    suffix?: string;
    gender: string;
    birthDate: string;
    address: string;
    createdAt: string;
    role: string;
}

/**
 * StudentList Component
 * Renders a table displaying all students with search and pagination
 * @returns {JSX.Element} The rendered StudentList component
 */
const StudentList: React.FC = () => {
    // State for students data
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [studentsPerPage] = useState<number>(10);
    const [totalStudents, setTotalStudents] = useState<number>(0);

    /**
     * Fetches all students from Firestore
     */
    const fetchStudents = async (): Promise<void> => {
        try {
            setLoading(true);
            const studentsRef = collection(db, "students");
            const q = query(studentsRef, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            
            const studentsData: Student[] = [];
            querySnapshot.forEach((doc) => {
                studentsData.push({ uid: doc.id, ...doc.data() } as Student);
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
     * Filters students based on search term
     */
    const filterStudents = (): void => {
        if (!searchTerm.trim()) {
            setFilteredStudents(students);
            setCurrentPage(1);
            return;
        }

        const filtered = students.filter((student) => {
            const searchLower = searchTerm.toLowerCase();
            return (
                student.firstName.toLowerCase().includes(searchLower) ||
                student.lastName.toLowerCase().includes(searchLower) ||
                student.middleName.toLowerCase().includes(searchLower) ||
                student.email.toLowerCase().includes(searchLower) ||
                student.studentID.toLowerCase().includes(searchLower)
            );
        });

        setFilteredStudents(filtered);
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
        filterStudents();
    };

    /**
     * Clears search and resets to show all students
     */
    const clearSearch = (): void => {
        setSearchTerm("");
        setFilteredStudents(students);
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
     * Gets full name of student
     */
    const getFullName = (student: Student): string => {
        const parts = [
            student.firstName,
            student.middleName,
            student.lastName,
            student.suffix,
        ].filter(Boolean);
        return parts.join(" ");
    };

    // Calculate pagination
    const indexOfLastStudent = currentPage * studentsPerPage;
    const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
    const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

    // Fetch students on component mount
    useEffect(() => {
        fetchStudents();
    }, []);

    // Filter students when search term changes
    useEffect(() => {
        filterStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, students]);

    if (loading) {
        return <LoadingOverlay />;
    }

    return (
        <div className="min-h-screen p-4 text-zinc-700">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="avatar placeholder">
                                <div className="bg-primary text-primary-content rounded-full w-10 h-10 flex items-center justify-center">
                                    <MdSchool className="text-xl" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Student List</h1>
                                <p className="text-sm text-base-content/60">
                                    Manage and view all student accounts
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchStudents}
                                className="btn btn-outline btn-sm"
                                disabled={loading}
                            >
                                <MdRefresh className="text-lg" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search and Stats */}
                <div className="card bg-base-100 shadow-sm mb-6">
                    <div className="card-body">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            {/* Search Form */}
                            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
                                <div className="join w-full">
                                    <div className="join-item flex-1">
                                        <input
                                            type="text"
                                            placeholder="Search by name, email, or student ID..."
                                            className="input input-bordered join-item w-full"
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn btn-primary join-item"
                                        disabled={loading}
                                    >
                                        <MdSearch className="text-lg" />
                                    </button>
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={clearSearch}
                                            className="btn btn-outline join-item"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </form>

                            {/* Stats */}
                            <div className="stats stats-horizontal shadow">
                                <div className="stat">
                                    <div className="stat-title text-xs">Total Students</div>
                                    <div className="stat-value text-lg">{totalStudents}</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-title text-xs">Showing</div>
                                    <div className="stat-value text-lg">
                                        {filteredStudents.length}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Students Table */}
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-0">
                        {currentStudents.length === 0 ? (
                            <div className="p-8 text-center">
                                <MdPerson className="text-6xl text-base-content/20 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">
                                    {searchTerm ? "No students found" : "No students yet"}
                                </h3>
                                <p className="text-base-content/60">
                                    {searchTerm
                                        ? "Try adjusting your search terms"
                                        : "Students will appear here once they are created"}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra w-full">
                                        <thead>
                                            <tr>
                                                <th className="bg-base-200">Student</th>
                                                <th className="bg-base-200">Contact</th>
                                                <th className="bg-base-200">Details</th>
                                                <th className="bg-base-200">Created</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentStudents.map((student) => (
                                                <tr key={student.uid} className="hover">
                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <div className="avatar placeholder">
                                                                <div className="bg-primary text-primary-content rounded-full w-10 h-10">
                                                                    <span className="text-sm font-semibold">
                                                                        {student.firstName.charAt(0)}
                                                                        {student.lastName.charAt(0)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold">
                                                                    {getFullName(student)}
                                                                </div>
                                                                <div className="text-sm text-base-content/60">
                                                                    ID: {student.studentID}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <MdEmail className="text-base-content/60" />
                                                            <span className="font-mono">
                                                                {student.email}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="space-y-1 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <MdCalendarToday className="text-base-content/60" />
                                                                <span>
                                                                    {formatDate(student.birthDate)} • {student.gender}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <MdLocationOn className="text-base-content/60" />
                                                                <span className="truncate max-w-xs">
                                                                    {student.address}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="text-sm text-base-content/60">
                                                            {formatDate(student.createdAt)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center p-4 border-t">
                                        <div className="join">
                                            <button
                                                className="join-item btn btn-sm"
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                «
                                            </button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                <button
                                                    key={page}
                                                    className={`join-item btn btn-sm ${
                                                        currentPage === page ? "btn-active" : ""
                                                    }`}
                                                    onClick={() => setCurrentPage(page)}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                            <button
                                                className="join-item btn btn-sm"
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

export default StudentList; 