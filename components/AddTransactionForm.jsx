"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  FaUniversity,
  FaGlobe,
  FaBuilding,
  FaExchangeAlt,
  FaMoneyBillWave,
} from "react-icons/fa";
import { toast } from "react-toastify";
import FullScreenLoader from "./FullScreenLoader";

const AddTransactionForm = ({
  setShowTransactionForm,
  fetchData,
  editData,
}) => {
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedWebsite, setSelectedWebsite] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [transactionType, setTransactionType] = useState("Deposit");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const [websites, setWebsites] = useState([]);
  const [userList, setUserList] = useState([]);
  const [bankList, setBankList] = useState([]);

  // Fetch required data (websites, banks, users)
  const fetchLists = async () => {
    setLoading(true);
    try {
      const [websiteRes, bankRes, userRes] = await Promise.all([
        axios.get(`/api/websites?onlyNames=true`),
        axios.get(`/api/banks?onlyNames=true`),
        axios.get(`/api/users?onlyNames=true`),
      ]);

      const websiteData = websiteRes.data?.data || [];
      const bankData = bankRes.data?.data || [];
      const userData = userRes.data?.data || [];

      setWebsites(websiteData);
      setBankList(bankData);
      setUserList(userData);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("websites", JSON.stringify(websiteData));
        sessionStorage.setItem("banks", JSON.stringify(bankData));
        sessionStorage.setItem("users", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Error fetching lists:", error);
    }

    setLoading(false);
  };

  useEffect(() => {
    // Load data from sessionStorage if available, otherwise fetch from API
    if (typeof window !== "undefined") {
      setWebsites(JSON.parse(sessionStorage.getItem("websites")) || []);
      setBankList(JSON.parse(sessionStorage.getItem("banks")) || []);
      setUserList(JSON.parse(sessionStorage.getItem("users")) || []);
    }

    if (
      !sessionStorage.getItem("websites") &&
      !sessionStorage.getItem("banks") &&
      !sessionStorage.getItem("users")
    ) {
      fetchLists();
    }

    if (editData) {
      setSelectedUser(editData.username);
      setSelectedWebsite(editData.website_name || "");
      setSelectedBank(editData.bank_name || "");
      setTransactionType(editData.transaction_type || "Deposit");
      setAmount(editData.amount || "");
    }
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedUser || !selectedWebsite || !selectedBank || !amount) {
      toast.error("Please fill all required fields.");
      return;
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("Invalid amount. Please enter a valid number.");
      return;
    }

    let user = JSON.parse(sessionStorage.getItem("user") || "{}");

    try {
      const response = await axios.post("/api/transactions", {
        username: selectedUser,
        website_name: selectedWebsite,
        bank_name: selectedBank,
        transaction_type: transactionType,
        amount: numericAmount,
        created_by: user.username,
      });

      toast.success(response.data.message);
      fetchData();
      resetForm();
    } catch (error) {
      console.error("Error processing transaction:", error);
      toast.error(error.response?.data?.message || "Transaction failed.");
    }
  };

  const resetForm = () => {
    setSelectedUser("");
    setSelectedWebsite("");
    setSelectedBank("");
    setTransactionType("Deposit");
    setAmount("");
    setShowTransactionForm(false);
  };

  return (
    <>
      <div className="max-w-md mx-auto p-4">
        <h2 className="text-2xl font-bold text-center mb-6">
          {editData ? "Edit Transaction" : "Add Transaction"}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
        >
          {/* Username Dropdown */}
          <Dropdown
            icon={<FaUniversity className="text-gray-600 mr-3" />}
            label="Select a User"
            options={userList}
            value={selectedUser}
            onChange={setSelectedUser}
          />

          {/* Website Dropdown */}
          <Dropdown
            icon={<FaGlobe className="text-gray-600 mr-3" />}
            label="Select a Website"
            options={websites}
            value={selectedWebsite}
            onChange={setSelectedWebsite}
          />

          {/* Bank Dropdown */}
          <Dropdown
            icon={<FaBuilding className="text-gray-600 mr-3" />}
            label="Select a Bank"
            options={bankList}
            value={selectedBank}
            onChange={setSelectedBank}
          />

          {/* Transaction Type Dropdown */}
          <Dropdown
            icon={<FaExchangeAlt className="text-gray-600 mr-3" />}
            label="Select Transaction Type"
            options={["Deposit", "Withdraw"]}
            value={transactionType}
            onChange={setTransactionType}
          />

          {/* Amount Input */}
          <InputField
            icon={<FaMoneyBillWave className="text-gray-600 mr-3" />}
            type="number"
            placeholder="Enter Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          {/* Submit Button */}
          <div className="flex items-center justify-center">
            <button
              className="bg-secondary hover:bg-primary text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              {editData ? "Update" : "Add"}
            </button>
          </div>
        </form>

        <FullScreenLoader isLoading={loading} />
      </div>
    </>
  );
};

// Dropdown Component
const Dropdown = ({ icon, label, options, value, onChange }) => (
  <div className="mb-4 flex items-center border-b border-gray-300 py-2">
    {icon}
    <select
      className="appearance-none bg-transparent border-none w-full text-gray-700 py-2 px-2 leading-tight focus:outline-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="" disabled>
        {label}
      </option>
      {options.map((option, index) => (
        <option key={index} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

// Input Field Component
const InputField = ({ icon, type, placeholder, value, onChange }) => (
  <div className="mb-6 flex items-center border-b border-gray-300 py-2">
    {icon}
    <input
      className="appearance-none bg-transparent border-none w-full text-gray-700 py-1 px-2 leading-tight focus:outline-none"
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  </div>
);

export default AddTransactionForm;
