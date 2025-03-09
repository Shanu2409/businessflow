"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import FullScreenLoader from "@/components/FullScreenLoader";

const AuthContext = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === "/login") {
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
  if (isLoading && pathname !== "/login") {
    return <FullScreenLoader isLoading={true} />;
  }

  // Allow login page to render without auth
  if (pathname === "/login") {
    return children;
  }

  // Only render children when authenticated
  return isAuthenticated ? children : <FullScreenLoader isLoading={true} />;
};

export default AuthContext;
