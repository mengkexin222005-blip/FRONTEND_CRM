import React from "react";
import Select from "react-select";
import { Info, UserRound } from "lucide-react";

import { getSelectProps } from "../../components/select/selectConfig";
import FormDrawer from "../../components/form/FormDrawer";
import FormSection from "../../components/form/FormSection";
import PhAddressFields from "../../components/form/PhAddressFields";
import {
  FormLabel,
  FormInput,
  FormTextarea,
  inputClass,
} from "../../components/form/FormField";

import { getProfileImage } from "../../utils/avatar";
import { getDisplayName } from "../../utils/name";

import {
  TASK_TYPE_OPTIONS,
  TASK_PRIORITY_OPTIONS,
} from "../../constants/options";

export default function LeadForm({
  open,
  editingLead,
  formData,
  addressCodes,
  users = [],
  permissions = {},
  loading,
  onChange,
  onAddressSelect,
  onSubmit,
  onClose,
  onCancel,
  followUpTask,
  onFollowUpChange,
}) {
  const handlingOfficerOptions = users.map((u) => ({
    label: `${getDisplayName(u, { includeSuffix: true })} — ${u.role}`,
    value: String(u._id || u.id),
    user: u,
  }));

  const leadName =
    [formData.firstName, formData.lastName].filter(Boolean).join(" ") ||
    formData.representativeName?.firstName ||
    "Lead";
  const today = new Date().toISOString().split("T")[0];

  const handleNestedChange = (group, field, value) => {
    onChange({
      target: {
        name: group,
        value: {
          ...(formData[group] || {}),
          [field]: value,
        },
      },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Standardize object payload structure prior to submission
    const payload = {
      ...formData,
      companyName: formData.companyName || formData.company || "",
      natureOfBusiness: formData.natureOfBusiness || formData.industry || "",
      ownerName: {
        firstName: formData.ownerName?.firstName || "",
        middleInitial: formData.ownerName?.middleInitial || "",
        lastName: formData.ownerName?.lastName || "",
      },
      representativeName: {
        firstName: formData.representativeName?.firstName || formData.firstName || "",
        middleInitial: formData.representativeName?.middleInitial || formData.middleName || "",
        lastName: formData.representativeName?.lastName || formData.lastName || "",
      },
      address: formData.address || {
        houseNumber: formData.houseNumber || "",
        street: formData.street || "",
        barangay: formData.barangay || "",
        municipality: formData.city || formData.municipality || "",
        province: formData.province || "",
        zipCode: formData.zipCode || "",
        country: formData.country || "Philippines",
      },
    };

    onSubmit(e, payload);
  };

  return (
    <FormDrawer
      open={open}
      title={editingLead ? "Edit Lead" : "Add Lead"}
      formId="lead-form"
      loading={loading}
      onClose={onClose}
      onCancel={onCancel}
    >
      <form id="lead-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Company Profile */}
        <FormSection title="Company Profile">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <FormLabel required>Company Name</FormLabel>
              <FormInput
                name="companyName"
                value={formData.companyName || formData.company || ""}
                onChange={onChange}
                required
                disabled={loading}
                placeholder="Enter company name"
              />
            </div>

            <div>
              <FormLabel required>Company Email Address</FormLabel>
              <FormInput
                type="email"
                name="companyEmailAddress"
                value={
                  formData.companyEmailAddress ||
                  formData.emailAddress ||
                  formData.email ||
                  ""
                }
                onChange={onChange}
                required
                disabled={loading}
                placeholder="company@email.com"
              />
            </div>

            <div>
              <FormLabel>Company Website</FormLabel>
              <FormInput
                name="companyWebsite"
                value={formData.companyWebsite || ""}
                onChange={onChange}
                disabled={loading}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <FormLabel>Nature of Business</FormLabel>
              <FormInput
                name="natureOfBusiness"
                value={formData.natureOfBusiness || formData.industry || ""}
                onChange={onChange}
                disabled={loading}
                placeholder="e.g. Construction, Retail, IT"
              />
            </div>

            <div>
              <FormLabel>Number of Employees</FormLabel>
              <FormInput
                name="numberOfEmployees"
                value={formData.numberOfEmployees || ""}
                onChange={onChange}
                disabled={loading}
                placeholder="e.g. 1-10, 50+, 100+"
              />
            </div>
          </div>
        </FormSection>

        {/* Business Address */}
        <FormSection title="Business Address">
          <PhAddressFields
            formData={formData}
            addressCodes={addressCodes}
            onAddressSelect={onAddressSelect}
            onChange={onChange}
            disabled={loading}
            hideStreetFields={true}
          />
        </FormSection>

        {/* Owner Information */}
        <FormSection title="Owner Information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <FormLabel>First Name</FormLabel>
              <FormInput
                value={formData.ownerName?.firstName || ""}
                onChange={(e) =>
                  handleNestedChange("ownerName", "firstName", e.target.value)
                }
                disabled={loading}
                placeholder="First name"
              />
            </div>

            <div>
              <FormLabel>Middle Initial</FormLabel>
              <FormInput
                value={formData.ownerName?.middleInitial || ""}
                onChange={(e) =>
                  handleNestedChange(
                    "ownerName",
                    "middleInitial",
                    e.target.value
                  )
                }
                disabled={loading}
                placeholder="M.I."
              />
            </div>

            <div>
              <FormLabel>Last Name</FormLabel>
              <FormInput
                value={formData.ownerName?.lastName || ""}
                onChange={(e) =>
                  handleNestedChange("ownerName", "lastName", e.target.value)
                }
                disabled={loading}
                placeholder="Last name"
              />
            </div>
          </div>
        </FormSection>

        {/* Representative Information */}
        <FormSection title="Representative Information">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <FormLabel>First Name</FormLabel>
                <FormInput
                  value={
                    formData.representativeName?.firstName ||
                    formData.firstName ||
                    ""
                  }
                  onChange={(e) => {
                    handleNestedChange(
                      "representativeName",
                      "firstName",
                      e.target.value
                    );
                    onChange({
                      target: { name: "firstName", value: e.target.value },
                    });
                  }}
                  disabled={loading}
                  placeholder="First name"
                />
              </div>

              <div>
                <FormLabel>Middle Initial</FormLabel>
                <FormInput
                  value={
                    formData.representativeName?.middleInitial ||
                    formData.middleName ||
                    ""
                  }
                  onChange={(e) => {
                    handleNestedChange(
                      "representativeName",
                      "middleInitial",
                      e.target.value
                    );
                    onChange({
                      target: { name: "middleName", value: e.target.value },
                    });
                  }}
                  disabled={loading}
                  placeholder="M.I."
                />
              </div>

              <div>
                <FormLabel>Last Name</FormLabel>
                <FormInput
                  value={
                    formData.representativeName?.lastName ||
                    formData.lastName ||
                    ""
                  }
                  onChange={(e) => {
                    handleNestedChange(
                      "representativeName",
                      "lastName",
                      e.target.value
                    );
                    onChange({
                      target: { name: "lastName", value: e.target.value },
                    });
                  }}
                  disabled={loading}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormLabel>Title / Position</FormLabel>
                <FormInput
                  name="title"
                  value={formData.title || ""}
                  onChange={onChange}
                  disabled={loading}
                  placeholder="e.g. Manager, CEO, Owner"
                />
              </div>

              <div>
                <FormLabel>Contact Email</FormLabel>
                <FormInput
                  type="email"
                  name="emailAddress"
                  value={
                    formData.emailAddress ||
                    formData.email ||
                    ""
                  }
                  onChange={(e) => {
                    onChange(e);
                    onChange({
                      target: { name: "email", value: e.target.value },
                    });
                  }}
                  disabled={loading}
                  placeholder="representative@email.com"
                />
              </div>

              <div>
                <FormLabel required>Phone</FormLabel>
                <FormInput
                  name="phone"
                  value={formData.phone || ""}
                  onChange={onChange}
                  required
                  disabled={loading}
                  placeholder="Contact phone number"
                />
              </div>

              <div>
                <FormLabel>Viber</FormLabel>
                <FormInput
                  name="viber"
                  value={formData.viber || ""}
                  onChange={onChange}
                  disabled={loading}
                  placeholder="Viber number"
                />
              </div>
            </div>
          </div>
        </FormSection>

        {/* Assignment */}
        <FormSection title="Assignment">
          <div>
            <FormLabel>Handling Officer</FormLabel>
            <Select
              {...getSelectProps({ isClearable: true })}
              options={handlingOfficerOptions}
              value={
                handlingOfficerOptions.find(
                  (o) =>
                    String(o.value) ===
                    String(formData.handlingOfficer || formData.leadAssignee || "")
                ) || null
              }
              onChange={(option) => {
                const value = option?.value || "";
                onChange({
                  target: { name: "handlingOfficer", value },
                });
                onChange({
                  target: { name: "leadAssignee", value },
                });
              }}
              isDisabled={loading || (editingLead && !permissions.canAssign)}
              placeholder="Select handling officer..."
              formatOptionLabel={({ user }) => (
                <div className="flex items-center gap-2">
                  <img
                    src={getProfileImage(user)}
                    alt=""
                    className="w-6 h-6 rounded-full border object-cover"
                  />
                  <span>{getDisplayName(user, { includeSuffix: true })}</span>
                </div>
              )}
            />
          </div>
        </FormSection>

        {/* CRM Details */}
        <FormSection title="CRM Details">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormLabel required>Status</FormLabel>
                <select
                  name="status"
                  value={formData.status || "Contacted"}
                  onChange={onChange}
                  required
                  disabled={loading}
                  className={inputClass}
                >
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Converted">Converted</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              <div>
                <FormLabel>Lead Source</FormLabel>
                <select
                  name="leadSource"
                  value={formData.leadSource || "Website"}
                  onChange={onChange}
                  disabled={loading}
                  className={inputClass}
                >
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Event">Event</option>
                  <option value="Other">Others</option>
                </select>
              </div>
            </div>

            <div>
              <FormLabel>Notes</FormLabel>
              <FormTextarea
                name="notes"
                value={formData.notes || ""}
                onChange={onChange}
                rows={4}
                disabled={loading}
                placeholder="Add notes about this lead"
              />
            </div>
          </div>
        </FormSection>

        {/* Follow-up Task */}
        {!editingLead && followUpTask && (
          <FormSection title="Follow-up Task">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={followUpTask.enabled}
                onChange={(e) => onFollowUpChange("enabled", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                disabled={loading}
              />
              <span className="text-sm text-gray-700">
                Create a follow-up task for this lead (recommended)
              </span>
            </label>

            {followUpTask.enabled && (
              <div className="mt-3 space-y-3 pl-1">
                <div>
                  <FormLabel required>Subject</FormLabel>
                  <FormInput
                    name="subject"
                    value={
                      followUpTask.subject || `Follow up with ${leadName}`
                    }
                    onChange={(e) =>
                      onFollowUpChange("subject", e.target.value)
                    }
                    placeholder={`Follow up with ${leadName}`}
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FormLabel required>Due Date</FormLabel>
                    <FormInput
                      name="dueDate"
                      value={followUpTask.dueDate || ""}
                      onChange={(e) =>
                        onFollowUpChange("dueDate", e.target.value)
                      }
                      type="date"
                      required={followUpTask.enabled}
                      min={today}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <FormLabel>Reminder</FormLabel>
                    <FormInput
                      name="reminderAt"
                      value={followUpTask.reminderAt || ""}
                      onChange={(e) =>
                        onFollowUpChange("reminderAt", e.target.value)
                      }
                      type="date"
                      min={today}
                      max={formData.dueDate || undefined}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      {...getSelectProps({ isSearchable: false })}
                      options={TASK_PRIORITY_OPTIONS}
                      value={
                        followUpTask.priority
                          ? {
                              label: followUpTask.priority,
                              value: followUpTask.priority,
                            }
                          : null
                      }
                      onChange={(opt) =>
                        onFollowUpChange("priority", opt?.value ?? "Low")
                      }
                      isDisabled={loading}
                    />
                  </div>
                  <div>
                    <FormLabel>Type</FormLabel>
                    <Select
                      {...getSelectProps({ isSearchable: false })}
                      options={TASK_TYPE_OPTIONS}
                      value={{
                        label: followUpTask.taskType,
                        value: followUpTask.taskType,
                      }}
                      onChange={(opt) =>
                        onFollowUpChange("taskType", opt?.value ?? "Call")
                      }
                      isDisabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <FormLabel>
                    <span className="flex items-center gap-1">
                      Assign Task To
                      {permissions.canAssign &&
                        !formData.handlingOfficer &&
                        !formData.leadAssignee && (
                          <span className="relative group">
                            <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 text-xs text-white bg-gray-700 rounded-md px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center leading-snug">
                              Assign a handling officer to this lead above to
                              delegate this task
                            </span>
                          </span>
                        )}
                    </span>
                  </FormLabel>

                  <div
                    className={`flex items-center gap-2 px-3 py-2 border rounded-md min-h-9.5 ${
                      permissions.canAssign &&
                      !formData.handlingOfficer &&
                      !formData.leadAssignee
                        ? "bg-amber-50 border-amber-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    {permissions.canAssign ? (
                      formData.handlingOfficer || formData.leadAssignee ? (
                        (() => {
                          const agent = handlingOfficerOptions.find(
                            (o) =>
                              String(o.value) ===
                              String(
                                formData.handlingOfficer || formData.leadAssignee
                              )
                          );
                          return agent ? (
                            <>
                              <img
                                src={getProfileImage(agent.user)}
                                alt="avatar"
                                className="w-5 h-5 rounded-full object-cover border shrink-0"
                              />
                              <span className="text-sm text-gray-600">
                                {getDisplayName(agent.user, {
                                  includeSuffix: true,
                                })}
                              </span>
                            </>
                          ) : null;
                        })()
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <UserRound className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-sm text-amber-600">
                            Personal task — assign a handling officer above to
                            delegate
                          </span>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <UserRound className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-500">
                          You (personal task)
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mt-1">
                    {permissions.canAssign
                      ? formData.handlingOfficer || formData.leadAssignee
                        ? "Automatically assigned to the selected lead handling officer."
                        : "This task will be saved under your personal tasks."
                      : "This task will be assigned to you."}
                  </p>
                </div>

                <div>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormTextarea
                    value={followUpTask.description || ""}
                    onChange={(e) =>
                      onFollowUpChange("description", e.target.value)
                    }
                    placeholder={`e.g. Reach out to ${leadName} to discuss their interest and qualify the lead.`}
                    rows={3}
                    disabled={loading}
                  />
                </div>
              </div>
            )}
          </FormSection>
        )}
      </form>
    </FormDrawer>
  );
}