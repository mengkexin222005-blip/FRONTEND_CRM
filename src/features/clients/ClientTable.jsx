import { Pencil } from "lucide-react";
import { getProfileImage } from "../../utils/avatar";
import { getDisplayName } from "../../utils/name";
import { formatPhone } from "../../utils/format";

import StatusDropdown from "../../components/select/StatusDropdown";
import UserDisplayName from "../../components/UserDisplayName";

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
            <TableCell>
              <div className="flex items-center gap-2">
                <img
                  src={getProfileImage(client)}
                  alt="avatar"
                  className="w-9 h-9 rounded-full object-cover border border-gray-300"
                />
                <span>
                  {getDisplayName(client, {
                    includeMiddleInitial: true,
                    includeSuffix: true,
                  })}
                </span>
              </div>
            </TableCell>
            <TableCell>{client.company}</TableCell>
            {client.assignedTo ? (
              <TableCell>
                <div className="flex items-center gap-2">
                  <img
                    src={getProfileImage(client.assignedTo)}
                    alt="avatar"
                    className="w-7 h-7 rounded-full border object-cover border-gray-300"
                  />
                  <UserDisplayName user={client.assignedTo}>
                    {getDisplayName(client.assignedTo, {
                      includeMiddleInitial: true,
                      includeSuffix: true,
                    })}
                  </UserDisplayName>
                </div>
              </TableCell>
            ) : (
              <TableCell>
                <span className="text-sm text-gray-400 italic">Unassigned</span>
              </TableCell>
            )}
            <TableCell>
              <div className="text-sm">{formatPhone(client.phone)}</div>
              <div className="text-xs">{client.email}</div>
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
            <TableCell>
              <div className="flex items-center gap-2">
                <img
                  src={getProfileImage(client)}
                  alt="avatar"
                  className="w-9 h-9 rounded-full object-cover border border-gray-300"
                />
                <span>
                  {getDisplayName(client, {
                    includeMiddleInitial: true,
                    includeSuffix: true,
                  })}
                </span>
              </div>
            </TableCell>
            <TableCell>{client.company}</TableCell>
            {client.assignedTo ? (
              <TableCell>
                <div className="flex items-center gap-2">
                  <img
                    src={getProfileImage(client.assignedTo)}
                    alt="avatar"
                    className="w-7 h-7 rounded-full border object-cover border-gray-300"
                  />
                  <UserDisplayName user={client.assignedTo}>
                    {getDisplayName(client.assignedTo, {
                      includeMiddleInitial: true,
                      includeSuffix: true,
                    })}
                  </UserDisplayName>
                </div>
              </TableCell>
            ) : (
              <TableCell>
                <span className="text-sm text-gray-400 italic">Unassigned</span>
              </TableCell>
            )}

            <TableCell>
              <div className="text-sm">{formatPhone(client.phone)}</div>
            </TableCell>

            <TableCell>
              <div className="text-sm">{client.email}</div>
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