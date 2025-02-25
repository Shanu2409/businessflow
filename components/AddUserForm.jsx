"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  FaUniversity,
  FaRegCreditCard,
  FaGlobe,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import { toast } from "react-toastify";

const AddUserForm = ({ setShowAddUserForm, fetchData, editData }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [selectedWebsite, setSelectedWebsite] = useState("");
  const [isActive, setIsActive] = useState(true); // Default to active

  let websites = [];
  if (typeof window !== "undefined") {
    websites = JSON.parse(sessionStorage.getItem("websites")) || [];
  }

  const fetchWebsiteList = async () => {
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

  const handleEdit = async (data) => {
    try {
      const response = await axios.put(`/api/users/${data.username}`, data);
      toast.success(response?.data?.message);
      fetchUserList();
    } catch (error) {
      console.error("Error editing user:", error);
    }
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
            onChange={(e) => setUsername(e.target.value)}
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
          <select
            className="appearance-none bg-transparent border-none w-full text-gray-700 py-2 px-2 leading-tight focus:outline-none"
            value={selectedWebsite}
            disabled={editData}
            style={{ cursor: editData ? "not-allowed" : "default" }}
            onChange={(e) => setSelectedWebsite(e.target.value)}
          >
            <option value="" disabled>
              Select a Website
            </option>
            {websites.map((website, index) => (
              <option key={index} value={website}>
                {website}
              </option>
            ))}
          </select>
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
  );
};

export default AddUserForm;
