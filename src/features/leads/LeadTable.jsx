import { useState } from "react";
import { Pencil } from "lucide-react";
import { getProfileImage } from "../../utils/avatar";
import { getDisplayName } from "../../utils/name";
import { formatPhone } from "../../utils/format";

import {
  BaseTable,
  TableRow,
  TableCell,
  TablePagination,
  useTablePagination,
} from "../../components/table";
import LoaderTables from "../../components/loader/TablesLazyLoader";

import UserDisplayName from "../../components/UserDisplayName";
import StatusDropdown from "../../components/select/StatusDropdown";
import LeadActionConfirmModal from "./LeadActionConfirmModal";

const STATUSES = ["Contacted", "Qualified", "Converted", "Lost"];
const STATUS_TONE = {
  Contacted: "blue",
  Qualified: "amber",
  Converted: "green",
  Lost: "red",
};

const CONFIRM_STATUSES = new Set(["Lost", "Converted"]);

export default function LeadTable({
  leads,
  permissions,
  isCurrentAgent,
  onEdit,
  onView,
  onUpdateStatus,
  onConvertLead,
  onShowWarning,
  isLoading = false,
}) {
  const [pendingChange, setPendingChange] = useState(null);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  const columns = [
    { label: "Lead Owner" },
    { label: "Company" },
    { label: "Assigned Agent" },
    { label: "Contact Details" },
    { label: "Lead Source" },
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
  } = useTablePagination(leads, 10);

  const handleBeforeSelect = (lead, newStatus) => {
    if (CONFIRM_STATUSES.has(newStatus)) {
      if (newStatus === "Lost") {
        setPendingChange({ lead, newStatus });
        return;
      }

      if (newStatus === "Converted") {
        if (isCurrentAgent) {
          if (!lead.conversionRequested) {
            onShowWarning(
              "Approval required",
              "Please request conversion approval from your manager first.",
            );
            return;
          }

          if (!lead.conversionApproved) {
            onShowWarning(
              "Pending approval",
              "Your conversion request is still awaiting manager approval.",
            );
            return;
          }
        }

        if (
          !isCurrentAgent &&
          (lead.conversionRequested || lead.conversionApproved)
        ) {
          onShowWarning(
            "Cannot convert",
            "Conversion process has already started. The assigned agent must complete the conversion.",
          );
          return;
        }

        setPendingChange({ lead, newStatus });
        return;
      }
    }

    onUpdateStatus(lead._id, newStatus);
  };

  const handleConfirm = async () => {
    if (!pendingChange || confirmSubmitting) return;
    setConfirmSubmitting(true);
    try {
      if (pendingChange.newStatus === "Converted") {
        await onConvertLead(pendingChange.lead._id);
      } else {
        await onUpdateStatus(pendingChange.lead._id, pendingChange.newStatus);
      }
      setPendingChange(null);
    } finally {
      setConfirmSubmitting(false);
    }
  };

  const handleCancel = () => setPendingChange(null);

  const HEADERS = columns.map((col) => col.label);

  if (isLoading) {
    return (
      <LoaderTables
        paginatedItems="loading"
        headers={HEADERS}
        emptyMessage="No leads found."
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
        renderRow={(lead) => (
          <TableRow key={lead._id} onClick={() => onView(lead)}>
            <TableCell>
              <div className="flex items-center gap-2">
                <img
                  src={getProfileImage(lead)}
                  alt="avatar"
                  className="w-9 h-9 rounded-full object-cover border border-gray-300"
                />
                <span>
                  {getDisplayName(lead, {
                    includeMiddleInitial: true,
                    includeSuffix: true,
                  })}
                </span>
              </div>
            </TableCell>
            <TableCell>{lead.company}</TableCell>
            {lead.leadAssignee ? (
              <TableCell>
                <div className="flex items-center gap-2">
                  <img
                    src={getProfileImage(lead.leadAssignee)}
                    className="w-7 h-7 rounded-full border border-gray-300"
                  />
                  <UserDisplayName user={lead.leadAssignee}>
                    {getDisplayName(lead.leadAssignee, {
                      includeMiddleInitial: true,
                      includeSuffix: true,
                    })}
                  </UserDisplayName>
                </div>
              </TableCell>
            ) : (
              <TableCell>
                <span className="text-sm italic text-gray-400">
                  No agent assigned
                </span>
              </TableCell>
            )}
            <TableCell>
              <div className="text-sm">{formatPhone(lead.phone)}</div>
              <div className="text-xs">{lead.email}</div>
            </TableCell>
            <TableCell>{lead.leadSource || "-"}</TableCell>
            <TableCell>
              <StatusDropdown
                status={lead.status}
                statuses={STATUSES}
                toneMap={STATUS_TONE}
                disabled={
                  !permissions.canEdit ||
                  lead.convertedToClient ||
                  lead.status === "Lost"
                }
                onBeforeSelect={(newStatus) =>
                  handleBeforeSelect(lead, newStatus)
                }
                onSelect={(newStatus) => onUpdateStatus(lead._id, newStatus)}
              />
            </TableCell>
            {permissions.canEdit && (
              <TableCell>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!lead.convertedToClient) onEdit(lead);
                  }}
                  disabled={lead.convertedToClient}
                  className={`p-2 rounded-md transition-colors ${
                    lead.convertedToClient
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-400 hover:text-[#ef4444] cursor-pointer"
                  }`}
                  title={
                    lead.convertedToClient
                      ? "Converted leads cannot be edited"
                      : "Edit lead"
                  }
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
    <>
      <BaseTable
        columns={columns}
        empty={paginatedItems.length === 0 ? "No leads found." : null}
        colSpan={columns.length}
        heightClass="h-112.5"
      >
        {paginatedItems.map((lead) => (
          <TableRow key={lead._id} onClick={() => onView(lead)}>
            <TableCell>
              <div className="flex items-center gap-2">
                <img
                  src={getProfileImage(lead)}
                  alt="avatar"
                  className="w-9 h-9 rounded-full object-cover border border-gray-300"
                />
                <span>
                  {getDisplayName(lead, {
                    includeMiddleInitial: true,
                    includeSuffix: true,
                  })}
                </span>
              </div>
            </TableCell>
            <TableCell>{lead.company}</TableCell>
            {lead.leadAssignee ? (
              <TableCell>
                <div className="flex items-center gap-2">
                  <img
                    src={getProfileImage(lead.leadAssignee)}
                    className="w-7 h-7 rounded-full border border-gray-300"
                  />
                  <UserDisplayName user={lead.leadAssignee}>
                    {getDisplayName(lead.leadAssignee, {
                      includeMiddleInitial: true,
                      includeSuffix: true,
                    })}
                  </UserDisplayName>
                </div>
              </TableCell>
            ) : (
              <TableCell>
                <span className="text-sm italic text-gray-400">
                  No agent assigned
                </span>
              </TableCell>
            )}
            <TableCell>
              <div className="text-sm">{formatPhone(lead.phone)}</div>
              <div className="text-xs">{lead.email}</div>
            </TableCell>
            <TableCell>{lead.leadSource || "-"}</TableCell>
            <TableCell>
              <StatusDropdown
                status={lead.status}
                statuses={STATUSES}
                toneMap={STATUS_TONE}
                disabled={
                  !permissions.canEdit ||
                  lead.convertedToClient ||
                  lead.status === "Lost"
                }
                onBeforeSelect={(newStatus) =>
                  handleBeforeSelect(lead, newStatus)
                }
                onSelect={(newStatus) => onUpdateStatus(lead._id, newStatus)}
              />
            </TableCell>
            {permissions.canEdit && (
              <TableCell>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!lead.convertedToClient) onEdit(lead);
                  }}
                  disabled={lead.convertedToClient}
                  className={`p-2 rounded-md transition-colors ${
                    lead.convertedToClient
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-400 hover:text-[#ef4444] cursor-pointer"
                  }`}
                  title={
                    lead.convertedToClient
                      ? "Converted leads cannot be edited"
                      : "Edit lead"
                  }
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
      />

      <LeadActionConfirmModal
        open={Boolean(pendingChange)}
        lead={pendingChange?.lead}
        action={pendingChange?.newStatus === "Converted" ? "convert" : "lost"}
        submitting={confirmSubmitting}
        canConvert={permissions.canConvert}
        onClose={handleCancel}
        onConfirm={handleConfirm}
      />
    </>
  );
}