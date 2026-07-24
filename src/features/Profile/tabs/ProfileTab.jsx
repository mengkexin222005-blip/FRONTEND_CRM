import { useRef } from "react";

import PhAddressFields from "../../../components/form/PhAddressFields";
import { FormLabel, FormInput } from "../../../components/form/FormField";

import { getDisplayName } from "../../../utils/name";

export default function ProfileTab({ loading, form }) {
  const fileInputRef = useRef(null);

  if (loading || !form || !form.formData) {
    return <div className="p-6 text-sm text-gray-400">Loading...</div>;
  }

  const {
    formData,
    addressCodes,
    preview,
    addressData,
    handleChange,
    handleAddressChange,
    handleAddressSelect,
    handleAvatarChange,
  } = form;

  return (
    <>
      {/* Personal Information */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
        Personal Information
      </p>
      <div className="border border-gray-200 rounded-md p-5 mb-4">
        {/* Avatar row */}
        <div className="flex items-center gap-4 mb-3 pb-5 border-b border-gray-100">
          <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden shrink-0">
            {preview ? (
              <img
                src={preview}
                alt="profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                className="w-full h-full fill-gray-400 p-3"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">
              {getDisplayName(formData, { includeMiddleInitial: true })}
              <span className="font-medium text-gray-400">
                {" "}
                - {formData.employeeId}
              </span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{formData.email}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="bg-red-600 hover:bg-red-700 active:scale-95 text-white text-sm font-medium px-4 py-2 rounded-md transition-all whitespace-nowrap"
          >
            Change Photo
          </button>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-4 gap-x-8 gap-y-4">
          <div>
            <FormLabel required>First Name</FormLabel>
            <FormInput
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="e.g. Juan"
              required
            />
          </div>
          <div>
            <FormLabel required>Last Name</FormLabel>
            <FormInput
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="e.g. Cruz"
              required
            />
          </div>
          <div>
            <FormLabel>Middle Name</FormLabel>
            <FormInput
              name="middleName"
              value={formData.middleName ?? ""}
              onChange={handleChange}
              placeholder="e.g. Dela"
            />
          </div>
          <div>
            <FormLabel>Suffix</FormLabel>
            <FormInput
              name="suffixName"
              value={formData.suffixName ?? ""}
              onChange={handleChange}
              placeholder="e.g. Jr., III"
            />
          </div>
          <div className="col-span-2">
            <FormLabel required>Email Address</FormLabel>
            <FormInput
              name="email"
              value={formData.email}
              onChange={handleChange}
              type="email"
              placeholder="e.g. juan@email.com"
              required
            />
          </div>
          <div>
            <FormLabel required>Phone</FormLabel>
            <FormInput
              name="phone"
              value={formData.phone ?? ""}
              onChange={handleChange}
              type="tel"
              placeholder="e.g. 09123456789"
              required
            />
          </div>
          <div>
            <FormLabel required>Sex</FormLabel>
            <FormInput
              name="sex"
              value={formData.sex ?? ""}
              onChange={handleChange}
              placeholder="e.g. Male, Female"
              required
            />
          </div>
          <div>
            <FormLabel>Date of Birth</FormLabel>
            <FormInput
              name="dateOfBirth"
              value={formData.dateOfBirth?.split("T")[0] ?? ""}
              onChange={handleChange}
              type="date"
            />
          </div>
          <div>
            <FormLabel>Place of Birth</FormLabel>
            <FormInput
              name="placeOfBirth"
              value={formData.placeOfBirth ?? ""}
              onChange={handleChange}
              placeholder="e.g. Manila"
            />
          </div>
          <div>
            <FormLabel>Employee ID</FormLabel>
            <div className="w-full text-sm text-gray-400 rounded-md px-3.5 py-2 bg-gray-50 border border-gray-200 cursor-not-allowed select-none">
              {formData.employeeId}
            </div>
          </div>
          <div>
            <FormLabel>Role</FormLabel>
            <div className="w-full text-sm text-gray-400 rounded-md px-3.5 py-2 bg-gray-50 border border-gray-200 cursor-not-allowed select-none">
              {formData.role}
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
        Address
      </p>
      <div className="border border-gray-200 rounded-md p-5 mb-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <PhAddressFields
            formData={addressData}
            addressCodes={addressCodes}
            onAddressSelect={handleAddressSelect}
            onChange={handleAddressChange}
          />
        </div>
      </div>
    </>
  );
}