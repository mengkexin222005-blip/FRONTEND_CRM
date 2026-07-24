import { useMemo } from "react";
import Select from "react-select";

import { getSelectProps } from "../../components/select/selectConfig";
import FormDrawer from "../../components/form/FormDrawer";
import FormSection from "../../components/form/FormSection";
import AvatarUploader from "../../components/form/AvatarUploader";
import PhAddressFields from "../../components/form/PhAddressFields";
import { FormLabel, FormInput } from "../../components/form/FormField";

import { getProfileImage } from "../../utils/avatar";
import { getDisplayName } from "../../utils/name";

import { LEAD_SOURCE_OPTIONS } from "../../constants/options";

const STATUS_OPTIONS = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
  { label: "Lost", value: "Lost" },
];

export default function ClientForm({
  open,
  editingClient,
  formData,
  addressCodes,
  users = [],
  permissions = {},
  preview,
  loading,
  onChange,
  onAddressSelect,
  onAvatarChange,
  onClearAvatar,
  onSubmit,
  onClose,
  onCancel,
}) {
  const handlingOfficerOptions = useMemo(
    () =>
      users.map((u) => ({
        label: `${getDisplayName(u, { includeSuffix: true })} — ${u.role}`,
        value: u._id,
        user: u,
      })),
    [users]
  );

  return (
    <FormDrawer
      open={open}
      title={editingClient ? "Edit Client" : "Add Client"}
      formId="client-form"
      loading={loading}
      onClose={onClose}
      onCancel={onCancel}
    >
      <form id="client-form" onSubmit={onSubmit} className="space-y-5">
        <AvatarUploader
          preview={preview}
          onAvatarChange={onAvatarChange}
          onClearAvatar={onClearAvatar}
        />

        {/* Assignment — create mode only */}
        {!editingClient && permissions.canAssign && (
          <FormSection title="Assignment">
            <div>
              <FormLabel>Handling Officer (optional)</FormLabel>
              <Select
                {...getSelectProps({ isClearable: true })}
                options={handlingOfficerOptions}
                value={
                  handlingOfficerOptions.find(
                    (o) => String(o.value) === String(formData.assignedTo || "")
                  ) || null
                }
                onChange={(opt) =>
                  onChange({
                    target: {
                      name: "assignedTo",
                      value: opt?.value ? String(opt.value) : "",
                    },
                  })
                }
                placeholder="Select handling officer…"
                formatOptionLabel={({ user }) => (
                  <div className="flex items-center gap-2">
                    <img
                      src={getProfileImage(user)}
                      alt="avatar"
                      className="w-6 h-6 rounded-full object-cover border"
                    />
                    <span>{getDisplayName(user, { includeSuffix: true })}</span>
                  </div>
                )}
              />
            </div>
          </FormSection>
        )}

        {/* Personal Information */}
        <FormSection title="Personal Information">
          {/* 3-Column Grid for Names */}
          <div className="grid grid-cols-3 gap-3">
            {[
              ["firstName", "First Name", true, "e.g. Juan"],
              ["middleName", "Middle Name", false, "e.g. Dela"],
              ["lastName", "Last Name", true, "e.g. Cruz"],
            ].map(([name, label, req, placeholder]) => (
              <div key={name}>
                <FormLabel required={req}>{label}</FormLabel>
                <FormInput
                  name={name}
                  value={formData[name] ?? ""}
                  onChange={onChange}
                  required={req}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>

          {/* 3-Column Grid for Demographics */}
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div>
              <FormLabel>Suffix (Optional)</FormLabel>
              <FormInput
                name="suffixName"
                value={formData.suffixName ?? ""}
                onChange={onChange}
                placeholder="e.g. Jr., III"
              />
            </div>
            <div>
              <FormLabel required>Date of Birth</FormLabel>
              <FormInput
                name="birthday"
                value={formData.birthday ?? ""}
                onChange={onChange}
                type="date"
                required
              />
            </div>
            <div>
              <FormLabel required>Gender</FormLabel>
              <FormInput
                name="gender"
                value={formData.gender ?? ""}
                onChange={onChange}
                placeholder="e.g. Male, Female"
                required
              />
            </div>
          </div>

          {/* 2-Column Grid for Company and Metadata */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <FormLabel required>Company</FormLabel>
              <FormInput
                name="company"
                value={formData.company ?? ""}
                onChange={onChange}
                placeholder="e.g. ABC Corporation"
                required
              />
            </div>
            <div>
              <FormLabel required>Status</FormLabel>
              <Select
                {...getSelectProps({ isSearchable: false })}
                options={STATUS_OPTIONS}
                value={
                  formData.status
                    ? { label: formData.status, value: formData.status }
                    : null
                }
                onChange={(opt) =>
                  onChange({
                    target: { name: "status", value: opt?.value ?? "Active" },
                  })
                }
              />
            </div>

            <div>
              <FormLabel required>Lead Source</FormLabel>
              <Select
                {...getSelectProps({ isSearchable: false })}
                options={LEAD_SOURCE_OPTIONS}
                value={
                  formData.leadSource
                    ? { label: formData.leadSource, value: formData.leadSource }
                    : null
                }
                onChange={(opt) =>
                  onChange({
                    target: { name: "leadSource", value: opt?.value ?? "" },
                  })
                }
                placeholder="Select lead source"
              />
            </div>
            <div>
              <FormLabel required>Industry</FormLabel>
              <FormInput
                name="industry"
                value={formData.industry ?? ""}
                onChange={onChange}
                placeholder="e.g. Technology, Marketing, etc."
                required
              />
            </div>
          </div>
        </FormSection>

        {/* Address Information */}
        <FormSection title="Address Information">
          <PhAddressFields
            formData={formData}
            addressCodes={addressCodes}
            onAddressSelect={onAddressSelect}
            onChange={onChange}
          />
        </FormSection>

        {/* Account Creation */}
        <FormSection title="Account Creation">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel required>Email</FormLabel>
              <FormInput
                name="email"
                value={formData.email ?? ""}
                onChange={onChange}
                type="email"
                placeholder="e.g. juan@email.com"
                required
              />
            </div>
            <div>
              <FormLabel required>Contact Number</FormLabel>
              <FormInput
                name="phone"
                value={formData.phone ?? ""}
                onChange={onChange}
                type="tel"
                placeholder="e.g. 09123456789"
                required
              />
            </div>
          </div>
        </FormSection>

        {/* Additional Notes */}
        <FormSection title="Additional Notes">
          <div>
            <FormLabel>Notes</FormLabel>
            <textarea
              name="notes"
              value={formData.notes ?? ""}
              onChange={onChange}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              placeholder="Internal notes…"
            />
          </div>
        </FormSection>
      </form>
    </FormDrawer>
  );
}