"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Navbar from "@/components/Navbar";
import axios from "axios";
import { toast } from "react-toastify";
import { useSearchParams, useRouter } from "next/navigation";
import AddUserForm from "@/components/AddUserForm";
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
  const [showAddUserForm, setShowAddUserForm] = useState(
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
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = JSON.parse(sessionStorage.getItem("user"));
      setUser(userData);
    }
  }, []);

  const itemsPerPage = 20;

  // Update search when debounced value changes
  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch]);

  // Fetch users (Pagination fixed)
  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: responseData } = await axios.get(
        `/api/users?search=${search}&page=${page}&limit=${itemsPerPage}`
      );
      setData(responseData?.data || []);
      setTotalData(responseData?.totalData || 0);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to fetch user data.");
    }
    setLoading(false);
  }, [search, page]); // ✅ Depend on `search` and `page`

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchValue(e.target.value.toLowerCase());
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this user account?")) {
      try {
        const response = await axios.delete(`/api/users/${id}`);
        toast.success(response?.data?.message);
        fetchUserData();
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleIsEdit = (data) => {
    setEditData(data);
    setShowAddUserForm(true);
  };

  const handlePruneUsers = async () => {
    if (!user || user?.type !== "admin") return;
    if (
      !confirm("This will delete ALL users. This cannot be undone. Continue?")
    )
      return;
    setLoading(true);
    try {
      await axios.delete(`/api/users`);
      toast.success("All users deleted");
      fetchUserData();
    } catch (error) {
      toast.error(error?.response?.data?.Message || "Failed to prune users");
    } finally {
      setLoading(false);
    }
  };

  // Compute total pages
  const computedTotalPages = Math.ceil(totalData / itemsPerPage);

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header & Toggle Form Button */}
          <div className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 py-4 bg-white rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
              User Clients Details
            </h1>
            <div className="flex space-x-3">
              <button
                className="bg-secondary text-white font-semibold px-6 py-2 rounded transition duration-300 ease-in-out shadow"
                onClick={() => {
                  setShowAddUserForm(!showAddUserForm);
                  setEditData(null);
                }}
              >
                {showAddUserForm ? "Cancel" : "Add User"}
              </button>
              {user?.type === "admin" && (
                <button
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded transition duration-300 shadow flex items-center space-x-2"
                  onClick={handlePruneUsers}
                  title="Delete ALL users"
                >
                  <FaTrash />
                  <span>Prune All</span>
                </button>
              )}
            </div>
          </div>

          {/* Add User Form */}
          {showAddUserForm && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <AddUserForm
                editData={editData}
                setShowAddUserForm={setShowAddUserForm}
                fetchData={fetchUserData}
              />
            </div>
          )}

          {/* Search Bar */}
          <div className="w-full mt-4 p-4 bg-white rounded-lg shadow-md">
            <input
              type="text"
              placeholder="Search users..."
              value={searchValue}
              onChange={handleSearchChange}
              className="w-full p-3 border border-gray-300 rounded-md"
            />
          </div>

          {/* User Table */}
          <div className="bg-white p-6 rounded-lg shadow-md">
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

            {data.length > 0 ? (
              <table className="w-full border-collapse">
                <thead className="text-left text-white bg-secondary">
                  <tr>
                    <th className="px-4 py-2 border">Username</th>
                    <th className="px-4 py-2 border">Website</th>
                    <th className="px-4 py-2 border">Email</th>
                    <th className="px-4 py-2 border">Active</th>
                    <th className="px-4 py-2 border">Created By</th>
                    <th className="px-4 py-2 border">Created At</th>
                    <th className="px-4 py-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row._id}>
                      <td className="border px-4 py-2">{row.username}</td>
                      <td className="border px-4 py-2">{row.website_name}</td>
                      <td className="border px-4 py-2">{row.email}</td>
                      <td className="border px-4 py-2">
                        {row.active ? "✅" : "❌"}
                      </td>
                      <td className="border px-4 py-2">{row.created_by}</td>
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
      <FullScreenLoader isLoading={loading} />
    </>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<div>Loading Users page...</div>}>
      <PageContent />
    </Suspense>
  );
}
