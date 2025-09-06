"use client";
import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../../firebase";
import { Enrollment } from "@/interface/info";
import { useSearchParams } from "next/navigation";
import { HiCheckCircle, HiXCircle, HiEye, HiDownload } from "react-icons/hi";
import { formatDate } from "@/config/format";
import { errorToast, successToast } from "@/config/toast";
import { logService } from "@/services/logService";

export default function EnrolleeViewPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchEnrollment() {
      setLoading(true);
      if (!id) return;
      const docRef = doc(db, "enrollment", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setEnrollment({ ...docSnap.data(), id: docSnap.id } as Enrollment);
      setLoading(false);
    }
    fetchEnrollment();
  }, [id]);

  async function handleApprove() {
    if (!id || !enrollment) return;
    setIsSubmitting(true);
    const docRef = doc(db, "enrollment", id);
    await updateDoc(docRef, { status: "approved" });
    
    // Log the enrollment approval
    await logService.logEnrollmentApproved(
      enrollment.studentId,
      enrollment.studentName,
      'Admin'
    );
    
    successToast("Enrollment approved");
    setEnrollment(prev => prev ? { ...prev, status: "approved" } : prev);
    setIsSubmitting(false);
  }

  async function handleReject() {
    if (!id || !enrollment) return;
    setIsSubmitting(true);
    const docRef = doc(db, "enrollment", id);
    await updateDoc(docRef, { status: "rejected" });
    
    // Log the enrollment rejection
    await logService.logEnrollmentRejected(
      enrollment.studentId,
      enrollment.studentName,
      'Admin'
    );
    
    successToast("Enrollment rejected");
    setEnrollment(prev => prev ? { ...prev, status: "rejected" } : prev);
    setIsSubmitting(false);
  }

  function handleViewFile(fileUrl: string) {
    if (!fileUrl) {
      errorToast("No file available to view");
      return;
    }
    window.open(fileUrl, '_blank');
  }

  function handleDownloadFile(fileUrl: string, fileName: string) {
    if (!fileUrl) {
      errorToast("No file available to download");
      return;
    }
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (!id) return <div className="text-center py-12 text-red-500">Invalid enrollment ID.</div>;
  if (loading || !enrollment) return <div className="text-center py-12 text-zinc-400">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Enrollment Details</h1>
      <div className="card bg-white shadow-md p-6">
        <div className="mb-2 font-semibold text-primary text-lg">{enrollment.studentName}</div>
        <div className="mb-2 text-sm text-zinc-500">Strand: {enrollment.strandId} | {enrollment.semester} | {enrollment.schoolYear}</div>
        <div className="mb-2 text-xs text-zinc-400">Submitted: {formatDate(enrollment.createdAt)}</div>
        <div className="mb-2 text-xs text-zinc-400">Last Updated: {formatDate(enrollment.updatedAt)}</div>
        <div className="mb-4">
          <span className={`badge ${enrollment.status === 'approved' ? 'badge-success' : enrollment.status === 'rejected' ? 'badge-error' : 'badge-warning'} text-white`}>
            {enrollment.status}
          </span>
        </div>
        <div className="mb-4">
          {enrollment.isPWD && <span className="badge badge-info badge-sm text-white mr-2">PWD</span>}
          {enrollment.clearance && <span className="badge badge-success badge-sm text-white mr-2">Clearance ✓</span>}
          {enrollment.copyOfGrades && <span className="badge badge-success badge-sm text-white mr-2">Grades ✓</span>}
          {!enrollment.clearance && <span className="badge badge-warning badge-sm text-white mr-2">No Clearance</span>}
          {!enrollment.copyOfGrades && <span className="badge badge-warning badge-sm text-white mr-2">No Grades</span>}
        </div>
        {/* File viewing section */}
        {(enrollment.clearance || enrollment.copyOfGrades) && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-xs text-gray-700 mb-3">Submitted Files</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {enrollment.clearance && (
                <div className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center gap-2">
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
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
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
        {enrollment.status === "pending" && (
          <div className="flex gap-2 mt-4">
            <button className="btn btn-success" onClick={handleApprove} disabled={isSubmitting}><HiCheckCircle className="w-4 h-4" /> Approve</button>
            <button className="btn btn-error" onClick={handleReject} disabled={isSubmitting}><HiXCircle className="w-4 h-4" /> Reject</button>
          </div>
        )}
      </div>
    </div>
  );
} 