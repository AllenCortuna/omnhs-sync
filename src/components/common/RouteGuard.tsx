"use client";
import React, { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUserDataStore } from "@/store/userDataStore";
import type { UserType } from "@/store/userDataStore";
import LoadingOverlay from "./LoadingOverlay";
import useSaveUserData from "@/hooks/useSaveUserData";

interface RouteGuardProps {
  role: UserType | UserType[];
  children: React.ReactNode;
}

const RouteGuard: React.FC<RouteGuardProps> = ({ role, children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUserType } = useUserDataStore();
  const { isLoading, error } = useSaveUserData();

  // Add loading state: if currentUserType is undefined (not null), show spinner
  const isUserLoading = typeof currentUserType === 'undefined';
  const isDataLoading = isLoading;

  // Normalize allowed roles to array
  const allowedRoles = useMemo(() => Array.isArray(role) ? role : [role], [role]);

  useEffect(() => {
    if (isDataLoading || isUserLoading) return;
    
    // Handle errors
    if (error) {
      console.error('RouteGuard error:', error);
      router.replace("/");
      return;
    }
    
    // Not logged in
    if (!currentUserType) {
      if (pathname !== "/") {
        router.replace("/");
      }
      return;
    }
    // Logged in but not allowed
    if (!allowedRoles.includes(currentUserType)) {
      router.replace(`/${currentUserType}/dashboard`);
    }
  }, [currentUserType, allowedRoles, router, pathname, isDataLoading, isUserLoading, error]);

  if (isDataLoading || isUserLoading) {
    return <LoadingOverlay />;
  }

  if (!currentUserType || !allowedRoles.includes(currentUserType)) {
    return null;
  }

  return <>{children}</>;
};

export default RouteGuard; 