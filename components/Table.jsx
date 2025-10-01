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
  FaSearch,
  FaFilter,
  FaSort,
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
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

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

  // Compute columns dynamically
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const displayColumns = showCheckRecheck
    ? columns.filter((col) => col !== "check" && col !== "recheck")
    : columns;

  // Compute total pages
  const computedTotalPages = Math.ceil(totalData / itemsPerPage);

  // Sort the rows if sortConfig is set
  const sortedRows = React.useMemo(() => {
    let sortableRows = [...rows];
    if (sortConfig.key) {
      sortableRows.sort((a, b) => {
        if (a[sortConfig.key] === null) return 1;
        if (b[sortConfig.key] === null) return -1;
        if (a[sortConfig.key] === b[sortConfig.key]) return 0;

        const aValue =
          typeof a[sortConfig.key] === "string"
            ? a[sortConfig.key].toLowerCase()
            : a[sortConfig.key];
        const bValue =
          typeof b[sortConfig.key] === "string"
            ? b[sortConfig.key].toLowerCase()
            : b[sortConfig.key];

        if (sortConfig.direction === "ascending") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }
    return sortableRows;
  }, [rows, sortConfig]);

  const currentRows = sortedRows.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Format Data for Display
  const formatEntry = (entry, key) => {
    if (entry === null || entry === undefined) return "-";
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
      return `${entry.toLocaleString("en-IN")}`;
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

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (column) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === "ascending" ? (
      <FaChevronUp className="inline ml-1 text-xs" />
    ) : (
      <FaChevronDown className="inline ml-1 text-xs" />
    );
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Filter & Search Bar */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center">
            <span className="text-lg font-semibold text-gray-800 flex items-center">
              <FaFilter className="mr-2" /> Filters
            </span>
          </div>
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search anything..."
              value={searchValue}
              onChange={(e) => {
                const value = e.target.value;
                setSearchValue(value);
                setSearch(value.toLowerCase());
              }}
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        {/* Pagination Controls */}
        {rows.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
            <div className="text-gray-600 mb-2 sm:mb-0 text-sm">
              Showing{" "}
              <span className="font-medium">
                {Math.min((page - 1) * itemsPerPage + 1, totalData)}-
                {Math.min(page * itemsPerPage, totalData)}
              </span>{" "}
              of <span className="font-medium">{totalData}</span> items
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="p-2 bg-white border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <FaChevronLeft className="text-xs" />
              </button>
              <div className="flex items-center">
                {[...Array(Math.min(5, computedTotalPages))].map((_, i) => {
                  const pageNum = page > 3 ? page - 3 + i + 1 : i + 1;
                  if (pageNum <= computedTotalPages) {
                    return (
                      <button
                        key={i}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-1 mx-1 rounded-md text-sm ${
                          page === pageNum
                            ? "bg-primary text-white"
                            : "bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>
              <button
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, computedTotalPages))
                }
                disabled={page === computedTotalPages}
                className="p-2 bg-white border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <FaChevronRight className="text-xs" />
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          {rows.length > 0 ? (
            <table className="table-modern">
              <thead className="table-header">
                <tr>
                  {showCheckRecheck && (
                    <>
                      <th className="table-header-cell text-center">Check</th>
                      <th className="table-header-cell text-center">Recheck</th>
                    </>
                  )}
                  {displayColumns.map((col, index) => (
                    <th
                      key={index}
                      className="table-header-cell cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort(col)}
                    >
                      <div className="flex items-center">
                        <span className="mr-1">
                          {col.replaceAll("_", " ").toUpperCase()}
                        </span>
                        <span className="text-gray-400 inline-flex">
                          <FaSort />
                        </span>
                        {getSortIndicator(col)}
                      </div>
                    </th>
                  ))}
                  {(showDelete || showEdit) && (
                    <th className="table-header-cell text-center">ACTIONS</th>
                  )}
                </tr>
              </thead>
              <tbody className="table-body">
                {currentRows.map((row, rowIndex) => {
                  // Determine text color based on transaction_type
                  const rowStyle =
                    row.transaction_type === "Deposit"
                      ? "text-green-600 font-medium"
                      : row.transaction_type === "Withdraw"
                      ? "text-red-600 font-medium"
                      : "";

                  return (
                    <tr
                      key={rowIndex}
                      className={`table-row ${rowStyle} ${
                        rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      {showCheckRecheck && (
                        <>
                          <td className="table-cell text-center">
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
                              className="w-4 h-4 text-primary rounded focus:ring-primary border-gray-300"
                            />
                          </td>
                          <td className="table-cell text-center">
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
                              className="w-4 h-4 text-secondary rounded focus:ring-secondary border-gray-300 disabled:opacity-50"
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
                            className={`table-cell ${
                              !isRestrictedColumn
                                ? "hover:text-primary hover:underline cursor-pointer"
                                : ""
                            }`}
                          >
                            {formatEntry(cellValue, col)}
                          </td>
                        );
                      })}

                      {(showDelete || showEdit) && (
                        <td className="table-cell text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {showEdit && (
                              <button
                                onClick={() => handleIsEdit(row)}
                                className="p-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                                aria-label="Edit"
                              >
                                <FaEdit />
                              </button>
                            )}
                            {showDelete && (
                              <button
                                onClick={() =>
                                  handleDelete(
                                    Object.entries(row).find(
                                      ([key]) =>
                                        key.includes("_id") ||
                                        key.includes("name")
                                    )[1]
                                  )
                                }
                                className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                                aria-label="Delete"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="text-gray-400 mb-2 text-5xl">
                <FaSearch />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-1">
                No results found
              </h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your search or filter to find what you're looking
                for.
              </p>
              <button
                onClick={() => {
                  setSearchValue("");
                  setSearch("");
                }}
                className="btn btn-secondary"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
