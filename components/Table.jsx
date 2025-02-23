import { useEffect, useState } from "react";
import {
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
} from "react-icons/fa";

export const Table = ({
  rows,
  setSearch,
  fetchData,
  totalData,
  showChecknRecheck = false,
  changeCheckStatus,
  changeRecheckStatus,
  page,
  setPage,
}) => {
  const [sortedRows, setSortedRows] = useState([...rows]);
  const itemsPerPage = 20;

  // New state variable for collapsing the Filter & Sorting section
  const [isFilterOpen, setIsFilterOpen] = useState(
    () => window.innerWidth > 768
  );

  // Update sortedRows when rows prop changes
  useEffect(() => {
    setSortedRows([...rows]);
  }, [rows]);

  // Formatter: only "createdAt" fields are treated as dates,
  // "current_balance" is formatted as currency, and other values remain unmodified.
  const formatEntry = (entry, key) => {
    if (typeof entry === "boolean") {
      return entry ? "✅" : "❌";
    } else if (
      key === "createdAt" &&
      typeof entry === "string" &&
      !isNaN(Date.parse(entry))
    ) {
      return new Intl.DateTimeFormat("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(entry));
    } else if (key === "current_balance" && typeof entry === "number") {
      return `₹ ${entry.toLocaleString("en-IN")}`;
    }
    return entry;
  };

  const filter = (event) => {
    const value = event.target.value.toLowerCase();
    setSearch(value);
  };

  // Compute columns from sortedRows if data exists.
  const columns = sortedRows?.length > 0 ? Object.keys(sortedRows[0]) : [];
  // If checkboxes are shown, remove "check" and "recheck" keys from display.
  const displayColumns = showChecknRecheck
    ? columns.filter((col) => col !== "check" && col !== "recheck")
    : columns;

  // Compute total pages using totalData.
  const computedTotalPages = Math.ceil(totalData / itemsPerPage);

  // Determine which rows to display (client-side vs server-side pagination).
  const currentRows =
    totalData === sortedRows.length
      ? sortedRows.slice((page - 1) * itemsPerPage, page * itemsPerPage)
      : sortedRows;

  return (
    <div className="flex flex-col-reverse md:flex-row space-y-4 md:space-y-0 md:space-x-4">
      {/* Table Section */}
      <div className="w-full md:w-3/4">
        {/* Horizontal scroll for small screens */}
        <div className="overflow-x-auto">
          {sortedRows?.length > 0 ? (
            <table className="w-full border-collapse">
              <thead className="text-left text-white bg-primary">
                <tr>
                  {showChecknRecheck && (
                    <>
                      <th className="px-2 py-1 border border-gray-600 whitespace-nowrap">
                        Check
                      </th>
                      <th className="px-2 py-1 border border-gray-600 whitespace-nowrap">
                        Recheck
                      </th>
                    </>
                  )}
                  {displayColumns.map((col, index) => (
                    <th
                      key={index}
                      className="px-2 py-1 border border-gray-600 first:border-l-0 last:border-r-0 whitespace-nowrap"
                    >
                      {col.replace("_", " ").toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-secondary hover:text-white"
                  >
                    {showChecknRecheck && (
                      <>
                        <td className="px-2 py-1 border border-gray-600">
                          <input
                            type="checkbox"
                            checked={row.check}
                            onChange={(e) =>
                              changeCheckStatus(row, e.target.checked)
                            }
                          />
                        </td>
                        <td className="px-2 py-1 border border-gray-600">
                          <input
                            type="checkbox"
                            checked={row.recheck}
                            onChange={(e) =>
                              changeRecheckStatus(row, e.target.checked)
                            }
                          />
                        </td>
                      </>
                    )}
                    {displayColumns.map((col, index) => (
                      <td
                        key={index}
                        className="px-2 py-1 border border-gray-600 first:border-l-0 last:border-r-0 whitespace-nowrap"
                      >
                        {formatEntry(row[col], col)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <h1 className="text-center mt-4">
              No results... Try expanding the search
            </h1>
          )}
        </div>
        {sortedRows?.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4">
            <div className="text-gray-700 mb-2 sm:mb-0">
              Total Data: {totalData} | Data per Page: {itemsPerPage}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="p-2 bg-gray-200 rounded disabled:opacity-50 transition duration-200 hover:bg-gray-300"
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
                className="p-2 bg-gray-200 rounded disabled:opacity-50 transition duration-200 hover:bg-gray-300"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Filter & Sorting Sidebar */}
      <div className="w-full md:w-1/4 mt-4 md:mt-0">
        {/* Toggle button appears on mobile */}

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
            <div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Filter items"
                  onChange={filter}
                  className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
