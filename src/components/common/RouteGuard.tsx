"use client";
import React, { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUserDataStore } from "@/store/userDataStore";
import type { UserType } from "@/store/userDataStore";
import LoadingOverlay from "./LoadingOverlay";

interface RouteGuardProps {
  role: UserType | UserType[];
  children: React.ReactNode;
}

const RouteGuard: React.FC<RouteGuardProps> = ({ role, children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUserType } = useUserDataStore();

  // Add loading state: if currentUserType is undefined (not null), show spinner
  const isLoading = typeof currentUserType === 'undefined';

  // Normalize allowed roles to array
  const allowedRoles = useMemo(() => Array.isArray(role) ? role : [role], [role]);

  useEffect(() => {
    if (isLoading) return;
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
  }, [currentUserType, allowedRoles, router, pathname, isLoading]);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (!currentUserType || !allowedRoles.includes(currentUserType)) {
    return null;
  }

  return <>{children}</>;
};

export default RouteGuard; 