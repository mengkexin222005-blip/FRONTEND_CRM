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
  companyName: "",
  companyEmailAddress: "",
  companyWebsite: "",
  natureOfBusiness: "",
  numberOfEmployees: "",

  businessAddress: {
    houseNumber: "",
    streetAddress: "",
    city: "",
    province: "",
    country: "Philippines",
  },

  houseNumber: "",
  street: "",
  city: "",
  province: "",
  barangay: "",
  zipCode: "",
  country: "Philippines",

  ownerName: {
    lastName: "",
    firstName: "",
    middleInitial: "",
  },
  representativeName: {
    lastName: "",
    firstName: "",
    middleInitial: "",
  },
  title: "",
  emailAddress: "",
  viber: "",
  phone: "",

  status: "New",
  leadSource: "Website",
  notes: "",
};

const initialAddressCodes = {
  regionCode: "",
  provinceCode: "",
  municipalityCode: "",
  barangayCode: "",
  isNCRCity: false,
};

export default function ProspectForm({
  open,
  editingProspect,
  users = [],
  onSubmit,
  onClose,
  onCancel,
  loading,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [addressCodesState, setAddressCodesState] = useState(initialAddressCodes);

  useEffect(() => {
    if (!open) return;

    if (editingProspect) {
      const addr = editingProspect.address || {};
      const bAddr = editingProspect.businessAddress || {};

      const handlingOfficerId =
        typeof editingProspect.handlingOfficer === "object" && editingProspect.handlingOfficer !== null
          ? editingProspect.handlingOfficer._id || editingProspect.handlingOfficer.id || ""
          : editingProspect.handlingOfficer || "";

      const province = addr.province || bAddr.province || editingProspect.province || "";
      const city = addr.municipality || bAddr.city || editingProspect.city || "";
      const barangay = addr.barangay || editingProspect.barangay || "";
      const street = addr.street || bAddr.streetAddress || editingProspect.street || "";
      const houseNumber = addr.houseNumber || bAddr.houseNumber || editingProspect.houseNumber || "";
      const zipCode = addr.zipCode || editingProspect.zipCode || "";
      const country = addr.country || bAddr.country || editingProspect.country || "Philippines";

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        handlingOfficer: String(handlingOfficerId),
        companyName: editingProspect.companyName || "",
        companyEmailAddress: editingProspect.companyEmailAddress || "",
        companyWebsite: editingProspect.companyWebsite || "",
        natureOfBusiness: editingProspect.natureOfBusiness || editingProspect.industry || "",
        numberOfEmployees: editingProspect.numberOfEmployees || "",

        businessAddress: {
          houseNumber,
          streetAddress: street,
          city,
          province,
          country,
        },

        houseNumber,
        street,
        city,
        province,
        barangay,
        zipCode,
        country,

        ownerName: {
          lastName: editingProspect.ownerName?.lastName || "",
          firstName: editingProspect.ownerName?.firstName || "",
          middleInitial: editingProspect.ownerName?.middleInitial || "",
        },
        representativeName: {
          lastName: editingProspect.representativeName?.lastName || editingProspect.lastName || "",
          firstName: editingProspect.representativeName?.firstName || editingProspect.firstName || "",
          middleInitial:
            editingProspect.representativeName?.middleInitial || editingProspect.middleName || "",
        },
        title: editingProspect.title || "",
        emailAddress: editingProspect.emailAddress || editingProspect.email || "",
        viber: editingProspect.viber || "",
        phone: editingProspect.phone || "",

        status: editingProspect.status || "New",
        leadSource: editingProspect.leadSource || "Website",
        notes: editingProspect.notes || "",
      });

      setAddressCodesState({
        regionCode: addr.regionCode || "",
        provinceCode: addr.provinceCode || "",
        municipalityCode: addr.municipalityCode || "",
        barangayCode: addr.barangayCode || "",
        isNCRCity: addr.isNCRCity || false,
      });
    } else {
      setFormData(initialFormData);
      setAddressCodesState(initialAddressCodes);
    }
  }, [open, editingProspect]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
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

  const handleAddressSelect = (patch = {}, codePatch = {}) => {
    setFormData((previous) => {
      const updated = { ...previous, ...patch };
      return {
        ...updated,
        businessAddress: {
          ...updated.businessAddress,
          houseNumber: updated.houseNumber || updated.businessAddress.houseNumber,
          streetAddress: updated.street || updated.businessAddress.streetAddress,
          city: updated.city || updated.businessAddress.city,
          province: updated.province || updated.businessAddress.province,
          country: updated.country || updated.businessAddress.country,
        },
      };
    });
    setAddressCodesState((previous) => ({ ...previous, ...codePatch }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...formData,
      ...addressCodesState,
      businessAddress: {
        houseNumber: formData.houseNumber || formData.businessAddress.houseNumber || "",
        streetAddress: formData.street || formData.businessAddress.streetAddress || "",
        city: formData.city || formData.businessAddress.city || "",
        province: formData.province || formData.businessAddress.province || "",
        country: formData.country || formData.businessAddress.country || "Philippines",
      },
      address: {
        country: formData.country || "Philippines",
        province: formData.province || "",
        municipality: formData.city || "",
        barangay: formData.barangay || "",
        street: formData.street || "",
        houseNumber: formData.houseNumber || "",
        zipCode: formData.zipCode || "",
        regionCode: addressCodesState.regionCode || "",
        provinceCode: addressCodesState.provinceCode || "",
        municipalityCode: addressCodesState.municipalityCode || "",
        barangayCode: addressCodesState.barangayCode || "",
        isNCRCity: addressCodesState.isNCRCity || false,
      },
    };

    await onSubmit(payload);
  };

  const handlingOfficerOptions = users.map((u) => ({
    label: `${getDisplayName(u, { includeSuffix: true })} — ${u.role}`,
    value: String(u._id || u.id),
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
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-6">
        <FormSection title="Assignment">
          <div>
            <FormLabel>Handling Officer</FormLabel>
            <Select
              {...getSelectProps({ isClearable: true })}
              options={handlingOfficerOptions}
              value={
                handlingOfficerOptions.find(
                  (o) => String(o.value) === String(formData.handlingOfficer || "")
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

        <FormSection title="Company Profile">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
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
              <FormLabel required>Company Email Address</FormLabel>
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

            <div>
              <FormLabel>Company Website</FormLabel>
              <FormInput
                name="companyWebsite"
                value={formData.companyWebsite}
                onChange={handleChange}
                disabled={loading}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <FormLabel>Nature of Business</FormLabel>
              <FormInput
                name="natureOfBusiness"
                value={formData.natureOfBusiness}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. Construction, Retail, IT"
              />
            </div>

            <div>
              <FormLabel>Number of Employees</FormLabel>
              <FormInput
                name="numberOfEmployees"
                value={formData.numberOfEmployees}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. 1-10, 50+, 100+"
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Business Address">
          <PhAddressFields
            formData={formData}
            addressCodes={addressCodesState}
            onAddressSelect={handleAddressSelect}
            onChange={handleChange}
          />
        </FormSection>

        <FormSection title="Owner Information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <FormLabel>First Name</FormLabel>
              <FormInput
                value={formData.ownerName.firstName}
                onChange={(event) =>
                  handleNestedChange(
                    "ownerName",
                    "firstName",
                    event.target.value
                  )
                }
                disabled={loading}
                placeholder="First name"
              />
            </div>

            <div>
              <FormLabel>Middle Initial</FormLabel>
              <FormInput
                value={formData.ownerName.middleInitial}
                onChange={(event) =>
                  handleNestedChange(
                    "ownerName",
                    "middleInitial",
                    event.target.value
                  )
                }
                disabled={loading}
                placeholder="M.I."
              />
            </div>

            <div>
              <FormLabel>Last Name</FormLabel>
              <FormInput
                value={formData.ownerName.lastName}
                onChange={(event) =>
                  handleNestedChange(
                    "ownerName",
                    "lastName",
                    event.target.value
                  )
                }
                disabled={loading}
                placeholder="Last name"
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Representative Information">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <FormLabel>First Name</FormLabel>
                <FormInput
                  value={formData.representativeName.firstName}
                  onChange={(event) =>
                    handleNestedChange(
                      "representativeName",
                      "firstName",
                      event.target.value
                    )
                  }
                  disabled={loading}
                  placeholder="First name"
                />
              </div>

              <div>
                <FormLabel>Middle Initial</FormLabel>
                <FormInput
                  value={formData.representativeName.middleInitial}
                  onChange={(event) =>
                    handleNestedChange(
                      "representativeName",
                      "middleInitial",
                      event.target.value
                    )
                  }
                  disabled={loading}
                  placeholder="M.I."
                />
              </div>

              <div>
                <FormLabel>Last Name</FormLabel>
                <FormInput
                  value={formData.representativeName.lastName}
                  onChange={(event) =>
                    handleNestedChange(
                      "representativeName",
                      "lastName",
                      event.target.value
                    )
                  }
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
                  value={formData.title}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="e.g. Manager, CEO, Owner"
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

              <div>
                <FormLabel required>Phone</FormLabel>
                <FormInput
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Contact phone number"
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
          </div>
        </FormSection>

        <FormSection title="CRM Details">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {/* <option value="Contacted">Contacted</option> */}
                  <option value="Lost">Lost</option>
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
                  <option value="Facebook">Facebook</option>
                  <option value="Email">Email</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Phone Call">Phone Call</option>
                  <option value="Event">Event</option>
                  <option value="Other">Other</option>
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
          </div>
        </FormSection>
      </form>
    </FormDrawer>
  );
}