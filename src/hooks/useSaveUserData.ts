import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useUserDataStore, UserType } from '@/store/userDataStore';
import { Admin, Teacher, Student } from '@/interface/user';

interface UseSaveUserDataReturn {
  isLoading: boolean;
  error: string | null;
  userType: UserType | null;
  userData: Admin | Teacher | Student | null;
}

interface UseSaveUserDataParams {
  role?: UserType;
}

/**
 * Custom hook for saving user data to global store
 * Fetches user data from Firestore based on Firebase Auth user
 * Can be used in RouteGuard components and other authentication flows
 * 
 * @param {UseSaveUserDataParams} params - Optional parameters
 * @param {UserType} params.role - Optional role to filter which collection to search
 * @returns {UseSaveUserDataReturn} Object containing loading state, error, user type, and user data
 */
export const useSaveUserData = (params?: UseSaveUserDataParams): UseSaveUserDataReturn => {
  const { role } = params || {};
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [userData, setUserData] = useState<Admin | Teacher | Student | null>(null);
  
  const { setUserData: setGlobalUserData, clearUserData } = useUserDataStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (!user) {
        // No user logged in
        setIsLoading(false);
        setError(null);
        setUserType(null);
        setUserData(null);
        clearUserData();
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Determine which collections to search based on role parameter
        let collectionsToSearch: readonly string[];
        if (role) {
          // If role is specified, only search that collection
          switch (role) {
            case 'admin':
              collectionsToSearch = ['admin'];
              break;
            case 'teacher':
              collectionsToSearch = ['teachers'];
              break;
            case 'student':
              collectionsToSearch = ['students'];
              break;
            default:
              collectionsToSearch = ['admin', 'teachers', 'students'];
          }
        } else {
          // If no role specified, search all collections
          collectionsToSearch = ['admin', 'teachers', 'students'];
        }

        let foundUserData: Admin | Teacher | Student | null = null;
        let foundUserType: UserType | null = null;

        for (const collectionName of collectionsToSearch) {
          try {
            const collectionRef = collection(db, collectionName);
            const q = query(
              collectionRef,
              where("email", "==", user.email),
              limit(1)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const data = querySnapshot.docs[0].data();
              
              // Type the data based on collection
              switch (collectionName) {
                case 'admin':
                  foundUserData = data as Admin;
                  foundUserType = 'admin';
                  break;
                case 'teachers':
                  foundUserData = data as Teacher;
                  foundUserType = 'teacher';
                  break;
                case 'students':
                  foundUserData = data as Student;
                  foundUserType = 'student';
                  break;
              }
              
              // Found user, break out of loop
              break;
            }
          } catch (collectionError) {
            console.error(`Error querying ${collectionName} collection:`, collectionError);
            // Continue to next collection
          }
        }

        if (foundUserData && foundUserType) {
          // Save to global store
          setGlobalUserData(foundUserData, foundUserType);
          setUserData(foundUserData);
          setUserType(foundUserType);
        } else {
          // User not found in any collection
          setError('User data not found');
          setUserData(null);
          setUserType(null);
          clearUserData();
        }
      } catch (error) {
        console.error('Error in useSaveUserData:', error);
        setError('Failed to load user data');
        setUserData(null);
        setUserType(null);
        clearUserData();
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setGlobalUserData, clearUserData, role]);

  return {
    isLoading,
    error,
    userType,
    userData,
  };
};

export default useSaveUserData; 