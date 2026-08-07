import { Pencil } from "lucide-react";
import { getDisplayName } from "../../utils/name";
import { formatPhone } from "../../utils/format";

import StatusDropdown from "../../components/select/StatusDropdown";

import {
  BaseTable,
  TableRow,
  TableCell,
  TablePagination,
  useTablePagination,
} from "../../components/table";
import LoaderTables from "../../components/loader/TablesLazyLoader";

const CLIENT_STATUSES = ["Active", "Inactive", "Lost"];
const CLIENT_STATUS_TONE = {
  Active: "green",
  Inactive: "gray",
  Lost: "red",
};

const EMPTY_VALUE = (
  <span className="text-gray-300 tracking-widest">
    ─────────
  </span>
);

const getInitials = (person) => {
  if (!person) return "?";
  const first = person.firstName || person.name?.split(" ")[0] || "";
  const last = person.lastName || person.name?.split(" ").slice(-1)[0] || "";

  if (first && last && first !== last) {
    return `${first[0]}${last[0]}`.toUpperCase();
  }
  return (first[0] || "?").toUpperCase();
};

export default function ClientTable({
  clients,
  permissions = {},
  onEdit,
  onView,
  onUpdateStatus,
  isLoading = false,
}) {
  const columns = [
    { label: "Name" },
    { label: "Company" },
    { label: "Account owner" },
    { label: "Contact" },
    { label: "Email" },
    { label: "Status" },
    ...(permissions.canEdit ? [{ label: "", align: "text-right" }] : []),
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
  } = useTablePagination(clients, 10);

  const HEADERS = columns.map((col) => col.label);

  const renderUserCell = (person, size = "w-9 h-9", textClass = "text-sm") => {
    if (!person) return EMPTY_VALUE;

    const name = getDisplayName(person, {
      includeMiddleInitial: true,
      includeSuffix: true,
    });

    return (
      <div className="flex items-center gap-2">
        <span
          className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200 uppercase`}
        >
          {getInitials(person)}
        </span>
        <span className={`font-medium text-gray-700 ${textClass}`}>{name}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <LoaderTables
        paginatedItems="loading"
        headers={HEADERS}
        emptyMessage="No clients found."
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
        renderRow={(client) => (
          <TableRow key={client._id} onClick={() => onView(client)}>
            <TableCell>{renderUserCell(client)}</TableCell>
            <TableCell>{client.company || EMPTY_VALUE}</TableCell>
            <TableCell>
              {renderUserCell(client.assignedTo, "w-7 h-7", "text-sm")}
            </TableCell>
            <TableCell>
              <div className="text-sm">
                {client.phone ? formatPhone(client.phone) : EMPTY_VALUE}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">{client.email || EMPTY_VALUE}</div>
            </TableCell>
            <TableCell>
              <StatusDropdown
                status={client.status}
                statuses={CLIENT_STATUSES}
                toneMap={CLIENT_STATUS_TONE}
                disabled={!permissions.canEdit}
                onSelect={(newStatus) =>
                  onUpdateStatus(client._id, newStatus)
                }
              />
            </TableCell>
            {permissions.canEdit && (
              <TableCell>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(client);
                  }}
                  className="p-2 rounded-md text-gray-400 hover:text-[#ef4444] transition-colors hover:fill-[#ef4444] cursor-pointer fill"
                  title="Edit client"
                >
                  <Pencil size={16} />
                </button>
              </TableCell>
            )}
          </TableRow>
        )}
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-210px)] justify-between">
      <BaseTable
        columns={columns}
        empty={paginatedItems.length === 0 ? "No clients found." : null}
        colSpan={columns.length}
      >
        {paginatedItems.map((client) => (
          <TableRow key={client._id} onClick={() => onView(client)}>
            <TableCell>{renderUserCell(client)}</TableCell>
            <TableCell>{client.company || EMPTY_VALUE}</TableCell>
            <TableCell>
              {renderUserCell(client.assignedTo, "w-7 h-7", "text-sm")}
            </TableCell>

            <TableCell>
              <div className="text-sm">
                {client.phone ? formatPhone(client.phone) : EMPTY_VALUE}
              </div>
            </TableCell>

            <TableCell>
              <div className="text-sm">{client.email || EMPTY_VALUE}</div>
            </TableCell>

            <TableCell>
              <StatusDropdown
                status={client.status}
                statuses={CLIENT_STATUSES}
                toneMap={CLIENT_STATUS_TONE}
                disabled={!permissions.canEdit}
                onSelect={(newStatus) =>
                  onUpdateStatus(client._id, newStatus)
                }
              />
            </TableCell>

            {permissions.canEdit && (
              <TableCell>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(client);
                  }}
                  className="p-2 rounded-md text-gray-400 hover:text-[#ef4444] transition-colors hover:fill-[#ef4444] cursor-pointer fill"
                  title="Edit client"
                >
                  <Pencil size={16} />
                </button>
              </TableCell>
            )}
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
        marginTop="mt-2"
      />
    </div>
  );
}