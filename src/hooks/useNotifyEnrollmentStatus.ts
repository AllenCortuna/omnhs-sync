import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

export interface NotifyEnrollmentStatusParams {
  studentId: string;
  title: string;
  description?: string;
}

export function useNotifyEnrollmentStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function notifyEnrollmentStatus({ studentId, title, description }: NotifyEnrollmentStatusParams) {
    setLoading(true);
    setError(null);
    try {
      await addDoc(collection(db, "notifications"), {
        studentId,
        title,
        description: description || null,
        createdAt: serverTimestamp(),
        read: false
      });
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return { notifyEnrollmentStatus, loading, error };
} 