"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from '../../../../../firebase';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { BackButton } from '@/components/common';
import { successToast, errorToast } from '@/config/toast';
import { CalendarEvent } from '@/interface/calendar';

interface FormState {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  recipient: string;
}

const EditEventPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [form, setForm] = useState<FormState>({
    recipient: '',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      if (!id) return;
      setIsLoading(true);
      try {
        const eventRef = doc(db, "events", id);
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
          const data = eventSnap.data() as CalendarEvent;
          setForm({
            recipient: data.recipient,
            title: data.title,
            description: data.description || '',
            startDate: data.startDate,
            endDate: data.endDate,
          });
        } else {
          errorToast("Event not found.");
          router.push("/admin/calendar");
        }
      } catch (error) {
        console.error(error);
        errorToast("Failed to fetch event.");
        router.push("/admin/calendar");
      } finally {
        setIsLoading(false);
      }
    }
    fetchEvent();
  }, [id, router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    try {
      const eventRef = doc(db, "events", id);
      await updateDoc(eventRef, {
        recipient: form.recipient,
        title: form.title,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      successToast("Event updated successfully!");
      router.push("/admin/calendar");
    } catch (error) {
      console.error(error);
      errorToast("Failed to update event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!id) return <div className="p-6">Invalid event ID</div>;

  return (
    <div className="min-h-screen bg-base-200 text-zinc-700">
      <div className="max-w-xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <BackButton onClick={() => router.back()} variant="outline" size="sm" />
          <div>
            <h1 className="text-2xl font-bold">Edit Calendar Event</h1>
            <p className="text-sm text-base-content/60">Update event details</p>
          </div>
        </div>
        {isLoading ? (
          <div className="text-center py-8">Loading event...</div>
        ) : (
          <form className="card bg-base-100 shadow-xl p-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="label">
                <span className="label-text font-semibold">Recipient</span>
              </label>
              <select name="recipient" id="recipient" className="select select-bordered w-full" value={form.recipient} onChange={handleChange} required disabled={isSubmitting}>
                <option value="all">All</option>
                <option value="students">Students</option>
                <option value="teachers">Teachers</option>
              </select>
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditEventPage;