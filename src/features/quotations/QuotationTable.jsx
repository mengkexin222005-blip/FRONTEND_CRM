import { memo } from "react";
import { Pencil } from "lucide-react";
import { getDisplayName } from "../../utils/name";
import { formatDate } from "../../utils/date";
import { formatCurrencyCompact } from "../../utils/currency";

import {
  BaseTable,
  TableRow,
  TableCell,
  TablePagination,
  useTablePagination,
} from "../../components/table";
import LoaderTables from "../../components/loader/TablesLazyLoader";

import BaseBadge from "../../components/badge/BaseBadge";

const STATUS_CONFIG = {
  Draft: { tone: "gray" },
  Sent: { tone: "blue" },
  "Under Review": { tone: "amber" },
  Negotiation: { tone: "purple" },
  Approved: { tone: "green" },
  Rejected: { tone: "red" },
  Expired: { tone: "slate" },
};

function getQuotationDisplayData(quotation) {
  const title =
    quotation.quotationDetails?.quotationTitle ||
    quotation.title ||
    "Untitled Quotation";

  const quotationNumber =
    quotation.quotationDetails?.quotationNumber || quotation.number || null;

  const clientName =
    quotation.quotationDetails?.clientName ||
    quotation.clientName ||
    (quotation.client
      ? getDisplayName(quotation.client, {
          includeMiddleInitial: true,
          includeSuffix: true,
        })
      : "—");

  const quotationDate =
    quotation.quotationDetails?.quotationDate ||
    quotation.quotationDate ||
    quotation.expectedCloseDate;

  const status = quotation.status || quotation.stage || "Draft";

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;

  const total =
    quotation.value ?? quotation.quotationDetails?.total ?? 0;

  const currency = quotation.currency || "PHP";

  return {
    title,
    quotationNumber,
    clientName,
    quotationDate,
    status,
    statusConfig,
    total,
    currency,
  };
}

// Reusable, memoized row component
const QuotationTableRow = memo(function QuotationTableRow({
  quotation,
  permissions,
  onView,
  onEdit,
}) {
  const {
    title,
    quotationNumber,
    clientName,
    quotationDate,
    status,
    statusConfig,
    total,
    currency,
  } = getQuotationDisplayData(quotation);

  return (
    <TableRow onClick={() => onView?.(quotation)}>
      {/* Quotation Title & Number */}
      <TableCell className="max-w-72">
        <div className="min-w-0">
          <p className="font-medium truncate">{title}</p>
          {quotationNumber && (
            <p className="mt-0.5 text-xs text-gray-400">{quotationNumber}</p>
          )}
        </div>
      </TableCell>

      {/* Client */}
      <TableCell>
        <span className="text-sm text-gray-700">{clientName}</span>
      </TableCell>

      {/* Total */}
      <TableCell>
        <span className="text-sm font-semibold text-gray-700">
          {formatCurrencyCompact(total, currency)}
        </span>
      </TableCell>

      {/* Quotation Date */}
      <TableCell>
        {quotationDate ? (
          <span className="text-sm text-gray-700">
            {formatDate(quotationDate)}
          </span>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </TableCell>

      {/* Status */}
      <TableCell>
        <BaseBadge tone={statusConfig.tone} shape="soft">
          {status}
        </BaseBadge>
      </TableCell>

      {/* Edit */}
      {permissions?.canEdit && (
        <TableCell align="text-right">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(quotation);
            }}
            className="p-2 rounded-md transition-colors text-gray-400 hover:text-[#ef4444] cursor-pointer"
            title="Edit quotation"
          >
            <Pencil size={16} />
          </button>
        </TableCell>
      )}
    </TableRow>
  );
});

export default function QuotationTable({
  quotations,
  permissions = {},
  onView,
  onEdit,
  isLoading = false,
}) {
  const columns = [
    { label: "Quotation" },
    { label: "Client" },
    { label: "Total" },
    { label: "Quotation Date" },
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
  } = useTablePagination(quotations, 10);

  const HEADERS = columns.map((col) => col.label);

  if (isLoading) {
    return (
      <LoaderTables
        paginatedItems="loading"
        headers={HEADERS}
        emptyMessage="No quotations found."
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
        renderRow={(quotation) => (
          <QuotationTableRow
            key={quotation._id || quotation.quotationDetails?.quotationNumber || quotation.title}
            quotation={quotation}
            permissions={permissions}
            onView={onView}
            onEdit={onEdit}
          />
        )}
      />
    );
  }

  return (
    <>
      <BaseTable
        columns={columns}
        empty={paginatedItems.length === 0 ? "No quotations found." : null}
        colSpan={columns.length}
        heightClass="h-112.5"
      >
        {paginatedItems.map((quotation) => (
          <QuotationTableRow
            key={quotation._id || quotation.quotationDetails?.quotationNumber || quotation.title}
            quotation={quotation}
            permissions={permissions}
            onView={onView}
            onEdit={onEdit}
          />
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