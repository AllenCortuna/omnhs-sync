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
            console.log(`Searching in collection: ${collectionName}`);
            console.log(`Searching for email: ${user.email}`);

            const collectionRef = collection(db, collectionName);
            const q = query(
              collectionRef,
              where("email", "==", user.email?.toLowerCase() || ''), // Normalize email
              limit(1)
            );
            const querySnapshot = await getDocs(q);

            console.log(`Found ${querySnapshot.size} documents`);

            if (!querySnapshot.empty) {
              const doc = querySnapshot.docs[0];
              const data = doc.data();
              
              console.log('Found user data:', data);
              console.log('Document ID:', doc.id);

              // Type the data based on collection and include document ID
              switch (collectionName) {
                case 'admin':
                  foundUserData = { ...data, id: doc.id } as unknown as Admin;
                  foundUserType = 'admin';
                  break;
                case 'teachers':
                  foundUserData = { ...data, id: doc.id } as unknown as Teacher;
                  foundUserType = 'teacher';
                  break;
                case 'students':
                  foundUserData = { ...data, id: doc.id } as unknown as Student;
                  foundUserType = 'student';
                  break;
              }
              
              // Found user, break out of loop
              break;
            }
          } catch (collectionError) {
            console.error(`Error querying ${collectionName} collection:`, collectionError);
            // Log more details about the error
            if (collectionError instanceof Error) {
              console.error('Error name:', collectionError.name);
              console.error('Error message:', collectionError.message);
              console.error('Error stack:', collectionError.stack);
            }
            // Continue to next collection
          }
        }

        if (foundUserData && foundUserType) {
          console.log('Setting user data:', { type: foundUserType, data: foundUserData });
          // Save to global store
          setGlobalUserData(foundUserData, foundUserType);
          setUserData(foundUserData);
          setUserType(foundUserType);
        } else {
          // User not found in any collection
          console.warn('No user data found in any collection');
          setError('User data not found');
          setUserData(null);
          setUserType(null);
          clearUserData();
        }
      } catch (error) {
        console.error('Error in useSaveUserData:', error);
        if (error instanceof Error) {
          setError(`Failed to load user data: ${error.message}`);
        } else {
          setError('Failed to load user data');
        }
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