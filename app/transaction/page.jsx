"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import AddTransactionForm from "@/components/AddTransactionForm";
import Navbar from "@/components/Navbar";
import axios from "axios";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useDebounce } from "use-debounce";
import {
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { useRouter } from "next/navigation";

const PageContent = () => {
  const searchParams = useSearchParams();
  const [showTransactionForm, setShowTransactionForm] = useState(
    searchParams.get("add") === "true"
  );
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [searchValue, setSearchValue] = useState(search); // Input field value
  const [debouncedSearch] = useDebounce(searchValue, 500); // Add 500ms debounce
  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [data, setData] = useState([]);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [selectAllCheck, setSelectAllCheck] = useState(false);
  const [selectAllReCheck, setSelectAllReCheck] = useState(false);
  const [sortLabel, setSortLabel] = useState("");
  const [isBankEnabled, setIsBankEnabled] = useState(true);
  const router = useRouter();

  // Get user from sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = JSON.parse(sessionStorage.getItem("user"));
      setUser(userData);
    }
  }, []);

  const fetchBankList = async () => {
    try {
      const { data: responseData } = await axios.get(
        `/api/banks?onlyNames=true`
      );
      if (typeof window !== "undefined") {
        sessionStorage.setItem("banks", JSON.stringify(responseData?.data));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // Fetch Transactions (Optimized with useCallback)
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: responseData } = await axios.get(
        `/api/transactions?search=${search}&page=${page}&limit=20&sort=${sortLabel}`
      );
      setData(responseData?.data || []);
      setTotalData(responseData?.totalData || 0);
    } catch (error) {
      toast.error("Failed to load transactions.");
    }
    setLoading(false);
  }, [search, page, sortLabel]);

  // Update useEffect to listen for debounced search changes
  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchTransactions();
    fetchBankList(); // Also fetch bank list on component mount
  }, [fetchTransactions]);

  // Ensure search value updates but doesn't immediately trigger fetch
  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchValue(value);
    // Removed the immediate setSearch call; now handled by the debounced effect
  };

  // Delete Transaction
  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      try {
        await axios.delete(`/api/transactions/${id}`);
        toast.success("Transaction deleted.");
        fetchTransactions();
      } catch (error) {
        toast.error("Failed to delete transaction.");
      }
    }
  };

  // Toggle Form Visibility
  const toggleForm = () => {
    setShowTransactionForm((prev) => !prev);
    if (!showTransactionForm) setEditData(null);
  };

  // Format Data for Display
  const formatEntry = (entry, key) => {
    if (typeof entry === "boolean") return entry ? "✅" : "❌";
    if (key === "createdAt" && !isNaN(Date.parse(entry))) {
      return new Intl.DateTimeFormat("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(entry));
    }
    if (key === "current_balance" && typeof entry === "number") {
      return `${entry.toLocaleString("en-IN")}`;
    }
    return entry;
  };

  const handleStatusChange = async (id, key, value) => {
    try {
      const response = await axios.put(
        `/api/transactions?field=${key}&value=${value}&tid=${id}`
      );

      if (response.status === 200) {
        toast.success("Status updated successfully");
        fetchTransactions(); // Refresh data after update
      } else {
        toast.error("Failed to update status.");
      }
    } catch (error) {
      toast.error("Error updating status.");
    }
  };

  // Handle check all functionality
  const handleCheckAll = async (checked) => {
    setSelectAllCheck(checked);
    setLoading(true);

    try {
      // Get all transaction IDs in current view
      const transactionIds = currentRows.map((row) => row._id);

      // Send bulk update request with all IDs in body
      await axios.post("/api/transactions/all", {
        list: transactionIds,
        label: "check",
        value: checked,
      });

      toast.success(checked ? "All items checked" : "All items unchecked");
      fetchTransactions();
    } catch (error) {
      toast.error("Failed to update check status for all items");
      console.error("Error updating check status:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle re-check all functionality (only for items that are checked)
  const handleReCheckAll = async (checked) => {
    setLoading(true);

    try {
      // Get transaction IDs only for items that have check set to true
      const transactionIds = currentRows
        .filter((row) => row.check === true)
        .map((row) => row._id);

      // Only make API call if there are IDs to update
      if (transactionIds.length > 0) {
        // Send bulk update request with all IDs in body
        await axios.post("/api/transactions/all", {
          list: transactionIds,
          label: "re_check",
          value: checked,
        });

        setSelectAllReCheck(checked);
        toast.success(checked ? "All items re-checked" : "All items unchecked");
      } else {
        toast.info("No eligible items to update");
      }

      fetchTransactions();
    } catch (error) {
      toast.error("Failed to update re-check status");
      console.error("Error updating re-check status:", error);
    } finally {
      setLoading(false);
    }
  };

  // Compute Pagination
  const itemsPerPage = 20;
  const computedTotalPages = Math.ceil(totalData / itemsPerPage);
  const currentRows = data; // Since API already returns paginated data

  // Compute Columns
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header & Form Toggle */}
        <div className="bg-white px-6 py-4 rounded-lg shadow-md">
          <div
            className={`flex flex-col sm:flex-row justify-between items-center transition-all duration-300 ${
              showTransactionForm ? "mb-4" : ""
            }`}
          >
            <h1 className="text-3xl font-semibold text-gray-800 transition-all duration-300">
              {showTransactionForm ? "Add New Transaction" : "Transactions"}
            </h1>
            <button
              className={`px-6 py-2 rounded-md font-semibold shadow transition duration-300 ${
                showTransactionForm
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
              onClick={toggleForm}
            >
              {showTransactionForm ? "Cancel" : "Add Transaction"}
            </button>
          </div>

          {/* Transaction Form */}
          {showTransactionForm && (
            <div className="mt-4 bg-white p-6 rounded-lg shadow-md border border-gray-300 transition-all duration-300">
              <AddTransactionForm
                editData={editData}
                setShowTransactionForm={setShowTransactionForm}
                fetchData={fetchTransactions}
              />
            </div>
          )}
        </div>

        {/* Filter & Sorting Sidebar */}
        <div className="flex flex-col md:flex-row w-full mt-4 space-y-4 md:space-y-0 md:space-x-4">
          {/* Filter & Search Section */}
          <div className="md:w-3/4 w-full p-4 bg-white rounded-lg shadow-md">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center w-full mb-4"
            >
              {isFilterOpen ? (
                <FaChevronUp className="mr-2" />
              ) : (
                <FaChevronDown className="mr-2" />
              )}
              <span className="text-lg font-semibold">Filter & Search</span>
            </button>

            {isFilterOpen && (
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchValue}
                onChange={handleSearchChange}
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Bank & Website Toggle Switch */}
          <div className="md:w-1/4 w-full bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-center md:text-left">
              Select Mode
            </h2>
            <div className="flex justify-center md:justify-start items-center space-x-4">
              {/* Label for Website (OFF State) */}
              <span
                className={`font-semibold ${
                  !isBankEnabled ? "text-blue-600" : "text-gray-500"
                }`}
              >
                Website
              </span>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBankEnabled}
                  onChange={() => {
                    setIsBankEnabled((prev) => !prev);
                  }}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-all relative">
                  <div
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all ${
                      isBankEnabled ? "translate-x-7" : ""
                    }`}
                  ></div>
                </div>
              </label>

              {/* Label for Bank (ON State) */}
              <span
                className={`font-semibold ${
                  isBankEnabled ? "text-green-600" : "text-gray-500"
                }`}
              >
                Bank
              </span>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="w-full overflow-x-auto">
            {/* Pagination Controls */}
            {data.length > 0 && (
              <div className="flex justify-between items-center m-4">
                <span className="text-gray-700">
                  Total Data: {totalData} | Page {page} of {computedTotalPages}
                </span>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="p-2 bg-gray-200 rounded"
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    onClick={() =>
                      setPage((prev) => Math.min(prev + 1, computedTotalPages))
                    }
                    disabled={page === computedTotalPages}
                    className="p-2 bg-gray-200 rounded"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            )}

            <table className="w-full border-collapse whitespace-nowrap">
              <thead className="text-left text-white bg-primary">
                <tr>
                  <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                    Sr. No.
                  </th>
                  <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                    Check
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        checked={selectAllCheck}
                        onChange={(e) => handleCheckAll(e.target.checked)}
                        className="mr-1"
                      />
                      <span className="text-xs">All</span>
                    </div>
                  </th>
                  <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                    Re Check
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        checked={selectAllReCheck}
                        onChange={(e) => handleReCheckAll(e.target.checked)}
                        className="mr-1"
                      />
                      <span className="text-xs">All</span>
                    </div>
                  </th>
                  <th
                    className="px-4 py-2 border border-gray-600 cursor-pointer hover:underline"
                    onClick={() =>
                      setSortLabel((prev) =>
                        prev === "username" ? "-username" : "username"
                      )
                    }
                  >
                    User
                  </th>
                  <th
                    className="px-4 py-2 border border-gray-600 cursor-pointer hover:underline"
                    onClick={() =>
                      setSortLabel((prev) =>
                        prev === "website_name"
                          ? "-website_name"
                          : "website_name"
                      )
                    }
                  >
                    Website
                  </th>
                  <th
                    className="px-4 py-2 border border-gray-600 cursor-pointer hover:underline"
                    onClick={() =>
                      setSortLabel((prev) =>
                        prev === "bank_name" ? "-bank_name" : "bank_name"
                      )
                    }
                  >
                    Bank
                  </th>
                  <th
                    className="px-4 py-2 border border-gray-600 cursor-pointer hover:underline"
                    onClick={() =>
                      setSortLabel((prev) =>
                        prev === "created_by" ? "-created_by" : "created_by"
                      )
                    }
                  >
                    Created By
                  </th>
                  <th
                    className="px-4 py-2 border border-gray-600 cursor-pointer hover:underline"
                    onClick={() =>
                      setSortLabel((prev) =>
                        prev === "transaction_type"
                          ? "-transaction_type"
                          : "transaction_type"
                      )
                    }
                  >
                    Type
                  </th>
                  <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                    Current Balance
                  </th>
                  <th
                    className="px-4 py-2 border border-gray-600 cursor-pointer hover:underline"
                    onClick={() =>
                      setSortLabel((prev) =>
                        prev === "createdAt" ? "-createdAt" : "createdAt"
                      )
                    }
                  >
                    Amount
                  </th>
                  <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                    Effective Balance
                  </th>
                  <th
                    className="px-4 py-2 border border-gray-600 cursor-pointer hover:underline"
                    onClick={() =>
                      setSortLabel((prev) =>
                        prev === "amount" ? "-amount" : "amount"
                      )
                    }
                  >
                    Created On
                  </th>
                  {/* {user?.type === "admin" && (
                    <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                      ACTIONS
                    </th>
                  )} */}
                </tr>
              </thead>
              <tbody>
                {currentRows.length > 0 ? (
                  currentRows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={`text-black ${
                        row.check == "true" && row.re_check == "true"
                          ? "text-gray-800 bg-gray-100"
                          : row.check == "true"
                          ? "bg-yellow-100"
                          : row.re_check == "true"
                          ? "text-gray-800 bg-gray-100"
                          : isBankEnabled
                          ? row.transaction_type === "Deposit"
                            ? "text-green-800 bg-green-100"
                            : "text-red-800 bg-red-100"
                          : row.transaction_type === "Deposit"
                          ? "text-red-800 bg-red-100"
                          : "text-green-800 bg-green-100"
                      }`}
                    >
                      <td className="px-4 py-2 border border-gray-600 text-center">
                        {rowIndex + 1 + (page - 1) * itemsPerPage}
                      </td>

                      <td className="px-4 py-2 border border-gray-600 text-center">
                        <input
                          type="checkbox"
                          checked={row.check}
                          onChange={async (e) => {
                            await handleStatusChange(
                              row._id,
                              "check",
                              e.target.checked
                            );
                          }}
                        />
                      </td>
                      <td className="px-4 py-2 border border-gray-600 text-center">
                        <input
                          type="checkbox"
                          checked={row.re_check}
                          disabled={!row.check}
                          onChange={async (e) => {
                            await handleStatusChange(
                              row._id,
                              "re_check",
                              e.target.checked
                            );
                          }}
                        />
                      </td>
                      <td
                        className="px-4 py-2 border border-gray-600"
                        title={row.username}
                      >
                        {row.username}
                      </td>
                      <td className="px-4 py-2 border border-gray-600">
                        {row.website_name}
                      </td>
                      <td className="px-4 py-2 border border-gray-600">
                        {row.bank_name}
                      </td>
                      <td className="px-4 py-2 border border-gray-600">
                        {row.created_by}
                      </td>
                      <td className="px-4 py-2 border border-gray-600">
                        {isBankEnabled
                          ? row.transaction_type
                          : row.transaction_type === "Deposit"
                          ? "Withdraw"
                          : "Deposit"}
                      </td>
                      {isBankEnabled ? (
                        <td className="px-4 py-2 border border-gray-600">
                          {Number(row.old_bank_balance).toLocaleString("en-IN")}
                        </td>
                      ) : (
                        <td className="px-4 py-2 border border-gray-600">
                          {Number(row.old_website_balance).toLocaleString(
                            "en-IN"
                          )}
                        </td>
                      )}
                      <td className="px-4 py-2 border border-gray-600">
                        {Number(row.amount).toLocaleString("en-IN")}
                      </td>
                      {
                        <td className="px-4 py-2 border border-gray-600">
                          {isBankEnabled
                            ? Number(row.effective_balance).toLocaleString(
                                "en-IN"
                              )
                            : Number(row.new_website_balance).toLocaleString(
                                "en-IN"
                              )}
                        </td>
                      }
                      <td className="px-4 py-2 border border-gray-600">
                        {new Intl.DateTimeFormat("en-IN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(row.createdAt))}
                      </td>
                      {/* {user?.type === "admin" && (
                        <td className="px-4 py-2 border border-gray-600 text-center">
                          <button
                          onClick={() => handleEdit(row)}
                          className="text-blue-500 mr-2"
                        >
                          <FaEdit />
                        </button>
                          <button
                            onClick={() => handleDelete(row._id)}
                            className="text-red-500"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      )} */}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} className="text-center py-4">
                      <div className="flex flex-col items-center">
                        <h1 className="text-2xl font-semibold text-gray-700 mb-2">
                          No transactions found
                        </h1>
                        <p className="text-gray-500">
                          Try expanding your search criteria to find more
                          results.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <FullScreenLoader isLoading={loading} />
    </div>
  );
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-10">Loading transactions...</div>
      }
    >
      <PageContent />
    </Suspense>
  );
}
