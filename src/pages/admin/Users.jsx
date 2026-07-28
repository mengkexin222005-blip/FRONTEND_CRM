import { useState, useMemo, useRef, useCallback } from "react";
import { FaPlus } from "react-icons/fa";
import Select from "react-select";
import { useUsers } from "../../features/users/hooks/useUsers";
import { useUserForm } from "../../features/users/hooks/useUserForm";
import { useTeams } from "../../features/teams/hooks/useTeams";

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

import UserTable from "../../features/users/components/UserTable";
import UserForm from "../../features/users/components/UserForm";
import UserView from "../../features/users/components/UserView";

const ROLE_OPTIONS = [
  "Admin",
  "Sales Manager",
  "Sales Agent",
  "Support Staff",
].map((s) => ({ label: s, value: s }));

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export default function AdminUsers() {
  const [viewingUser, setViewingUser] = useState(null);
  const [viewPaneOpen, setViewPaneOpen] = useState(false);
  const closeTimerRef = useRef(null);

  const openViewPane = (user) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setViewingUser(user);
    setViewPaneOpen(true);
  };

  const closeViewPane = () => {
    setViewPaneOpen(false);
    closeTimerRef.current = setTimeout(() => {
      setViewingUser(null);
      closeTimerRef.current = null;
    }, 300);
  };

  const { users, loading, createUser, updateUser } = useUsers();
  const { teams } = useTeams();

  const {
    formData,
    addressCodes,
    avatar,
    preview,
    showSidePane,
    editingUser,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    handleChange,
    handleAddressSelect,
    handleAvatarChange,
    clearAvatar,
    openCreateSidePane,
    openEditSidePane,
    resetAndClose,
    closeSidePane,
    validatePasswords,
  } = useUserForm();

  // Filters
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);

  const clearAllFilters = useCallback(() => {
    setFilterStatus(null);
    setFilterRole(null);
  }, []);

  const {
    filterOpen,
    setFilterOpen,
    filterRef,
    activeFilterCount,
    clearAllFilters: handleClear,
  } = useFilterPopover({ filterRole, filterStatus }, clearAllFilters);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const fullName =
          `${getDisplayName(user, { includeMiddle: true, includeSuffix: true })}`.toLowerCase();
        const query = search.toLowerCase();
        const matchesSearch =
          !query ||
          fullName.includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.role?.toLowerCase().includes(query) ||
          user.employeeId?.toString().includes(query);

        const matchesRole = !filterRole || user.role === filterRole;
        const matchesStatus = !filterStatus || user.status === filterStatus;

        return matchesSearch && matchesRole && matchesStatus;
      }),
    [users, search, filterRole, filterStatus],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingUser) {
      const updated = await updateUser(editingUser, formData, avatar);
      if (updated) resetAndClose();
    } else {
      if (!validatePasswords()) return;
      const created = await createUser(formData, avatar);
      if (created) resetAndClose();
    }
  };

  return (
    <PageBase>
      <div className="flex items-center justify-between mb-4">
        <PageHeader title="Users" subtitle="Manage system users and roles" />

        <PageToolbar
          searchValue={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder="Search users..."
          filterSlot={
            <FilterPopover
              filterRef={filterRef}
              filterOpen={filterOpen}
              onToggle={() => setFilterOpen((p) => !p)}
              activeFilterCount={activeFilterCount}
              onClearAll={handleClear}
            >
              <div>
                <p className="text-xs text-gray-400 mb-1">Role</p>
                <Select
                  {...getSelectProps({ variant: "filter" })}
                  placeholder="All roles"
                  options={ROLE_OPTIONS}
                  value={
                    filterRole ? { label: filterRole, value: filterRole } : null
                  }
                  onChange={(opt) => setFilterRole(opt?.value || null)}
                />
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Status</p>
                <Select
                  {...getSelectProps({ variant: "filter" })}
                  placeholder="All statuses"
                  options={STATUS_OPTIONS}
                  value={
                    STATUS_OPTIONS.find((o) => o.value === filterStatus) || null
                  }
                  onChange={(opt) => setFilterStatus(opt?.value || null)}
                />
              </div>
            </FilterPopover>
          }
          actionButton={
            <button
              onClick={openCreateSidePane}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md cursor-pointer"
            >
              <span className="flex items-center gap-2 text-sm">
                <FaPlus size={11} /> Add User
              </span>
            </button>
          }
        />
      </div>

      <PageContentState loading={false}>
        <UserTable
          users={filteredUsers}
          onEdit={openEditSidePane}
          onView={openViewPane}
          isLoading={loading}
        />
      </PageContentState>

      {/* View pane — opens on row click */}
      <UserView
        open={viewPaneOpen}
        user={viewingUser}
        onClose={closeViewPane}
        onEdit={(user) => {
          closeViewPane();
          openEditSidePane(user);
        }}
        loading={loading}
      />

      {/* Edit / Create pane */}
      <UserForm
        open={showSidePane}
        editingUser={editingUser}
        formData={formData}
        addressCodes={addressCodes}
        preview={preview}
        loading={loading}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        onChange={handleChange}
        onAddressSelect={handleAddressSelect}
        onAvatarChange={handleAvatarChange}
        onClearAvatar={clearAvatar}
        onSubmit={handleSubmit}
        onClose={closeSidePane}
        onCancel={resetAndClose}
        teams={teams}
      />
    </PageBase>
  );
}
