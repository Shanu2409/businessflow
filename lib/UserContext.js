"use client";

import { useEffect, useState } from "react";

export const UserContext = () => {
  const [user, setUser] = useState({});

  if (typeof window === "undefined") return;
  const userFromSession = sessionStorage.getItem("user");
  setUser(userFromSession);
  return JSON.parse(user);
};

export default UserContext;
