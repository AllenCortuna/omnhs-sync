"use client"
import React, { useState, useEffect } from 'react';
import { HiAcademicCap, HiPencil, HiPlus } from 'react-icons/hi';
import { Strand, Section } from '../../interface/info';
import { sectionService, CreateSectionData, UpdateSectionData } from '../../services/sectionService';
import { logService } from '../../services/logService';
import SectionList from './SectionList';
import SectionForm from './SectionForm';

interface StrandListProps {
  strands: Strand[];
  onEditStrand: (strand: Strand) => void;
}

const StrandList: React.FC<StrandListProps> = ({
  strands,
  onEditStrand
}) => {
  const [sections, setSections] = useState<{ [strandId: string]: Section[] }>({});
  const [loadingSections, setLoadingSections] = useState<Set<string>>(new Set());
  const [showSectionForm, setShowSectionForm] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Load sections for all strands on component mount
  useEffect(() => {
    strands.forEach(strand => {
      loadSections(strand.id);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strands]);

  const loadSections = async (strandId: string, forceRefresh = false) => {
    if (sections[strandId] && !forceRefresh) return; // Already loaded, unless forcing refresh
    
    try {
      setLoadingSections(prev => new Set(prev).add(strandId));
      const fetchedSections = await sectionService.getSectionsByStrandId(strandId);
      setSections(prev => ({ ...prev, [strandId]: fetchedSections }));
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setLoadingSections(prev => {
        const newSet = new Set(prev);
        newSet.delete(strandId);
        return newSet;
      });
    }
  };

  const handleCreateSection = async (data: CreateSectionData) => {
    try {
      setFormLoading(true);
      await sectionService.createSection(data);
      
      // Log the action
      await logService.logSectionCreated(data.sectionName, 'Admin');
      
      setShowSectionForm(null);
      setEditingSection(null);
      // Reload sections for this strand with force refresh
      await loadSections(data.strandId, true);
    } catch (error) {
      console.error('Error creating section:', error);
      // Re-throw the error so the form can handle it
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateSection = async (data: UpdateSectionData) => {
    if (!editingSection?.id) return;
    
    try {
      setFormLoading(true);
      await sectionService.updateSection(editingSection.id, data);
      
      // Log the action
      await logService.logSectionUpdated(data.sectionName || editingSection.sectionName, 'Admin');
      
      setShowSectionForm(null);
      setEditingSection(null);
      // Reload sections for this strand with force refresh
      await loadSections(editingSection.strandId, true);
    } catch (error) {
      console.error('Error updating section:', error);
      // Re-throw the error so the form can handle it
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSection = (section: Section, strandId: string) => {
    if (section.id) {
      setEditingSection(section);
    } else {
      setEditingSection(null);
    }
    setShowSectionForm(strandId);
  };

  const handleCancelSectionForm = () => {
    setShowSectionForm(null);
    setEditingSection(null);
  };

  if (strands.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <HiAcademicCap className="w-8 h-8 text-base-content/40" />
        </div>
        <h3 className="text-lg font-medium text-base-content mb-2">No Strands Found</h3>
        <p className="text-base-content/60 mb-6">
          Get started by creating your first academic strand
        </p>
        <button
          onClick={() => onEditStrand({} as Strand)}
          className="btn btn-primary btn-sm"
        >
          <HiPlus className="w-4 h-4" />
          Add First Strand
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold martian-mono text-primary">
          Academic Strands ({strands.length})
        </h3>
        <button
          onClick={() => onEditStrand({} as Strand)}
          className="btn btn-primary btn-sm"
        >
          <HiPlus className="w-4 h-4" />
          Add Strand
        </button>
      </div>

      {/* Strand Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {strands.map((strand) => (
          <div
            key={strand.id}
            className="bg-base-100 rounded-xl border border-base-300 p-6 hover:shadow-md transition-shadow"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                  <HiAcademicCap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold martian-mono text-primary">
                    {strand.strandName}
                  </h4>
                  <p className="text-base-content/60 font-normal text-xs italic">
                    ID: {strand.id}
                  </p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-1">
                <button
                  onClick={() => onEditStrand(strand)}
                  className="btn btn-ghost btn-xs text-primary hover:bg-primary/10"
                  title="Edit strand"
                >
                  <HiPencil className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Description */}
            <p className="text-base-content/70 line-clamp-3 mb-4 font-normal text-xs italic">
              {strand.strandDescription}
            </p>

            {/* Sections Section */}
            <div className="border-t border-base-200 pt-4">
              <div className="space-y-3">
                {loadingSections.has(strand.id) ? (
                  <div className="flex items-center justify-center py-4">
                    <span className="loading loading-spinner loading-sm text-secondary"></span>
                    <span className="ml-2 text-base-content/60 font-normal text-xs italic">Loading sections...</span>
                  </div>
                ) : (
                  <SectionList
                    sections={sections[strand.id] || []}
                    onEditSection={(section) => handleEditSection(section, strand.id)}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section Form Modal */}
      {showSectionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-base-100 rounded-xl shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <SectionForm
              section={editingSection || undefined}
              strandId={showSectionForm}
              strandName={strands.find(strand => strand.id === showSectionForm)?.strandName || ''}
              existingSections={sections[showSectionForm] || []}
              onSubmit={async (data) => {
                if (editingSection?.id) {
                  await handleUpdateSection(data as UpdateSectionData);
                } else {
                  await handleCreateSection(data as CreateSectionData);
                }
              }}
              onCancel={handleCancelSectionForm}
              loading={formLoading}
              mode={editingSection?.id ? 'edit' : 'create'}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StrandList; 