import {
  Pencil,
  User,
  Calendar,
  ExternalLink,
  Paperclip,
} from "lucide-react";
import { getDynamicTaskStatus } from "../dashboard/hooks/useDashboard";

import { useAuth } from "../../context/AuthContext";
import { getProfileImage } from "../../utils/avatar";
import { getDisplayName } from "../../utils/name";
import { formatDate, isDueToday, isOverdue } from "../../utils/date";

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
  Low: "gray",
  Medium: "amber",
  High: "red",
};

const parseSingleAttachment = (rawAtt) => {
  if (!rawAtt) return null;

  if (typeof rawAtt === "object") {
    const url = rawAtt.url || rawAtt.link || rawAtt.path || rawAtt.fileUrl || rawAtt.href;
    const name = rawAtt.name || rawAtt.title || rawAtt.fileName || rawAtt.documentName || rawAtt.originalName || "Document";

    if (!url && !name) return null;

    return {
      name,
      url: url
        ? !/^https?:\/\//i.test(url)
          ? `${window.location.origin}/${String(url).replace(/^\/+/, "")}`
          : url
        : "#",
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
  const linkItems = [];
  const attachmentList = [];

  const addLink = (rawLink, customName = "") => {
    if (!rawLink) return;

    if (typeof rawLink === "string" && rawLink.trim() !== "") {
      const formattedUrl = rawLink.startsWith("http") ? rawLink : `https://${rawLink}`;
      if (!linkItems.some((item) => item.url === formattedUrl)) {
        linkItems.push({ name: customName || rawLink, url: formattedUrl });
      }
    } else if (typeof rawLink === "object") {
      const parsed = parseSingleAttachment(rawLink);
      if (parsed && !linkItems.some((item) => item.url === parsed.url)) {
        linkItems.push({ ...parsed, name: customName || parsed.name });
      }
    }
  };

  const rawLinks = typeof task?.links === "string"
    ? (() => {
        try {
          return JSON.parse(task.links);
        } catch {
          return [];
        }
      })()
    : task?.links;

  (Array.isArray(rawLinks) ? rawLinks : []).forEach((link) => {
    if (typeof link === "string") {
      addLink(link);
      return;
    }
    addLink(link?.url || link?.link || link?.href, link?.name || link?.title || "");
  });

  addLink(
    task?.link || task?.url || task?.externalLink,
    task?.linkName || task?.link_name || task?.urlName || task?.linkTitle || "",
  );

  const rawAtts = task?.attachments || task?.files || task?.file || task?.documents || task?.docs || task?.documentFiles;
  if (rawAtts) {
    (Array.isArray(rawAtts) ? rawAtts : [rawAtts]).forEach((item) => {
      const parsed = parseSingleAttachment(item);
      if (parsed) attachmentList.push(parsed);
    });
  }

  return { linkItems, attachmentList };
};

const normalizeTaskStatus = (status) => {
  const rawStatus = String(status || "Pending").trim();
  const normalized = rawStatus.toLowerCase();

  if (normalized === "to do") return "Pending";
  if (["in progress", "ongoing"].includes(normalized)) return "Ongoing";
  if (["due soon", "duesoon"].includes(normalized)) return "Due Soon";
  if (["completed", "complete", "done"].includes(normalized)) {
    return "Completed";
  }
  if (normalized === "overdue") return "Overdue";

  return TASK_STATUSES.includes(rawStatus) ? rawStatus : "Pending";
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

  const HEADERS = columns.map((c) => c.label);

  if (isLoading) {
    return (
      <LoaderTables
        paginatedItems="loading"
        headers={HEADERS}
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
    <div className="flex flex-col h-[calc(100vh-210px)] justify-between">
      <BaseTable
        columns={columns} 
        empty={paginatedItems.length === 0 ? "No tasks found." : null} 
        colSpan={columns.length}
        tableClassName="table-fixed"
      >
        {paginatedItems.map((task) => {
          const taskStatus = normalizeTaskStatus(task.status);
          const overdue = isOverdue(task.dueDate, taskStatus);
          const dueToday = isDueToday(task.dueDate, taskStatus);
          const responsible = getResponsibleName(task);
          const responsiblePhoto = getProfileImage(responsible.user);
          const canEditCurrentTask = canFullyEditTask(task, currentUser, permissions);
          const editDisabledReason = getTaskEditDisabledReason(task, currentUser, permissions);
          const { linkItems, attachmentList } = getTaskLinkAndAttachments(task);
          const hasContent = linkItems.length > 0 || attachmentList.length > 0;

          return (
            <TableRow key={task._id} onClick={() => onView?.(task)}>
              <TableCell className="w-[28%] !py-2 align-top">
                <div className="min-w-0 break-words">
                  <p className="font-medium whitespace-normal break-words">
                    {task.taskType && task.taskType !== "Other" ? `${task.taskType}: ` : ""}
                    {task.subject}
                  </p>
                  {task.description && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{task.description}</p>
                  )}
                </div>
              </TableCell>

              <TableCell className="!py-2 align-top">
                <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                  <StatusDropdown
                    status={task.priority || "Medium"}
                    statuses={TASK_PRIORITIES}
                    toneMap={TASK_PRIORITY_TONE}
                    badgeClassName="min-w-24 justify-center"
                    disabled={!canEdit}
                    onSelect={(val) => onUpdatePriority?.(task._id, val)}
                  />
                </div>
              </TableCell>

              <TableCell className="!py-2 align-top">
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
                    {linkItems.map((linkItem, idx) => (
                      <a key={`${linkItem.url}-${idx}`} href={linkItem.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1 truncate" title={linkItem.name}>
                        <ExternalLink size={11} className="shrink-0" />
                        <span className="truncate">{linkItem.name}</span>
                      </a>
                    ))}
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
                  <div className="flex flex-col">
                    <span className={`flex items-center gap-1 text-sm ${overdue ? "text-red-500 font-medium" : dueToday ? "text-amber-500 font-medium" : "text-gray-600"}`}>
                      <Calendar size={12} className="shrink-0" />
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </TableCell>

              <TableCell className="!py-2">
                <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                  <StatusDropdown
                    status={taskStatus}
                    statuses={TASK_STATUSES}
                    toneMap={TASK_STATUS_TONE}
                    badgeClassName="min-w-24 justify-center"
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
