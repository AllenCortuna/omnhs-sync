import React from "react";
import type { Enrollment } from "@/interface/info";
import { HiX, HiAcademicCap, HiCalendar, HiUser, HiClock } from "react-icons/hi";

export interface ViewEnrollmentModalProps {
  open: boolean;
  onClose: () => void;
  enrollment: Enrollment | null;
  strandName?: string;
}

export function ViewEnrollmentModal({ open, onClose, enrollment, strandName }: ViewEnrollmentModalProps) {
  if (!open || !enrollment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-5 relative animate-fade-in">
        <button
          className="absolute top-2 right-2 btn btn-xs btn-circle btn-ghost"
          onClick={onClose}
          aria-label="Close"
        >
          <HiX className="w-5 h-5" />
        </button>
        <div className="mb-4 flex items-center gap-2">
          <HiUser className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg text-zinc-700">{enrollment.studentName}</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <HiAcademicCap className="w-4 h-4" />
            <span>Strand: <span className="font-medium text-zinc-800">{strandName || enrollment.strandId}</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <HiCalendar className="w-4 h-4" />
            <span>{enrollment.semester} sem | {enrollment.schoolYear}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <HiClock className="w-4 h-4" />
            <span>Submitted: {new Date(enrollment.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          {enrollment.status && (
            <div className="flex items-center gap-2 text-xs">
              <span className={`badge badge-${enrollment.status === 'approved' ? 'success' : enrollment.status === 'pending' ? 'warning' : 'error'} badge-outline`}>{enrollment.status}</span>
            </div>
          )}
          {enrollment.sectionId && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>Section ID: {enrollment.sectionId}</span>
            </div>
          )}
          {enrollment.returningStudent !== undefined && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>Returning Student: {enrollment.returningStudent ? 'Yes' : 'No'}</span>
            </div>
          )}
          {enrollment.lastGradeLevel && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>Last Grade Level: {enrollment.lastGradeLevel}</span>
            </div>
          )}
          {enrollment.lastSchoolAttended && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>Last School: {enrollment.lastSchoolAttended}</span>
            </div>
          )}
          {enrollment.lastSchoolYear && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>Last School Year: {enrollment.lastSchoolYear}</span>
            </div>
          )}
          {enrollment.isPWD !== undefined && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>PWD: {enrollment.isPWD ? 'Yes' : 'No'}</span>
            </div>
          )}
          {enrollment.clearance && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <a href={enrollment.clearance} target="_blank" rel="noopener noreferrer" className="link link-primary">View Clearance</a>
            </div>
          )}
          {enrollment.copyOfGrades && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <a href={enrollment.copyOfGrades} target="_blank" rel="noopener noreferrer" className="link link-primary">View Grades</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 