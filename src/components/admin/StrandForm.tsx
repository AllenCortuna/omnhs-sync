"use client"
import React, { useState, useEffect } from 'react';
import { HiAcademicCap, HiX, HiCheck } from 'react-icons/hi';
import { Strand } from '../../interface/info';
import { CreateStrandData, UpdateStrandData } from '../../services/strandService';

interface StrandFormProps {
  strand?: Strand;
  onSubmit: (data: CreateStrandData | UpdateStrandData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  mode: 'create' | 'edit';
}

const StrandForm: React.FC<StrandFormProps> = ({
  strand,
  onSubmit,
  onCancel,
  loading,
  mode
}) => {
  const [formData, setFormData] = useState({
    strandName: strand?.strandName || '',
    strandDescription: strand?.strandDescription || ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (strand) {
      setFormData({
        strandName: strand.strandName,
        strandDescription: strand.strandDescription
      });
    }
  }, [strand]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.strandName.trim()) {
      newErrors.strandName = 'Strand name is required';
    } else if (formData.strandName.trim().length < 3) {
      newErrors.strandName = 'Strand name must be at least 3 characters';
    }

    if (!formData.strandDescription.trim()) {
      newErrors.strandDescription = 'Strand description is required';
    } else if (formData.strandDescription.trim().length < 10) {
      newErrors.strandDescription = 'Strand description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'create') {
        await onSubmit(formData as CreateStrandData);
      } else {
        await onSubmit(formData as UpdateStrandData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="bg-base-100 rounded-xl shadow-lg border border-base-300">
      <div className="p-6 border-b border-base-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
            <HiAcademicCap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-base-content">
              {mode === 'create' ? 'Add New Strand' : 'Edit Strand'}
            </h3>
            <p className="text-sm text-base-content/60">
              {mode === 'create' 
                ? 'Create a new academic strand for the school' 
                : 'Update strand information'
              }
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Strand Name */}
        <div className="space-y-2">
          <label htmlFor="strandName" className="text-sm font-medium text-base-content">
            Strand Name *
          </label>
          <input
            id="strandName"
            name="strandName"
            type="text"
            value={formData.strandName}
            onChange={handleInputChange}
            placeholder="e.g., Science, Technology, Engineering, and Mathematics"
            className={`input input-bordered w-full ${
              errors.strandName ? 'input-error' : ''
            }`}
            disabled={loading}
          />
          {errors.strandName && (
            <p className="text-error text-xs">{errors.strandName}</p>
          )}
        </div>

        {/* Strand Description */}
        <div className="space-y-2">
          <label htmlFor="strandDescription" className="text-sm font-medium text-base-content">
            Strand Description *
          </label>
          <textarea
            id="strandDescription"
            name="strandDescription"
            value={formData.strandDescription}
            onChange={handleInputChange}
            placeholder="Describe the strand's focus, subjects, and career paths..."
            rows={4}
            className={`textarea textarea-bordered w-full ${
              errors.strandDescription ? 'textarea-error' : ''
            }`}
            disabled={loading}
          />
          {errors.strandDescription && (
            <p className="text-error text-xs">{errors.strandDescription}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex-1 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              <>
                <HiCheck className="w-4 h-4" />
                {mode === 'create' ? 'Create Strand' : 'Update Strand'}
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn btn-outline flex items-center gap-2"
          >
            <HiX className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default StrandForm; 