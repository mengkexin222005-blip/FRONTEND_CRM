import { Link } from "react-router-dom";

import {
  TableRow,
  TableCell,
} from "../../../../components/table";

import LoaderTables from "../../../../components/loader/TablesLazyLoader";

// Table headers
const HEADERS = [
  { label: "Report Name" },
  { label: "Description" },
  { label: "Category" },
  { label: "Actions" },
];

export default function ReportTable({
  reports = [],
  isLoading = false,
  onEdit,
  onDelete,
}) {

  return (
    <LoaderTables
      paginatedItems={isLoading ? "loading" : reports}
      headers={HEADERS.map((h) => h.label)}
      emptyMessage="No reports found."
      // heightClass="h-full"
      renderRow={(report) => (
        <TableRow key={report._id}>
          {/* Report Name */}
          <TableCell>
            <Link
              to={report.route}
              className="font-medium text-red-600 hover:underline"
            >
              {report.title}
            </Link>
          </TableCell>

          {/* Description */}
          <TableCell>
            <span className="text-gray-600">
              {report.description}
            </span>
          </TableCell>

          {/* Category */}
          <TableCell>
            <span className="text-gray-600">
              {report.category}
            </span>
          </TableCell>

          {/* Actions */}
          <TableCell>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit?.(report)}
                className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(report._id)}
                className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </TableCell>
        </TableRow>
      )}
    />
  );
}