"use client";
import React, { useState } from "react";
import { HiX, HiCheck, HiUser } from "react-icons/hi";
import { Student } from "../../interface/user";
import { successToast, errorToast } from "../../config/toast";

interface UpdateStudentStatusModalProps {
    open: boolean;
    onClose: () => void;
    student: Student | null;
    onUpdate: (studentId: string, newStatus: string) => Promise<void>;
}

const UpdateStudentStatusModal: React.FC<UpdateStudentStatusModalProps> = ({
    open,
    onClose,
    student,
    onUpdate,
}) => {
    const [selectedStatus, setSelectedStatus] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const statusOptions = [
        { value: "enrolled", label: "Enrolled", color: "text-green-600" },
        { value: "transfer-in", label: "Transfer In", color: "text-blue-600" },
        { value: "transfer-out", label: "Transfer Out", color: "text-orange-600" },
        { value: "incomplete", label: "Incomplete", color: "text-yellow-600" },
        { value: "graduated", label: "Graduated", color: "text-purple-600" },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!student || !selectedStatus) {
            errorToast("Please select a status");
            return;
        }

        try {
            setLoading(true);
            await onUpdate(student.id!, selectedStatus);
            successToast(`Student status updated to ${statusOptions.find(s => s.value === selectedStatus)?.label}`);
            onClose();
            setSelectedStatus("");
        } catch (error) {
            console.error("Error updating student status:", error);
            errorToast("Failed to update student status");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedStatus("");
        onClose();
    };

    if (!open || !student) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-base-100 rounded-xl shadow-lg border border-base-300 w-full max-w-md">
                <div className="p-6 border-b border-base-300">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center">
                            <HiUser className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-primary">
                                Update Student Status
                            </h3>
                            <p className="text-xs text-zinc-500">
                                Update status for {student.firstName} {student.lastName}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Student Info */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-primary">
                            Student Information
                        </label>
                        <div className="p-3 bg-base-200 rounded-lg">
                            <div className="font-semibold text-sm text-primary">{student.firstName} {student.lastName}</div>
                            <div className="text-xs text-zinc-500">ID: {student.studentId}</div>
                            <div className="text-xs text-zinc-500">
                                Current Status: <span className="font-medium">{student.status || "Not set"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Status Selection */}
                    <div className="space-y-2">
                        <label
                            htmlFor="statusSelect"
                            className="text-xs font-bold text-primary"
                        >
                            New Status *
                        </label>
                        <select
                            id="statusSelect"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="select select-bordered rounded-none text-primary text-xs w-full"
                            disabled={loading}
                            required
                        >
                            <option value="">Choose a status...</option>
                            {statusOptions.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Warning for transfer-out and graduated */}
                    {(selectedStatus === "transfer-out" || selectedStatus === "graduated") && (
                        <div className="alert alert-warning">
                            <HiUser className="w-4 h-4" />
                            <div className="text-xs">
                              <strong>Warning:</strong> Setting status to &quot;{statusOptions.find(s => s.value === selectedStatus)?.label}&quot; will clear the student&apos;s enrollment information (section, semester, and school year).
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="btn btn-outline flex items-center gap-2"
                        >
                            <HiX className="w-4 h-4" />
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading || !selectedStatus}
                            className="btn btn-secondary flex-1 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <HiCheck className="w-4 h-4" />
                                    Update Status
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateStudentStatusModal;
