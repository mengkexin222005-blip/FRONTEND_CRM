import { useEffect, useState } from "react";
import Select from "react-select";

import FormDrawer from "../../../components/form/FormDrawer";
import FormSection from "../../../components/form/FormSection";
import PhAddressFields from "../../../components/form/PhAddressFields";
import { getSelectProps } from "../../../components/select/selectConfig";
import { getDisplayName } from "../../../utils/name";
import { getProfileImage } from "../../../utils/avatar";

import {
  FormInput,
  FormLabel,
  FormTextarea,
  inputClass,
} from "../../../components/form/FormField";

const FORM_ID = "prospect-form";

const initialFormData = {
  handlingOfficer: "",

  // Company Profile (Matches Lead: company, industry)
  companyName: "",
  companyEmailAddress: "",
  companyWebsite: "",
  industry: "",
  numberOfEmployees: "",

  // Owner Information
  ownerName: {
    firstName: "",
    middleName: "",
    lastName: "",
  },

  // Representative Info (Matches Lead: firstName, middleName, lastName, suffixName, birthday, gender)
  representativeName: {
    firstName: "",
    middleName: "",
    lastName: "",
    suffixName: "",
    birthday: "",
    gender: "",
  },
  title: "",

  // Address Fields (PhAddressFields compatibility)
  regionCode: "",
  provinceCode: "",
  cityCode: "",
  barangayCode: "",
  regionName: "",
  provinceName: "",
  cityName: "",
  barangayName: "",
  streetAddress: "",
  zipCode: "",

  // Contacts (Matches Lead: email, phone)
  emailAddress: "",
  phone: "",
  viber: "",

  // CRM Details
  status: "New",
  leadSource: "Website",
  notes: "",
};

export default function ProspectForm({
  open,
  editingProspect,
  users = [],
  addressCodes = {}, // Prevents runtime crashes while PSGC codes load
  onAddressSelect,
  onSubmit,
  onClose,
  onCancel,
  loading,
}) {
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (!open) return;

    if (editingProspect) {
      setFormData({
        ...initialFormData,
        ...editingProspect,
        handlingOfficer:
          editingProspect.handlingOfficer?._id ||
          editingProspect.handlingOfficer ||
          "",
        ownerName: {
          ...initialFormData.ownerName,
          ...editingProspect.ownerName,
          // Fallback if older records used middleInitial
          middleName:
            editingProspect.ownerName?.middleName ||
            editingProspect.ownerName?.middleInitial ||
            "",
        },
        representativeName: {
          ...initialFormData.representativeName,
          ...editingProspect.representativeName,
        },
        industry:
          editingProspect.industry || editingProspect.natureOfBusiness || "",
      });
    } else {
      setFormData(initialFormData);
    }
  }, [open, editingProspect]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleNestedChange = (group, field, value) => {
    setFormData((previous) => ({
      ...previous,
      [group]: {
        ...previous[group],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(formData);
  };

  const handlingOfficerOptions = users.map((u) => ({
    label: `${getDisplayName(u, { includeSuffix: true })} — ${u.role}`,
    value: u._id,
    user: u,
  }));

  return (
    <FormDrawer
      open={open}
      title={editingProspect ? "Edit Prospect" : "Add Prospect"}
      formId={FORM_ID}
      loading={loading}
      onClose={onClose}
      onCancel={onCancel}
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-5">
        {/* Company Profile */}
        <FormSection title="Company Profile">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FormLabel required>Company Name</FormLabel>
              <FormInput
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <FormLabel required>Company Email</FormLabel>
              <FormInput
                type="email"
                name="companyEmailAddress"
                value={formData.companyEmailAddress}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="company@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <FormLabel>Website</FormLabel>
              <FormInput
                name="companyWebsite"
                value={formData.companyWebsite}
                onChange={handleChange}
                disabled={loading}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <FormLabel>Industry</FormLabel>
              <FormInput
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. Technology, Retail"
              />
            </div>
            <div>
              <FormLabel>Number of Employees</FormLabel>
              <FormInput
                name="numberOfEmployees"
                value={formData.numberOfEmployees}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. 1-10, 50+"
              />
            </div>
          </div>
        </FormSection>

        {/* Handling Officer */}
        <FormSection title="Assignment">
          <div>
            <FormLabel>Handling Officer</FormLabel>
            <Select
              {...getSelectProps({ isClearable: true })}
              options={handlingOfficerOptions}
              value={
                handlingOfficerOptions.find(
                  (o) =>
                    String(o.value) === String(formData.handlingOfficer || "")
                ) || null
              }
              onChange={(option) =>
                handleChange({
                  target: {
                    name: "handlingOfficer",
                    value: option?.value || "",
                  },
                })
              }
              isDisabled={loading}
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

        {/* Owner Information */}
        <FormSection title="Owner Information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <FormLabel>First Name</FormLabel>
              <FormInput
                value={formData.ownerName.firstName}
                onChange={(e) =>
                  handleNestedChange("ownerName", "firstName", e.target.value)
                }
                disabled={loading}
                placeholder="First name"
              />
            </div>
            <div>
              <FormLabel>Middle Name</FormLabel>
              <FormInput
                value={formData.ownerName.middleName}
                onChange={(e) =>
                  handleNestedChange("ownerName", "middleName", e.target.value)
                }
                disabled={loading}
                placeholder="Middle name"
              />
            </div>
            <div>
              <FormLabel>Last Name</FormLabel>
              <FormInput
                value={formData.ownerName.lastName}
                onChange={(e) =>
                  handleNestedChange("ownerName", "lastName", e.target.value)
                }
                disabled={loading}
                placeholder="Last name"
              />
            </div>
          </div>
        </FormSection>

        {/* Representative Information (Matches Lead schema) */}
        <FormSection title="Representative Information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <FormLabel required>First Name</FormLabel>
              <FormInput
                value={formData.representativeName.firstName}
                onChange={(e) =>
                  handleNestedChange("representativeName", "firstName", e.target.value)
                }
                required
                disabled={loading}
                placeholder="e.g. Juan"
              />
            </div>
            <div>
              <FormLabel>Middle Name</FormLabel>
              <FormInput
                value={formData.representativeName.middleName}
                onChange={(e) =>
                  handleNestedChange("representativeName", "middleName", e.target.value)
                }
                disabled={loading}
                placeholder="e.g. Dela"
              />
            </div>
            <div>
              <FormLabel required>Last Name</FormLabel>
              <FormInput
                value={formData.representativeName.lastName}
                onChange={(e) =>
                  handleNestedChange("representativeName", "lastName", e.target.value)
                }
                required
                disabled={loading}
                placeholder="e.g. Cruz"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <FormLabel>Suffix (Optional)</FormLabel>
              <FormInput
                value={formData.representativeName.suffixName}
                onChange={(e) =>
                  handleNestedChange("representativeName", "suffixName", e.target.value)
                }
                disabled={loading}
                placeholder="e.g. Jr., Sr., III"
              />
            </div>
            <div>
              <FormLabel>Date of Birth</FormLabel>
              <FormInput
                type="date"
                value={formData.representativeName.birthday}
                onChange={(e) =>
                  handleNestedChange("representativeName", "birthday", e.target.value)
                }
                disabled={loading}
              />
            </div>
            <div>
              <FormLabel>Gender</FormLabel>
              <FormInput
                value={formData.representativeName.gender}
                onChange={(e) =>
                  handleNestedChange("representativeName", "gender", e.target.value)
                }
                disabled={loading}
                placeholder="e.g. Male, Female"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FormLabel>Title / Position</FormLabel>
              <FormInput
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. Manager, CEO"
              />
            </div>
            <div>
              <FormLabel>Contact Email</FormLabel>
              <FormInput
                type="email"
                name="emailAddress"
                value={formData.emailAddress}
                onChange={handleChange}
                disabled={loading}
                placeholder="representative@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FormLabel required>Phone / Mobile</FormLabel>
              <FormInput
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="e.g. 09123456789"
              />
            </div>
            <div>
              <FormLabel>Viber</FormLabel>
              <FormInput
                name="viber"
                value={formData.viber}
                onChange={handleChange}
                disabled={loading}
                placeholder="Viber number"
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
            onChange={handleChange}
            disabled={loading}
          />
        </FormSection>

        {/* CRM Details */}
        <FormSection title="CRM Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FormLabel required>Status</FormLabel>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                disabled={loading}
                className={inputClass}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Unqualified">Unqualified</option>
                <option value="Lost">Lost</option>
                <option value="Converted">Converted</option>
              </select>
            </div>

            <div>
              <FormLabel>Lead Source</FormLabel>
              <select
                name="leadSource"
                value={formData.leadSource}
                onChange={handleChange}
                disabled={loading}
                className={inputClass}
              >
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Social Media">Social Media</option>
                <option value="Event">Event</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>

          <div>
            <FormLabel>Notes</FormLabel>
            <FormTextarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              disabled={loading}
              placeholder="Add notes about this prospect"
            />
          </div>
        </FormSection>
      </form>
    </FormDrawer>
  );
}