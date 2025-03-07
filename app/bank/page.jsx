"use client";

import React, { useEffect, useState, Suspense } from "react";
import AddBankForm from "@/components/AddBankForm";
import Navbar from "@/components/Navbar";
import axios from "axios";
import { toast } from "react-toastify";
import { useSearchParams, useRouter } from "next/navigation"; // Add useRouter
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

const PageContent = () => {
  const router = useRouter(); // Add router for navigation
  const searchParams = useSearchParams();
  const [showAddBankForm, setShowAddBankForm] = useState(
    searchParams.get("add") === "true"
  );
  const [search, setSearch] = useState("");
  const [searchValue, setSearchValue] = useState(""); // For immediate input updates
  const [debouncedSearch] = useDebounce(searchValue, 500); // 500ms debounce
  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [data, setData] = useState([]);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // Update search state when debounced value changes
  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch]);

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchValue(value);
    // No immediate setSearch, will be handled by the debounced effect
  };

  const itemsPerPage = 20;

  const fetchBankData = async () => {
    setLoading(true);
    try {
      const { data: responseData } = await axios.get(
        `/api/banks?search=${
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

  const handleStatusChange = async (bank_name, value) => {
    if (confirm("Are you sure you want to change this status?")) {
      try {
        const response = await axios.put(
          `/api/banks?value=${value}&bank_name=${bank_name}`
        );

        console.log(response);

        if (response.status === 200) {
          toast.success("Status updated successfully");
          fetchBankData();
        } else {
          toast.error("Failed to update status.");
        }
      } catch (error) {
        toast.error("Error updating status.");
      }
    }
  };

  // Compute total pages
  const computedTotalPages = Math.ceil(totalData / itemsPerPage);
  const currentRows = data.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
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
                    placeholder="Search banks..."
                    value={searchValue}
                    onChange={handleSearchChange}
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>

            {data.length > 0 ? (
              <table className="w-full border-collapse">
                <thead className="text-left text-white bg-secondary">
                  <tr>
                    <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                      Check
                    </th>
                    <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                      Bank Name
                    </th>
                    <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                      IFSC Code
                    </th>
                    <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                      Account Number
                    </th>
                    <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                      Current Balance
                    </th>
                    <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                      Created By
                    </th>
                    <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                      Created At
                    </th>

                    <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={`text-center ${
                        row.check ? "bg-yellow-100" : ""
                      }`}
                    >
                      <td className="px-4 py-2 border border-gray-600 text-center">
                        <input
                          type="checkbox"
                          checked={row.check}
                          onChange={async (e) => {
                            await handleStatusChange(
                              row.bank_name,
                              e.target.checked
                            );
                          }}
                        />
                      </td>
                      <td
                        className="px-4 py-2 border border-gray-600 hover:underline cursor-pointer"
                        onClick={() =>
                          router.push(`/transaction?search=${row?.bank_name}`)
                        }
                        title={`Search transactions for ${row?.bank_name}`}
                      >
                        {row?.bank_name}
                      </td>
                      <td
                        className="px-4 py-2 border border-gray-600 hover:underline cursor-pointer"
                        onClick={() =>
                          router.push(`/transaction?search=${row?.ifsc_code}`)
                        }
                        title={`Search transactions for ${row?.ifsc_code}`}
                      >
                        {row?.ifsc_code}
                      </td>
                      <td className="px-4 py-2 border border-gray-600">
                        {row?.account_number?.toString()}
                      </td>
                      <td className="px-4 py-2 border border-gray-600">
                        ₹ {row?.current_balance?.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-2 border border-gray-600">
                        {row?.created_by}
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
                          className="text-blue-500 mr-2"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(row.bank_name)}
                          className="text-red-500 hover:text-red-700"
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
