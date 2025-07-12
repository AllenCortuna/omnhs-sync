"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import LoadingOverlay from "../common/LoadingOverlay";
import { auth, db } from "@/../firebase";

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
      
      // Query students collection where email matches the current user's email
      const studentsRef = collection(db, "students");
      const q = query(studentsRef, where("email", "==", user.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setIsStudent(true);
      } else {
        setIsStudent(false);
        // If not student, redirect to home
        router.replace("/complete-info");
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