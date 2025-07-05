import React from "react";
import { MdEmail, MdPerson, MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md";

interface FormInputProps {
    id: string;
    name: string;
    type: "text" | "email" | "password" | "date";
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    minLength?: number;
    className?: string;
    showPassword?: boolean;
    onTogglePassword?: () => void;
}

const FormInput: React.FC<FormInputProps> = ({
    id,
    name,
    type,
    value,
    onChange,
    placeholder,
    required = false,
    disabled = false,
    minLength,
    className = "",
    showPassword,
    onTogglePassword,
}) => {
    const getIcon = () => {
        switch (type) {
            case "email":
                return <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />;
            case "password":
                return <MdLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />;
            default:
                return <MdPerson className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-base" />;
        }
    };

    const getInputType = () => {
        if (type === "password" && showPassword !== undefined) {
            return showPassword ? "text" : "password";
        }
        return type;
    };

    return (
        <div className="relative">
            <input
                id={id}
                type={getInputType()}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`input input-xs text-xs input-bordered w-full pl-10 py-5 ${className}`}
                required={required}
                disabled={disabled}
                minLength={minLength}
            />
            {getIcon()}
            {type === "password" && onTogglePassword && (
                <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={onTogglePassword}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/60 hover:text-base-content p-1"
                    disabled={disabled}
                >
                    {showPassword ? (
                        <MdVisibilityOff className="text-base" />
                    ) : (
                        <MdVisibility className="text-base" />
                    )}
                </button>
            )}
        </div>
    );
};

export default FormInput; 