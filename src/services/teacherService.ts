import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Teacher } from '../interface/user';

const COLLECTION_NAME = 'teachers';

export const teacherService = {
  /**
   * Get all teachers ordered by creation date
   */
  async getAllTeachers(): Promise<Teacher[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Teacher[];
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw new Error('Failed to fetch teachers');
    }
  },

  /**
   * Get total count of teachers
   */
  async getTeacherCount(): Promise<number> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error fetching teacher count:', error);
      throw new Error('Failed to fetch teacher count');
    }
  }
};
