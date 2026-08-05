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
  industry: "",
  natureOfBusiness: "",
  numberOfEmployees: "",

  firstName: "",
  middleName: "",
  lastName: "",
  suffixName: "",
  birthday: "",
  gender: "",
  company: "",
  email: "",
  phone: "",

  ownerName: {
    firstName: "",
    middleName: "",
    lastName: "",
  },

  representativeName: {
    firstName: "",
    middleName: "",
    lastName: "",
    suffixName: "",
    birthday: "",
    gender: "",
  },
  title: "",

  country: "",
  province: "",
  city: "",
  barangay: "",
  street: "",
  houseNumber: "",
  zipCode: "",

  emailAddress: "",
  viber: "",
  status: "New",
  leadSource: "Website",
  notes: "",
};

function buildProspectPayload(formData) {
  const representative = formData.representativeName || {};
  const owner = formData.ownerName || {};
  
  const normalizedAddress = {
    country: formData.country || "Philippines",
    province: formData.province || "",
    municipality: formData.city || "",
    city: formData.city || "",
    barangay: formData.barangay || "",
    street: formData.street || formData.streetAddress || "",
    streetAddress: formData.street || formData.streetAddress || "",
    houseNumber: formData.houseNumber || "",
    zipCode: formData.zipCode || "",
  };

  const firstName = formData.firstName || representative.firstName || "";
  const middleName = formData.middleName || representative.middleName || representative.middleInitial || "";
  const lastName = formData.lastName || representative.lastName || "";
  const email = formData.email || formData.emailAddress || formData.companyEmailAddress || "";

  return {
    ...formData,
    companyName: formData.companyName || formData.company || "",
    companyEmailAddress: formData.companyEmailAddress || formData.emailAddress || email || "",
    companyWebsite: formData.companyWebsite || "",
    industry: formData.industry || formData.natureOfBusiness || "",
    natureOfBusiness: formData.industry || formData.natureOfBusiness || "",
    ownerName: {
      firstName: owner.firstName || "",
      middleName: owner.middleName || owner.middleInitial || "",
      middleInitial: owner.middleName || owner.middleInitial || "",
      lastName: owner.lastName || "",
    },
    representativeName: {
      firstName,
      middleName,
      middleInitial: middleName,
      lastName,
      suffixName: formData.suffixName || representative.suffixName || "",
      birthday: formData.birthday || representative.birthday || "",
      gender: formData.gender || representative.gender || "",
    },
    firstName,
    middleName,
    lastName,
    emailAddress: email,
    email,
    phone: formData.phone || "",
    title: formData.title || "",
    
    // Explicit top-level address fields
    country: formData.country || "Philippines",
    province: formData.province || "",
    city: formData.city || "",
    municipality: formData.city || "",
    barangay: formData.barangay || "",
    street: formData.street || "",
    houseNumber: formData.houseNumber || "",
    zipCode: formData.zipCode || "",

    address: normalizedAddress,
    businessAddress: normalizedAddress,
  };
}

export default function ProspectForm({
  open,
  editingProspect,
  users = [],
  addressCodes = {}, 
  onAddressSelect,
  onSubmit,
  onClose,
  onCancel,
  loading,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [addressCodesState, setAddressCodesState] = useState({
    provinceCode: "",
    municipalityCode: "",
    isNCRCity: false,
  });

  useEffect(() => {
    if (!open) return;

    if (editingProspect) {
      // Safely fetch address details from all possible locations
      const address = editingProspect.businessAddress || editingProspect.address || {};
      const ownerName = editingProspect.ownerName || {};
      const representativeName = editingProspect.representativeName || {};

      const representativeFirstName =
        representativeName.firstName || editingProspect.firstName || "";
      const representativeMiddleName =
        representativeName.middleName ||
        representativeName.middleInitial ||
        editingProspect.middleName ||
        "";
      const representativeLastName =
        representativeName.lastName || editingProspect.lastName || "";

      const handlingOfficerId =
        typeof editingProspect.handlingOfficer === "object" && editingProspect.handlingOfficer !== null
          ? editingProspect.handlingOfficer._id || editingProspect.handlingOfficer.id || ""
          : editingProspect.handlingOfficer || "";

      // Extract raw Zip code directly, ensuring empty string if missing or fallback numeric codes
      const rawZipCode = 
        editingProspect.zipCode ?? 
        address.zipCode ?? 
        editingProspect.businessAddress?.zipCode ?? 
        "";

      const extractedProvince = address.province || editingProspect.province || "";
      const extractedCity = address.city || address.municipality || editingProspect.city || editingProspect.municipality || "";
      const extractedBarangay = address.barangay || editingProspect.barangay || "";
      const extractedStreet = address.street || address.streetAddress || editingProspect.street || editingProspect.streetAddress || "";
      const extractedHouseNumber = address.houseNumber || editingProspect.houseNumber || "";
      const extractedCountry = address.country || editingProspect.country || "Philippines";

      const extractedProvinceCode = addressCodes?.provinceCode || editingProspect.provinceCode || address.provinceCode || "";
      const extractedMunicipalityCode = addressCodes?.municipalityCode || editingProspect.municipalityCode || address.municipalityCode || "";

      setFormData({
        ...initialFormData,
        ...editingProspect,
        handlingOfficer: String(handlingOfficerId),
        companyName: editingProspect.companyName || editingProspect.company || "",
        companyEmailAddress:
          editingProspect.companyEmailAddress ||
          editingProspect.companyEmail ||
          editingProspect.emailAddress ||
          "",
        ownerName: {
          ...initialFormData.ownerName,
          ...ownerName,
          middleName:
            ownerName.middleName ||
            ownerName.middleInitial ||
            "",
        },
        representativeName: {
          ...initialFormData.representativeName,
          ...representativeName,
        },
        industry:
          editingProspect.industry || editingProspect.natureOfBusiness || "",
        natureOfBusiness:
          editingProspect.natureOfBusiness || editingProspect.industry || "",
        firstName: representativeFirstName,
        middleName: representativeMiddleName,
        lastName: representativeLastName,
        suffixName: representativeName.suffixName || editingProspect.suffixName || "",
        birthday: representativeName.birthday || editingProspect.birthday || "",
        gender: representativeName.gender || editingProspect.gender || "",
        company: editingProspect.companyName || editingProspect.company || "",
        email:
          editingProspect.email ||
          editingProspect.emailAddress ||
          editingProspect.companyEmailAddress ||
          editingProspect.companyEmail ||
          "",
        emailAddress:
          editingProspect.emailAddress ||
          editingProspect.companyEmailAddress ||
          editingProspect.companyEmail ||
          "",
        phone: editingProspect.phone || "",
        
        // Exact address values
        country: extractedCountry,
        province: extractedProvince,
        city: extractedCity,
        barangay: extractedBarangay,
        street: extractedStreet,
        houseNumber: extractedHouseNumber,
        zipCode: String(rawZipCode),
      });

      setAddressCodesState({
        provinceCode: extractedProvinceCode,
        municipalityCode: extractedMunicipalityCode,
        isNCRCity: addressCodes?.isNCRCity || editingProspect.isNCRCity || address.isNCRCity || false,
      });
    } else {
      setFormData(initialFormData);
      setAddressCodesState({
        provinceCode: "",
        municipalityCode: "",
        isNCRCity: false,
      });
    }
  }, [open, editingProspect, addressCodes]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleAddressSelect = (patch = {}, codePatch = {}) => {
    setFormData((previous) => ({ ...previous, ...patch }));
    setAddressCodesState((previous) => ({ ...previous, ...codePatch }));
    if (onAddressSelect) {
      onAddressSelect(patch, codePatch);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(buildProspectPayload(formData));
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
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-5">
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

        <FormSection title="Personal Information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <FormLabel required>First Name</FormLabel>
              <FormInput
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="e.g. Juan"
              />
            </div>
            <div>
              <FormLabel>Middle Name</FormLabel>
              <FormInput
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. Dela"
              />
            </div>
            <div>
              <FormLabel required>Last Name</FormLabel>
              <FormInput
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
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
                name="suffixName"
                value={formData.suffixName}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. Jr., Sr., III"
              />
            </div>
            <div>
              <FormLabel>Date of Birth</FormLabel>
              <FormInput
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div>
              <FormLabel>Gender</FormLabel>
              <FormInput
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. Male, Female"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FormLabel required>Company</FormLabel>
              <FormInput
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="e.g. ABC Corporation"
              />
            </div>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FormLabel required>Lead Source</FormLabel>
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
          </div>
        </FormSection>

        <FormSection title="Company Details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <FormLabel>Company Email</FormLabel>
              <FormInput
                type="email"
                name="companyEmailAddress"
                value={formData.companyEmailAddress}
                onChange={handleChange}
                disabled={loading}
                placeholder="company@email.com"
              />
            </div>
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

        <FormSection title="Account Creation">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FormLabel>Email</FormLabel>
              <FormInput
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                placeholder="representative@email.com"
              />
            </div>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            <div>
              <FormLabel>Status</FormLabel>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
                className={inputClass}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>
        </FormSection>

        <FormSection title="Address Information">
          <PhAddressFields
            formData={formData}
            addressCodes={addressCodesState}
            onAddressSelect={handleAddressSelect}
            onChange={handleChange}
          />
        </FormSection>

        <FormSection title="Notes">
          <FormTextarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            disabled={loading}
            placeholder="Add notes about this prospect"
          />
        </FormSection>
      </form>
    </FormDrawer>
  );
}