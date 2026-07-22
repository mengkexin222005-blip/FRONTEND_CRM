import { useMemo } from "react";
import Select from "react-select";
import { DotLoader } from "react-spinners";
import {
  Pencil,
  User,
  Telescope,
  Calendar,
  FileText,
  Clock,
  Phone,
  Mail,
  MessageCircle,
  CalendarDays,
  Bell,
  Magnet,
  UserCheck,
  ExternalLink, 
} from "lucide-react";

import { getSelectProps } from "../../components/select/selectConfig";
import Modal from "../../components/modal/Modal";
import { ModalField } from "../../components/modal/ModalField";

import FormDrawer from "../../components/form/FormDrawer";
import FormSection from "../../components/form/FormSection";
import {
  FormLabel,
  FormInput,
  FormTextarea,
} from "../../components/form/FormField";

import BaseBadge from "../../components/badge/BaseBadge";
import UserDisplayName from "../../components/UserDisplayName";
import ActivityTimeline from "../../components/activity/ActivityTimeline";
import { getProfileImage } from "../../utils/avatar";
import { getDisplayName } from "../../utils/name";
import {
  formatDate,
  formatDateTime,
  isDueToday,
  isOverdue,
} from "../../utils/date";
import {
  TASK_TYPE_OPTIONS,
  TASK_PRIORITY_OPTIONS,
} from "../../constants/options";
import {
  canFullyEditTask,
  canDeleteTask,
  getTaskEditDisabledReason,
} from "./utils/taskPermissions";

const STATUSES = ["Pending", "Ongoing", "Completed", "Overdue"];
const REPEATS = ["None", "Daily", "Weekly", "Monthly"];
const RELATED_TYPES = ["Lead", "Client", "Quotation"];

const PRIORITY_COLORS = {
  Low: "blue",
  Medium: "yellow",
  High: "red",
};

const STATUS_COLORS = {
  Pending: "gray",
  Ongoing: "amber",
  Completed: "green",
  Overdue: "red",
};

const TASK_TYPE_LABELS = {
  Call: "Call",
  Email: "Email",
  Message: "Message",
  Meeting: "Meeting",
  Reminder: "Reminder",
  Other: "Other",
};

const TASK_TYPE_ICON = {
  Call: Phone,
  Email: Mail,
  Message: MessageCircle,
  Meeting: CalendarDays,
  Reminder: Bell,
  Other: FileText,
};

const RELATED_TYPE_ICON = {
  Lead: Magnet,
  Client: UserCheck,
  Quotation: FileText,
};

const getRelatedLabel = (task) => {
  if (!task?.relatedToType || !task?.relatedTo) return null;
  const ref = task.relatedTo;
  const type = task.relatedToType;
  if (type === "Lead" || type === "Client") {
    const name = [ref.firstName, ref.lastName].filter(Boolean).join(" ");
    return name || "Unknown";
  }
  if (type === "Quotation") return ref.title || "Unknown";
  return null;
};

export default function TaskModal({
  open,
  mode,
  origin,
  // activeTab,
  // onTabChange,
  formData,
  viewingTask,
  activities = [],
  activitiesLoading = false,
  currentUser,
  assignableUsers = [],
  leads = [],
  clients = [],
  quotations = [],
  permissions = {},
  loading = false,
  onChange,
  onSelectChange,
  onSwitchToEdit,
  onSwitchToView,
  onSubmit,
  onDelete,
  onClose,
}) {
  const assigneeOptions = useMemo(() => {
    return assignableUsers.map((u) => ({
      label: `${getDisplayName(u, { includeSuffix: true })} — ${u.role}`,
      value: u._id,
      user: u,
    }));
  }, [assignableUsers]);

  const relatedOptions = useMemo(() => {
    const type = formData.relatedToType;
    if (type === "Lead") {
      return leads.map((l) => ({
        label: `${getDisplayName(l, { includeMiddleInitial: true, includeSuffix: true })}`,
        value: l._id,
      }));
    }
    if (type === "Client") {
      return clients.map((c) => ({
        label: `${getDisplayName(c, { includeMiddleInitial: true, includeSuffix: true })}${c.company ? ` — ${c.company}` : ""}`,
        value: c._id,
      }));
    }
    if (type === "Quotation") {
      return quotations.map((q) => ({
        label: q.title,
        value: q._id,
      }));
    }
    return [];
  }, [formData.relatedToType, leads, clients, quotations]);

  if (!open) return null;

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";

  const currentTask = viewingTask;

  const canEditCurrentTask = currentTask
    ? canFullyEditTask(currentTask, currentUser, permissions)
    : false;

  const canDeleteCurrentTask = currentTask
    ? canDeleteTask(currentTask, currentUser, permissions)
    : false;

  const editDisabledReason = currentTask
    ? getTaskEditDisabledReason(currentTask, currentUser, permissions)
    : "";

  // View Mode — split panel layout
  const renderView = () => {
    const t = viewingTask;
    if (!t) return null;

    const overdue = isOverdue(t.dueDate, t.status);
    const dueToday = isDueToday(t.dueDate, t.status);

    const assignedName = t.assignedTo
      ? getDisplayName(t.assignedTo, {
          includeMiddleInitial: true,
          includeSuffix: true,
        })
      : "Unassigned";

    const createdByName = t.createdBy
      ? getDisplayName(t.createdBy, {
          includeMiddleInitial: true,
          includeSuffix: true,
        })
      : "—";

    const relatedLabel = getRelatedLabel(t);
    const TypeIcon = TASK_TYPE_ICON[t.taskType];
    const RelatedIcon = RELATED_TYPE_ICON[t.relatedToType];

    // Formats reference link neatly to ensure it redirects externally safely
    const taskUrl = t.link
      ? t.link.startsWith("http")
        ? t.link
        : `https://${t.link}`
      : null;

    return (
      <div className="flex flex-row flex-1 min-h-0 h-full">
        <div className="flex flex-col flex-1 min-h-0 pr-6 overflow-y-auto">
          <h2 className="text-2xl font-semibold text-gray-800 leading-snug mb-3">
            {t.subject}
          </h2>
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <BaseBadge tone={PRIORITY_COLORS[t.priority]} shape="pill">
              {t.priority} Priority
            </BaseBadge>

            {t.assignedTo && (
              <div className="flex items-center gap-1.5 text-gray-500">
                <User size={13} strokeWidth={2} className="shrink-0" />
                <span className="text-xs">
                  <UserDisplayName user={t.assignedTo}>
                    {assignedName}
                  </UserDisplayName>
                </span>
              </div>
            )}

            {t.taskType && TypeIcon && (
              <div className="flex items-center gap-1.5 text-gray-500">
                <TypeIcon size={13} strokeWidth={2} className="shrink-0" />
                <span className="text-xs">
                  {TASK_TYPE_LABELS[t.taskType] || t.taskType}
                </span>
              </div>
            )}

            {t.relatedToType && relatedLabel && (
              <div className="flex items-center gap-1.5 text-gray-500">
                {RelatedIcon && (
                  <RelatedIcon size={13} strokeWidth={2} className="shrink-0" />
                )}
                <span className="text-xs text-gray-500">{relatedLabel}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Description
            </p>
            {t.description ? (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {t.description}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">Add Description</p>
            )}
          </div>

          {/* Activity header row */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Activity</span>
            <BaseBadge tone={STATUS_COLORS[t.status]} shape="pill">
              {t.status}
            </BaseBadge>
          </div>

          {/* Activity timeline  */}
          <div className="flex-1 min-h-0">
            <ActivityTimeline
              activities={activities}
              loading={activitiesLoading}
            />
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="w-px bg-gray-200 shrink-0" />

        {/* ── Right sidebar ── */}
        <div className="w-56 shrink-0 pl-6 overflow-y-auto">
          <p className="text-sm font-semibold text-gray-800 mb-4">Details</p>

          <div className="flex flex-col gap-4">
            {/* Link field display */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <ExternalLink size={11} className="text-gray-400" />
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Link
                </p>
              </div>
              {taskUrl ? (
                <a
                  href={taskUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 
                    bg-blue-50 border border-blue-200 text-blue-600 rounded-md 
                    hover:bg-blue-100 transition-colors w-full justify-center"
                  title={t.link}
                >
                  Open Link <ExternalLink size={12} />
                </a>
              ) : (
                <p className="text-sm font-medium text-gray-400 italic">—</p>
              )}
            </div>

            {/* Scope */}
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Telescope size={11} className="text-gray-400" />
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Scope
                </p>
              </div>
              <p className="text-sm font-medium text-gray-700">
                {t.scope === "Personal"
                  ? t.createdBy?._id === currentUser?.id
                    ? "Personal (You)"
                    : `Personal (${createdByName})`
                  : "Assigned"}
              </p>
            </div>

            {/* Created By */}
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <User size={11} className="text-gray-400" />
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Created By
                </p>
              </div>
              <p className="text-sm font-medium text-gray-700">
                {t.createdBy ? (
                  <UserDisplayName user={t.createdBy}>
                    {createdByName}
                  </UserDisplayName>
                ) : (
                  "—"
                )}
              </p>
            </div>

            {/* Date Created */}
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Clock size={11} className="text-gray-400" />
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Date Created
                </p>
              </div>
              <p className="text-sm font-medium text-gray-7700">
                {formatDateTime(t.createdAt) || "—"}
              </p>
            </div>

            {/* Due Date */}
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Calendar size={11} className="text-gray-400" />
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Due Date
                </p>
              </div>
              {t.dueDate ? (
                <div
                  className={`flex items-center gap-1 ${
                    overdue
                      ? "text-red-500"
                      : dueToday
                        ? "text-amber-500"
                        : "text-gray-700"
                  }`}
                >
                  {(overdue || dueToday) && (
                    <CalendarDays size={12} strokeWidth={2} />
                  )}
                  <p className="text-sm font-medium">{formatDate(t.dueDate)}</p>
                </div>
              ) : (
                <p className="text-sm font-medium text-gray-700">—</p>
              )}
            </div>

            {/* Reminder */}
            {t.reminderAt && (
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Clock size={11} className="text-gray-400" />
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                    Reminder
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {formatDateTime(t.reminderAt)}
                </p>
              </div>
            )}

            {/* Assigned To */}
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <User size={11} className="text-gray-400" />
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Assigned To
                </p>
              </div>
              <p className="text-sm font-medium text-gray-700">
                {t.scope === "Personal" ? (
                  "Unassigned"
                ) : t.assignedTo ? (
                  <UserDisplayName user={t.assignedTo}>
                    {assignedName}
                  </UserDisplayName>
                ) : (
                  "Unassigned"
                )}
              </p>
              {t.scope !== "Personal" && t.assignedTo?.role && (
                <p className="text-xs text-gray-400">{t.assignedTo.role}</p>
              )}
            </div>

            {/* Completed At */}
            {t.completedAt && (
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Calendar size={11} className="text-gray-400" />
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                    Completed At
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {formatDateTime(t.completedAt)}
                </p>
              </div>
            )}

            {/* Updated At */}
            {t.updatedAt && (
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Clock size={11} className="text-gray-400" />
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                    Updated At
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {formatDateTime(t.updatedAt)}
                </p>
              </div>
            )}

            {/* Repeat */}
            {t.repeat && t.repeat !== "None" && (
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Bell size={11} className="text-gray-400" />
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                    Repeat
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-700">{t.repeat}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderViewFooter = () => {
    const t = viewingTask;
    if (!t) return null;

    return (
      <div className="flex justify-end items-center gap-2">
        {canDeleteCurrentTask && (
          <button
            type="button"
            onClick={() => onDelete(t._id)}
            className="px-4 py-2 text-sm border border-red-300 text-red-500 rounded-md hover:bg-red-50 transition-colors cursor-pointer ml-auto"
          >
            Delete
          </button>
        )}
        {currentTask && (
          <div
            title={!canEditCurrentTask ? editDisabledReason : ""}
            className="inline-block"
          >
            <button
              disabled={!canEditCurrentTask}
              type="button"
              onClick={onSwitchToEdit}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-md transition-colors ${
                !canEditCurrentTask
                  ? "border border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                  : "bg-red-500 text-white hover:bg-red-600 cursor-pointer"
              }`}
            >
              <Pencil size={14} /> Edit Task
            </button>
          </div>
        )}
      </div>
    );
  };

  // Create / Edit Form
  const renderForm = () => {
    const selectedAgent =
      assigneeOptions.find((o) => o.value === formData.assignedTo) || null;
    const selectedRelated =
      relatedOptions.find((o) => o.value === formData.relatedTo) || null;

    const today = new Date().toISOString().split("T")[0];

    return (
      <form
        id="task-form"
        onSubmit={onSubmit}
        className="space-y-4"
      >
        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 px-1">
          <div>
            <FormLabel required>Subject</FormLabel>
            <FormInput
              type="text"
              name="subject"
              value={formData.subject}
              onChange={onChange}
              placeholder="e.g. Follow up with client"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>Task Type</FormLabel>
              <Select
                {...getSelectProps({ isSearchable: false })}
                placeholder="Select type..."
                options={TASK_TYPE_OPTIONS}
                value={
                  formData.taskType
                    ? {
                        label: TASK_TYPE_LABELS[formData.taskType],
                        value: formData.taskType,
                      }
                    : null
                }
                onChange={(opt) =>
                  onSelectChange("taskType", opt?.value || "Call")
                }
              />
            </div>
            <div>
              <FormLabel required>Priority</FormLabel>
              <Select
                {...getSelectProps({ isSearchable: false })}
                placeholder="Priority"
                required
                options={TASK_PRIORITY_OPTIONS}
                value={
                  formData.priority
                    ? { label: formData.priority, value: formData.priority }
                    : null
                }
                onChange={(opt) =>
                  onSelectChange("priority", opt?.value || "Low")
                }
              />
            </div>
          </div>

          {isCreate && (
            <div>
              <FormLabel required>Status</FormLabel>
              <Select
                {...getSelectProps({ isSearchable: false })}
                placeholder="Status"
                required
                options={STATUSES.map((s) => ({ label: s, value: s }))}
                value={
                  formData.status
                    ? { label: formData.status, value: formData.status }
                    : null
                }
                onChange={(opt) =>
                  onSelectChange("status", opt?.value || "Pending")
                }
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel required>Due Date</FormLabel>
              <FormInput
                type="date"
                name="dueDate"
                required
                value={formData.dueDate}
                onChange={onChange}
                min={today}
              />
            </div>
            <div>
              <FormLabel>Reminder</FormLabel>
              <FormInput
                type="date"
                name="reminderAt"
                value={formData.reminderAt}
                onChange={onChange}
                min={today}
                max={formData.dueDate || undefined}
              />
            </div>
          </div>

          <div>
            <FormLabel>Repeat</FormLabel>
            <Select
              {...getSelectProps({ isSearchable: false })}
              placeholder="Repeat"
              options={REPEATS.map((r) => ({ label: r, value: r }))}
              value={
                formData.repeat
                  ? { label: formData.repeat, value: formData.repeat }
                  : null
              }
              onChange={(opt) => onSelectChange("repeat", opt?.value || "None")}
            />
          </div>

          <div>
            <FormLabel>Scope</FormLabel>
            {permissions.canAssign ? (
              <div className="flex items-center gap-20 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="radio"
                    name="scope"
                    value="Personal"
                    checked={formData.scope === "Personal"}
                    onChange={onChange}
                    className="accent-red-500"
                  />
                  Personal
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="radio"
                    name="scope"
                    value="Assigned"
                    checked={formData.scope === "Assigned"}
                    onChange={onChange}
                    className="accent-red-500"
                  />
                  Assigned
                </label>
              </div>
            ) : (
              <FormInput
                value={formData.scope || "Personal"}
                disabled
                className="bg-gray-50 text-gray-400 cursor-not-allowed mt-1"
              />
            )}
          </div>

          {permissions.canAssign && formData.scope === "Assigned" && (
            <div>
              <FormLabel>Assigned To</FormLabel>
              <Select
                {...getSelectProps({ isClearable: true })}
                placeholder="Search employee..."
                options={assigneeOptions}
                value={selectedAgent}
                onChange={(opt) =>
                  onSelectChange("assignedTo", opt?.value || "")
                }
                formatOptionLabel={({ user, label }) => (
                  <div className="flex items-center gap-2">
                    <img
                      src={getProfileImage(user)}
                      alt="avatar"
                      className="w-6 h-6 rounded-full object-cover border"
                    />
                    <span>{label}</span>
                  </div>
                )}
              />
              {!formData.assignedTo && (
                <p className="text-xs text-gray-400 mt-1 italic">
                  Leave empty to create an unassigned task
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>Related Type</FormLabel>
              <Select
                {...getSelectProps({ isSearchable: false })}
                placeholder="Select type..."
                options={RELATED_TYPES.map((t) => ({ label: t, value: t }))}
                value={
                  formData.relatedToType
                    ? {
                        label: formData.relatedToType,
                        value: formData.relatedToType,
                      }
                    : null
                }
                onChange={(opt) =>
                  onSelectChange("relatedToType", opt?.value || "")
                }
              />
            </div>
            <div>
              <FormLabel>Related Record</FormLabel>
              <Select
                {...getSelectProps({ isClearable: true })}
                placeholder={
                  formData.relatedToType
                    ? `Select ${formData.relatedToType.toLowerCase()}...`
                    : "Choose type first"
                }
                options={relatedOptions}
                value={selectedRelated}
                onChange={(opt) =>
                  onSelectChange("relatedTo", opt?.value || "")
                }
                isDisabled={!formData.relatedToType}
              />
            </div>
          </div>

          {/* Link input field */}
          <div>
            <FormLabel>Link</FormLabel>
            <FormInput
              type="text"
              name="link"
              value={formData.link || ""}
              onChange={onChange}
              placeholder="e.g. https://example.com/document"
            />
          </div>

          <div>
            <FormLabel>Description</FormLabel>
            <FormTextarea
              name="description"
              value={formData.description}
              onChange={onChange}
              rows={4}
              placeholder="Add any relevant notes..."
            />
          </div>
        </div>
      </form>
    );
  };

  const title = isCreate ? "Add New Task" : isEdit ? "Edit Task" : "";

  return (
    <FormDrawer
      open={open}
      title={title}
      formId="task-form"
      loading={loading}
      onClose={onClose}
      onCancel={isEdit && origin === "view" ? onSwitchToView : onClose}
      footer={isView ? renderViewFooter() : null}
    >
      {isView ? renderView() : renderForm()}
    </FormDrawer>
  );
}