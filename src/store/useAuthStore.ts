import { create } from 'zustand';
import { auth, db } from '../../firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface Staff {
  uid: string;
  email: string;
  name: string;
  office: string;
  role: string;
  officeFullName?: string;
  officeAddress?: string;
  officeContactNumber?: string;
  preparedBy?: string;
  preparedByPosition?: string;
  notedBy?: string;
  notedByPosition?: string;
}

interface AuthState {
  user: FirebaseUser | null;
  staffData: Staff | null;
  isLoggedIn: boolean;
  userOffice: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  updateStaffData: (data: Partial<Staff>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  staffData: null,
  isLoggedIn: false,
  userOffice: null,
  loading: true,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch staff data from Firestore
      const staffDoc = await getDoc(doc(db, 'staff', userCredential.user.uid));
      if (!staffDoc.exists()) {
        throw new Error('Staff data not found');
      }

      const staffData = staffDoc.data() as Staff;
      set({ 
        user: userCredential.user,
        staffData,
        isLoggedIn: true,
        userOffice: staffData.office,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred during login',
        loading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      set({ 
        user: null, 
        staffData: null, 
        isLoggedIn: false, 
        userOffice: null,
        error: null 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred during logout' 
      });
      throw error;
    }
  },

  initialize: async () => {
    return new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            // Fetch staff data from Firestore
            const staffDoc = await getDoc(doc(db, 'staff', user.uid));
            if (staffDoc.exists()) {
              const staffData = staffDoc.data() as Staff;
              set({ 
                user,
                staffData,
                isLoggedIn: true,
                userOffice: staffData.office,
                loading: false 
              });
            } else {
              set({ 
                user: null,
                staffData: null,
                isLoggedIn: false,
                userOffice: null,
                loading: false,
                error: 'Staff data not found' 
              });
            }
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'An error occurred while fetching staff data',
              loading: false 
            });
          }
        } else {
          set({ 
            user: null,
            staffData: null,
            isLoggedIn: false,
            userOffice: null,
            loading: false 
          });
        }
        resolve();
      });

      // Cleanup subscription on unmount
      return () => unsubscribe();
    });
  },

  updateStaffData: (data: Partial<Staff>) => {
    set((state) => ({
      staffData: { ...state.staffData, ...data } as Staff
    }));
  }
})); 