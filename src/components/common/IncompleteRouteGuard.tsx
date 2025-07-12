"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import LoadingOverlay from "./LoadingOverlay";
import { auth } from "@/../firebase";

interface IncompleteRouteGuardProps {
  children: React.ReactNode;
}

const IncompleteRouteGuard: React.FC<IncompleteRouteGuardProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (!user) {
        // Not logged in
        setIsLogin(false);
        setIsLoading(false);
        if (pathname !== "/") router.replace("/");
        return;
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

  if (!isLogin) {
    return null;
  }

  return <>{children}</>;
};

export default IncompleteRouteGuard; 