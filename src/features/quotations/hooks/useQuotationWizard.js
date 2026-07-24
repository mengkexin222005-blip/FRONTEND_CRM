import { useState, useCallback, useEffect } from "react";
import { useActivities } from "../../../hooks/useActivities";
import api from "../../../services/api";

const EMPTY_FORM = {
  title: "",
  client: "",
  value: "",
  currency: "PHP",
  stage: "Draft",
  expectedCloseDate: "",
  assignedTo: "",
  notes: "",
};

const mapQuotationToForm = (quotation) => ({
  title: quotation.title || "",
  client: quotation.client?._id || "",
  value: quotation.value ?? "",
  currency: quotation.currency || "PHP",
  expectedCloseDate: quotation.expectedCloseDate
    ? quotation.expectedCloseDate.slice(0, 10)
    : "",
  assignedTo: quotation.assignedTo?._id || "",
  notes: quotation.notes || "",
});

export function useQuotationWizard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [origin, setOrigin] = useState("view");
  const [activeTab, setActiveTab] = useState("Overview");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [viewingQuotation, setViewingQuotation] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  useEffect(() => {
    if (!modalOpen || mode !== "view" || !viewingQuotation?._id) {
      setTasks([]);
      return;
    }

    let cancelled = false;

    const fetchTasks = async () => {
      setTasksLoading(true);
      try {
        const { data } = await api.get(`/api/quotations/${viewingQuotation._id}/tasks`);
        if (!cancelled) setTasks(data);
      } catch (error) {
        console.error("Error fetching quotation tasks:", error);
      } finally {
        if (!cancelled) setTasksLoading(false);
      }
    };

    fetchTasks();

    return () => {
      cancelled = true;
    };
  }, [modalOpen, mode, viewingQuotation?._id]);

  const { activities, loading: activitiesLoading } = useActivities(
    modalOpen && mode === "view" && viewingQuotation ? "Quotation" : null,
    viewingQuotation?._id,
  );

  const openCreate = useCallback((presetStage) => {
    const stage = typeof presetStage === "object" ? presetStage?.stage || "Draft" : presetStage || "Draft";
    setFormData({
      ...EMPTY_FORM,
      stage,
    });
    setViewingQuotation(null);
    setMode("create");
    setModalOpen(true);
  }, []);

  const openView = useCallback((quotation) => {
    setViewingQuotation(quotation);
    setFormData(mapQuotationToForm(quotation));
    setMode("view");
    setOrigin("view");
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((quotation) => {
    setViewingQuotation(quotation);
    setFormData(mapQuotationToForm(quotation));
    setMode("edit");
    setOrigin("direct");
    setModalOpen(true);
  }, []);

  const switchToEdit = useCallback(() => {
    setMode("edit");
    setOrigin("view");
  }, []);

  const switchToView = useCallback(() => {
    if (viewingQuotation) {
      setFormData(mapQuotationToForm(viewingQuotation));
    }
    setMode("view");
  }, [viewingQuotation]);

  const closeModal = useCallback(() => {
    setActiveTab("Overview");
    setModalOpen(false);
    setViewingQuotation(null);
    setMode("create");
    setFormData(EMPTY_FORM);
    setTasks([]);
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSelectChange = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  return {
    modalOpen,
    mode,
    origin,
    activeTab,
    setActiveTab,
    formData,
    viewingQuotation,
    activities,
    activitiesLoading,
    tasks,
    tasksLoading,
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