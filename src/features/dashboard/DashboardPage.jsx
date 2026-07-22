import { useMemo, useState } from "react";
import { ChevronRight, CalendarDays, Clock } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

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

// Helper function to extract strictly YYYY-MM-DD
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

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { stats, loading, error } = useDashboard();

  const tasks = stats?.tasks || [];
  const meetings = stats?.meetings || [];

  const roleBasePath = getRoleBasePath(location.pathname);

  // Filter States
  const [taskTimeFilter, setTaskTimeFilter] = useState("all");
  const [meetingDateFilter, setMeetingDateFilter] = useState("all");
  const [meetingTimeFilter, setMeetingTimeFilter] = useState("all");

  // Options Generators
  const taskTimeOptions = useMemo(() => {
    const times = Array.from(
      new Set(tasks.map((t) => t.dueTime || t.time || "__no_time__")),
    ).sort();
    return [
      { value: "all", label: "All Times" },
      ...times.map((t) => ({
        value: t,
        label: t === "__no_time__" ? "No Time" : t,
      })),
    ];
  }, [tasks]);

  const meetingDateOptions = useMemo(() => {
    // Map dates through formatDateKey so options are clean YYYY-MM-DD
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

  // Filtered Data
  const filteredTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        taskTimeFilter === "all" ||
        (t.dueTime || t.time || "__no_time__") === taskTimeFilter,
    );
  }, [tasks, taskTimeFilter]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const dateKey = formatDateKey(m.meetingDate || m.date || "__no_date__");
      const dateMatch =
        meetingDateFilter === "all" || dateKey === meetingDateFilter;
      const timeMatch =
        meetingTimeFilter === "all" ||
        (m.startTime || m.time || "__no_time__") === meetingTimeFilter;
      return dateMatch && timeMatch;
    });
  }, [meetings, meetingDateFilter, meetingTimeFilter]);

  const handleViewTasks = () =>
    roleBasePath && navigate(`${roleBasePath}/tasks`);
  const handleViewMeetings = () =>
    roleBasePath && navigate(`${roleBasePath}/meetings`);

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
            <div className="mb-4 flex w-full min-w-0 items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-700">
                  My Tasks
                </h2>
                <span className="inline-flex h-6 min-w-8 shrink-0 items-center justify-center rounded-md border border-black/[0.07] bg-black/[0.04] px-3 text-xs font-medium text-black/45">
                  {filteredTasks.length}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <HeaderFilterDropdown
                  icon={Clock}
                  ariaLabel="Filter tasks by time"
                  value={taskTimeFilter}
                  options={taskTimeOptions}
                  onChange={setTaskTimeFilter}
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