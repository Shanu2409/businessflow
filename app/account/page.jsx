"use client";

import React, { useEffect, useState, Suspense } from "react";
import AddBankForm from "@/components/AddBankForm";
import Navbar from "@/components/Navbar";
import axios from "axios";
import { toast } from "react-toastify";
import { useSearchParams, useRouter } from "next/navigation"; // Add useRouter
import FullScreenLoader from "@/components/FullScreenLoader";
import { useDebounce } from "use-debounce"; // Import useDebounce
import {
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaChevronUp,
  FaChevronDown,
} from "react-icons/fa";
import AddAccountForm from "@/components/AddAccountForm";

const PageContent = () => {
  const router = useRouter(); // Add router for navigation
  const searchParams = useSearchParams();
  const [showAddAccountForm, setShowAddAccountForm] = useState(
    searchParams.get("add") === "true"
  );
  const [search, setSearch] = useState("");
  const [searchValue, setSearchValue] = useState(""); // New state for immediate input updates
  const [debouncedSearch] = useDebounce(searchValue, 500); // 500ms debounce
  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [data, setData] = useState([]);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({}); // Track password visibility
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // Update search state when debounced value changes
  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch]);

  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchValue(value); // Update input field value immediately
    // No immediate setSearch - handled by debounce effect
  };

  const itemsPerPage = 20;

  const fetchBankData = async () => {
    setLoading(true);
    try {
      const { data: responseData } = await axios.get(
        `/api/accounts?search=${
          search || searchParams.get("search") || ""
        }&page=${page}&limit=${itemsPerPage}`
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
        await axios.delete(`/api/accounts/${id}`);
        toast.success("Bank account deleted successfully.");
        fetchBankData();
      } catch (error) {
        console.error("Error deleting bank:", error);
      }
    }
  };

  const handleIsEdit = (data) => {
    setEditData(data);
    setShowAddAccountForm(true);
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswords((prev) => ({
      ...prev,
      [id]: !prev[id], // Toggle only for the clicked row
    }));
  };

  useEffect(() => {
    fetchBankData();
  }, [search, page]);

  const computedTotalPages = Math.ceil(totalData / itemsPerPage);
  const currentRows = data.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header & Toggle Form Button */}
          <div className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 py-4 bg-white rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
              Accounts Details
            </h1>
            <button
              className="bg-blue-600 text-white font-semibold px-6 py-2 rounded transition duration-300 hover:bg-blue-700 shadow"
              onClick={() => {
                setShowAddAccountForm(!showAddAccountForm);
                setEditData(null);
              }}
            >
              {showAddAccountForm ? "Cancel" : "Add Account"}
            </button>
          </div>

          {/* Add Bank Form */}
          {showAddAccountForm && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <AddAccountForm
                editData={editData}
                setShowAddAccountForm={setShowAddAccountForm}
                fetchData={fetchBankData}
              />
            </div>
          )}

          {/* Table Section */}
          <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
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
                    placeholder="Search accounts..."
                    value={searchValue}
                    onChange={handleSearchChange}
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>
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
                    className="p-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    onClick={() =>
                      setPage((prev) => Math.min(prev + 1, computedTotalPages))
                    }
                    disabled={page === computedTotalPages}
                    className="p-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            )}

            {data.length > 0 ? (
              <table className="w-full border-collapse">
                <thead className="text-left text-white bg-blue-600">
                  <tr>
                    <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                      Account Name
                    </th>
                    <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                      Password
                    </th>
                    <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                      Created At
                    </th>
                    <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, index) => (
                    <tr
                      key={index}
                      className="text-center border border-gray-300"
                    >
                      <td
                        className="px-4 py-2 border border-gray-600 hover:underline cursor-pointer text-blue-600"
                        onClick={() =>
                          router.push(`/transfer?search=${row?.username}`)
                        }
                        title={`View transfers for ${row?.username}`}
                      >
                        {row?.username}
                      </td>
                      <td className="px-4 py-2 border border-gray-600 flex justify-center items-center space-x-2">
                        <span>
                          {showPasswords[row.username]
                            ? row?.password
                            : "•".repeat(row?.password.length)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevents triggering row click event
                            togglePasswordVisibility(row.username);
                          }}
                          className="text-gray-600 hover:text-gray-800 transition"
                          title="Show/Hide Password"
                        >
                          {showPasswords[row.username] ? (
                            <FaEyeSlash />
                          ) : (
                            <FaEye />
                          )}
                        </button>
                      </td>

                      <td className="px-4 py-2 border border-gray-600">
                        {new Intl.DateTimeFormat("en-IN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(row?.createdAt))}
                      </td>
                      <td className="px-4 py-2 border border-gray-600">
                        <button
                          onClick={() => handleIsEdit(row)}
                          className="text-blue-500 mr-2 hover:text-blue-700 transition"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(row.username)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center mt-4">
                <h1 className="text-2xl font-semibold text-gray-700 mb-2">
                  No results found
                </h1>
                <p className="text-gray-500">
                  Try expanding your search criteria to find more results.
                </p>
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
