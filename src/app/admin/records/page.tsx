"use client";
import React, { useEffect, useState, useMemo } from "react";
import { subjectRecordService } from "@/services/subjectRecordService";
import { getDefaultSchoolYear } from "@/config/school";
import type { SubjectRecord } from "@/interface/info";
import { HiAcademicCap, HiDocumentText, HiArchive } from "react-icons/hi";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

const PAGE_SIZE = 10;

const AdminRecordsPage = () => {
  const [subjectRecords, setSubjectRecords] = useState<SubjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [schoolYearFilter, setSchoolYearFilter] = useState<string>("all");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchArchivedRecords();
  }, []);

  const fetchArchivedRecords = async () => {
    try {
      setLoading(true);
      const allRecords = await subjectRecordService.getAllSubjectRecords();
      const currentSchoolYear = getDefaultSchoolYear();
      
      // Filter out current school year records (only show archived/past records)
      const archivedRecords = allRecords.filter(
        (record) => record.schoolYear !== currentSchoolYear
      );
      
      setSubjectRecords(archivedRecords);
    } catch (error) {
      console.error("Error fetching archived records:", error);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique school years and semesters from archived records
  const schoolYears = useMemo(
    () =>
      Array.from(new Set(subjectRecords.map((r) => r.schoolYear)))
        .filter(Boolean)
        .sort()
        .reverse(),
    [subjectRecords]
  );

  const semesters = useMemo(
    () =>
      Array.from(new Set(subjectRecords.map((r) => r.semester)))
        .filter(Boolean)
        .sort(),
    [subjectRecords]
  );

  // Filter and search logic
  const filtered = useMemo(() => {
    let data = subjectRecords;

    if (schoolYearFilter !== "all") {
      data = data.filter((r) => r.schoolYear === schoolYearFilter);
    }

    if (semesterFilter !== "all") {
      data = data.filter((r) => r.semester === semesterFilter);
    }

    if (search.trim()) {
      const s = search.trim().toLowerCase();
      data = data.filter(
        (r) =>
          r.subjectName.toLowerCase().includes(s) ||
          r.sectionName.toLowerCase().includes(s) ||
          r.teacherName.toLowerCase().includes(s)
      );
    }

    return data;
  }, [subjectRecords, schoolYearFilter, semesterFilter, search]);

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function handlePageChange(page: number) {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /**
   * Checks if all student grades are complete for both 1st and 2nd quarter
   * @param record - The subject record to check
   * @returns Object with isComplete status and message
   */
  const checkGradesComplete = (record: SubjectRecord) => {
    const studentList = record.studentList || [];
    const studentGrades = record.studentGrades || [];

    if (studentList.length === 0) {
      return {
        isComplete: false,
        message: "No students enrolled",
      };
    }

    // Check if all students have grades
    const studentsWithGrades = studentList.filter((studentId) => {
      const grade = studentGrades.find((g) => g.studentId === studentId);
      return (
        grade &&
        grade.firstQuarterGrade > 0 &&
        grade.secondQuarterGrade > 0
      );
    });

    const allComplete = studentsWithGrades.length === studentList.length;

    if (allComplete) {
      return {
        isComplete: true,
        message: "Submitted - All grades complete",
      };
    } else {
      const incompleteCount = studentList.length - studentsWithGrades.length;
      return {
        isComplete: false,
        message: `Incomplete - ${incompleteCount} student(s) missing grades`,
      };
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-zinc-400">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-4">Loading archived records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
          <HiArchive className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold mb-1 martian-mono text-primary">
            Archived Class Schedules
          </h1>
          <p className="text-zinc-500 italic text-sm">
            View all past school year class schedules
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <div className="flex gap-2">
          <select
            className="select select-sm select-bordered martian-mono text-xs text-primary"
            value={schoolYearFilter}
            onChange={(e) => {
              setSchoolYearFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All School Years</option>
            {schoolYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            className="select select-sm select-bordered martian-mono text-xs text-primary"
            value={semesterFilter}
            onChange={(e) => {
              setSemesterFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Semesters</option>
            {semesters.map((sem) => (
              <option key={sem} value={sem}>
                {sem}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="text"
            className="input input-bordered input-sm w-64 martian-mono text-xs text-primary rounded-none"
            placeholder="Search by subject, section, or teacher"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Records Table */}
      {paginated.length === 0 ? (
        <div className="text-center py-12">
          <HiAcademicCap className="text-4xl text-base-content/20 mx-auto mb-2" />
          <h3 className="text-sm text-primary font-semibold mb-1">No archived records found</h3>
          <p className="text-xs text-primary/60">
            Try adjusting your filters or search
          </p>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm w-full">
                <thead>
                  <tr>
                    <th className="bg-base-200 text-xs">Grade Level-Section</th>
                    <th className="bg-base-200 text-xs">Subject</th>
                    <th className="bg-base-200 text-xs">Teacher</th>
                    <th className="bg-base-200 text-xs">Semester</th>
                    <th className="bg-base-200 text-xs">School Year</th>
                    <th className="bg-base-200 text-xs">Students</th>
                    <th className="bg-base-200 text-xs">Remarks</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {paginated.map((record) => (
                    <tr key={record.id} className="hover">
                      <td>
                        <div className="font-medium text-xs text-primary">
                        {record.sectionName}
                        </div>
                      </td>
                      <td>
                        <div className="font-bold w-32 text-primary text-xs">
                          {record.subjectName}
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-xs text-zinc-600">
                          {record.teacherName}
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-xs text-zinc-600">
                          {record.semester}
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-xs text-zinc-600">
                          {record.schoolYear}
                        </div>
                      </td>
                      <td>
                        <div className="badge badge-neutral badge-xs text-white text-[9px] p-2 rounded-full">
                          {record.studentList?.length || 0}
                        </div>
                      </td>
                      <td>
                        {(() => {
                          const gradeStatus = checkGradesComplete(record);
                          return (
                            <div
                              className={`text-xs font-medium ${
                                gradeStatus.isComplete
                                  ? "text-success"
                                  : "text-warning"
                              }`}
                            >
                              {gradeStatus.message}
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn btn-sm btn-outline"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next <HiChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 stats stats-vertical lg:stats-horizontal shadow w-full">
        <div className="stat">
          <div className="stat-figure text-primary">
            <HiArchive className="w-6 h-6 text-primary" />
          </div>
          <div className="stat-title text-xs italic text-zinc-500">
            Total Archived Records
          </div>
          <div className="stat-value text-primary text-2xl martian-mono">
            {subjectRecords.length}
          </div>
        </div>
        <div className="stat">
          <div className="stat-figure text-secondary">
            <HiDocumentText className="w-6 h-6 text-secondary" />
          </div>
          <div className="stat-title text-xs italic text-zinc-500">
            Filtered Results
          </div>
          <div className="stat-value text-secondary text-2xl martian-mono">
            {filtered.length}
          </div>
        </div>
        <div className="stat">
          <div className="stat-figure text-primary">
            <HiAcademicCap className="w-6 h-6 text-primary" />
          </div>
          <div className="stat-title text-xs italic text-zinc-500">
            School Years
          </div>
          <div className="stat-value text-primary text-2xl martian-mono">
            {schoolYears.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRecordsPage;

