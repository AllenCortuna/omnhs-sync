"use client";
import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useSaveUserData } from "@/hooks";
import { strandService } from "@/services/strandService";
import { errorToast } from "@/config/toast";
import type { Enrollment, Strand } from "@/interface/info";
import { LoadingOverlay } from "@/components/common";
import { useRouter } from "next/navigation";
import { 
    HiAcademicCap, 
    HiPlus,
    HiEye,
    HiDocument,
    HiDownload,
    HiPencil
} from "react-icons/hi";
import { formatDate } from "@/config/format";

interface EnrollmentWithStrand extends Enrollment {
    strandName?: string;
    rejectionReason?: string;
}

const EnrollmentList: React.FC = () => {
    const { userData, isLoading: userLoading } = useSaveUserData({
        role: "student",
    });
    const [enrollments, setEnrollments] = useState<EnrollmentWithStrand[]>([]);
    const [strands, setStrands] = useState<Strand[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Fetch strands for display
    useEffect(() => {
        strandService
            .getAllStrands()
            .then((data) => setStrands(data))
            .catch((error) => {
                console.error('Error fetching strands:', error);
                setStrands([]);
            });
    }, []);

    // Fetch enrollments for the current student
    useEffect(() => {
        const fetchEnrollments = async () => {
            if (!userData || userLoading) return;
            
            if (!("studentId" in userData)) {
                errorToast("User data is not a student");
                return;
            }

            try {
                setLoading(true);
                const enrollmentsQuery = query(
                    collection(db, "enrollment"),
                    where("studentId", "==", userData.studentId),
                    orderBy("createdAt", "desc")
                );
                const querySnapshot = await getDocs(enrollmentsQuery);
                const enrollmentsData: EnrollmentWithStrand[] = [];
                
                querySnapshot.forEach((doc) => {
                    // Spread doc.data() first, then add id to ensure it's not overwritten
                    const enrollment = { ...doc.data(), id: doc.id } as EnrollmentWithStrand;
                    // Find the strand name
                    const strand = strands.find(s => s.id === enrollment.strandId);
                    enrollment.strandName = strand?.strandName || "Unknown Strand";
                    enrollmentsData.push(enrollment);
                });
                
                setEnrollments(enrollmentsData);
            } catch (error) {
                console.error('Error fetching enrollments:', error);
                errorToast("Failed to load enrollments. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchEnrollments();
    }, [userData, userLoading, strands]);

    function getStatusBadge(status: string) {
        switch (status) {
            case "approved":
                return (
                    <div className="badge badge-success gap-1 text-white text-[10px] martian-mono">
                        Approved
                    </div>
                );
            case "rejected":
                return (
                    <div className="badge badge-error gap-1 text-white text-[10px] martian-mono">
                        Rejected
                    </div>
                );
            case "pending":
            default:
                return (
                    <div className="badge badge-warning gap-1 text-white text-[10px] martian-mono">
                        Pending
                    </div>
                );
        }
    }

    function handleNewEnrollment() {
        router.push("/students/enrollment/submit");
    }

    function handleViewEnrollment(enrollment: EnrollmentWithStrand) {
        // For now, just show an alert with details
        // In the future, this could navigate to a detailed view
        alert(`Enrollment Details:\n
Student: ${enrollment.studentName}
Strand: ${enrollment.strandName}
Semester: ${enrollment.semester}
School Year: ${enrollment.schoolYear}
Status: ${enrollment.status}
Submitted: ${formatDate(enrollment.createdAt)}
${enrollment.returningStudent ? 'Returning Student' : 'New Student'}
${enrollment.isPWD ? 'PWD Student' : ''}
${enrollment.clearance ? 'Clearance: ✓ Uploaded' : 'Clearance: Not uploaded'}
${enrollment.copyOfGrades ? 'Grades: ✓ Uploaded' : 'Grades: Not uploaded'}`);
    }

    function handleEditEnrollment(enrollment: EnrollmentWithStrand) {
        if (enrollment.status !== "pending") {
            errorToast("Only pending enrollments can be edited");
            return;
        }
        console.log(enrollment);
        router.push(`/students/enrollment/edit?id=${enrollment.id}`);
    }

    function handleViewFile(fileUrl: string) {
        if (!fileUrl) {
            errorToast("No file available to view");
            return;
        }
        
        // Open file in new tab
        window.open(fileUrl, '_blank');
    }

    function handleDownloadFile(fileUrl: string, fileName: string) {
        if (!fileUrl) {
            errorToast("No file available to download");
            return;
        }
        
        // Create a temporary link element to trigger download
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    if (userLoading || loading) {
        return <LoadingOverlay />;
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="martian-mono font-bold text-primary">My Enrollments</h1>
                    <p className="text-gray-600 mt-1 text-xs italic">
                        View and manage your enrollment submissions
                    </p>
                </div>
                <button
                    onClick={handleNewEnrollment}
                    className="btn z-50 fixed bottom-5 right-5 btn-primary gap-2"
                >
                    <HiPlus className="w-4 h-4" />
                    New Enrollment
                </button>
            </div>

            {enrollments.length === 0 ? (
                <div className="text-center py-12">
                    <HiAcademicCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-sm font-semibold text-gray-600 mb-2 italic">
                        No Enrollments Found
                    </h3>
                    <p className="text-gray-500 mb-6 text-xs italic">
                        You haven&apos;t submitted any enrollments yet. Start by creating a new enrollment.
                    </p>
                    <button
                        onClick={handleNewEnrollment}
                        className="btn btn-primary gap-2"
                    >
                        <HiPlus className="w-4 h-4" />
                        Submit Your First Enrollment
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {enrollments.map((enrollment) => (
                        <div
                            key={enrollment.id}
                            className="card bg-white shadow-md hover:shadow-lg transition-shadow"
                        >
                            <div className="card-body">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-sm font-bold text-primary martian-mono">
                                                {enrollment.strandName}
                                            </h3>
                                            {getStatusBadge(enrollment.status || "pending")}
                                        </div>
                                        {/* Show rejection reason if rejected */}
                                        {enrollment.status === "rejected" && enrollment.rejectionReason && (
                                            <div className="flex items-center gap-2 mb-2 p-2 bg-red-50 border border-red-200 rounded">
                                                <span className="text-sm text-red-700 font-medium">Reason: {enrollment.rejectionReason}</span>
                                            </div>
                                        )}
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600 text-sm italic">
                                                    {enrollment.gradeLevel} Level
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600 text-sm italic">
                                                    {enrollment.semester} Semester
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600 text-sm italic">
                                                    {enrollment.schoolYear}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600 text-sm italic">
                                                    {enrollment.returningStudent ? "Returning" : "New"} Student
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 text-xs">
                                                    {formatDate(enrollment.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Additional details */}
                                        <div className="mt-3 flex flex-wrap gap-2 text-white">
                                            {enrollment.isPWD && (
                                                <span className="badge badge-info badge-sm text-white">PWD</span>
                                            )}
                                            {enrollment.clearance && (
                                                <span className="badge badge-success badge-sm text-white text-[10px] martian-mono">Clearance ✓</span>
                                            )}
                                            {enrollment.copyOfGrades && (
                                                <span className="badge badge-success badge-sm text-white text-[10px] martian-mono">Grades ✓</span>
                                            )}
                                            {!enrollment.clearance && (
                                                <span className="badge badge-warning badge-sm text-white text-[10px] martian-mono">No Clearance</span>
                                            )}
                                            {!enrollment.copyOfGrades && (
                                                <span className="badge badge-warning badge-sm text-white text-[10px] martian-mono">No Grades</span>
                                            )}
                                        </div>

                                        {/* File viewing section */}
                                        {(enrollment.clearance || enrollment.copyOfGrades) && (
                                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                                <h4 className="font-medium text-sm text-gray-700 mb-3 italic">Submitted Files</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {enrollment.clearance && (
                                                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                                                            <div className="flex items-center gap-2">
                                                                <HiDocument className="w-4 h-4 text-blue-600" />
                                                                <span className="text-sm font-medium text-gray-700">Clearance</span>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleViewFile(enrollment.clearance!)}
                                                                    className="btn btn-xs btn-outline btn-primary"
                                                                    title="View file"
                                                                >
                                                                    <HiEye className="w-3 h-3" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDownloadFile(enrollment.clearance!, "clearance")}
                                                                    className="btn btn-xs btn-outline btn-secondary"
                                                                    title="Download file"
                                                                >
                                                                    <HiDownload className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {enrollment.copyOfGrades && (
                                                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                                                            <div className="flex items-center gap-2">
                                                                <HiDocument className="w-4 h-4 text-green-600" />
                                                                <span className="text-sm font-medium text-gray-700">Grades</span>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleViewFile(enrollment.copyOfGrades!)}
                                                                    className="btn btn-xs btn-outline btn-primary"
                                                                    title="View file"
                                                                >
                                                                    <HiEye className="w-3 h-3" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDownloadFile(enrollment.copyOfGrades!, "grades")}
                                                                    className="btn btn-xs btn-outline btn-secondary"
                                                                    title="Download file"
                                                                >
                                                                    <HiDownload className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Returning student details */}
                                        {enrollment.returningStudent && (
                                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                <h4 className="font-medium text-gray-700 mb-2">Previous School Information</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">Last Grade:</span>
                                                        <span className="ml-1 text-gray-700">{enrollment.lastGradeLevel || "N/A"}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Last School:</span>
                                                        <span className="ml-1 text-gray-700">{enrollment.lastSchoolAttended || "N/A"}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Last Year:</span>
                                                        <span className="ml-1 text-gray-700">{enrollment.lastSchoolYear || "N/A"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => handleViewEnrollment(enrollment)}
                                            className="btn btn-xs text-[10px] martian-mono text-white rounded-none btn-primary"
                                        >
                                            View
                                        </button>
                                        {enrollment.status === "pending" && (
                                            <button
                                                onClick={() => handleEditEnrollment(enrollment)}
                                                className="btn btn-sm btn-outline btn-secondary"
                                            >
                                                <HiPencil className="w-4 h-4" />
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EnrollmentList;