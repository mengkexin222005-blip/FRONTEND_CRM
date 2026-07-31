import {
  Pencil,
  User,
  Calendar,
  ExternalLink,
  Paperclip,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { getProfileImage } from "../../utils/avatar";
import { getDisplayName } from "../../utils/name";
import { formatDate, isDueToday, isOverdue } from "../../utils/date";

import {
  BaseTable,
  TableRow,
  TableCell,
  useTablePagination,
} from "../../components/table";

import LoaderTables from "../../components/loader/TablesLazyLoader";
import UserDisplayName from "../../components/UserDisplayName";
import StatusDropdown from "../../components/select/StatusDropdown";

import {
  canFullyEditTask,
  getTaskEditDisabledReason,
} from "./utils/taskPermissions";

const TASK_STATUSES = ["Pending", "Ongoing", "Due Soon", "Completed", "Overdue"];
const TASK_PRIORITIES = ["Low", "Medium", "High"];

const TASK_STATUS_TONE = {
  Pending: "yellow",
  Ongoing: "blue",
  "Due Soon": "orange",
  Completed: "green",
  Overdue: "red",
};

const TASK_PRIORITY_TONE = {
  Low: "blue",
  Medium: "yellow",
  High: "red",
};

const parseSingleAttachment = (rawAtt) => {
  if (!rawAtt) return null;
  if (typeof rawAtt === "object") {
    const url = rawAtt.url || rawAtt.link || rawAtt.path || rawAtt.fileUrl;
    const name = rawAtt.name || rawAtt.title || rawAtt.fileName || "Document";
    if (!url && !name) return null;
    return {
      name,
      url: url ? (!/^https?:\/\//i.test(url) ? `${window.location.origin}/${url.replace(/^\/+/, "")}` : url) : "#",
    };
  }
  if (typeof rawAtt === "string") {
    const trimmed = rawAtt.trim();
    if (!trimmed || trimmed === "-") return null;
    const finalUrl = !/^https?:\/\//i.test(trimmed) 
      ? `${window.location.origin}/${trimmed.replace(/^\/+/, "")}` 
      : trimmed;
    return {
      name: trimmed.split("/").pop() || "Document",
      url: finalUrl,
    };
  }
  return null;
};

const getTaskLinkAndAttachments = (task) => {
  let linkItem = null;
  const attachmentList = [];

  const rawLink = task?.link || task?.url || task?.externalLink;
  
  const customName = 
    task?.linkName || 
    task?.link_name || 
    task?.urlName || 
    task?.linkTitle || 
    task?.metadata?.linkName || 
    task?.linkMetadata?.name ||
    (typeof task?.link === "object" ? task?.link?.name : null);

  const trimmedCustomName = typeof customName === "string" ? customName.trim() : "";

  if (rawLink) {
    if (typeof rawLink === "string" && rawLink.trim() !== "") {
      const formattedUrl = rawLink.startsWith("http") ? rawLink : `https://${rawLink}`;
      const displayName = trimmedCustomName !== "" ? trimmedCustomName : rawLink;

      linkItem = {
        name: displayName,
        url: formattedUrl,
      };
    } else if (typeof rawLink === "object") {
      const parsed = parseSingleAttachment(rawLink);
      if (parsed) {
        linkItem = { 
          ...parsed, 
          name: trimmedCustomName !== "" ? trimmedCustomName : (rawLink.url || rawLink.link || parsed.name) 
        };
      }
    }
  }

  const rawAtts = task?.attachments || task?.files || task?.file || task?.documents;
  if (rawAtts) {
    (Array.isArray(rawAtts) ? rawAtts : [rawAtts]).forEach((item) => {
      const parsed = parseSingleAttachment(item);
      if (parsed) attachmentList.push(parsed);
    });
  }

  return { linkItem, attachmentList };
};

const getDynamicTaskStatus = (task) => {
  const rawStatus = String(task?.status || "Pending").trim().toLowerCase();
  if (["completed", "complete", "done"].includes(rawStatus)) return "Completed";

  const dueDateStr = task?.dueDate || task?.date || task?.taskDate;
  if (!dueDateStr) return ["ongoing", "in progress"].includes(rawStatus) ? "Ongoing" : "Pending";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  if (Number.isNaN(due.getTime())) return "Pending";
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "Overdue";
  if (diffDays <= 2) return "Due Soon";
  return ["ongoing", "in progress"].includes(rawStatus) ? "Ongoing" : "Pending";
};

const getResponsibleName = (task) => {
  const assigned = task.assignedTo;
  const createdBy = task.createdBy;

  if (task.scope === "Personal") {
    return {
      label: createdBy ? (
        <UserDisplayName user={createdBy}>
          {getDisplayName(createdBy, { includeMiddleInitial: true, includeSuffix: true })}
        </UserDisplayName>
      ) : "Unknown",
      type: "personal",
      user: createdBy || null,
    };
  }

  if (!assigned) return { label: "Unassigned", type: "unassigned", user: null };

  return {
    label: (
      <UserDisplayName user={assigned}>
        {getDisplayName(assigned, { includeMiddleInitial: true, includeSuffix: true })}
      </UserDisplayName>
    ),
    type: "assigned",
    user: assigned,
  };
};

export default function TaskTable({
  tasks = [],
  permissions = {},
  onEdit,
  onView,
  onUpdateStatus,
  onUpdatePriority,
  isLoading = false,
}) {
  const { user: currentUser } = useAuth();
  const canEdit = permissions.canEdit !== false;

  const normalizedTasks = tasks.map((task) => ({
    ...task,
    status: getDynamicTaskStatus(task),
  }));

  const columns = [
    { label: "Title" },
    { label: "Priority" },
    { label: "Task Owner" },
    { label: "Link / Files" },
    { label: "Deadline" },
    { label: "Status" },
    ...(canEdit ? [{ label: "", align: "text-right" }] : []),
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
  } = useTablePagination(normalizedTasks, 10);

  if (isLoading) {
    return (
      <LoaderTables
        paginatedItems="loading"
        headers={columns.map((c) => c.label)}
        emptyMessage="No tasks found."
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
        renderRow={() => <TableRow />}
      />
    );
  }

  return (
    <BaseTable 
      columns={columns} 
      empty={paginatedItems.length === 0 ? "No tasks found." : null} 
      colSpan={columns.length} 
      heightClass="h-112.5"
      paginationProps={{
        currentPage,
        totalPages,
        totalRows,
        rowsPerPage,
        from,
        to,
        pageWindow,
        onGoTo: goTo,
        onRowsPerPageChange: setRowsPerPage,
      }}
    >
      {paginatedItems.map((task) => {
        const dynamicStatus = getDynamicTaskStatus(task);
        const overdue = isOverdue(task.dueDate, dynamicStatus);
        const dueToday = isDueToday(task.dueDate, dynamicStatus);
        const responsible = getResponsibleName(task);
        const responsiblePhoto = getProfileImage(responsible.user);
        const canEditCurrentTask = canFullyEditTask(task, currentUser, permissions);
        const editDisabledReason = getTaskEditDisabledReason(task, currentUser, permissions);
        const { linkItem, attachmentList } = getTaskLinkAndAttachments(task);
        const hasContent = linkItem || attachmentList.length > 0;

        return (
          <TableRow key={task._id} onClick={() => onView?.(task)}>
            <TableCell className="max-w-72 !py-2">
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {task.taskType && task.taskType !== "Other" ? `${task.taskType}: ` : ""}
                  {task.subject}
                </p>
                {task.description && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">{task.description}</p>
                )}
              </div>
            </TableCell>

            <TableCell className="!py-2">
              <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                <StatusDropdown
                  status={task.priority || "Medium"}
                  statuses={TASK_PRIORITIES}
                  toneMap={TASK_PRIORITY_TONE}
                  disabled={!canEdit}
                  onSelect={(val) => onUpdatePriority?.(task._id, val)}
                />
              </div>
            </TableCell>

            <TableCell className="!py-2">
              <div className="flex items-center gap-2 whitespace-nowrap">
                {responsible.user ? (
                  <img src={responsiblePhoto} alt="" className="w-7 h-7 rounded-full object-cover border border-gray-300 shrink-0" />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <User size={13} className="text-gray-400" />
                  </span>
                )}
                <span className={`text-sm truncate max-w-36 inline-flex items-center ${responsible.type === "unassigned" ? "text-gray-400 italic" : "text-gray-700"}`}>
                  {responsible.label}
                </span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${task.scope === "Personal" ? "bg-indigo-500" : "bg-teal-500"}`} title={task.scope} />
              </div>
            </TableCell>

            <TableCell className="max-w-[180px] !py-2">
              {hasContent ? (
                <div className="flex flex-col gap-0.5 truncate" onClick={(e) => e.stopPropagation()}>
                  {linkItem && (
                    <a href={linkItem.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1 truncate" title={linkItem.name}>
                      <ExternalLink size={11} className="shrink-0" />
                      <span className="truncate">{linkItem.name}</span>
                    </a>
                  )}
                  {attachmentList.map((file, idx) => (
                    <a 
                      key={idx} 
                      href={file.url} 
                      download={file.name} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-gray-700 hover:text-red-500 text-xs flex items-center gap-1 truncate" 
                      title={file.name}
                    >
                      <Paperclip size={11} className="shrink-0 text-red-500" />
                      <span className="truncate">{file.name}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-gray-400">—</span>
              )}
            </TableCell>

            <TableCell className="!py-2">
              {task.dueDate ? (
                <span className={`flex items-center gap-1 text-sm ${overdue ? "text-red-500 font-medium" : dueToday ? "text-amber-500 font-medium" : "text-gray-600"}`}>
                  <Calendar size={12} className="shrink-0" />
                  {formatDate(task.dueDate)}
                </span>
              ) : (
                <span className="text-sm text-gray-400">—</span>
              )}
            </TableCell>

            <TableCell className="!py-2">
              <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                <StatusDropdown
                  status={dynamicStatus}
                  statuses={TASK_STATUSES}
                  toneMap={TASK_STATUS_TONE}
                  disabled={!canEdit}
                  onSelect={(val) => onUpdateStatus?.(task._id, val)}
                />
              </div>
            </TableCell>

            {canEdit && (
              <TableCell className="text-right !py-2">
                <button
                  disabled={!canEditCurrentTask}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEdit?.(task); }}
                  className={`p-1.5 rounded-md transition-colors ${!canEditCurrentTask ? "text-gray-300 cursor-not-allowed" : "text-gray-400 hover:text-[#ef4444] cursor-pointer"}`}
                  title={!canEditCurrentTask ? editDisabledReason : "Edit task"}
                >
                  <Pencil size={15} />
                </button>
              </TableCell>
            )}
          </TableRow>
        );
      })}
    </BaseTable>
  );
}