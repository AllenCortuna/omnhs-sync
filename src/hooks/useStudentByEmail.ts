import { useEffect, useState } from "react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { Student } from "@/interface/user";

interface UseStudentByEmailResult {
  student: Student | null;
  loading: boolean;
  error: string | null;
}

export function useStudentByEmail(email?: string): UseStudentByEmailResult {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      setStudent(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setStudent(null);
    const fetchStudent = async () => {
      try {
        const q = query(
          collection(db, "students"),
          where("email", "==", email),
          limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setStudent({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Student);
        } else {
          setStudent(null);
        }
      } catch {
        setError("Failed to fetch student data");
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [email]);

  return { student, loading, error };
} 