"use client"
import React, { useState, useEffect } from 'react';
import { HiAcademicCap, HiArrowLeft } from 'react-icons/hi';
import { Strand } from '@/interface/info';
import { strandService, CreateStrandData, UpdateStrandData } from '@/services/strandService';
import { logService } from '@/services/logService';
import StrandList from '@/components/admin/StrandList';
import StrandForm from '@/components/admin/StrandForm';

const AdminStrandsPage: React.FC = () => {
  const [strands, setStrands] = useState<Strand[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingStrand, setEditingStrand] = useState<Strand | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch strands on component mount
  useEffect(() => {
    fetchStrands();
  }, []);

  const fetchStrands = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedStrands = await strandService.getAllStrands();
      setStrands(fetchedStrands);
    } catch (err) {
      console.error('Error fetching strands:', err);
      setError('Failed to load strands. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStrand = async (data: CreateStrandData) => {
    try {
      setFormLoading(true);
      setError(null);
      await strandService.createStrand(data);
      
      // Log the action
      await logService.logStrandCreated(data.strandName, 'Admin');
      
      setShowForm(false);
      setEditingStrand(null);
      await fetchStrands();
    } catch (err) {
      console.error('Error creating strand:', err);
      setError('Failed to create strand. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStrand = async (data: UpdateStrandData) => {
    if (!editingStrand?.id) return;
    
    try {
      setFormLoading(true);
      setError(null);
      await strandService.updateStrand(editingStrand.id, data);
      
      // Log the action
      await logService.logStrandUpdated(data.strandName || editingStrand.strandName, 'Admin');
      
      setShowForm(false);
      setEditingStrand(null);
      await fetchStrands();
    } catch (err) {
      console.error('Error updating strand:', err);
      setError('Failed to update strand. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditStrand = (strand: Strand) => {
    if (strand.id) {
      // Editing existing strand
      setEditingStrand(strand);
    } else {
      // Creating new strand
      setEditingStrand(null);
    }
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingStrand(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/60">Loading strands...</p>
        </div>
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
          <h1 className="text-lg font-bold martian-mono text-primary">Academic Strands</h1>
          <p className="text-base-content/60 font-normal text-xs italic">Manage academic strands for the school curriculum</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          <HiAcademicCap className="w-5 h-5 text-white" />
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
            Back to Strands
          </button>

          {/* Strand Form */}
          <StrandForm
            strand={editingStrand || undefined}
            onSubmit={async (data: CreateStrandData | UpdateStrandData) => {
              if (editingStrand?.id) {
                await handleUpdateStrand(data as UpdateStrandData);
              } else {
                await handleCreateStrand(data as CreateStrandData);
              }
            }}
            onCancel={handleCancelForm}
            loading={formLoading}
            mode={editingStrand?.id ? 'edit' : 'create'}
          />
        </div>
      ) : (
        <StrandList
          strands={strands}
          onEditStrand={handleEditStrand}
        />
      )}
    </div>
  );
};

export default AdminStrandsPage;