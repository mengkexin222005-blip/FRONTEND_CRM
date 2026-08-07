import { Edit2, PhoneCall, Trash2 } from "lucide-react";

import {
  BaseTable,
  TableRow,
  TableCell,
  TablePagination,
  useTablePagination,
} from "../../../components/table";

import StatusDropdown from "../../../components/select/StatusDropdown";

const columns = [
  { key: "companyName", label: "Company" },
  { key: "contactPerson", label: "Contact Person" },
  { key: "contactValue", label: "Contact" },
  { key: "callType", label: "Call Type" },
  { key: "scheduledDate", label: "Date" },
  { key: "scheduledTime", label: "Time" },
  { key: "status", label: "Status" },
  { key: "actions", label: "", align: "text-right" },
];

const CALL_STATUSES = ["Scheduled", "Completed", "Missed", "Cancelled"];

const CALL_STATUS_TONE = {
  Scheduled: "blue",
  Completed: "green",
  Missed: "amber",
  Cancelled: "red",
};

const EMPTY_VALUE = (
  <span className="text-gray-300 tracking-widest">
    ──────────
  </span>
);

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";

  const first = parts[0];
  const last = parts[parts.length - 1];

  if (parts.length > 1 && first !== last) {
    return `${first[0]}${last[0]}`.toUpperCase();
  }
  return (first[0] || "?").toUpperCase();
};

const formatDate = (value) => {
  if (!value) return EMPTY_VALUE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE;

  return date.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return EMPTY_VALUE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE;

  return date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const renderContactPerson = (contactPerson) => {
  if (!contactPerson) return EMPTY_VALUE;

  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200 uppercase">
        {getInitials(contactPerson)}
      </span>
      <span className="font-medium text-gray-700 text-sm">
        {contactPerson}
      </span>
    </div>
  );
};

export default function CallsTable({
  calls = [],
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
  } = useTablePagination(calls, 10);

  return (
    <div className="flex flex-col h-[calc(100vh-210px)] justify-between">
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
      >
        {paginatedItems.map((call) => {
          const contactVal = call.contactValue || call.contactNumber || call.phone;

          return (
            <TableRow
              key={call._id}
              title="Call record"
              onClick={() => onView?.(call)}
              className="cursor-pointer"
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                    <PhoneCall size={15} />
                  </span>
                  <span className="font-medium text-gray-700">
                    {call.companyName || EMPTY_VALUE}
                  </span>
                </div>
              </TableCell>

              <TableCell>
                {renderContactPerson(call.contactPerson)}
              </TableCell>

              <TableCell>
                {contactVal ? (
                  <div>
                    <p className="text-gray-700">{contactVal}</p>
                    <p className="text-xs text-gray-400">
                      {call.contactMethod || "Mobile"}
                    </p>
                  </div>
                ) : (
                  EMPTY_VALUE
                )}
              </TableCell>

              <TableCell>{call.callType || EMPTY_VALUE}</TableCell>

              <TableCell>
                <span className="font-medium text-gray-600">
                  {formatDate(call.scheduledAt)}
                </span>
              </TableCell>

              <TableCell>
                <span className="font-medium text-gray-600">
                  {formatTime(call.scheduledAt)}
                </span>
              </TableCell>

              <TableCell>
                <div onClick={(e) => e.stopPropagation()}>
                  <StatusDropdown
                    status={call.status || "Scheduled"}
                    statuses={CALL_STATUSES}
                    toneMap={CALL_STATUS_TONE}
                    onSelect={(newStatus) => onStatusChange?.(call, newStatus)}
                  />
                </div>
              </TableCell>

              <TableCell align="text-right">
                <div className="flex items-center justify-end gap-3">
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
          );
        })}
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
        marginTop="mt-2"
      />
    </div>
  );
}