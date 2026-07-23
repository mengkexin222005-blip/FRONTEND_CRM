import { useState, useCallback } from "react";
import { formatDateInput } from "../../../utils/date";
import { useActivities } from "../../../hooks/useActivities";

const EMPTY_FORM = {
  subject: "",
  description: "",
  taskType: "Call",
  priority: "Low",
  scope: "Personal",
  dueDate: "",
  dueTime: "",
  link: "",
  reminderAt: "",
  repeat: "None",
  assignedTo: "",
  relatedToType: "",
  relatedTo: "",
};

const mapTaskToForm = (task) => ({
  subject: task.subject || "",
  description: task.description || "",
  taskType: task.taskType || "Call",
  priority: task.priority || "Low",
  scope: task.scope || "Personal",
  dueDate: formatDateInput(task.dueDate),
  dueTime: task.dueTime || task.time || "",
  link: task.link || "",
  repeat: task.repeat || "None",
  assignedTo:
    typeof task.assignedTo === "object"
      ? task.assignedTo?._id || ""
      : task.assignedTo || "",
  relatedToType: task.relatedToType || "",
  relatedTo:
    typeof task.relatedTo === "object"
      ? task.relatedTo?._id || ""
      : task.relatedTo || "",
});

export function useTaskModal() {
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create"); // "create" | "view" | "edit"
  const [origin, setOrigin] = useState("view");
  const [activeTab, setActiveTab] = useState("Overview");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [viewingTask, setViewingTask] = useState(null);

  const { activities, loading: activitiesLoading } = useActivities(
    modalOpen && mode === "view" && viewingTask ? "Task" : null,
    viewingTask?._id,
  );

  const openCreate = useCallback((presetStatus) => {
    setFormData({
      ...EMPTY_FORM,
      status: presetStatus || "Pending",
    });
    setViewingTask(null);
    setMode("create");
    setModalOpen(true);
  }, []);

  const openView = useCallback((task) => {
    setViewingTask(task);
    setFormData(mapTaskToForm(task));
    setMode("view");
    setOrigin("view");
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((task) => {
    setViewingTask(task);
    setFormData(mapTaskToForm(task));
    setMode("edit");
    setOrigin("direct");
    setModalOpen(true);
  }, []);

  const switchToEdit = useCallback(() => {
    setMode("edit");
    setOrigin("view");
  }, []);

  const switchToView = useCallback(() => {
    if (viewingTask) {
      setFormData(mapTaskToForm(viewingTask));
    }
    setMode("view");
  }, [viewingTask]);

  const closeModal = useCallback(() => {
    setActiveTab("Overview");
    setModalOpen(false);
    setViewingTask(null);
    setMode("create");
    setFormData(EMPTY_FORM);
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSelectChange = useCallback((name, value) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "relatedToType") {
        next.relatedTo = "";
      }
      return next;
    });
  }, []);

  return {
    modalOpen,
    mode,
    origin,
    activeTab,
    setActiveTab,
    formData,
    viewingTask,
    activities,
    activitiesLoading,
    openCreate,
    openView,
    openEdit,
    switchToEdit,
    switchToView,
    closeModal,
    handleChange,
    handleSelectChange,
  };
}