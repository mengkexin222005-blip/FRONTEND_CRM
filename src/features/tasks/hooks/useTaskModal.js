import { useState, useCallback } from "react";
import { formatDateInput } from "../../../utils/date";
import { useActivities } from "../../../hooks/useActivities";

const EMPTY_FORM = {
  subject: "",
  description: "",
  taskType: "Call",
  priority: "Low",
  status: "Pending",
  scope: "Personal",
  dueDate: "",
  dueTime: "",
  link: "",
  linkName: "",
  links: [],
  reminderAt: "",
  repeat: "None",
  assignedTo: "",
  relatedToType: "",
  relatedTo: "",
  attachments: [],
};

const getTaskAttachments = (task) => {
  const files =
    task?.attachments ??
    task?.files ??
    task?.documents ??
    task?.file ??
    [];

  if (Array.isArray(files)) {
    return files;
  }

  return files ? [files] : [];
};

const getTaskLinks = (task) => {
  const links = task?.links;

  if (Array.isArray(links)) return links;
  if (typeof links === "string") {
    try {
      const parsedLinks = JSON.parse(links);
      return Array.isArray(parsedLinks) ? parsedLinks : [parsedLinks];
    } catch {
      return [];
    }
  }

  return [];
};

const mapTaskToForm = (task = {}) => ({
  subject: task.subject || "",
  description: task.description || "",
  taskType: task.taskType || "Call",
  priority: task.priority || "Low",
  status: task.status || "Pending",
  scope: task.scope || "Personal",
  dueDate: formatDateInput(task.dueDate),
  dueTime: task.dueTime || task.time || "",
  link: task.link || "",
  linkName: task.linkName || task.link_name || "",
  links: getTaskLinks(task).length
    ? getTaskLinks(task).filter((link) => link?.url || link?.link)
    : task.link
      ? [{ name: task.linkName || task.link_name || "", url: task.link }]
      : [],
  reminderAt: task.reminderAt || "",
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

  attachments: getTaskAttachments(task),
});
  export function useTaskModal() {
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [origin, setOrigin] = useState("view");
  const [activeTab, setActiveTab] = useState("Overview");
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [viewingTask, setViewingTask] = useState(null);

  const { activities, loading: activitiesLoading } = useActivities(
    modalOpen && mode === "view" && viewingTask ? "Task" : null,
    viewingTask?._id,
  );

  const openCreate = useCallback((presetStatus = "Pending") => {
    setFormData({
      ...EMPTY_FORM,
      status: presetStatus,
    });

    setViewingTask(null);
    setMode("create");
    setOrigin("direct");
    setActiveTab("Overview");
    setModalOpen(true);
  }, []);

  const openView = useCallback((task) => {
    if (!task) return;

    setViewingTask(task);
    setFormData(mapTaskToForm(task));
    setMode("view");
    setOrigin("view");
    setActiveTab("Overview");
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((task) => {
    if (!task) return;

    setViewingTask(task);
    setFormData(mapTaskToForm(task));
    setMode("edit");
    setOrigin("direct");
    setActiveTab("Overview");
    setModalOpen(true);
  }, []);

  const switchToEdit = useCallback(() => {
    if (!viewingTask) return;

    setFormData(mapTaskToForm(viewingTask));
    setMode("edit");
    setOrigin("view");
  }, [viewingTask]);

  const switchToView = useCallback(() => {
    if (viewingTask) {
      setFormData(mapTaskToForm(viewingTask));
    }

    setMode("view");
  }, [viewingTask]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setMode("create");
    setOrigin("view");
    setActiveTab("Overview");
    setViewingTask(null);
    setFormData({ ...EMPTY_FORM });
  }, []);

    const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => {
      const nextFormData = {
        ...previous,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "scope" && value === "Personal") {
        nextFormData.assignedTo = "";
      }

      return nextFormData;
    });
  }, []);

  const handleSelectChange = useCallback((name, value) => {
    setFormData((previous) => {
      const nextFormData = {
        ...previous,
        [name]: value,
      };

      if (name === "relatedToType") {
        nextFormData.relatedTo = "";
      }

      if (name === "scope" && value === "Personal") {
        nextFormData.assignedTo = "";
      }

      return nextFormData;
    });
  }, []);

  const handleFileChange = useCallback((files) => {
    if (!files) return;

    const fileArray = Array.isArray(files)
      ? files
      : Array.from(files);

    setFormData((previous) => ({
      ...previous,
      attachments: [
        ...(previous.attachments || []),
        ...fileArray.filter(Boolean),
      ],
    }));
  }, []);

  const handleRemoveFile = useCallback((index) => {
    setFormData((previous) => ({
      ...previous,
      attachments: (previous.attachments || []).filter(
        (_, fileIndex) => fileIndex !== index,
      ),
    }));
  }, []);

  const handleAddLink = useCallback(() => {
    setFormData((previous) => ({
      ...previous,
      links: [...(previous.links || []), { name: "", url: "" }],
    }));
  }, []);

  const handleLinkChange = useCallback((index, field, value) => {
    setFormData((previous) => ({
      ...previous,
      links: (previous.links || []).map((link, linkIndex) =>
        linkIndex === index ? { ...link, [field]: value } : link,
      ),
    }));
  }, []);

  const handleRemoveLink = useCallback((index) => {
    setFormData((previous) => ({
      ...previous,
      links: (previous.links || []).filter(
        (_, linkIndex) => linkIndex !== index,
      ),
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
    handleAddLink,
    handleLinkChange,
    handleRemoveLink,
  };
}
