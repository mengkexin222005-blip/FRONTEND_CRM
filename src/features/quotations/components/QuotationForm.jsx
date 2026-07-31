import React from "react";
import { Plus, Trash2, CheckCircle2, Pencil } from "lucide-react";
import { TEMPLATE_SECTIONS } from "../Templates/templateDefaults";
import { formatCurrency } from "../../../utils/currency";
import { getDisplayName } from "../../../utils/name";
import { toNumber } from "../utils/quotationCalculations";

const FIELD_CLASS =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:ring-2 focus:ring-red-100";

const CURRENCIES = [
  { value: "PHP", label: "Philippine Peso (PHP)" },
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
];

export function FieldLabel({ children, required = false, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[11px] font-medium text-slate-600">
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
}

function SectionHeading({ children }) {
  return (
    <h3 className="border-b border-slate-100 pb-3 text-sm font-semibold text-slate-900">
      {children}
    </h3>
  );
}

function SelectedTemplatePanel({ template, onChangeTemplate }) {
  const Icon = template.icon;
  return (
    <aside className="w-56 shrink-0 rounded-lg border border-slate-200 p-4">
      <p className="text-xs font-medium text-slate-600">Selected Template</p>
      <span className={`mt-4 flex h-12 w-12 items-center justify-center rounded-lg ${template.iconClass}`}>
        <Icon size={22} />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-slate-800">{template.name} Template</h3>
      <p className="mt-2 text-[11px] leading-5 text-slate-500">{template.description}</p>
      <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
        <span>{template.sections.length} Sections</span>
      </div>
      <button
        type="button"
        onClick={onChangeTemplate}
        className="mt-5 flex w-full items-center justify-between rounded-md border border-slate-200 px-3 py-2.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
      >
        Change Template
        <Pencil size={13} />
      </button>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="text-xs font-semibold text-slate-800">Template Sections</p>
        <div className="mt-4 space-y-3">
          {template.sections.map((section) => (
            <div key={section} className="flex items-center gap-2 text-[10px] text-slate-600">
              <CheckCircle2 size={14} className="text-emerald-500" />
              {TEMPLATE_SECTIONS[section]?.label || section}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function ItemEditor({ currency, items = [], onAdd, onRemove, onUpdate }) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <SectionHeading>Product / Items</SectionHeading>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-[11px] font-medium text-red-500 hover:bg-red-50 cursor-pointer"
        >
          <Plus size={13} />
          Add Item
        </button>
      </div>
      <div className="overflow-hidden rounded-md border border-slate-200">
        <div className="grid grid-cols-[42px_1fr_90px_130px_130px_42px] bg-slate-50 text-[10px] font-semibold text-slate-600">
          {["#", "Description", "Qty", "Unit Price", "Amount", ""].map((label, i) => (
            <span key={i} className="px-3 py-2.5">{label}</span>
          ))}
        </div>
        {safeItems.map((item, index) => {
          const amount = toNumber(item.quantity) * toNumber(item.unitPrice);
          return (
            <div key={item.id} className="grid grid-cols-[42px_1fr_90px_130px_130px_42px] items-center border-t border-slate-100 text-xs">
              <span className="px-3 text-slate-500">{index + 1}</span>
              <input
                value={item.description}
                onChange={(e) => onUpdate(item.id, "description", e.target.value)}
                className="border-0 px-3 py-3 text-xs outline-none focus:ring-0"
                placeholder="Item description"
              />
              <input
                type="number"
                min="0"
                value={item.quantity}
                onChange={(e) => onUpdate(item.id, "quantity", e.target.value)}
                className="border-0 px-3 py-3 text-xs outline-none focus:ring-0"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.unitPrice}
                onChange={(e) => onUpdate(item.id, "unitPrice", e.target.value)}
                className="border-0 px-3 py-3 text-xs outline-none focus:ring-0"
                placeholder="0.00"
              />
              <span className="px-3 font-medium text-slate-700">
                {formatCurrency(amount, currency)}
              </span>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="mx-auto rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function QuotationForm({
  clients,
  details,
  onAddItem,
  onChangeClient,
  onRemoveItem,
  onUpdate,
  onUpdateItem,
  selectedTemplate,
}) {
  const hasSection = (section) => selectedTemplate.sections.includes(section);

  return (
    <div className="flex min-h-0 flex-1 gap-5 p-6">
      <SelectedTemplatePanel
        template={selectedTemplate}
        onChangeTemplate={() => onUpdate("requestedTemplateChange", true)}
      />

      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-slate-200 p-6">
        <div className="space-y-6">
          <section>
            <SectionHeading>Quotation Basic Information</SectionHeading>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <FieldLabel required htmlFor="quotationNumber">Quotation Number</FieldLabel>
                <input
                  id="quotationNumber"
                  value={details.quotationNumber}
                  onChange={(e) => onUpdate("quotationNumber", e.target.value)}
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <FieldLabel required htmlFor="quotationDate">Quotation Date</FieldLabel>
                <input
                  id="quotationDate"
                  type="date"
                  value={details.quotationDate}
                  onChange={(e) => onUpdate("quotationDate", e.target.value)}
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <FieldLabel htmlFor="validUntil">Valid Until</FieldLabel>
                <input
                  id="validUntil"
                  type="date"
                  value={details.validUntil}
                  onChange={(e) => onUpdate("validUntil", e.target.value)}
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <FieldLabel required htmlFor="currency">Currency</FieldLabel>
                <select
                  id="currency"
                  value={details.currency}
                  onChange={(e) => onUpdate("currency", e.target.value)}
                  className={FIELD_CLASS}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <FieldLabel required htmlFor="quotationTitle">Quotation Title</FieldLabel>
                <input
                  id="quotationTitle"
                  value={details.quotationTitle}
                  onChange={(e) => onUpdate("quotationTitle", e.target.value)}
                  className={FIELD_CLASS}
                  placeholder="e.g. Supply of Office Equipment"
                />
              </div>
            </div>
          </section>

          {hasSection("company") && (
            <section>
              <SectionHeading>Company Information</SectionHeading>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required htmlFor="companyName">Company Name</FieldLabel>
                  <input
                    id="companyName"
                    value={details.companyName}
                    onChange={(e) => onUpdate("companyName", e.target.value)}
                    className={FIELD_CLASS}
                  />
                </div>
                <div>
                  <FieldLabel required htmlFor="companyEmail">Email</FieldLabel>
                  <input
                    id="companyEmail"
                    type="email"
                    value={details.companyEmail}
                    onChange={(e) => onUpdate("companyEmail", e.target.value)}
                    className={FIELD_CLASS}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="companyPhone">Phone</FieldLabel>
                  <input
                    id="companyPhone"
                    value={details.companyPhone}
                    onChange={(e) => onUpdate("companyPhone", e.target.value)}
                    className={FIELD_CLASS}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="companyAddress">Address</FieldLabel>
                  <input
                    id="companyAddress"
                    value={details.companyAddress}
                    onChange={(e) => onUpdate("companyAddress", e.target.value)}
                    className={FIELD_CLASS}
                  />
                </div>
              </div>
            </section>
          )}

          {hasSection("client") && (
            <section>
              <SectionHeading>Client Information</SectionHeading>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <FieldLabel required htmlFor="clientId">Client Record</FieldLabel>
                  <select
                    id="clientId"
                    value={details.clientId}
                    onChange={(e) => onChangeClient(e.target.value)}
                    className={FIELD_CLASS}
                  >
                    <option value="">Select a client...</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {getDisplayName(c, { includeSuffix: true })}
                        {c.company ? ` — ${c.company}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel required htmlFor="clientName">Client Name</FieldLabel>
                  <input
                    id="clientName"
                    value={details.clientName}
                    onChange={(e) => onUpdate("clientName", e.target.value)}
                    className={FIELD_CLASS}
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <FieldLabel required htmlFor="clientEmail">Email</FieldLabel>
                  <input
                    id="clientEmail"
                    type="email"
                    value={details.clientEmail}
                    onChange={(e) => onUpdate("clientEmail", e.target.value)}
                    className={FIELD_CLASS}
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="clientPhone">Phone</FieldLabel>
                  <input
                    id="clientPhone"
                    value={details.clientPhone}
                    onChange={(e) => onUpdate("clientPhone", e.target.value)}
                    className={FIELD_CLASS}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="clientAddress">Address</FieldLabel>
                  <input
                    id="clientAddress"
                    value={details.clientAddress}
                    onChange={(e) => onUpdate("clientAddress", e.target.value)}
                    className={FIELD_CLASS}
                    placeholder="Enter client address"
                  />
                </div>
              </div>
            </section>
          )}

          {hasSection("items") && (
            <ItemEditor
              currency={details.currency}
              items={details.items}
              onAdd={onAddItem}
              onRemove={onRemoveItem}
              onUpdate={onUpdateItem}
            />
          )}
        </div>
      </div>
    </div>
  );
}