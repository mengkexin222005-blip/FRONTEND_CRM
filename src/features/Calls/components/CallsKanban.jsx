import { useMemo } from "react";
import { Edit2, PhoneCall, Trash2 } from "lucide-react";

import BaseKanban from "../../../components/kanban/BaseKanban";
import BaseDraggableCard from "../../../components/kanban/BaseDraggableCard";
import KanbanColumnHeader from "../../../components/kanban/KanbanColumnHeader";
import LoaderCards from "../../../components/loader/CardsLazyLoader";

const CALL_STATUS = ["Scheduled", "Completed", "Missed", "Cancelled"];

const STATUS_SUBTEXT = {
  Scheduled: "Upcoming client calls",
  Completed: "Finished calls",
  Missed: "Unattended calls",
  Cancelled: "Cancelled calls",
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-PH", {
    month: "short",
    day: "2-digit",
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

const groupCallsByStatus = (calls = [], statuses = CALL_STATUS) => {
  return statuses.reduce((result, status) => {
    result[status] = calls.filter((call) => call.status === status);
    return result;
  }, {});
};

export default function CallsKanban({
  calls = [],
  loading = false,
  onView,
  onEdit,
  onStatusChange,
  onDelete,
}) {
  const columns = useMemo(() => groupCallsByStatus(calls, CALL_STATUS), [calls]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    const newStatus = destination.droppableId;
    const oldStatus = source.droppableId;

    if (oldStatus === newStatus) return;

    const call = calls.find((item) => String(item._id) === String(draggableId));
    if (!call) return;

    if (onStatusChange) {
      await onStatusChange(call._id, newStatus);
    } else {
      await onEdit?.(call._id, { status: newStatus });
    }
  };

  if (loading) {
    return <LoaderCards columns={CALL_STATUS} />;
  }

  return (
    <BaseKanban
      columns={columns}
      statuses={CALL_STATUS}
      onDragEnd={handleDragEnd}
      emptyMessage="No calls"
      successStatus="Completed"
      maxHeight="calc(100vh - 280px)"
      renderHeader={(status, items) => (
        <KanbanColumnHeader
          label={status}
          count={items.length}
          successStatus="Completed"
          subtext={STATUS_SUBTEXT[status]}
        />
      )}
      renderCard={(call, index, items) => (
        <BaseDraggableCard
          key={call._id}
          id={String(call._id)}
          index={index}
          isLast={index === items.length - 1}
          wrapperClassName="hover:border-red-200 hover:bg-red-50 cursor-pointer"
          onClick={() => onView?.(call)}
        >
          {/* Header section */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="truncate text-sm font-semibold text-gray-800">
                {call.contactPerson || "-"}
              </h4>
              <p className="mt-1 truncate text-xs text-gray-500">
                {call.companyName || "No company"}
              </p>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
              <PhoneCall size={15} />
            </span>
          </div>

          {/* Call Details */}
          <div className="mt-3 space-y-1.5 text-xs text-gray-500">
            <p className="truncate">
              {call.contactMethod || "Mobile"}: {call.contactValue || "-"}
            </p>
            <p className="truncate">
              {call.callType || "Follow-up Call"}
            </p>
            <p>{formatDateTime(call.scheduledAt)}</p>
          </div>

          {/* Status Badge */}
          <div className="mt-3">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                call.status
              )}`}
            >
              {call.status || "Scheduled"}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(call);
              }}
              className="text-gray-400 hover:text-sky-600 transition-colors cursor-pointer"
              title="Edit call"
            >
              <Edit2 size={15} />
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
              <Trash2 size={15} />
            </button>
          </div>
        </BaseDraggableCard>
      )}
    />
  );
}