import { Edit2, Phone, FileX } from "lucide-react";

import {
  BaseTable,
  TableRow,
  TableCell,
  TablePagination,
  useTablePagination,
} from "../../../components/table";

const columns = [
  { key: "companyName", label: "Company" },
  { key: "representative", label: "Representative" },
  { key: "companyEmailAddress", label: "Company Email" },
  { key: "phone", label: "Phone" },
  { key: "leadSource", label: "Lead Source" },
  { key: "status", label: "Status" },
  { key: "actions", label: "", align: "text-right" },
];

const getRepresentativeName = (prospect) => {
  const representative = prospect?.representativeName || {};

  const name = [
    representative.firstName,
    representative.middleInitial,
    representative.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return name || "-";
};

const getStatusClass = (status) => {
  switch (status) {
    // case "Contacted":
    //   return "bg-amber-50 text-amber-700";
    case "Lost":
      return "bg-red-50 text-red-700";
    default:
      return "bg-sky-50 text-sky-700";
  }
};

export default function ProspectTable({
  prospects = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  onContact,
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
        {paginatedItems.map((prospect) => (
          <TableRow
            key={prospect._id}
            title="Prospect record"
            onClick={() => onView?.(prospect)}
            className="cursor-pointer"
          >
            <TableCell>
              <span className="font-medium text-gray-700">
                {prospect.companyName || "-"}
              </span>
            </TableCell>

            <TableCell>{getRepresentativeName(prospect)}</TableCell>

            <TableCell>{prospect.companyEmailAddress || "-"}</TableCell>

            <TableCell>{prospect.phone || "-"}</TableCell>

            <TableCell>{prospect.leadSource || "-"}</TableCell>

            <TableCell>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                  prospect.status,
                )}`}
              >
                {prospect.status || "New"}
              </span>
            </TableCell>

            <TableCell align="text-right">
              <div
                className="flex items-center justify-end gap-2"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onContact?.(prospect._id)}
                  className="text-gray-400 hover:text-emerald-600 cursor-pointer"
                  title="Move to leads"
                >
                  <Phone size={16} />
                </button>

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
                  <FileX size={16} />
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