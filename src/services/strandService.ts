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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Strand } from '../interface/info';

const COLLECTION_NAME = 'strands';

export interface CreateStrandData {
  strandName: string;
  strandDescription: string;
}

export interface UpdateStrandData {
  strandName?: string;
  strandDescription?: string;
}

export const strandService = {
  /**
   * Get all strands ordered by name
   */
  async getAllStrands(): Promise<Strand[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('strandName'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Strand[];
    } catch (error) {
      console.error('Error fetching strands:', error);
      throw new Error('Failed to fetch strands');
    }
  },

  /**
   * Get a single strand by ID
   */
  async getStrandById(id: string): Promise<Strand | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Strand;
      }
      return null;
    } catch (error) {
      console.error('Error fetching strand:', error);
      throw new Error('Failed to fetch strand');
    }
  },

  /**
   * Create a new strand
   */
  async createStrand(data: CreateStrandData): Promise<Strand> {
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
      } as Strand;
    } catch (error) {
      console.error('Error creating strand:', error);
      throw new Error('Failed to create strand');
    }
  },

  /**
   * Update an existing strand
   */
  async updateStrand(id: string, data: UpdateStrandData): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating strand:', error);
      throw new Error('Failed to update strand');
    }
  },

  /**
   * Delete a strand
   */
  async deleteStrand(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting strand:', error);
      throw new Error('Failed to delete strand');
    }
  }
}; 