export default function BaseTable({
  columns,
  children,
  empty,
  colSpan,
  minHeightClass = "",
  heightClass = "",
}) {
  return (
    <div
      className={`
        w-full
        overflow-x-auto
        ${minHeightClass}
        ${heightClass}
      `}
    >
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="sticky top-0 z-10 bg-white">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key || col.label}
                className={`
                  border-b border-gray-200
                  bg-white
                  p-2
                  text-left
                  text-sm
                  font-medium
                  uppercase
                  text-gray-500
                  ${col.align || ""}
                `}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 bg-white">
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
  );
}