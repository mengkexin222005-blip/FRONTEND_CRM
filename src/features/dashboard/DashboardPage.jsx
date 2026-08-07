import React, { useMemo, useState, useEffect, useRef } from "react";
import { ChevronRight, CalendarDays, Clock, AlertCircle, Tag, CheckCircle2, ChevronDown } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { PageBase, PageContentState } from "../../components/page";
import { useDashboard, getDynamicTaskStatus } from "./hooks/useDashboard";
import MyTasksTable from "./components/MyTaskTable";
import MyMeetingsTable from "./components/MyMeetingTable";
import HeaderFilterDropdown from "./components/HeaderFilterDropdown";

const ROLE_BASE_PATHS = [
  "/admin",
  "/sales-manager",
  "/sales-agent",
  "/support-staff",
  "/superadmin",
];

const getRoleBasePath = (pathname) => {
  const matchedPath = ROLE_BASE_PATHS.find(
    (basePath) => pathname === basePath || pathname.startsWith(`${basePath}/`),
  );
  return matchedPath || "";
};

const ALL_FILTERS = "all";
const NO_DATE = "__no_date__";

const MEETING_STATUS_OPTIONS = [
  "Scheduled",
  "In Progress",
  "Rescheduled",
  "Completed",
  "Cancelled",
];

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());

  let normalizedDate = String(value).trim();
  if (normalizedDate.includes("T")) {
    normalizedDate = normalizedDate.split("T")[0];
  }

  const dateOnlyMatch = normalizedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const parsedDate = new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]));
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const parsedDate = new Date(normalizedDate);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const getMeetingDateValue = (meeting) => {
  return meeting?.meetingDate || meeting?.date || meeting?.scheduledDate || meeting?.startDate || "";
};

const getMeetingTimeParts = (meeting) => {
  const timeStr = meeting?.startTime || meeting?.time || meeting?.meetingTime || meeting?.scheduledTime;
  if (!timeStr) return null;

  const match = String(timeStr).match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;

  return {
    hours: Number(match[1]),
    minutes: Number(match[2]),
    seconds: match[3] ? Number(match[3]) : 0,
  };
};

const getMeetingTitle = (meeting) => {
  return meeting?.title || meeting?.name || "Untitled Meeting";
};

const getMeetingTimestamp = (m) => {
  const parsedDate = parseDate(getMeetingDateValue(m));
  if (!parsedDate) return Number.MAX_SAFE_INTEGER;

  const parsedTime = getMeetingTimeParts(m);
  if (parsedTime) {
    parsedDate.setHours(parsedTime.hours, parsedTime.minutes, parsedTime.seconds, 0);
  } else {
    parsedDate.setHours(0, 0, 0, 0);
  }

  return parsedDate.getTime();
};

const formatLocalDateKey = (value) => {
  if (!value || value === NO_DATE) return NO_DATE;
  const parsedDate = parseDate(value);
  if (!parsedDate) return String(value).trim().toLowerCase();
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeTaskStatus = (value) => {
  const status = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  if (!status || status === "pending" || status === "todo" || status === "to do") return "pending";
  if (status === "ongoing" || status === "in progress") return "ongoing";
  if (status === "due soon") return "due_soon";
  if (status === "overdue") return "overdue";
  if (status === "completed" || status === "complete" || status === "done") return "completed";
  return status;
};

const normalizeMeetingStatus = (value) => {
  const normalizedStatus = String(value || "").trim();
  if (!normalizedStatus) return "Scheduled";
  const found = MEETING_STATUS_OPTIONS.find(
    (opt) => opt.toLowerCase() === normalizedStatus.toLowerCase()
  );
  return found || normalizedStatus;
};

const getTaskTypeCategory = (task) => {
  const text = [
    task?.taskType,
    task?.type,
    task?.category,
    task?.activityType,
    task?.subject,
    task?.title,
    task?.taskTitle,
    task?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim()
    .toLowerCase();

  if (text.includes("call") || text.includes("phone")) return "call";
  if (text.includes("email") || text.includes("e-mail") || text.includes("mail")) return "email";
  if (text.includes("message") || text.includes("chat") || text.includes("sms")) return "message";
  if (text.includes("meeting") || text.includes("appointment")) return "meeting";
  if (text.includes("reminder")) return "reminder";
  return "others";
};

const PRIORITY_SCORES = {
  high: 3,
  medium: 2,
  low: 1,
};

function DatePickerDropdown({ value, onChange, minimumWidth = 140 }) {
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);

  const parsedCurrent = useMemo(() => {
    if (!value || value === ALL_FILTERS) {
      const now = new Date();
      return {
        month: String(now.getMonth() + 1).padStart(2, "0"),
        day: String(now.getDate()).padStart(2, "0"),
        year: String(now.getFullYear()),
      };
    }
    const [y, m, d] = value.split("-");
    return {
      year: y || String(new Date().getFullYear()),
      month: m || "01",
      day: d || "01",
    };
  }, [value]);

  const [tempMonth, setTempMonth] = useState(parsedCurrent.month);
  const [tempDay, setTempDay] = useState(parsedCurrent.day);
  const [tempYear, setTempYear] = useState(parsedCurrent.year);

  useEffect(() => {
    setTempMonth(parsedCurrent.month);
    setTempDay(parsedCurrent.day);
    setTempYear(parsedCurrent.year);
  }, [parsedCurrent]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
  const currentNumYear = new Date().getFullYear();
  const years = Array.from({ length: 201 }, (_, i) => String(currentNumYear + i));

  const handleSave = () => {
    const dateKey = `${tempYear}-${tempMonth}-${tempDay}`;
    onChange(dateKey);
    setOpen(false);
  };

  const handleCancel = () => {
    setTempMonth(parsedCurrent.month);
    setTempDay(parsedCurrent.day);
    setTempYear(parsedCurrent.year);
    setOpen(false);
  };

  const isActive = value !== ALL_FILTERS && Boolean(value);

  const getDisplayLabel = () => {
    if (value === ALL_FILTERS || !value) return "All Dates";
    return value;
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Filter meetings by date"
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition shadow-sm ${
          isActive || open
            ? "border-red-500 bg-red-500/[0.03] text-red-600"
            : "border-black/10 bg-white text-black/75 hover:border-black/20"
        }`}
        style={{ minWidth: `${minimumWidth}px` }}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays size={14} className="shrink-0 text-red-600" />
          <span className="truncate">{getDisplayLabel()}</span>
        </span>
        <ChevronDown size={14} className={`shrink-0 text-red-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-2xl border border-black/10 bg-white p-2.5 shadow-xl">
          <div className="flex items-center justify-between text-[11px] font-semibold text-red-600 px-1 mb-1.5">
            <span>Select Date</span>
            <ChevronDown size={12} className="rotate-180 text-red-600" />
          </div>

          <div className="relative h-28 overflow-hidden flex items-center justify-between px-1 text-xs">
            <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-7 pointer-events-none rounded-lg border border-red-500/30 bg-red-500/[0.02]" />

            {/* Month Column */}
            <div className="flex-1 h-full overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-center space-y-1.5 py-9">
              {months.map((m) => {
                const isSelected = m === tempMonth;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTempMonth(m)}
                    className={`w-full py-0.5 transition font-medium ${
                      isSelected ? "text-red-600 font-bold text-xs" : "text-black/30 hover:text-black/60"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>

            <span className="font-bold text-red-600 pb-0.5">-</span>

            {/* Day Column */}
            <div className="flex-1 h-full overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-center space-y-1.5 py-9">
              {days.map((d) => {
                const isSelected = d === tempDay;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setTempDay(d)}
                    className={`w-full py-0.5 transition font-medium ${
                      isSelected ? "text-red-600 font-bold text-xs" : "text-black/30 hover:text-black/60"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            <span className="font-bold text-red-600 pb-0.5">-</span>

            {/* Year Column */}
            <div className="flex-1 h-full overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-center space-y-1.5 py-9">
              {years.map((y) => {
                const isSelected = y === tempYear;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setTempYear(y)}
                    className={`w-full py-0.5 transition font-medium ${
                      isSelected ? "text-red-600 font-bold text-xs" : "text-black/30 hover:text-black/60"
                    }`}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-end gap-1.5 pt-2 border-t border-black/5">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl px-2.5 py-1 text-[11px] font-medium text-black/70 hover:bg-black/5 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl border border-red-500/30 bg-red-500/[0.05] px-3.5 py-1 text-[11px] font-semibold text-red-600 shadow-sm hover:bg-red-500/10 transition cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = String(currentUser?.roleTemplate || currentUser?.role || "").toLowerCase() === "superadmin";
  const { stats, loading, error, updateTaskStatus, updateMeetingStatus } = useDashboard();

  const currentUserId = String(currentUser?._id || currentUser?.id || "");
  const roleBasePath = getRoleBasePath(location.pathname);

  const [localTasks, setLocalTasks] = useState([]);
  const [localMeetings, setLocalMeetings] = useState([]);

  useEffect(() => {
    if (stats?.tasks) setLocalTasks(stats.tasks);
  }, [stats?.tasks]);

  useEffect(() => {
    if (stats?.meetings) setLocalMeetings(stats.meetings);
  }, [stats?.meetings]);

  const [taskStatusFilter, setTaskStatusFilter] = useState("all");
  const [taskTypeFilter, setTaskTypeFilter] = useState("all");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState("all");

  const [meetingStatusFilter, setMeetingStatusFilter] = useState("all");
  const [meetingDateFilter, setMeetingDateFilter] = useState("all");

  useEffect(() => {
    const getMeetingStatusValue = (meeting) => {
    if (!meeting || typeof meeting !== "object") return "Scheduled";
    return (
      meeting.status ||
      meeting.meetingStatus ||
      meeting.state ||
      "Scheduled"
    );
  };

  const checkActiveMeetings = () => {
      if (!localMeetings || localMeetings.length === 0) return;

      const now = new Date();

      localMeetings.forEach((meeting) => {
        const currentStatus = normalizeMeetingStatus(getMeetingStatusValue(meeting));
        if (currentStatus === "In Progress" || currentStatus === "Completed" || currentStatus === "Cancelled") {
          return;
        }

        const dateVal = getMeetingDateValue(meeting);
        const timeVal = meeting.startTime || meeting.time || meeting.meetingTime || meeting.scheduledTime;
        if (!dateVal) return;

        const parsedDate = parseDate(dateVal);
        if (!parsedDate) return;

        if (timeVal) {
          const timeParts = String(timeVal).match(/(\d{1,2}):(\d{2})/);
          if (timeParts) {
            parsedDate.setHours(Number(timeParts[1]), Number(timeParts[2]), 0, 0);
          }
        } else {
          return;
        }

        const endTime = new Date(parsedDate.getTime() + 60 * 60 * 1000);

        if (now >= parsedDate && now <= endTime) {
          handleMeetingStatusChange(meeting, "In Progress");
        }
      });
    };

    checkActiveMeetings();
    const interval = setInterval(checkActiveMeetings, 60000);
    return () => clearInterval(interval);
  }, [localMeetings]);

  const handleTaskStatusChange = async (taskOrId, newStatus) => {
    const taskId = taskOrId?._id || taskOrId?.id || taskOrId;
    if (!taskId) return;
    const normalizedTaskId = String(taskId);

    setLocalTasks((prev) =>
      prev.map((t) => (String(t._id || t.id || "") === normalizedTaskId ? { ...t, status: newStatus } : t))
    );

    if (updateTaskStatus) {
      try {
        await updateTaskStatus(taskId, newStatus);
      } catch (err) {
        console.error("Failed to update task status", err);
      }
    }
  };

  const handleMeetingStatusChange = async (meetingOrId, newStatus) => {
    const meetingId = meetingOrId?._id || meetingOrId?.id || meetingOrId;
    if (!meetingId) return;
    const normalizedMeetingId = String(meetingId);

    setLocalMeetings((prev) =>
      prev.map((m) =>
        String(m._id || m.id || "") === normalizedMeetingId
          ? { ...m, status: newStatus, meetingStatus: newStatus }
          : m,
      ),
    );

    if (updateMeetingStatus) {
      try {
        await updateMeetingStatus(meetingId, newStatus);
      } catch (err) {
        console.error("Failed to update meeting status", err);
      }
    }
  };

  const handleClientClick = (clientInfo, task) => {
    const clientId = clientInfo?.id || clientInfo?._id || task?.clientId || task?.client?._id;
    if (clientId && roleBasePath) {
      navigate(`${roleBasePath}/clients/${clientId}`);
    }
  };

  const getMeetingStatusValue = (meeting) => {
    if (!meeting || typeof meeting !== "object") return "Scheduled";
    return (
      meeting.status ||
      meeting.meetingStatus ||
      meeting.state ||
      "Scheduled"
    );
  };

  const tasks = useMemo(() => {
    return localTasks.filter((task) => {
      if (isSuperAdmin) return true;
      const creatorId = String(task.createdBy?._id || task.createdBy?.id || task.createdBy || "");
      const isCreator = creatorId === currentUserId;
      const assigneeId = String(task.assignedTo?._id || task.assignedTo?.id || task.assignedTo || "");
      const isAssignee = assigneeId === currentUserId;

      if (currentUserId) {
        if (assigneeId && assigneeId !== currentUserId) return false;
        if (!isCreator && !isAssignee) return false;
      }

      const status = getDynamicTaskStatus(task);
      const isCompleted = status === "Completed";
      const typeCategory = getTaskTypeCategory(task);

      return !isCompleted && typeCategory !== "meeting";
    });
  }, [localTasks, currentUserId]);

  const getUserIdFromValue = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "object") {
      return (
        value._id ||
        value.id ||
        value.userId ||
        value.user?.id ||
        value.user?._id ||
        value.uid ||
        ""
      );
    }
    return "";
  };

  const isMeetingAssignedOrHostedByCurrentUser = (meeting) => {
    const creatorId = getUserIdFromValue(meeting?.userId || meeting?.createdBy || meeting?.creator || meeting?.creator?.user || meeting?.creator);
    const hostId = getUserIdFromValue(meeting?.host || meeting?.organizer || meeting?.host?.user || meeting?.organizer?.user);
    const assignedUsers = meeting?.assignedTo || meeting?.participants || meeting?.attendees || meeting?.participantIds || [];

    if (String(creatorId) === currentUserId) return true;
    if (String(hostId) === currentUserId) return true;

    if (Array.isArray(assignedUsers)) {
      return assignedUsers.some((u) => {
        const uId = getUserIdFromValue(u);
        return String(uId) === currentUserId;
      });
    }

    const assignedUserId = getUserIdFromValue(assignedUsers);
    return String(assignedUserId) === currentUserId;
  };

  const meetings = useMemo(() => {
    return localMeetings.filter((meeting) => {
      const isCompleted = normalizeMeetingStatus(getMeetingStatusValue(meeting)) === "Completed";
      if (isCompleted) return false;

      if (isSuperAdmin) return true;
      if (!currentUserId) return true;
      return isMeetingAssignedOrHostedByCurrentUser(meeting);
    });
  }, [localMeetings, currentUserId, isSuperAdmin]);

  const taskStatusOptions = [
    { value: "all", label: "All status" },
    { value: "Pending", label: "Pending" },
    { value: "Ongoing", label: "Ongoing" },
    { value: "Due Soon", label: "Due Soon" },
    { value: "Overdue", label: "Overdue" },
  ];

  const taskTypeOptions = [
    { value: "all", label: "All Types" },
    { value: "call", label: "Call" },
    { value: "email", label: "Email" },
    { value: "message", label: "Message" },
    { value: "reminder", label: "Reminder" },
    { value: "others", label: "Others" },
  ];

  const taskPriorityOptions = [
    { value: "all", label: "All Priorities" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  const meetingStatusOptions = useMemo(() => {
    return [
      { value: ALL_FILTERS, label: "All status" },
      ...MEETING_STATUS_OPTIONS.map((status) => ({ value: status, label: status })),
    ];
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const dynamicStatus = getDynamicTaskStatus(task);
      if (taskStatusFilter !== ALL_FILTERS && dynamicStatus !== taskStatusFilter) return false;
      if (taskTypeFilter !== ALL_FILTERS && getTaskTypeCategory(task) !== taskTypeFilter) return false;
      if (taskPriorityFilter !== ALL_FILTERS && String(task.priority || "medium").toLowerCase() !== taskPriorityFilter) return false;
      return true;
    }).sort((a, b) => {
      const pA = PRIORITY_SCORES[String(a.priority || "medium").toLowerCase()] || 2;
      const pB = PRIORITY_SCORES[String(b.priority || "medium").toLowerCase()] || 2;
      return pB - pA;
    });
  }, [tasks, taskStatusFilter, taskTypeFilter, taskPriorityFilter]);

  const filteredMeetings = useMemo(() => {
    const filtered = meetings.filter((m) => {
      const meetingId = m?._id || m?.id;
      const currentStatus = localMeetings.find(item => (item?._id || item?.id) === meetingId)?.status || localMeetings.find(item => (item?._id || item?.id) === meetingId)?.meetingStatus || m.status || m.meetingStatus;
      const normalizedStatus = normalizeMeetingStatus(currentStatus);
      
      const rawDateVal = getMeetingDateValue(m);
      const dateKey = formatLocalDateKey(rawDateVal || NO_DATE);

      const statusMatch = meetingStatusFilter === ALL_FILTERS || normalizedStatus.toLowerCase() === meetingStatusFilter.toLowerCase();
      const dateMatch = meetingDateFilter === ALL_FILTERS || dateKey === meetingDateFilter;

      return statusMatch && dateMatch;
    });

    // Chronological sorting for all meetings card displays
    return filtered.sort((a, b) => {
      const timeA = getMeetingTimestamp(a);
      const timeB = getMeetingTimestamp(b);

      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return getMeetingTitle(a).localeCompare(getMeetingTitle(b));
    });
  }, [meetings, localMeetings, meetingStatusFilter, meetingDateFilter]);

  const handleViewTasks = () => {
    navigate(roleBasePath ? `${roleBasePath}/tasks` : '/admin/tasks');
  };

  const handleViewMeetings = () => {
    navigate(roleBasePath ? `${roleBasePath}/meetings` : '/admin/meetings');
  };

  return (
    <PageBase>
      {error && (
        <div className="mb-4 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <PageContentState loading={loading}>
        <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto pb-5">
          
          <section className="w-full min-w-0 shrink-0">
            <div className="sticky top-0 z-20 mb-4 flex w-full min-w-0 flex-col gap-3 bg-white py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-700">My Tasks</h2>
                <span className="inline-flex h-6 min-w-8 shrink-0 items-center justify-center rounded-md bg-red-600 px-3 text-xs font-semibold text-white">
                  {filteredTasks.length}
                </span>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <HeaderFilterDropdown
                  icon={CheckCircle2}
                  ariaLabel="Filter tasks by status"
                  value={taskStatusFilter}
                  options={taskStatusOptions}
                  onChange={setTaskStatusFilter}
                  minimumWidth={120}
                />
                <HeaderFilterDropdown
                  icon={Tag}
                  ariaLabel="Filter tasks by task type"
                  value={taskTypeFilter}
                  options={taskTypeOptions}
                  onChange={setTaskTypeFilter}
                  minimumWidth={115}
                />
                <HeaderFilterDropdown
                  icon={AlertCircle}
                  ariaLabel="Filter tasks by priority"
                  value={taskPriorityFilter}
                  options={taskPriorityOptions}
                  onChange={setTaskPriorityFilter}
                  minimumWidth={115}
                />
                <button
                  type="button"
                  onClick={handleViewTasks}
                  className="inline-flex shrink-0 items-center gap-px whitespace-nowrap rounded-md px-1 py-1 text-xs font-medium text-black/45 hover:text-red-600 cursor-pointer sm:text-[clamp(11px,0.8vw,13px)]"
                >
                  <span>View more</span>
                  <ChevronRight className="h-4 w-4 text-red-600" strokeWidth={2} />
                </button>
              </div>
            </div>

            <MyTasksTable 
              tasks={filteredTasks} 
              hideFilter 
              onStatusChange={handleTaskStatusChange} 
              onClientClick={handleClientClick}
            />
          </section>

          <section className="mt-[clamp(32px,5vw,48px)] w-full min-w-0 shrink-0">
            <div className="mb-4 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-700">My Meetings</h2>
                <span className="inline-flex h-6 min-w-8 shrink-0 items-center justify-center rounded-md bg-red-600 px-3 text-xs font-semibold text-white">
                  {filteredMeetings.length}
                </span>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <HeaderFilterDropdown
                  icon={CheckCircle2}
                  ariaLabel="Filter meetings by status"
                  value={meetingStatusFilter}
                  options={meetingStatusOptions}
                  onChange={setMeetingStatusFilter}
                  minimumWidth={120}
                />

                <DatePickerDropdown
                  value={meetingDateFilter}
                  onChange={setMeetingDateFilter}
                  minimumWidth={120}
                />

                <button
                  type="button"
                  onClick={handleViewMeetings}
                  className="inline-flex shrink-0 items-center gap-px whitespace-nowrap rounded-md px-1 py-1 text-xs font-medium text-black/45 hover:text-red-600 cursor-pointer sm:text-[clamp(11px,0.8vw,13px)]"
                >
                  <span>View more</span>
                  <ChevronRight className="h-4 w-4 text-red-600" strokeWidth={2} />
                </button>
              </div>
            </div>

            <MyMeetingsTable meetings={filteredMeetings} hideFilter onStatusChange={handleMeetingStatusChange} currentUserId={currentUserId} isSuperAdmin={isSuperAdmin} />
          </section>

        </div>
      </PageContentState>
    </PageBase>
  );
}
