"use client"
import React, { useState, useEffect } from 'react';
import { HiBookOpen, HiX, HiCheck } from 'react-icons/hi';
import { Subject } from '../../interface/info';
import { CreateSubjectData, UpdateSubjectData } from '../../services/subjectService';
import { Strand } from '../../interface/info';
import { strandService } from '../../services/strandService';

interface SubjectFormProps {
  subject?: Subject;
  onSubmit: (data: CreateSubjectData | UpdateSubjectData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  mode: 'create' | 'edit';
}

const SubjectForm: React.FC<SubjectFormProps> = ({
  subject,
  onSubmit,
  onCancel,
  loading,
  mode
}) => {
  const [formData, setFormData] = useState({
    subjectName: subject?.subjectName || '',
    subjectDescription: subject?.subjectDescription || '',
    strandId: subject?.strandId || []
  });
  const [strands, setStrands] = useState<Strand[]>([]);
  const [loadingStrands, setLoadingStrands] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadStrands();
  }, []);

  useEffect(() => {
    if (subject) {
      setFormData({
        subjectName: subject.subjectName,
        subjectDescription: subject.subjectDescription || '',
        strandId: Array.isArray(subject.strandId) ? subject.strandId : [subject.strandId].filter(Boolean)
      });
    } else {
      setFormData({
        subjectName: '',
        subjectDescription: '',
        strandId: []
      });
    }
  }, [subject]);

  const loadStrands = async () => {
    try {
      setLoadingStrands(true);
      const fetchedStrands = await strandService.getAllStrands();
      setStrands(fetchedStrands);
    } catch (error) {
      console.error('Error loading strands:', error);
    } finally {
      setLoadingStrands(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.subjectName.trim()) {
      newErrors.subjectName = 'Subject name is required';
    } else if (formData.subjectName.trim().length < 3) {
      newErrors.subjectName = 'Subject name must be at least 3 characters';
    }

    if (!formData.strandId || formData.strandId.length === 0) {
      newErrors.strandId = 'Please select at least one strand';
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
        await onSubmit(formData as CreateSubjectData);
      } else {
        await onSubmit(formData as UpdateSubjectData);
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

  const handleStrandToggle = (strandId: string) => {
    setFormData(prev => {
      const currentStrandIds = prev.strandId || [];
      const newStrandIds = currentStrandIds.includes(strandId)
        ? currentStrandIds.filter(id => id !== strandId)
        : [...currentStrandIds, strandId];
      
      return { ...prev, strandId: newStrandIds };
    });
    
    // Clear error when user selects a strand
    if (errors.strandId) {
      setErrors(prev => ({ ...prev, strandId: '' }));
    }
  };

  return (
    <div className="bg-base-100 rounded-xl shadow-lg border border-base-300">
      <div className="p-6 border-b border-base-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
            <HiBookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-base-content">
              {mode === 'create' ? 'Add New Subject' : 'Edit Subject'}
            </h3>
            <p className="text-sm text-base-content/60">
              {mode === 'create' 
                ? 'Create a new subject for a strand' 
                : 'Update subject information'
              }
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Strand Selection - Checkboxes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-base-content">
            Strands * (Select one or more)
          </label>
          <div className={`border rounded-lg p-4 ${
            errors.strandId ? 'border-error' : 'border-base-300'
          }`}>
            {loadingStrands ? (
              <div className="flex items-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                <span className="text-sm text-base-content/60">Loading strands...</span>
              </div>
            ) : strands.length === 0 ? (
              <p className="text-sm text-base-content/60">No strands available</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {strands.map((strand) => (
                  <label
                    key={strand.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.strandId.includes(strand.id)}
                      onChange={() => handleStrandToggle(strand.id)}
                      disabled={loading}
                      className="checkbox checkbox-primary checkbox-sm"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-base-content">
                        {strand.strandName}
                      </div>
                      {strand.strandDescription && (
                        <div className="text-xs text-base-content/60 line-clamp-1">
                          {strand.strandDescription}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          {errors.strandId && (
            <p className="text-error text-xs">{errors.strandId}</p>
          )}
          {formData.strandId.length > 0 && (
            <p className="text-xs text-base-content/60">
              {formData.strandId.length} strand{formData.strandId.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* Subject Name */}
        <div className="space-y-2">
          <label htmlFor="subjectName" className="text-sm font-medium text-base-content">
            Subject Name *
          </label>
          <input
            id="subjectName"
            name="subjectName"
            type="text"
            value={formData.subjectName}
            onChange={handleInputChange}
            placeholder="e.g., Mathematics, Science, English"
            className={`input input-bordered w-full ${
              errors.subjectName ? 'input-error' : ''
            }`}
            disabled={loading}
          />
          {errors.subjectName && (
            <p className="text-error text-xs">{errors.subjectName}</p>
          )}
        </div>

        {/* Subject Description */}
        <div className="space-y-2">
          <label htmlFor="subjectDescription" className="text-sm font-medium text-base-content">
            Subject Description *
          </label>
          <textarea
            id="subjectDescription"
            name="subjectDescription"
            value={formData.subjectDescription}
            onChange={handleInputChange}
            placeholder="Describe the subject's content, objectives, and learning outcomes..."
            rows={4}
            className={`textarea textarea-bordered w-full ${
              errors.subjectDescription ? 'textarea-error' : ''
            }`}
            disabled={loading}
          />
          {errors.subjectDescription && (
            <p className="text-error text-xs">{errors.subjectDescription}</p>
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
                {mode === 'create' ? 'Create Subject' : 'Update Subject'}
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

export default SubjectForm;
