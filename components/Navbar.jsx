"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { FiLogOut, FiMenu } from "react-icons/fi";
import { toast } from "react-toastify";

const Navbar = () => {
  const [user, setUser] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  // Routing buttons for mobile dropdown
  const mobileMenuItems = [
    { title: "BANKS", link: "/bank" },
    { title: "TRANSACTIONS", link: "/transaction" },
    { title: "USERS", link: "/user" },
    { title: "WEBSITES", link: "/website" },
  ];

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("user");
    }
    setUser(null);
    router.push("/login");
    toast("Logout successful", { type: "success" });
  };

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <nav className="bg-primary border-b-[10px] border-secondary shadow-md">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center text-white">
        {/* Left: Logo */}
        <div className="flex items-center space-x-2">
          <img
            src="https://raw.githubusercontent.com/Shanu2409/businessflow/refs/heads/master/assets/logo.png"
            alt="Logo"
            width={120}
            className="cursor-pointer"
            onClick={() => router.push("/")}
          />
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-2xl focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <FiMenu />
        </button>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center space-x-4">
          {mobileMenuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => router.push(item.link)}
              className="px-3 py-2 rounded-md hover:bg-gray-200 hover:text-primary transition duration-300"
            >
              {item.title}
            </button>
          ))}
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
            className="flex items-center px-3 py-2 rounded-md hover:bg-gray-200 hover:text-primary transition duration-300"
            onClick={handleLogout}
          >
            <FiLogOut className="mr-2" />
            Logout
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="absolute top-14 right-6 bg-white shadow-md rounded-md w-48 py-3 flex flex-col space-y-1 lg:hidden z-50">
            <div className="flex items-center px-4 py-2 border-b border-gray-200">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user?.username || "User"
                )}&background=random`}
                alt="Avatar"
                className="w-8 h-8 rounded-full"
              />
              <span className="ml-2 text-lg text-gray-800">
                {user?.username || "Guest"}
              </span>
            </div>
            {/* Routing Buttons */}
            {mobileMenuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setMenuOpen(false);
                  router.push(item.link);
                }}
                className="px-4 py-2 text-gray-800 text-left hover:bg-gray-200 transition duration-300"
              >
                {item.title}
              </button>
            ))}
            <button
              className="flex items-center px-4 py-2 text-red-600 hover:bg-gray-200 transition duration-300"
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
            >
              <FiLogOut className="mr-2" />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
