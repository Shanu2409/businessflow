"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // ✅ Use `next/navigation` for App Router

const AuthContext = ({ children }) => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // ✅ Ensures code only runs on the client
  }, []);

  useEffect(() => {
    if (!isClient) return; // Prevents running on the server

    const user = sessionStorage.getItem("user");

    if (user) {
      router.push("/"); // Redirect to home if user exists
    } else {
      router.push("/login"); // Otherwise, redirect to login
    }
  }, [isClient, router]);

  return <>{children}</>; // ✅ Correct return statement
};

export default AuthContext;
