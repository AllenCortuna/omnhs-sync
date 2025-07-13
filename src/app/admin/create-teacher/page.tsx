"use client";
// React and Firebase imports
import React, { useState, useEffect } from "react";
import {
    collection,
    getDocs,
    query,
    addDoc,
    where,
} from "firebase/firestore";
import { db } from "../../../../firebase";

// Component imports
import {
    FormInput,
    FormSelect,
    CreateButton,
} from "../../../components/common";

// Toast imports
import { successToast, errorToast } from "../../../config/toast";

// Icon imports from react-icons
import { MdAdd } from "react-icons/md";

// Service imports
import { sectionService } from "../../../services/sectionService";
import { Section } from "../../../interface/info";

interface TeacherFormData {
    employeeId: string;
    firstName: string;
    lastName: string;
    middleName: string;
    contactNumber: string;
    address: string;
    designatedSectionId: string;
}

/**
 * @file CreateTeacher.tsx - Component for creating new teacher accounts
 * @module CreateTeacher
 *
 * @description
 * This component provides a form for creating new teacher accounts.
 * It handles:
 * 1. Collection of teacher information including personal details and credentials
 * 2. Client-side validation of form data
 * 3. Creation of teacher account in Firebase Authentication
 * 4. Storage of teacher profile data in Firestore
 * 5. Authentication flow:
 *    - Creates new teacher user account
 *    - Immediately signs out the new account
 * 6. Success/error message display
 *
 * @requires react
 * @requires firebase/auth
 * @requires firebase/firestore
 * @requires react-icons/md
 * @requires ../../../firebase
 */

/**
 * CreateTeacher Component
 * Renders a form for creating new teacher accounts with personal information and credentials
 * @returns {JSX.Element} The rendered CreateTeacher component
 */
const CreateTeacher: React.FC = () => {
    // Form data state containing teacher details and credentials
    const [formData, setFormData] = useState<TeacherFormData>({
        employeeId: "",
        firstName: "",
        lastName: "",
        middleName: "",
        contactNumber: "",
        address: "",
        designatedSectionId: "",
    });

    // Loading state for async operations
    const [loading, setLoading] = useState<boolean>(false);

    // State for sections
    const [sections, setSections] = useState<Section[]>([]);

    useEffect(() => {
        const fetchSections = async () => {
            try {
                const fetchedSections = await sectionService.getAllSections();
                setSections(fetchedSections);
            } catch (error) {
                console.error("Error fetching sections:", error);
                errorToast("Failed to fetch sections. Please try again.");
            }
        };

        fetchSections();
    }, []);

    /**
     * Updates form data state when input fields change
     * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - Input change event
     */
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ): void => {
        const { name, value } = e.target;
        console.log(`Field ${name} changed to:`, value);
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    /**
     * Validates form data before submission
     * Checks:
     * - Required fields
     * - Employee ID format
     * - Email format
     * @returns {Promise<boolean>} True if validation passes, false otherwise
     */
    const validateForm = async (): Promise<boolean> => {
        // Check if employee ID contains spaces
        if (formData.employeeId.includes(" ")) {
            errorToast("Employee ID must not contain spaces");
            return false;
        }

        // Validate email format
        if (
            !formData.employeeId ||
            !formData.firstName ||
            !formData.lastName ||
            !formData.contactNumber ||
            !formData.address
        ) {
            errorToast("All fields are required");
            return false;
        }

        // All checks passed
        return true;
    };

    /**
     * Handles form submission to create new teacher account
     * Steps:
     * 1. Validates form data
     * 2. Checks for existing employee ID
     * 3. Creates Firebase auth account
     * 4. Stores teacher profile in Firestore
     * 5. Signs out new account
     * @param {React.FormEvent<HTMLFormElement>} e - Form submission event
     */
    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ): Promise<void> => {
        e.preventDefault();
        setLoading(true);

        // Check if employee ID is already in the database
        const employeeIdRef = query(
            collection(db, "teachers"),
            where("employeeId", "==", formData.employeeId)
        );
        const employeeIdDoc = await getDocs(employeeIdRef);
        console.log("employeeIdDoc ===>", employeeIdDoc.docs.length > 0);
        if (employeeIdDoc.docs.length > 0) {
            errorToast("Employee ID already exists");
            setLoading(false);
            return;
        }

        // Validate form data
        if (!(await validateForm())) {
            setLoading(false);
            return;
        }

        try {
            // Store teacher profile in Firestore
            await addDoc(collection(db, "teachers"), {
                employeeId: formData.employeeId.toUpperCase(),
                firstName: formData.firstName,
                lastName: formData.lastName,
                middleName: formData.middleName || "",
                contactNumber: formData.contactNumber,
                address: formData.address,
                designatedSectionId: formData.designatedSectionId || "",
                createdAt: new Date().toISOString(),
                lastLoginAt: "",
                profileRef: "",
            });

            successToast("Teacher account created successfully!");

            // Reset form
            setFormData({
                employeeId: "",
                firstName: "",
                lastName: "",
                middleName: "",
                contactNumber: "",
                address: "",
                designatedSectionId: "",
            });
        } catch (error) {
            console.error("Error creating teacher account:", error);
            errorToast("Failed to create teacher account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // JSX Rendering
    return (
        <div className="overflow-scroll font-medium flex items-center justify-center text-zinc-700">
            <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
                <div className="card-body border">
                    {/* Card Header: Icon and Title */}
                    <div className="flex flex-row gap-5 mx-auto items-center mb-6">
                        <div className="flex items-center justify-center">
                            <div className="avatar placeholder">
                                <div className="bg-accent text-accent-content rounded-full w-10 h-10 flex items-center justify-center">
                                    <MdAdd className="text-xl" />
                                </div>
                            </div>
                        </div>
                        <h2 className="card-title justify-center text-lg font-bold">
                            Create New Teacher Account
                        </h2>
                    </div>
                    {/* Account Creation Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Personal Information Section - 2 Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Employee ID Input Field */}
                            <div className="form-control">
                                <label
                                    className="label"
                                    htmlFor="employeeId-input"
                                >
                                    <span className="text-xs text-zinc-700">
                                        Employee ID
                                    </span>
                                </label>
                                <FormInput
                                    id="employeeId-input"
                                    name="employeeId"
                                    type="text"
                                    value={formData.employeeId}
                                    onChange={handleChange}
                                    placeholder="Enter employee ID"
                                    className="uppercase"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            {/* First Name Input Field */}
                            <div className="form-control">
                                <label
                                    className="label"
                                    htmlFor="firstName-input"
                                >
                                    <span className="text-xs text-zinc-700">
                                        First Name
                                    </span>
                                </label>
                                <FormInput
                                    id="firstName-input"
                                    name="firstName"
                                    type="text"
                                    value={formData.firstName || ""}
                                    onChange={handleChange}
                                    placeholder="Enter first name"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            {/* Last Name Input Field */}
                            <div className="form-control">
                                <label
                                    className="label"
                                    htmlFor="lastName-input"
                                >
                                    <span className="text-xs text-zinc-700">
                                        Last Name
                                    </span>
                                </label>
                                <FormInput
                                    id="lastName-input"
                                    name="lastName"
                                    type="text"
                                    value={formData.lastName || ""}
                                    onChange={handleChange}
                                    placeholder="Enter last name"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            {/* Middle Name Input Field */}
                            <div className="form-control">
                                <label
                                    className="label"
                                    htmlFor="middleName-input"
                                >
                                    <span className="text-xs text-zinc-700">
                                        Middle Name
                                    </span>
                                </label>
                                <FormInput
                                    id="middleName-input"
                                    name="middleName"
                                    type="text"
                                    value={formData.middleName || ""}
                                    onChange={handleChange}
                                    placeholder="Enter middle name"
                                    disabled={loading}
                                />
                            </div>

                            {/* Contact Number Input Field */}
                            <div className="form-control">
                                <label
                                    className="label"
                                    htmlFor="contactNumber-input"
                                >
                                    <span className="text-xs text-zinc-700">
                                        Contact Number
                                    </span>
                                </label>
                                <FormInput
                                    id="contactNumber-input"
                                    name="contactNumber"
                                    type="text"
                                    value={formData.contactNumber || ""}
                                    onChange={handleChange}
                                    placeholder="Enter contact number"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Address Input Field - Full Width */}
                        <div className="form-control">
                            <label className="label" htmlFor="address-input">
                                <span className="text-xs text-zinc-700">
                                    Address
                                </span>
                            </label>
                            <FormInput
                                id="address-input"
                                name="address"
                                type="text"
                                value={formData.address || ""}
                                onChange={handleChange}
                                placeholder="Enter complete address"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Section Selection Field */}
                        <div className="form-control">
                            <label className="label" htmlFor="section-select">
                                <span className="text-xs text-zinc-700">
                                    Designated Section (Optional)
                                </span>
                            </label>
                            <FormSelect
                                id="section-select"
                                name="designatedSectionId"
                                value={formData.designatedSectionId}
                                onChange={handleChange}
                                options={[
                                    { value: "", label: "Select a section (optional)" },
                                    ...sections.map((section) => ({
                                        value: section.id,
                                        label: section.sectionName
                                    }))
                                ]}
                                placeholder="Select a section (optional)"
                                disabled={loading}
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="form-control mt-6">
                            <CreateButton loading={loading} />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateTeacher; 