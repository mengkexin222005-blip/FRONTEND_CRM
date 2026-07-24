import React from "react";
import {
  Building2,
  CalendarDays,
  Clock3,
  MapPin,
  Trash2,
  Pencil,
  UserRound,
  Users,
  Activity,
} from "lucide-react";

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const getStatusBadge = (status = "Scheduled") => {
  switch (status) {
    case "Completed":
      return { indicator: "🟢", bg: "bg-green-50 text-green-700 border-green-200" };
    case "In Progress":
      return { indicator: "🔵", bg: "bg-blue-50 text-blue-700 border-blue-200" };
    case "Cancelled":
      return { indicator: "🔴", bg: "bg-red-50 text-red-700 border-red-200" };
    case "Rescheduled":
      return { indicator: "🟡", bg: "bg-yellow-50 text-yellow-700 border-yellow-200" };
    case "No Show":
      return { indicator: "⚪", bg: "bg-gray-100 text-gray-700 border-gray-200" };
    case "Scheduled":
    default:
      return { indicator: "🟣", bg: "bg-purple-50 text-purple-700 border-purple-200" };
  }
};

export default function MeetingDetails({
  meeting,
  onClose,
  onEdit,
  onDelete,
}) {
  if (!meeting) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-gray-200 bg-white text-xs text-gray-400">
        Select a meeting to view its details.
      </div>
    );
  }

  const statusBadge = getStatusBadge(meeting.status);

  const details = [
    {
      icon: <Activity size={11} />,
      label: "Status",
      value: (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${statusBadge.bg}`}>
          <span>{statusBadge.indicator}</span>
          <span>{meeting.status || "Scheduled"}</span>
        </span>
      ),
    },
    {
      icon: <Building2 size={11} />,
      label: "Client",
      value: meeting.venue || meeting.client || "Client location",
    },
    {
      icon: <MapPin size={11} />,
      label: "Location",
      value: meeting.location || "—",
    },
    {
      icon: <CalendarDays size={11} />,
      label: "Date",
      value: formatDate(meeting.date),
    },
    {
      icon: <Clock3 size={11} />,
      label: "Time",
      value:
        meeting.startTime && meeting.endTime
          ? `${meeting.startTime} - ${meeting.endTime}`
          : meeting.startTime || meeting.time || "—",
    },
    {
      icon: <MapPin size={11} />,
      label: "Location Scope",
      value: meeting.locationScope || "Inside the Philippines",
    },
    {
      icon: <UserRound size={11} />,
      label: "Host",
      value: meeting.host || meeting.organizer || "—",
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col rounded-md border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-100 px-3 py-2 shrink-0">
        <div>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-semibold text-blue-600">
            {meeting.type || "Meeting"}
          </span>

          <h3 className="mt-1 text-[11px] font-semibold leading-4 text-gray-800">
            {meeting.title || "Untitled Meeting"}
          </h3>
        </div>

        <button
          onClick={onClose}
          className="text-base leading-none text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
        {/* Information */}
        <div className="overflow-hidden rounded-md border border-gray-100 bg-white">
          {details.map((item, index) => (
            <div
              key={item.label}
              className={`flex gap-2 px-2 py-2 ${
                index !== details.length - 1
                  ? "border-b border-gray-100"
                  : ""
              }`}
            >
              <div className="mt-0.5 text-gray-400">{item.icon}</div>

              <div className="min-w-0 flex-1">
                <p className="text-[7px] font-semibold uppercase text-gray-400">
                  {item.label}
                </p>

                <div className="truncate text-[10px] font-medium text-gray-800">
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Participants */}
        <div className="mt-3">
          <div className="mb-1 flex items-center gap-1 text-gray-500">
            <Users size={11} />
            <span className="text-[8px] font-semibold uppercase">
              Participants
            </span>
          </div>

          {meeting.participants?.length ? (
            <div className="space-y-1">
              {meeting.participants.map((person, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-md border border-gray-100 px-2 py-1"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[8px] font-semibold text-gray-600">
                    {person
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>

                  <span className="truncate text-[10px] text-gray-700">
                    {person}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-gray-200 py-3 text-center text-[11px] text-gray-400">
              No participants
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="mt-3">
          <div className="mb-1 text-[9px] font-semibold uppercase text-gray-500">
            Notes
          </div>

          <div className="rounded-md border border-gray-100 bg-gray-50 p-2">
            <p className="text-[11px] leading-4 text-gray-600">
              {meeting.notes || "No notes available."}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 gap-2 border-t border-gray-100 p-2">
        <button
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-1 rounded-md border border-gray-200 py-1.5 text-[11px] font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <Pencil size={11} />
          Edit
        </button>

        <button
          onClick={onDelete}
          className="flex flex-1 items-center justify-center gap-1 rounded-md border border-red-200 py-1.5 text-[11px] font-medium text-red-600 transition hover:bg-red-50"
        >
          <Trash2 size={11} />
          Delete
        </button>
      </div>
    </div>
  );
}