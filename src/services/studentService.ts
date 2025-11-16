import { collection, getDocs, query, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Student } from '../interface/user';

const COLLECTION_NAME = 'students';

export const studentService = {
  /**
   * Get all students ordered by creation date
   */
  async getAllStudents(): Promise<Student[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
    } catch (error) {
      console.error('Error fetching students:', error);
      throw new Error('Failed to fetch students');
    }
  },

  /**
   * Get total count of students
   */
  async getStudentCount(): Promise<number> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error fetching student count:', error);
      throw new Error('Failed to fetch student count');
    }
  },

  /**
   * Get count of students by status
   */
  async getStudentCountByStatus(status: Student['status']): Promise<number> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('status', '==', status));
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error(`Error fetching ${status} student count:`, error);
      throw new Error(`Failed to fetch ${status} student count`);
    }
  },

  /**
   * Update student status
   */
  async updateStudentStatus(studentId: string, status: string): Promise<void> {
    try {
      const studentRef = doc(db, COLLECTION_NAME, studentId);
      
      // Prepare update data
      const updateData: Partial<Student> = {
        status: status as Student['status'],
        updatedAt: new Date().toISOString()
      };

      // If status is transfer-out or graduated, clear enrollment data
      if (status === "transfer-out" || status === "graduated") {
        updateData.enrolledForSchoolYear = "";
        updateData.enrolledForSemester = "";
        updateData.enrolledForSectionId = "";
      }

      await updateDoc(studentRef, updateData);
    } catch (error) {
      console.error('Error updating student status:', error);
      throw new Error('Failed to update student status');
    }
  }
};
