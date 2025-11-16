"use client";
import React, { useEffect, useState } from "react";
import { HiAcademicCap, HiTrash, HiUsers } from "react-icons/hi";
import { Section, Strand } from "@/interface/info";
import { Teacher } from "@/interface/user";
import { strandService } from "@/services/strandService";
import { sectionService } from "@/services/sectionService";
import { teacherService } from "@/services/teacherService";
import { logService } from "@/services/logService";
import { errorToast } from "@/config/toast";
import { FaClipboardList } from "react-icons/fa6";
import { useCurrentAdmin } from "@/hooks";

const SectionsPage = () => {
  const { admin } = useCurrentAdmin();
  const [strands, setStrands] = useState<Strand[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedStrand, setSelectedStrand] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [assignTeacherModalOpen, setAssignTeacherModalOpen] = useState(false);
  const [sectionToAssign, setSectionToAssign] = useState<Section | null>(null);
  const [teacherSearch, setTeacherSearch] = useState("");

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [strandsData, sectionsData, teachersData] = await Promise.all([
        strandService.getAllStrands(),
        sectionService.getAllSections(),
        teacherService.getAllTeachers()
      ]);
      
      setStrands(strandsData);
      setSections(sectionsData);
      setTeachers(teachersData);
      
      if (strandsData.length > 0 && !selectedStrand) {
        setSelectedStrand(strandsData[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSections = sections.filter(section => 
    selectedStrand ? section.strandId === selectedStrand : true
  );

  const filteredTeachers = teachers.filter(teacher => {
    if (!teacherSearch.trim()) return true;
    const searchTerm = teacherSearch.toLowerCase();
    const fullName = `${teacher.firstName} ${teacher.lastName}`.toLowerCase();
    return fullName.includes(searchTerm) || teacher.employeeId?.toLowerCase().includes(searchTerm);
  });

  // Check if a teacher is already assigned to a section
  const isTeacherAssigned = (teacherId: string) => {
    return sections.some(section => section.adviserId === teachers.find(t => t.id === teacherId)?.employeeId);
  };

  const handleAssignTeacher = async (teacherId: string) => {
    if (!sectionToAssign) return;
    
    try {
      const teacher = teachers.find(t => t.id === teacherId);
      if (!teacher) return;

      // Check if teacher is already assigned to another section
      const isAlreadyAssigned = sections.some(section => 
        section.adviserId === teacher.employeeId && section.id !== sectionToAssign.id
      );

      if (isAlreadyAssigned) {
        errorToast(`${teacher.firstName} ${teacher.lastName} is already assigned to another section. A teacher can only be assigned to one section.`);
        return;
      }

      await sectionService.updateSection(sectionToAssign.id, {
        adviserId: teacher.employeeId,
        adviserName: `${teacher.firstName} ${teacher.lastName}`,
        adviserEmail: teacher.email
      });

      setSections(prev => prev.map(section => 
        section.id === sectionToAssign.id 
          ? { 
              ...section, 
              adviserId: teacher.employeeId,
              adviserName: `${teacher.firstName} ${teacher.lastName}`,
              adviserEmail: teacher.email
            }
          : section
      ));
      
      setAssignTeacherModalOpen(false);
      setSectionToAssign(null);
      setTeacherSearch("");
      
      // Log the teacher assignment
      await logService.logTeacherAssignedToSection(
        sectionToAssign.id,
        sectionToAssign.sectionName,
        teacherId,
        `${teacher.firstName} ${teacher.lastName}`,
        'Admin',
        admin?.name || 'Admin'
      );
    } catch (error) {
      console.error("Error assigning teacher:", error);
    }
  };

  const handleRemoveTeacher = async (sectionId: string) => {
    try {
      await sectionService.updateSection(sectionId, {
        adviserId: "",
        adviserName: "",
        adviserEmail: ""
      });

      setSections(prev => prev.map(section => 
        section.id === sectionId 
          ? { 
              ...section, 
              adviserId: "",
              adviserName: "",
              adviserEmail: ""
            }
          : section
      ));
      
      // Log the teacher removal
      const section = sections.find(s => s.id === sectionId);
      if (section) {
        await logService.logTeacherRemovedFromSection(
          sectionId,
          section.sectionName,
          'Admin',
          admin?.name || 'Admin'

        );
      }
    } catch (error) {
      console.error("Error removing teacher:", error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="text-center py-12 text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary martian-mono">Section Management</h1>
      </div>

      {/* Strand Selection */}
      <div className="mb-6">
        <label className="label">
          <span className="label-text text-xs text-zinc-500 font-medium">Select Strand</span>
        </label>
        <select
          className="select select-bordered text-xs text-primary w-full max-w-xs"
          value={selectedStrand}
          onChange={(e) => setSelectedStrand(e.target.value)}
        >
          <option value="">Choose a strand</option>
          {strands.map(strand => (
            <option key={strand.id} value={strand.id}>
              {strand.strandName}
            </option>
          ))}
        </select>
      </div>

      {/* Sections List */}
      {selectedStrand ? (
        <div className="space-y-4">
          {filteredSections.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <HiAcademicCap className="text-4xl mx-auto mb-4 text-base-content/20" />
              <h3 className="text-lg font-semibold mb-2">No sections found</h3>
              <p className="text-sm text-base-content/60">
                Create your first section for this strand
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredSections.map(section => (
                <div key={section.id} className="card bg-base-100 shadow-sm border">
                  <div className="card-body p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                          <FaClipboardList className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-primary text-sm">
                            {section.sectionName}
                          </h3>
                          <p className="text-xs text-base-content/60">
                            {strands.find(s => s.id === section.strandId)?.strandName}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                         {section.adviserName ? (
                           <div className="flex items-center gap-2 text-xs">
                             <HiUsers className="w-4 h-4 text-primary" />
                             <span className="text-primary font-medium mr-8">
                               {section.adviserName}
                             </span>
                             <button
                               onClick={() => handleRemoveTeacher(section.id)}
                               className="btn btn-ghost btn-sm text-error"
                               title="Remove teacher"
                             >
                               <HiTrash className="w-5 h-5" />
                             </button>
                           </div>
                         ) : (
                           <div className="flex items-center gap-2">
                             <button
                               onClick={() => {
                                 setSectionToAssign(section);
                                 setAssignTeacherModalOpen(true);
                               }}
                               className="btn btn-outline btn-sm text-xs text-primary"
                             >
                               <HiUsers className="w-4 h-4" />
                               Assign Teacher
                             </button>
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-zinc-400">
          <HiAcademicCap className="text-4xl mx-auto mb-4 text-base-content/20" />
          <h3 className="text-lg font-semibold mb-2">Select a strand</h3>
          <p className="text-sm text-base-content/60">
            Choose a strand to view and manage its sections
          </p>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {assignTeacherModalOpen && sectionToAssign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card bg-base-100 w-full max-w-md">
            <div className="card-body">
              <h3 className="card-title text-sm text-primary">Assign Teacher to {sectionToAssign.sectionName}</h3>
              
              {/* Search Input */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by name or employee ID..."
                  className="input input-bordered rounded-none text-primary input-sm w-full text-xs"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                />
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                 {filteredTeachers.length === 0 ? (
                   <div className="text-center py-4 text-zinc-400 text-xs">
                     {teacherSearch ? "No teachers found matching your search" : "No teachers available"}
                   </div>
                 ) : (
                   filteredTeachers.map(teacher => {
                     const isAssigned = isTeacherAssigned(teacher.id!);
                     return (
                       <button
                         key={teacher.id}
                         onClick={() => !isAssigned && handleAssignTeacher(teacher.id!)}
                         disabled={isAssigned}
                         className={`btn rounded-none w-full justify-start text-xs group ${
                           isAssigned 
                             ? 'btn-disabled opacity-50 cursor-not-allowed' 
                             : 'btn-outline hover:bg-primary hover:text-white'
                         }`}
                       >
                         <div className="text-left">
                           <div className={`font-medium text-xs ${
                             isAssigned 
                               ? 'text-zinc-400' 
                               : 'text-primary group-hover:text-white'
                           }`}>
                             {teacher.firstName} {teacher.lastName}
                             {isAssigned && ' (Already Assigned)'}
                           </div>
                           <div className={`text-[9px] ${
                             isAssigned 
                               ? 'text-zinc-400' 
                               : 'text-zinc-500 group-hover:text-zinc-300'
                           }`}>
                             {teacher.employeeId}
                           </div>
                         </div>
                       </button>
                     );
                   })
                 )}
              </div>
              <div className="card-actions justify-end">
                <button
                  onClick={() => {
                    setAssignTeacherModalOpen(false);
                    setSectionToAssign(null);
                    setTeacherSearch("");
                  }}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SectionsPage;
