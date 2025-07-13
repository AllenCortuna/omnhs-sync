"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import LoadingOverlay from "./LoadingOverlay";
import { auth, db } from "@/../firebase";
import { errorToast } from "@/config/toast";

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (!user) {
        // Not logged in
        setIsAdmin(false);
        setIsLoading(false);
        if (pathname !== "/") router.replace("/");
        return;
      }
      // Fetch admin data from Firestore
      const adminDocRef = doc(db, "admin", user.uid);
      const adminDoc = await getDoc(adminDocRef);
      if (adminDoc.exists()) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        errorToast("You are not an Admin. You are not authorized to access this page");
        // If not admin, redirect to their dashboard if possible
        router.replace("/");
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

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
};

export default AdminRouteGuard; 