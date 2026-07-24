import { useState, useMemo, useRef, useCallback } from "react";
import { FaPlus } from "react-icons/fa";
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

import { usePermissions } from "../../permissions/usePermissions";
import { useAuth } from "../../context/AuthContext";
import { useClients } from "./hooks/useClients";
import { useClientForm } from "./hooks/useClientForm";
import { useUsers } from "../users/hooks/useUsers";

import ClientTable from "./ClientTable";
import ClientForm from "./ClientForm";
import ClientView from "./ClientView";

const STATUS_OPTIONS = ["Active", "Inactive", "Lost"].map((s) => ({
  label: s,
  value: s,
}));

const TYPE_OPTIONS = ["Individual", "Business"].map((s) => ({
  label: s,
  value: s,
}));

export default function ClientsPage() {
  const permissions = usePermissions("clients");
  const { user: currentUser } = useAuth();
  const isCurrentAgent = currentUser.role === "Sales Agent";

  const { users = [] } = useUsers({
    skip: !permissions.canAssign,
    mode: "assignable",
    resource: "client",
  });

  const [viewingClient, setViewingClient] = useState(null);
  const [viewPaneOpen, setViewPaneOpen] = useState(false);
  const closeTimerRef = useRef(null);

  const openViewPane = (client) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setViewingClient(client);
    setViewPaneOpen(true);
  };

  const closeViewPane = () => {
    setViewPaneOpen(false);
    closeTimerRef.current = setTimeout(() => setViewingClient(null), 300);
  };

  const syncViewingClient = (clientId, updated) => {
    if (updated && viewingClient?._id === clientId)
      setViewingClient((prev) => ({ ...prev, ...updated }));
  };

  const {
    clients = [],
    loading,
    createClient,
    updateClient,
    assignClient,
    updateClientStatus,
  } = useClients();

  const {
    formData,
    addressCodes,
    avatar,
    preview,
    showSidePane,
    editingClient,
    handleChange,
    handleAddressSelect,
    handleAvatarChange,
    clearAvatar,
    openCreateSidePane,
    openEditSidePane,
    closeSidePane,
  } = useClientForm();

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterType, setFilterType] = useState(null);
  const [filterAssigned, setFilterAssigned] = useState(null);

  const clearAllFilters = useCallback(() => {
    setFilterStatus(null);
    setFilterType(null);
    setFilterAssigned(null);
  }, []);

  const {
    filterOpen,
    setFilterOpen,
    filterRef,
    activeFilterCount,
    clearAllFilters: handleClear,
  } = useFilterPopover(
    { filterStatus, filterType, filterAssigned },
    clearAllFilters,
  );

  const agentFilterOptions = useMemo(() => {
    const uniqueAgents = new Map();
    clients.forEach((c) => {
      if (c.assignedTo) uniqueAgents.set(c.assignedTo._id, c.assignedTo);
    });
    return Array.from(uniqueAgents.values()).map((u) => ({
      label: getDisplayName(u, { includeSuffix: true }),
      value: u._id,
    }));
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const fullName = getDisplayName(client, {
        includeMiddleInitial: true,
        includeSuffix: true,
      }).toLowerCase();
      const q = search.toLowerCase();
      return (
        (!q ||
          fullName.includes(q) ||
          client.email?.toLowerCase().includes(q) ||
          client.company?.toLowerCase().includes(q) ||
          client.phone?.toLowerCase().includes(q)) &&
        (!filterStatus || client.status === filterStatus) &&
        (!filterType || client.clientType === filterType) &&
        (!filterAssigned || client.assignedTo?._id === filterAssigned)
      );
    });
  }, [clients, search, filterStatus, filterType, filterAssigned]);

  const handleReassignClient = async (clientId, assignedTo) => {
    const updated = await assignClient(clientId, assignedTo);
    syncViewingClient(clientId, updated);
    return Boolean(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = editingClient
      ? await updateClient(editingClient, formData, avatar)
      : await createClient(formData, avatar);
    if (result) closeSidePane();
  };

  const handleUpdateStatus = async (clientid, newStatus) => {
    await updateClientStatus(clientid, newStatus);
  };

  return (
    <PageBase>
      <div className="flex items-center justify-between mb-4">
        <PageHeader
          title="Clients"
          subtitle={"Clients assigned to you or converted from your leads"}
        />

        <PageToolbar
          searchValue={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder="Search clients..."
          filterSlot={
            <FilterPopover
              filterRef={filterRef}
              filterOpen={filterOpen}
              onToggle={() => setFilterOpen((p) => !p)}
              activeFilterCount={activeFilterCount}
              onClearAll={handleClear}
            >
              <div>
                <p className="text-xs text-gray-400 mb-1">Status</p>
                <Select
                  {...getSelectProps({ variant: "filter" })}
                  placeholder="All statuses"
                  options={STATUS_OPTIONS}
                  value={
                    filterStatus
                      ? { label: filterStatus, value: filterStatus }
                      : null
                  }
                  onChange={(opt) => setFilterStatus(opt?.value || null)}
                />
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Client Type</p>
                <Select
                  {...getSelectProps({ variant: "filter" })}
                  placeholder="All types"
                  options={TYPE_OPTIONS}
                  value={
                    filterType ? { label: filterType, value: filterType } : null
                  }
                  onChange={(opt) => setFilterType(opt?.value || null)}
                />
              </div>

              {!isCurrentAgent && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Assigned To</p>
                  <Select
                    {...getSelectProps({ variant: "filter" })}
                    placeholder="All handling officers"
                    options={agentFilterOptions}
                    value={
                      agentFilterOptions.find(
                        (o) => o.value === filterAssigned,
                      ) || null
                    }
                    onChange={(opt) => setFilterAssigned(opt?.value || null)}
                    isSearchable
                  />
                </div>
              )}
            </FilterPopover>
          }
          actionButton={
            permissions.canCreate && (
              <button
                onClick={openCreateSidePane}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md cursor-pointer"
              >
                <span className="flex items-center gap-2 text-sm">
                  <FaPlus size={11} /> Add Client
                </span>
              </button>
            )
          }
        />
      </div>

      <PageContentState>
        <ClientTable
          clients={filteredClients}
          permissions={permissions}
          onView={openViewPane}
          onEdit={permissions.canEdit ? openEditSidePane : undefined}
          onUpdateStatus={handleUpdateStatus}
          isLoading={loading}
        />
      </PageContentState>

      <ClientView
        open={viewPaneOpen}
        client={viewingClient}
        users={users}
        permissions={permissions}
        onClose={closeViewPane}
        onEdit={(client) => {
          closeViewPane();
          openEditSidePane(client);
        }}
        onReassignClient={handleReassignClient}
      />

      {permissions.canCreate && (
        <ClientForm
          open={showSidePane}
          editingClient={editingClient}
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
        />
      )}
    </PageBase>
  );
}
