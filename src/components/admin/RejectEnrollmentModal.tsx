import React, { useState } from "react";
import type { Enrollment } from "@/interface/info";
import { HiX } from "react-icons/hi";

const REJECTION_REASONS = [
  "Incomplete requirements",
  "Does not meet criteria",
  "Invalid documents",
  "Duplicate application",
  "Other"
];

export interface RejectEnrollmentModalProps {
  open: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
  enrollment: Enrollment | null;
}

export function RejectEnrollmentModal({ open, onClose, onReject, enrollment }: RejectEnrollmentModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleReasonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedReason(e.target.value);
    setError(null);
    if (e.target.value !== "Other") setCustomReason("");
  }

  function handleCustomReasonChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCustomReason(e.target.value);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const reason = selectedReason === "Other" ? customReason.trim() : selectedReason;
    if (!reason) {
      setError("Please provide a reason for rejection.");
      return;
    }
    setSubmitting(true);
    try {
      await onReject(reason);
      setSelectedReason("");
      setCustomReason("");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open || !enrollment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative animate-fade-in">
        <button
          className="absolute top-2 right-2 btn btn-xs btn-circle btn-ghost"
          onClick={onClose}
          type="button"
          aria-label="Close"
        >
          <HiX className="w-5 h-5" />
        </button>
        <h3 className="font-bold text-lg mb-2 text-error">Reject Enrollment</h3>
        <p className="mb-4 text-sm text-zinc-600">Select a reason for rejecting <span className="font-semibold">{enrollment.studentName}</span>&apos;s enrollment.</p>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Reason</label>
          <select
            className="select select-bordered w-full"
            value={selectedReason}
            onChange={handleReasonChange}
            required
          >
            <option value="" disabled>Select reason</option>
            {REJECTION_REASONS.map(reason => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </select>
        </div>
        {selectedReason === "Other" && (
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Custom Reason</label>
            <input
              className="input input-bordered w-full"
              type="text"
              value={customReason}
              onChange={handleCustomReasonChange}
              placeholder="Type custom reason"
              maxLength={120}
              required
            />
          </div>
        )}
        {error && <div className="text-error text-xs mb-2">{error}</div>}
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-error btn-sm text-white"
            disabled={submitting}
          >
            {submitting ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </form>
    </div>
  );
} 