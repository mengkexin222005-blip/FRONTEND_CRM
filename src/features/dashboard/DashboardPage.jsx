import { useMemo, useState } from "react";
import { ChevronRight, CalendarDays, Clock, AlertCircle, Tag, CheckCircle2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { PageBase, PageContentState } from "../../components/page";
import { useDashboard } from "./hooks/useDashboard";
import MyTasksTable from "./components/MyTaskTable";
import MyMeetingsTable from "./components/MyMeetingTable";
import HeaderFilterDropdown from "./components/HeaderFilterDropdown";

const ROLE_BASE_PATHS = [
  "/admin",
  "/sales-manager",
  "/sales-agent",
  "/support-staff",
];

const getRoleBasePath = (pathname) => {
  const matchedPath = ROLE_BASE_PATHS.find(
    (basePath) => pathname === basePath || pathname.startsWith(`${basePath}/`),
  );
  return matchedPath || "";
};

const formatDateKey = (value) => {
  if (!value || value === "__no_date__") return "__no_date__";
  const rawString = String(value).trim();
  const cleanString = rawString.includes("T") ? rawString.split("T")[0] : rawString;
  
  const parsedDate = new Date(cleanString);
  if (Number.isNaN(parsedDate.getTime())) return cleanString;

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

// Helper function to extract normalized String IDs from various object structures
const extractUserIds = (userOrArray) => {
  if (!userOrArray) return [];
  if (Array.isArray(userOrArray)) {
    return userOrArray.map((item) => {
      if (typeof item === "object") return String(item?._id || item?.id || item?.userId || "");
      return String(item || "");
    }).filter(Boolean);
  }
  if (typeof userOrArray === "object") {
    const id = userOrArray?._id || userOrArray?.id || userOrArray?.userId;
    return id ? [String(id)] : [];
  }
  return [String(userOrArray)];
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const { stats, loading, error } = useDashboard();

  const currentUserId = String(currentUser?._id || currentUser?.id || "");

  const rawTasks = stats?.tasks || [];
  const rawMeetings = stats?.meetings || [];

  const roleBasePath = getRoleBasePath(location.pathname);

  // --- Task Filter States ---
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");
  const [taskTypeFilter, setTaskTypeFilter] = useState("all");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState("all");

  // --- Meeting Filter States ---
  const [meetingDateFilter, setMeetingDateFilter] = useState("all");
  const [meetingTimeFilter, setMeetingTimeFilter] = useState("all");

  // --- Task Visibility & Incomplete Filter ---
  const tasks = useMemo(() => {
    return rawTasks.filter((task) => {
      // 1. User Ownership/Assignment Check
      const creatorId = String(task.createdBy?._id || task.createdBy?.id || task.createdBy || "");
      const isCreator = creatorId === currentUserId;

      const assigneeId = String(task.assignedTo?._id || task.assignedTo?.id || task.assignedTo || "");
      const isAssignee = assigneeId === currentUserId;

      if (!isCreator && !isAssignee) {
        return false;
      }

      // 2. Status & Type Exclusions
      const rawStatus = String(task.status || "").trim().toLowerCase();
      const isCompleted = rawStatus === "completed" || rawStatus === "complete" || rawStatus === "done";
      
      const typeCategory = getTaskTypeCategory(task);
      const isMeeting = typeCategory === "meeting";

      return !isCompleted && !isMeeting;
    });
  }, [rawTasks, currentUserId]);

  // --- Meeting Visibility Filter ---
  const meetings = useMemo(() => {
    if (!currentUserId) return rawMeetings;

    return rawMeetings.filter((meeting) => {
      // Collect all user IDs associated with this meeting
      const participants = [
        ...extractUserIds(meeting.createdBy),
        ...extractUserIds(meeting.organizer),
        ...extractUserIds(meeting.host),
        ...extractUserIds(meeting.assignedTo),
        ...extractUserIds(meeting.user),
        ...extractUserIds(meeting.attendees),
        ...extractUserIds(meeting.participants),
        ...extractUserIds(meeting.members),
      ];

      // Keep meeting if current user is found in any participant/ownership field
      return participants.includes(currentUserId);
    });
  }, [rawMeetings, currentUserId]);

  const taskStatusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "ongoing", label: "Ongoing" },
    { value: "due_soon", label: "Due Soon" },
    { value: "overdue", label: "Overdue" },
  ];

  const taskTypeOptions = [
    { value: "all", label: "All Types" },
    { value: "call", label: "Call" },
    { value: "email", label: "Email" },
    { value: "message", label: "Message" },
    { value: "others", label: "Others" },
  ];

  const taskPriorityOptions = [
    { value: "all", label: "All Priorities" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  const meetingDateOptions = useMemo(() => {
    const dates = Array.from(
      new Set(meetings.map((m) => formatDateKey(m.meetingDate || m.date || "__no_date__"))),
    ).sort((a, b) => {
      if (a === "__no_date__") return 1;
      if (b === "__no_date__") return -1;
      return a.localeCompare(b);
    });

    return [
      { value: "all", label: "All Dates" },
      ...dates.map((d) => ({
        value: d,
        label: d === "__no_date__" ? "No Date" : d,
      })),
    ];
  }, [meetings]);

  const meetingTimeOptions = useMemo(() => {
    const times = Array.from(
      new Set(meetings.map((m) => m.startTime || m.time || "__no_time__")),
    ).sort();
    return [
      { value: "all", label: "All Times" },
      ...times.map((t) => ({
        value: t,
        label: t === "__no_time__" ? "No Time" : t,
      })),
    ];
  }, [meetings]);

  const filteredTasks = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

    return tasks.filter((task) => {
      const rawDueDate = task.dueDate || task.date;
      const rawStartDate = task.startDate || task.createdAt;

      const dueTimestamp = rawDueDate ? new Date(rawDueDate).getTime() : null;
      const startTimestamp = rawStartDate ? new Date(rawStartDate).getTime() : null;

      const taskDate = rawDueDate ? new Date(rawDueDate).toISOString().split("T")[0] : null;

      const rawStatus = String(task.status || "pending").toLowerCase();
      const isOngoing = rawStatus === "in progress" || rawStatus === "ongoing";
      const isOverdue = taskDate && taskDate < today;

      let isDueSoon = false;
      if (dueTimestamp && dueTimestamp >= now) {
        if (startTimestamp && !Number.isNaN(startTimestamp)) {
          const totalDuration = dueTimestamp - startTimestamp;
          if (totalDuration <= threeDaysMs) {
            isDueSoon = true;
          } else {
            isDueSoon = dueTimestamp - now <= threeDaysMs;
          }
        } else {
          isDueSoon = dueTimestamp - now <= threeDaysMs;
        }
      }

      if (taskStatusFilter !== "all") {
        if (taskStatusFilter === "pending" && (isOngoing || isOverdue)) return false;
        if (taskStatusFilter === "ongoing" && !isOngoing) return false;
        if (taskStatusFilter === "due_soon" && !isDueSoon) return false;
        if (taskStatusFilter === "overdue" && !isOverdue) return false;
        if (taskStatusFilter === "upcoming" && (!taskDate || taskDate <= today)) return false;
      }

      if (taskTypeFilter !== "all") {
        const typeCategory = getTaskTypeCategory(task);
        if (typeCategory !== taskTypeFilter) return false;
      }

      if (taskPriorityFilter !== "all") {
        const priority = String(task.priority || "medium").toLowerCase();
        if (priority !== taskPriorityFilter) return false;
      }

      return true;
    });
  }, [tasks, taskStatusFilter, taskTypeFilter, taskPriorityFilter]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const dateKey = formatDateKey(m.meetingDate || m.date || "__no_date__");
      const dateMatch = meetingDateFilter === "all" || dateKey === meetingDateFilter;
      const timeMatch = meetingTimeFilter === "all" || (m.startTime || m.time || "__no_time__") === meetingTimeFilter;
      return dateMatch && timeMatch;
    });
  }, [meetings, meetingDateFilter, meetingTimeFilter]);

  const handleViewTasks = () => roleBasePath && navigate(`${roleBasePath}/tasks`);
  const handleViewMeetings = () => roleBasePath && navigate(`${roleBasePath}/meetings`);

  return (
    <PageBase>
      {error && (
        <div className="mb-4 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <PageContentState loading={loading}>
        <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto pb-5">
          
          {/* MY TASKS SECTION */}
          <section className="w-full min-w-0 shrink-0">
            <div className="mb-4 flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-700">
                  My Tasks
                </h2>
                <span className="inline-flex h-6 min-w-8 shrink-0 items-center justify-center rounded-md border border-black/[0.07] bg-black/[0.04] px-3 text-xs font-medium text-black/45">
                  {filteredTasks.length}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <HeaderFilterDropdown
                  icon={CheckCircle2}
                  ariaLabel="Filter tasks by status"
                  value={taskStatusFilter}
                  options={taskStatusOptions}
                  onChange={setTaskStatusFilter}
                  minimumWidth={140}
                />

                <HeaderFilterDropdown
                  icon={Tag}
                  ariaLabel="Filter tasks by task type"
                  value={taskTypeFilter}
                  options={taskTypeOptions}
                  onChange={setTaskTypeFilter}
                  minimumWidth={130}
                />

                <HeaderFilterDropdown
                  icon={AlertCircle}
                  ariaLabel="Filter tasks by priority"
                  value={taskPriorityFilter}
                  options={taskPriorityOptions}
                  onChange={setTaskPriorityFilter}
                  minimumWidth={130}
                />

                <button
                  type="button"
                  onClick={handleViewTasks}
                  className="inline-flex shrink-0 items-center gap-px whitespace-nowrap rounded-md px-1 py-1 text-[clamp(11px,0.8vw,13px)] font-medium text-black/45 hover:text-red-600"
                >
                  <span>View more</span>
                  <ChevronRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            </div>

            <MyTasksTable tasks={filteredTasks} hideFilter />
          </section>

          {/* MY MEETINGS SECTION */}
          <section className="mt-[clamp(32px,5vw,48px)] w-full min-w-0 shrink-0">
            <div className="mb-4 flex w-full min-w-0 items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-700">
                  My Meetings
                </h2>
                <span className="inline-flex h-6 min-w-8 shrink-0 items-center justify-center rounded-md border border-black/[0.07] bg-black/[0.04] px-3 text-xs font-medium text-black/45">
                  {filteredMeetings.length}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <HeaderFilterDropdown
                  icon={CalendarDays}
                  ariaLabel="Filter meetings by date"
                  value={meetingDateFilter}
                  options={meetingDateOptions}
                  onChange={setMeetingDateFilter}
                  minimumWidth={150}
                />

                <HeaderFilterDropdown
                  icon={Clock}
                  ariaLabel="Filter meetings by time"
                  value={meetingTimeFilter}
                  options={meetingTimeOptions}
                  onChange={setMeetingTimeFilter}
                />

                <button
                  type="button"
                  onClick={handleViewMeetings}
                  className="inline-flex shrink-0 items-center gap-px whitespace-nowrap rounded-md px-1 py-1 text-[clamp(11px,0.8vw,13px)] font-medium text-black/45 hover:text-red-600"
                >
                  <span>View more</span>
                  <ChevronRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            </div>

            <MyMeetingsTable meetings={filteredMeetings} hideFilter />
          </section>

        </div>
      </PageContentState>
    </PageBase>
  );
}
