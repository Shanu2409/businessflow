"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import FullScreenLoader from "@/components/FullScreenLoader";

// /preview-enter is a server-guarded preview-only page (404 unless the
// deployment is read-only and access-gated); it must render without a user.
const isOpenPath = (p) => p === "/login" || p === "/preview-enter";

const AuthContext = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Skip auth check for login page
    if (isOpenPath(pathname)) {
      setIsLoading(false);
      return;
    }

    // Check authentication
    const user = sessionStorage.getItem("user");

    if (user) {
      setIsAuthenticated(true);
      setIsLoading(false);
    } else {
      router.push("/login");
    }
  }, [pathname, router]);

  // Show loading state while checking auth
  if (isLoading && !isOpenPath(pathname)) {
    return <FullScreenLoader isLoading={true} />;
  }

  // Allow login page to render without auth
  if (isOpenPath(pathname)) {
    return children;
  }

  // Only render children when authenticated
  return isAuthenticated ? children : <FullScreenLoader isLoading={true} />;
};

export default AuthContext;
