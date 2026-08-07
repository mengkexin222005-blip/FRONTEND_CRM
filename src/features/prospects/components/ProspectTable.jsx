import { Edit2, Trash2 } from "lucide-react";

import {
  BaseTable,
  TableRow,
  TableCell,
  TablePagination,
  useTablePagination,
} from "../../../components/table";
import StatusDropdown from "../../../components/select/StatusDropdown";

const columns = [
  { key: "number", label: "No." },
  { key: "companyName", label: "Company" },
  { key: "representative", label: "Representative" },
  { key: "companyEmailAddress", label: "Company Email" },
  { key: "phone", label: "Phone" },
  { key: "status", label: "Status" },
  { key: "actions", label: "", align: "text-right" },
];

const PROSPECT_STATUSES = ["New", "Contacted", "Lost"];

const PROSPECT_STATUS_TONE = {
  New: "blue",
  Contacted: "green",
  Lost: "red",
};

const EMPTY_VALUE = (
  <span className="text-gray-300 tracking-widest">
    ──────────
  </span>
);

const getInitials = (rep) => {
  if (!rep) return "?";
  const first = rep.firstName || "";
  const last = rep.lastName || "";

  if (first && last) {
    return `${first[0]}${last[0]}`.toUpperCase();
  }
  return (first[0] || "?").toUpperCase();
};

const renderRepresentative = (prospect) => {
  const representative = prospect?.representativeName || {};

  const name = [
    representative.firstName,
    representative.middleInitial,
    representative.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  if (!name) return EMPTY_VALUE;

  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200 uppercase">
        {getInitials(representative)}
      </span>
      <span className="text-sm font-medium text-gray-700">{name}</span>
    </div>
  );
};

export default function ProspectTable({
  prospects = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const {
    currentPage,
    rowsPerPage,
    totalRows,
    totalPages,
    paginatedItems,
    pageWindow,
    from,
    to,
    goTo,
    setRowsPerPage,
  } = useTablePagination(prospects, 10);

  return (
    <>
      <BaseTable
        columns={columns}
        empty={
          loading
            ? "Loading prospects..."
            : prospects.length === 0
              ? "No prospects found."
              : null
        }
        colSpan={columns.length}
        minHeightClass="min-h-[calc(100vh-345px)]"
        heightClass="h-[540px]"
      >
        {paginatedItems.map((prospect, index) => (
          <TableRow
            key={prospect._id}
            title="Prospect record"
            onClick={() => onView?.(prospect)}
            className="cursor-pointer"
          >
            <TableCell>
              <span className="text-gray-500">
                {(currentPage - 1) * rowsPerPage + index + 1}
              </span>
            </TableCell>

            <TableCell>
              <span className="font-medium text-gray-700">
                {prospect.companyName || EMPTY_VALUE}
              </span>
            </TableCell>

            <TableCell>{renderRepresentative(prospect)}</TableCell>

            <TableCell>
              {prospect.companyEmailAddress || EMPTY_VALUE}
            </TableCell>

            <TableCell>
              {prospect.phone || EMPTY_VALUE}
            </TableCell>

            <TableCell>
              <div
                className="w-[110px] [&_button]:w-full [&_button]:justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <StatusDropdown
                  status={prospect.status || "New"}
                  statuses={PROSPECT_STATUSES}
                  toneMap={PROSPECT_STATUS_TONE}
                  onSelect={(newStatus) => onStatusChange?.(prospect, newStatus)}
                />
              </div>
            </TableCell>

            <TableCell align="text-right">
              <div
                className="flex items-center justify-end gap-2"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onEdit?.(prospect)}
                  className="text-gray-400 hover:text-sky-600 cursor-pointer"
                  title="Edit prospect"
                >
                  <Edit2 size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => onDelete?.(prospect._id)}
                  className="text-gray-400 hover:text-red-600 cursor-pointer"
                  title="Delete prospect"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </BaseTable>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalRows={totalRows}
        rowsPerPage={rowsPerPage}
        from={from}
        to={to}
        pageWindow={pageWindow}
        onGoTo={goTo}
        onRowsPerPageChange={setRowsPerPage}
      />
    </>
  );
}