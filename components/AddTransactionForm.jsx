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
import { useRouter } from "next/navigation";
import { DropdownMenu } from "./DropdownMenu";

const AddTransactionForm = ({
  setShowTransactionForm,
  fetchData,
  editData,
}) => {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedWebsite, setSelectedWebsite] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [transactionType, setTransactionType] = useState("Deposit");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const [websites, setWebsites] = useState([]);
  const [userList, setUserList] = useState({});
  const [bankList, setBankList] = useState([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWebsites(JSON.parse(sessionStorage.getItem("websites")) || []);
      setBankList(JSON.parse(sessionStorage.getItem("banks")) || []);
      setUserList(JSON.parse(sessionStorage.getItem("users")) || {});
    }

    if (editData) {
      setSelectedUser(editData.username);
      setSelectedWebsite(editData.website_name || "");
      setSelectedBank(editData.bank_name || "");
      setTransactionType(editData.transaction_type || "Deposit");
      setAmount(editData.amount || "");
    }
  }, [editData]);

  // Update website name when a user is selected
  useEffect(() => {
    if (selectedUser) {
      setSelectedWebsite(userList[selectedUser] || ""); // Get the mapped website name
    }
  }, [selectedUser, userList]);

  const fetchBankList = async () => {
    try {
      const { data: responseData } = await axios.get(
        `/api/banks?onlyNames=true`
      );
      if (typeof window !== "undefined") {
        sessionStorage.setItem("banks", JSON.stringify(responseData?.data));
        setBankList(responseData?.data || []); // ✅ Update state here
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchWebsiteList = async () => {
    try {
      const { data: responseData } = await axios.get(
        `/api/websites?onlyNames=true`
      );
      if (typeof window !== "undefined") {
        sessionStorage.setItem("websites", JSON.stringify(responseData?.data));
        setWebsites(responseData?.data || {});
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
        setUserList(responseData?.data || {});
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    setLoading(true);

    fetchBankList();
    fetchWebsiteList();
    fetchUserList();

    setLoading(false);
  }, []);

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
    // setShowTransactionForm(false);
  };

  return (
    <>
      {loading ? (
        <FullScreenLoader isLoading={loading} />
      ) : (
        <div className="mx-auto p-4 flex justify-center">
          {" "}
          {/* Center the form horizontally */}
          <div className="w-full md:max-w-md">
            {" "}
            {/* Add a container for the form with max width */}
            <h2 className="text-2xl font-bold text-center mb-4">
              {editData ? "Edit Transaction" : "Add Transaction"}
            </h2>
            <form
              onSubmit={handleSubmit}
              className="bg-white shadow-md rounded px-4 pt-4 pb-4 mb-2"
            >
              {/* Username Dropdown */}
              <DropdownMenu
                label="Select a User"
                options={Object.keys(userList)}
                value={selectedUser}
                onChange={setSelectedUser}
                addRoute="/user?add=true"
              />

              {/* Website Dropdown (Auto-selected based on user) */}
              <DropdownMenu
                label="Select a Website"
                options={websites}
                isDisabled={true}
                value={selectedWebsite}
                onChange={setSelectedWebsite}
                addRoute="/website?add=true"
              />

              {/* Bank Dropdown */}
              <DropdownMenu
                label="Select a Bank"
                options={bankList}
                value={selectedBank}
                onChange={setSelectedBank}
                addRoute="/bank?add=true"
              />

              {/* Transaction Type */}
              <DropdownMenu
                label="Select Transaction Type"
                options={["Deposit", "Withdraw"]}
                value={transactionType}
                onChange={setTransactionType}
              />

              {/* Amount Input */}
              <InputField
                icon={<FaMoneyBillWave className="text-gray-600 mr-2" />}
                type="text"
                placeholder="Enter Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              {/* Submit Button */}
              <div className="flex items-center justify-center mt-2">
                <button
                  className="bg-secondary hover:bg-primary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
                  type="submit"
                >
                  {editData ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// Input Field Component
const InputField = ({
  icon,
  type,
  placeholder,
  value,
  onChange,
  onKeyDown,
}) => (
  <div className="mb-3 flex items-center border-b border-gray-300 py-1">
    {icon}
    <input
      className="appearance-none bg-transparent border-none w-full text-gray-700 py-1 px-2 leading-tight focus:outline-none text-sm"
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown} // Add the onKeyDown prop here
      style={{ appearance: "textfield" }} // Add this line to remove arrows
    />
  </div>
);

export default AddTransactionForm;
