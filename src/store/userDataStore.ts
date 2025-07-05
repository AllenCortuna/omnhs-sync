import { create } from 'zustand';
import type { Admin, Teacher, Student } from '@/interface/user';

export type UserType = 'admin' | 'teacher' | 'student' | null;

interface UserDataState {
  currentUserType: UserType;
  adminData?: Admin;
  teacherData?: Teacher;
  studentData?: Student;
  setUserData: (data: Admin | Teacher | Student, role: UserType) => void;
  clearUserData: () => void;
}

export const useUserDataStore = create<UserDataState>((set) => ({
  currentUserType: null,
  adminData: undefined,
  teacherData: undefined,
  studentData: undefined,
  setUserData: (data, role) => {
    if (role === 'admin') {
      set({
        currentUserType: role,
        adminData: data as Admin,
        teacherData: undefined,
        studentData: undefined,
      });
    } 
    if (role === 'teacher') {
      set({
        currentUserType: role,
        teacherData: data as Teacher,
        adminData: undefined,
        studentData: undefined,
      });
    }
    if (role === 'student') {
      set({
        currentUserType: role,
        studentData: data as Student,
        adminData: undefined,
        teacherData: undefined,
      });
    }
  },
  clearUserData: () => set({ currentUserType: null, adminData: undefined, teacherData: undefined, studentData: undefined }),
}));
