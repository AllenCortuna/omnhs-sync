import { useEffect, useState } from "react";
import { collection, getCountFromServer, query, where } from "firebase/firestore";
import { db } from "../../firebase";

export function usePendingEnrollmentCount() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchCount() {
      setLoading(true);
      setError(null);
      try {
        const q = query(collection(db, "enrollment"), where("status", "==", "pending"));
        const snapshot = await getCountFromServer(q);
        if (isMounted) setCount(snapshot.data().count || 0);
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