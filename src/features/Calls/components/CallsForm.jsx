import { useEffect, useState } from "react";

import FormDrawer from "../../../components/form/FormDrawer";
import FormSection from "../../../components/form/FormSection";

import {
  FormInput,
  FormLabel,
  FormTextarea,
  inputClass,
} from "../../../components/form/FormField";


const FORM_ID = "calls-form";


const initialFormData = {
  contactName: "",
  companyPerson: "",
  contactMethod: "Mobile",
  contactValue: "",
  callType: "Follow-up Call",
  status: "Scheduled",
  scheduledAt: "",
  completedAt: "",
  notes: "",
  outcome: "",
};


const toDateTimeLocal = (value) =>  
    {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();

  return new Date(
    date.getTime() - offset * 60000,
  )
    .toISOString()
    .slice(0, 16);
};


const getContactPlaceholder = (method) => {
  switch (method) {
    case "WhatsApp":
      return "Enter WhatsApp number...";

    case "Viber":
      return "Enter Viber number...";

    default:
      return "Enter mobile number...";
  }
};


export default function CallsForm({
  open,
  editingCall,
  onSubmit,
  onClose,
  onCancel,
  loading,
}) {
  const [formData, setFormData] =
    useState(initialFormData);


  useEffect(() => {
    if (!open) return;

    if (editingCall) {
      setFormData({
        contactPerson:
          editingCall.contactPerson || "",

        companyName:
          editingCall.companyName || "",

        contactMethod:
          editingCall.contactMethod || "Mobile",

        contactValue:
          editingCall.contactValue ||
          editingCall.phone ||
          "",

        callType:
          editingCall.callType ||
          "Follow-up Call",

        status:
          editingCall.status ||
          "Scheduled",

        scheduledAt:
          toDateTimeLocal(
            editingCall.scheduledAt,
          ),

        completedAt:
          toDateTimeLocal(
            editingCall.completedAt,
          ),

        notes:
          editingCall.notes || "",

        outcome:
          editingCall.outcome || "",
      });
    } else {
      setFormData(initialFormData);
    }
  }, [open, editingCall]);


  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  const handleContactMethodChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      contactMethod: event.target.value,
      contactValue: "",
    }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...formData,

      phone:
        formData.contactMethod === "Mobile"
          ? formData.contactValue
          : "",

      WhatsApp:
        formData.contactMethod === "WhatsApp"
          ? formData.contactValue
          : "",

      Viber:
        formData.contactMethod === "Viber"
          ? formData.contactValue
          : "",

      scheduledAt:
        formData.scheduledAt || null,

      completedAt:
        formData.status === "Completed"
          ? formData.completedAt || null
          : null,
    };

    await onSubmit(payload);
  };


  return (
    <FormDrawer
      open={open}
      title={
        editingCall
          ? "Edit Call"
          : "Add Call"
      }
      formId={FORM_ID}
      loading={loading}
      onClose={onClose}
      onCancel={onCancel}
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        className="space-y-5"
      >

        <FormSection title="Call Information">

            <div>
            <FormLabel>
              Company Name
            </FormLabel>

            <FormInput
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Enter company name..."
            />
          </div>

          <div>
            <FormLabel required>
              Contact Person
            </FormLabel>

            <FormInput
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              placeholder="Enter contact person..."
              required
            />
          </div>


        

          <div className="grid grid-cols-2 gap-4">

            <div>
              <FormLabel required>
                Contact Method
              </FormLabel>

              <select
                name="contactMethod"
                value={formData.contactMethod}
                onChange={handleContactMethodChange}
                className={inputClass}
                required
              >
                <option value="Mobile">
                  Mobile
                </option>

                <option value="WhatsApp">
                  WhatsApp
                </option>

                <option value="Viber">
                  Viber
                </option>
              </select>
            </div>


            <div>
              <FormLabel required>
                Contact Number
              </FormLabel>

              <FormInput
                name="contactValue"
                value={formData.contactValue}
                onChange={handleChange}
                placeholder={
                  getContactPlaceholder(
                    formData.contactMethod,
                  )
                }
                required
              />
            </div>

          </div>


          <div>
            <FormLabel required>
              Call Type
            </FormLabel>

            <select
              name="callType"
              value={formData.callType}
              onChange={handleChange}
              className={inputClass}
              required
            >
              <option value="Follow-up Call">
                Follow-up Call
              </option>

              <option value="Initial Client Contact">
                Initial Client Contact
              </option>

              <option value="Sales Discussion">
                Sales Discussion
              </option>

              <option value="Others">
                Others
              </option>
            </select>
          </div>

        </FormSection>

            <FormSection title="Schedule">

            <div className="grid grid-cols-2 gap-4">

                <div>
                <FormLabel required>
                    Scheduled Date and Time
                </FormLabel>

                <FormInput
                    type="datetime-local"
                    name="scheduledAt"
                    value={formData.scheduledAt}
                    onChange={handleChange}
                    required
                />
                </div>


                <div>
                <FormLabel required>
                    Status
                </FormLabel>

                <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={inputClass}
                    required
                >
                    <option value="Scheduled">
                    Scheduled
                    </option>

                    <option value="Completed">
                    Completed
                    </option>

                    <option value="Cancelled">
                    Cancelled
                    </option>

                    <option value="Missed">
                    Missed
                    </option>
                </select>
                </div>

            </div>


            {formData.status === "Completed" && (
                <div>
                <FormLabel>
                    Completed Date and Time
                </FormLabel>

                <FormInput
                    type="datetime-local"
                    name="completedAt"
                    value={formData.completedAt}
                    onChange={handleChange}
                />
                </div>
            )}

            </FormSection>


        <FormSection title="Notes">

          <FormTextarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            placeholder="Add call notes..."
          />

        </FormSection>

      </form>
    </FormDrawer>
  );
}