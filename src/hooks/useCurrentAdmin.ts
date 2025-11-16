import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';

export interface CurrentAdminData {
  id: string;
  name: string;
  email: string;
  role: string;
  uid?: string;
  createdAt?: string;
  restricted?: boolean;
}

interface UseCurrentAdminReturn {
  admin: CurrentAdminData | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook to fetch the current signed-in admin data from Firestore
 * Listens to auth state changes and fetches admin data from the "admin" collection
 * 
 * @returns {UseCurrentAdminReturn} Object containing admin data, loading state, and error
 */
export function useCurrentAdmin(): UseCurrentAdminReturn {
  const [admin, setAdmin] = useState<CurrentAdminData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (!isMounted) return;

      if (!user) {
        setAdmin(null);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch admin data from Firestore using the user's uid as document ID
        const adminDocRef = doc(db, 'admin', user.uid);
        const adminDoc = await getDoc(adminDocRef);

        if (!isMounted) return;

        if (adminDoc.exists()) {
          const data = adminDoc.data();
          setAdmin({
            id: adminDoc.id,
            name: data.name || '',
            email: data.email || user.email || '',
            role: data.role || '',
            uid: data.uid || user.uid,
            createdAt: data.createdAt || '',
            restricted: data.restricted || false,
          });
        } else {
          setAdmin(null);
          setError(new Error('Admin document not found'));
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching admin data:', err);
        setError(err as Error);
        setAdmin(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return { admin, loading, error };
}

