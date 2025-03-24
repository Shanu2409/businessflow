"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaUniversity, FaCode, FaMoneyBillWave } from "react-icons/fa";
import { toast } from "react-toastify";
import FullScreenLoader from "./FullScreenLoader";
import { DropdownMenu } from "./DropdownMenu";

const AddWebsiteForm = ({ setShowAddWebsiteForm, fetchData, editData }) => {
  const [websiteName, setWebsiteName] = useState("");
  const [url, setUrl] = useState("");
  const [initialWebsiteName, setInitialWebsiteName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactionType, setTransactionType] = useState("Deposit");

  const handleEdit = async (data) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `/api/websites/${initialWebsiteName}`,
        data
      );
      toast.success(response?.data?.message);
    } catch (error) {
      console.error("Error editing website:", error);
      toast.error("Error editing website");
    }

    setLoading(false);
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editData) {
      await handleEdit({
        website_name: websiteName,
        url: url,
        current_balance: currentBalance,
        type: transactionType === "Deposit" ? true : false,
      });
      setShowAddWebsiteForm(false);
      fetchData();
      fetchWebsiteList();
      return;
    }

    let user = {};
    if (typeof window !== "undefined") {
      user = JSON.parse(sessionStorage.getItem("user"));
    }

    if (!websiteName || !url || !currentBalance) {
      toast.error("Please fill all required fields.");
      return;
    }

    setLoading(true);

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
      fetchWebsiteList();

      setWebsiteName("");
      setUrl("");
      setCurrentBalance("");
      setShowAddWebsiteForm(false);
    } catch (error) {
      console.error("Error adding website:", error);
      toast.error("Error adding website");
    }

    setLoading(false);
  };

  useEffect(() => {
    if (editData) {
      setWebsiteName(editData.website_name);
      setUrl(editData.url);
      setCurrentBalance(editData.current_balance);
      setInitialBalance(editData.current_balance);
      setInitialWebsiteName(editData?.website_name);
    }
  }, [editData]);

  return (
    <>
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
              step="0.1"
              placeholder="Current Balance"
              aria-label="Current Balance"
              value={currentBalance}
              onChange={(e) => {
                setCurrentBalance(e.target.value);
                if (editData) {
                  setTransactionType(
                    Number(e.target.value) > initialBalance
                      ? "Deposit"
                      : "Withdraw"
                  );
                }
              }}
            />
          </div>

          <DropdownMenu
            label=""
            options={["Deposit", "Withdraw"]}
            value={transactionType}
            onChange={setTransactionType}
            isDisabled={true}
          />

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

      <FullScreenLoader loading={loading} />
    </>
  );
};

export default AddWebsiteForm;
