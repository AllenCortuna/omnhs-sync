import React, { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { HiX, HiCheck, HiTrash } from "react-icons/hi";
import { db } from "../../../firebase";
import { useUserDataStore } from "@/store/userDataStore";

export interface StudentNotificationProps {
  open: boolean;
  onClose: () => void;
}

interface Notification {
  id: string;
  title: string;
  description?: string;
  createdAt: Timestamp;
  read: boolean;
}

export function StudentNotification({ open, onClose }: StudentNotificationProps) {
  const studentId = useUserDataStore(state => state.studentData?.studentId || "");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !studentId) return;
    setLoading(true);
    setError(null);
    async function fetchNotifications() {
      try {
        const q = query(
          collection(db, "notifications"),
          where("studentId", "==", studentId),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[]);
      } catch (err: unknown) {
        console.error(err);
        setError("Failed to load notifications.");
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, [studentId, open]);

  async function markAsRead(id: string) {
    setActionLoading(id);
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
      setNotifications(n => n.map(notif => notif.id === id ? { ...notif, read: true } : notif));
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteNotif(id: string) {
    setActionLoading(id);
    try {
      await deleteDoc(doc(db, "notifications", id));
      setNotifications(n => n.filter(notif => notif.id !== id));
    } finally {
      setActionLoading(null);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start pt-20 justify-end bg-black/20">
      <div className="bg-zinc-50 rounded-lg shadow-lg w-full max-w-sm mt-6 mr-6 p-4 relative animate-fade-in">
        <button
          className="absolute top-2 right-2 btn btn-xs btn-circle btn-ghost"
          onClick={onClose}
          aria-label="Close"
        >
          <HiX className="w-5 h-5" />
        </button>
        <h3 className="font-bold text-lg mb-3 text-primary">Notifications</h3>
        {loading ? (
          <div className="text-center text-zinc-400 py-8">Loading...</div>
        ) : error ? (
          <div className="text-error text-center py-8">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-zinc-400 py-8">No notifications.</div>
        ) : (
          <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {notifications.map(notif => (
              <li key={notif.id} className={`rounded p-3 border ${notif.read ? 'bg-white border-zinc-100' : 'bg-primary/10 border-primary/30'} flex flex-col gap-1 relative`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 ml-1">{notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString() : ''}</span>
                </div>
                <div className="text-sm text-zinc-700">
                  {notif.title === 'Enrollment Approved' ? 'Your enrollment was approved.' : 'Your enrollment was rejected.'}
                  {notif.description && <span> Reason: <span className="italic">{notif.description}</span></span>}
                </div>
                <div className="flex gap-2 mt-2 justify-end">
                  {!notif.read && (
                    <button
                      className="btn btn-xs btn-success text-white"
                      onClick={() => markAsRead(notif.id)}
                      disabled={actionLoading === notif.id}
                    >
                      <HiCheck className="w-4 h-4" /> Mark as read
                    </button>
                  )}
                  <button
                    className="btn btn-xs btn-ghost text-error"
                    onClick={() => deleteNotif(notif.id)}
                    disabled={actionLoading === notif.id}
                  >
                    <HiTrash className="w-4 h-4" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 