"use client";

import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import {
  FaUniversity,
  FaGlobe,
  FaBuilding,
  FaExchangeAlt,
  FaMoneyBillWave,
  FaPlus,
} from "react-icons/fa";
import { toast } from "react-toastify";
import FullScreenLoader from "./FullScreenLoader";
import { useRouter } from "next/navigation";

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
        <div className="max-w-md mx-auto p-4">
          <h2 className="text-2xl font-bold text-center mb-6">
            {editData ? "Edit Transaction" : "Add Transaction"}
          </h2>
          <form
            onSubmit={handleSubmit}
            className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
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
              icon={<FaMoneyBillWave className="text-gray-600 mr-3" />}
              type="text"
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
        </div>
      )}
    </>
  );
};

// Dropdown Component
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
    option.toLowerCase().startsWith(searchTerm.toLowerCase())
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
          className={`border border-gray-300 rounded-md p-2 flex items-center justify-between cursor-pointer bg-white flex-grow`}
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
            onChange={(e) => setSearchTerm(e.target.value)}
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

// Input Field Component
const InputField = ({
  icon,
  type,
  placeholder,
  value,
  onChange,
  onKeyDown,
}) => (
  <div className="mb-6 flex items-center border-b border-gray-300 py-2">
    {icon}
    <input
      className="appearance-none bg-transparent border-none w-full text-gray-700 py-1 px-2 leading-tight focus:outline-none"
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
