"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
    disabled?: boolean;
}

/**
 * BackButton Component
 * A reusable back button with consistent styling and behavior
 * Supports both circular and text button variants
 * Uses router.back() by default if no onClick is provided
 */
const BackButton: React.FC<BackButtonProps> = ({
    disabled = false,
}) => {
    const router = useRouter();


    return (
        <button
            onClick={router.back}
            className={`btn btn-primary btn-sm text-white rounded-none martian-mono text-xs font-medium`}
            disabled={disabled}
            title="Back"
            aria-label="Back"
        >
            <span className="ml-1">Back</span>
        </button>
    );
};

export default BackButton; 