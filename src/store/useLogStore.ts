import { create } from 'zustand';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  limit,
  startAfter,
  where,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase";

// Define the Log interface
interface Log {
  id: string;
  studentId: string;
  date: string;
  name: string;
  description: string;
  logsBy: string;
}

// Define the store state and actions
interface LogsStore {
  logs: Array<Log> | null;
  loadingLogs: boolean;
  totalLogs: number;
  hasMore: boolean;
  lastDoc: DocumentSnapshot | null;
  addLog: (data: Omit<Log, 'id'>) => Promise<void>;
  fetchLogsByAdmin: (searchTerm?: string, startDate?: string, endDate?: string, resetPagination?: boolean) => Promise<void>;
  fetchLogsByUser: (userId: string, searchTerm?: string, startDate?: string, endDate?: string, resetPagination?: boolean) => Promise<void>;
  deleteLog: (logId: string) => Promise<boolean>;
  resetPagination: () => void;
}

// Create the Zustand store
export const useLogsStore = create<LogsStore>((set, get) => ({
  logs: null,
  loadingLogs: false,
  totalLogs: 0,
  hasMore: true,
  lastDoc: null,

  // Function to add a new log
  addLog: async (data: Omit<Log, 'id'>) => {
    set({ loadingLogs: true });
    try {
      const submittedDoc = await addDoc(collection(db, "logs"), data);
      console.log("Log added successfully");
      
      const currentLogs = get().logs;
      const newLog = { id: submittedDoc.id, ...data };
      
      set({
        logs: currentLogs ? [...currentLogs, newLog] : [newLog],
      });
    } catch (error) {
      console.log("Error adding log:", error);
    } finally {
      set({ loadingLogs: false });
    }
  },

  // Function to fetch logs with pagination, search, and date filtering
  fetchLogsByAdmin: async (searchTerm = '', startDate = '', endDate = '', resetPagination = false) => {
    set({ loadingLogs: true });
    try {
      let logsQuery;
      
      // Build query based on filters
      if (searchTerm.trim() && startDate && endDate) {
        // Search + Date range filter
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999); // End of day
        
        logsQuery = query(
          collection(db, "logs"),
          where("date", ">=", startDateObj.toISOString()),
          where("date", "<=", endDateObj.toISOString()),
          orderBy("date", "desc"),
          limit(20)
        );
      } else if (searchTerm.trim()) {
        // Search only - we'll filter client-side for description
        logsQuery = query(
          collection(db, "logs"),
          orderBy("date", "desc"),
          limit(20)
        );
      } else if (startDate && endDate) {
        // Date range only
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999); // End of day
        
        logsQuery = query(
          collection(db, "logs"),
          where("date", ">=", startDateObj.toISOString()),
          where("date", "<=", endDateObj.toISOString()),
          orderBy("date", "desc"),
          limit(20)
        );
      } else {
        // No filters - just pagination
        logsQuery = query(
          collection(db, "logs"),
          orderBy("date", "desc"),
          limit(20)
        );
      }
      
      // Apply pagination if not resetting
      if (!resetPagination && get().lastDoc) {
        logsQuery = query(logsQuery, startAfter(get().lastDoc));
      }
      
      const logsDocSnap = await getDocs(logsQuery);
      
      // Map through logs and update state
      let newLogs = logsDocSnap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Log, "id">),
      }));
      
      // Apply search filter client-side if needed
      if (searchTerm.trim()) {
        newLogs = newLogs.filter(log => 
          log.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      const currentLogs = get().logs;
      let updatedLogs;
      
      if (resetPagination) {
        updatedLogs = newLogs;
      } else if (currentLogs) {
        // Merge logs and remove duplicates based on ID
        const existingIds = new Set(currentLogs.map(log => log.id));
        const uniqueNewLogs = newLogs.filter(log => !existingIds.has(log.id));
        updatedLogs = [...currentLogs, ...uniqueNewLogs];
      } else {
        updatedLogs = newLogs;
      }
      
      set({ 
        logs: updatedLogs,
        hasMore: logsDocSnap.docs.length === 20,
        lastDoc: logsDocSnap.docs.length > 0 ? logsDocSnap.docs[logsDocSnap.docs.length - 1] : null,
        totalLogs: updatedLogs.length
      });
    } catch (error) {
      console.log("Error fetching logs by admin:", error);
    } finally {
      set({ loadingLogs: false });
    }
  },

  // Function to fetch logs by specific user
  fetchLogsByUser: async (userId: string, searchTerm = '', startDate = '', endDate = '', resetPagination = false) => {
    set({ loadingLogs: true });
    try {
      let logsQuery;
      
      // Build query based on filters with user filter
      if (searchTerm.trim() && startDate && endDate) {
        // Search + Date range filter + User filter
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999); // End of day
        
        logsQuery = query(
          collection(db, "logs"),
          where("logsBy", "==", userId),
          where("date", ">=", startDateObj.toISOString()),
          where("date", "<=", endDateObj.toISOString()),
          orderBy("date", "desc"),
          limit(20)
        );
      } else if (searchTerm.trim()) {
        // Search + User filter - we'll filter client-side for description
        logsQuery = query(
          collection(db, "logs"),
          where("logsBy", "==", userId),
          orderBy("date", "desc"),
          limit(20)
        );
      } else if (startDate && endDate) {
        // Date range + User filter
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999); // End of day
        
        logsQuery = query(
          collection(db, "logs"),
          where("logsBy", "==", userId),
          where("date", ">=", startDateObj.toISOString()),
          where("date", "<=", endDateObj.toISOString()),
          orderBy("date", "desc"),
          limit(20)
        );
      } else {
        // User filter only
        logsQuery = query(
          collection(db, "logs"),
          where("logsBy", "==", userId),
          orderBy("date", "desc"),
          limit(20)
        );
      }
      
      // Apply pagination if not resetting
      if (!resetPagination && get().lastDoc) {
        logsQuery = query(logsQuery, startAfter(get().lastDoc));
      }
      
      const logsDocSnap = await getDocs(logsQuery);
      
      // Map through logs and update state
      let newLogs = logsDocSnap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Log, "id">),
      }));
      
      // Apply search filter client-side if needed
      if (searchTerm.trim()) {
        newLogs = newLogs.filter(log => 
          log.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      const currentLogs = get().logs;
      let updatedLogs;
      
      if (resetPagination) {
        updatedLogs = newLogs;
      } else if (currentLogs) {
        // Merge logs and remove duplicates based on ID
        const existingIds = new Set(currentLogs.map(log => log.id));
        const uniqueNewLogs = newLogs.filter(log => !existingIds.has(log.id));
        updatedLogs = [...currentLogs, ...uniqueNewLogs];
      } else {
        updatedLogs = newLogs;
      }
      
      set({ 
        logs: updatedLogs,
        hasMore: logsDocSnap.docs.length === 20,
        lastDoc: logsDocSnap.docs.length > 0 ? logsDocSnap.docs[logsDocSnap.docs.length - 1] : null,
        totalLogs: updatedLogs.length
      });
    } catch (error) {
      console.log("Error fetching logs by user:", error);
    } finally {
      set({ loadingLogs: false });
    }
  },

  // Function to delete a log
  deleteLog: async (logId: string) => {
    try {
      await deleteDoc(doc(db, "logs", logId));
      
      const currentLogs = get().logs;
      set({
        logs: currentLogs ? currentLogs.filter((log) => log.id !== logId) : null,
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting log:", error);
      return false;
    }
  },

  // Function to reset pagination
  resetPagination: () => {
    set({ 
      logs: null, 
      hasMore: true, 
      lastDoc: null, 
      totalLogs: 0 
    });
  },
}));