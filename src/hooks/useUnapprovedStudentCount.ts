import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import type { Student } from "@/interface/user";

export function useUnapprovedStudentCount() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchCount() {
      setLoading(true);
      setError(null);
      try {
        // Fetch all students and filter for unapproved ones
        // (approved is false or doesn't exist)
        const studentsRef = collection(db, "students");
        const q = query(studentsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        let unapprovedCount = 0;
        snapshot.forEach((doc) => {
          const student = doc.data() as Student;
          // Count students where approved is false or undefined
          if (student.approved === false || student.approved === undefined) {
            unapprovedCount++;
          }
        });
        
        if (isMounted) setCount(unapprovedCount);
      } catch (err) {
        if (isMounted) setError(err as Error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchCount();
    return () => { isMounted = false; };
  }, []);

  return { count, loading, error };
}
