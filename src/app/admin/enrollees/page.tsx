"use client";
import React, { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "../../../../firebase";
import { Enrollment } from "@/interface/info";
import { formatDate } from "@/config/format";
import { HiAcademicCap, HiCalendar, HiChevronLeft, HiChevronRight, HiClock, HiSearch } from "react-icons/hi";
import ApproveEnrollmentModal from "@/components/admin/ApproveEnrollmentModal";
import { doc, updateDoc } from "firebase/firestore";
import { strandService } from "@/services/strandService";
import type { Strand } from "@/interface/info";
import { ViewEnrollmentModal } from "@/components/admin/ViewEnrollmentModal";
import { RejectEnrollmentModal } from "@/components/admin/RejectEnrollmentModal";
import { useNotifyEnrollmentStatus } from "@/hooks/useNotifyEnrollmentStatus";
import { logService } from "@/services/logService";

const PAGE_SIZE = 10;

const EnrolleeListPage = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [schoolYearFilter, setSchoolYearFilter] = useState<string>("all");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [strands, setStrands] = useState<Strand[]>([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewEnrollment, setViewEnrollment] = useState<Enrollment | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectEnrollment, setRejectEnrollment] = useState<Enrollment | null>(null);
  const { notifyEnrollmentStatus } = useNotifyEnrollmentStatus();

  useEffect(() => {
    async function fetchEnrollments() {
      setLoading(true);
      const q = query(collection(db, "enrollment"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setEnrollments(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Enrollment)));
      setLoading(false);
    }
    fetchEnrollments();
    // Fetch strands
    strandService.getAllStrands().then(setStrands).catch(() => setStrands([]));
  }, []);


  // Extract unique school years and semesters from enrollments
  const schoolYears = useMemo(() => Array.from(new Set(enrollments.map(e => e.schoolYear))).filter(Boolean), [enrollments]);
  const semesters = useMemo(() => Array.from(new Set(enrollments.map(e => e.semester))).filter(Boolean), [enrollments]);

  // Filter and search logic
  const filtered = useMemo(() => {
    let data = enrollments;
    if (statusFilter !== "all") data = data.filter(e => e.status === statusFilter);
    if (schoolYearFilter !== "all") data = data.filter(e => e.schoolYear === schoolYearFilter);
    if (semesterFilter !== "all") data = data.filter(e => e.semester === semesterFilter);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      data = data.filter(e => e.studentName.toLowerCase().includes(s));
    }
    return data;
  }, [enrollments, statusFilter, schoolYearFilter, semesterFilter, search]);

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handlePageChange(page: number) {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleApprove(sectionId: string) {
    if (!selectedEnrollment) return;
    setLoading(true);
    const ref = doc(db, "enrollment", selectedEnrollment.id);
    await updateDoc(ref, { status: "approved", sectionId });
    
    // Log the enrollment approval
    await logService.logEnrollmentApproved(
      selectedEnrollment.studentId,
      selectedEnrollment.studentName,
      'Admin'
    );
    
    setModalOpen(false);
    setSelectedEnrollment(null);
    // notify student that they are approved
    await notifyEnrollmentStatus({ studentId: selectedEnrollment.studentId, title: "Enrollment Approved", description: `Your enrollment has been approved for ${selectedEnrollment.semester} semester ${selectedEnrollment.schoolYear}.` });
    // Refresh enrollments
    const q = query(collection(db, "enrollment"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    setEnrollments(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Enrollment)));

    // update student data
    const studentQuery = query(collection(db, "students"), where("studentId", "==", selectedEnrollment.studentId));
    const studentSnapshot = await getDocs(studentQuery);
    if (!studentSnapshot.empty) {
      const studentDoc = studentSnapshot.docs[0];
      await updateDoc(studentDoc.ref, { 
        enrolledForSemester: selectedEnrollment.semester,
        enrolledForSchoolYear: selectedEnrollment.schoolYear,
        enrolledForSectionId: sectionId
      });
    }
    setLoading(false);
  }

  async function handleReject(reason: string) {
    if (!rejectEnrollment) return;
    setLoading(true);
    const ref = doc(db, "enrollment", rejectEnrollment.id);
    await updateDoc(ref, { status: "rejected", rejectionReason: `${reason}. Please resubmit your enrollment.` });
    
    // Log the enrollment rejection
    await logService.logEnrollmentRejected(
      rejectEnrollment.studentId,
      rejectEnrollment.studentName,
      'Admin'
    );
    
    setRejectModalOpen(false);
    setRejectEnrollment(null);
    // Refresh enrollments
    const q = query(collection(db, "enrollment"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    setEnrollments(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Enrollment)));
    setLoading(false);
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-lg font-extrabold mb-4 martian-mono text-primary">Enrollment Submissions</h1>
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <div className="flex gap-2">
          <button className={`btn btn-sm martian-mono text-xs text-primary ${statusFilter === "pending" ? "btn-primary text-white" : "btn-outline"}`} onClick={() => { setStatusFilter("pending"); setCurrentPage(1); }}>Pending</button>
          <button className={`btn btn-sm martian-mono text-xs text-primary ${statusFilter === "approved" ? "btn-primary text-white" : "btn-outline"}`} onClick={() => { setStatusFilter("approved"); setCurrentPage(1); }}>Approved</button>
          <button className={`btn btn-sm martian-mono text-xs text-primary ${statusFilter === "rejected" ? "btn-primary text-white" : "btn-outline"}`} onClick={() => { setStatusFilter("rejected"); setCurrentPage(1); }}>Rejected</button>
        </div>
        <div className="flex gap-2">
          <select className="select select-sm select-bordered martian-mono text-xs text-primary" value={schoolYearFilter} onChange={e => { setSchoolYearFilter(e.target.value); setCurrentPage(1); }}>
            <option value="all">All Years</option>
            {schoolYears.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
          <select className="select select-sm select-bordered martian-mono text-xs text-primary" value={semesterFilter} onChange={e => { setSemesterFilter(e.target.value); setCurrentPage(1); }}>
            <option value="all">All Semesters</option>
            {semesters.map(sem => <option key={sem} value={sem}>{sem}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <HiSearch className="w-5 h-5 text-zinc-400" />
          <input
            type="text"
            className="input input-bordered input-sm w-48"
            placeholder="Search by student name"
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>
      {loading ? (
        <div className="text-center py-12 text-zinc-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">No enrollments found.</div>
          ) : paginated.map(enrollment => {
            const strand = strands.find(s => s.id === enrollment.strandId);
            return (
              <div
                key={enrollment.id}
                className="group relative flex flex-col justify-between rounded-lg border border-zinc-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-150 p-3 min-h-[120px]"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="font-semibold text-sm text-primary transition-colors martian-mono">{enrollment.studentName}</span>
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-1 text-xs text-zinc-600">
                      <HiAcademicCap className="w-3.5 h-3.5 text-primary/60" />
                      <span>Strand: <span className="font-medium text-zinc-800">{strand ? strand.strandName : enrollment.strandId}</span></span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-600">
                      <HiCalendar className="w-3.5 h-3.5 text-primary/60" />
                      <span>{enrollment.semester} sem | {enrollment.schoolYear}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5">
                      <HiClock className="w-3 h-3" />
                      <span>Submitted: {formatDate(enrollment.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-stretch sm:items-center justify-end mt-3">
                  <button
                    className="btn btn-outline btn-xs font-medium rounded transition-colors hover:bg-primary/10 hover:border-primary min-h-0 h-7 px-3"
                    onClick={() => { setViewEnrollment(enrollment); setViewModalOpen(true); }}
                  >
                    View
                  </button>
                  {enrollment.status === "pending" && (
                    <>
                      <button
                        className="btn btn-error btn-xs text-white font-medium rounded shadow-sm transition-colors hover:bg-error/90 min-h-0 h-7 px-3"
                        onClick={() => { setRejectEnrollment(enrollment); setRejectModalOpen(true); }}
                        type="button"
                      >
                        Reject
                      </button>
                      <button
                        className="btn btn-primary btn-xs text-white font-medium rounded shadow-sm transition-colors hover:bg-primary/90 min-h-0 h-7 px-3"
                        onClick={() => { setSelectedEnrollment(enrollment); setModalOpen(true); }}
                      >
                        Approve
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            className="btn btn-sm btn-outline"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <HiChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-sm">Page {currentPage} of {totalPages}</span>
          <button
            className="btn btn-sm btn-outline"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next <HiChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      <ApproveEnrollmentModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedEnrollment(null); }}
        enrollment={selectedEnrollment}
        onApprove={handleApprove}
      />
      <ViewEnrollmentModal
        open={viewModalOpen}
        onClose={() => { setViewModalOpen(false); setViewEnrollment(null); }}
        enrollment={viewEnrollment}
        strandName={viewEnrollment ? (strands.find(s => s.id === viewEnrollment.strandId)?.strandName) : undefined}
      />
      <RejectEnrollmentModal
        open={rejectModalOpen}
        onClose={() => { setRejectModalOpen(false); setRejectEnrollment(null); }}
        onReject={handleReject}
        enrollment={rejectEnrollment}
      />
    </div>
  );
}

export default EnrolleeListPage;