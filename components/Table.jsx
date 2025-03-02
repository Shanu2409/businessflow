import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { toast } from "react-toastify";

export const Table = ({
  rows,
  setSearch,
  fetchData,
  totalData,
  showCheckRecheck = false,
  changeCheckStatus,
  changeRecheckStatus,
  page,
  setPage,
  handleDelete,
  handleIsEdit,
  showDelete = true,
  showEdit = true,
}) => {
  const itemsPerPage = 20;
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const searchParams = useSearchParams(); // Get search params
  const [searchValue, setSearchValue] = useState(""); // Local state for filter input

  const router = useRouter();

  // Set search value from URL when component mounts
  useEffect(() => {
    const searchQuery = searchParams.get("search") || ""; // Get 'search' param
    setSearch(searchQuery.toLowerCase()); // Set in external state
    setSearchValue(searchQuery); // Set in local input field
  }, [searchParams, setSearch]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  // Compute columns dynamically
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const displayColumns = showCheckRecheck
    ? columns.filter((col) => col !== "check" && col !== "recheck")
    : columns;

  // Compute total pages
  const computedTotalPages = Math.ceil(totalData / itemsPerPage);
  const currentRows = rows.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Format Data for Display
  const formatEntry = (entry, key) => {
    if (typeof entry === "boolean") return entry ? "✅" : "❌";
    if (key === "createdAt" && !isNaN(Date.parse(entry))) {
      return new Intl.DateTimeFormat("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(entry));
    }
    if (key === "current_balance" && typeof entry === "number") {
      return `₹ ${entry.toLocaleString("en-IN")}`;
    }
    return entry;
  };

  const handleStatusChange = async (id, key, value) => {
    if (confirm("Are you sure you want to change this status?")) {
      try {
        const response = await axios.put(
          `/api/transactions?field=${key}&value=${value}&tid=${id}`
        );

        if (response.status === 200) {
          toast.success("Status updated successfully");
          fetchData(); // Refresh data after update
        } else {
          console.error("Failed to update status", response);
        }
      } catch (error) {
        toast.error("Error updating status");
      }
    }
  };

  return (
    <div className="flex flex-col-reverse md:flex-row space-y-4 md:space-y-0 md:space-x-4">
      {/* Table Section with Horizontal Scroll */}
      <div className="w-full md:w-3/4 overflow-x-auto">
        <div className="min-w-full">
          {/* Pagination Controls */}
          {rows.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center m-4">
              <div className="text-gray-700 mb-2 sm:mb-0">
                Total Data: {totalData} | Data per Page: {itemsPerPage}
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="p-2 bg-gray-200 rounded disabled:opacity-50"
                >
                  <FaChevronLeft />
                </button>
                <span className="text-gray-700">
                  Page {page} of {computedTotalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, computedTotalPages))
                  }
                  disabled={page === computedTotalPages}
                  className="p-2 bg-gray-200 rounded disabled:opacity-50"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          )}

          {rows.length > 0 ? (
            <table className="w-full border-collapse whitespace-nowrap">
              <thead className="text-left text-white bg-primary">
                <tr>
                  {showCheckRecheck && (
                    <>
                      <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                        Check
                      </th>
                      <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                        Recheck
                      </th>
                    </>
                  )}
                  {displayColumns.map((col, index) => (
                    <th
                      key={index}
                      className="px-4 py-2 border border-gray-600 text-sm text-center"
                    >
                      {col.replaceAll("_", " ").toUpperCase()}
                    </th>
                  ))}
                  {(showDelete || showEdit) && (
                    <th className="px-4 py-2 border border-gray-600 text-sm text-center">
                      ACTIONS
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row, rowIndex) => {
                  // Determine text color based on transaction_type
                  const textColor =
                    row.transaction_type === "Deposit"
                      ? "text-green-600 font-bold"
                      : row.transaction_type === "Withdraw"
                      ? "text-red-600 font-bold"
                      : "text-black";

                  return (
                    <tr key={rowIndex} className={`${textColor}`}>
                      {showCheckRecheck && (
                        <>
                          <td className="px-4 py-2 border border-gray-600">
                            <input
                              type="checkbox"
                              checked={row.check}
                              onChange={(e) =>
                                handleStatusChange(
                                  row._id,
                                  "check",
                                  e.target.checked
                                )
                              }
                            />
                          </td>
                          <td className="px-4 py-2 border border-gray-600">
                            <input
                              type="checkbox"
                              checked={row.re_check}
                              disabled={!row.check}
                              onChange={(e) =>
                                handleStatusChange(
                                  row._id,
                                  "re_check",
                                  e.target.checked
                                )
                              }
                            />
                          </td>
                        </>
                      )}
                      {displayColumns.map((col, index) => {
                        const cellValue = row[col];

                        // Check if the column name contains restricted words
                        const isRestrictedColumn =
                          col.toLowerCase().includes("balance") ||
                          col.toLowerCase().includes("_id") ||
                          col.toLowerCase().includes("createdat");

                        return (
                          <td
                            key={index}
                            onClick={() => {
                              if (!isRestrictedColumn) {
                                router.push(`/transaction?search=${cellValue}`);
                              }
                            }}
                            className={`px-4 py-2 border border-gray-600 ${
                              !isRestrictedColumn
                                ? "hover:underline cursor-pointer"
                                : ""
                            }`}
                          >
                            {formatEntry(cellValue, col)}
                          </td>
                        );
                      })}

                      {(showDelete || showEdit) && (
                        <td className="px-4 py-2 border border-gray-600">
                          {showEdit && (
                            <button
                              onClick={() => handleIsEdit(row)}
                              className="text-blue-500 mr-2"
                            >
                              <FaEdit />
                            </button>
                          )}
                          {showDelete && (
                            <button
                              onClick={() =>
                                handleDelete(
                                  Object.entries(row).find(([key, value]) =>
                                    key.includes("_id")
                                      ? value
                                      : key.includes("name")
                                  )[1]
                                )
                              }
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <h1 className="text-center mt-4">
              No results... Try expanding the search
            </h1>
          )}
        </div>
      </div>

      {/* Filter & Sorting Sidebar */}
      <div className="w-full md:w-1/4 mt-4 md:mt-0">
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
            <span className="text-lg font-semibold">Filter & Sort</span>
          </button>
          {isFilterOpen && (
            <input
              type="text"
              placeholder="Filter items"
              value={searchValue} // Controlled input field
              onChange={(e) => {
                const value = e.target.value;
                setSearchValue(value); // Update input field
                setSearch(value.toLowerCase()); // Update external search state
              }}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      </div>
    </div>
  );
};
