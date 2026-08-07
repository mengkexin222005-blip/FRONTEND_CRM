import { useState, useRef, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { Filter } from "lucide-react";
import Select from "react-select";

import {
  PageBase,
  PageHeader,
  PageToolbar,
  PageContentState,
} from "../../../components/page";
import { FormLabel } from "../../../components/form/FormField";
import { getSelectProps } from "../../../components/select/selectConfig";

import CallsTable from "./CallsTable";
import CallsKanban from "./CallsKanban";
import CallsModal from "./CallsModal";

import useCalls from "../hooks/useCalls";
import { useActivities } from "../../../hooks/useActivities";

const initialFormData = {
  companyName: "",
  contactPerson: "",
  contactMethod: "Mobile",
  contactValue: "",
  callType: "Follow-up Call",
  priority: "Medium",
  status: "Scheduled",
  scheduledAt: "",
  completedAt: "",
  notes: "",
  assignedTo: "",
};

const CALL_TYPES = [
  "Follow-up Call",
  "Initial Client Contact",
  "Sales Discussion",
  "Others",
];

const STATUSES = ["Scheduled", "Completed", "Cancelled", "Missed"];

const safeToDatetimeLocal = (dateVal) => {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (Number.isNaN(d.getTime())) return "";
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  } catch {
    return "";
  }
};

export default function CallsPage() {
  const {
    calls = [],
    loading = false,
    addCall,
    editCall,
    removeCall,
    updateCallStatus,
    assignableUsers = [],
  } = useCalls();

  const [viewMode, setViewMode] = useState("table");
  const [search, setSearch] = useState("");

  // Filter Popover State
  const [showFilters, setShowFilters] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterCallType, setFilterCallType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filterRef = useRef(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [modalOrigin, setModalOrigin] = useState("view");

  const [viewingCall, setViewingCall] = useState(null);
  const [editingCall, setEditingCall] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const { activities, loading: activitiesLoading } = useActivities(
    modalOpen && modalMode === "view" && viewingCall ? "Call" : null,
    viewingCall?._id,
  );

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const safeCalls = Array.isArray(calls) ? calls : [];

  // Filter Logic
  const filteredCalls = safeCalls.filter((call) => {
    if (!call) return false;

    // Search filter
    const query = search.trim().toLowerCase();
    if (query) {
      const matchesSearch =
        call.contactPerson?.toLowerCase().includes(query) ||
        call.companyName?.toLowerCase().includes(query) ||
        call.callType?.toLowerCase().includes(query) ||
        call.status?.toLowerCase().includes(query) ||
        call.contactValue?.toLowerCase().includes(query);

      if (!matchesSearch) return false;
    }

    // Date filter
    if (filterDate && call.scheduledAt) {
      const callDateStr = new Date(call.scheduledAt).toISOString().split("T")[0];
      if (callDateStr !== filterDate) return false;
    }

    // Call Type filter
    if (filterCallType !== "all" && call.callType !== filterCallType) {
      return false;
    }

    // Status filter
    if (filterStatus !== "all" && call.status !== filterStatus) {
      return false;
    }

    return true;
  });

  const populateFormData = (call) => {
    if (!call) {
      setFormData(initialFormData);
      return;
    }
    try {
      setFormData({
        companyName: call.companyName || "",
        contactPerson: call.contactPerson || "",
        contactMethod: call.contactMethod || "Mobile",
        contactValue:
          call.contactValue || call.phone || call.WhatsApp || call.Viber || "",
        callType: call.callType || "Follow-up Call",
        priority: call.priority || "Medium",
        status: call.status || "Scheduled",
        scheduledAt: safeToDatetimeLocal(call.scheduledAt),
        completedAt: call.completedAt ? safeToDatetimeLocal(call.completedAt) : "",
        notes: call.notes || "",
        assignedTo: call.assignedTo?._id || call.assignedTo || "",
      });
    } catch (err) {
      console.error("Failed to populate form data:", err);
      setFormData(initialFormData);
    }
  };

  const handleCreate = () => {
    setViewingCall(null);
    setEditingCall(null);
    setFormData(initialFormData);
    setModalMode("create");
    setModalOrigin("create");
    setModalOpen(true);
  };

  const handleView = (callOrId) => {
    const callObj =
      typeof callOrId === "string" || typeof callOrId === "number"
        ? safeCalls.find((c) => String(c._id) === String(callOrId))
        : callOrId;

    if (!callObj) return;

    setViewingCall(callObj);
    setEditingCall(null);
    populateFormData(callObj);
    setModalMode("view");
    setModalOrigin("view");
    setModalOpen(true);
  };

  const handleEdit = (callOrId) => {
    const callObj =
      typeof callOrId === "string" || typeof callOrId === "number"
        ? safeCalls.find((c) => String(c._id) === String(callOrId))
        : callOrId;

    if (!callObj) return;

    setViewingCall(callObj);
    setEditingCall(callObj);
    populateFormData(callObj);
    setModalMode("edit");
    setModalOrigin("create");
    setModalOpen(true);
  };

  const handleSwitchToEdit = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (viewingCall) {
      handleEdit(viewingCall);
    }
  };

  const handleSwitchToView = () => {
    setModalMode("view");
  };

  const handleClose = () => {
    setModalOpen(false);
    setViewingCall(null);
    setEditingCall(null);
    setFormData(initialFormData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "contactMethod") {
        updated.contactValue = "";
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }

    try {
      const payload = {
        ...formData,
        phone: formData.contactMethod === "Mobile" ? formData.contactValue : "",
        WhatsApp:
          formData.contactMethod === "WhatsApp" ? formData.contactValue : "",
        Viber: formData.contactMethod === "Viber" ? formData.contactValue : "",
        scheduledAt: formData.scheduledAt || editingCall?.scheduledAt || null,
        completedAt:
          formData.status === "Completed"
            ? formData.completedAt || editingCall?.completedAt || new Date().toISOString()
            : null,
      };

      const success = editingCall
        ? await editCall?.(editingCall._id, payload)
        : await addCall?.(payload);

      if (success) {
        handleClose();
      }
    } catch (err) {
      console.error("Error submitting call form:", err);
    }
  };

  const selectProps = getSelectProps ? getSelectProps({ isSearchable: false }) : {};

  const callTypeFilterOptions = [
    { label: "All call types", value: "all" },
    ...CALL_TYPES.map((t) => ({ label: t, value: t })),
  ];

  const statusFilterOptions = [
    { label: "All statuses", value: "all" },
    ...STATUSES.map((s) => ({ label: s, value: s })),
  ];

  return (
    <PageBase>
      <div className="mb-4 flex items-center justify-between">
        <PageHeader
          title="Calls"
          subtitle="Manage client calls and schedules."
        />

        <PageToolbar
          searchValue={search}
          onSearchChange={(event) => setSearch(event.target.value)}
          searchPlaceholder="Search calls..."
          view={viewMode}
          onViewChange={setViewMode}
          filterSlot={
            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Filter size={15} />
                Filter
              </button>

              {/* Floating Filter Popover */}
              {showFilters && (
                <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-gray-100 bg-white p-4 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-900">Filters</p>
                    <button
                      type="button"
                      onClick={() => {
                        setFilterDate("");
                        setFilterCallType("all");
                        setFilterStatus("all");
                      }}
                      className="text-xs text-red-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Date */}
                    <div>
                      <FormLabel>Date</FormLabel>
                      <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      />
                    </div>

                    {/* Call Type */}
                    <div>
                      <FormLabel>Call Type</FormLabel>
                      <Select
                        {...selectProps}
                        options={callTypeFilterOptions}
                        value={
                          callTypeFilterOptions.find(
                            (o) => o.value === filterCallType
                          ) || callTypeFilterOptions[0]
                        }
                        onChange={(opt) => setFilterCallType(opt?.value || "all")}
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <FormLabel>Status</FormLabel>
                      <Select
                        {...selectProps}
                        options={statusFilterOptions}
                        value={
                          statusFilterOptions.find(
                            (o) => o.value === filterStatus
                          ) || statusFilterOptions[0]
                        }
                        onChange={(opt) => setFilterStatus(opt?.value || "all")}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          }
          actionButton={
            <button
              type="button"
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-md bg-red-500 px-5 py-2 text-sm font-medium text-white hover:bg-red-600 cursor-pointer"
            >
              <FaPlus size={11} />
              Add Call
            </button>
          }
        />
      </div>

      <PageContentState loading={loading}>
        {viewMode === "table" ? (
          <CallsTable
            calls={filteredCalls}
            loading={loading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={removeCall}
            onStatusChange={updateCallStatus}
          />
        ) : (
          <CallsKanban
            calls={filteredCalls}
            loading={loading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={removeCall}
          />
        )}
      </PageContentState>

      {/* Drawer Component */}
      <CallsModal
        open={modalOpen}
        mode={modalMode}
        origin={modalOrigin}
        formData={formData}
        call={viewingCall}
        activities={activities}
        activitiesLoading={activitiesLoading}
        assignableUsers={assignableUsers}
        loading={loading}
        onChange={handleChange}
        onSelectChange={handleSelectChange}
        onSwitchToEdit={handleSwitchToEdit}
        onSwitchToView={handleSwitchToView}
        onSubmit={handleSubmit}
        onDelete={async (id) => {
          const success = await removeCall?.(id);
          if (success) handleClose();
        }}
        onClose={handleClose}
      />
    </PageBase>
  );
}