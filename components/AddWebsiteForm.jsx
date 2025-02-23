"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaUniversity, FaCode, FaMoneyBillWave } from "react-icons/fa";
import { toast } from "react-toastify";

const AddWebsiteForm = ({ setShowAddWebsiteForm, fetchData, editData }) => {
  const [websiteName, setWebsiteName] = useState("");
  const [url, setUrl] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");

  const handleEdit = async (data) => {
    try {
      const response = await axios.put(
        `/api/websites/${data.website_name}`,
        data
      );
      toast.success(response?.data?.message);
    } catch (error) {
      console.error("Error editing website:", error);
      toast.error("Error editing website");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editData) {
      await handleEdit({
        website_name: websiteName,
        url: url,
        current_balance: currentBalance,
      });
      setShowAddWebsiteForm(false);
      fetchData();
      return;
    }

    let user = {};
    if (typeof window !== "undefined") {
      user = JSON.parse(sessionStorage.getItem("user"));
    }

    try {
      const response = await axios.post("/api/websites", {
        website_name: websiteName,
        url: url,
        current_balance: currentBalance,
        created_by: user?.username,
      });

      if (response.status !== 200) {
        console.error(response.data.message);
        toast.error(response.data.message);
        return;
      }

      toast.success(response.data.message);
      fetchData();
      setWebsiteName("");
      setUrl("");
      setCurrentBalance("");
      setShowAddWebsiteForm(false);
    } catch (error) {
      console.error("Error adding website:", error);
      toast.error("Error adding website");
    }
  };

  useEffect(() => {
    if (editData) {
      setWebsiteName(editData.website_name);
      setUrl(editData.url);
      setCurrentBalance(editData.current_balance);
    }
  }, [editData]);

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold text-center mb-6">
        {editData ? "Edit Website" : "Add Website"}
      </h2>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        <div className="mb-4 flex items-center border-b border-gray-300 py-2">
          <FaUniversity className="text-gray-600 mr-3" />
          <input
            className="appearance-none bg-transparent border-none w-full text-gray-700 py-1 px-2 leading-tight focus:outline-none"
            type="text"
            placeholder="Website Name"
            disabled={!!editData}
            aria-label="Website Name"
            value={websiteName}
            onChange={(e) => setWebsiteName(e.target.value)}
          />
        </div>

        <div className="mb-4 flex items-center border-b border-gray-300 py-2">
          <FaCode className="text-gray-600 mr-3" />
          <input
            className="appearance-none bg-transparent border-none w-full text-gray-700 py-1 px-2 leading-tight focus:outline-none"
            type="text"
            placeholder="URL"
            aria-label="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="mb-6 flex items-center border-b border-gray-300 py-2">
          <FaMoneyBillWave className="text-gray-600 mr-3" />
          <input
            className="appearance-none bg-transparent border-none w-full text-gray-700 py-1 px-2 leading-tight focus:outline-none"
            type="number"
            step="0.01"
            placeholder="Current Balance"
            aria-label="Current Balance"
            value={currentBalance}
            onChange={(e) => setCurrentBalance(e.target.value)}
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

export default AddWebsiteForm;
