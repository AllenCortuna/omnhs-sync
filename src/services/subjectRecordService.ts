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
import { SubjectRecord, StudentGrade } from '../interface/info';

const COLLECTION_NAME = 'subject-record';

export interface CreateSubjectRecordData {
  sectionId: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  gradeLevel: string;
  semester: string;
  timeSlot: string;
  schoolYear: string;
  teacherId: string;
  teacherName: string;
  studentGrades?: StudentGrade[];
  studentList?: string[];
}

export interface UpdateSubjectRecordData {
  sectionId?: string;
  sectionName?: string;
  subjectId?: string;
  subjectName?: string;
  gradeLevel?: string;
  semester?: string;
  schoolYear?: string;
  teacherId?: string;
  teacherName?: string;
  studentGrades?: StudentGrade[];
  studentList?: string[];
}

export const subjectRecordService = {
  /**
   * Get all subject records ordered by creation date
   */
  async getAllSubjectRecords(): Promise<SubjectRecord[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SubjectRecord[];
    } catch (error) {
      console.error('Error fetching subject records:', error);
      throw new Error('Failed to fetch subject records');
    }
  },

  /**
   * Get subject records by teacher ID
   */
  async getSubjectRecordsByTeacher(teacherId: string, schoolYear?: string): Promise<SubjectRecord[]> {
    try {
      const conditions = [where('teacherId', '==', teacherId)];
      
      if (schoolYear) {
        conditions.push(where('schoolYear', '==', schoolYear));
      }
      
      // conditions.push(orderBy('createdAt', 'desc'));
      
      const q = query(
        collection(db, COLLECTION_NAME), 
        ...conditions
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SubjectRecord[];
    } catch (error) {
      console.error('Error fetching subject records by teacher:', error);
      throw new Error('Failed to fetch subject records');
    }
  },

  /**
   * Get a single subject record by ID
   */
  async getSubjectRecordById(id: string): Promise<SubjectRecord | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as SubjectRecord;
      }
      return null;
    } catch (error) {
      console.error('Error fetching subject record:', error);
      throw new Error('Failed to fetch subject record');
    }
  },

  /**
   * Create a new subject record
   */
  async createSubjectRecord(data: CreateSubjectRecordData): Promise<SubjectRecord> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        studentGrades: data.studentGrades || [],
        studentList: data.studentList || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return {
        id: docRef.id,
        ...data,
        studentGrades: data.studentGrades || [],
        studentList: data.studentList || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as SubjectRecord;
    } catch (error) {
      console.error('Error creating subject record:', error);
      throw new Error('Failed to create subject record');
    }
  },

  /**
   * Update an existing subject record
   */
  async updateSubjectRecord(id: string, data: UpdateSubjectRecordData): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating subject record:', error);
      throw new Error('Failed to update subject record');
    }
  },

  /**
   * Get subject records by student ID (where student is enrolled)
   */
  async getSubjectRecordsByStudent(studentId: string): Promise<SubjectRecord[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME), 
        where('studentList', 'array-contains', studentId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SubjectRecord[];
    } catch (error) {
      console.error('Error fetching subject records by student:', error);
      throw new Error('Failed to fetch subject records');
    }
  },

  /**
   * Delete a subject record
   */
  async deleteSubjectRecord(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting subject record:', error);
      throw new Error('Failed to delete subject record');
    }
  }
}; 