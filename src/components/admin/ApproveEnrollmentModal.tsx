"use client";
import React, { useEffect, useState } from "react";
import { Section } from "@/interface/info";
import { sectionService } from "@/services/sectionService";
import type { Enrollment } from "@/interface/info";

interface ApproveEnrollmentModalProps {
  open: boolean;
  onClose: () => void;
  enrollment: Enrollment | null;
  onApprove: (sectionId: string) => void;
}

export function ApproveEnrollmentModal({ open, onClose, enrollment, onApprove }: ApproveEnrollmentModalProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (enrollment?.strandId) {
      setLoading(true);
      sectionService.getSectionsByStrandId(enrollment.strandId)
        .then(setSections)
        .catch(() => setSections([]))
        .finally(() => setLoading(false));
    }
    setSelectedSection("");
  }, [enrollment]);

  if (!open || !enrollment) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Approve Enrollment</h3>
        <div className="mb-2">
          <div className="text-sm font-medium">Student:</div>
          <div className="mb-1">{enrollment.studentName}</div>
          <div className="text-xs text-zinc-500 mb-1">{enrollment.schoolYear} | {enrollment.semester}</div>
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">Select Section</label>
          <select
            className="select select-bordered w-full"
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            disabled={loading}
          >
            <option value="">Select a section</option>
            {sections.map(section => (
              <option key={section.id} value={section.id}>{section.sectionName}</option>
            ))}
          </select>
        </div>
        <div className="modal-action">
          <button
            className="btn btn-primary"
            disabled={!selectedSection || loading}
            onClick={() => selectedSection && onApprove(selectedSection)}
          >
            Approve
          </button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
} 