"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaUser, FaLock } from "react-icons/fa";
import { toast } from "react-toastify";
import FullScreenLoader from "./FullScreenLoader";

const AddAccountForm = ({ setShowAddAccountForm, fetchData, editData }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Password visibility toggle
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setUsername(editData.username);
      setPassword(editData.password);
    }
  }, [editData]);

  const handleEdit = async (data) => {
    setLoading(true);
    try {
      const response = await axios.put(`/api/accounts/${data.username}`, {
        password: data.password,
      });
      toast.success(response?.data?.message);
      fetchData();
    } catch (error) {
      console.error("Error editing user:", error);
      toast.error("Failed to update user.");
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Please fill all fields.");
      return;
    }

    if (editData) {
      handleEdit({ username, password });
      setShowAddAccountForm(false);
      fetchData();
      return;
    }

    setLoading(true);
    try {
      try {
        const response = await axios.post("/api/accounts", {
          username,
          password,
        });

        toast.success(response.data.Message || "User added successfully");
        fetchData();
        setUsername("");
        setPassword("");
        setShowAddAccountForm(false);
      } catch (err) {
        // Check for specific error responses
        if (err.response && err.response.status === 400) {
          toast.error(
            err.response.data.Message ||
              "Account with this username already exists"
          );
          // Keep the form open to allow the user to modify the username
          return;
        } else {
          throw err; // rethrow if it's not the specific error we're handling
        }
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error(error.response?.data?.Message || "Failed to add user");
    }

    setLoading(false);
  };

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
          {/* Username Field */}
          <div className="mb-4 flex items-center border-b border-gray-300 py-2">
            <FaUser className="text-gray-600 mr-3" />
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

          {/* Password Field with Show/Hide Toggle */}
          <div className="mb-4 flex items-center border-b border-gray-300 py-2 relative">
            <FaLock className="text-gray-600 mr-3" />
            <input
              className="appearance-none bg-transparent border-none w-full text-gray-700 py-1 px-2 leading-tight focus:outline-none"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 text-gray-600 hover:text-gray-800"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <div className="flex items-center justify-center">
            <button
              disabled={!username || !password}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
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

export default AddAccountForm;
