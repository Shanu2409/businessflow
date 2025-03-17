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

  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch]);

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value.toLowerCase());
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

  const handleExport = async () => {
    try {
      const response = await axios.get(`/api/websites/export`, {
        responseType: "blob",
      });
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
  }, [search, page]);

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

            {/* Table */}
            {data.length > 0 ? (
              <table className="w-full border-collapse">
                <thead className="text-left text-white bg-secondary">
                  <tr>
                    <th className="px-4 py-2 border">WEBSITE NAME</th>
                    <th className="px-4 py-2 border">URL</th>
                    <th className="px-4 py-2 border">CURRENT BALANCE</th>
                    <th className="px-4 py-2 border">CREATED BY</th>
                    <th className="px-4 py-2 border">CREATED AT</th>
                    <th className="px-4 py-2 border">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="text-center">
                      <td
                        className="border px-4 py-2 cursor-pointer text-blue-500 hover:underline"
                        onClick={() =>
                          router.push(`/transaction?search=${row.website_name}`)
                        }
                      >
                        {row.website_name}
                      </td>
                      <td className="px-4 py-2 border">{row.url}</td>
                      <td className="px-4 py-2 border">
                        {row.current_balance}
                      </td>
                      <td className="px-4 py-2 border">{row.created_by}</td>
                      <td className="px-4 py-2 border">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 border">
                        <button
                          onClick={() => handleIsEdit(row)}
                          className="text-blue-500"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(row._id)}
                          className="text-red-500 ml-3"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center">No results found.</p>
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
