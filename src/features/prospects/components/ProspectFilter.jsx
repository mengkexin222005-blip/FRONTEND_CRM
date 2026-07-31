import { useState } from "react";
import { Filter } from "lucide-react";

const statusOptions = ["All", "New", "Contacted", "Qualified", "Converted", "Lost"];

const sourceOptions = [
  "All",
  "Website",
  "Facebook",
  "Referral",
  "Walk-in",
  "Email",
  "Phone Call",
  "Event",
  "Others",
];

export default function ProspectFilter({
  statusFilter,
  setStatusFilter,
  sourceFilter,
  setSourceFilter,
}) {
  const [open, setOpen] = useState(false);

  const hasActiveFilter = statusFilter !== "All" || sourceFilter !== "All";

  const clearFilters = () => {
    setStatusFilter("All");
    setSourceFilter("All");
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex h-[54px] w-[118px] items-center justify-center gap-3 rounded-md border text-[19px] font-medium transition ${
          hasActiveFilter
            ? "border-red-500 bg-red-50 text-red-600"
            : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        <Filter size={22} strokeWidth={2.1} />
        Filter
      </button>

      {open && (
        <div className="absolute right-0 top-[62px] z-30 w-[290px] rounded-md border border-gray-200 bg-white p-4 shadow-lg">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-500">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === "All" ? "All Status" : status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-500">
                Lead Source
              </label>

              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              >
                {sourceOptions.map((source) => (
                  <option key={source} value={source}>
                    {source === "All" ? "All Sources" : source}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md bg-red-500 px-3 py-2 text-xs font-medium text-white hover:bg-red-600"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}