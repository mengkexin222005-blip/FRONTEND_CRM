import { Pencil, Trash2, User } from "lucide-react";

import { getProfileImage } from "../../../utils/avatar";
import { getDisplayName } from "../../../utils/name";
import { formatDate } from "../../../utils/date";

import {
  BaseTable,
  TableRow,
  TableCell,
  TablePagination,
  useTablePagination,
} from "../../../components/table";

import LoaderTables from "../../../components/loader/TablesLazyLoader";
import UserDisplayName from "../../../components/UserDisplayName";
import StatusDropdown from "../../../components/select/StatusDropdown";

const MEETING_STATUSES = ["Scheduled", "Ongoing", "Completed", "Cancelled"];

const MEETING_STATUS_TONE = {
  Scheduled: "blue",
  Ongoing: "yellow",
  Completed: "green",
  Cancelled: "red",
};

const getHostDetails = (meeting) => {
  const host = meeting.host || meeting.organizer;

  if (!host) {
    return {
      label: "Unassigned",
      type: "unassigned",
      user: null,
    };
  }

  if (typeof host === "object") {
    return {
      label: (
        <UserDisplayName user={host}>
          {getDisplayName(host, {
            includeMiddleInitial: true,
            includeSuffix: true,
          })}
        </UserDisplayName>
      ),
      type: "assigned",
      user: host,
    };
  }

  return {
    label: host,
    type: "string",
    user: null,
  };
};

export default function MeetingTable({
  meetings = [],
  permissions = {},
  onEdit,
  onView,
  onDelete,
  onUpdateStatus,
  isLoading = false,
}) {
  const canEdit = permissions.canEdit !== false;

  const columns = [
    { label: "Meeting Title" },
    { label: "Type" },
    { label: "Host" },
    { label: "Location" },
    { label: "Date & Time" },
    { label: "Status" },
    ...(canEdit ? [{ label: "", align: "text-right" }] : []),
  ];

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
  } = useTablePagination(meetings, 10);

  const HEADERS = columns.map((col) => col.label);

  if (isLoading) {
    return (
      <LoaderTables
        paginatedItems="loading"
        headers={HEADERS}
        emptyMessage="No meetings found."
        heightClass="h-112.5"
        currentPage={currentPage}
        totalPages={totalPages}
        totalRows={totalRows}
        rowsPerPage={rowsPerPage}
        from={from}
        to={to}
        pageWindow={pageWindow}
        onGoTo={goTo}
        onRowsPerPageChange={setRowsPerPage}
        renderRow={() => <TableRow />}
      />
    );
  }

  return (
    <>
      <BaseTable
        columns={columns}
        empty={paginatedItems.length === 0 ? "No meetings found." : null}
        colSpan={columns.length}
        heightClass="h-112.5"
      >
        {paginatedItems.map((meeting) => {
          const hostDetails = getHostDetails(meeting);
          const hostPhoto = getProfileImage(hostDetails.user);

          return (
            <TableRow
              key={meeting.id || meeting._id}
              onClick={() => onView?.(meeting)}
            >
              {/* MEETING TITLE */}
              <TableCell>
                <div>
                  <div className="font-medium text-gray-900">
                    {meeting.title}
                  </div>
                  {meeting.client && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      Client: {meeting.client}
                    </div>
                  )}
                </div>
              </TableCell>

              {/* TYPE */}
              <TableCell>{meeting.type || "General"}</TableCell>

              {/* HOST */}
              <TableCell>
                {hostDetails.type === "unassigned" ? (
                  <span className="text-sm text-gray-400 italic">
                    Unassigned
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    {hostPhoto ? (
                      <img
                        src={hostPhoto}
                        alt="avatar"
                        className="w-7 h-7 rounded-full border object-cover border-gray-300"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center border border-gray-300">
                        <User size={13} className="text-gray-400" />
                      </div>
                    )}
                    <span>{hostDetails.label}</span>
                  </div>
                )}
              </TableCell>

              {/* LOCATION */}
              <TableCell>{meeting.location || "—"}</TableCell>

              {/* DATE & TIME */}
              <TableCell>
                <div className="text-sm">
                  {meeting.date ? formatDate(meeting.date) : "—"}
                </div>
                {(meeting.time || meeting.startTime) && (
                  <div className="text-xs text-gray-400">
                    {meeting.time ||
                      `${meeting.startTime} - ${meeting.endTime}`}
                  </div>
                )}
              </TableCell>

              {/* STATUS */}
              <TableCell>
                <div onClick={(e) => e.stopPropagation()}>
                  <StatusDropdown
                    status={meeting.status || "Scheduled"}
                    statuses={MEETING_STATUSES}
                    toneMap={MEETING_STATUS_TONE}
                    disabled={!canEdit}
                    onSelect={(newStatus) =>
                      onUpdateStatus?.(meeting.id || meeting._id, newStatus)
                    }
                  />
                </div>
              </TableCell>

              {/* ACTIONS */}
              {canEdit && (
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(meeting);
                      }}
                      className="p-2 rounded-md text-gray-400 hover:text-[#ef4444] transition-colors cursor-pointer"
                      title="Edit meeting"
                    >
                      <Pencil size={16} />
                    </button>

                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(meeting.id || meeting._id);
                        }}
                        className="p-2 rounded-md text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete meeting"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </TableCell>
              )}
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
      />
    </>
  );
}