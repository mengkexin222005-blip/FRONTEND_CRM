import {
  useCallback,
  useEffect,
  useState,
} from "react";

import api from "../../../services/api";

const createEmptyDashboardStats = () => ({
  kpi: {},
  charts: {},
  tasks: [],
  meetings: [],
  recentActivity: [],
  topPerformers: null,
});

const getNestedPayloads = (payload) => {
  const payloads = [];

  if (payload !== undefined && payload !== null) {
    payloads.push(payload);
  }

  if (
    payload?.data !== undefined &&
    payload?.data !== null
  ) {
    payloads.push(payload.data);
  }

  if (
    payload?.data?.data !== undefined &&
    payload?.data?.data !== null
  ) {
    payloads.push(payload.data.data);
  }

  return payloads;
};

const extractCollection = (
  response,
  possibleKeys,
) => {
  const payloads = getNestedPayloads(
    response?.data,
  );

  for (const payload of payloads) {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (
      !payload ||
      typeof payload !== "object"
    ) {
      continue;
    }

    for (const key of possibleKeys) {
      if (Array.isArray(payload[key])) {
        return payload[key];
      }
    }
  }

  return [];
};

const normalizeDashboardStats = (response) => {
  const responseData =
    response?.data &&
    typeof response.data === "object"
      ? response.data
      : {};

  const dashboardData =
    responseData?.data &&
    !Array.isArray(responseData.data) &&
    typeof responseData.data === "object"
      ? responseData.data
      : responseData;

  return {
    kpi:
      dashboardData?.kpi &&
      typeof dashboardData.kpi === "object"
        ? dashboardData.kpi
        : {},

    charts:
      dashboardData?.charts &&
      typeof dashboardData.charts ===
        "object"
        ? dashboardData.charts
        : {},

    tasks: extractCollection(response, [
      "tasks",
      "tasksList",
    ]),

    meetings: extractCollection(response, [
      "meetings",
      "meetingsList",
    ]),

    recentActivity: Array.isArray(
      dashboardData?.recentActivity,
    )
      ? dashboardData.recentActivity
      : [],

    topPerformers:
      dashboardData?.topPerformers ??
      null,
  };
};

const getRequestErrorMessage = (
  result,
  fallbackMessage,
) => {
  if (result.status !== "rejected") {
    return "";
  }

  const requestError = result.reason;

  if (
    requestError?.name ===
      "CanceledError" ||
    requestError?.name === "AbortError" ||
    requestError?.code ===
      "ERR_CANCELED"
  ) {
    return "";
  }

  return (
    requestError?.response?.data?.error ||
    requestError?.response?.data
      ?.message ||
    requestError?.message ||
    fallbackMessage
  );
};

const DAY_MS = 24 * 60 * 60 * 1000;

const normalizeTaskStatus = (value) => {
  const status = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (status === "completed" || status === "complete" || status === "done") {
    return "Completed";
  }
  if (status === "ongoing" || status === "in progress") {
    return "Ongoing";
  }
  if (status === "overdue") return "Overdue";
  if (status === "due soon") return "Due Soon";
  return "Pending";
};

const getTaskDueDateValue = (task) =>
  task?.dueDate ||
  task?.deadline ||
  task?.deadlineDate ||
  task?.date ||
  task?.taskDate ||
  task?.scheduledDate ||
  task?.reminderDate ||
  null;

const parseTaskCalendarDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  const rawValue = String(value).trim();
  const leadingDateMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (leadingDateMatch) {
    const parsedDate = new Date(
      Number(leadingDateMatch[1]),
      Number(leadingDateMatch[2]) - 1,
      Number(leadingDateMatch[3]),
    );
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const parsedDate = new Date(rawValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const getLocalCalendarDayNumber = (date) =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS;

export const getDynamicTaskStatus = (task, referenceDate = new Date()) => {
  const storedStatus = normalizeTaskStatus(task?.status);

  if (storedStatus === "Completed") return "Completed";

  const dueDate = parseTaskCalendarDate(getTaskDueDateValue(task));
  const now =
    referenceDate instanceof Date
      ? referenceDate
      : new Date(referenceDate);

  if (dueDate && !Number.isNaN(now.getTime())) {
    const differenceInCalendarDays =
      getLocalCalendarDayNumber(dueDate) - getLocalCalendarDayNumber(now);

    if (differenceInCalendarDays < 0) return "Overdue";
    if (differenceInCalendarDays <= 3) return "Due Soon";

    return storedStatus === "Ongoing" ? "Ongoing" : "Pending";
  }

  if (storedStatus === "Overdue") return "Overdue";
  return storedStatus === "Ongoing" ? "Ongoing" : "Pending";
};

export function useDashboard() {
  const [stats, setStats] = useState(
    createEmptyDashboardStats,
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const fetchDashboard = useCallback(
    async ({
      signal,
      showLoading = true,
    } = {}) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        setError("");

        const [
          dashboardResult,
          tasksResult,
          meetingsResult,
        ] = await Promise.allSettled([
          api.get(
            "/api/dashboard/stats",
            {
              signal,
            },
          ),

          api.get("/api/tasks", {
            signal,
          }),

          api.get("/api/meetings", {
            signal,
          }),
        ]);

        if (signal?.aborted) {
          return;
        }

        const dashboardStats =
          dashboardResult.status ===
          "fulfilled"
            ? normalizeDashboardStats(
                dashboardResult.value,
              )
            : createEmptyDashboardStats();

        const tasks =
          tasksResult.status ===
          "fulfilled"
            ? extractCollection(
                tasksResult.value,
                [
                  "tasks",
                  "tasksList",
                  "items",
                  "results",
                  "records",
                ],
              )
            : dashboardStats.tasks;

        const meetings =
          meetingsResult.status ===
          "fulfilled"
            ? extractCollection(
                meetingsResult.value,
                [
                  "meetings",
                  "meetingsList",
                  "items",
                  "results",
                  "records",
                ],
              )
            : dashboardStats.meetings;

        setStats({
          ...dashboardStats,
          tasks,
          meetings,
        });

        const requestErrors = [
          getRequestErrorMessage(
            dashboardResult,
            "Unable to load dashboard statistics.",
          ),

          getRequestErrorMessage(
            tasksResult,
            "Unable to load tasks.",
          ),

          getRequestErrorMessage(
            meetingsResult,
            "Unable to load meetings.",
          ),
        ].filter(Boolean);

        if (requestErrors.length > 0) {
          console.error(
            "Dashboard request errors:",
            requestErrors,
          );

          setError(
            requestErrors.join(" "),
          );
        }
      } catch (requestError) {
        const requestWasCanceled =
          requestError?.name ===
            "CanceledError" ||
          requestError?.name ===
            "AbortError" ||
          requestError?.code ===
            "ERR_CANCELED";

        if (requestWasCanceled) {
          return;
        }

        console.error(
          "Dashboard fetch error:",
          requestError,
        );

        setStats(
          createEmptyDashboardStats(),
        );

        setError(
          requestError?.response?.data
            ?.error ||
            requestError?.response?.data
              ?.message ||
            requestError?.message ||
            "Unable to load dashboard data.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const updateTaskStatus = useCallback(async (task, newStatus) => {
    try {
      const taskId = typeof task === "object" ? (task?._id || task?.id) : task;
      if (!taskId) throw new Error("Invalid task ID");
      const normalizedTaskId = String(taskId);

      await api.patch(`/api/tasks/${normalizedTaskId}/status`, { status: newStatus });

      setStats((prevStats) => {
        const updatedTasks = prevStats.tasks.map((t) => {
          const tId = String(t?._id || t?.id || "");
          if (tId === normalizedTaskId) {
            return { ...t, status: newStatus };
          }
          return t;
        });

        return {
          ...prevStats,
          tasks: updatedTasks,
        };
      });
    } catch (err) {
      console.error("Failed to save task status update:", err);
      throw err;
    }
  }, []);

  const updateMeetingStatus = useCallback(async (meeting, newStatus) => {
    try {
      const meetingId = typeof meeting === "object" ? (meeting?._id || meeting?.id) : meeting;
      if (!meetingId) throw new Error("Invalid meeting ID");
      const normalizedMeetingId = String(meetingId);

      await api.patch(`/api/meetings/${normalizedMeetingId}/status`, { status: newStatus });

      setStats((prevStats) => {
        const updatedMeetings = prevStats.meetings.map((m) => {
          const mId = String(m?._id || m?.id || "");
          if (mId === normalizedMeetingId) {
            return { ...m, status: newStatus };
          }
          return m;
        });

        return {
          ...prevStats,
          meetings: updatedMeetings,
        };
      });
    } catch (err) {
      console.error("Failed to save meeting status update:", err);
      throw err;
    }
  }, []);

  useEffect(() => {
    const controller =
      new AbortController();

    fetchDashboard({
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [fetchDashboard]);

  useEffect(() => {
    const refreshWithoutLoader = () => {
      fetchDashboard({
        showLoading: false,
      });
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        refreshWithoutLoader();
      }
    };

    window.addEventListener(
      "focus",
      refreshWithoutLoader,
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshWithoutLoader,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [fetchDashboard]);

  const refreshDashboard =
    useCallback(() => {
      return fetchDashboard({
        showLoading: false,
      });
    }, [fetchDashboard]);

  return {
    stats,
    loading,
    error,
    refreshDashboard,
    updateTaskStatus,
    updateMeetingStatus,
    getDynamicTaskStatus,
  };
}

export default useDashboard;
