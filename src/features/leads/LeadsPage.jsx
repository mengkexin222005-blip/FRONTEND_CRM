import { useState, useMemo, useRef, useCallback } from "react";
import { FaPlus } from "react-icons/fa";
import Swal from "sweetalert2";
import Select from "react-select";

import LeadActionConfirmModal from "./LeadActionConfirmModal";

import {
  PageBase,
  PageHeader,
  PageToolbar,
  PageContentState,
} from "../../components/page";

import FilterPopover from "../../components/filters/FilterPopover";
import { useFilterPopover } from "../../components/filters/useFilterPopover";
import { getSelectProps } from "../../components/select/selectConfig";

import { LEAD_SOURCE_OPTIONS } from "../../constants/options";

import { getDisplayName } from "../../utils/name";

import { usePermissions } from "../../permissions/usePermissions";
import { useLeads } from "./hooks/useLeads";
import { useLeadForm } from "./hooks/useLeadForm";
import { useUsers } from "../users/hooks/useUsers";
import { useTasks } from "../../hooks/useTasks";

import LeadTable from "./LeadTable";
import LeadKanban from "./LeadKanban";
import LeadForm from "./LeadForm";
import LeadView from "./LeadView";

const LEAD_STAGE_ORDER = ["New", "Contacted", "Qualified"];

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  width: "auto",
});

export default function LeadsPage() {
  const permissions = usePermissions("leads");

  const { users = [] } = useUsers({
    skip: !permissions.canAssign,
    mode: "assignable",
    resource: "lead",
  });

  const {
    leads = [],
    columns,
    loading,
    createLead,
    updateLead,
    updateOwnLead,
    updateLeadStatus,
    assignLead,
    approveLeadConversion,
    requestLeadConversion,
    convertLead,
    reorderLeads,
    KANBAN_STATUSES,
    STATUSES,
  } = useLeads();

  const {
    formData,
    addressCodes,
    avatar,
    preview,
    showSidePane,
    editingLead,
    handleChange,
    handleAddressSelect,
    handleAvatarChange,
    clearAvatar,
    openCreateSidePane,
    openEditSidePane,
    closeSidePane,
    followUpTask,
    handleFollowUpChange,
    buildFollowUpPayload,
  } = useLeadForm();

  const { createTask } = useTasks();

  const [viewingLead, setViewingLead] = useState(null);
  const [viewPaneOpen, setViewPaneOpen] = useState(false);
  const closeTimerRef = useRef(null);

  const [confirmAction, setConfirmAction] = useState(null);
  // { type: "lost", lead, destinationIndex }
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  const [previewColumns, setPreviewColumns] = useState(null);

  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterSource, setFilterSource] = useState(null);
  const [filterAssigned, setFilterAssigned] = useState(null);

  const clearAllFilters = useCallback(() => {
    setFilterStatus(null);
    setFilterSource(null);
    setFilterAssigned(null);
  }, []);

  const {
    filterOpen,
    setFilterOpen,
    filterRef,
    activeFilterCount,
    clearAllFilters: handleClear,
  } = useFilterPopover(
    { filterStatus, filterSource, filterAssigned },
    clearAllFilters,
  );

  const openViewPane = (lead) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setViewingLead(lead);
    setViewPaneOpen(true);
  };

  const closeViewPane = () => {
    setViewPaneOpen(false);
    closeTimerRef.current = setTimeout(() => setViewingLead(null), 300);
  };

  const syncViewingLead = (leadId, updated) => {
    if (updated && viewingLead?._id === leadId) {
      setViewingLead((prev) => ({ ...prev, ...updated }));
    }
  };

  const showWarning = (title, text) => {
    Toast.fire({ icon: "warning", title, text });
  };

  const withPositions = (items) =>
    items.map((lead, index) => ({
      ...lead,
      position: index,
    }));

  const toPositionUpdates = (items) =>
    items.map((lead, index) => ({
      _id: lead._id,
      position: index,
    }));

  const buildMovePreview = ({
    sourceCol,
    destinationCol,
    moved,
    sourceStatus,
    destinationStatus,
    sourceIndex,
    destinationIndex,
  }) => {
    const nextSourceCol = sourceCol.filter((_, index) => index !== sourceIndex);

    const nextDestinationCol = [...destinationCol];
    nextDestinationCol.splice(destinationIndex, 0, {
      ...moved,
      status: destinationStatus,
      position: destinationIndex,
    });

    return {
      nextSourceCol,
      nextDestinationCol,
      preview: {
        [sourceStatus]: withPositions(nextSourceCol),
        [destinationStatus]: withPositions(nextDestinationCol),
      },
      updates: [
        ...toPositionUpdates(nextSourceCol),
        ...toPositionUpdates(nextDestinationCol),
      ],
    };
  };

  const matchesLeadFilters = useCallback(
    (lead) => {
      const q = search.toLowerCase();

      const fullName = getDisplayName(lead, {
        includeMiddleInitial: true,
        includeSuffix: true,
      }).toLowerCase();

      const assigneeName = lead.leadAssignee
        ? getDisplayName(lead.leadAssignee, {
            includeMiddleInitial: true,
            includeSuffix: true,
          }).toLowerCase()
        : "";

      const matchesSearch =
        !q ||
        fullName.includes(q) ||
        lead.email?.toLowerCase().includes(q) ||
        lead.company?.toLowerCase().includes(q) ||
        lead.phone?.toLowerCase().includes(q) ||
        lead.leadSource?.toLowerCase().includes(q) ||
        assigneeName.includes(q);

      return (
        matchesSearch &&
        (!filterStatus || lead.status === filterStatus) &&
        (!filterSource || lead.leadSource === filterSource) &&
        (!filterAssigned || lead.leadAssignee?._id === filterAssigned)
      );
    },
    [search, filterStatus, filterSource, filterAssigned],
  );

  const agentFilterOptions = useMemo(() => {
    const uniqueAgents = new Map();

    leads.forEach((lead) => {
      if (lead.leadAssignee) {
        uniqueAgents.set(lead.leadAssignee._id, lead.leadAssignee);
      }
    });

    return Array.from(uniqueAgents.values()).map((user) => ({
      label: getDisplayName(user, { includeSuffix: true }),
      value: user._id,
    }));
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(matchesLeadFilters);
  }, [leads, matchesLeadFilters]);

  const filteredColumns = useMemo(() => {
    const filtered = {};

    for (const status of KANBAN_STATUSES) {
      filtered[status] = (columns[status] || []).filter(matchesLeadFilters);
    }

    return filtered;
  }, [columns, KANBAN_STATUSES, matchesLeadFilters]);

  const isValidLeadMove = (from, to) => {
    if (from === "Lost" || to === "Lost") return true;
    if (from === to) return true;

    const fromIndex = LEAD_STAGE_ORDER.indexOf(from);
    const toIndex = LEAD_STAGE_ORDER.indexOf(to);

    if (fromIndex === -1 || toIndex === -1) return false;
    if (toIndex < fromIndex) return true;

    return toIndex - fromIndex === 1;
  };

  const getInvalidMoveMessage = (from, to) => {
    const fromIndex = LEAD_STAGE_ORDER.indexOf(from);
    const toIndex = LEAD_STAGE_ORDER.indexOf(to);

    if (toIndex - fromIndex > 1) {
      return `Cannot skip stages. Move from ${from} to ${LEAD_STAGE_ORDER[fromIndex + 1]} first.`;
    }

    return "Invalid lead stage movement.";
  };

  const handleDragEnd = async (result) => {
    const { destination, source } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStatus = source.droppableId;
    const destinationStatus = destination.droppableId;
    const isCrossColumn = sourceStatus !== destinationStatus;

    const sourceCol = [...(columns[sourceStatus] || [])];
    const moved = sourceCol[source.index];

    if (!moved) return;

    if (sourceStatus === "Lost" && destinationStatus !== "Lost") {
      showWarning(
        "Cannot move",
        "Lost leads are final and can no longer be moved.",
      );
      return;
    }

    if (destinationStatus === "Lost" && sourceStatus !== "Lost") {
      const { preview } = buildMovePreview({
        sourceCol,
        destinationCol: columns.Lost || [],
        moved,
        sourceStatus,
        destinationStatus: "Lost",
        sourceIndex: source.index,
        destinationIndex: destination.index,
      });

      setPreviewColumns(preview);

      setConfirmAction({
        type: "lost",
        lead: moved,
        destinationIndex: destination.index,
      });

      return;
    }

    if (!isCrossColumn) {
      sourceCol.splice(source.index, 1);
      sourceCol.splice(destination.index, 0, moved);

      await reorderLeads(toPositionUpdates(sourceCol));
      return;
    }

    if (!isValidLeadMove(sourceStatus, destinationStatus)) {
      showWarning(
        "Move not allowed",
        getInvalidMoveMessage(sourceStatus, destinationStatus),
      );
      return;
    }

    const { preview } = buildMovePreview({
      sourceCol,
      destinationCol: columns[destinationStatus] || [],
      moved,
      sourceStatus,
      destinationStatus,
      sourceIndex: source.index,
      destinationIndex: destination.index,
    });

    setPreviewColumns(preview);

    const updates = [
      ...preview[sourceStatus].map((lead, idx) => ({
        _id: lead._id,
        status: sourceStatus,
        position: idx,
      })),
      ...preview[destinationStatus].map((lead, idx) => ({
        _id: lead._id,
        status: destinationStatus,
        position: idx,
      })),
    ];

    const updated = await updateLeadStatus(
      moved._id,
      destinationStatus,
      destination.index,
      updates,
    );
    if (!updated) {
      setPreviewColumns(null);
      return;
    }

    syncViewingLead(moved._id, updated);
    setPreviewColumns(null);
  };

  const cancelLeadAction = () => {
    setPreviewColumns(null);
    setConfirmAction(null);
  };

  const handleConfirmLeadAction = async () => {
    if (!confirmAction || confirmSubmitting) return;

    setConfirmSubmitting(true);

    try {
      const { lead, destinationIndex } = confirmAction;

      const updated = await updateLeadStatus(
        lead._id,
        "Lost",
        destinationIndex,
      );

      if (!updated) {
        setPreviewColumns(null);
        return;
      }

      syncViewingLead(lead._id, updated);
      setPreviewColumns(null);
      setConfirmAction(null);
    } finally {
      setConfirmSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updateFn = permissions.canAssign ? updateLead : updateOwnLead;

    const result = editingLead
      ? await updateFn(editingLead, formData, avatar)
      : await createLead(formData, avatar, { silent: true });

    if (!result) return;

    let taskCreated = false;

    if (!editingLead) {
      const taskPayload = buildFollowUpPayload(result.lead._id, formData);

      if (taskPayload) {
        const taskResult = await createTask(taskPayload, { silent: true });
        taskCreated = Boolean(taskResult);
      }
    }

    Toast.fire({
      icon: "success",
      title: taskCreated
        ? "Lead and follow-up task created successfully"
        : editingLead
          ? "Lead updated successfully"
          : "Lead created successfully",
    });

    closeSidePane();
  };

  const handleAssignLead = async (leadId, agentId) => {
    const updated = await assignLead(leadId, agentId);
    syncViewingLead(leadId, updated);
    return Boolean(updated);
  };

  const handleApproveLeadConversion = async (leadId) => {
    const updated = await approveLeadConversion(leadId);
    syncViewingLead(leadId, updated);
  };

  const handleRequestLeadConversion = async (leadId) => {
    const updated = await requestLeadConversion(leadId);
    syncViewingLead(leadId, updated);
  };

  const handleUpdateStatus = async (leadId, newStatus) => {
    const updated = await updateLeadStatus(leadId, newStatus, 0);
    syncViewingLead(leadId, updated);
    return Boolean(updated);
  };

  const handleConvertLead = async (leadId) => {
    const updated = await convertLead(leadId);
    syncViewingLead(leadId, updated);
    closeViewPane();
    return Boolean(updated);
  };

  return (
    <PageBase>
      <div className="flex items-center justify-between mb-4">
        <PageHeader
          title="Leads"
          subtitle={ "Track and manage your assigned leads across different stages"}
        />

        <PageToolbar
          searchValue={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder="Search leads..."
          view={view}
          onViewChange={setView}
          filterSlot={
            <FilterPopover
              filterRef={filterRef}
              filterOpen={filterOpen}
              onToggle={() => setFilterOpen((p) => !p)}
              activeFilterCount={activeFilterCount}
              onClearAll={handleClear}
            >
              <div>
                <p className="text-xs text-gray-400 mb-1">Handling Officer</p>
                <Select
                  {...getSelectProps({ variant: "filter" })}
                  placeholder="All handling officers"
                  options={agentFilterOptions}
                  value={
                    agentFilterOptions.find(
                      (option) => option.value === filterAssigned,
                    ) || null
                  }
                  onChange={(option) =>
                    setFilterAssigned(option?.value || null)
                  }
                />
              </div>

              {view === "table" && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <Select
                    {...getSelectProps({ variant: "filter" })}
                    placeholder="All statuses"
                    options={STATUSES.map((status) => ({
                      label: status,
                      value: status,
                    }))}
                    value={
                      filterStatus
                        ? { label: filterStatus, value: filterStatus }
                        : null
                    }
                    onChange={(option) =>
                      setFilterStatus(option?.value || null)
                    }
                  />
                </div>
              )}

              <div>
                <p className="text-xs text-gray-400 mb-1">Lead Source</p>
                <Select
                  {...getSelectProps({ variant: "filter" })}
                  placeholder="All sources"
                  options={LEAD_SOURCE_OPTIONS}
                  value={
                    filterSource
                      ? { label: filterSource, value: filterSource }
                      : null
                  }
                  onChange={(option) => setFilterSource(option?.value || null)}
                />
              </div>
            </FilterPopover>
          }
          actionButton={
            permissions.canCreate && (
              <button
                onClick={openCreateSidePane}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md cursor-pointer"
              >
                <span className="flex items-center gap-2 text-sm">
                  <FaPlus size={11} /> Add Lead
                </span>
              </button>
            )
          }
        />
      </div>

      <PageContentState>
        {view === "kanban" ? (
          <LeadKanban
            columns={
              previewColumns
                ? { ...filteredColumns, ...previewColumns }
                : filteredColumns
            }
            statuses={KANBAN_STATUSES}
            permissions={permissions}
            onDragEnd={handleDragEnd}
            onCardClick={(lead) => openViewPane(lead)}
            isLoading={loading}
          />
        ) : (
          <LeadTable
            leads={filteredLeads}
            permissions={permissions}
            onView={openViewPane}
            onEdit={openEditSidePane}
            onUpdateStatus={handleUpdateStatus}
            onConvertLead={handleConvertLead}
            onShowWarning={showWarning}
            isLoading={loading}
          />
        )}
      </PageContentState>

      <LeadView
        open={viewPaneOpen}
        lead={viewingLead}
        users={users}
        permissions={permissions}
        onClose={closeViewPane}
        onEdit={(lead) => {
          closeViewPane();
          openEditSidePane(lead);
        }}
        onAssignLead={handleAssignLead}
        onApproveLeadConversion={handleApproveLeadConversion}
        onRequestLeadConversion={handleRequestLeadConversion}
        onUpdateStatus={handleUpdateStatus}
        onConvertLead={handleConvertLead}
      />

      <LeadActionConfirmModal
        open={Boolean(confirmAction)}
        action={confirmAction?.type}
        lead={confirmAction?.lead}
        submitting={confirmSubmitting}
        canConvert={permissions.canConvert}
        onClose={cancelLeadAction}
        onConfirm={handleConfirmLeadAction}
      />

      <LeadForm
        open={showSidePane}
        editingLead={editingLead}
        formData={formData}
        users={users}
        addressCodes={addressCodes}
        permissions={permissions}
        preview={preview}
        loading={loading}
        onChange={handleChange}
        onAddressSelect={handleAddressSelect}
        onAvatarChange={handleAvatarChange}
        onClearAvatar={clearAvatar}
        onSubmit={handleSubmit}
        onClose={closeSidePane}
        onCancel={closeSidePane}
        followUpTask={followUpTask}
        onFollowUpChange={handleFollowUpChange}
      />
    </PageBase>
  );
}
