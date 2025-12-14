"use client"
import React, { useState, useEffect } from 'react';
import { HiBookOpen, HiArrowLeft } from 'react-icons/hi';
import { Subject, Strand } from '@/interface/info';
import { subjectService, CreateSubjectData, UpdateSubjectData } from '@/services/subjectService';
import { strandService } from '@/services/strandService';
import { logService } from '@/services/logService';
import SubjectList from '@/components/admin/SubjectList';
import SubjectForm from '@/components/admin/SubjectForm';
import { useCurrentAdmin } from '@/hooks';

const AdminSubjectsPage: React.FC = () => {
  const { admin } = useCurrentAdmin();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [strands, setStrands] = useState<Strand[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch subjects and strands on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedSubjects, fetchedStrands] = await Promise.all([
        subjectService.getAllSubjects(),
        strandService.getAllStrands()
      ]);
      setSubjects(fetchedSubjects);
      setStrands(fetchedStrands);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (data: CreateSubjectData) => {
    try {
      setFormLoading(true);
      setError(null);
      await subjectService.createSubject(data);
      
      // Log the action
      await logService.logSubjectCreated(data.subjectName, admin?.name || 'Admin');
      
      setShowForm(false);
      setEditingSubject(null);
      await fetchData();
    } catch (err) {
      console.error('Error creating subject:', err);
      setError('Failed to create subject. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateSubject = async (data: UpdateSubjectData) => {
    if (!editingSubject?.id) return;
    
    try {
      setFormLoading(true);
      setError(null);
      await subjectService.updateSubject(editingSubject.id, data);
      
      // Log the action
      await logService.logSubjectUpdated(data.subjectName || editingSubject.subjectName, admin?.name || 'Admin');
      
      setShowForm(false);
      setEditingSubject(null);
      await fetchData();
    } catch (err) {
      console.error('Error updating subject:', err);
      setError('Failed to update subject. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubject = (subject: Subject) => {
    if (subject.id) {
      // Editing existing subject
      setEditingSubject(subject);
    } else {
      // Creating new subject
      setEditingSubject(null);
    }
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingSubject(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/60">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
          <HiBookOpen className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold martian-mono text-primary">Subjects</h1>
          <p className="text-base-content/60 font-normal text-xs italic">Manage subjects for each academic strand</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          <HiBookOpen className="w-5 h-5 text-white" />
          <span className="text-sm text-white">{error}</span>
        </div>
      )}

      {/* Content */}
      {showForm ? (
        <div className="space-y-4">
          {/* Back Button */}
          <button
            onClick={handleCancelForm}
            className="btn btn-ghost text-xs text-primary martian-mono btn-sm gap-2"
          >
            <HiArrowLeft className="w-4 h-4" />
            Back to Subjects
          </button>

          {/* Subject Form */}
          <SubjectForm
            subject={editingSubject || undefined}
            onSubmit={async (data: CreateSubjectData | UpdateSubjectData) => {
              if (editingSubject?.id) {
                await handleUpdateSubject(data as UpdateSubjectData);
              } else {
                await handleCreateSubject(data as CreateSubjectData);
              }
            }}
            onCancel={handleCancelForm}
            loading={formLoading}
            mode={editingSubject?.id ? 'edit' : 'create'}
          />
        </div>
      ) : (
        <SubjectList
          subjects={subjects}
          strands={strands}
          onEditSubject={handleEditSubject}
        />
      )}
    </div>
  );
};

export default AdminSubjectsPage;
