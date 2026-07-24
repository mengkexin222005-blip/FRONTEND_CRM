import { ChevronDown, Loader2 } from "lucide-react";

export default function ViewMoreButton({
  hasMore,
  loadingMore,
  onViewMore,
  totalRows,
  shown,
}) {
  if (!hasMore) {
    // Show a subtle "all loaded" hint only if there were items
    if (shown === 0) return null;
    return (
      <p className="text-center text-[11px] text-gray-400 mt-3 pt-3 border-t border-gray-200">
        All {totalRows} {totalRows === 1 ? "record" : "records"} shown
      </p>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-200 flex flex-col items-center gap-1">
      <button
        onClick={onViewMore}
        disabled={loadingMore}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loadingMore ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <ChevronDown size={12} />
        )}
        {loadingMore ? "Loading…" : `View more`}
      </button>
      <span className="text-[11px] text-gray-400">
        Showing {shown} of {totalRows}
      </span>
    </div>
  );
}
