"use client"
import React, { useState, useEffect } from 'react';
import { HiAcademicCap, HiUsers, HiClipboardList, HiPlus, HiPencil, HiArrowRight, HiUserGroup } from 'react-icons/hi';
import { Strand, Section } from '../../../interface/info';
import { strandService } from '../../../services/strandService';
import { sectionService } from '../../../services/sectionService';
import { teacherService } from '../../../services/teacherService';
import { studentService } from '../../../services/studentService';
import Link from 'next/link';

const AdminDashboard = () => {
  const [strands, setStrands] = useState<Strand[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [teacherCount, setTeacherCount] = useState<number>(0);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [fetchedStrands, fetchedSections, fetchedTeacherCount, fetchedStudentCount] = await Promise.all([
        strandService.getAllStrands(),
        sectionService.getAllSections(),
        teacherService.getTeacherCount(),
        studentService.getStudentCount()
      ]);
      
      setStrands(fetchedStrands);
      setSections(fetchedSections);
      setTeacherCount(fetchedTeacherCount);
      setStudentCount(fetchedStudentCount);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSectionsByStrand = (strandId: string) => {
    return sections.filter(section => section.strandId === strandId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/60">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <HiAcademicCap className="w-5 h-5 text-white" />
        <span className="text-sm text-white">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
          <HiAcademicCap className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary martian-mono">Admin Dashboard</h1>
          <p className="text-zinc-500 italic text-sm">Overview of academic structure and statistics</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
        <div className="stat">
          <div className="stat-figure text-primary">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <HiAcademicCap className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="stat-title text-xs italic text-zinc-500">Total Strands</div>
          <div className="stat-value text-primary text-2xl martian-mono">{strands.length}</div>
        </div>

        <div className="stat">
          <div className="stat-figure text-secondary">
            <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center">
              <HiClipboardList className="w-6 h-6 text-secondary" />
            </div>
          </div>
          <div className="stat-title text-xs italic text-zinc-500">Total Sections</div>
          <div className="stat-value text-secondary text-2xl martian-mono">{sections.length}</div>
        </div>

        <div className="stat">
          <div className="stat-figure text-primary">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <HiUserGroup className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="stat-title text-xs italic text-zinc-500">Total Teachers</div>
          <div className="stat-value text-primary text-2xl martian-mono">{teacherCount}</div>
        </div>

        <div className="stat">
          <div className="stat-figure text-secondary">
            <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center">
              <HiUsers className="w-6 h-6 text-secondary" />
            </div>
          </div>
          <div className="stat-title text-xs italic text-zinc-500">Total Students</div>
          <div className="stat-value text-secondary text-2xl martian-mono">{studentCount}</div>
        </div>

        <div className="stat">
          <div className="stat-figure text-primary">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <HiUsers className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="stat-title text-xs italic text-zinc-500">Active Programs</div>
          <div className="stat-value text-primary text-2xl martian-mono">
            {strands.filter(strand => 
              sections.some(section => section.strandId === strand.id)
            ).length}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-base-100 rounded-xl border border-base-300 p-6 martian-mono text-primary">
        <h2 className="font-semibold text-primary text-sm mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link 
            href="/admin/settings" 
            className="btn btn-primary btn-xs text-white gap-2"
          >
            <HiPlus className="w-4 h-4" />
            Manage Strands & Sections
          </Link>
          <Link 
            href="/admin/create-student" 
            className="btn btn-outline text-primary btn-xs gap-2"
          >
            <HiUsers className="w-4 h-4" />
            Add Student
          </Link>
          <Link 
            href="/admin/create-teacher" 
            className="btn btn-outline text-primary btn-xs gap-2"
          >
            <HiUserGroup className="w-4 h-4" />
            Add Teacher
          </Link>
          <Link 
            href="/admin/student-list" 
            className="btn btn-outline text-primary btn-xs gap-2"
          >
            <HiUsers className="w-4 h-4" />
            View All Students
          </Link>
          <Link 
            href="/admin/teacher-list" 
            className="btn btn-outline text-primary btn-xs gap-2"
          >
            <HiAcademicCap className="w-4 h-4" />
            View All Teachers
          </Link>
        </div>
      </div>

      {/* Strands and Sections Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Strands List */}
        <div className="bg-base-100 rounded-xl border border-base-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary martian-mono">Academic Strands</h2>
            <Link 
              href="/admin/settings" 
              className="btn btn-ghost btn-sm gap-2"
            >
              <HiPencil className="w-4 h-4" />
              Manage
            </Link>
          </div>
          
          {strands.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiAcademicCap className="w-8 h-8 text-base-content/40" />
              </div>
              <p className="text-base-content/60 mb-4">No strands created yet</p>
              <Link 
                href="/admin/settings" 
                className="btn btn-primary btn-sm"
              >
                Create First Strand
              </Link>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto rounded-lg">
              {strands.map((strand) => {
                const strandSections = getSectionsByStrand(strand.id);
                return (
                  <div 
                    key={strand.id} 
                    className="p-4 bg-base-50 rounded-lg border border-base-200 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-sm text-primary martian-mono">{strand.strandName}</h3>
                        <p className="text-xs text-zinc-500 line-clamp-2 italic">
                          {strand.strandDescription}  
                        </p>
                      </div>
                      <span className="badge badge-primary badge-sm">
                        {strandSections.length} sections
                      </span>
                    </div>
                    
                    {strandSections.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-base-200">
                        <p className="text-xs text-base-content/50 mb-2">Sections:</p>
                        <div className="flex flex-wrap gap-1">
                          {strandSections.slice(0, 3).map((section) => (
                            <span 
                              key={section.id} 
                              className="badge badge-secondary p-2 text-[10px] text-white martian-mono badge-xs"
                            >
                              {section.sectionName}
                            </span>
                          ))}
                          {strandSections.length > 3 && (
                            <span className="badge badge-outline badge-xs">
                              +{strandSections.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sections List */}
        <div className="bg-base-100 rounded-xl border border-base-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary martian-mono">All Sections</h2>
            <Link 
              href="/admin/settings" 
              className="btn btn-ghost btn-sm gap-2"
            >
              <HiPencil className="w-4 h-4" />
              Manage
            </Link>
          </div>
          
          {sections.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiClipboardList className="w-8 h-8 text-base-content/40" />
              </div>
              <p className="text-base-content/60 mb-4">No sections created yet</p>
              <Link 
                href="/admin/settings" 
                className="btn btn-primary btn-sm"
              >
                Create First Section
              </Link>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto rounded-lg">
              {sections.map((section) => {
                const strand = strands.find(s => s.id === section.strandId);
                return (
                  <div 
                    key={section.id} 
                    className="p-4 bg-base-50 rounded-lg border border-base-200 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-sm text-primary martian-mono">{section.sectionName}</h3>
                        <p className="text-xs text-zinc-500 line-clamp-2 italic">
                          Strand: {strand?.strandName || 'Unknown'}
                        </p>
                      </div>
                      <Link 
                        href="/admin/settings" 
                        className="btn btn-ghost btn-xs text-primary hover:bg-primary/10 martian-mono"
                      >
                        <HiArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* System Overview */}
      <div className="bg-base-100 rounded-xl border border-base-300 p-6">
        <h2 className="text-lg font-semibold text-primary martian-mono mb-4">System Overview</h2>
        <div className="stats stats-vertical md:stats-horizontal shadow w-full">
          <div className="stat">
            <div className="stat-title text-xs italic text-zinc-500">Academic Strands</div>
            <div className="stat-value text-primary text-xl martian-mono">{strands.length}</div>
          </div>

          <div className="stat">
            <div className="stat-title text-xs italic text-zinc-500">Class Sections</div>
            <div className="stat-value text-secondary text-xl martian-mono">{sections.length}</div>
          </div>

          <div className="stat">
            <div className="stat-title text-xs italic text-zinc-500">Avg Sections/Strand</div>
            <div className="stat-value text-primary text-xl martian-mono">
              {strands.length > 0 ? Math.round((sections.length / strands.length) * 10) / 10 : 0}
            </div>
          </div>

          <div className="stat">
            <div className="stat-title text-xs italic text-zinc-500">Active Programs</div>
            <div className="stat-value text-secondary text-xl martian-mono">
              {strands.filter(strand => 
                sections.some(section => section.strandId === strand.id)
              ).length}
            </div>
          </div>

          <div className="stat">
            <div className="stat-title text-xs italic text-zinc-500">Total Teachers</div>
            <div className="stat-value text-primary text-xl martian-mono">{teacherCount}</div>
          </div>

          <div className="stat">
            <div className="stat-title text-xs italic text-zinc-500">Total Students</div>
            <div className="stat-value text-secondary text-xl martian-mono">{studentCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;