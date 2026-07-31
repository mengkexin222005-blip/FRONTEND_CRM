import FormDrawer from "../../../../components/form/FormDrawer";
import FormSection from "../../../../components/form/FormSection";
import { FormInput, FormLabel, FormTextarea } from "../../../../components/form/FormField";

export default function ReportModal({
  open,
  editingReport,
  formData,
  loading = false,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!open) return null;

  return (
    <FormDrawer
      open={open}
      title={editingReport ? "Edit Report" : "Add Report"}
      formId="report-form"
      loading={loading}
      onClose={onClose}
      onCancel={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="report-form"
            disabled={loading}
            className="relative px-5 py-2 bg-red-500 text-white rounded-md disabled:opacity-70"
          >
            {loading ? "Saving..." : editingReport ? "Save Changes" : "Create Report"}
          </button>
        </div>
      }
    >
      <form id="report-form" onSubmit={onSubmit} className="space-y-5">
        <FormSection title="Report Details">
          <div>
            <FormLabel required>Report Name</FormLabel>
            <FormInput
              name="title"
              value={formData.title}
              onChange={(event) => onChange("title", event.target.value)}
              required
              placeholder="Enter report name"
            />
          </div>

          <div>
            <FormLabel>Description</FormLabel>
            <FormTextarea
              name="description"
              value={formData.description}
              onChange={(event) => onChange("description", event.target.value)}
              rows={4}
              placeholder="Describe the report"
            />
          </div>

          <div>
            <FormLabel required>Category</FormLabel>
            <select
              value={formData.category}
              onChange={(event) => onChange("category", event.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-300"
            >
              <option value="Sales">Sales</option>
              <option value="Leads">Leads</option>
              <option value="Clients">Clients</option>
            </select>
          </div>
        </FormSection>
      </form>
    </FormDrawer>
  );
}
