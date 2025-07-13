import React from "react";

interface ButtonXsProps {
    children: React.ReactNode;
    onClick: () => void;
    className?: string;
    variant?: "primary" | "secondary" | "error";
}

export const ButtonXs: React.FC<ButtonXsProps> = ({
    children,
    onClick,
    className = "",
    variant = "primary"
}) => {
    const variantClass = {
        primary: "btn-primary",
        secondary: "btn-secondary", 
        error: "btn-error"
    };

    return (
        <button
            className={`btn btn-xs rounded-none ${variantClass[variant]} ${className}`}
            onClick={onClick}
        >
            {children}
        </button>
    );
};
