"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiDatabase,
  FiDollarSign,
  FiUsers,
  FiGlobe,
  FiUser,
  FiChevronRight,
  FiPlus,
  FiArrowRight,
  FiRefreshCw,
  FiPieChart,
} from "react-icons/fi";

const HomeMenu = () => {
  const router = useRouter();
  const [stats, setStats] = useState({
    banks: 0,
    transactions: 0,
    users: 0,
    websites: 0,
    accounts: 0,
    reports: "N/A",
  });
  const [loading, setLoading] = useState(false);

  let user;
  let userList;
  let websiteList;

  // Menu data with icons
  const menuItems = [
    {
      title: "Banks",
      link: "/bank",
      icon: <FiDatabase className="text-3xl" />,
      color: "bg-gradient-to-r from-blue-400 to-blue-600",
      description: "Manage banking connections",
    },
    {
      title: "Transactions",
      link: "/transaction",
      icon: <FiDollarSign className="text-3xl" />,
      color: "bg-gradient-to-r from-green-400 to-green-600",
      description: "View and manage transactions",
    },
    {
      title: "Users",
      link: "/user",
      icon: <FiUsers className="text-3xl" />,
      color: "bg-gradient-to-r from-purple-400 to-purple-600",
      description: "User management",
    },
    {
      title: "Websites",
      link: "/website",
      icon: <FiGlobe className="text-3xl" />,
      color: "bg-gradient-to-r from-amber-400 to-amber-600",
      description: "Configure websites",
    },
    {
      title: "Reports",
      link: "/reports",
      icon: <FiPieChart className="text-3xl" />,
      color: "bg-gradient-to-r from-red-400 to-red-600",
      description: "View data analytics & reports",
    },
  ];

  if (typeof window !== "undefined") {
    user = JSON.parse(sessionStorage.getItem("user"));
    userList = JSON.parse(sessionStorage.getItem("users"));
    websiteList = JSON.parse(sessionStorage.getItem("websites"));
  }

  if (user?.type === "admin") {
    menuItems.push({
      title: "Accounts",
      link: "/account",
      icon: <FiUser className="text-3xl" />,
      color: "bg-gradient-to-r from-teal-400 to-teal-600",
      description: "Account administration",
    });
  }

  const fetchWebsiteList = async () => {
    try {
      const { data: responseData } = await axios.get(
        `/api/websites?onlyNames=true`
      );
      if (typeof window !== "undefined") {
        sessionStorage.setItem("websites", JSON.stringify(responseData?.data));
      }
    } catch (error) {
      console.error("Error fetching website data:", error);
    }
  };

  const fetchUserList = async () => {
    try {
      const { data: responseData } = await axios.get(
        `/api/users?onlyNames=true`
      );
      if (typeof window !== "undefined") {
        sessionStorage.setItem("users", JSON.stringify(responseData?.data));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    // Fetch entities for dropdowns
    if (!userList && !websiteList) {
      fetchWebsiteList();
      fetchUserList();
    }
  }, []);

  return (
    <div className="page-container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <header className="page-header mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome to your BusinessFlow dashboard
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item, index) => (
          <div
            key={index}
            className="card overflow-hidden hover:shadow-card-hover transition-shadow duration-300 animate-slide-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Card Header */}
            <div className={`${item.color} text-white p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{item.title}</h2>
                  <p className="text-white text-opacity-80 text-sm">
                    {item.description}
                  </p>
                </div>
                <div className="rounded-full bg-white bg-opacity-20 p-3">
                  {item.icon}
                </div>
              </div>
            </div>

            {/* Card Actions */}
            <div className="flex p-4 bg-white">
              <button
                onClick={() => router.push(item.link)}
                className="flex items-center text-primary font-medium hover:text-secondary transition-colors"
              >
                View all
                <FiArrowRight className="ml-2" />
              </button>
              <div className="flex-grow"></div>
              <button
                onClick={() => router.push(`${item.link}?add=true`)}
                className="flex items-center text-green-600 font-medium hover:text-green-800 transition-colors"
              >
                <FiPlus className="mr-1" />
                Add new
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Quick Links */}
          <a
            href="/transaction?last=true"
            className="card flex items-center p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="rounded-full bg-primary bg-opacity-10 p-3 mr-4">
              <FiDollarSign className="text-2xl text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Recent Transactions</h3>
              <p className="text-sm text-gray-500">View latest activity</p>
            </div>
          </a>

          <a
            href="/bank?add=true"
            className="card flex items-center p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="rounded-full bg-blue-500 bg-opacity-10 p-3 mr-4">
              <FiDatabase className="text-2xl text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Add New Bank</h3>
              <p className="text-sm text-gray-500">Configure banking</p>
            </div>
          </a>

          <a
            href="/user?add=true"
            className="card flex items-center p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="rounded-full bg-purple-500 bg-opacity-10 p-3 mr-4">
              <FiUsers className="text-2xl text-purple-500" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Add New User</h3>
              <p className="text-sm text-gray-500">Manage users</p>
            </div>
          </a>

          <a
            href="/reports"
            className="card flex items-center p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="rounded-full bg-red-500 bg-opacity-10 p-3 mr-4">
              <FiPieChart className="text-2xl text-red-500" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Reports & Analytics</h3>
              <p className="text-sm text-gray-500">View insights</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default HomeMenu;
