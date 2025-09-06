"use client"
import React, { useState, useEffect } from 'react';
import { HiCog, HiAcademicCap, HiArrowLeft, HiKey } from 'react-icons/hi';
import { Strand } from '../../interface/info';
import { strandService, CreateStrandData, UpdateStrandData } from '../../services/strandService';
import StrandList from './StrandList';
import StrandForm from './StrandForm';
import ChangePassword from './ChangePassword';

const AdminSettings: React.FC = () => {
  const [strands, setStrands] = useState<Strand[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingStrand, setEditingStrand] = useState<Strand | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

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

  const handleToggleChangePassword = () => {
    setShowChangePassword(!showChangePassword);
  };

  const handleCancelChangePassword = () => {
    setShowChangePassword(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/60">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
          <HiCog className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold martian-mono text-primary">Admin Settings</h1>
          <p className="text-base-content/60 font-normal text-xs italic">Manage system configurations and academic data</p>
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
            className="btn btn-ghost btn-sm gap-2"
          >
            <HiArrowLeft className="w-4 h-4" />
            Back to Settings
          </button>

          {/* Strand Form */}
          <StrandForm
            strand={editingStrand || undefined}
            onSubmit={async (data) => {
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
      ) : showChangePassword ? (
        <div className="space-y-4">
          {/* Back Button */}
          <button
            onClick={handleCancelChangePassword}
            className="btn btn-ghost btn-sm gap-2"
          >
            <HiArrowLeft className="w-4 h-4" />
            Back to Settings
          </button>

          {/* Change Password Form */}
          <ChangePassword
            onCancel={handleCancelChangePassword}
            loading={formLoading}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Change Password Button */}
          <div className="flex justify-end">
            <button
              onClick={handleToggleChangePassword}
              className="btn btn-primary text-white martian-mono btn-sm gap-2"
            >
              <HiKey className="w-4 h-4" />
              Change Password
            </button>
          </div>

          {/* Strands Section */}
          <div className="bg-base-100 rounded-xl border border-base-300 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <HiAcademicCap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold martian-mono text-primary">Academic Strands</h2>
                <p className="text-sm text-base-content/60 font-normal italic">
                  Manage academic strands for the school curriculum
                </p>
              </div>
            </div>

            <StrandList
              strands={strands}
              onEditStrand={handleEditStrand}
            />
          </div>

        </div>
      )}
    </div>
  );
};

export default AdminSettings; 