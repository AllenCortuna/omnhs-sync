"use client"
import React, { useState, useEffect } from 'react';
import { HiAcademicCap, HiPencil, HiPlus } from 'react-icons/hi';
import { Strand, Section } from '../../interface/info';
import { sectionService, CreateSectionData, UpdateSectionData } from '../../services/sectionService';
import { logService } from '../../services/logService';
import SectionForm from './SectionForm';
import { useCurrentAdmin } from '@/hooks';

interface StrandListProps {
  strands: Strand[];
  onEditStrand: (strand: Strand) => void;
}

const StrandList: React.FC<StrandListProps> = ({
  strands,
  onEditStrand
}) => {
  const { admin } = useCurrentAdmin();
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
      await logService.logSectionCreated(data.sectionName, admin?.name || 'Admin', admin?.name || 'Admin');
      
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
      await logService.logSectionUpdated(data.sectionName || editingSection.sectionName, admin?.name || 'Admin', 'Admin', admin?.name || 'Admin');
      
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

      {/* Strands Table */}
      <div className="overflow-x-auto bg-base-100 border border-base-200">
        <table className="table w-full">
          <thead className="bg-base-200">
            <tr>
              <th className="text-primary font-semibold">Strand Name</th>
              <th className="text-primary font-semibold hidden md:table-cell">Description</th>
              <th className="text-primary font-semibold">Sections & Management</th>
              <th className="text-primary font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {strands.map((strand) => (
              <tr key={strand.id} className="hover:bg-base-200">
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                      <HiAcademicCap className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-primary">
                        {strand.strandName}
                      </div>
                      <div className="text-[10px] text-base-content/60">
                        {strand.id}
                      </div>
                      {/* Mobile description tooltip */}
                      <div className="md:hidden mt-1">
                        <div className="tooltip tooltip-right" data-tip={strand.strandDescription}>
                          <p className="text-xs text-base-content/70 line-clamp-1 cursor-help">
                            {strand.strandDescription}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="hidden md:table-cell">
                  <div className="max-w-xs">
                    <p className="text-xs text-primary line-clamp-2">
                      {strand.strandDescription}
                    </p>
                  </div>
                </td>
                <td>
                  <div className="space-y-2">
                    {loadingSections.has(strand.id) ? (
                      <div className="flex items-center gap-2">
                        <span className="loading loading-spinner loading-xs text-secondary"></span>
                        <span className="text-xs text-base-content/60">Loading sections...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="badge badge-outline badge-sm">
                            {sections[strand.id]?.length || 0} sections
                          </span>
                          <button
                            onClick={() => handleEditSection({} as Section, strand.id)}
                            className="btn btn-ghost btn-xs text-primary hover:bg-primary/10"
                            title="Add new section"
                          >
                            <HiPlus className="w-3 h-3" />
                          </button>
                        </div>
                        
                        {/* Sections List */}
                        {sections[strand.id] && sections[strand.id].length > 0 ? (
                          <div className="space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
                            {sections[strand.id].map((section) => (
                              <div
                                key={section.id}
                                className="flex items-center justify-between bg-base-200 rounded-lg px-2 py-1 text-xs hover:bg-base-300 transition-colors"
                              >
                                <span className="text-base-content/80 truncate flex-1 text-primary text-xs">
                                  {section.sectionName}
                                </span>
                                <button
                                  onClick={() => handleEditSection(section, strand.id)}
                                  className="btn btn-ghost btn-xs text-primary hover:bg-primary/10 ml-2"
                                  title="Edit section"
                                >
                                  <HiPencil className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {sections[strand.id].length > 4 && (
                              <div className="text-xs text-base-content/50 text-center py-1">
                                Scroll for more...
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-base-content/60 italic py-2">
                            No sections yet
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEditStrand(strand)}
                      className="btn btn-ghost btn-xs text-primary hover:bg-primary/10"
                      title="Edit strand"
                    >
                      <HiPencil className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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