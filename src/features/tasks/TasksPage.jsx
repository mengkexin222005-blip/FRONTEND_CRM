import { useState, useMemo, useCallback, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import Select from "react-select";

import {
  PageBase,
  PageHeader,
  PageToolbar,
  PageContentState,
} from "../../components/page";

import FilterPopover from "../../components/filters/FilterPopover";
import { useFilterPopover } from "../../components/filters/useFilterPopover";
import { getSelectProps } from "../../components/select/selectConfig";

import { getDisplayName } from "../../utils/name";
import { getDynamicTaskStatus } from "../dashboard/hooks/useDashboard";

import { usePermissions } from "../../permissions/usePermissions";
import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../hooks/useTasks";
import { useTaskModal } from "./hooks/useTaskModal";
import { useUsers } from "../users/hooks/useUsers";
import { useLeads } from "../leads/hooks/useLeads";
import { useClients } from "../clients/hooks/useClients";
import { useQuotations } from "../quotations/hooks/useQuotations";
import { canViewTask } from "./utils/taskPermissions";

import TaskKanban from "./TaskKanban";
import TaskTable from "./TaskTable";
import TaskModal from "./TaskModal";

// Added "Due Soon" to match dashboard statuses
const TASK_STATUSES = ["Pending", "Ongoing", "Due Soon", "Completed", "Overdue"];

const TASK_STATUS_OPTIONS = TASK_STATUSES.map((status) => ({
  label: status,
  value: status,
}));

const PRIORITY_OPTIONS = ["Low", "Medium", "High"].map((priority) => ({
  label: priority,
  value: priority,
}));

const RELATED_TYPE_OPTIONS = ["Lead", "Client", "Quotation"].map((type) => ({
  label: type,
  value: type,
}));

const SCOPE_OPTIONS = ["Personal", "Assigned"].map((scope) => ({
  label: scope,
  value: scope,
}));

const normalizeTaskStatus = (task) => {
  return getDynamicTaskStatus(task);
};

export default function TasksPage() {
  const permissions = usePermissions("tasks");
  const { user: currentUser } = useAuth();
  const isCurrentAgent = currentUser?.role === "Sales Agent";
  const location = useLocation();

  const {
    tasks = [],
    loading,
    submitting,
    reorderTasks,
    updateTaskStatus,
    updateTaskPriority,
    createTask,
    updateTask,
    deleteTask,
  } = useTasks();

  const {
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
  } = useTaskModal();

  useEffect(() => {
    if (location.state?.openCreate) {
      openCreate("Pending");
      window.history.replaceState({}, "");
    }
  }, [location.state, openCreate]);

  const { users: assignableUsers = [] } = useUsers({
    skip: !permissions.canAssign,
    mode: "assignable",
    resource: "task",
  });

  const { leads = [] } = useLeads();
  const { clients = [] } = useClients();
  const { quotations = [] } = useQuotations();

  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState(null);
  const [filterResponsible, setFilterResponsible] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterRelatedType, setFilterRelatedType] = useState(null);
  const [filterScope, setFilterScope] = useState(null);

  const clearAllFilters = useCallback(() => {
    setFilterPriority(null);
    setFilterResponsible(null);
    setFilterStatus(null);
    setFilterRelatedType(null);
    setFilterScope(null);
  }, []);

  const {
    filterOpen,
    setFilterOpen,
    filterRef,
    activeFilterCount,
    clearAllFilters: handleClear,
  } = useFilterPopover(
    {
      filterPriority,
      filterResponsible,
      filterStatus,
      filterRelatedType,
      filterScope,
    },
    clearAllFilters,
  );

  const matchesTaskFilters = useCallback(
    (task) => {
      const query = search.trim().toLowerCase();
      const normalizedStatus = normalizeTaskStatus(task);

      const assigneeName = task.assignedTo
        ? getDisplayName(task.assignedTo, {
            includeMiddleInitial: true,
            includeSuffix: true,
          }).toLowerCase()
        : "";

      const matchesSearch =
        !query ||
        task.subject?.toLowerCase().includes(query) ||
        normalizedStatus.toLowerCase().includes(query) ||
        task.priority?.toLowerCase().includes(query) ||
        assigneeName.includes(query);

      const matchesPriority =
        !filterPriority || task.priority === filterPriority;

      const matchesResponsible =
        !filterResponsible || task.assignedTo?._id === filterResponsible;

      const matchesStatus = !filterStatus || normalizedStatus === filterStatus;

      const matchesRelatedType =
        !filterRelatedType || task.relatedToType === filterRelatedType;

      const matchesScope = !filterScope || task.scope === filterScope;

      return (
        matchesSearch &&
        matchesPriority &&
        matchesResponsible &&
        matchesStatus &&
        matchesRelatedType &&
        matchesScope
      );
    },
    [
      search,
      filterPriority,
      filterResponsible,
      filterStatus,
      filterRelatedType,
      filterScope,
    ],
  );

  const agentFilterOptions = useMemo(() => {
    const uniqueAgents = new Map();

    tasks.forEach((task) => {
      if (task.assignedTo) {
        uniqueAgents.set(task.assignedTo._id, task.assignedTo);
      }
    });

    return Array.from(uniqueAgents.values()).map((user) => ({
      label: getDisplayName(user, {
        includeMiddleInitial: true,
        includeSuffix: true,
      }),
      value: user._id,
    }));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => canViewTask(task, currentUser))
      .filter(matchesTaskFilters)
      .map((task) => ({
        ...task,
        status: normalizeTaskStatus(task),
      }));
  }, [tasks, currentUser, matchesTaskFilters]);

  const filteredColumns = useMemo(() => {
    return TASK_STATUSES.reduce((grouped, status) => {
      grouped[status] = filteredTasks.filter(
        (task) => normalizeTaskStatus(task) === status,
      );

      return grouped;
    }, {});
  }, [filteredTasks]);

  const handleOpenCreate = (status = "Pending") => {
    openCreate(status);
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    const sourceStatus = source.droppableId;
    const destinationStatus = destination.droppableId;

    const isSameColumn = destinationStatus === sourceStatus;
    const isSamePosition = destination.index === source.index;

    if (isSameColumn && isSamePosition) return;

    if (isSameColumn) {
      const column = [...(filteredColumns[sourceStatus] || [])];

      const [moved] = column.splice(source.index, 1);
      if (!moved) return;

      column.splice(destination.index, 0, moved);

      const updates = column.map((task, index) => ({
        _id: task._id,
        status: sourceStatus,
        position: index,
      }));

      await reorderTasks(updates);
      return;
    }

    const sourceColumn = [...(filteredColumns[sourceStatus] || [])];
    const destinationColumn = [...(filteredColumns[destinationStatus] || [])];

    const [moved] = sourceColumn.splice(source.index, 1);
    if (!moved) return;

    destinationColumn.splice(destination.index, 0, {
      ...moved,
      status: destinationStatus,
    });

    const updates = [
      ...sourceColumn.map((task, index) => ({
        _id: task._id,
        status: sourceStatus,
        position: index,
      })),
      ...destinationColumn.map((task, index) => ({
        _id: task._id,
        status: destinationStatus,
        position: index,
      })),
    ];

    await updateTaskStatus(
      draggableId,
      destinationStatus,
      destination.index,
      updates,
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Construct FormData object to correctly transmit text inputs, links, linkName, and files
    const data = new FormData();
    data.append("subject", formData.subject || "");
    data.append("description", formData.description || "");
    data.append("taskType", formData.taskType || "Call");
    data.append("priority", formData.priority || "Low");
    data.append("status", normalizeTaskStatus(formData.status));
    data.append("scope", formData.scope || "Personal");
    data.append("dueDate", formData.dueDate || "");
    data.append("dueTime", formData.dueTime || "");
    data.append("link", formData.link || "");
    data.append("linkName", formData.linkName || "");
    data.append("repeat", formData.repeat || "None");

    // During editing, send empty values too so the backend can clear old
    // assignee/relationship values instead of silently retaining them.
    if (mode === "edit") {
      data.append(
        "assignedTo",
        formData.scope === "Personal" ? "" : formData.assignedTo || "",
      );
      data.append("relatedToType", formData.relatedToType || "");
      data.append("relatedTo", formData.relatedTo || "");
    } else {
      if (formData.scope !== "Personal" && formData.assignedTo) {
        data.append("assignedTo", formData.assignedTo);
      }
      if (formData.relatedToType) {
        data.append("relatedToType", formData.relatedToType);
      }
      if (formData.relatedTo) {
        data.append("relatedTo", formData.relatedTo);
      }
    }

    // Safely append files or retain existing attachments
    if (formData.attachments && formData.attachments.length > 0) {
      formData.attachments.forEach((file) => {
        if (file instanceof File) {
          data.append("attachments", file);
        } else if (typeof file === "string") {
          data.append("existingAttachments", file);
        } else if (file?.url) {
          data.append("existingAttachments", file.url);
        } else if (file?.path) {
          data.append("existingAttachments", file.path);
        }
      });
    }

    try {
      if (mode === "create") {
        const created = await createTask(data);

        if (created) {
          closeModal();
        }
      } else if (mode === "edit" && viewingTask?._id) {
        const updated = await updateTask(viewingTask._id, data);

        if (updated) {
          await Promise.resolve();
          if (origin === "view") {
            openView(updated);
          } else {
            closeModal();
          }
        }
      }
    } catch (error) {
      console.error("Failed to save task:", error);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    return updateTaskStatus(taskId, normalizeTaskStatus(newStatus), 0);
  };

  const handleUpdatePriority = async (taskId, newPriority) => {
    return updateTaskPriority(taskId, newPriority);
  };

  const handleDelete = async (taskId) => {
    const deleted = await deleteTask(taskId);

    if (deleted) {
      closeModal();
    }
  };

  return (
    <PageBase>
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <PageHeader
          title="Tasks"
          subtitle={
            isCurrentAgent
              ? "Organize and track your assigned tasks and follow-ups"
              : "View and manage tasks across your team"
          }
        />

        <PageToolbar
          searchValue={search}
          onSearchChange={(event) => setSearch(event.target.value)}
          searchPlaceholder="Search tasks..."
          view={view}
          onViewChange={setView}
          filterSlot={
            <FilterPopover
              filterRef={filterRef}
              filterOpen={filterOpen}
              onToggle={() => setFilterOpen((previous) => !previous)}
              activeFilterCount={activeFilterCount}
              onClearAll={handleClear}
            >
              <div>
                <p className="text-xs text-gray-400 mb-1">Related Type</p>
                <Select
                  {...getSelectProps({ variant: "filter" })}
                  placeholder="All types"
                  options={RELATED_TYPE_OPTIONS}
                  value={
                    RELATED_TYPE_OPTIONS.find(
                      (option) => option.value === filterRelatedType,
                    ) || null
                  }
                  onChange={(option) =>
                    setFilterRelatedType(option?.value || null)
                  }
                />
              </div>

              {!isCurrentAgent && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Responsible</p>
                  <Select
                    {...getSelectProps({ variant: "filter" })}
                    placeholder="All responsibles"
                    options={agentFilterOptions}
                    value={
                      agentFilterOptions.find(
                        (option) => option.value === filterResponsible,
                      ) || null
                    }
                    onChange={(option) =>
                      setFilterResponsible(option?.value || null)
                    }
                    isSearchable
                  />
                </div>
              )}

              <div>
                <p className="text-xs text-gray-400 mb-1">Priority</p>
                <Select
                  {...getSelectProps({ variant: "filter" })}
                  placeholder="All priorities"
                  options={PRIORITY_OPTIONS}
                  value={
                    PRIORITY_OPTIONS.find(
                      (option) => option.value === filterPriority,
                    ) || null
                  }
                  onChange={(option) =>
                    setFilterPriority(option?.value || null)
                  }
                />
              </div>

              {view === "table" && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <Select
                    {...getSelectProps({ variant: "filter" })}
                    placeholder="All statuses"
                    options={TASK_STATUS_OPTIONS}
                    value={
                      TASK_STATUS_OPTIONS.find(
                        (option) => option.value === filterStatus,
                      ) || null
                    }
                    onChange={(option) =>
                      setFilterStatus(option?.value || null)
                    }
                  />
                </div>
              )}

              <div>
                <p className="text-xs text-gray-400 mb-1">Scope</p>
                <Select
                  {...getSelectProps({ variant: "filter" })}
                  placeholder="All scopes"
                  options={SCOPE_OPTIONS}
                  value={
                    SCOPE_OPTIONS.find(
                      (option) => option.value === filterScope,
                    ) || null
                  }
                  onChange={(option) => setFilterScope(option?.value || null)}
                />
              </div>
            </FilterPopover>
          }
          actionButton={
            permissions.canCreate && (
              <button
                type="button"
                onClick={() => handleOpenCreate("Pending")}
                className="w-full rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600 cursor-pointer sm:w-auto"
              >
                <span className="flex items-center gap-2 text-sm">
                  <FaPlus size={11} />
                  Add Task
                </span>
              </button>
            )
          }
        />
      </div>

      <PageContentState>
        {view === "kanban" ? (
          <TaskKanban
            columns={filteredColumns}
            statuses={TASK_STATUSES}
            permissions={permissions}
            onDragEnd={handleDragEnd}
            onAddTask={(status) => handleOpenCreate(status)}
            onCardClick={(task) => openView(task)}
            onEdit={(task) => openEdit(task)}
            onUpdateStatus={handleUpdateStatus}
            onUpdatePriority={handleUpdatePriority}
            isLoading={loading}
          />
        ) : (
          <TaskTable
            tasks={filteredTasks}
            permissions={permissions}
            onView={(task) => openView(task)}
            onEdit={(task) => openEdit(task)}
            onUpdateStatus={handleUpdateStatus}
            onUpdatePriority={handleUpdatePriority}
            isLoading={loading}
          />
        )}
      </PageContentState>

      <TaskModal
        open={modalOpen}
        mode={mode}
        origin={origin}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        formData={formData}
        viewingTask={viewingTask}
        activities={activities}
        activitiesLoading={activitiesLoading}
        currentUser={currentUser}
        assignableUsers={assignableUsers}
        leads={leads}
        clients={clients}
        quotations={quotations}
        permissions={permissions}
        loading={submitting}
        onChange={handleChange}
        onSelectChange={handleSelectChange}
        onFileChange={handleFileChange}
        onRemoveFile={handleRemoveFile}
        onSwitchToEdit={switchToEdit}
        onSwitchToView={switchToView}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        onClose={closeModal}
      />
    </PageBase>
  );
}
