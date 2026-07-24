import {
  Pencil,
  User,
  Calendar,
  TriangleAlert,
  ExternalLink,
} from "lucide-react";

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

const TASK_STATUSES = ["Pending", "Ongoing", "Completed", "Overdue"];
const TASK_PRIORITIES = ["Low", "Medium", "High"];

const TASK_STATUS_TONE = {
  Pending: "gray",
  Ongoing: "gray",
  Completed: "gray",
  Overdue: "gray",
};

const TASK_PRIORITY_TONE = {
  Low: "blue",
  Medium: "yellow",
  High: "red",
};

const normalizeTaskStatus = (status) => {
  if (status === "Pendinng") return "Pending";
  if (status === "To Do") return "Pending";
  if (status === "In Progress") return "Ongoing";
  if (TASK_STATUSES.includes(status)) return status;

  return "Pending";
};

const getResponsibleName = (task) => {
  const assigned = task.assignedTo;
  const createdBy = task.createdBy;

  if (task.scope === "Personal") {
    return {
      label: createdBy ? (
        <UserDisplayName user={createdBy}>
          {getDisplayName(createdBy, {
            includeMiddleInitial: true,
            includeSuffix: true,
          })}
        </UserDisplayName>
      ) : (
        "Unknown"
      ),
      type: "personal",
      user: createdBy || null,
    };
  }

  if (!assigned) {
    return {
      label: "Unassigned",
      type: "unassigned",
      user: null,
    };
  }

  return {
    label: (
      <UserDisplayName user={assigned}>
        {getDisplayName(assigned, {
          includeMiddleInitial: true,
          includeSuffix: true,
        })}
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

  const currentUserId = currentUser?._id || currentUser?.id;

  // --- TASK VISIBILITY FILTERING LOGIC ---
  const visibleTasks = tasks.filter((task) => {
    // Check creator ID
    const creatorId = task.createdBy?._id || task.createdBy?.id || task.createdBy;
    const isCreator = creatorId === currentUserId;

    // Check assignee ID
    const assigneeId = task.assignedTo?._id || task.assignedTo?.id || task.assignedTo;
    const isAssignee = assigneeId === currentUserId;

    // Show task if current user created it OR if it was assigned to them
    return isCreator || isAssignee;
  });

  const canEdit = permissions.canEdit !== false;

  const normalizedTasks = visibleTasks.map((task) => ({
    ...task,
    status: normalizeTaskStatus(task.status),
  }));

  const columns = [
    { label: "Title" },
    { label: "Priority" },
    { label: "Task Owner" },
    { label: "Link" },
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

  const HEADERS = columns.map((col) => col.label);

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
    <>
      <BaseTable
        columns={columns}
        empty={paginatedItems.length === 0 ? "No tasks found." : null}
        colSpan={columns.length}
        heightClass="h-112.5"
      >
        {paginatedItems.map((task) => {
          const normalizedStatus = normalizeTaskStatus(task.status);

          const overdue = isOverdue(task.dueDate, normalizedStatus);
          const dueToday = isDueToday(task.dueDate, normalizedStatus);

          const responsible = getResponsibleName(task);
          const responsiblePhoto = getProfileImage(responsible.user);

          const canEditCurrentTask = canFullyEditTask(
            task,
            currentUser,
            permissions,
          );

          const editDisabledReason = getTaskEditDisabledReason(
            task,
            currentUser,
            permissions,
          );

          const taskUrl = task.link
            ? task.link.startsWith("http")
              ? task.link
              : `https://${task.link}`
            : null;

          return (
            <TableRow key={task._id} onClick={() => onView?.(task)}>
              {/* 1. TITLE */}
              <TableCell className="max-w-72">
                <div className="flex items-center gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {task.taskType && task.taskType !== "Other"
                        ? `${task.taskType}: `
                        : ""}
                      {task.subject}
                    </p>

                    {task.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>

              {/* 2. PRIORITY DROPDOWN */}
              <TableCell>
                <div
                  onClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <StatusDropdown
                    status={task.priority || "Medium"}
                    statuses={TASK_PRIORITIES}
                    toneMap={TASK_PRIORITY_TONE}
                    disabled={!canEdit}
                    onSelect={(newPriority) =>
                      onUpdatePriority?.(task._id, newPriority)
                    }
                  />
                </div>
              </TableCell>

              {/* 3. TASK OWNER */}
              <TableCell>
                <div className="flex items-center gap-2">
                  {responsible.user ? (
                    <img
                      src={responsiblePhoto}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border border-gray-300 shrink-0"
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <User size={13} className="text-gray-400" />
                    </span>
                  )}

                  <span
                    className={`text-sm truncate max-w-36 ${
                      responsible.type === "unassigned"
                        ? "text-gray-400 italic"
                        : "text-gray-700 group-hover:text-[#ef4444]"
                    }`}
                  >
                    {responsible.label}
                  </span>

                  {/* BULLET DOT FOR SCOPE */}
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      task.scope === "Personal" ? "bg-indigo-500" : "bg-teal-500"
                    }`}
                    title={task.scope === "Personal" ? "Personal" : "Assigned"}
                  />
                </div>
              </TableCell>

              {/* 4. LINK COLUMN */}
              <TableCell>
                {taskUrl ? (
                  <a
                    href={taskUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 
                      bg-blue-50 text-blue-600 border border-blue-200 rounded-md 
                      hover:bg-blue-100 transition-colors font-medium max-w-40 truncate"
                    title={task.link}
                  >
                    <ExternalLink size={12} className="shrink-0" />
                    <span className="truncate">Open Link</span>
                  </a>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </TableCell>

              {/* 5. DEADLINE */}
              <TableCell>
                {task.dueDate ? (
                  <div className="flex flex-col">
                    <span
                      className={`flex items-center gap-1 text-sm ${
                        overdue
                          ? "text-red-500 font-medium"
                          : dueToday
                            ? "text-amber-500 font-medium"
                            : "text-gray-600 group-hover:text-[#ef4444]"
                      }`}
                      title={
                        overdue
                          ? `Overdue — was due on ${formatDate(task.dueDate)}`
                          : dueToday
                            ? `Due today — ${formatDate(task.dueDate)}`
                            : `Due on ${formatDate(task.dueDate)}`
                      }
                    >
                      {overdue || dueToday ? (
                        <TriangleAlert size={12} className="shrink-0" />
                      ) : (
                        <Calendar size={12} className="shrink-0" />
                      )}

                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </TableCell>

              {/* 6. STATUS DROPDOWN */}
              <TableCell>
                <div
                  onClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <StatusDropdown
                    status={normalizedStatus}
                    statuses={TASK_STATUSES}
                    toneMap={TASK_STATUS_TONE}
                    disabled={!canEdit}
                    onSelect={(newStatus) =>
                      onUpdateStatus?.(task._id, newStatus)
                    }
                  />
                </div>
              </TableCell>

              {/* 7. ACTIONS BUTTON */}
              {canEdit && (
                <TableCell
                  title={!canEditCurrentTask ? editDisabledReason : ""}
                  className="inline-block text-right"
                >
                  <button
                    disabled={!canEditCurrentTask}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit?.(task);
                    }}
                    className={`p-2 rounded-md transition-colors ${
                      !canEditCurrentTask
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-400 hover:text-[#ef4444] cursor-pointer"
                    }`}
                    title={
                      !canEditCurrentTask ? editDisabledReason : "Edit task"
                    }
                  >
                    <Pencil size={16} />
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
      />
    </>
  );
}
