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

/*
|--------------------------------------------------------------------------
| API response helpers
|--------------------------------------------------------------------------
| Supports common backend response structures:
|
| []
| { tasks: [] }
| { meetings: [] }
| { data: [] }
| { data: { tasks: [] } }
| { data: { meetings: [] } }
| { items: [] }
| { results: [] }
|--------------------------------------------------------------------------
*/

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

        /*
         * Dashboard summary:
         * GET /api/dashboard/stats
         *
         * Same task records as the main Tasks page:
         * GET /api/tasks
         *
         * Same meeting records as the main Meetings page:
         * GET /api/meetings
         */
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

        /*
         * Prefer the exact collections returned by
         * the same endpoints used by the main pages.
         */
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

  /*
   * Load current MongoDB records when the
   * dashboard opens.
   */
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

  /*
   * Reload after returning from the main
   * Tasks or Meetings page.
   */
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
  };
}

export default useDashboard;
