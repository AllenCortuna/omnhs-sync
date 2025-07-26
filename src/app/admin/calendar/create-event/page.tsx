"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/common';
import { db } from '../../../../../firebase';
import { addDoc, collection } from 'firebase/firestore';
import { successToast, errorToast } from '@/config/toast';

interface FormState {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
}

const CreateEventPage = () => {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "events"), {
        title: form.title,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
        createdAt: new Date().toISOString(),
      });
      successToast("Event created successfully!");
      router.push("/admin/calendar");
    } catch (error) {
      console.error(error);
      errorToast("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen text-zinc-700">
      <div className="max-w-xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <BackButton onClick={() => router.back()} variant="outline" size="sm" />
          <div>
            <h1 className="text-2xl font-bold">Create Calendar Event</h1>
            <p className="text-sm text-base-content/60">Add a new event to the school calendar</p>
          </div>
        </div>
        <form className="card bg-base-100 shadow-xl p-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="label">
              <span className="label-text font-semibold">Title</span>
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
              <span className="label-text font-semibold">Description</span>
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
                <span className="label-text font-semibold">Start Date</span>
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
                <span className="label-text font-semibold">End Date</span>
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
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEventPage; 