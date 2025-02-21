"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { FiLogOut, FiMenu } from "react-icons/fi"; // Import icons
import { toast } from "react-toastify";

const Navbar = () => {
  const [user, setUser] = useState({});
  const [menuOpen, setMenuOpen] = useState(false); // State for mobile menu
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("user");
    }
    setUser(null);
    router.push("/login");

    toast("Logout successful", { type: "success" });
  };

  React.useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <nav className="px-6 py-3 flex justify-between items-center text-white shadow-md bg-primary border-b-[10px] border-secondary px-10">
      {/* Left: Logo */}
      <div className="flex items-center space-x-2">
        <img src={"/logo.png"} alt="Logo" className="w-8 h-8" />
        <span className="text-xl font-semibold">BusinessFlow</span>
      </div>

      {/* Mobile Menu Button */}
      <button
        className="lg:hidden text-2xl"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <FiMenu />
      </button>

      {/* Desktop Menu */}
      <div className="hidden lg:flex items-center space-x-4">
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
            user?.username || "User"
          )}&background=random`}
          alt="Avatar"
          className="w-8 h-8 rounded-full"
        />
        <span className="text-lg">
          Welcome, <strong>{user?.username || "Guest"}</strong>
        </span>
        <button
          className="flex items-center px-3 py-2 rounded-md hover:bg-gray-200 transition"
          onClick={handleLogout}
        >
          <FiLogOut className="mr-2" />
          Logout
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="absolute top-14 right-6 bg-white shadow-md rounded-md w-48 py-3 flex flex-col lg:hidden">
          <div className="flex items-center px-4 py-2">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                user?.username || "User"
              )}&background=random`}
              alt="Avatar"
              className="w-8 h-8 rounded-full"
            />
            <span className="ml-2 text-lg">{user?.username || "Guest"}</span>
          </div>
          <button
            className="flex items-center px-4 py-2 text-red-600 hover:bg-gray-200 transition"
            onClick={handleLogout}
          >
            <FiLogOut className="mr-2" />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
