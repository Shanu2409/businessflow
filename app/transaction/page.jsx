"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import AddTransactionForm from "@/components/AddTransactionForm";
import Navbar from "@/components/Navbar";
import { Table } from "@/components/Table";
import axios from "axios";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";

const PageContent = () => {
  const searchParams = useSearchParams();
  const [showTransactionForm, setShowTransactionForm] = useState(
    searchParams.get("add") === "true"
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [data, setData] = useState([]);
  const [editData, setEditData] = useState(null);

  // Fetch Transactions (Optimized with useCallback)
  const fetchTransactions = useCallback(async () => {
    const searchQuery = searchParams.get("search") || "";
    try {
      const { data: responseData } = await axios.get(
        `/api/transactions?search=${
          search || searchQuery
        }&page=${page}&limit=20`
      );
      setData(responseData?.data || []);
      setTotalData(responseData?.totalData || 0);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions.");
    }
  }, [search, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Delete Transaction
  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      try {
        const response = await axios.delete(`/api/transactions/${id}`);
        toast.success(response?.data?.message || "Transaction deleted.");
        fetchTransactions();
      } catch (error) {
        console.error("Error deleting transaction:", error);
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
    if (showTransactionForm) setEditData(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header & Form Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white px-6 py-4 rounded-lg shadow-md">
          <h1 className="text-3xl font-semibold text-gray-800">Transactions</h1>
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
          <div className="bg-white p-6 rounded-lg shadow-md">
            <AddTransactionForm
              editData={editData}
              setShowTransactionForm={setShowTransactionForm}
              fetchData={fetchTransactions}
            />
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Table
            setSearch={setSearch}
            fetchData={fetchTransactions}
            rows={data}
            totalData={totalData}
            page={page}
            setPage={setPage}
            handleDelete={handleDelete}
            handleIsEdit={handleEdit}
            showCheckRecheck={true}
            showDelete={false}
            showEdit={false}
          />
        </div>
      </div>
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
