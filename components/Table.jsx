import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export const Table = ({ rows }) => {
  const [sortedRows, setRows] = useState(rows);
  const [order, setOrder] = useState("asc");
  const [sortKey, setSortKey] = useState(Object.keys(rows[0])[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of rows per page

  const formatEntry = (entry) => {
    if (typeof entry === "boolean") {
      return entry ? "✅" : "❌";
    }
    return entry;
  };

  const filter = (event) => {
    const value = event.target.value.toLowerCase();
    if (value) {
      const filtered = rows.filter((row) =>
        Object.values(row).join("").toLowerCase().includes(value)
      );
      setRows([...filtered]);
      setCurrentPage(1);
    } else {
      setRows(rows);
      setCurrentPage(1);
    }
  };

  const sort = (value, order) => {
    const returnValue = order === "desc" ? 1 : -1;
    setSortKey(value);
    setRows([
      ...sortedRows.sort((a, b) => {
        return a[value] > b[value] ? returnValue * -1 : returnValue;
      }),
    ]);
    setCurrentPage(1);
  };

  const updateOrder = () => {
    const updatedOrder = order === "asc" ? "desc" : "asc";
    setOrder(updatedOrder);
    sort(sortKey, updatedOrder);
  };

  // Pagination calculations
  const totalPages = Math.ceil(sortedRows.length / itemsPerPage);
  const indexOfLastRow = currentPage * itemsPerPage;
  const indexOfFirstRow = indexOfLastRow - itemsPerPage;
  const currentRows = sortedRows.slice(indexOfFirstRow, indexOfLastRow);

  return (
    <div className="flex flex-col md:flex-row md:space-x-4">
      {/* Table Section */}
      <div className="w-full md:w-3/4">
        <table className="w-full border-collapse">
          <thead className="text-left text-white bg-primary">
            <tr>
              {Object.keys(rows[0]).map((entry, index) => (
                <th
                  key={index}
                  className="px-2 py-1 border border-gray-600 first:border-l-0 last:border-r-0"
                >
                  {entry}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, index) => (
              <tr key={index} className="hover:bg-secondary hover:text-white">
                {Object.values(row).map((entry, columnIndex) => (
                  <td
                    key={columnIndex}
                    className="px-2 py-1 border border-gray-600 first:border-l-0 last:border-r-0"
                  >
                    {formatEntry(entry)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!sortedRows.length && (
          <h1 className="text-center mt-4">
            No results... Try expanding the search
          </h1>
        )}
        {/* Pagination and Data Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4">
          <div className="text-gray-700 mb-2 sm:mb-0">
            Total Data: {sortedRows.length} | Data per Page: {itemsPerPage}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 bg-gray-200 rounded disabled:opacity-50 transition duration-200 hover:bg-gray-300"
            >
              <FaChevronLeft />
            </button>
            <span className="text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="p-2 bg-gray-200 rounded disabled:opacity-50 transition duration-200 hover:bg-gray-300"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
      {/* Filter & Sorting Sidebar */}
      <div className="w-full md:w-1/4 mt-4 md:mt-0">
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Filter & Sort</h2>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Filter items"
              onChange={filter}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <select
              onChange={(event) => sort(event.target.value, order)}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.keys(rows[0]).map((entry, index) => (
                <option value={entry} key={index}>
                  Order by {entry}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={updateOrder}
            className="w-full bg-secondary text-white p-3 rounded-md shadow transition duration-300 ease-in-out hover:bg-secondary-dark"
          >
            Switch order ({order})
          </button>
        </div>
      </div>
    </div>
  );
};
