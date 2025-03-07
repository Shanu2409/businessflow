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
      <h1 className="text-3xl font-semibold text-gray-800 mb-6 text-center animate-slide-down">
        Site Administration
      </h1>
      {menuItems.map((item, index) => (
        <div
          key={index}
          className="mb-4 rounded-lg shadow-md overflow-hidden animate-fade-in"
        >
          {/* Header Section */}
          <div
            className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center rounded-t-lg cursor-pointer hover:bg-blue-700 transition-colors duration-300"
            onClick={() => toggleCollapse(index)}
          >
            <span className="font-semibold text-lg">{item.title}</span>
            <button
              className={`text-white text-lg focus:outline-none transition-transform duration-300 ${
                collapsed[index] ? "rotate-90" : "rotate-0"
              }`}
            >
              &#8640;
            </button>
          </div>

          {/* Collapsible Content */}
          <div
            className={`bg-white p-4 transition-all duration-300 ease-in-out ${
              collapsed[index] ? "hidden" : ""
            }`}
          >
            <div className="flex justify-between items-center">
              <a
                href={item.link}
                className="text-blue-600 hover:underline text-lg transition-colors"
              >
                {item.title.charAt(0) + item.title.slice(1).toLowerCase()}
              </a>
              <div className="flex space-x-3">
                <a
                  href={`${item.link}?add=true`}
                  className="text-green-600 hover:underline text-sm transition-colors"
                >
                  + Add
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HomeMenu;
