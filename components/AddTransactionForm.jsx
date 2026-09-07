"use client";

import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import {
  FaMoneyBillWave,
  FaCheck,
  FaBolt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { DropdownMenu } from "./DropdownMenu";
import { ClipLoader } from "react-spinners";

const AddTransactionForm = ({
  setShowTransactionForm,
  fetchData,
  editData,
  onTransactionAdded,
  initialBanks = [],
  initialWebsites = [],
  initialUsers = {},
}) => {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedWebsite, setSelectedWebsite] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [transactionType, setTransactionType] = useState("Deposit");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [keepOpen, setKeepOpen] = useState(true);

  const [websites, setWebsites] = useState(initialWebsites);
  const [userList, setUserList] = useState(initialUsers);
  const [bankList, setBankList] = useState(initialBanks);

  const amountInputRef = useRef(null);

  // Initialize dropdown options from props or sessionStorage immediately
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedWebsites = JSON.parse(sessionStorage.getItem("websites") || "[]");
      const storedBanks = JSON.parse(sessionStorage.getItem("banks") || "[]");
      const storedUsers = JSON.parse(sessionStorage.getItem("users") || "{}");

      if (websites.length === 0 && storedWebsites.length > 0) setWebsites(storedWebsites);
      if (bankList.length === 0 && storedBanks.length > 0) setBankList(storedBanks);
      if (Object.keys(userList).length === 0 && Object.keys(storedUsers).length > 0) setUserList(storedUsers);
    }
  }, []);

  // Sync if parent props change
  useEffect(() => {
    if (initialWebsites && initialWebsites.length > 0) setWebsites(initialWebsites);
  }, [initialWebsites]);

  useEffect(() => {
    if (initialBanks && initialBanks.length > 0) setBankList(initialBanks);
  }, [initialBanks]);

  useEffect(() => {
    if (initialUsers && Object.keys(initialUsers).length > 0) setUserList(initialUsers);
  }, [initialUsers]);

  useEffect(() => {
    if (editData) {
      setSelectedUser(editData.username || "");
      setSelectedWebsite(editData.website_name || "");
      setSelectedBank(editData.bank_name || "");
      setTransactionType(editData.transaction_type || "Deposit");
      setAmount(editData.amount ? String(editData.amount) : "");
    }
  }, [editData]);

  // Update website name when a user is selected
  useEffect(() => {
    if (selectedUser && userList[selectedUser]) {
      setSelectedWebsite(userList[selectedUser]);
    }
  }, [selectedUser, userList]);

  // Fetch dropdown data in background ONLY if not already loaded
  useEffect(() => {
    let isMounted = true;
    const loadMissingData = async () => {
      if (typeof window === "undefined") return;
      const userRaw = sessionStorage.getItem("user");
      if (!userRaw) return;

      const user = JSON.parse(userRaw);
      const creatorParam =
        user.type === "admin" ? "" : (user.parent_user || user.username);

      const promises = [];

      if (bankList.length === 0) {
        promises.push(
          axios
            .get(`/api/banks?onlyNames=true&group=${user.group}&userType=${user.type}&createdBy=${creatorParam}`)
            .then((res) => {
              const data = res.data?.data || [];
              if (isMounted) setBankList(data);
              sessionStorage.setItem("banks", JSON.stringify(data));
            })
            .catch((err) => console.error("Error fetching banks:", err))
        );
      }

      if (websites.length === 0) {
        promises.push(
          axios
            .get(`/api/websites?onlyNames=true&group=${user.group}&userType=${user.type}&createdBy=${creatorParam}`)
            .then((res) => {
              const data = res.data?.data || [];
              if (isMounted) setWebsites(data);
              sessionStorage.setItem("websites", JSON.stringify(data));
            })
            .catch((err) => console.error("Error fetching websites:", err))
        );
      }

      if (Object.keys(userList).length === 0) {
        promises.push(
          axios
            .get(`/api/users?onlyNames=true&group=${user.group}&userType=${user.type}&createdBy=${creatorParam}`)
            .then((res) => {
              const data = res.data?.data || {};
              if (isMounted) setUserList(data);
              sessionStorage.setItem("users", JSON.stringify(data));
            })
            .catch((err) => console.error("Error fetching users:", err))
        );
      }

      if (promises.length > 0) {
        await Promise.allSettled(promises);
      }
    };

    loadMissingData();
    return () => {
      isMounted = false;
    };
  }, [bankList.length, websites.length, userList]);

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
    const dataOwner = user.parent_user || user.username;

    setSubmitting(true);
    try {
      const response = await axios.post("/api/transactions", {
        username: selectedUser,
        website_name: selectedWebsite,
        bank_name: selectedBank,
        transaction_type: transactionType,
        amount: numericAmount,
        created_by: dataOwner,
        group: user.group,
      });

      const newTx = response.data?.data;
      toast.success(response.data?.message || "Transaction created successfully");

      // Instantly update parent table without blocking or full reload
      if (onTransactionAdded && newTx) {
        onTransactionAdded(newTx);
      } else if (fetchData) {
        fetchData(false); // Silent background fetch
      }

      if (keepOpen && !editData) {
        // Fast consecutive entry: Keep bank & website, reset user & amount
        setSelectedUser("");
        setAmount("");
        if (amountInputRef.current) {
          amountInputRef.current.focus();
        }
      } else {
        resetForm();
        if (setShowTransactionForm) {
          setShowTransactionForm(false);
        }
      }
    } catch (error) {
      console.error("Error processing transaction:", error);
      toast.error(error.response?.data?.message || "Transaction failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedUser("");
    setSelectedWebsite("");
    setSelectedBank("");
    setTransactionType("Deposit");
    setAmount("");
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 border-b pb-3">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FaBolt className="text-amber-500" />
          {editData ? "Edit Flow" : "Fast Flow Entry"}
        </h2>
        {!editData && (
          <label className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer select-none bg-gray-100 px-2.5 py-1.5 rounded-md hover:bg-gray-200 transition-colors">
            <input
              type="checkbox"
              checked={keepOpen}
              onChange={(e) => setKeepOpen(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0 cursor-pointer"
            />
            Keep form open for rapid entry
          </label>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
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
          inputRef={amountInputRef}
          icon={<FaMoneyBillWave className="text-gray-500 mr-2" />}
          type="number"
          placeholder="Enter Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            disabled={submitting}
            className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-md shadow-sm transition-all duration-150 flex items-center justify-center text-sm ${
              submitting ? "opacity-75 cursor-not-allowed" : "active:scale-[0.98]"
            }`}
            type="submit"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <ClipLoader size={16} color="#ffffff" />
                <span>Processing...</span>
              </span>
            ) : editData ? (
              "Update Flow"
            ) : (
              <span className="flex items-center gap-1.5">
                <FaCheck size={12} />
                <span>Add Flow</span>
              </span>
            )}
          </button>

          {setShowTransactionForm && (
            <button
              type="button"
              disabled={submitting}
              onClick={() => setShowTransactionForm(false)}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

// Input Field Component
const InputField = ({
  inputRef,
  icon,
  type,
  placeholder,
  value,
  onChange,
  onKeyDown,
}) => (
  <div className="mb-3">
    <label className="block text-gray-700 font-bold mb-1 text-sm">Amount</label>
    <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
      {icon}
      <input
        ref={inputRef}
        className="appearance-none bg-transparent border-none w-full text-gray-800 text-sm leading-tight focus:outline-none"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        min="0.01"
        step="any"
        required
      />
    </div>
  </div>
);

export default AddTransactionForm;
