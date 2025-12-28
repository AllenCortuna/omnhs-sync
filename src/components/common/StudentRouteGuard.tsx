"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import LoadingOverlay from "../common/LoadingOverlay";
import { auth, db } from "@/../firebase";
import { errorToast } from "@/config/toast";

interface StudentRouteGuardProps {
  children: React.ReactNode;
}

const StudentRouteGuard: React.FC<StudentRouteGuardProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isStudent, setIsStudent] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (!user) {
        // Not logged in
        setIsStudent(false);
        setIsLoading(false);
        if (pathname !== "/") router.replace("/");
        return;
      }

      //check if user is teacher
      const teachersRef = collection(db, "teachers");
      const teacherQuery = query(teachersRef, where("email", "==", user.email));
      const teacherQuerySnapshot = await getDocs(teacherQuery);
      if (!teacherQuerySnapshot.empty) {
        errorToast("Account type is not a student. Please login with a student account.");
        setIsLoading(false);
        router.replace("/");
        return;
      }

      // Query students collection where email matches the current user's email
      const studentsRef = collection(db, "students");
      const q = query(studentsRef, where("email", "==", user.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const studentData = querySnapshot.docs[0].data();

        if (!studentData && auth.currentUser) {
          setIsStudent(false);
          errorToast("Student not found. Please sign up again or contact the admin.");
          router.replace("/student-re-signup");
          setIsLoading(false);
          return;
        }
        // Check if student is graduated (alumni)
        if (studentData.status === "graduated") {
          setIsStudent(false);
          errorToast("Alumni students are not authorized to access this page.");
          router.replace("/");
          setIsLoading(false);
          return;
        }
        if (!studentData.approved) {
          setIsStudent(false);
          errorToast("Your account is not approved. Please wait for the admin to approve your account.");
          router.replace("/");
          setIsLoading(false);
          return;
        }
        setIsStudent(true);
      } else {
        setIsStudent(false);
        errorToast("You are not authorized to access this page. Please complete your profile to continue.");
        // If not student, redirect to home
        router.replace("/student-complete-info");
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

  if (!isStudent) {
    return null;
  }

  return <>{children}</>;
};

export default StudentRouteGuard; 