import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Section } from '../interface/info';

const COLLECTION_NAME = 'sections';

export interface CreateSectionData {
  sectionName: string;
  sectionDescription: string;
  strandId: string;
}

export interface UpdateSectionData {
  sectionName?: string;
  sectionDescription?: string;
}

export const sectionService = {
  /**
   * Get all sections for a specific strand
   */
  async getSectionsByStrandId(strandId: string): Promise<Section[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME), 
        where('strandId', '==', strandId),
        orderBy('sectionName')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Section[];
    } catch (error) {
      console.error('Error fetching sections:', error);
      throw new Error('Failed to fetch sections');
    }
  },

  /**
   * Get a single section by ID
   */
  async getSectionById(id: string): Promise<Section | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Section;
      }
      return null;
    } catch (error) {
      console.error('Error fetching section:', error);
      throw new Error('Failed to fetch section');
    }
  },

  /**
   * Create a new section
   */
  async createSection(data: CreateSectionData): Promise<Section> {
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
      } as Section;
    } catch (error) {
      console.error('Error creating section:', error);
      throw new Error('Failed to create section');
    }
  },

  /**
   * Update an existing section
   */
  async updateSection(id: string, data: UpdateSectionData): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating section:', error);
      throw new Error('Failed to update section');
    }
  },

  /**
   * Delete a section
   */
  async deleteSection(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting section:', error);
      throw new Error('Failed to delete section');
    }
  }
}; 