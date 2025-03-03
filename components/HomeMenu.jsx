"use client";

import axios from "axios";
import React, { useEffect, useRef, useState } from "react";

const HomeMenu = () => {
  let user;
  let userList;
  let websiteList;

  // Menu data
  const menuItems = [
    { title: "BANKS", link: "/bank" },
    { title: "TRANSACTIONS", link: "/transaction" },
    { title: "USERS", link: "/user" },
    { title: "WEBSITES", link: "/website" },
  ];

  if (typeof window !== "undefined") {
    user = JSON.parse(sessionStorage.getItem("user"));
    userList = JSON.parse(sessionStorage.getItem("users"));
    websiteList = JSON.parse(sessionStorage.getItem("websites"));
  }

  if (user?.type === "admin") {
    menuItems.push({ title: "ACCOUNTS", link: "/account" });
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

  // State to track collapsed items
  const [collapsed, setCollapsed] = useState(
    menuItems.reduce((acc, _, index) => ({ ...acc, [index]: false }), {})
  );

  // Toggle collapse state
  const toggleCollapse = (index) => {
    setCollapsed((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    if (!userList && !websiteList) {
      fetchWebsiteList();
      fetchUserList();
    }
  }, []);

  return (
    <div className="p-6 max-w-lg mx-auto animate-fade-in">
      <h1 className="text-xl font-semibold text-gray-800 mb-4 text-center animate-slide-down">
        Site Administration
      </h1>
      {menuItems.map((item, index) => (
        <div key={index} className="mb-4 rounded-lg shadow-lg animate-fade-in">
          {/* Header Section */}
          <div
            className="bg-secondary text-white px-4 py-3 flex justify-between items-center rounded-t-lg cursor-pointer transition-all duration-300 ease-in-out"
            onClick={() => toggleCollapse(index)}
          >
            <span className="font-semibold">{item.title}</span>
            <button
              className={`text-white text-lg transform transition-transform duration-300 ${
                collapsed[index] ? "rotate-0" : "rotate-180"
              }`}
            >
              {collapsed[index] ? "+" : "−"}
            </button>
          </div>

          {/* Collapsible Content */}
          <div
            className={`border border-gray-300 p-3 flex justify-between items-center rounded-b-lg bg-white transition-all duration-300 ease-in-out overflow-hidden ${
              collapsed[index] ? "h-0 opacity-0" : "h-auto opacity-100"
            }`}
          >
            <a
              href={item.link}
              className="text-blue-600 hover:underline transition-colors"
            >
              {item.title.charAt(0) + item.title.slice(1).toLowerCase()}
            </a>
            <div className="flex space-x-3">
              <a
                href={`${item.link}?add=true`}
                className="text-green-600 hover:underline text-sm transition-transform transform hover:scale-105 active:scale-95"
              >
                + Add
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HomeMenu;
