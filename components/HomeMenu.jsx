"use client";

import React, { useState } from "react";

const HomeMenu = () => {
  // Menu data
  const menuItems = [
    { title: "BANKS", link: "/banks" },
    { title: "TRANSACTIONS", link: "/transactions" },
    { title: "USERS", link: "/users" },
    { title: "WEBSITES", link: "/websites" },
  ];

  // State to track collapsed items
  const [collapsed, setCollapsed] = useState(
    menuItems.reduce((acc, _, index) => ({ ...acc, [index]: false }), {})
  );

  // Toggle collapse state
  const toggleCollapse = (index) => {
    setCollapsed((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold text-gray-800 mb-4">
        Site Administration
      </h1>
      {menuItems.map((item, index) => (
        <div key={index} className="mb-4 rounded-lg shadow-lg">
          {/* Header Section */}
          <div
            className="bg-secondary text-white px-4 py-2 flex justify-between items-center rounded-t-lg cursor-pointer"
            onClick={() => toggleCollapse(index)}
          >
            <span className="font-semibold">{item.title}</span>
            <button className="text-white text-lg">
              {collapsed[index] ? "+" : "−"}
            </button>
          </div>

          {/* Collapsible Content */}
          {!collapsed[index] && (
            <div className="border border-gray-300 p-3 flex justify-between items-center rounded-b-lg bg-white">
              <a href={item.link} className="text-blue-600 hover:underline">
                {item.title.charAt(0) + item.title.slice(1).toLowerCase()}
              </a>
              <div className="flex space-x-3">
                <a
                  href={`${item.link}/add`}
                  className="text-green-600 hover:underline text-sm"
                >
                  + Add
                </a>
                <a
                  href={`${item.link}/change`}
                  className="text-yellow-600 hover:underline text-sm"
                >
                  ✏ Change
                </a>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default HomeMenu;
