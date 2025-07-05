import React from "react";
import { MdPerson } from "react-icons/md";

interface FormSelectOption {
    value: string;
    label: string;
}

interface FormSelectProps {
    id: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: FormSelectOption[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
}

const FormSelect: React.FC<FormSelectProps> = ({
    id,
    name,
    value,
    onChange,
    options,
    placeholder = "Select an option",
    required = false,
    disabled = false,
    className = "",
}) => {
    return (
        <div className="relative">
            <select
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                className={`w-full pl-10 pr-3 py-3 text-xs border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
                required={required}
                disabled={disabled}
            >
                <option value="" className="text-gray-500">
                    {placeholder}
                </option>
                {options.map((option) => (
                    <option key={option.value} value={option.value} className="text-black">
                        {option.label}
                    </option>
                ))}
            </select>
            <MdPerson className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-base pointer-events-none" />
        </div>
    );
};

export default FormSelect; 