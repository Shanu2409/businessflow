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
    if (!user) return;
    setLoading(true);
    try {
      const { data: responseData } = await axios.get(
        `/api/banks?search=${search}&page=${page}&limit=${itemsPerPage}&sort=${sortLabel}&group=${user.group}&userType=${user.type}&createdBy=${user.username}`
      );
      setData(responseData?.data || []);
      setTotalData(responseData?.totalData || 0);
    } catch (error) {
      console.error("Error fetching bank data:", error);
      toast.error("Failed to fetch bank data.");
    }
    setLoading(false);
  }, [search, page, sortLabel, user, itemsPerPage]);

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
      const response = await axios.get(
        `/api/banks/export?group=${user.group}&userType=${user.type}&createdBy=${user.username}`,
        {
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "BKs.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("BK details exported successfully.");
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
              BK Details
            </h1>
            <div className="flex space-x-4">
              <button
                className="bg-secondary text-white font-semibold px-6 py-2 rounded transition duration-300 shadow"
                onClick={() => {
                  setShowAddBankForm(!showAddBankForm);
                  setEditData(null);
                }}
              >
                {showAddBankForm ? "Cancel" : "Add BK"}
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

          <div
            className={`grid w-full min-w-0 gap-6 ${
              showAddBankForm
                ? "grid-cols-1 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]"
                : "grid-cols-1"
            }`}
          >
            {showAddBankForm && (
              <div className="min-w-0 bg-white p-6 rounded-lg shadow-md">
                <AddBankForm
                  editData={editData}
                  setShowAddBankForm={setShowAddBankForm}
                  fetchData={fetchBankData}
                />
              </div>
            )}

            <div className="min-w-0 bg-white p-6 rounded-lg shadow-md">
              <div className="w-full mt-4 p-4 bg-white rounded-lg shadow-md">
                <input
                  type="text"
                  placeholder="Search BKs..."
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
                          <th className="px-4 py-2 border border-gray-600">S.No</th>
                          <th
                            className="px-4 py-2 border border-gray-600 cursor-pointer hover:underline"
                            onClick={() =>
                              setSortLabel((prev) =>
                                prev === "bank_name" ? "-bank_name" : "bank_name"
                              )
                            }
                          >
                            BK Name
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
                            ac Number
                          </th>
                          <th className="px-4 py-2 border border-gray-600">
                            Current Balance
                          </th>
                          <th className="px-4 py-2 border border-gray-600">
                            Group
                          </th>
                          <th className="px-4 py-2 border border-gray-600">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((row, index) => (
                          <tr key={row._id}>
                            <td className="px-4 py-2 border border-gray-600">
                              {index + 1 + (page - 1) * itemsPerPage}
                            </td>
                            <td className="px-4 py-2 border border-gray-600">
                              <button
                                onClick={() =>
                                  router.push(
                                    `/transaction?search=${encodeURIComponent(
                                      row.bank_name
                                    )}`
                                  )
                                }
                                className="text-blue-600 hover:underline"
                              >
                                {row.bank_name}
                              </button>
                            </td>
                            <td className="px-4 py-2 border border-gray-600">
                              {row.ifsc_code}
                            </td>
                            <td className="px-4 py-2 border border-gray-600">
                              {row.account_number}
                            </td>
                            <td className="px-4 py-2 border border-gray-600">
                              {row.current_balance}
                            </td>
                            <td className="px-4 py-2 border border-gray-600">
                              {row.group}
                            </td>
                            <td className="px-4 py-2 border border-gray-600">
                              <button
                                onClick={() => handleIsEdit(row)}
                                className="text-blue-500 mr-2"
                              >
                                <FaEdit />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No results found.</p>
                )}
              </div>
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
    <Suspense fallback={<div>Loading BK page...</div>}>
      <PageContent />
    </Suspense>
  );
}
