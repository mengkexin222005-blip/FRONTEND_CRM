import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiUserPlus, FiX } from "react-icons/fi";

import ViewDrawer from "../../../components/view/ViewDrawer";
import ViewTabs from "../../../components/view/ViewTabs";
import ViewProfileHero from "../../../components/view/ViewProfileHero";
import { Field, SectionBlock } from "../../../components/view/ViewField";
import UserCard from "../../../components/view/ViewUserCard";

import { getProfileImage } from "../../../utils/avatar";
import { formatDate } from "../../../utils/date";

const TABS = ["Overview", "Activity"];

const statusConfig = {
  New: { text: "New", className: "bg-gray-100 text-gray-700 border-gray-200" },
  Contacted: { text: "Contacted", className: "bg-blue-50 text-blue-700 border-blue-200" },
  Qualified: { text: "Qualified", className: "bg-amber-50 text-amber-800 border-amber-200" },
  Lost: { text: "Lost", className: "bg-red-50 text-red-700 border-red-200" },
  Converted: { text: "Converted", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
};

const btnOutlineBase =
  "flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md transition-colors cursor-pointer";

export default function ProspectView({
  open,
  prospect,
  onClose,
  onEdit,
  onConvert,
}) {
  const [activeTab, setActiveTab] = useState("Overview");

  useEffect(() => {
    if (!open) {
      setActiveTab("Overview");
    }
  }, [open]);

  const representative = prospect?.representativeName ?? {};
  const owner = prospect?.ownerName ?? {};
  const addr = prospect?.businessAddress ?? {};

  const repFullName = useMemo(() => {
    return [
      representative.firstName,
      representative.middleInitial,
      representative.lastName,
    ]
      .filter(Boolean)
      .join(" ");
  }, [representative.firstName, representative.middleInitial, representative.lastName]);

  const ownerFullName = useMemo(() => {
    return [
      owner.firstName,
      owner.middleInitial,
      owner.lastName,
    ]
      .filter(Boolean)
      .join(" ");
  }, [owner.firstName, owner.middleInitial, owner.lastName]);

  const hasRepresentative = Boolean(repFullName);
  const hasOwner = Boolean(ownerFullName);

  const heroSubtitle = useMemo(() => {
    return [prospect?.companyName, prospect?.natureOfBusiness]
      .filter(Boolean)
      .join(" • ");
  }, [prospect?.companyName, prospect?.natureOfBusiness]);

  const isConverted =
    prospect?.status === "Contacted" || prospect?.status === "Converted";

  const statusInfo = useMemo(() => {
    return (
      statusConfig[prospect?.status] ?? {
        text: prospect?.status || "Unknown",
        className: "bg-gray-50 text-gray-600 border-gray-200",
      }
    );
  }, [prospect?.status]);

  return (
    <ViewDrawer open={open} onClose={onClose}>
      {prospect && (
        <>
          <div className="shrink-0 px-6 py-3 bg-white border-b border-gray-100">
            <div className="flex justify-between items-center gap-2 mb-3">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0"
              >
                <FiX size={18} />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isConverted}
                  onClick={() => !isConverted && onConvert?.(prospect._id)}
                  className={`${btnOutlineBase} ${
                    isConverted
                      ? "opacity-50 cursor-not-allowed border-gray-200 text-gray-400 bg-gray-50"
                      : "border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  <FiUserPlus size={14} />
                  {isConverted ? "Converted" : "Convert to Lead"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit?.(prospect);
                  }}
                  className={`${btnOutlineBase} border-gray-300 text-gray-600 hover:bg-gray-50`}
                >
                  <FiEdit2 size={14} />
                  Edit
                </button>
              </div>
            </div>

            <ViewProfileHero
            image={getProfileImage(prospect)}
            title={prospect?.companyName || "Unnamed Prospect"}
            subtitle={
                [repFullName, prospect?.natureOfBusiness]
                .filter(Boolean)
                .join(" • ") || "Prospect"
            }
            />

            <div className="mt-3 mb-3 flex items-center justify-between">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.className}`}
              >
                {statusInfo.text}
              </span>
            </div>

            <ViewTabs
              tabs={TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {activeTab === "Overview" && (
              <>
                <SectionBlock title="Assignment">
                  <div className="col-span-full grid grid-cols-2 gap-4">
                    {prospect?.createdBy ? (
                      <UserCard
                        user={prospect.createdBy}
                        label="Created By"
                      />
                    ) : (
                      <Field label="Created By" value="Not available" />
                    )}

                    {prospect?.handlingOfficer ? (
                      <UserCard
                        user={prospect.handlingOfficer}
                        label="Handling Officer"
                      />
                    ) : (
                      <Field label="Handling Officer" value="Unassigned" />
                    )}
                  </div>
                </SectionBlock>

                <SectionBlock title="Company Information">
                  <Field label="Company" value={prospect?.companyName} />
                  <Field
                    label="Company Email"
                    value={prospect?.companyEmailAddress}
                  />
                  <Field label="Website" value={prospect?.companyWebsite} />
                  <Field
                    label="Nature of Business"
                    value={prospect?.natureOfBusiness}
                  />
                  <Field
                    label="Employees"
                    value={prospect?.numberOfEmployees}
                  />
                </SectionBlock>

                <SectionBlock title="Representative Information">
                  {hasRepresentative ? (
                    <>
                      <Field label="Representative" value={repFullName} />
                      <Field label="Title" value={prospect?.title} />
                      <Field label="Email" value={prospect?.emailAddress} />
                      <Field label="Phone" value={prospect?.phone} />
                      <Field label="Viber" value={prospect?.viber} />
                    </>
                  ) : (
                    <div className="col-span-full text-sm italic text-gray-400 py-1">
                      No representative information available.
                    </div>
                  )}
                </SectionBlock>

                <SectionBlock title="Owner Information">
                  {hasOwner ? (
                    <Field label="Owner" value={ownerFullName} />
                  ) : (
                    <div className="col-span-full text-sm italic text-gray-400 py-1">
                      No owner information available.
                    </div>
                  )}
                </SectionBlock>

                <SectionBlock title="Business Address">
                  <Field label="House No." value={addr.houseNumber} />
                  <Field label="Street" value={addr.streetAddress} />
                  <Field label="City" value={addr.city} />
                  <Field label="Province" value={addr.province} />
                  <Field label="Country" value={addr.country} />
                </SectionBlock>

                <SectionBlock title="CRM Details">
                  <Field label="Status" value={prospect?.status} />
                  <Field label="Lead Source" value={prospect?.leadSource} />
                  <Field
                    label="Created Date"
                    value={
                      prospect?.createdAt
                        ? formatDate(prospect.createdAt)
                        : "—"
                    }
                  />
                </SectionBlock>

                <SectionBlock title="Notes">
                  <div className="col-span-full rounded-md bg-gray-50 border border-gray-100 p-3 text-sm text-gray-700 whitespace-pre-wrap">
                    {prospect?.notes || "No notes available."}
                  </div>
                </SectionBlock>
              </>
            )}

            {activeTab === "Activity" && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm font-medium text-gray-500">
                  No activity yet
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Activities will appear here once backend support is added.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </ViewDrawer>
  );
}