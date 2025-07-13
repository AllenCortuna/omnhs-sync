"use client";
import React, { useState, useEffect } from "react";
import { HiAcademicCap, HiX, HiCheck } from "react-icons/hi";
import { Section } from "../../interface/info";
import {
    CreateSectionData,
    UpdateSectionData,
} from "../../services/sectionService";

interface SectionFormProps {
    section?: Section;
    strandId: string;
    strandName: string;
    existingSections: Section[];
    onSubmit: (data: CreateSectionData | UpdateSectionData) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
    mode: "create" | "edit";
}

const SectionForm: React.FC<SectionFormProps> = ({
    section,
    strandId,
    strandName,
    existingSections,
    onSubmit,
    onCancel,
    loading,
    mode,
}) => {
    const [formData, setFormData] = useState({
        sectionName: section?.sectionName || "",
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (section) {
            setFormData({
                sectionName: section.sectionName,
            });
        }
    }, [section]);

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.sectionName.trim()) {
            newErrors.sectionName = "Section name is required";
        } else if (formData.sectionName.trim().length < 2) {
            newErrors.sectionName =
                "Section name must be at least 2 characters";
        } else {
            // Check for duplicate names (case-insensitive)
            const trimmedName = formData.sectionName.trim().toLowerCase();
            const isDuplicate = existingSections.some(existingSection => {
                // Skip the current section being edited
                if (mode === 'edit' && existingSection.id === section?.id) {
                    return false;
                }
                return existingSection.sectionName.toLowerCase() === trimmedName;
            });

            if (isDuplicate) {
                newErrors.sectionName = `A section with this name already exists in ${strandName}`;
            }
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
            if (mode === "create") {
                await onSubmit({ ...formData, strandId } as CreateSectionData);
            } else {
                await onSubmit(formData as UpdateSectionData);
            }
        } catch (error) {
            console.error("Form submission error:", error);
            // Handle database errors (like duplicate names)
            if (error instanceof Error) {
                if (error.message.includes('already exists')) {
                    setErrors(prev => ({ ...prev, sectionName: error.message }));
                } else {
                    // Set a general error
                    setErrors(prev => ({ ...prev, general: error.message }));
                }
            }
        }
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    return (
        <div className="bg-base-100 rounded-xl shadow-lg border border-base-300">
            <div className="p-6 border-b border-base-300">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center">
                        <HiAcademicCap className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-base-content">
                            {mode === "create"
                                ? `Add New Section for ${strandName}`
                                : "Edit Section"}
                        </h3>
                        <p className="text-sm text-base-content/60">
                            {mode === "create"
                                ? `Create a new section for ${strandName}`
                                : "Update section information"}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* General Error Display */}
                {errors.general && (
                    <div className="alert alert-error">
                        <HiAcademicCap className="w-4 h-4" />
                        <span className="text-xs">{errors.general}</span>
                    </div>
                )}

                {/* Section Name */}
                <div className="space-y-2">
                    <label
                        htmlFor="sectionName"
                        className="text-sm font-medium text-base-content"
                    >
                        Section Name *
                    </label>
                    <input
                        id="sectionName"
                        name="sectionName"
                        type="text"
                        value={formData.sectionName}
                        onChange={handleInputChange}
                        placeholder="e.g., Section A, Section B, STEM-A"
                        className={`input input-bordered w-full ${
                            errors.sectionName ? "input-error" : ""
                        }`}
                        disabled={loading}
                    />
                    {errors.sectionName && (
                        <p className="text-error text-xs">
                            {errors.sectionName}
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="btn btn-outline flex items-center gap-2"
                    >
                        <HiX className="w-4 h-4" />
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-secondary flex-1 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                {mode === "create"
                                    ? "Creating..."
                                    : "Updating..."}
                            </>
                        ) : (
                            <>
                                <HiCheck className="w-4 h-4" />
                                {mode === "create"
                                    ? "Create Section"
                                    : "Update Section"}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SectionForm;
