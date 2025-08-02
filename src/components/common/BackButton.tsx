"use client";

import React from "react";
import { MdArrowBack } from "react-icons/md";
import { useRouter } from "next/navigation";

interface BackButtonProps {
    onClick?: () => void;
    label?: string;
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "xs" | "sm" | "md" | "lg";
    className?: string;
    disabled?: boolean;
    type?: "circle" | "text";
    showLabel?: boolean;
}

/**
 * BackButton Component
 * A reusable back button with consistent styling and behavior
 * Supports both circular and text button variants
 * Uses router.back() by default if no onClick is provided
 */
const BackButton: React.FC<BackButtonProps> = ({
    onClick,
    label = "Back",
    variant = "outline",
    size = "sm",
    className = "",
    disabled = false,
    type = "circle",
    showLabel = false,
}) => {
    const router = useRouter();

    const getButtonClasses = () => {
        const baseClasses = type === "circle" ? "btn btn-outline w-fit border-2" : "btn";
        const variantClasses = {
            primary: "btn-primary",
            secondary: "btn-secondary",
            outline: "btn-outline",
            ghost: "btn-ghost",
        };
        const sizeClasses = {
            xs: "btn-xs",
            sm: "btn-sm",
            md: "btn-md",
            lg: "btn-lg",
        };

        return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();
    };

    function handleClick() {
        if (onClick) onClick();
        else router.back();
    }

    return (
        <button
            onClick={handleClick}
            className={getButtonClasses()}
            disabled={disabled}
            title={label}
            aria-label={label}
        >
            <MdArrowBack className="text-sm" />
            {type === "text" && showLabel && (
                <span className="ml-1">{label}</span>
            )}
        </button>
    );
};

export default BackButton; 