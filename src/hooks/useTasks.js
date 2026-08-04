import { useSocket } from "./useSocket";
import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import api from "../services/api";
import { SOCKET_EVENTS } from "../constants/socketEvents";
import { buildTaskPayload } from "../features/tasks/utils/taskPayload";

const isFormData = (value) => value instanceof FormData;

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  width: "auto",
});

const STATUSES = ["Pending", "Ongoing", "Due Soon", "Completed", "Overdue"];

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/tasks");
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Listen for client-side task updates dispatched by dashboard actions
  useEffect(() => {
    const handler = (e) => {
      try {
        const id = e?.detail?.id;
        if (id) {
          // Refresh tasks to reflect the change made on the dashboard
          void fetchTasks();
        }
      } catch (err) {
        console.error("Error handling crm:task:updated event", err);
      }
    };

    window.addEventListener("crm:task:updated", handler);
    return () => window.removeEventListener("crm:task:updated", handler);
  }, [fetchTasks]);

  // Websocket listeners
  useSocket(
    SOCKET_EVENTS.TASK_CREATED,
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks]),
  );

  useSocket(
    SOCKET_EVENTS.TASK_UPDATED,
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks]),
  );

  useSocket(
    SOCKET_EVENTS.TASK_STATUS_CHANGED,
    useCallback((data) => {
      setTasks((prev) =>
        prev.map((t) =>
          t._id === data.taskId ? { ...t, status: data.newStatus } : t,
        ),
      );
    }, []),
  );

  useSocket(
    SOCKET_EVENTS.TASK_PRIORITY_CHANGED,
    useCallback((data) => {
      setTasks((prev) =>
        prev.map((t) =>
          t._id === data.taskId ? { ...t, priority: data.newPriority } : t,
        ),
      );
    }, []),
  );

  useSocket(
    SOCKET_EVENTS.TASK_ASSIGNED,
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks]),
  );

  // Group tasks by status for the Kanban board, sorted by position
  const columns = STATUSES.reduce((acc, status) => {
    acc[status] = tasks
      .filter((t) => t.status === status)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return acc;
  }, {});

  const updateTaskStatus = async (
    taskId,
    newStatus,
    position,
    updates = [],
  ) => {
    // Optimistic update
    setTasks((prev) => {
      if (updates.length > 0) {
        const updateMap = new Map(updates.map((u) => [u._id, u]));

        return prev.map((t) => {
          const update = updateMap.get(t._id);

          return update
            ? {
                ...t,
                status: update.status ?? t.status,
                position: update.position,
              }
            : t;
        });
      }

      return prev.map((t) =>
        t._id === taskId
          ? {
              ...t,
              status: newStatus,
              ...(typeof position === "number" ? { position } : {}),
            }
          : t,
      );
    });

    try {
      const payload = { status: newStatus };

      if (typeof position === "number") {
        payload.position = position;
      }

      if (updates.length > 0) {
        payload.updates = updates;
      }

      const { data } = await api.patch(`/api/tasks/${taskId}/status`, payload);

      const returnedTasks = Array.isArray(data) ? data : data.tasks;

      if (Array.isArray(returnedTasks)) {
        setTasks(returnedTasks);
      } else if (data.task) {
        setTasks((prev) => prev.map((t) => (t._id === taskId ? data.task : t)));
      }

      Toast.fire({
        icon: "success",
        title: data.leadUpdated
          ? `Status updated to ${newStatus} • Lead marked as Contacted`
          : `Status updated to ${newStatus}`,
      });
    } catch (error) {
      await fetchTasks();
      Toast.fire({
        icon: "error",
        title: error.response?.data?.error || "Failed to update task status",
      });
    }
  };

  const updateTaskPriority = async (taskId, newPriority) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, priority: newPriority } : t)),
    );

    try {
      const { data } = await api.patch(`/api/tasks/${taskId}/priority`, {
        priority: newPriority,
      });

      setTasks((prev) => prev.map((t) => (t._id === taskId ? data.task : t)));

      Toast.fire({
        icon: "success",
        title: `Priority updated to ${newPriority}`,
      });
    } catch (error) {
      await fetchTasks(); // rollback on failure
      Toast.fire({
        icon: "error",
        title: error.response?.data?.error || "Failed to update task priority",
      });
    }
  };

  const reorderTasks = async (updates) => {
    const updateMap = new Map(updates.map((u) => [u._id, u]));

    // Optimistic update: position only
    setTasks((prev) =>
      prev.map((t) => {
        const upd = updateMap.get(t._id);
        return upd ? { ...t, position: upd.position } : t;
      }),
    );

    try {
      await api.patch("/api/tasks/batch/reorder", { updates });
    } catch (error) {
      await fetchTasks();
      Toast.fire({
        icon: "error",
        title: "Failed to reorder tasks",
      });
    }
  };

  const createTask = async (formData, options = {}) => {
    setSubmitting(true);
    try {
      const payload = isFormData(formData)
        ? formData
        : buildTaskPayload(formData);

      const config = isFormData(formData) ? {} : {};

      const { data } = await api.post("/api/tasks", payload, config);
      setTasks((prev) => [data, ...prev]);

      !options.silent &&
        Toast.fire({ icon: "success", title: "Task created successfully" });

      return data;
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to create task",
      });
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const updateTask = async (taskId, formData) => {
    setSubmitting(true);
    try {
      const payload = isFormData(formData)
        ? formData
        : buildTaskPayload(formData, { includeStatus: true });

      const config = isFormData(formData) ? {} : {};

      const { data } = await api.patch(`/api/tasks/${taskId}`, payload, config);

      const updatedTask = data.task || data;

      if (updatedTask?._id) {
        setTasks((prev) => {
          const nextTasks = prev.map((t) => (t._id === taskId ? updatedTask : t));
          return nextTasks;
        });
      } else {
        await fetchTasks();
      }

      Toast.fire({
        icon: "success",
        title: data.leadUpdated
          ? "Task updated • Lead marked as Contacted"
          : "Task updated successfully",
      });

      return updatedTask;
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to update task",
      });
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTask = async (taskId) => {
    const confirm = await Swal.fire({
      title: "Delete this task?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
    });

    if (!confirm.isConfirmed) return false;

    try {
      await api.delete(`/api/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      Toast.fire({ icon: "success", title: "Task deleted successfully" });
      return true;
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to delete task",
      });
      return false;
    }
  };

  return {
    tasks,
    columns,
    loading,
    submitting,
    fetchTasks,
    updateTaskStatus,
    updateTaskPriority,
    reorderTasks,
    createTask,
    updateTask,
    deleteTask,
    STATUSES,
  };
}