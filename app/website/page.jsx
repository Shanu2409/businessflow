"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
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
  FaDownload,
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
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = JSON.parse(sessionStorage.getItem("user"));
      setUser(userData);
    }
  }, []);

  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch]);

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value.toLowerCase());
  };

  const fetchWebsiteData = useCallback(async () => {
    if (!user) return;
    const searchQuery = searchParams.get("search") || "";

    try {
      const dataOwner = user.parent_user || user.username;
      const { data: responseData } = await axios.get(
        `/api/websites?search=${search || searchQuery
        }&page=${page}&limit=20&group=${user.group}&userType=${user.type}&createdBy=${dataOwner}`
      );
      setData(responseData?.data || []);
      setTotalData(responseData?.totalData || 0);
    } catch (error) {
      console.error("Error fetching website data:", error);
    }
  }, [user, search, page, searchParams]);

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this website?")) {
      setLoading(true);
      try {
        const response = await axios.delete(
          `/api/websites/${id}?group=${user.group}`
        );
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
    setHistory(data?.history);
    setShowWebsiteForm(true);
  };

  const handleExport = async () => {
    try {
      const dataOwner = user.parent_user || user.username;
      const response = await axios.get(
        `/api/websites/export?group=${user.group}&userType=${user.type}&createdBy=${dataOwner}`,
        {
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "websites.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Website details exported successfully.");
    } catch (error) {
      console.error("Error exporting website details:", error);
      toast.error("Failed to export website details.");
    }
  };

  useEffect(() => {
    fetchWebsiteData();
  }, [fetchWebsiteData]);

  const itemsPerPage = 20;
  const computedTotalPages = Math.ceil(totalData / itemsPerPage);
  const currentRows = data;

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header & Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 py-4 bg-white rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
              Websites Details
            </h1>
            <div className="flex space-x-4">
              <button
                className="bg-secondary text-white font-semibold px-6 py-2 rounded transition duration-300 ease-in-out shadow"
                onClick={() => {
                  setShowWebsiteForm(!showWebsiteForm);
                  setEditData(null);
                  setHistory([]);
                }}
              >
                {showWebsiteForm ? "Cancel" : "Add Website"}
              </button>
              <button
                className="bg-blue-500 text-white font-semibold px-6 py-2 rounded transition duration-300 shadow flex items-center space-x-2"
                onClick={handleExport}
              >
                <FaDownload />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Add Website Form */}
          <div
            className={`grid w-full min-w-0 gap-6 ${showWebsiteForm
              ? "grid-cols-1 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]"
              : "grid-cols-1"
              }`}
          >
            {showWebsiteForm && (
              <div className="min-w-0 bg-white p-6 rounded-lg shadow-md flex flex-col space-y-4">
                <AddWebsiteForm
                  editData={editData}
                  setShowAddWebsiteForm={setShowWebsiteForm}
                  fetchData={fetchWebsiteData}
                />

                {/* History List */}
                {history.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                      History
                    </h2>
                    <div className="max-h-60 overflow-y-auto">
                      <ul className="space-y-2">
                        {history.map((entry, index) => {
                          const isPositive = entry.startsWith("+");
                          const textColorClass = isPositive
                            ? "text-green-500"
                            : "text-red-500";

                          return (
                            <li
                              key={index}
                              className={`px-4 py-2 rounded-md ${textColorClass} flex justify-between items-baseline hover:bg-gray-200 transition duration-300 cursor-pointer`}
                            >
                              <span className="text-lg">{entry}</span>
                              <span className="text-sm text-gray-500">
                                Entry {index + 1}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Table Section */}
            <div className="min-w-0 bg-white p-6 rounded-lg shadow-md overflow-x-auto">
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
                    <span className="text-lg font-semibold">
                      Filter & Search
                    </span>
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
              {data.length > 0 && (
                <div className="flex justify-between items-center mb-4">
                  <span>
                    Total: {totalData} | Page {page} of {computedTotalPages}
                  </span>
                  <div className="flex space-x-4">
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

              {currentRows.length > 0 ? (
                <table className="w-full border-collapse">
                  <thead className="text-left text-white bg-secondary">
                    <tr>
                      <th className="px-4 py-2 border">ID</th>
                      <th className="px-4 py-2 border">Website Name</th>
                      <th className="px-4 py-2 border">Company Name</th>
                      <th className="px-4 py-2 border">Client Name</th>
                      <th className="px-4 py-2 border">Email</th>
                      <th className="px-4 py-2 border">Created By</th>
                      <th className="px-4 py-2 border">Group</th>
                      <th className="px-4 py-2 border">Created At</th>
                      <th className="px-4 py-2 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((row) => (
                      <tr key={row._id}>
                        <td className="border px-4 py-2">{row._id}</td>
                        <td className="border px-4 py-2">{row.website_name}</td>
                        <td className="border px-4 py-2">{row.company_name}</td>
                        <td className="border px-4 py-2">{row.client_name}</td>
                        <td className="border px-4 py-2">{row.email}</td>
                        <td className="border px-4 py-2">{row.created_by}</td>
                        <td className="border px-4 py-2">{row.group}</td>
                        <td className="border px-4 py-2">
                          {new Date(row.createdAt).toLocaleString()}
                        </td>
                        <td className="border px-4 py-2">
                          <button
                            onClick={() => handleIsEdit(row)}
                            className="text-blue-500"
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No results found.</p>
              )}
            </div>
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
