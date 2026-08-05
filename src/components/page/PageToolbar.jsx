import { LayoutGrid, List } from "lucide-react";

const DEFAULT_VIEW_OPTIONS = [
  {
    value: "kanban",
    icon: LayoutGrid,
    title: "Kanban view",
  },
  {
    value: "table",
    icon: List,
    title: "Table view",
  },
];

/**
 * PageToolbar
 *
 * Reusable toolbar used across CRM pages.
 *
 * Layout:
 * [ Search ] [ Filters ] [ View Toggle ] [ Action Button ]
 *
 * Props:
 * @param {string} searchValue
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} onSearchChange
 * @param {string} searchPlaceholder
 * @param {React.ReactNode} filterSlot
 * @param {string} view
 * @param {(value: string) => void} onViewChange
 * @param {{
 *   value: string;
 *   icon: React.ComponentType<any>;
 *   title: string;
 * }[]} viewOptions
 * @param {React.ReactNode} actionButton
 */
export default function PageToolbar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  filterSlot = null,
  view,
  onViewChange,
  viewOptions = [],
  actionButton = null,
}) {
  const options =
    viewOptions.length > 0
      ? viewOptions
      : DEFAULT_VIEW_OPTIONS;

  const showViewToggle =
    view !== undefined &&
    typeof onViewChange === "function" &&
    options.length > 0;

  return (
    <div className="flex w-full flex-wrap items-center gap-2.5 lg:w-auto lg:flex-nowrap">
      {/* Search */}
      <input
        type="text"
        value={searchValue}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        className="w-full min-w-0 rounded-md border border-gray-300 px-3 py-1.5 text-sm transition-colors focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 sm:w-56"
      />

      {/* Filters */}
      {filterSlot}

      {/* View Toggle */}
      {showViewToggle && (
        <div className="flex overflow-hidden rounded-md border border-gray-300 bg-white">
          {options.map(({ value, icon: Icon, title }) => {
            const active = view === value;

            return (
              <button
                key={value}
                type="button"
                title={title}
                aria-label={title}
                onClick={() => onViewChange(value)}
                className={`flex h-9 w-9 cursor-pointer items-center justify-center transition-colors ${
                  active
                    ? "bg-red-500 text-white"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <Icon size={17} strokeWidth={2} />
              </button>
            );
          })}
        </div>
      )}

      {/* Action Button */}
      {actionButton}
    </div>
  );
}