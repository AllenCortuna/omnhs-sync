"use client"
import React from 'react';
import { HiBookOpen, HiPencil, HiPlus } from 'react-icons/hi';
import { Subject, Strand } from '../../interface/info';

interface SubjectListProps {
  subjects: Subject[];
  strands: Strand[];
  onEditSubject: (subject: Subject) => void;
}

const SubjectList: React.FC<SubjectListProps> = ({
  subjects,
  strands,
  onEditSubject
}) => {
  const getStrandNames = (strandIds: string[]): Strand[] => {
    if (!Array.isArray(strandIds)) {
      // Handle legacy data that might be a single string
      const strandId = typeof strandIds === 'string' ? strandIds : '';
      const strand = strands.find(s => s.id === strandId);
      return strand ? [strand] : [];
    }
    return strandIds
      .map(id => strands.find(s => s.id === id))
      .filter((strand): strand is Strand => strand !== undefined);
  };

  if (subjects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <HiBookOpen className="w-8 h-8 text-base-content/40" />
        </div>
        <h3 className="text-lg font-medium text-base-content mb-2">No Subjects Found</h3>
        <p className="text-base-content/60 mb-6">
          Get started by creating your first subject
        </p>
        <button
          onClick={() => onEditSubject({} as Subject)}
          className="btn btn-primary btn-sm"
        >
          <HiPlus className="w-4 h-4" />
          Add First Subject
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold martian-mono text-primary">
          Subjects ({subjects.length})
        </h3>
        <button
          onClick={() => onEditSubject({} as Subject)}
          className="btn btn-primary btn-sm"
        >
          <HiPlus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      {/* Subjects Table */}
      <div className="overflow-x-auto bg-base-100 border border-base-200">
        <table className="table w-full">
          <thead className="bg-base-200">
            <tr>
              <th className="text-primary font-semibold">Subject Name</th>
              <th className="text-primary font-semibold hidden md:table-cell">Description</th>
              <th className="text-primary font-semibold">Strands</th>
              <th className="text-primary font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={subject.id} className="hover:bg-base-200">
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                      <HiBookOpen className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-primary">
                        {subject.subjectName}
                      </div>
                      {/* <div className="text-[10px] text-base-content/60">
                        {subject.id}
                      </div> */}
                      {/* Mobile description tooltip */}
                      <div className="md:hidden mt-1">
                        <div className="tooltip tooltip-right" data-tip={subject.subjectDescription}>
                          <p className="text-xs text-base-content/70 line-clamp-1 cursor-help">
                            {subject.subjectDescription}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="hidden md:table-cell">
                  <div className="max-w-xs">
                    <p className="text-xs text-primary line-clamp-2">
                      {subject.subjectDescription}
                    </p>
                  </div>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {getStrandNames(subject.strandId).length > 0 ? (
                      getStrandNames(subject.strandId).map((strand) => (
                        <span
                          key={strand.id}
                          className="badge badge-outline badge-sm"
                        >
                          {strand.strandName}
                        </span>
                      ))
                    ) : (
                      <span className="badge badge-ghost badge-sm text-base-content/40">
                        No strands
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEditSubject(subject)}
                      className="btn btn-ghost btn-xs text-primary hover:bg-primary/10"
                      title="Edit subject"
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
    </div>
  );
};

export default SubjectList;
