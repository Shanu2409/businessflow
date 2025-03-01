"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import AddTransactionForm from "@/components/AddTransactionForm";
import Navbar from "@/components/Navbar";
import axios from "axios";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";
import FullScreenLoader from "@/components/FullScreenLoader";
import {
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

const PageContent = () => {
  const searchParams = useSearchParams();
  const [showTransactionForm, setShowTransactionForm] = useState(
    searchParams.get("add") === "true"
  );
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [searchValue, setSearchValue] = useState(search); // Input field value
  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [data, setData] = useState([]);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // Fetch Transactions (Optimized with useCallback)
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: responseData } = await axios.get(
        `/api/transactions?search=${search}&page=${page}&limit=20`
      );
      setData(responseData?.data || []);
      setTotalData(responseData?.totalData || 0);
    } catch (error) {
      toast.error("Failed to load transactions.");
    }
    setLoading(false);
  }, [search, page]);

  // Update useEffect to listen for search changes
  useEffect(() => {
    fetchTransactions();
  }, [search]); // ✅ Now fetches data when `search` changes

  // Ensure search value updates and triggers fetching
  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchValue(value);
    setSearch(value); // ✅ This will now trigger fetchTransactions()
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

  // Edit Transaction
  const handleEdit = (transaction) => {
    setEditData(transaction);
    setShowTransactionForm(true);
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
      return `₹ ${entry.toLocaleString("en-IN")}`;
    }
    return entry;
  };

  const handleStatusChange = async (id, key, value) => {
    if (confirm("Are you sure you want to change this status?")) {
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
    }
  };

  // Compute Pagination
  const itemsPerPage = 20;
  const computedTotalPages = Math.ceil(totalData / itemsPerPage);
  const currentRows = data.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Compute Columns
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const displayColumns = columns.filter(
    (col) => col !== "check" && col !== "recheck"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header & Form Toggle */}
        <div className="bg-white px-6 py-4 rounded-lg shadow-md">
          <div
            className={`flex flex-col sm:flex-row justify-between items-center transition-all duration-300 ${showTransactionForm ? "mb-4" : ""
              }`}
          >
            <h1 className="text-3xl font-semibold text-gray-800 transition-all duration-300">
              {showTransactionForm ? "Add New Transaction" : "Transactions"}
            </h1>
            <button
              className={`px-6 py-2 rounded-md font-semibold shadow transition duration-300 ${showTransactionForm
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
        <div className="w-full mt-4">
          <div className="p-4 bg-white rounded-lg shadow-md">
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
                onChange={handleSearchChange} // ✅ Dynamic search update
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse whitespace-nowrap">
              <thead className="text-left text-white bg-primary">
                <tr>
                  <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                    Check
                  </th>
                  <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                    Re Check
                  </th>
                  <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                    User
                  </th>
                  <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                    Website
                  </th>
                  <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                    Bank
                  </th>
                  <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                    Created By
                  </th>
                  <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                    Type
                  </th>
                  <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                    Current Balance
                  </th>
                  <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                    Amount
                  </th>
                  <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                    Effective Balance
                  </th>
                  <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                    Created On
                  </th>
                  <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentRows.length > 0 ? (
                  currentRows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={`text-black ${row.check == "true" && row.re_check == "true"
                        ? "text-gray-800 bg-gray-100"
                        : row.check == "true"
                        ? "text-yellow-800 bg-yellow-100"
                        : row.re_check == "true"
                        ? "text-gray-800 bg-gray-100"
                        : row.transaction_type === "Deposit"
                        ? "text-green-800 bg-green-100"
                        : "text-red-800 bg-red-100"
                    }`}
                    
                    >

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
                      <td className="px-4 py-2 border border-gray-600">
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
                        {row.transaction_type}
                      </td>
                      <td className="px-4 py-2 border border-gray-600">
                        {row.old_bank_balance}
                      </td>
                      <td className="px-4 py-2 border border-gray-600">
                        {row.amount}
                      </td>
                      <td className="px-4 py-2 border border-gray-600">
                        {row.effective_balance}
                      </td>
                      <td className="px-4 py-2 border border-gray-600">
                        {new Intl.DateTimeFormat("en-IN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(row.createdAt))}
                      </td>
                      <td className="px-4 py-2 border border-gray-600 text-center">
                        {/* <button
                          onClick={() => handleEdit(row)}
                          className="text-blue-500 mr-2"
                        >
                          <FaEdit />
                        </button> */}
                        <button
                          onClick={() => handleDelete(row._id)}
                          className="text-red-500"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} className="text-center py-4">
                      No transactions found.
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
