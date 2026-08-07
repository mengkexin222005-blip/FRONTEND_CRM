import { useEffect, useState } from "react";
import {
  FiEdit2,
  FiUserPlus,
  FiUserCheck,
  FiX,
} from "react-icons/fi";
import Swal from "sweetalert2";

import LeadActionConfirmModal from "./LeadActionConfirmModal";

import ViewDrawer from "../../components/view/ViewDrawer";
import ViewTabs from "../../components/view/ViewTabs";
import ViewProfileHero from "../../components/view/ViewProfileHero";
import { Field, SectionBlock } from "../../components/view/ViewField";
import UserCard from "../../components/view/ViewUserCard";
import BaseBadge from "../../components/badge/BaseBadge";

import { useActivities } from "../../hooks/useActivities";
import ActivityTimeline from "../../components/activity/ActivityTimeline";

import AssignAgentModal from "../../components/modal/AssignAgentModal";

import { formatDate, formatDateTime } from "../../utils/date";
import { formatPhone } from "../../utils/format";
import { buildFullAddress } from "../../utils/buildFullAddress";

const AGENT_STATUSES = ["Contacted", "Qualified", "Lost"];
const LEAD_STAGE_ORDER = ["Contacted", "Qualified"];
const TABS = ["Overview", "Activity"];

const statusConfig = {
  Contacted: { text: "Contacted", tone: "blue" },
  Qualified: { text: "Qualified", tone: "amber" },
  Lost: { text: "Lost", tone: "red" },
  Converted: { text: "Converted", tone: "green" },
};

const btnOutlineBase =
  "flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md transition-colors cursor-pointer";

const ActionButton = ({
  label,
  icon: Icon,
  onClick,
  disabled,
  tooltip,
  className,
}) => (
  <span title={disabled ? tooltip : undefined} className="inline-flex">
    <button
      type="button"
      onClick={() => !disabled && onClick?.()}
      disabled={disabled}
      className={`${btnOutlineBase} ${
        disabled
          ? "border-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
          : className
      }`}
    >
      {Icon && <Icon size={14} />} {label}
    </button>
  </span>
);

export default function LeadView({
  open,
  lead,
  salesAgents = [],
  permissions = {},
  onClose,
  onEdit,
  onConvertLead,
  onAssignLead,
  onUpdateStatus,
}) {
  const {
    canAssign,
    canConvert,
    canUpdateStatus,
  } = permissions;

  const [activeTab, setActiveTab] = useState("Overview");
  const [confirmAction, setConfirmAction] = useState(null);
  const { activities, loading: activitiesLoading } = useActivities(
    open && lead ? "Lead" : null,
    lead?._id,
  );
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setActiveTab("Overview");
      setConfirmAction(null);
      setConfirmSubmitting(false);
      setAssignModalOpen(false);
      setStatusSubmitting(false);
    }
  }, [open]);

  const addr = lead?.address ?? {};
  const status = statusConfig[lead?.status] ?? {
    text: "Unknown",
    tone: "gray",
  };

  const isConverted = lead?.convertedToCustomer;
  const hasAssignee = Boolean(lead?.leadAssignee);

  const canConvertLead =
    canConvert &&
    !isConverted &&
    lead?.status === "Qualified";

  const handleConfirmLeadAction = async () => {
    if (!confirmAction || confirmSubmitting) return;

    setConfirmSubmitting(true);

    try {
      const { type, lead: actionLead, status } = confirmAction;

      const success =
        type === "convert"
          ? await onConvertLead?.(actionLead._id)
          : await onUpdateStatus?.(actionLead._id, status);

      if (success) {
        setConfirmAction(null);
      }
    } finally {
      setConfirmSubmitting(false);
    }
  };

  const validateStatusChange = (newStatus) => {
    if (!lead) return "Lead not found.";
    if (lead.status === newStatus) return null;
    if (lead.status === "Converted")
      return "Converted leads are final and can no longer be moved.";
    if (lead.status === "Lost")
      return "Lost leads are final and can no longer be moved.";
    if (newStatus === "Converted")
      return "Use the Convert to Client action instead of changing status manually.";
    if (newStatus === "Lost") return null;

    const currentIndex = LEAD_STAGE_ORDER.indexOf(lead.status);
    const nextIndex = LEAD_STAGE_ORDER.indexOf(newStatus);

    if (currentIndex === -1 || nextIndex === -1)
      return "Invalid lead stage transition.";

    if (nextIndex > currentIndex && nextIndex - currentIndex > 1) {
      return `Cannot skip stages. Move from ${lead.status} to ${
        LEAD_STAGE_ORDER[currentIndex + 1]
      } first.`;
    }

    return null;
  };

  const handleStatusChange = async (newStatus) => {
    if (!lead || !onUpdateStatus || statusSubmitting) return;

    const error = validateStatusChange(newStatus);

    if (error) {
      Swal.fire({ icon: "warning", title: "Status not allowed", text: error });
      return;
    }

    if (newStatus === "Lost") {
      setConfirmAction({ type: "lost", lead, status: "Lost" });
      return;
    }

    setStatusSubmitting(true);
    try {
      await onUpdateStatus(lead._id, newStatus);
    } finally {
      setStatusSubmitting(false);
    }
  };

  const statusBadge =
    canUpdateStatus && !isConverted ? (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Status:</span>
        <select
          value={lead?.status}
          disabled={statusSubmitting}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={`text-xs font-semibold rounded-md border px-2 w-full py-1 cursor-pointer focus:outline-none ${statusConfig[lead?.status]?.tone ?? ""}`}
        >
          {AGENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {statusSubmitting && (
          <span className="text-xs text-gray-400">Saving…</span>
        )}
      </div>
    ) : (
      <BaseBadge tone={status.tone} size="sm" shape="soft">
        {status.text}
      </BaseBadge>
    );

  return (
    <ViewDrawer open={open} onClose={onClose}>
      {lead && (
        <>
          {/* Header */}
          <div className="shrink-0 px-6 py-3 bg-white">
            <div className="flex justify-between items-center gap-2 mb-2">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0"
              >
                <FiX size={18} />
              </button>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                <ActionButton
                  label="Convert to Client"
                  icon={FiUserPlus}
                  onClick={() =>
                    setConfirmAction({ type: "convert", lead })
                  }
                  disabled={!canConvertLead}
                  tooltip={
                    isConverted
                      ? "Lead is already converted"
                      : lead?.status !== "Qualified"
                        ? "Lead status must be Qualified to convert"
                        : undefined
                  }
                  className="border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                />

                {canAssign && (
                  <ActionButton
                    label={hasAssignee ? "Reassign" : "Assign"}
                    icon={FiUserCheck}
                    onClick={() => setAssignModalOpen(true)}
                    disabled={isConverted}
                    tooltip={
                      isConverted
                        ? "Cannot reassign a converted lead"
                        : undefined
                    }
                    className="border-sky-600 text-sky-800 hover:bg-sky-50"
                  />
                )}

                <ActionButton
                  label="Edit"
                  icon={FiEdit2}
                  onClick={() => {
                    onClose();
                    onEdit(lead);
                  }}
                  disabled={isConverted}
                  tooltip={
                    isConverted ? "Converted leads cannot be edited" : undefined
                  }
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                />
              </div>
            </div>

            <ViewProfileHero
              record={lead}
              subtitle={`${lead.company || "—"} · ${lead.industry || "—"}`}
              badge={statusBadge}
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
                <SectionBlock title="Assignment">
                  <div className="col-span-3 grid grid-cols-2 gap-4">
                    <UserCard user={lead.leadOwner} label="Created by" />
                    {lead.leadAssignee ? (
                      <UserCard
                        user={lead.leadAssignee}
                        label="Assigned Agent"
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-400 italic">
                          No agent assigned
                        </p>
                      </div>
                    )}
                  </div>
                  {lead.assignedAt && (
                    <div className="col-span-3">
                      <Field
                        label="Assigned On"
                        value={formatDateTime(lead.assignedAt)}
                      />
                    </div>
                  )}
                </SectionBlock>

                <SectionBlock title="Personal Information">
                  <Field label="First Name" value={lead.firstName} />
                  <Field label="Middle Name" value={lead.middleName} />
                  <Field label="Last Name" value={lead.lastName} />
                  <Field
                    label="Suffix"
                    value={lead.suffixName === "N/A" ? "—" : lead.suffixName}
                  />
                  <Field
                    label="Date of Birth"
                    value={formatDate(lead.dateOfBirth)}
                  />
                  <Field label="Sex" value={lead.sex} />
                  <Field label="Phone" value={formatPhone(lead.phone)} />
                  <Field label="Email" value={lead.email} />
                </SectionBlock>

                <SectionBlock title="Lead Information">
                  <Field label="Company" value={lead.company} />
                  <Field label="Industry" value={lead.industry} />
                  <Field label="Lead Source" value={lead.leadSource} />
                  <Field label="Status" value={status.text} />
                </SectionBlock>

                <SectionBlock title="Address">
                  <div className="col-span-3">
                    <Field
                      label="Full Address"
                      value={buildFullAddress(addr)}
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

                <SectionBlock title="Notes" fullWidth>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {lead.notes || "—"}
                  </p>
                </SectionBlock>

                <SectionBlock title="Record">
                  <Field
                    label="Created"
                    value={formatDateTime(lead.createdAt)}
                  />
                  <Field
                    label="Updated"
                    value={formatDateTime(lead.updatedAt)}
                  />
                </SectionBlock>
              </>
            )}

            {activeTab === "Activity" && (
              <ActivityTimeline
                activities={activities}
                loading={activitiesLoading}
              />
            )}
          </div>
        </>
      )}

      {confirmAction && (
        <LeadActionConfirmModal
          open={Boolean(confirmAction)}
          action={confirmAction?.type}
          lead={confirmAction?.lead}
          submitting={confirmSubmitting}
          canConvert={canConvert}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmLeadAction}
        />
      )}

      <AssignAgentModal
        open={assignModalOpen && Boolean(lead)}
        currentAssignee={lead?.leadAssignee}
        salesAgents={salesAgents}
        title={hasAssignee ? "Reassign lead" : "Assign lead"}
        subtitle="Select a sales agent for this lead."
        currentLabel="Current"
        selectLabel={hasAssignee ? "New assigned agent" : "Assigned agent"}
        confirmLabel={hasAssignee ? "Save reassignment" : "Assign"}
        confirmingLabel="Saving…"
        onConfirm={(agentId) => onAssignLead?.(lead._id, agentId)}
        onClose={() => setAssignModalOpen(false)}
      />
    </ViewDrawer>
  );
}