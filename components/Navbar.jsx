"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import {
  FiLogOut,
  FiMenu,
  FiX,
  FiHome,
  FiUsers,
  FiDollarSign,
  FiGlobe,
  FiDatabase,
  FiPieChart,
} from "react-icons/fi";
import { toast } from "react-toastify";

const Navbar = () => {
  const [user, setUser] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  // Menu items with icons
  const menuItems = [
    { title: "HOME", link: "/", icon: <FiHome className="mr-2" /> },
    { title: "BANKS", link: "/bank", icon: <FiDatabase className="mr-2" /> },
    {
      title: "TRANSACTIONS",
      link: "/transaction",
      icon: <FiDollarSign className="mr-2" />,
    },
    { title: "USERS", link: "/user", icon: <FiUsers className="mr-2" /> },
    { title: "WEBSITES", link: "/website", icon: <FiGlobe className="mr-2" /> },
    { title: "REPORTS", link: "/reports", icon: <FiPieChart className="mr-2" /> },
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
    <nav className="bg-primary border-b-[3px] border-accent shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center text-white">
        {/* Left: Logo */}
        <div className="flex items-center space-x-2">
          <img
            src="https://raw.githubusercontent.com/Shanu2409/businessflow/refs/heads/master/assets/logo.png"
            alt="Logo"
            width={120}
            className="cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => router.push("/")}
          />
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-2xl focus:outline-none focus:ring-2 focus:ring-accent rounded-md p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center space-x-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => router.push(item.link)}
              className="flex items-center px-3 py-2 rounded-md hover:bg-secondary transition duration-300 text-sm font-medium"
            >
              {item.icon}
              {item.title}
            </button>
          ))}
          <div className="pl-4 ml-4 border-l border-secondary flex items-center">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                user?.username || "User"
              )}&background=random&color=fff`}
              alt="Avatar"
              className="w-8 h-8 rounded-full border-2 border-accent"
            />
            <span className="text-sm ml-2">
              Welcome,{" "}
              <strong className="font-semibold">
                {user?.username || "Guest"}
              </strong>
            </span>
            <button
              className="flex items-center ml-4 px-3 py-2 rounded-md bg-secondary hover:bg-accent hover:text-primary transition duration-300 text-sm"
              onClick={handleLogout}
            >
              <FiLogOut className="mr-2" />
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="absolute top-full right-0 left-0 bg-white shadow-lg py-2 lg:hidden z-50 animate-fade-in">
            <div className="flex items-center px-4 py-3 border-b border-gray-200">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user?.username || "User"
                )}&background=random`}
                alt="Avatar"
                className="w-8 h-8 rounded-full border-2 border-primary"
              />
              <span className="ml-2 text-primary font-medium">
                {user?.username || "Guest"}
              </span>
            </div>
            {/* Menu Items */}
            <div className="px-2 py-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setMenuOpen(false);
                    router.push(item.link);
                  }}
                  className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary rounded-md transition duration-300 mb-1"
                >
                  {item.icon}
                  {item.title}
                </button>
              ))}
              <button
                className="flex items-center w-full px-4 py-2 mt-2 text-white bg-primary rounded-md hover:bg-secondary transition duration-300"
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
              >
                <FiLogOut className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
