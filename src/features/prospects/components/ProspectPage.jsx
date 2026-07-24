import { useCallback, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import Select from "react-select";

import {
  PageBase,
  PageHeader,
  PageToolbar,
  PageContentState,
} from "../../../components/page";

import { useUsers } from "../../users/hooks/useUsers";

import FilterPopover from "../../../components/filters/FilterPopover";
import { useFilterPopover } from "../../../components/filters/useFilterPopover";
import { getSelectProps } from "../../../components/select/selectConfig";

import ProspectForm from "./ProspectForm";
import ProspectTable from "./ProspectTable";
import ProspectKanban from "./ProspectKanban";
import useProspect from "../hooks/useProspect";

const STATUS_OPTIONS = [
  { label: "New", value: "New" },
  { label: "Contacted", value: "Contacted" },
  { label: "Lost", value: "Lost" },
];

const SOURCE_OPTIONS = [
  { label: "Website", value: "Website" },
  { label: "Referral", value: "Referral" },
  { label: "Facebook", value: "Facebook" },
  { label: "Email", value: "Email" },
  { label: "Walk-in", value: "Walk-in" },
  { label: "Phone Call", value: "Phone Call" },
  { label: "Event", value: "Event" },
  { label: "Other", value: "Other" },
];

export default function ProspectPage() {
  const {
    prospects,
    loading,
    addProspect,
    editProspect,
    removeProspect,
    markAsContacted,
  } = useProspect();

  const { users = [] } = useUsers({
    mode: "assignable",
    resource: "prospect",
  });

  const [viewMode, setViewMode] = useState("table");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterSource, setFilterSource] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState(null);

  const clearAllFilters = useCallback(() => {
    setFilterStatus(null);
    setFilterSource(null);
  }, []);

  const {
    filterOpen,
    setFilterOpen,
    filterRef,
    activeFilterCount,
    clearAllFilters: handleClearFilters,
  } = useFilterPopover({ filterStatus, filterSource }, clearAllFilters);

  const filteredProspects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return prospects.filter((prospect) => {
      const representative = prospect.representativeName || {};

      const representativeName = [
        representative.firstName,
        representative.middleInitial,
        representative.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query ||
        prospect.companyName?.toLowerCase().includes(query) ||
        prospect.companyEmailAddress?.toLowerCase().includes(query) ||
        prospect.phone?.toLowerCase().includes(query) ||
        representativeName.includes(query);

      const matchesStatus = !filterStatus || prospect.status === filterStatus;

      const matchesSource =
        !filterSource || prospect.leadSource === filterSource;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [prospects, search, filterStatus, filterSource]);

  const handleOpenCreate = () => {
    setEditingProspect(null);
    setFormOpen(true);
  };

  const handleEdit = (prospect) => {
    setEditingProspect(prospect);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingProspect(null);
  };

  const handleSubmit = async (payload) => {
    const success = editingProspect
      ? await editProspect(editingProspect._id, payload)
      : await addProspect(payload);

    if (success) {
      handleCloseForm();
    }

    return success;
  };

  const handleStatusChange = async (id, status) => {
    return editProspect(id, { status });
  };

  return (
    <PageBase>
      <div className="flex items-center justify-between mb-4">
        <PageHeader
          title="Prospects"
          subtitle="Store client forms and track potential customers before they are contacted."
        />

        <PageToolbar
          searchValue={search}
          onSearchChange={(event) => setSearch(event.target.value)}
          searchPlaceholder="Search prospects..."
          view={viewMode}
          onViewChange={setViewMode}
          filterSlot={
            <FilterPopover
              filterRef={filterRef}
              filterOpen={filterOpen}
              onToggle={() => setFilterOpen((previous) => !previous)}
              activeFilterCount={activeFilterCount}
              onClearAll={handleClearFilters}
            >
              <div>
                <p className="text-xs text-gray-400 mb-1">Status</p>
                <Select
                  {...getSelectProps({ variant: "filter" })}
                  placeholder="All statuses"
                  options={STATUS_OPTIONS}
                  value={
                    STATUS_OPTIONS.find(
                      (option) => option.value === filterStatus,
                    ) || null
                  }
                  onChange={(option) => setFilterStatus(option?.value || null)}
                />
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Lead Source</p>
                <Select
                  {...getSelectProps({ variant: "filter" })}
                  placeholder="All sources"
                  options={SOURCE_OPTIONS}
                  value={
                    SOURCE_OPTIONS.find(
                      (option) => option.value === filterSource,
                    ) || null
                  }
                  onChange={(option) => setFilterSource(option?.value || null)}
                />
              </div>
            </FilterPopover>
          }
          actionButton={
            <button
              type="button"
              onClick={handleOpenCreate}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-5 rounded-md cursor-pointer min-w-37.5"
            >
              <span className="flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                <FaPlus size={11} />
                Add Prospect
              </span>
            </button>
          }
        />
      </div>

      <PageContentState loading={false}>
        {viewMode === "table" ? (
          <ProspectTable
            prospects={filteredProspects}
            loading={loading}
            onEdit={handleEdit}
            onDelete={removeProspect}
            onContact={markAsContacted}
          />
        ) : (
          <ProspectKanban
            prospects={filteredProspects}
            loading={loading}
            onView={() => {}}
            onEdit={handleEdit}
            onDelete={removeProspect}
            onContact={markAsContacted}
            onStatusChange={handleStatusChange}
          />
        )}
      </PageContentState>

      <ProspectForm
        open={formOpen}
        editingProspect={editingProspect}
        users={users}
        onSubmit={handleSubmit}
        onClose={handleCloseForm}
        onCancel={handleCloseForm}
        loading={loading}
      />
    </PageBase>
  );
}