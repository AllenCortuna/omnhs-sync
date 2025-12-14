import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query,
  orderBy,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Subject } from '../interface/info';

const COLLECTION_NAME = 'subjects';

export interface CreateSubjectData {
  subjectName: string;
  subjectDescription?: string;
  strandId: string[];
}

export interface UpdateSubjectData {
  subjectName?: string;
  subjectDescription?: string;
  strandId?: string[];
}

export const subjectService = {
  /**
   * Get all subjects ordered by name
   */
  async getAllSubjects(): Promise<Subject[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('subjectName'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subject[];
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw new Error('Failed to fetch subjects');
    }
  },

  /**
   * Get subjects by strand ID (subjects that include this strand in their strandId array)
   */
  async getSubjectsByStrandId(strandId: string): Promise<Subject[]> {
    try {
      // Since Firestore doesn't support array-contains with orderBy easily,
      // we'll fetch all and filter in memory, or use array-contains
      const q = query(
        collection(db, COLLECTION_NAME), 
        where('strandId', 'array-contains', strandId)
      );
      const querySnapshot = await getDocs(q);
      
      const subjects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subject[];
      
      // Sort by subject name in memory
      return subjects.sort((a, b) => a.subjectName.localeCompare(b.subjectName));
    } catch (error) {
      console.error('Error fetching subjects by strand:', error);
      throw new Error('Failed to fetch subjects');
    }
  },

  /**
   * Get a single subject by ID
   */
  async getSubjectById(id: string): Promise<Subject | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Subject;
      }
      return null;
    } catch (error) {
      console.error('Error fetching subject:', error);
      throw new Error('Failed to fetch subject');
    }
  },

  /**
   * Create a new subject
   */
  async createSubject(data: CreateSubjectData): Promise<Subject> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return {
        id: docRef.id,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Subject;
    } catch (error) {
      console.error('Error creating subject:', error);
      throw new Error('Failed to create subject');
    }
  },

  /**
   * Update an existing subject
   */
  async updateSubject(id: string, data: UpdateSubjectData): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating subject:', error);
      throw new Error('Failed to update subject');
    }
  },

  /**
   * Delete a subject
   */
  async deleteSubject(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting subject:', error);
      throw new Error('Failed to delete subject');
    }
  }
}; 