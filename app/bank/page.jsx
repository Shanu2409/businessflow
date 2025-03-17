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
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaDownload,
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
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = JSON.parse(sessionStorage.getItem("user"));
      setUser(userData);
    }
  }, []);

  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch]);

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
  }, [search, page, sortLabel]);

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

  const handleExport = async () => {
    try {
      const response = await axios.get(`/api/banks/export`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "banks.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Bank details exported successfully.");
    } catch (error) {
      console.error("Error exporting bank details:", error);
      toast.error("Failed to export bank details.");
    }
  };

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
            <div className="flex space-x-4">
              <button
                className="bg-secondary text-white font-semibold px-6 py-2 rounded transition duration-300 shadow"
                onClick={() => {
                  setShowAddBankForm(!showAddBankForm);
                  setEditData(null);
                }}
              >
                {showAddBankForm ? "Cancel" : "Add Bank"}
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

          {showAddBankForm && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <AddBankForm
                editData={editData}
                setShowAddBankForm={setShowAddBankForm}
                fetchData={fetchBankData}
              />
            </div>
          )}

          <div className="w-full mt-4 p-4 bg-white rounded-lg shadow-md">
            <input
              type="text"
              placeholder="Search banks..."
              value={searchValue}
              onChange={handleSearchChange}
              className="w-full p-3 border border-gray-300 rounded-md"
            />
          </div>

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
                      <th className="px-4 py-2 border border-gray-600">Sr. No.</th>
                      <th className="px-4 py-2 border border-gray-600">Bank Name</th>
                      <th className="px-4 py-2 border border-gray-600">IFSC Code</th>
                      <th className="px-4 py-2 border border-gray-600">Account Number</th>
                      <th className="px-4 py-2 border border-gray-600">Current Balance</th>
                      {user?.type === "admin" && (
                        <th className="px-4 py-2 border border-gray-600">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, index) => (
                      <tr key={row._id}>
                        <td className="border px-4 py-2">{index + 1 + (page - 1) * itemsPerPage}</td>
                        <td className="border px-4 py-2">{row.bank_name}</td>
                        <td className="border px-4 py-2">{row.ifsc_code}</td>
                        <td className="border px-4 py-2">{row.account_number}</td>
                        <td className="border px-4 py-2">{row.current_balance}</td>
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
