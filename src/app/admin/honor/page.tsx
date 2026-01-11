"use client";
import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/../firebase";
import { Strand, Section, StudentGrade } from "@/interface/info";
import { Student } from "@/interface/user";
import { strandService } from "@/services/strandService";
import { sectionService } from "@/services/sectionService";
import { subjectRecordService } from "@/services/subjectRecordService";
import { getSchoolYearOptions, SEMESTER_OPTIONS } from "@/config/school";
import { errorToast } from "@/config/toast";
import { HiAcademicCap, HiUsers, HiCalendar } from "react-icons/hi";
import { FaTrophy } from "react-icons/fa6";

interface HonorStudent {
  student: Student;
  averageGrade: number;
  totalSubjects: number;
  grades: StudentGrade[];
  honorDistinction: string | null;
}

/**
 * Determines the honor distinction based on average grade
 */
function getHonorDistinction(averageGrade: number): string | null {
  if (averageGrade >= 98 && averageGrade <= 100) {
    return "With Highest Honors";
  } else if (averageGrade >= 95 && averageGrade < 98) {
    return "With High Honors";
  } else if (averageGrade >= 90 && averageGrade < 95) {
    return "With Honors";
  }
  return null;
}

const HonorPage: React.FC = () => {
  const [strands, setStrands] = useState<Strand[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedStrand, setSelectedStrand] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [honorStudents, setHonorStudents] = useState<HonorStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Fetch strands on mount
  useEffect(() => {
    const fetchStrands = async () => {
      try {
        const strandsData = await strandService.getAllStrands();
        setStrands(strandsData);
      } catch (error) {
        console.error("Error fetching strands:", error);
        errorToast("Failed to load strands");
      }
    };
    fetchStrands();
  }, []);

  // Fetch sections when strand is selected
  useEffect(() => {
    const fetchSections = async () => {
      if (!selectedStrand) {
        setSections([]);
        setSelectedSection("");
        return;
      }

      try {
        setLoading(true);
        const sectionsData = await sectionService.getSectionsByStrandId(selectedStrand);
        setSections(sectionsData);
        setSelectedSection("");
      } catch (error) {
        console.error("Error fetching sections:", error);
        errorToast("Failed to load sections");
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [selectedStrand]);

  // Reset honor students when filters change
  useEffect(() => {
    setHonorStudents([]);
  }, [selectedStrand, selectedSection, selectedSchoolYear, selectedSemester]);

  const handleCalculateHonor = async () => {
    if (!selectedSection || !selectedSchoolYear || !selectedSemester) {
      errorToast("Please select section, school year, and semester");
      return;
    }

    try {
      setFetching(true);

      // Get all students enrolled in this section for the selected school year and semester
      const studentsQuery = query(
        collection(db, "students"),
        where("enrolledForSectionId", "==", selectedSection),
        where("enrolledForSchoolYear", "==", selectedSchoolYear),
        where("enrolledForSemester", "==", selectedSemester),
        orderBy("lastName", "asc")
      );

      const studentsSnapshot = await getDocs(studentsQuery);
      const students: Student[] = [];
      studentsSnapshot.forEach((doc) => {
        students.push({ id: doc.id, ...doc.data() } as Student);
      });

      if (students.length === 0) {
        errorToast("No students found for the selected criteria");
        setFetching(false);
        return;
      }

      // Get all subject records for this section, school year, and semester
      const allSubjectRecords = await subjectRecordService.getAllSubjectRecords();
      const relevantRecords = allSubjectRecords.filter(
        (record) =>
          record.sectionId === selectedSection &&
          record.schoolYear === selectedSchoolYear &&
          record.semester === selectedSemester
      );

      if (relevantRecords.length === 0) {
        errorToast("No subject records found for the selected criteria");
        setFetching(false);
        return;
      }

      // Calculate average grades for each student
      const honorStudentsData: HonorStudent[] = students.map((student) => {
        const studentGrades: StudentGrade[] = [];
        
        // Collect all grades for this student from relevant subject records
        relevantRecords.forEach((record) => {
          if (record.studentGrades && record.studentGrades.length > 0) {
            const grade = record.studentGrades.find(
              (g) => g.studentId === student.studentId
            );
            if (grade && grade.finalGrade > 0) {
              studentGrades.push(grade);
            }
          }
        });

        // Calculate average grade
        const totalGrade = studentGrades.reduce(
          (sum, grade) => sum + grade.finalGrade,
          0
        );
        const averageGrade =
          studentGrades.length > 0
            ? Math.round((totalGrade / studentGrades.length) * 100) / 100
            : 0;

        // Determine honor distinction
        const honorDistinction = getHonorDistinction(averageGrade);

        return {
          student,
          averageGrade,
          totalSubjects: studentGrades.length,
          grades: studentGrades,
          honorDistinction,
        };
      });

      // Filter out students with no grades and sort by average grade (descending)
      // Also filter to only show students with honors (90% and above)
      const validHonorStudents = honorStudentsData
        .filter((hs) => hs.totalSubjects > 0 && hs.averageGrade >= 90)
        .sort((a, b) => b.averageGrade - a.averageGrade);

      setHonorStudents(validHonorStudents);

      if (validHonorStudents.length === 0) {
        errorToast("No students with grades found for the selected criteria");
      }
    } catch (error) {
      console.error("Error calculating honor students:", error);
      errorToast("Failed to calculate honor students");
    } finally {
      setFetching(false);
    }
  };

  const schoolYearOptions = getSchoolYearOptions();

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
          <FaTrophy className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold martian-mono text-primary">Honor Students</h1>
          <p className="text-base-content/60 font-normal text-xs italic">
            View and recognize top-performing students by section
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow-sm border">
        <div className="card-body p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strand Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-xs font-medium text-base-content/70">
                  <HiAcademicCap className="w-4 h-4 inline mr-1" />
                  Strand
                </span>
              </label>
              <select
                className="select select-bordered text-xs text-primary w-full"
                value={selectedStrand}
                onChange={(e) => setSelectedStrand(e.target.value)}
                disabled={loading}
              >
                <option value="">Select a strand</option>
                {strands.map((strand) => (
                  <option key={strand.id} value={strand.id}>
                    {strand.strandName}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-xs font-medium text-base-content/70">
                  <HiUsers className="w-4 h-4 inline mr-1" />
                  Section
                </span>
              </label>
              <select
                className="select select-bordered text-xs text-primary w-full"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={!selectedStrand || loading || sections.length === 0}
              >
                <option value="">
                  {!selectedStrand
                    ? "Select a strand first"
                    : sections.length === 0
                    ? "No sections available"
                    : "Select a section"}
                </option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.sectionName}
                  </option>
                ))}
              </select>
            </div>

            {/* School Year Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-xs font-medium text-base-content/70">
                  <HiCalendar className="w-4 h-4 inline mr-1" />
                  School Year
                </span>
              </label>
              <select
                className="select select-bordered text-xs text-primary w-full"
                value={selectedSchoolYear}
                onChange={(e) => setSelectedSchoolYear(e.target.value)}
              >
                <option value="">Select school year</option>
                {schoolYearOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-xs font-medium text-base-content/70">
                  <HiCalendar className="w-4 h-4 inline mr-1" />
                  Semester
                </span>
              </label>
              <select
                className="select select-bordered text-xs text-primary w-full"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                <option value="">Select semester</option>
                {SEMESTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Calculate Button */}
          <div className="mt-4">
            <button
              className="btn btn-primary w-full md:w-auto text-xs martian-mono"
              onClick={handleCalculateHonor}
              disabled={
                !selectedSection ||
                !selectedSchoolYear ||
                !selectedSemester ||
                fetching
              }
            >
              {fetching ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Calculating...
                </>
              ) : (
                <>
                  <FaTrophy className="w-4 h-4" />
                  Calculate Honor Students
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Honor Students List */}
      {honorStudents.length > 0 && (
        <div className="card bg-base-100 shadow-sm border">
          <div className="card-body p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold martian-mono text-primary">
                Honor Students ({honorStudents.length})
              </h2>
              <div className="text-xs text-base-content/60">
                {selectedSection &&
                  sections.find((s) => s.id === selectedSection)?.sectionName}
                {" - "}
                {selectedSchoolYear} - {selectedSemester} Semester
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr className="bg-primary/10">
                    <th className="text-xs font-semibold text-primary">Rank</th>
                    <th className="text-xs font-semibold text-primary">Student Name</th>
                    <th className="text-xs font-semibold text-primary">Student ID</th>
                    <th className="text-xs font-semibold text-primary">Average Grade</th>
                    <th className="text-xs font-semibold text-primary">Honor Distinction</th>
                    <th className="text-xs font-semibold text-primary">Subjects</th>
                  </tr>
                </thead>
                <tbody>
                  {honorStudents.map((honorStudent, index) => {
                    const rank = index + 1;
                    const isTopThree = rank <= 3;
                    return (
                      <tr
                        key={honorStudent.student.id}
                        className={isTopThree ? "bg-accent/10" : ""}
                      >
                        <td className="text-xs">
                          {isTopThree ? (
                            <div className="flex items-center gap-2">
                              <FaTrophy
                                className={`w-4 h-4 ${
                                  rank === 1
                                    ? "text-yellow-500"
                                    : rank === 2
                                    ? "text-gray-400"
                                    : "text-amber-600"
                                }`}
                              />
                              <span className="font-bold">{rank}</span>
                            </div>
                          ) : (
                            <span>{rank}</span>
                          )}
                        </td>
                        <td className="text-xs">
                          {honorStudent.student.lastName},{" "}
                          {honorStudent.student.firstName}{" "}
                          {honorStudent.student.middleName
                            ? honorStudent.student.middleName.charAt(0) + "."
                            : ""}
                        </td>
                        <td className="text-xs font-mono">
                          {honorStudent.student.studentId}
                        </td>
                        <td className="text-xs font-bold text-primary">
                          {honorStudent.averageGrade.toFixed(2)}
                        </td>
                        <td className="text-xs">
                          {honorStudent.honorDistinction ? (
                            <span
                              className={`font-semibold ${
                                honorStudent.averageGrade >= 98
                                  ? "text-yellow-600"
                                  : honorStudent.averageGrade >= 95
                                  ? "text-blue-600"
                                  : "text-green-600"
                              }`}
                            >
                              {honorStudent.honorDistinction}
                            </span>
                          ) : (
                            <span className="text-base-content/40">—</span>
                          )}
                        </td>
                        <td className="text-xs">{honorStudent.totalSubjects}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {honorStudents.length === 0 && !fetching && (
        <div className="card bg-base-100 shadow-sm border">
          <div className="card-body p-12 text-center">
            <FaTrophy className="w-16 h-16 text-base-content/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-base-content/60">
              No Honor Students Yet
            </h3>
            <p className="text-sm text-base-content/50">
              Select a strand, section, school year, and semester, then click
              Calculate Honor Students to view the results.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HonorPage;
