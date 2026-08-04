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
  linkName: "", // Added to reset linkName on new task creation
  reminderAt: "",
  repeat: "None",
  assignedTo: "",
  relatedToType: "",
  relatedTo: "",
  attachments: [],
};

const mapTaskToForm = (task) => ({
  subject: task.subject || "",
  description: task.description || "",
  taskType: task.taskType || "Call",
  priority: task.priority || "Low",
  scope: task.scope || "Personal",
  dueDate: formatDateInput(task.dueDate),
  // Slice ensures time is properly formatted to HH:mm for the input field
  dueTime: task.dueTime ? task.dueTime.slice(0, 5) : task.time ? task.time.slice(0, 5) : "",
  link: task.link || "",
  linkName: task.linkName || "", // Added to map existing linkName when editing/viewing
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
  attachments: task.attachments || task.files || [],
});

export function useTaskModal() {
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
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

  const handleFileChange = useCallback((files) => {
    const newFiles = Array.from(files);
    setFormData((prev) => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...newFiles],
    }));
  }, []);

  const handleRemoveFile = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index),
    }));
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
    handleFileChange,
    handleRemoveFile,
  };
}
