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
  strandId: string;
}

export interface UpdateSectionData {
  sectionName?: string;
  adviserId?: string;
  adviserName?: string;
  adviserEmail?: string;
}

export const sectionService = {
  /**
   * Get all sections ordered by name
   */
  async getAllSections(): Promise<Section[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('sectionName'));
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
   * Check if section name already exists for a strand
   */
  async checkSectionNameExists(strandId: string, sectionName: string, excludeId?: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('strandId', '==', strandId),
        where('sectionName', '==', sectionName.trim())
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.some(doc => {
        // Exclude the current section when editing
        if (excludeId && doc.id === excludeId) {
          return false;
        }
        return true;
      });
    } catch (error) {
      console.error('Error checking section name:', error);
      throw new Error('Failed to check section name');
    }
  },

  /**
   * Create a new section
   */
  async createSection(data: CreateSectionData): Promise<Section> {
    try {
      // Check if section name already exists
      const nameExists = await this.checkSectionNameExists(data.strandId, data.sectionName);
      if (nameExists) {
        throw new Error('A section with this name already exists in this strand');
      }

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
      throw error; // Re-throw to preserve the original error message
    }
  },

  /**
   * Update an existing section
   */
  async updateSection(id: string, data: UpdateSectionData): Promise<void> {
    try {
      // If section name is being updated, check for duplicates
      if (data.sectionName) {
        // Get the current section to get the strandId
        const currentSection = await this.getSectionById(id);
        if (currentSection) {
          const nameExists = await this.checkSectionNameExists(
            currentSection.strandId, 
            data.sectionName, 
            id // Exclude current section
          );
          if (nameExists) {
            throw new Error('A section with this name already exists in this strand');
          }
        }
      }

      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating section:', error);
      throw error; // Re-throw to preserve the original error message
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