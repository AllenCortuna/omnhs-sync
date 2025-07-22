"use client";
import React, { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../../../firebase";
import { Enrollment } from "@/interface/info";
import { useRouter } from "next/navigation";
import { formatDate } from "@/config/format";
import { HiCheckCircle, HiXCircle, HiClock, HiEye, HiChevronLeft, HiChevronRight, HiSearch } from "react-icons/hi";
import { ApproveEnrollmentModal } from "@/components/admin/ApproveEnrollmentModal";
import { doc, updateDoc } from "firebase/firestore";

const PAGE_SIZE = 10;

export default function EnrolleeListPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [schoolYearFilter, setSchoolYearFilter] = useState<string>("all");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);

  useEffect(() => {
    async function fetchEnrollments() {
      setLoading(true);
      const q = query(collection(db, "enrollment"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setEnrollments(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Enrollment)));
      setLoading(false);
    }
    fetchEnrollments();
  }, []);

  function getStatusBadge(status: string) {
    switch (status) {
      case "approved":
        return <span className="badge badge-success gap-1 text-white"><HiCheckCircle className="w-3 h-3" />Approved</span>;
      case "rejected":
        return <span className="badge badge-error gap-1 text-white"><HiXCircle className="w-3 h-3" />Rejected</span>;
      case "pending":
      default:
        return <span className="badge badge-warning gap-1 text-white"><HiClock className="w-3 h-3" />Pending</span>;
    }
  }

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
    setModalOpen(false);
    setSelectedEnrollment(null);
    // Refresh enrollments
    const q = query(collection(db, "enrollment"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    setEnrollments(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Enrollment)));
    setLoading(false);
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Enrollment Submissions</h1>
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <div className="flex gap-2">
          <button className={`btn btn-sm ${statusFilter === "all" ? "btn-primary" : "btn-outline"}`} onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}>All</button>
          <button className={`btn btn-sm ${statusFilter === "pending" ? "btn-primary" : "btn-outline"}`} onClick={() => { setStatusFilter("pending"); setCurrentPage(1); }}>Pending</button>
          <button className={`btn btn-sm ${statusFilter === "approved" ? "btn-primary" : "btn-outline"}`} onClick={() => { setStatusFilter("approved"); setCurrentPage(1); }}>Approved</button>
          <button className={`btn btn-sm ${statusFilter === "rejected" ? "btn-primary" : "btn-outline"}`} onClick={() => { setStatusFilter("rejected"); setCurrentPage(1); }}>Rejected</button>
        </div>
        <div className="flex gap-2">
          <select className="select select-sm select-bordered" value={schoolYearFilter} onChange={e => { setSchoolYearFilter(e.target.value); setCurrentPage(1); }}>
            <option value="all">All Years</option>
            {schoolYears.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
          <select className="select select-sm select-bordered" value={semesterFilter} onChange={e => { setSemesterFilter(e.target.value); setCurrentPage(1); }}>
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
        <div className="grid gap-4">
          {paginated.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">No enrollments found.</div>
          ) : paginated.map(enrollment => (
            <div key={enrollment.id} className="card bg-white shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <div className="font-semibold text-primary">{enrollment.studentName}</div>
                  <div className="text-xs text-zinc-500">Strand: {enrollment.strandId} | {enrollment.semester} | {enrollment.schoolYear}</div>
                  <div className="text-xs text-zinc-400">{formatDate(enrollment.createdAt)}</div>
                </div>
                <div className="flex items-center gap-2 mt-2 md:mt-0">
                  {getStatusBadge(enrollment.status || "pending")}
                  <button className="btn btn-xs btn-outline" onClick={() => router.push(`/admin/enrollee/view?id=${enrollment.id}`)}>
                    <HiEye className="w-4 h-4" /> View
                  </button>
                  {enrollment.status === "pending" && (
                    <button className="btn btn-xs btn-success" onClick={() => { setSelectedEnrollment(enrollment); setModalOpen(true); }}>
                      Approve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
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
    </div>
  );
} 