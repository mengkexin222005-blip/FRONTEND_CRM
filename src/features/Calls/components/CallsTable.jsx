import { CheckCircle, Edit2, PhoneCall, Trash2 } from "lucide-react";

import {
  BaseTable,
  TableRow,
  TableCell,
  TablePagination,
  useTablePagination,
} from "../../../components/table";

const columns = [
  { key: "companyName", label: "Company" },
  { key: "contactPerson", label: "Contact Person" },
  { key: "contactValue", label: "Contact" },
  { key: "callType", label: "Call Type" },
  { key: "scheduledAt", label: "Schedule" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", align: "text-right" },
];

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getStatusClass = (status) => {
  switch (status) {
    case "Completed":
      return "bg-emerald-50 text-emerald-700";
    case "Cancelled":
      return "bg-red-50 text-red-700";
    case "Missed":
      return "bg-orange-50 text-orange-700";
    default:
      return "bg-sky-50 text-sky-700";
  }
};

export default function CallsTable({
  calls = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  onComplete,
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
  } = useTablePagination(calls, 10);

  const getScheduleClass = (scheduledAt, status) => {
    if (!scheduledAt) return "text-gray-400";

    const now = new Date();
    const schedule = new Date(scheduledAt);

    if (status === "Completed") {
      return "text-emerald-600";
    }

    if (status === "Cancelled") {
      return "text-red-500";
    }

    if (status === "Missed") {
      return "text-orange-600";
    }

    // Overdue
    if (schedule < now) {
      return "text-red-600";
    }

    // Today
    if (schedule.toDateString() === now.toDateString()) {
      return "text-amber-600";
    }

    // Upcoming
    return "text-sky-600";
  };

  return (
    <>
      <BaseTable
        columns={columns}
        empty={
          loading
            ? "Loading calls..."
            : calls.length === 0
              ? "No calls found."
              : null
        }
        colSpan={columns.length}
        minHeightClass="min-h-[calc(100vh-345px)]"
        heightClass="h-[540px]"
      >
        {paginatedItems.map((call) => (
          <TableRow
            key={call._id}
            title="Call record"
            onClick={() => onView?.(call)}
            className="cursor-pointer"
          >
            {/* COMPANY */}
            <TableCell>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <PhoneCall size={15} />
                </span>
                <span className="font-medium text-gray-700">
                  {call.companyName || "-"}
                </span>
              </div>
            </TableCell>

            {/* CONTACT PERSON */}
            <TableCell>
              <span className="font-medium text-gray-700">
                {call.contactPerson || "-"}
              </span>
            </TableCell>

            {/* CONTACT DETAILS */}
            <TableCell>
              <div>
                <p className="text-gray-700">
                  {call.contactValue || call.contactNumber || call.phone || "-"}
                </p>
                <p className="text-xs text-gray-400">
                  {call.contactMethod || "Mobile"}
                </p>
              </div>
            </TableCell>

            {/* CALL TYPE */}
            <TableCell>{call.callType || "-"}</TableCell>

            {/* SCHEDULE */}
            <TableCell>
              <span
                className={`font-medium ${getScheduleClass(call.scheduledAt, call.status)}`}
              >
                {formatDateTime(call.scheduledAt)}
              </span>
            </TableCell>

            {/* STATUS */}
            <TableCell>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                  call.status
                )}`}
              >
                {call.status || "Scheduled"}
              </span>
            </TableCell>

            {/* ACTIONS */}
            <TableCell align="text-right">
              <div className="flex items-center justify-end gap-3">
                {call.status !== "Completed" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onComplete?.(call._id);
                    }}
                    className="text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
                    title="Mark completed"
                  >
                    <CheckCircle size={16} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(call);
                  }}
                  className="text-gray-400 hover:text-sky-600 transition-colors cursor-pointer"
                  title="Edit call"
                >
                  <Edit2 size={16} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(call._id);
                  }}
                  className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                  title="Delete call"
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