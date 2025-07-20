"use client";
import React, { useState, useEffect } from "react";
import { FormSelect } from "@/components/common";
import { HiCheck, HiX, HiAcademicCap, HiUserGroup, HiDocumentText, HiCalendar } from "react-icons/hi";
import type { Enrollment, Section } from "@/interface/info";

interface EnrollmentWithDetails extends Enrollment {
    strandName?: string;
    sectionName?: string;
}

interface ApproveEnrollmentModalProps {
    enrollment: EnrollmentWithDetails | null;
    sections: Section[];
    onApprove: (enrollmentId: string, sectionId: string) => void;
    onReject: (enrollmentId: string) => void;
    onClose: () => void;
    isOpen: boolean;
    loading: boolean;
}

function ApproveEnrollmentModal({
    enrollment,
    sections,
    onApprove,
    onReject,
    onClose,
    isOpen,
    loading
}: ApproveEnrollmentModalProps) {
    const [selectedSection, setSelectedSection] = useState<string>("");

    // Set initial section if enrollment is already approved
    useEffect(() => {
        if (enrollment && enrollment.status === "approved" && enrollment.sectionId) {
            setSelectedSection(enrollment.sectionId);
        } else {
            setSelectedSection("");
        }
    }, [enrollment]);

    if (!isOpen || !enrollment) return null;

    const availableSections = sections.filter(section => section.strandId === enrollment.strandId);

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-lg">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <HiAcademicCap className="w-5 h-5 text-primary" />
                    {enrollment.status === "approved" ? "Edit Section Assignment" : "Approve Enrollment"}
                </h3>
                
                <div className="space-y-4 mb-6">
                    {/* Student Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3">Student Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="font-medium text-gray-700">Student Name:</span>
                                <p className="text-gray-900">{enrollment.studentName}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Student ID:</span>
                                <p className="text-gray-900">{enrollment.studentId}</p>
                            </div>
                        </div>
                    </div>

                    {/* Enrollment Details */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <HiCalendar className="w-4 h-4" />
                            Enrollment Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="font-medium text-gray-700">Strand:</span>
                                <p className="text-gray-900">{enrollment.strandName}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Semester:</span>
                                <p className="text-gray-900">{enrollment.semester} Semester</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">School Year:</span>
                                <p className="text-gray-900">{enrollment.schoolYear}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Student Type:</span>
                                <p className="text-gray-900">{enrollment.returningStudent ? "Returning" : "New"} Student</p>
                            </div>
                        </div>
                    </div>

                    {/* Special Status */}
                    {(enrollment.isPWD || enrollment.returningStudent) && (
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-800 mb-2">Special Status</h4>
                            <div className="flex flex-wrap gap-2">
                                {enrollment.isPWD && (
                                    <span className="badge badge-info badge-sm text-white">PWD Student</span>
                                )}
                                {enrollment.returningStudent && (
                                    <span className="badge badge-secondary badge-sm text-white">Returning Student</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Documents */}
                    <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <HiDocumentText className="w-4 h-4" />
                            Required Documents
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {enrollment.clearance ? (
                                <span className="badge badge-success badge-sm text-white">Clearance ✓</span>
                            ) : (
                                <span className="badge badge-warning badge-sm text-white">No Clearance</span>
                            )}
                            {enrollment.copyOfGrades ? (
                                <span className="badge badge-success badge-sm text-white">Grades ✓</span>
                            ) : (
                                <span className="badge badge-warning badge-sm text-white">No Grades</span>
                            )}
                        </div>
                    </div>

                    {/* Current Section (if already approved) */}
                    {enrollment.status === "approved" && enrollment.sectionName && (
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <HiUserGroup className="w-4 h-4" />
                                Current Section Assignment
                            </h4>
                            <p className="text-gray-900 font-medium">{enrollment.sectionName}</p>
                        </div>
                    )}
                </div>

                {/* Section Selection */}
                <div className="form-control mb-6">
                    <label className="label">
                        <span className="label-text font-medium flex items-center gap-2">
                            <HiUserGroup className="w-4 h-4" />
                            {enrollment.status === "approved" ? "Change Section Assignment" : "Assign Section"}
                        </span>
                    </label>
                    <FormSelect
                        id="sectionId"
                        name="sectionId"
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        options={availableSections.map(s => ({ value: s.id, label: s.sectionName }))}
                        placeholder="Select Section"
                        required
                        disabled={loading}
                    />
                    {availableSections.length === 0 && (
                        <div className="text-sm text-red-600 mt-2">
                            No sections available for this strand. Please create sections first.
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="modal-action">
                    <button
                        className="btn btn-outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-error"
                        onClick={() => onReject(enrollment.id)}
                        disabled={loading}
                    >
                        <HiX className="w-4 h-4" />
                        Reject
                    </button>
                    <button
                        className="btn btn-success"
                        onClick={() => onApprove(enrollment.id, selectedSection)}
                        disabled={loading || !selectedSection || availableSections.length === 0}
                    >
                        <HiCheck className="w-4 h-4" />
                        {enrollment.status === "approved" ? "Update Section" : "Approve"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ApproveEnrollmentModal; 