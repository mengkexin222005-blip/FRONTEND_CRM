import { Edit2, Phone, Trash2 } from "lucide-react";

import BaseKanban from "../../../components/kanban/BaseKanban";
import BaseDraggableCard from "../../../components/kanban/BaseDraggableCard";
import KanbanColumnHeader from "../../../components/kanban/KanbanColumnHeader";

const STATUSES = ["New", "Lost"];

const getRepresentativeName = (prospect) => {
  const representative = prospect?.representativeName || {};

  const name = [
    representative.firstName,
    representative.middleInitial,
    representative.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return name || "No representative";
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

const groupProspectsByStatus = (prospects) => {
  return STATUSES.reduce((grouped, status) => {
    grouped[status] = prospects.filter(
      (prospect) => (prospect.status || "New") === status,
    );

    return grouped;
  }, {});
};

export default function ProspectKanban({
  prospects = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  onContact,
  onStatusChange,
}) {
  const columns = groupProspectsByStatus(prospects);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    const currentStatus = source.droppableId;
    const nextStatus = destination.droppableId;

    if (currentStatus === nextStatus) return;

    await onStatusChange?.(draggableId, nextStatus);
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((status) => (
          <div
            key={status}
            className="shrink-0 w-70 rounded-md border border-gray-200 bg-gray-50"
          >
            <div className="p-3 border-b border-gray-200">
              <div className="h-5 w-24 rounded bg-gray-200 animate-pulse" />
            </div>

            <div className="p-2 space-y-2">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-28 rounded-md border border-gray-200 bg-white animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <BaseKanban
      columns={columns}
      statuses={STATUSES}
      onDragEnd={handleDragEnd}
      emptyMessage="No prospects"
      maxHeight="calc(100vh - 260px)"
      renderHeader={(status, items) => (
        <KanbanColumnHeader
          label={status}
          count={items.length}
          subtext={`${items.length} prospect${items.length === 1 ? "" : "s"}`}
        />
      )}
      renderCard={(prospect, index, items) => (
        <BaseDraggableCard
          key={prospect._id}
          id={prospect._id}
          index={index}
          isLast={index === items.length - 1}
          onClick={() => onView?.(prospect)}
          wrapperClassName="hover:border-red-200 hover:bg-red-50 cursor-pointer"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-gray-800 truncate">
                {prospect.companyName || "Unnamed company"}
              </h4>

              <p className="text-xs text-gray-500 mt-1 truncate">
                {getRepresentativeName(prospect)}
              </p>
            </div>

            <span className="text-[11px] rounded-full bg-gray-100 text-gray-500 px-2 py-1 shrink-0">
              {prospect.leadSource || "Others"}
            </span>
          </div>

          <div className="mt-3 space-y-1.5 text-xs text-gray-500">
            <p className="truncate">
              {prospect.companyEmailAddress || "No email"}
            </p>
            <p>{prospect.phone || "No phone"}</p>
          </div>

          <div className="mt-4">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                prospect.status || "New",
              )}`}
            >
              {prospect.status || "New"}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onContact?.(prospect._id);
              }}
              className="p-1.5 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-white cursor-pointer"
              title="Move to leads"
            >
              <Phone size={15} />
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onEdit?.(prospect);
              }}
              className="p-1.5 rounded-md text-gray-400 hover:text-sky-600 hover:bg-white cursor-pointer"
              title="Edit prospect"
            >
              <Edit2 size={15} />
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.(prospect._id);
              }}
              className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-white cursor-pointer"
              title="Delete prospect"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </BaseDraggableCard>
      )}
    />
  );
}