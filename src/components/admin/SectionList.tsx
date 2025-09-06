"use client"
import React from 'react';
import { HiAcademicCap, HiPencil, HiPlus } from 'react-icons/hi';
import { Section } from '../../interface/info';

interface SectionListProps {
  sections: Section[];
  onEditSection: (section: Section) => void;
}

const SectionList: React.FC<SectionListProps> = ({
  sections,
  onEditSection
}) => {
  if (sections.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <HiAcademicCap className="w-6 h-6 text-secondary" />
        </div>
        <h4 className="text-sm font-medium martian-mono text-primary mb-1">No Sections Found</h4>
        <p className="text-xs text-base-content/60 font-normal italic mb-4">
          Create sections for this strand
        </p>
        <button
          onClick={() => onEditSection({} as Section)}
          className="btn btn-secondary btn-xs"
        >
          <HiPlus className="w-3 h-3" />
          Add First Section
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold martian-mono text-primary">
          Sections ({sections.length})
        </h4>
        <button
          onClick={() => onEditSection({} as Section)}
          className="btn btn-secondary btn-xs"
        >
          <HiPlus className="w-3 h-3" />
          Add Section
        </button>
      </div>

      {/* Section Cards */}
      <div className="grid gap-3">
        {sections.map((section) => (
          <div
            key={section.id}
            className="bg-base-50 rounded-lg border border-base-200 p-4 hover:shadow-sm transition-shadow"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div>
                  <h5 className="font-bold text-sm martian-mono text-primary">
                    {section.sectionName}
                  </h5>
                  <p className="text-base-content/60 font-normal text-xs">
                    {section.id}
                  </p>
                </div>
              </div>
              
              {/* Action Button */}
              <button
                onClick={() => onEditSection(section)}
                className="btn btn-ghost btn-xs text-secondary hover:bg-secondary/10"
                title="Edit section"
              >
                <HiPencil className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectionList; 