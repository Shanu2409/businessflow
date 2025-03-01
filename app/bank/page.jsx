"use client";

import React, { useEffect, useState, Suspense } from "react";
import AddBankForm from "@/components/AddBankForm";
import Navbar from "@/components/Navbar";
import axios from "axios";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";
import FullScreenLoader from "@/components/FullScreenLoader";
import { FaChevronLeft, FaChevronRight, FaEdit, FaTrash } from "react-icons/fa";

const PageContent = () => {
  const searchParams = useSearchParams();
  const [showAddBankForm, setShowAddBankForm] = useState(searchParams.get("add") === "true");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [data, setData] = useState([]);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(false);

  const itemsPerPage = 20;

  const fetchBankData = async () => {
    setLoading(true);
    try {
      const { data: responseData } = await axios.get(
        `/api/banks?search=${search || searchParams.get("search") || ""}&page=${page}&limit=${itemsPerPage}`
      );
      setData(responseData?.data);
      setTotalData(responseData?.totalData);
    } catch (error) {
      console.error("Error fetching bank data:", error);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this bank account?")) {
      try {
        await axios.delete(`/api/banks/${id}`);
        toast.success("Bank account deleted successfully.");
        fetchBankData();
      } catch (error) {
        console.error("Error deleting bank:", error);
      }
    }
  };

  const handleIsEdit = (data) => {
    setEditData(data);
    setShowAddBankForm(true);
  };

  useEffect(() => {
    fetchBankData();
  }, [search, page]);

  // Format data for display
  const formatEntry = (entry, key) => {
    if (typeof entry === "boolean") return entry ? "✅" : "❌";
    if (key === "createdAt") return new Date(entry).toLocaleDateString("en-IN");
    if (key === "current_balance") return `₹ ${entry.toLocaleString("en-IN")}`;
    return entry;
  };

  // Compute total pages
  const computedTotalPages = Math.ceil(totalData / itemsPerPage);
  const currentRows = data.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const displayColumns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header & Toggle Form Button */}
          <div className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 py-4 bg-white rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
              Bank Details
            </h1>
            <button
              className="bg-secondary text-white font-semibold px-6 py-2 rounded transition duration-300 shadow"
              onClick={() => {
                setShowAddBankForm(!showAddBankForm);
                setEditData(null);
              }}
            >
              {showAddBankForm ? "Cancel" : "Add Bank"}
            </button>
          </div>

          {/* Add Bank Form */}
          {showAddBankForm && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <AddBankForm
                editData={editData}
                setShowAddBankForm={setShowAddBankForm}
                fetchData={fetchBankData}
              />
            </div>
          )}

          {/* Table Section */}
          <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
            {data.length > 0 ? (
              <table className="w-full border-collapse">
                <thead className="text-left text-white bg-primary">
                  <tr>
                    {displayColumns.map((col, index) => (
                      <th key={index} className="px-4 py-2 border border-gray-600 text-sm text-center">
                        {col.replace("_", " ").toUpperCase()}
                      </th>
                    ))}
                    <th className="px-4 py-2 border border-gray-600 text-sm text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {displayColumns.map((col, index) => (
                        <td key={index} className="px-4 py-2 border border-gray-600">
                          {formatEntry(row[col], col)}
                        </td>
                      ))}
                      <td className="px-4 py-2 border border-gray-600">
                        <button onClick={() => handleIsEdit(row)} className="text-blue-500 mr-2">
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDelete(row._id)} className="text-red-500 hover:text-red-700">
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <h1 className="text-center mt-4">No results... Try expanding the search</h1>
            )}

            {/* Pagination Controls */}
            {data.length > 0 && (
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-700">Total Data: {totalData} | Page {page} of {computedTotalPages}</span>
                <div className="flex items-center space-x-4">
                  <button onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1} className="p-2 bg-gray-200 rounded">
                    <FaChevronLeft />
                  </button>
                  <button onClick={() => setPage((prev) => Math.min(prev + 1, computedTotalPages))} disabled={page === computedTotalPages} className="p-2 bg-gray-200 rounded">
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <FullScreenLoader isLoading={loading} />
    </>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<div>Loading bank page...</div>}>
      <PageContent />
    </Suspense>
  );
}
