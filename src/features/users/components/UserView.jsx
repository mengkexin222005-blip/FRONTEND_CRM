import { useState } from "react";
import { FiX } from "react-icons/fi";
import { Pencil } from "lucide-react";

import ViewDrawer from "../../../components/view/ViewDrawer";
import ViewTabs from "../../../components/view/ViewTabs";
import ViewProfileHero from "../../../components/view/ViewProfileHero";
import { Field, SectionBlock } from "../../../components/view/ViewField";
import TeamCard from "../../../components/card/TeamCard";
import StatusBadge from "../../../components/badge/StatusBadge";

import UserLeadsTab from "../tabs/UserLeadsTab";
import UserClientsTab from "../tabs/UserClientsTab";
import UserQuotationsTab from "../tabs/UserQuotationsTab";
import UserTasksTab from "../tabs/UserTasksTab";

import { buildFullAddress } from "../../../utils/buildFullAddress";
import { formatDate, formatDateTime } from "../../../utils/date";
import { formatPhone } from "../../../utils/format";
import { getDisplayName } from "../../../utils/name";

const TABS = ["Overview", "Leads", "Clients", "Quotations", "Tasks"];

function TeamSection({ user }) {
  const role = user.role;
  if (role === "Admin" || role === "Support Staff") return null;

  const team = user.team;
  let detail = null;

  if (team && typeof team === "object" && team.name) {
    if (role === "Sales Agent") {
      const managerName = team.manager
        ? getDisplayName(team.manager, { includeMiddleInitial: true })
        : "—";
      detail = `Manager: ${managerName}`;
    }
    if (role === "Sales Manager") {
      const agentCount = team.agents?.length ?? 0;
      detail = `Managing: ${agentCount} agent${agentCount !== 1 ? "s" : ""}`;
    }
  }

  return (
    <SectionBlock title="Team" fullWidth={true}>
      <TeamCard team={team} detail={detail} size="compact" />
    </SectionBlock>
  );
}

export default function UserView({ open, user, onClose, onEdit }) {
  const [activeTab, setActiveTab] = useState("Overview");

  const handleClose = () => {
    setActiveTab("Overview");
    onClose();
  };
  const addr = user?.currentAddress ?? {};

  const subtitle = user ? (
    <span>
      {user.role}
      <span className="text-gray-400 font-normal"> — {user.employeeId}</span>
    </span>
  ) : null;

  return (
    <ViewDrawer open={open} onClose={handleClose}>
      {user && (
        <>
          {/* Header */}
          <div className="shrink-0 px-6 py-3 bg-white">
            <div className="flex justify-between items-center mb-2">
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <FiX size={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onEdit(user);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-[#ef4444] text-gray-600 transition-colors hover:text-white cursor-pointer"
              >
                <Pencil size={13} /> Edit
              </button>
            </div>

            <ViewProfileHero
              record={user}
              subtitle={subtitle}
              badge={
                <StatusBadge
                  active={user?.status?.toLowerCase() === "active"}
                  size="sm"
                />
              }
            />

            <ViewTabs
              tabs={TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-1">
            {activeTab === "Overview" && (
              <>
                <TeamSection user={user} />

                <SectionBlock title="Personal Information">
                  <Field label="First Name" value={user.firstName} />
                  <Field label="Middle Name" value={user.middleName} />
                  <Field label="Last Name" value={user.lastName} />
                  <Field
                    label="Suffix"
                    value={user.suffixName === "N/A" ? "—" : user.suffixName}
                  />
                  <Field
                    label="Date of Birth"
                    value={formatDate(user.dateOfBirth)}
                  />
                  <Field label="Place of Birth" value={user.placeOfBirth} />
                  <Field label="Sex" value={user.sex} />
                  <Field label="Phone" value={formatPhone(user.phone)} />
                </SectionBlock>

                <SectionBlock title="Address">
                  <div className="col-span-3">
                    <Field
                      label="Full Address"
                      value={buildFullAddress(user.currentAddress)}
                    />
                  </div>
                  <Field label="House No." value={addr.houseNumber} />
                  <Field label="Street" value={addr.street} />
                  <Field label="Barangay" value={addr.barangay} />
                  <Field
                    label="City / Municipality"
                    value={addr.municipality}
                  />
                  <Field label="Province" value={addr.province} />
                  <Field label="Zip Code" value={addr.zipCode} />
                  <Field label="Country" value={addr.country} />
                </SectionBlock>

                <SectionBlock title="Account">
                  <Field label="Employee ID" value={user.employeeId} />
                  <Field label="Role" value={user.role} />
                  <Field label="Email" value={user.email} />
                  <Field
                    label="Status"
                    value={
                      user.status?.charAt(0).toUpperCase() +
                      user.status?.slice(1)
                    }
                  />
                  <Field
                    label="Created"
                    value={formatDateTime(user.createdAt)}
                  />
                  <Field
                    label="Last Sign In"
                    value={formatDateTime(user.signInAt)}
                  />
                </SectionBlock>
              </>
            )}

            {activeTab === "Leads" && (
              <UserLeadsTab
                employeeId={user.employeeId}
                enabled={activeTab === "Leads"}
              />
            )}
            {activeTab === "Clients" && (
              <UserClientsTab
                employeeId={user.employeeId}
                enabled={activeTab === "Clients"}
              />
            )}
            {activeTab === "Quotations" && (
              <UserQuotationsTab
                employeeId={user.employeeId}
                enabled={activeTab === "Quotations"}
              />
            )}
            {activeTab === "Tasks" && (
              <UserTasksTab
                employeeId={user.employeeId}
                enabled={activeTab === "Tasks"}
              />
            )}
          </div>
        </>
      )}
    </ViewDrawer>
  );
}