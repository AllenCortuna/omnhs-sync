"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/common";
import { db } from "../../../../../firebase";
import { addDoc, collection } from "firebase/firestore";
import { successToast, errorToast } from "@/config/toast";
import { useSaveUserData } from "@/hooks";
import { Teacher } from "@/interface/user";
interface FormState {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    recipient: string;
}

const CreateEventPage = () => {
    const router = useRouter();
    const { userData, isLoading: userLoading } = useSaveUserData({
        role: "teacher",
    });
    const [form, setForm] = useState<FormState>({
        recipient: "",
        title: "",
        description: "",
        startDate: "",
        endDate: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    function handleChange(
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        if (!userData || userLoading) {
            errorToast("User data not available. Please try again.");
            return;
        }

        // Type guard to ensure userData is a Teacher
        if (!("employeeId" in userData)) {
            errorToast("Invalid user data. Please try again.");
            return;
        }

        const teacherData = userData as Teacher;
        
        setIsSubmitting(true);
        console.log("teacherData ===>", teacherData);
        try {
            await addDoc(collection(db, "events"), {
                recipient: "students",
                title: form.title,
                createdBy: "teacher",
                teacherId: teacherData.employeeId,
                fromTeacher: teacherData.firstName + " " + teacherData.lastName,
                description: form.description,
                startDate: form.startDate,
                endDate: form.endDate,
                createdAt: new Date().toISOString(),
            });
            successToast("Event created successfully!");
            router.push("/teachers/my-calendar");
        } catch (error) {
            console.error(error);
            errorToast("Failed to create event. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (userLoading) {
        return (
            <div className="min-h-screen text-zinc-600 flex items-center justify-center">
                <div className="text-center">
                    <div className="loading loading-spinner loading-lg text-primary"></div>
                    <p className="mt-4 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-zinc-700">
            <div className="max-w-xl mx-auto p-6">
                <div className="flex items-center gap-4 mb-6">
                    <BackButton
                    />
                    <div>
                        <h1 className="font-bold text-primary martian-mono">
                            Create Calendar Event
                        </h1>
                        <p className="text-xs text-zinc-500 italic">
                            Add a new event to the school calendar
                        </p>
                    </div>
                </div>
                <form
                    className="card bg-base-100 shadow-xl p-6 space-y-4"
                    onSubmit={handleSubmit}
                >
                    <div>
                        <label className="label">
                            <span className="text-xs font-semibold martian-mono text-primary">
                                Title
                            </span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            className="input input-bordered w-full"
                            value={form.title}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label className="label">
                            <span className="text-xs font-semibold martian-mono text-primary">
                                Description
                            </span>
                        </label>
                        <textarea
                            name="description"
                            className="textarea textarea-bordered w-full"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">
                                <span className="text-xs font-semibold martian-mono text-primary">
                                    Start Date
                                </span>
                            </label>
                            <input
                                type="date"
                                name="startDate"
                                className="input input-bordered w-full"
                                value={form.startDate}
                                onChange={handleChange}
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <label className="label">
                                <span className="text-xs font-semibold martian-mono text-primary">
                                    End Date
                                </span>
                            </label>
                            <input
                                type="date"
                                name="endDate"
                                className="input input-bordered w-full"
                                value={form.endDate}
                                onChange={handleChange}
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="btn btn-primary martian-mono text-xs text-white"
                            disabled={isSubmitting || userLoading || !userData}
                        >
                            {isSubmitting ? "Creating..." : "Create Event"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEventPage;
