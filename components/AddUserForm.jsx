"use client";

import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import {
  FaUniversity,
  FaRegCreditCard,
  FaGlobe,
  FaToggleOn,
  FaToggleOff,
  FaPlus,
} from "react-icons/fa";
import { toast } from "react-toastify";
import FullScreenLoader from "./FullScreenLoader";
import { useRouter } from "next/navigation";

const DropdownMenu = ({
  label,
  options,
  value,
  onChange,
  isDisabled = false,
  addRoute = null, // New prop for add button route
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const router = useRouter();

  // Filter options based on search input
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length, searchTerm]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e) => {
    if (!filteredOptions.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(
          (prevIndex) => (prevIndex + 1) % filteredOptions.length
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(
          (prevIndex) =>
            (prevIndex - 1 + filteredOptions.length) % filteredOptions.length
        );
        break;
      case "Enter":
      case "Tab":
        e.preventDefault();
        selectOption(filteredOptions[highlightedIndex]);
        break;
      case "Escape":
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const selectOption = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm(""); // Reset search term
  };

  return (
    <div className="relative mb-4" ref={dropdownRef}>
      <label className="block text-gray-700 font-bold mb-1">{label}</label>
      <div className="flex items-center">
        <div
          className={`border border-gray-300 rounded-md p-2 flex items-center justify-between cursor-pointer bg-white flex-grow ${
            isDisabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={() => {
            if (!isDisabled) {
              setIsOpen(!isOpen);
            }
          }}
        >
          <span>{value || `Select ${label}`}</span>
          <span className="text-gray-500">{isOpen ? "▲" : "▼"}</span>
        </div>
        {addRoute && (
          <div
            className="ml-2 p-1 hover:bg-gray-200 rounded-full cursor-pointer"
            title={`Add new ${label.toLowerCase()}`}
            onClick={() => router.push(addRoute)}
          >
            <FaPlus className="text-secondary hover:text-primary" />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute w-full bg-white border border-gray-300 mt-1 rounded-md shadow-lg z-10">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            className="w-full p-2 border-b border-gray-300 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
          />
          <div className="max-h-40 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option}
                  className={`p-2 cursor-pointer ${
                    index === highlightedIndex ? "bg-gray-200" : ""
                  }`}
                  onClick={() => selectOption(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {option}
                </div>
              ))
            ) : (
              <p className="p-2 text-gray-500">No options found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AddUserForm = ({ setShowAddUserForm, fetchData, editData }) => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [selectedWebsite, setSelectedWebsite] = useState("");
  const [isActive, setIsActive] = useState(true); // Default to active
  const [loading, setLoading] = useState(false);

  let websites = [];
  if (typeof window !== "undefined") {
    websites = JSON.parse(sessionStorage.getItem("websites")) || [];
  }

  const fetchWebsiteList = async () => {
    setLoading(true);
    try {
      const { data: responseData } = await axios.get(
        `/api/websites?onlyNames=true`
      );
      if (typeof window !== "undefined") {
        sessionStorage.setItem("websites", JSON.stringify(responseData?.data));
      }

      console.log(responseData);
    } catch (error) {
      console.error("Error fetching bank data:", error);
    }

    setLoading(false);
  };

  const fetchUserList = async () => {
    setLoading(true);
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

    setLoading(false);
  };

  const handleEdit = async (data) => {
    setLoading(true);
    try {
      const response = await axios.put(`/api/users/${data.username}`, data);
      toast.success(response?.data?.message);
      fetchUserList();
    } catch (error) {
      console.error("Error editing user:", error);
    }

    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editData) {
      handleEdit({
        username: username,
        email: email,
        website_name: selectedWebsite,
        active: isActive,
      });
      setShowAddUserForm(false);
      fetchData();
      return;
    }

    let user = {};
    if (typeof window !== "undefined") {
      user = JSON.parse(sessionStorage.getItem("user"));
    }

    const response = await axios.post("/api/users", {
      username: username,
      email: email,
      website_name: selectedWebsite,
      active: isActive,
      created_by: user.username,
    });

    if (response.status !== 200) {
      console.error(response.data.message);
      toast.error(response.data.message);
      return;
    }

    toast.success(response.data.message);

    fetchData();
    fetchUserList();

    setUsername("");
    setEmail("");
    setSelectedWebsite("");
    setIsActive(true);
    setShowAddUserForm(false);
  };

  useEffect(() => {
    if (editData) {
      setUsername(editData.username);
      setEmail(editData.email);
      setSelectedWebsite(editData.website_name || "");
      setIsActive(editData.active ?? true); // Default to true if undefined
    }
  }, [editData]);

  useEffect(() => {
    fetchWebsiteList();
    if (typeof window !== "undefined") {
      websites = JSON.parse(sessionStorage.getItem("websites")) || [];
    }
  }, []);

  return (
    <>
      <div className="max-w-md mx-auto p-4">
        <h2 className="text-2xl font-bold text-center mb-6">
          {editData ? "Edit User" : "Add User"}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
        >
          <div className="mb-4 flex items-center border-b border-gray-300 py-2">
            <FaUniversity className="text-gray-600 mr-3" />
            <input
              className="appearance-none bg-transparent border-none w-full text-gray-700 py-1 px-2 leading-tight focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
              type="text"
              placeholder="Username"
              disabled={editData}
              style={{ cursor: editData ? "not-allowed" : "default" }}
              aria-label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toUpperCase())}
            />
          </div>

          <div className="mb-4 flex items-center border-b border-gray-300 py-2">
            <FaRegCreditCard className="text-gray-600 mr-3" />
            <input
              className="appearance-none bg-transparent border-none w-full text-gray-700 py-1 px-2 leading-tight focus:outline-none"
              placeholder="Email"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Website Dropdown with Icon */}
          <div className="mb-4 flex items-center border-b border-gray-300 py-2">
            <FaGlobe className="text-gray-600 mr-3" />
            <div className="w-full">
              <DropdownMenu
                label=""
                options={websites}
                value={selectedWebsite}
                onChange={(option) => setSelectedWebsite(option)}
                isDisabled={editData}
                addRoute="/website?add=true"
              />
            </div>
          </div>

          {/* Active/Disabled Toggle */}
          <div className="mb-6 flex items-center justify-between">
            {/* Toggle Label */}
            <label
              className="flex items-center cursor-pointer"
              onClick={() => setIsActive(!isActive)}
            >
              {isActive ? (
                <FaToggleOn className="text-green-500 text-2xl mr-2" />
              ) : (
                <FaToggleOff className="text-gray-500 text-2xl mr-2" />
              )}
              <span className="text-gray-700">
                {isActive ? "Active" : "Disabled"}
              </span>
            </label>

            {/* Hidden Checkbox (Fixed onChange event) */}
            <input
              type="checkbox"
              className="hidden"
              checked={isActive}
              onChange={() => setIsActive(!isActive)}
            />
          </div>

          <div className="flex items-center justify-center">
            <button
              className="bg-secondary hover:bg-primary text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              {editData ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
      <FullScreenLoader isLoading={loading} />
    </>
  );
};

export default AddUserForm;
