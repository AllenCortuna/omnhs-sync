"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import LoadingOverlay from "../common/LoadingOverlay";
import { auth, db } from "@/../firebase";
import { errorToast } from "@/config/toast";

interface TeacherRouteGuardProps {
  children: React.ReactNode;
}

const TeacherRouteGuard: React.FC<TeacherRouteGuardProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (!user) {
        // Not logged in
        setIsTeacher(false);
        setIsLoading(false);
        if (pathname !== "/") router.replace("/");
        return;
      }

      //check if user is student
      const studentsRef = collection(db, "students");
      const studentQuery = query(studentsRef, where("email", "==", user.email));
      const studentQuerySnapshot = await getDocs(studentQuery);
      if (!studentQuerySnapshot.empty) {
        errorToast("Account type is not a student. Please login with a student account.");
        setIsLoading(false);
        router.replace("/");
        return;
      }
      
      // Query teachers collection where email matches the current user's email
      const teachersRef = collection(db, "teachers");
      const q = query(teachersRef, where("email", "==", user.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setIsTeacher(true);
      } else {
        setIsTeacher(false);
        // If not teacher, redirect to home
        errorToast("You are not authorized to access this page. Please complete your profile to continue.");
        router.replace("/teacher-complete-info");
      }
      setIsLoading(false);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, pathname]);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (!isTeacher) {
    return null;
  }

  return <>{children}</>;
};

export default TeacherRouteGuard; 