"use client";

import React, { useEffect, useState, Suspense } from "react";
import Navbar from "@/components/Navbar";
import axios from "axios";
import { toast } from "react-toastify";
import { useSearchParams, useRouter } from "next/navigation";
import AddWebsiteForm from "@/components/AddWebsiteForm";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showWebsiteForm, setShowWebsiteForm] = useState(
    searchParams.get("add") === "true"
  );
  const [search, setSearch] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch] = useDebounce(searchValue, 500);
  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [data, setData] = useState([]);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // Update search when debounced value changes
  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch]);

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchValue(value);
  };

  const fetchWebsiteData = async () => {
    const searchQuery = searchParams.get("search") || "";

    try {
      const { data: responseData } = await axios.get(
        `/api/websites?search=${search || searchQuery}&page=${page}&limit=20`
      );
      setData(responseData?.data);
      setTotalData(responseData?.totalData);
    } catch (error) {
      console.error("Error fetching website data:", error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this website?")) {
      setLoading(true);
      try {
        const response = await axios.delete(`/api/websites/${id}`);
        toast.success(response?.data?.message);
        fetchWebsiteData();
      } catch (error) {
        console.error("Error deleting website:", error);
      }

      setLoading(false);
    }
  };

  const handleIsEdit = (data) => {
    setEditData(data);
    setShowWebsiteForm(true);
  };

  useEffect(() => {
    fetchWebsiteData();
  }, [search, page]);

  // Compute pagination
  const itemsPerPage = 20;
  const computedTotalPages = Math.ceil(totalData / itemsPerPage);
  const currentRows = data;

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header & Toggle Form Button */}
          <div className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 py-4 bg-white rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
              Websites Details
            </h1>
            <button
              className="bg-secondary text-white font-semibold px-6 py-2 rounded transition duration-300 ease-in-out shadow"
              onClick={() => {
                setShowWebsiteForm(!showWebsiteForm);
                setEditData(null);
              }}
            >
              {showWebsiteForm ? "Cancel" : "Add Website"}
            </button>
          </div>

          {/* Add Website Form */}
          {showWebsiteForm && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <AddWebsiteForm
                editData={editData}
                setShowAddWebsiteForm={setShowWebsiteForm}
                fetchData={fetchWebsiteData}
              />
            </div>
          )}

          {/* Table Section */}
          <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
            {/* Search Section */}
            <div className="w-full mt-4 mb-6">
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
                    placeholder="Search websites..."
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

            {/* Table */}
            {data.length > 0 ? (
              <table className="w-full border-collapse">
                <thead className="text-left text-white bg-secondary">
                  <tr>
                    <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                      WEBSITE NAME
                    </th>
                    <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                      URL
                    </th>
                    <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                      CURRENT BALANCE
                    </th>
                    <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                      CREATED BY
                    </th>
                    <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                      CREATED AT
                    </th>
                    <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="text-center">
                      <td
                        className="px-4 py-2 border border-gray-600 hover:underline cursor-pointer text-blue-600"
                        onClick={() =>
                          router.push(`/transaction?search=${row.website_name}`)
                        }
                        title={`Search transactions for ${row.website_name}`}
                      >
                        {row.website_name}
                      </td>
                      <td className="px-4 py-2 border border-gray-600">
                        {row.url}
                      </td>
                      <td className="px-4 py-2 border border-gray-600">
                        {Number(row.current_balance).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-2 border border-gray-600">
                        {row.created_by}
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
                      <td className="px-4 py-2 border border-gray-600">
                        <div className="flex justify-center space-x-3">
                          <button
                            onClick={() => handleIsEdit(row)}
                            className="text-blue-500"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(row.website_name)}
                            className="text-red-500"
                          >
                            <FaTrash />
                          </button>
                        </div>
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
    <Suspense fallback={<div>Loading websites page...</div>}>
      <PageContent />
    </Suspense>
  );
}
