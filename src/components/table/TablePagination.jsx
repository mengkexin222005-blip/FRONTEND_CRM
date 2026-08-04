import { ChevronLeft, ChevronRight } from "lucide-react";

export default function TablePagination({
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
      className={`flex flex-col md:flex-row md:items-center justify-between ${marginTop ? marginTop : "mt-3"} gap-2`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">Show</span>
        <select
          className="border border-gray-300 rounded-md px-2 py-1 text-sm w-14"
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(e.target.value)}
        >
          {[5, 10, 25, 50, 100].map((len) => (
            <option key={len} value={len}>
              {len}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-700">entries</span>
      </div>

      <div className="text-sm text-gray-600 text-center">
        Showing {from} to {to} of {totalRows} entries
      </div>

      <div className="flex items-center gap-1 justify-center">
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
            className={`w-8 h-8 rounded-md border text-sm font-medium ${
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
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}