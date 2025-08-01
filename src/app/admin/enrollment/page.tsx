"use client";
import React, { useState, useEffect } from "react";
import { collection, query, getDocs, updateDoc, doc, orderBy } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useSaveUserData } from "@/hooks";
import { strandService } from "@/services/strandService";
import { sectionService } from "@/services/sectionService";
import { errorToast, successToast } from "@/config/toast";
import type { Enrollment, Strand, Section } from "@/interface/info";
import { LoadingOverlay } from "@/components/common";
import ApproveEnrollmentModal from "@/components/admin/ApproveEnrollmentModal";
import { formatDate } from "@/config/format";
import { 
    HiAcademicCap, 
    HiCalendar, 
    HiDocumentText, 
    HiCheckCircle, 
    HiXCircle, 
    HiClock,
    HiUserGroup,
    HiCheck,
    HiX
} from "react-icons/hi";

interface EnrollmentWithDetails extends Enrollment {
    strandName?: string;
    sectionName?: string;
}



const AdminEnrollmentPage = () => {
    const { userData, isLoading: userLoading } = useSaveUserData({
        role: "admin",
    });
    const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
    const [strands, setStrands] = useState<Strand[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentWithDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Fetch strands and sections
    useEffect(() => {
        Promise.all([
            strandService.getAllStrands(),
            sectionService.getAllSections()
        ])
        .then(([strandsData, sectionsData]) => {
            setStrands(strandsData);
            setSections(sectionsData);
        })
        .catch((error) => {
            console.error('Error fetching data:', error);
            errorToast("Failed to load strands and sections");
        });
    }, []);

    // Fetch enrollments
    useEffect(() => {
        const fetchEnrollments = async () => {
            if (!userData || userLoading) return;

            try {
                setLoading(true);
                const enrollmentsQuery = query(
                    collection(db, "enrollment"),
                    orderBy("createdAt", "desc")
                );
                
                const querySnapshot = await getDocs(enrollmentsQuery);
                const enrollmentsData: EnrollmentWithDetails[] = [];
                
                querySnapshot.forEach((doc) => {
                    console.log('Processing doc:', doc.id, doc.data());
                    const enrollment = { id: doc.id, ...doc.data() } as EnrollmentWithDetails;
                    
                    // Validate the enrollment ID and use doc.id as fallback
                    if (!enrollment.id || enrollment.id.trim() === '') {
                        console.warn('Enrollment ID is empty, using doc.id as fallback:', doc.id);
                        enrollment.id = doc.id; // Use the Firestore document ID as fallback
                    }
                    
                    // Find the strand name
                    const strand = strands.find(s => s.id === enrollment.strandId);
                    enrollment.strandName = strand?.strandName || "Unknown Strand";
                    
                    // Find the section name if assigned
                    if (enrollment.sectionId) {
                        const section = sections.find(s => s.id === enrollment.sectionId);
                        enrollment.sectionName = section?.sectionName || "Unknown Section";
                    }
                    
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
    }, [userData, userLoading, strands, sections]);

    function getStatusBadge(status: string) {
        switch (status) {
            case "approved":
                return (
                    <div className="badge badge-success gap-1 text-white">
                        <HiCheckCircle className="w-3 h-3" />
                        Approved
                    </div>
                );
            case "rejected":
                return (
                    <div className="badge badge-error gap-1 text-white">
                        <HiXCircle className="w-3 h-3" />
                        Rejected
                    </div>
                );
            case "pending":
            default:
                return (
                    <div className="badge badge-warning gap-1 text-white">
                        <HiClock className="w-3 h-3" />
                        Pending
                    </div>
                );
        }
    }

    function handleViewEnrollment(enrollment: EnrollmentWithDetails) {
        setSelectedEnrollment(enrollment);
        setIsModalOpen(true);
    }

    async function handleApprove(enrollmentId: string, sectionId: string) {
        if (!enrollmentId || !sectionId) {
            errorToast("Please select a section to assign");
            return;
        }

        try {
            
            // Find the current enrollment to check if it's already approved
            const currentEnrollment = enrollments.find(e => e.id === enrollmentId);
            const isUpdating = currentEnrollment?.status === "approved";
            
            // Update the enrollment status and assign section
            const enrollmentRef = doc(db, "enrollment", enrollmentId);
            await updateDoc(enrollmentRef, {
                status: "approved",
                sectionId: sectionId,
                updatedAt: new Date().toISOString()
            });

            // Update local state
            setEnrollments(prev => prev.map(enrollment => 
                enrollment.id === enrollmentId 
                    ? { 
                        ...enrollment, 
                        status: "approved", 
                        sectionId: sectionId,
                        sectionName: sections.find(s => s.id === sectionId)?.sectionName || "Unknown Section"
                    }
                    : enrollment
            ));

            successToast(isUpdating 
                ? "Section assignment updated successfully!" 
                : "Enrollment approved and section assigned successfully!"
            );
            setIsModalOpen(false);
            setSelectedEnrollment(null);
        } catch (error) {
            console.error('Error approving enrollment:', error);
            errorToast("Failed to approve enrollment. Please try again.");
        }
    }

    // Wrapper function for the modal that captures the enrollment ID
    const handleModalApprove = (sectionId: string) => {
        if (selectedEnrollment?.id) {
            handleApprove(selectedEnrollment.id, sectionId);
        }
    };



    function handleCloseModal() {
        setIsModalOpen(false);
        setSelectedEnrollment(null);
    }

    async function handleQuickApprove(enrollment: EnrollmentWithDetails) {
        console.log('handleQuickApprove called with enrollment:', enrollment);
        
        // Validate enrollment ID
        if (!enrollment.id || enrollment.id.trim() === '') {
            console.error('Enrollment ID is missing or empty:', enrollment);
            errorToast("Invalid enrollment data. Please try again.");
            return;
        }

        // Find available sections for this strand
        const availableSections = sections.filter(section => section.strandId === enrollment.strandId);
        
        if (availableSections.length === 0) {
            errorToast("No sections available for this strand. Please use the Review button to assign manually.");
            return;
        }

        // Auto-assign the first available section
        const firstSection = availableSections[0];
        
        try {
            
            // Update the enrollment status and assign section
            const enrollmentRef = doc(db, "enrollment", enrollment.id);
            await updateDoc(enrollmentRef, {
                status: "approved",
                sectionId: firstSection.id,
                updatedAt: new Date().toISOString()
            });

            // Update local state
            setEnrollments(prev => prev.map(e => 
                e.id === enrollment.id 
                    ? { 
                        ...e, 
                        status: "approved", 
                        sectionId: firstSection.id,
                        sectionName: firstSection.sectionName
                    }
                    : e
            ));

            successToast(`Enrollment approved and assigned to ${firstSection.sectionName}!`);
        } catch (error) {
            console.error('Error approving enrollment:', error);
            errorToast("Failed to approve enrollment. Please try again.");
        }
    }

    async function handleQuickReject(enrollmentId: string) {
        // Validate enrollment ID
        if (!enrollmentId || enrollmentId.trim() === '') {
            console.error('Enrollment ID is missing or empty:', enrollmentId);
            errorToast("Invalid enrollment data. Please try again.");
            return;
        }

        try {
            
            // Update the enrollment status
            const enrollmentRef = doc(db, "enrollment", enrollmentId);
            await updateDoc(enrollmentRef, {
                status: "rejected",
                updatedAt: new Date().toISOString()
            });

            // Update local state
            setEnrollments(prev => prev.map(enrollment => 
                enrollment.id === enrollmentId 
                    ? { ...enrollment, status: "rejected" }
                    : enrollment
            ));

            successToast("Enrollment rejected successfully!");
        } catch (error) {
            console.error('Error rejecting enrollment:', error);
            errorToast("Failed to reject enrollment. Please try again.");
        }
    }

    // Filter enrollments based on status
    const filteredEnrollments = enrollments.filter(enrollment => {
        if (statusFilter === "all") return true;
        return enrollment.status === statusFilter;
    });

    if (userLoading || loading) {
        return <LoadingOverlay />;
    }

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Enrollment Management</h1>
                    <p className="text-gray-600 mt-1">
                        Review and approve student enrollment applications
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="form-control">
                        <select
                            className="select select-bordered select-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {filteredEnrollments.length === 0 ? (
                <div className="text-center py-12">
                    <HiAcademicCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        No Enrollments Found
                    </h3>
                    <p className="text-gray-500">
                        {statusFilter === "all" 
                            ? "No enrollment applications have been submitted yet."
                            : `No ${statusFilter} enrollments found.`
                        }
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredEnrollments.map((enrollment) => (
                        <div
                            key={enrollment.id}
                            className="card bg-white shadow-md hover:shadow-lg transition-shadow"
                        >
                            <div className="card-body">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                {enrollment.studentName}
                                            </h3>
                                            {getStatusBadge(enrollment.status || "pending")}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <HiAcademicCap className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-600">
                                                    {enrollment.strandName}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <HiCalendar className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-600">
                                                    {enrollment.semester} Semester
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <HiDocumentText className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-600">
                                                    {enrollment.schoolYear}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 text-xs">
                                                    {formatDate(enrollment.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Section assignment */}
                                        {enrollment.status === "approved" && enrollment.sectionName && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <HiUserGroup className="w-4 h-4 text-green-500" />
                                                <span className="text-green-600 font-medium">
                                                    Assigned to: {enrollment.sectionName}
                                                </span>
                                            </div>
                                        )}

                                        {/* Additional details */}
                                        <div className="mt-3 flex flex-wrap gap-2 text-white">
                                            {enrollment.isPWD && (
                                                <span className="badge badge-info badge-sm text-white">PWD</span>
                                            )}
                                            {enrollment.returningStudent && (
                                                <span className="badge badge-secondary badge-sm text-white">Returning</span>
                                            )}
                                            {enrollment.clearance && (
                                                <span className="badge badge-success badge-sm text-white">Clearance ✓</span>
                                            )}
                                            {enrollment.copyOfGrades && (
                                                <span className="badge badge-success badge-sm text-white">Grades ✓</span>
                                            )}
                                            {!enrollment.clearance && (
                                                <span className="badge badge-warning badge-sm text-white">No Clearance</span>
                                            )}
                                            {!enrollment.copyOfGrades && (
                                                <span className="badge badge-warning badge-sm text-white">No Grades</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Action buttons */}
                                    <div className="flex flex-col gap-2">
                                        {enrollment.status === "pending" && (
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => handleViewEnrollment(enrollment)}
                                                    className="btn btn-sm btn-primary gap-2 text-white"
                                                >
                                                    <HiCheck className="w-4 h-4" />
                                                    Review
                                                </button>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleQuickApprove(enrollment)}
                                                        className="btn btn-xs btn-success text-white"
                                                        title="Quick Approve (auto-assigns first available section)"
                                                    >
                                                        <HiCheck className="w-3 h-3" />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleQuickReject(enrollment.id)}
                                                        className="btn btn-xs btn-error text-white"
                                                        title="Quick Reject"
                                                    >
                                                        <HiX className="w-3 h-3" />
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {enrollment.status === "approved" && (
                                            <div className="flex flex-col gap-2">
                                                <div className="text-sm text-green-600 font-medium">
                                                    ✓ Approved
                                                </div>
                                                <button
                                                    onClick={() => handleViewEnrollment(enrollment)}
                                                    className="btn btn-sm btn-outline btn-primary"
                                                >
                                                    Edit Section
                                                </button>
                                            </div>
                                        )}
                                        {enrollment.status === "rejected" && (
                                            <div className="text-sm text-red-600 font-medium">
                                                ✗ Rejected
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ApproveEnrollmentModal
                open={isModalOpen}
                enrollment={selectedEnrollment}
                onApprove={handleModalApprove}
                onClose={handleCloseModal}
            />
        </div>
    );
}

    export default AdminEnrollmentPage;