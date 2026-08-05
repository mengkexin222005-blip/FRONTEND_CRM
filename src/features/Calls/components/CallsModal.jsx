import { useMemo } from "react";
import Select from "react-select";
import {
  PhoneCall,
  User,
  Calendar,
  Clock,
  Pencil,
  Building,
  Phone,
} from "lucide-react";

import { getSelectProps } from "../../../components/select/selectConfig";
import FormDrawer from "../../../components/form/FormDrawer";
import {
  FormLabel,
  FormInput,
  FormTextarea,
} from "../../../components/form/FormField";

import BaseBadge from "../../../components/badge/BaseBadge";
import UserDisplayName from "../../../components/UserDisplayName";
import ActivityTimeline from "../../../components/activity/ActivityTimeline";
import { getDisplayName } from "../../../utils/name";
import { formatDate, formatDateTime } from "../../../utils/date";

const CALL_TYPES = [
  "Follow-up Call",
  "Initial Client Contact",
  "Sales Discussion",
  "Others",
];

const CONTACT_METHODS = ["Mobile", "WhatsApp", "Viber"];
const STATUSES = ["Scheduled", "Completed", "Cancelled", "Missed"];

const STATUS_COLORS = {
  Scheduled: "sky",
  Completed: "green",
  Cancelled: "red",
  Missed: "amber",
};

const STATUS_TEXT_COLORS = {
  Scheduled: "text-sky-600",
  Completed: "text-emerald-600",
  Cancelled: "text-red-600",
  Missed: "text-orange-600",
};

const formatTimeString = (timeStr) => {
  if (!timeStr) return "—";
  try {
    const date = new Date(timeStr);
    if (Number.isNaN(date.getTime())) return timeStr;
    return date.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
};

const safeFormatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return formatDate ? formatDate(dateStr) : String(dateStr);
  } catch {
    return String(dateStr);
  }
};

const safeFormatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return formatDateTime ? formatDateTime(dateStr) : String(dateStr);
  } catch {
    return String(dateStr);
  }
};

const safeGetDisplayName = (userObj, options) => {
  if (!userObj) return "—";
  if (typeof userObj === "string") return userObj;
  try {
    return getDisplayName ? getDisplayName(userObj, options) : userObj.name || "—";
  } catch {
    return userObj.name || userObj.email || "—";
  }
};

const getContactPlaceholder = (method) => {
  switch (method) {
    case "WhatsApp":
      return "Enter WhatsApp number...";
    case "Viber":
      return "Enter Viber number...";
    default:
      return "Enter mobile number...";
  }
};

const getScheduleTextColor = (scheduledAt, status) => {
  if (!scheduledAt) return "text-gray-700";

  const now = new Date();
  const schedule = new Date(scheduledAt);

  if (status === "Completed") return "text-emerald-600 font-medium";
  if (status === "Cancelled") return "text-red-500 font-medium";
  if (status === "Missed") return "text-orange-600 font-medium";

  // Overdue
  if (schedule < now && schedule.toDateString() !== now.toDateString()) {
    return "text-red-600 font-semibold";
  }

  // Today
  if (schedule.toDateString() === now.toDateString()) {
    return "text-amber-600 font-semibold";
  }

  // Upcoming
  return "text-sky-600 font-medium";
};

export default function CallsModal({
  open = false,
  mode = "view",
  origin = "view",
  formData = {},
  call = null,
  activities = [],
  activitiesLoading = false,
  assignableUsers = [],
  loading = false,
  onChange,
  onSelectChange,
  onSwitchToEdit,
  onSwitchToView,
  onSubmit,
  onDelete,
  onClose,
}) {
  const safeUsers = Array.isArray(assignableUsers) ? assignableUsers : [];

  const assigneeOptions = useMemo(() => {
    return safeUsers.map((u) => ({
      label: `${safeGetDisplayName(u, { includeSuffix: true })} ${u?.role ? `— ${u.role}` : ""}`,
      value: u?._id || u?.id || "",
      user: u,
    }));
  }, [safeUsers]);

  if (!open) return null;

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";

  const viewingCall = call;

  // Render View Details
  const renderView = () => {
    const c = viewingCall;

    if (!c) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-400">
          No call record details available.
        </div>
      );
    }

    const createdByName = safeGetDisplayName(c.createdBy, {
      includeMiddleInitial: true,
      includeSuffix: true,
    });

    const scheduleColorClass = getScheduleTextColor(c.scheduledAt, c.status);

    return (
      <div className="flex flex-row flex-1 min-h-0 h-full">
        {/* Main Content */}
        <div className="flex flex-col flex-1 min-h-0 pr-6 overflow-y-auto">
          <h2 className="text-2xl font-semibold text-gray-800 leading-snug mb-3">
            {c.companyName || c.callType || "Call Record"}
          </h2>

          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <div className="flex items-center gap-1.5 text-gray-500">
              <PhoneCall size={13} strokeWidth={2} className="shrink-0" />
              <span className="text-xs">{c.callType || "Call"}</span>
            </div>

            {c.contactPerson && (
              <div className="flex items-center gap-1.5 text-gray-500">
                <User size={13} strokeWidth={2} className="shrink-0" />
                <span className="text-xs">{c.contactPerson}</span>
              </div>
            )}
          </div>

          <div className="mb-6">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Notes
            </p>
            {c.notes ? (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {c.notes}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">No notes available.</p>
            )}
          </div>

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Activity</span>
            <BaseBadge tone={STATUS_COLORS[c.status || "Scheduled"] || "sky"} shape="pill">
              {c.status || "Scheduled"}
            </BaseBadge>
          </div>

          <div className="flex-1 min-h-0">
            {ActivityTimeline ? (
              <ActivityTimeline
                activities={Array.isArray(activities) ? activities : []}
                loading={activitiesLoading}
              />
            ) : null}
          </div>
        </div>

        <div className="w-px bg-gray-200 shrink-0" />

        {/* Details Sidebar */}
        <div className="w-56 shrink-0 pl-6 overflow-y-auto">
          <p className="text-sm font-semibold text-gray-800 mb-4">Details</p>

          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Building size={11} className="text-gray-400" />
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Company
                </p>
              </div>
              <p className="text-sm font-medium text-gray-700">
                {c.companyName || "—"}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <User size={11} className="text-gray-400" />
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Contact Person
                </p>
              </div>
              <p className="text-sm font-medium text-gray-700">
                {c.contactPerson || "—"}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Phone size={11} className="text-gray-400" />
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Contact Number
                </p>
              </div>
              <p className="text-sm font-medium text-gray-700">
                {c.contactValue || c.phone
                  ? `${c.contactMethod || "Mobile"}: ${c.contactValue || c.phone}`
                  : "—"}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <User size={11} className="text-gray-400" />
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Created By
                </p>
              </div>
              <p className="text-sm font-medium text-gray-700">
                {c.createdBy && UserDisplayName ? (
                  <UserDisplayName user={c.createdBy}>
                    {createdByName}
                  </UserDisplayName>
                ) : (
                  createdByName
                )}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Clock size={11} className="text-gray-400" />
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Date Created
                </p>
              </div>
              <p className="text-sm font-medium text-gray-700">
                {safeFormatDateTime(c.createdAt)}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Calendar size={11} className="text-gray-400" />
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Scheduled Date
                </p>
              </div>
              <p
                className={`text-sm font-medium ${
                  STATUS_TEXT_COLORS[c.status || "Scheduled"] || "text-sky-600"
                }`}
              >
                {safeFormatDate(c.scheduledAt)}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Clock size={11} className="text-gray-400" />
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Scheduled Time
                </p>
              </div>
              <p
                className={`text-sm font-medium ${
                  STATUS_TEXT_COLORS[c.status || "Scheduled"] || "text-sky-600"
                }`}
              >
                {formatTimeString(c.scheduledAt)}
              </p>
            </div>

            {c.status === "Completed" && (
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Calendar size={11} className="text-emerald-500" />
                  <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-semibold">
                    Completed At
                  </p>
                </div>
                <p className="text-sm font-medium text-emerald-600">
                  {safeFormatDateTime(c.completedAt)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderViewFooter = () => {
    const c = viewingCall;
    if (!c) return null;

    return (
      <div className="flex justify-end items-center gap-2">
        <button
          type="button"
          onClick={() => onDelete?.(c._id)}
          className="px-4 py-2 text-sm border border-red-300 text-red-500 rounded-md hover:bg-red-50 transition-colors cursor-pointer ml-auto"
        >
          Delete
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSwitchToEdit?.(e);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
        >
          <Pencil size={14} /> Edit Call
        </button>
      </div>
    );
  };

  const renderEditFooter = () => (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={isEdit && origin === "view" ? onSwitchToView : onClose}
        className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
      >
        {isEdit && origin === "view" ? "Back" : "Cancel"}
      </button>

      <button
        type="submit"
        form="call-form"
        disabled={loading}
        className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );

  // Render Edit/Create Form
  const renderForm = () => {
    const selectedAgent =
      assigneeOptions.find((o) => o.value === formData?.assignedTo) || null;

    const selectProps = getSelectProps ? getSelectProps({ isSearchable: false }) : {};

    return (
      <form id="call-form" onSubmit={onSubmit} className="space-y-4">
        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 px-1">
          <div>
            <FormLabel>Company Name</FormLabel>
            <FormInput
              type="text"
              name="companyName"
              value={formData?.companyName || ""}
              onChange={onChange}
              placeholder="Enter company name..."
            />
          </div>

          <div>
            <FormLabel required>Contact Person</FormLabel>
            <FormInput
              type="text"
              name="contactPerson"
              value={formData?.contactPerson || ""}
              onChange={onChange}
              placeholder="Enter contact person..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel required>Contact Method</FormLabel>
              <Select
                {...selectProps}
                placeholder="Method"
                options={CONTACT_METHODS.map((m) => ({ label: m, value: m }))}
                value={
                  formData?.contactMethod
                    ? {
                        label: formData.contactMethod,
                        value: formData.contactMethod,
                      }
                    : { label: "Mobile", value: "Mobile" }
                }
                onChange={(opt) =>
                  onSelectChange?.("contactMethod", opt?.value || "Mobile")
                }
              />
            </div>

            <div>
              <FormLabel required>Contact Number</FormLabel>
              <FormInput
                type="text"
                name="contactValue"
                value={formData?.contactValue || ""}
                onChange={onChange}
                placeholder={getContactPlaceholder(formData?.contactMethod)}
                required
              />
            </div>
          </div>

          <div>
            <FormLabel required>Call Type</FormLabel>
            <Select
              {...selectProps}
              placeholder="Select type..."
              options={CALL_TYPES.map((t) => ({ label: t, value: t }))}
              value={
                formData?.callType
                  ? { label: formData.callType, value: formData.callType }
                  : { label: "Follow-up Call", value: "Follow-up Call" }
              }
              onChange={(opt) =>
                onSelectChange?.("callType", opt?.value || "Follow-up Call")
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel required>Scheduled Date & Time</FormLabel>
              <FormInput
                type="datetime-local"
                name="scheduledAt"
                required
                value={formData?.scheduledAt || ""}
                onChange={onChange}
              />
            </div>

            <div>
              <FormLabel required>Status</FormLabel>
              <Select
                {...selectProps}
                placeholder="Status"
                required
                options={STATUSES.map((s) => ({ label: s, value: s }))}
                value={
                  formData?.status
                    ? { label: formData.status, value: formData.status }
                    : { label: "Scheduled", value: "Scheduled" }
                }
                onChange={(opt) =>
                  onSelectChange?.("status", opt?.value || "Scheduled")
                }
              />
            </div>
          </div>

          {formData?.status === "Completed" && (
            <div>
              <FormLabel>Completed Date & Time</FormLabel>
              <FormInput
                type="datetime-local"
                name="completedAt"
                value={formData?.completedAt || ""}
                onChange={onChange}
              />
            </div>
          )}

          {assigneeOptions.length > 0 && (
            <div>
              <FormLabel>Assigned To</FormLabel>
              <Select
                {...(getSelectProps ? getSelectProps({ isClearable: true }) : {})}
                placeholder="Search employee..."
                options={assigneeOptions}
                value={selectedAgent}
                onChange={(opt) =>
                  onSelectChange?.("assignedTo", opt?.value || "")
                }
              />
            </div>
          )}

          <div>
            <FormLabel>Notes</FormLabel>
            <FormTextarea
              name="notes"
              value={formData?.notes || ""}
              onChange={onChange}
              rows={4}
              placeholder="Add call notes..."
            />
          </div>
        </div>
      </form>
    );
  };

  const title = isView
    ? ""
    : isCreate
    ? "Add New Call"
    : "Edit Call";

  return (
    <FormDrawer
      open={open}
      isOpen={open}
      title={title}
      formId="call-form"
      loading={loading}
      onClose={onClose}
      onCancel={isEdit && origin === "view" ? onSwitchToView : onClose}
      footer={isView ? renderViewFooter() : renderEditFooter()}
    >
      {isView ? renderView() : renderForm()}
    </FormDrawer>
  );
}