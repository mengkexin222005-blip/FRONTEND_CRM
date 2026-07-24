import { useEffect, useState } from "react";

import FormDrawer from "../../../components/form/FormDrawer";
import FormSection from "../../../components/form/FormSection";

import Select from "react-select";
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
  businessAddress: {
    houseNumber: "",
    streetAddress: "",
    city: "",
    province: "",
    country: "Philippines",
  },
  companyEmailAddress: "",
  companyWebsite: "",
  natureOfBusiness: "",
  numberOfEmployees: "",

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

  useEffect(() => {
    if (!open) return;

    if (editingProspect) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        handlingOfficer: editingProspect.handlingOfficer?._id || "",

        companyName: editingProspect.companyName || "",
        businessAddress: {
          houseNumber: editingProspect.businessAddress?.houseNumber || "",
          streetAddress: editingProspect.businessAddress?.streetAddress || "",
          city: editingProspect.businessAddress?.city || "",
          province: editingProspect.businessAddress?.province || "",
          country: editingProspect.businessAddress?.country || "Philippines",
        },
        companyEmailAddress: editingProspect.companyEmailAddress || "",
        companyWebsite: editingProspect.companyWebsite || "",
        natureOfBusiness: editingProspect.natureOfBusiness || "",
        numberOfEmployees: editingProspect.numberOfEmployees || "",

        ownerName: {
          lastName: editingProspect.ownerName?.lastName || "",
          firstName: editingProspect.ownerName?.firstName || "",
          middleInitial: editingProspect.ownerName?.middleInitial || "",
        },
        representativeName: {
          lastName: editingProspect.representativeName?.lastName || "",
          firstName: editingProspect.representativeName?.firstName || "",
          middleInitial:
            editingProspect.representativeName?.middleInitial || "",
        },
        title: editingProspect.title || "",
        emailAddress: editingProspect.emailAddress || "",
        viber: editingProspect.viber || "",
        phone: editingProspect.phone || "",

        status: editingProspect.status || "New",
        leadSource: editingProspect.leadSource || "Website",
        notes: editingProspect.notes || "",
      });
    } else {
      setFormData(initialFormData);
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

        <FormSection title="Company Profile">
          <div>
            <FormLabel required>Company Name</FormLabel>
            <FormInput
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
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
              placeholder="company@email.com"
            />
          </div>

          <div>
            <FormLabel>Company Website</FormLabel>
            <FormInput
              name="companyWebsite"
              value={formData.companyWebsite}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <FormLabel>Nature of Business</FormLabel>
            <FormInput
              name="natureOfBusiness"
              value={formData.natureOfBusiness}
              onChange={handleChange}
              placeholder="e.g. Construction, Retail, IT"
            />
          </div>

          <div>
            <FormLabel>Number of Employees</FormLabel>
            <FormInput
              name="numberOfEmployees"
              value={formData.numberOfEmployees}
              onChange={handleChange}
              placeholder="e.g. 1-10, 50+, 100+"
            />
          </div>
        </FormSection>

        <FormSection title="Assignment">
            <div>
              <FormLabel>Handling Officer</FormLabel>

              <Select
                {...getSelectProps({ isClearable: true })}
                options={handlingOfficerOptions}
                value={
                  handlingOfficerOptions.find(
                    (o) => o.value === formData.handlingOfficer
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

        <FormSection title="Business Address">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FormLabel>House / Building No.</FormLabel>
              <FormInput
                value={formData.businessAddress.houseNumber}
                onChange={(event) =>
                  handleNestedChange(
                    "businessAddress",
                    "houseNumber",
                    event.target.value,
                  )
                }
                placeholder="House or building number"
              />
            </div>
          
            <div>
              <FormLabel>Street Address</FormLabel>
              <FormInput
                value={formData.businessAddress.streetAddress}
                onChange={(event) =>
                  handleNestedChange(
                    "businessAddress",
                    "streetAddress",
                    event.target.value,
                  )
                }
                placeholder="Street address"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FormLabel>City</FormLabel>
              <FormInput
                value={formData.businessAddress.city}
                onChange={(event) =>
                  handleNestedChange(
                    "businessAddress",
                    "city",
                    event.target.value,
                  )
                }
                placeholder="City"
              />
            </div>

            <div>
              <FormLabel>Province</FormLabel>
              <FormInput
                value={formData.businessAddress.province}
                onChange={(event) =>
                  handleNestedChange(
                    "businessAddress",
                    "province",
                    event.target.value,
                  )
                }
                placeholder="Province"
              />
            </div>
          </div>

          <div>
            <FormLabel>Country</FormLabel>
            <FormInput
              value={formData.businessAddress.country}
              onChange={(event) =>
                handleNestedChange(
                  "businessAddress",
                  "country",
                  event.target.value,
                )
              }
              placeholder="Country"
            />
          </div>
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
                    event.target.value,
                  )
                }
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
                    event.target.value,
                  )
                }
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
                    event.target.value,
                  )
                }
                placeholder="Last name"
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Representative Information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <FormLabel>First Name</FormLabel>
              <FormInput
                value={formData.representativeName.firstName}
                onChange={(event) =>
                  handleNestedChange(
                    "representativeName",
                    "firstName",
                    event.target.value,
                  )
                }
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
                    event.target.value,
                  )
                }
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
                    event.target.value,
                  )
                }
                placeholder="Last name"
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
                placeholder="representative@email.com"
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
                placeholder="Viber number"
              />
            </div>

            <div>
              <FormLabel required>Phone</FormLabel>
              <FormInput
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Contact phone number"
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="CRM Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FormLabel required>Status</FormLabel>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            <div>
              <FormLabel>Lead Source</FormLabel>
              <select
                name="leadSource"
                value={formData.leadSource}
                onChange={handleChange}
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
              placeholder="Add notes about this prospect"
            />
          </div>
        </FormSection>
      </form>
    </FormDrawer>
  );
}