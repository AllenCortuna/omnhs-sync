import React from "react";
import { MdAdd } from "react-icons/md";

interface CreateButtonProps {
    loading: boolean;
    disabled?: boolean;
    loadingText?: string;
    buttonText?: string;
    className?: string;
}

const CreateButton: React.FC<CreateButtonProps> = ({
    loading,
    disabled = false,
    loadingText = "Creating Account...",
    buttonText = "Create Account",
    className = "",
}) => {
    return (
        <button
            type="submit"
            disabled={loading || disabled}
            className={`btn btn-md text-xs text-white text-center btn-primary w-full flex items-center justify-center gap-2 py-5 ${
                loading || disabled ? "opacity-50 cursor-not-allowed" : ""
            } ${className}`}
        >
            {loading ? (
                <>
                    <span className="loading loading-spinner loading-xs"></span>
                    <span>{loadingText}</span>
                </>
            ) : (
                <>
                    <MdAdd className="text-base" />
                    <span>{buttonText}</span>
                </>
            )}
        </button>
    );
};

export default CreateButton; 