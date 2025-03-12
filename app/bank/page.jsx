"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import AddBankForm from "@/components/AddBankForm";
import Navbar from "@/components/Navbar";
import axios from "axios";
import { toast } from "react-toastify";
import { useSearchParams, useRouter } from "next/navigation";
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
  const [user, setUser] = useState(null);
  const [showAddBankForm, setShowAddBankForm] = useState(
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
  const [sortLabel, setSortLabel] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [selectAllCheck, setSelectAllCheck] = useState(false);

  const itemsPerPage = 20;

  // Get user from sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = JSON.parse(sessionStorage.getItem("user"));
      setUser(userData);
    }
  }, []);

  // Update search state when debounced value changes
  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch]);

  // Fetch bank data (pagination fixed)
  const fetchBankData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: responseData } = await axios.get(
        `/api/banks?search=${search}&page=${page}&limit=${itemsPerPage}&sort=${sortLabel}`
      );
      setData(responseData?.data || []);
      setTotalData(responseData?.totalData || 0);
    } catch (error) {
      console.error("Error fetching bank data:", error);
      toast.error("Failed to fetch bank data.");
    }
    setLoading(false);
  }, [search, page, sortLabel]); // ✅ Depend on `page` and `search`

  // Fetch data when dependencies change
  useEffect(() => {
    fetchBankData();
  }, [fetchBankData]);

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value.toLowerCase());
  };

  const handleIsEdit = (data) => {
    setEditData(data);
    setShowAddBankForm(true);
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

  // Handle pagination
  const computedTotalPages = Math.ceil(totalData / itemsPerPage);

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 py-4 bg-white rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
              Bank Details
            </h1>
            {
              <button
                className="bg-secondary text-white font-semibold px-6 py-2 rounded transition duration-300 shadow"
                onClick={() => {
                  setShowAddBankForm(!showAddBankForm);
                  setEditData(null);
                }}
              >
                {showAddBankForm ? "Cancel" : "Add Bank"}
              </button>
            }
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

          {/* Search Bar */}
          <div className="w-full mt-4 p-4 bg-white rounded-lg shadow-md">
            <input
              type="text"
              placeholder="Search banks..."
              value={searchValue}
              onChange={handleSearchChange}
              className="w-full p-3 border border-gray-300 rounded-md"
            />
          </div>

          {/* Bank Table */}
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
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="text-left text-white bg-secondary">
                    <tr>
                      <th className="px-4 py-2 border border-gray-600">
                        Sr. No.
                      </th>
                      <th
                        className="px-4 py-2 border border-gray-600 cursor-pointer hover:underline"
                        onClick={() =>
                          setSortLabel((prev) =>
                            prev === "bank_name" ? "-bank_name" : "bank_name"
                          )
                        }
                      >
                        Bank Name
                      </th>
                      <th
                        className="px-4 py-2 border border-gray-600 cursor-pointer hover:underline"
                        onClick={() =>
                          setSortLabel((prev) =>
                            prev === "ifsc_code" ? "-ifsc_code" : "ifsc_code"
                          )
                        }
                      >
                        IFSC Code
                      </th>
                      <th
                        className="px-4 py-2 border border-gray-600 cursor-pointer hover:underline"
                        onClick={() =>
                          setSortLabel((prev) =>
                            prev === "account_number"
                              ? "-account_number"
                              : "account_number"
                          )
                        }
                      >
                        Account Number
                      </th>
                      <th className="px-4 py-2 border border-gray-600">
                        Current Balance
                      </th>
                      {user?.type === "admin" && (
                        <th className="px-4 py-2 border border-gray-600">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, index) => (
                      <tr key={row._id}>
                        <td className="border px-4 py-2">
                          {index + 1 + (page - 1) * itemsPerPage}
                        </td>
                        <td
                          className="border px-4 py-2 text-blue-500 cursor-pointer hover:underline"
                          onClick={() =>
                            router.push(`/transaction?search=${row.bank_name}`)
                          }
                        >
                          {row.bank_name}
                        </td>
                        <td
                          className="border px-4 py-2 text-blue-500 cursor-pointer hover:underline"
                          onClick={() =>
                            router.push(`/transaction?search=${row.ifsc_code}`)
                          }
                        >
                          {row.ifsc_code}
                        </td>
                        <td
                          className="border px-4 py-2 text-blue-500 cursor-pointer hover:underline"
                          onClick={() =>
                            router.push(
                              `/transaction?search=${row.account_number}`
                            )
                          }
                        >
                          {row.account_number}
                        </td>
                        <td className="border px-4 py-2">
                          {row.current_balance}
                        </td>
                        {user?.type === "admin" && (
                          <td className="border px-4 py-2">
                            <button
                              onClick={() => handleIsEdit(row)}
                              className="text-blue-500"
                            >
                              <FaEdit />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
    <Suspense fallback={<div>Loading bank page...</div>}>
      <PageContent />
    </Suspense>
  );
}
