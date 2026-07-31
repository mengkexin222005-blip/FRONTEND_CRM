export default function LoaderTables({
  paginatedItems,
  headers,
  renderRow,
  emptyMessage = "No results found.",
  heightClass = "w-full overflow-auto",
}) {
  if (!paginatedItems) return null;

  const isLoading = paginatedItems === "loading";

  const Bone = ({ className = "", style = {} }) => (
    <div 
      className={`animate-pulse bg-gray-200 rounded ${className}`} 
      style={style}
    />
  );

  const skeletonRows = Array.from({ length:10 });
  const columnCount = headers?.length ?? 5;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* ── Table Container ── */}
      <div className={`w-full overflow-auto ${heightClass}`}>
        <table className="w-full text-sm text-left border-collapse">
          {/* Header */}
          <thead className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <tr>
              {isLoading
                ? Array.from({ length: columnCount }).map((_, i) => (
                    <th key={i} className="px-4 py-3">
                      <Bone className="h-3 w-20" />
                    </th>
                  ))
                : headers?.map((header, i) => (
                    <th
                      key={i}
                      className="px-2 py-3 text-xs font-medium uppercase text-gray-500 whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              skeletonRows.map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: columnCount }).map((_, colIdx) => (
                    <td key={colIdx} className="px-4 py-3">
                      {colIdx === 0 ? (
                        /* First column special avatar layout */
                        <div className="flex items-center gap-2.5">
                          <Bone className="w-8 h-8 rounded-full shrink-0" />
                          <div className="flex flex-col gap-1.5">
                            <Bone className="h-3 w-24" />
                            <Bone className="h-2.5 w-14" />
                          </div>
                        </div>
                      ) : colIdx === 1 ? (
                        /* Second column text block lines layout */
                        <div className="flex flex-col gap-1.5">
                          <Bone className="h-3" style={{ width: `${120 + (i % 4) * 20}px` }} />
                          <Bone className="h-2.5" style={{ width: `${150 + (i % 3) * 25}px` }} />
                        </div>
                      ) : (
                        /* Default standard columns fallback layout */
                        <Bone className="h-3 w-16" />
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedItems.length === 0 ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-4 py-16 text-center text-sm text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, i) => renderRow(item, i))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}