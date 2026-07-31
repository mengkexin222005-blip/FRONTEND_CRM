import { ChevronLeft, ChevronRight } from "lucide-react";

export default function TablePagination({
  rowsOptions = [5, 10, 25, 50, 100],
  currentPage,
  totalPages,
  totalRows,
  rowsPerPage,
  from,
  to,
  pageWindow,
  onGoTo,
  onRowsPerPageChange,
  marginTop,
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between ${
        marginTop ? marginTop : "mt-6"
      } gap-3 px-2 w-full flex-wrap text-sm text-gray-500`}
    >
      {/* Rows per page dropdown */}
      <div className="flex items-center gap-2 text-xs sm:text-sm">
        <span className="text-gray-700">Show</span>
        <select
          className="border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500"
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(e.target.value)}
        >
          {rowsOptions.map((len) => (
            <option key={len} value={len}>
              {len}
            </option>
          ))}
        </select>
        <span className="text-gray-700">entries</span>
      </div>

      {/* Showing entries text info */}
      <div className="text-xs sm:text-sm text-gray-600 text-center">
        {totalRows > 0 ? (
          <>
            Showing {from} to {to} of {totalRows} entries
          </>
        ) : (
          "No entries to show"
        )}
      </div>

      {/* Pagination buttons */}
      <div className="flex items-center gap-1 justify-center flex-wrap">
        <button
          onClick={() => onGoTo(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>

        {pageWindow.map((num) => (
          <button
            key={num}
            onClick={() => onGoTo(num)}
            className={`w-8 h-8 rounded-md border text-xs sm:text-sm font-medium transition-colors ${
              currentPage === num
                ? "bg-red-500 text-white border-red-500"
                : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300 cursor-pointer"
            }`}
          >
            {num}
          </button>
        ))}

        <button
          onClick={() => onGoTo(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}