"use client";
import React, { useEffect, useState } from "react";
import { HiAcademicCap, HiUsers } from "react-icons/hi";
import { Section } from "@/interface/info";
import { Teacher, Student } from "@/interface/user";
import { useSaveUserData } from "@/hooks/useSaveUserData";
import { sectionService } from "@/services/sectionService";
import { studentService } from "@/services/studentService";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../../../firebase";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import { FaClipboardList } from "react-icons/fa6";
import UpdateStudentStatusModal from "@/components/teacher/UpdateStudentStatusModal";
import { HiPencil } from "react-icons/hi";

const TeacherSectionsPage = () => {
  const { userData, isLoading: userLoading } = useSaveUserData({ role: "teacher" });
  const [section, setSection] = useState<Section | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userData || userLoading) return;

      if (!("employeeId" in userData)) {
        console.error("User data is not a teacher");
        return;
      }

      try {
        setLoading(true);
        const teacherData = userData as Teacher;

        // Fetch the section details
        const sectionData = await sectionService.getSectionByAdviserId
        (teacherData.employeeId);
        console.log('sectionData ===>', sectionData)
        if (!sectionData) {
          setLoading(false);
          return;
        }
        if (!sectionData) {
          console.error("Section not found");
          setLoading(false);
          return;
        }
        setSection(sectionData);


        // Fetch students enrolled in this section
        const studentsQuery = query(
          collection(db, "students"),
          where("enrolledForSectionId", "==", sectionData.id),
          orderBy("lastName", "asc")
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentsData: Student[] = [];
        studentsSnapshot.forEach((doc) => {
          studentsData.push({ id: doc.id, ...doc.data() } as Student);
        });
        setStudents(studentsData);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userData, userLoading]);

  const filteredStudents = students.filter(student => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
    return fullName.includes(search) || student.studentId?.toLowerCase().includes(search);
  });

  const handleUpdateStatus = async (studentId: string, newStatus: string) => {
    try {
      await studentService.updateStudentStatus(studentId, newStatus);
      
      // Update local state
      setStudents(prev => prev.map(student => 
        student.id === studentId 
          ? { 
              ...student, 
              status: newStatus as Student['status'],
              // Clear enrollment data if transfer-out or graduated
              ...(newStatus === "transfer-out" || newStatus === "graduated" ? {
                enrolledForSchoolYear: "",
                enrolledForSemester: "",
                enrolledForSectionId: ""
              } : {})
            }
          : student
      ));
    } catch (error) {
      console.error("Error updating student status:", error);
      throw error;
    }
  };

  const handleOpenStatusModal = (student: Student) => {
    setSelectedStudent(student);
    setStatusModalOpen(true);
  };

  const handleCloseStatusModal = () => {
    setStatusModalOpen(false);
    setSelectedStudent(null);
  };

  if (userLoading || loading) {
    return <LoadingOverlay />;
  }

  if (!userData || !("employeeId" in userData)) {
    return (
      <div className="text-center py-12">
        <HiAcademicCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Access denied. Please log in as a teacher.</p>
      </div>
    );
  }

  // If teacher doesn't have a designated section
  if (!section) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center py-12">
          <HiAcademicCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Advisory Class</h2>
          <p className="text-gray-500 text-xs">
            You don&apos;t have an advisory class assigned. Please contact the administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-primary">My Advisory Class</h1>
        <div className="text-xs text-gray-500">
          Manage your assigned section and enrolled students
        </div>
      </div>

      {/* Section Information */}
      <div className="card bg-base-100 shadow-sm border mb-6">
        <div className="card-body p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <FaClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-primary mb-1">
                {section.sectionName}
              </h2>
            </div>
            <div className="text-right flex items-center gap-2">
              <div className="text-2xl font-bold text-primary">
                {students.length}
              </div>
              <div className="text-xs text-gray-500">
                {students.length === 1 ? "Student" : "Students"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="card bg-base-100 shadow-sm border">
        <div className="card-body p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
              Enrolled Students
            </h3>
            
            {/* Search Input */}
            <div className="w-64">
              <input
                type="text"
                placeholder="Search students..."
                className="input input-bordered rounded-none text-primary input-sm w-full text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <HiUsers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchTerm ? "No students found matching your search" : "No students enrolled in this section"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm w-full">
                <thead>
                  <tr>
                    <th className="bg-base-200 text-xs font-medium">Student ID</th>
                    <th className="bg-base-200 text-xs font-medium">Name</th>
                    <th className="bg-base-200 text-xs font-medium">Status</th>
                    <th className="bg-base-200 text-xs font-medium">Contact</th>
                    <th className="bg-base-200 text-xs font-medium">Enrollment</th>
                    <th className="bg-base-200 text-xs font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const getStatusColor = (status?: string) => {
                      switch (status) {
                        case "enrolled": return "badge-success";
                        case "transfer-in": return "badge-info";
                        case "transfer-out": return "badge-warning";
                        case "incomplete": return "badge-warning";
                        case "graduated": return "badge-primary";
                        default: return "badge-neutral";
                      }
                    };

                    const getStatusLabel = (status?: string) => {
                      switch (status) {
                        case "enrolled": return "Enrolled";
                        case "transfer-in": return "Transfer In";
                        case "transfer-out": return "Transfer Out";
                        case "incomplete": return "Incomplete";
                        case "graduated": return "Graduated";
                        default: return "Not Set";
                      }
                    };

                    return (
                      <tr key={student.id} className="hover">
                        <td>
                          <span className="text-xs font-bold text-primary">
                            {student.studentId}
                          </span>
                        </td>
                        <td>
                          <div>
                            <div className="font-medium text-xs text-primary">
                              {student.firstName}, {student.lastName}
                              {student.middleName && ` ${student.middleName.charAt(0)}.`}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {student.sex}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-xs p-2 text-white text-[10px] ${getStatusColor(student.status)}`}>
                            {getStatusLabel(student.status)}
                          </span>
                        </td>
                        <td>
                          <div className="text-xs">
                            <div className="text-gray-600">{student.email}</div>
                            {student.contactNumber && (
                              <div className="text-gray-500">{student.contactNumber}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="text-xs">
                            <div className="text-gray-600">
                              {student.enrolledForSchoolYear || "Not enrolled"}
                            </div>
                            <div className="text-gray-500">
                              {student.enrolledForSemester ? `${student.enrolledForSemester} Semester` : ""}
                            </div>
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => handleOpenStatusModal(student)}
                            className="btn btn-ghost btn-xs text-primary hover:bg-primary hover:text-white"
                            title="Update Status"
                          >
                            <HiPencil className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary */}
          {filteredStudents.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between font-medium items-center text-xs text-gray-500">
                <span>
                  Showing {filteredStudents.length} of {students.length} students
                </span>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-primary hover:text-primary-dark"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Update Status Modal */}
      <UpdateStudentStatusModal
        open={statusModalOpen}
        onClose={handleCloseStatusModal}
        student={selectedStudent}
        onUpdate={handleUpdateStatus}
      />
    </div>
  );
};

export default TeacherSectionsPage;
