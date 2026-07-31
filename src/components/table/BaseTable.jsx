import TablePagination from "./TablePagination";

export default function BaseTable({
  columns,
  children,
  empty,
  colSpan,
  minHeightClass = "min-h-[350px]",
  heightClass = "h-auto max-h-[calc(100vh-320px)]",
  paginationProps,
}) {
  return (
    <div className="flex flex-col">
      <div
        className={`overflow-x-auto ${minHeightClass} ${heightClass} overflow-y-auto`}
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="sticky top-0 z-10 bg-white text-left">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key || col.label}
                  className={`p-2 text-sm ${col.align || "text-left"} font-medium text-gray-500 uppercase bg-white border-b border-gray-200`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200 border-b border-gray-300">
            {empty ? (
              <tr>
                <td
                  colSpan={colSpan || columns.length}
                  className="px-6 py-10 text-center text-sm text-gray-400"
                >
                  {empty}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>

      {paginationProps && (
        <div className="mt-4 pt-2">
          <TablePagination {...paginationProps} />
        </div>
      )}
    </div>
  );
}