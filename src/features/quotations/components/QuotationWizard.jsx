import { useMemo, useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Expand,
  FileText,
  Layers3,
  Lightbulb,
  Minimize2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import BaseModal from "../../../components/modal/BaseModal";
import TemplateBuilder from "../Builder/TemplateBuilder";
import { QUOTATION_TEMPLATES } from "../Templates/templateDefaults";
import { buildFullAddress } from "../../../utils/buildFullAddress";
import { getDisplayName } from "../../../utils/name";

import {
  calculateQuotationTotals,
  createQuotationNumber,
  toDateInput,
} from "../utils/quotationCalculations";

function Stepper({ step }) {
  const steps = ["Choose Template", "Fill Quotation Details", "Review & Preview"];

  return (
    <div className="grid grid-cols-3 border-b border-slate-200 px-8 py-5 shrink-0">
      {steps.map((label, index) => {
        const number = index + 1;
        const complete = number < step;
        const active = number === step;

        return (
          <div
            key={label}
            className={`flex items-center text-[11px] font-medium ${
              active ? "text-red-500" : "text-slate-700"
            }`}
          >
            <span
              className={`mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                complete
                  ? "border border-red-500 text-red-500"
                  : active
                    ? "bg-red-500 text-white"
                    : "bg-slate-100 text-slate-700"
              }`}
            >
              {complete ? <Check size={13} /> : number}
            </span>
            <span className="whitespace-nowrap">{label}</span>
            {index < steps.length - 1 && (
              <span className="mx-5 h-px flex-1 bg-slate-200" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function WizardHeader({ mode, onClose, isExpanded, onToggleExpand }) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-8 py-5">
      <h2 className="text-xl font-semibold text-slate-900">
        {mode === "create"
          ? "Add New Quotation"
          : mode === "edit"
          ? "Edit Quotation"
          : "Quotation Details"}
      </h2>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleExpand}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 transition-colors"
          title={isExpanded ? "Restore Size" : "Expand Window"}
        >
          {isExpanded ? <Minimize2 size={18} /> : <Expand size={18} />}
        </button>
        <button 
          type="button" 
          onClick={onClose} 
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}

function TemplateCard({ template, selected, onSelect }) {
  const Icon = template.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex min-h-52 flex-col rounded-lg border p-4 text-left transition ${
        selected
          ? "border-red-400 bg-red-50/40 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white">
          <Check size={13} />
        </span>
      )}
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-lg ${template.iconClass}`}
      >
        <Icon size={22} />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-slate-800">
        {template.name}
      </h3>
      <p className="mt-1 text-[11px] leading-5 text-slate-500">
        {template.description}
      </p>
      <div className="mt-auto pt-5 flex items-center gap-2 text-[11px] text-slate-500">
        <Layers3 size={13} />
        <span>
          {template.sections.length}{" "}
          {template.sections.length === 1 ? "Section" : "Sections"}
        </span>
      </div>
    </button>
  );
}

function ChooseTemplateStep({
  category,
  errors = {},
  filteredTemplates,
  onBuildCustom,
  onCategoryChange,
  onSearchChange,
  onSelectTemplate,
  quotationTitle,
  search,
  selectedTemplate,
  setQuotationTitle,
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-8 py-5">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Quotation Title <span className="text-red-500">*</span>
        </label>
        <input
          value={quotationTitle}
          onChange={(event) => setQuotationTitle(event.target.value)}
          className={`w-full rounded-md border px-3 py-3 text-xs outline-none transition ${
            errors.quotationTitle
              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200"
              : "border-slate-200 focus:border-red-400 focus:ring-1 focus:ring-red-400"
          }`}
          placeholder="Untitled Quotation Document Title..."
        />
        {errors.quotationTitle && (
          <p className="mt-1 text-xs text-red-500">{errors.quotationTitle}</p>
        )}
      </div>

      <div className="mt-7 flex items-end justify-between gap-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Choose a Template
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Start with a professionally designed quotation layout.
          </p>
        </div>
        <label className="relative w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-red-400"
            placeholder="Search templates..."
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {["All", "Standard", "Services", "Custom"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onCategoryChange(item)}
            className={`rounded-full border px-5 py-2 text-[11px] font-medium transition ${
              category === item
                ? "border-red-400 bg-red-50 text-red-500"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-4 gap-4">
        <button
          type="button"
          onClick={onBuildCustom}
          className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-5 text-center transition hover:border-red-300 hover:bg-red-50/30 cursor-pointer"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <Plus size={27} />
          </span>
          <h3 className="mt-5 text-sm font-semibold text-slate-800">
            Build Your Own Template
          </h3>
          <p className="mt-3 max-w-40 text-[11px] leading-5 text-slate-500">
            Drag and drop sections and create a quotation layout that fits your
            business.
          </p>
        </button>

        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            selected={selectedTemplate?.id === template.id}
            onSelect={() => onSelectTemplate(template)}
          />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="py-16 text-center text-sm text-slate-400">
          No templates match your search.
        </div>
      )}
    </div>
  );
}

function SelectedTemplatePanel({ template, onChangeTemplate }) {
  const Icon = template.icon;

  return (
    <aside className="w-56 shrink-0 rounded-lg border border-slate-200 p-4">
      <p className="text-xs font-medium text-slate-600">Selected Template</p>
      <span
        className={`mt-4 flex h-12 w-12 items-center justify-center rounded-lg ${template.iconClass}`}
      >
        <Icon size={22} />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-slate-800">
        {template.name} Template
      </h3>
      <p className="mt-2 text-[11px] leading-5 text-slate-500">
        {template.description}
      </p>
      <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
        <Layers3 size={13} />
        {template.sections.length} Sections
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
        <p className="text-xs font-semibold text-slate-800">
          Template Sections
        </p>
        <div className="mt-4 space-y-3">
          {template.sections.map((section) => (
            <div
              key={section}
              className="flex items-center gap-2 text-[10px] text-slate-600"
            >
              <CheckCircle2 size={14} className="text-emerald-500" />
              {section}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 rounded-md bg-red-50 p-3 text-[10px] leading-5 text-slate-600">
        <div className="mb-1 flex items-center gap-2 font-semibold text-slate-800">
          <Lightbulb size={14} className="text-red-500" />
          Tip
        </div>
        All sections are pre-built for you. You can customize their content
        before creating the quotation.
      </div>
    </aside>
  );
}

function SectionHeading({ children }) {
  return (
    <h3 className="border-b border-slate-100 pb-3 text-sm font-semibold text-slate-900">
      {children}
    </h3>
  );
}

function ItemEditor({ currency, items, onAdd, onRemove, onUpdate }) {
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
          {["#", "Description", "Qty", "Unit Price", "Amount", ""].map(
            (label, index) => (
              <span key={`${label}-${index}`} className="px-3 py-2.5">
                {label}
              </span>
            )
          )}
        </div>
        {items.map((item, index) => {
          const amount =
            (parseFloat(item.quantity) || 0) *
            (parseFloat(item.unitPrice) || 0);
          return (
            <div
              key={item.id}
              className="grid grid-cols-[42px_1fr_90px_130px_130px_42px] items-center border-t border-slate-100 text-xs"
            >
              <span className="px-3 text-slate-500">{index + 1}</span>
              <input
                value={item.description}
                onChange={(event) =>
                  onUpdate(item.id, "description", event.target.value)
                }
                className="border-0 px-3 py-3 text-xs outline-none focus:ring-0"
                placeholder="Item description"
              />
              <input
                type="number"
                min="0"
                step="1"
                value={item.quantity}
                onChange={(event) =>
                  onUpdate(item.id, "quantity", event.target.value)
                }
                className="border-0 px-3 py-3 text-xs outline-none focus:ring-0"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.unitPrice}
                onChange={(event) =>
                  onUpdate(item.id, "unitPrice", event.target.value)
                }
                className="border-0 px-3 py-3 text-xs outline-none focus:ring-0"
                placeholder="0.00"
              />
              <span className="px-3 font-medium text-slate-700">
                {currency} {amount.toFixed(2)}
              </span>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="mx-auto rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 cursor-pointer"
                aria-label="Remove item"
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

function DetailsStep({
  clients,
  details,
  errors = {},
  onAddItem,
  onChangeClient,
  onRemoveItem,
  onUpdate,
  onUpdateItem,
  selectedTemplate,
}) {
  const hasSection = (section) => selectedTemplate.sections.includes(section);

  const getFieldClass = (fieldName) =>
    `w-full rounded-md border px-3 py-2 text-xs outline-none transition ${
      errors[fieldName]
        ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200"
        : "border-slate-200 focus:border-red-400"
    }`;

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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quotation Number <span className="text-red-500">*</span>
                </label>
                <input
                  value={details.quotationNumber}
                  onChange={(event) => onUpdate("quotationNumber", event.target.value)}
                  className={getFieldClass("quotationNumber")}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quotation Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={details.quotationDate}
                  onChange={(event) => onUpdate("quotationDate", event.target.value)}
                  className={getFieldClass("quotationDate")}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Valid Until</label>
                <input
                  type="date"
                  value={details.validUntil}
                  onChange={(event) => onUpdate("validUntil", event.target.value)}
                  className={getFieldClass("validUntil")}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  value={details.currency}
                  onChange={(event) => onUpdate("currency", event.target.value)}
                  className={getFieldClass("currency")}
                >
                  <option value="PHP">PHP - Philippine Peso</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject / Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={details.quotationTitle}
                  onChange={(event) => onUpdate("quotationTitle", event.target.value)}
                  className={getFieldClass("quotationTitle")}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={details.companyName}
                    onChange={(event) => onUpdate("companyName", event.target.value)}
                    className={getFieldClass("companyName")}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={details.companyEmail}
                    onChange={(event) => onUpdate("companyEmail", event.target.value)}
                    className={getFieldClass("companyEmail")}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    value={details.companyPhone}
                    onChange={(event) => onUpdate("companyPhone", event.target.value)}
                    className={getFieldClass("companyPhone")}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                  <input
                    value={details.companyAddress}
                    onChange={(event) => onUpdate("companyAddress", event.target.value)}
                    className={getFieldClass("companyAddress")}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Record <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={details.clientId}
                    onChange={(event) => onChangeClient(event.target.value)}
                    className={getFieldClass("clientId")}
                  >
                    <option value="">Select a client...</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {getDisplayName(client, { includeSuffix: true })}
                        {client.company ? ` — ${client.company}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={details.clientName}
                    onChange={(event) => onUpdate("clientName", event.target.value)}
                    className={getFieldClass("clientName")}
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={details.clientEmail}
                    onChange={(event) => onUpdate("clientEmail", event.target.value)}
                    className={getFieldClass("clientEmail")}
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    value={details.clientPhone}
                    onChange={(event) => onUpdate("clientPhone", event.target.value)}
                    className={getFieldClass("clientPhone")}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                  <input
                    value={details.clientAddress}
                    onChange={(event) => onUpdate("clientAddress", event.target.value)}
                    className={getFieldClass("clientAddress")}
                    placeholder="Enter client address"
                  />
                </div>
              </div>
            </section>
          )}

          {hasSection("text") && (
            <section>
              <SectionHeading>Introduction</SectionHeading>
              <textarea
                value={details.introduction}
                onChange={(event) => onUpdate("introduction", event.target.value)}
                rows={3}
                className={`${getFieldClass("introduction")} mt-4 resize-none`}
                placeholder="Add a short introduction for this quotation..."
              />
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

          {hasSection("summary") && (
            <section>
              <SectionHeading>Pricing Summary</SectionHeading>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={details.discount}
                    onChange={(event) => onUpdate("discount", event.target.value)}
                    className={getFieldClass("discount")}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={details.taxRate}
                    onChange={(event) => onUpdate("taxRate", event.target.value)}
                    className={getFieldClass("taxRate")}
                  />
                </div>
              </div>
            </section>
          )}

          {hasSection("terms") && (
            <section>
              <SectionHeading>Terms &amp; Conditions</SectionHeading>
              <textarea
                value={details.terms}
                onChange={(event) => onUpdate("terms", event.target.value)}
                rows={5}
                className={`${getFieldClass("terms")} mt-4 resize-none`}
              />
            </section>
          )}

          {hasSection("notes") && (
            <section>
              <SectionHeading>Notes</SectionHeading>
              <textarea
                value={details.notes}
                onChange={(event) => onUpdate("notes", event.target.value)}
                rows={4}
                className={`${getFieldClass("notes")} mt-4 resize-none`}
                placeholder="Add a note for the client..."
              />
            </section>
          )}

          {hasSection("signature") && (
            <section>
              <SectionHeading>Signature</SectionHeading>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prepared By</label>
                  <input
                    value={details.preparedBy}
                    onChange={(event) => onUpdate("preparedBy", event.target.value)}
                    className={getFieldClass("preparedBy")}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Position</label>
                  <input
                    value={details.preparedByRole}
                    onChange={(event) => onUpdate("preparedByRole", event.target.value)}
                    className={getFieldClass("preparedByRole")}
                  />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function QuotationDocument({ details, selectedTemplate, totals }) {
  const visibleItems = details.items.filter(
    (item) => item.description || (parseFloat(item.unitPrice) || 0) > 0
  );

  return (
    <article className="mx-auto min-h-[700px] w-full max-w-2xl bg-white px-8 py-7 text-[9px] text-slate-700 shadow-sm">
      <div className="flex items-start justify-between border-b border-red-100 pb-5">
        <div>
          <p className="mt-1 font-medium">{details.companyName}</p>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">QUOTATION</h1>
          <p className="mt-2">Quotation #: <strong>{details.quotationNumber}</strong></p>
          <p>Date: {details.quotationDate}</p>
          <p>Valid Until: {details.validUntil}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10 border-b border-red-100 py-5">
        <div>
          <p className="font-semibold uppercase text-red-500">From:</p>
          <p className="mt-2 font-semibold">{details.companyName}</p>
          <p>{details.companyAddress || "—"}</p>
          <p>Phone: {details.companyPhone || "—"}</p>
          <p>Email: {details.companyEmail || "—"}</p>
        </div>
        <div>
          <p className="font-semibold uppercase text-red-500">To:</p>
          <p className="mt-2 font-semibold">{details.clientName || "—"}</p>
          <p>{details.clientCompany || "—"}</p>
          <p>{details.clientAddress || "—"}</p>
          <p>Phone: {details.clientPhone || "—"}</p>
          <p>Email: {details.clientEmail || "—"}</p>
        </div>
      </div>

      <div className="py-4">
        <p className="font-semibold uppercase text-red-500">Subject / Title</p>
        <p className="mt-2 font-medium">{details.quotationTitle}</p>
        {selectedTemplate.sections.includes("text") && details.introduction && (
          <p className="mt-3 leading-5 text-slate-500">{details.introduction}</p>
        )}
      </div>

      {selectedTemplate.sections.includes("items") && (
        <div>
          <div className="grid grid-cols-[36px_1fr_70px_110px_110px] border-y border-red-100 bg-red-50/40 font-semibold uppercase text-red-500">
            {["#", "Description", "Qty", "Unit Price", "Amount"].map((label) => (
              <span key={label} className="px-2 py-2">{label}</span>
            ))}
          </div>
          {visibleItems.map((item, index) => {
            const amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
            return (
              <div
                key={item.id}
                className="grid grid-cols-[36px_1fr_70px_110px_110px] border-b border-slate-100"
              >
                <span className="px-2 py-2">{index + 1}</span>
                <span className="px-2 py-2">{item.description}</span>
                <span className="px-2 py-2">{item.quantity}</span>
                <span className="px-2 py-2">{details.currency} {(parseFloat(item.unitPrice) || 0).toFixed(2)}</span>
                <span className="px-2 py-2 text-right font-medium">{details.currency} {amount.toFixed(2)}</span>
              </div>
            );
          })}

          <div className="ml-auto mt-3 w-64">
            <div className="flex justify-between py-1">
              <span>Subtotal</span>
              <span>{details.currency} {(totals.subtotal || 0).toFixed(2)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between py-1">
                <span>Discount</span>
                <span>-{details.currency} {(totals.discountAmount || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span>VAT ({details.taxRate || 0}%)</span>
              <span>{details.currency} {(totals.taxAmount || 0).toFixed(2)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-red-100 bg-red-50/50 px-2 py-2 text-sm font-bold text-red-500">
              <span>Total</span>
              <span>{details.currency} {(totals.total || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-7 grid grid-cols-2 gap-10">
        <div>
          {selectedTemplate.sections.includes("terms") && details.terms.trim() && (
            <>
              <p className="font-semibold uppercase text-red-500">Terms &amp; Conditions</p>
              <p className="mt-2 whitespace-pre-line leading-5 text-slate-500">{details.terms || "—"}</p>
            </>
          )}
          {selectedTemplate.sections.includes("notes") && details.notes.trim() && (
            <div className="mt-5">
              <p className="font-semibold uppercase text-red-500">Notes</p>
              <p className="mt-2 whitespace-pre-line leading-5 text-slate-500">{details.notes}</p>
            </div>
          )}
        </div>
        {selectedTemplate.sections.includes("signature") && details.preparedBy.trim() && (
          <div className="self-end text-center">
            <div className="mx-auto mb-2 w-36 border-b border-slate-400" />
            <p className="font-semibold">{details.preparedBy}</p>
            <p className="text-slate-500">{details.preparedByRole}</p>
          </div>
        )}
      </div>
    </article>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

function QuotationSummary({ details, selectedTemplate, totals, onEditDetails }) {
  return (
    <aside className="w-72 shrink-0 rounded-lg border border-slate-200 bg-white">
      <h3 className="border-b border-slate-200 px-4 py-4 text-sm font-semibold text-slate-900">
        Quotation Summary
      </h3>
      <div className="space-y-5 p-4">
        <div className="flex gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-500">
            <FileText size={15} />
          </span>
          <div>
            <p className="text-[10px] text-slate-500">Template</p>
            <p className="mt-1 text-xs font-medium text-slate-800">
              {selectedTemplate.name} Template
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-3">
          <SummaryRow label="Client" value={details.clientName || "—"} />
          <SummaryRow label="Quotation #" value={details.quotationNumber} />
          <SummaryRow label="Date" value={details.quotationDate} />
          <SummaryRow label="Valid Until" value={details.validUntil || "—"} />
          <SummaryRow label="Items" value={details.items.length} />
        </div>

        <div className="border-t border-slate-100 pt-4">
          <p className="text-[10px] text-slate-500">Total Amount</p>
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            ✓ Ready to create quotation
          </div>
          <p className="mt-1 text-lg font-bold text-red-500">
            {details.currency} {(totals.total || 0).toFixed(2)}
          </p>
        </div>

        <button
          type="button"
          onClick={onEditDetails}
          className="w-full rounded-md border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          Edit Details
        </button>
      </div>
    </aside>
  );
}

function ReviewStep({ details, selectedTemplate, totals, onEditDetails }) {
  return (
    <div className="flex min-h-0 flex-1 gap-6 overflow-auto bg-slate-100 p-6">
      <div className="flex min-w-0 flex-1 justify-center overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-6">
        <QuotationDocument
          details={details}
          selectedTemplate={selectedTemplate}
          totals={totals}
        />
      </div>

      <QuotationSummary
        details={details}
        selectedTemplate={selectedTemplate}
        totals={totals}
        onEditDetails={onEditDetails}
      />
    </div>
  );
}

function WizardFooter({
  loading,
  onBack,
  onContinue,
  onSaveDraft,
  onSubmit,
  selectedTemplate,
  step,
  mode,
}) {
  const TemplateIcon = selectedTemplate?.icon;

  return (
    <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
      <div className="hidden items-center gap-2 md:flex">
        {step === 1 && selectedTemplate && (
          <div className="flex items-center gap-2 rounded-full bg-slate-50 px-4 py-1.5 border border-slate-100">
            {TemplateIcon && (
              <span className={`flex h-5 w-5 items-center justify-center rounded-md ${selectedTemplate.iconClass}`}>
                <TemplateIcon size={12} />
              </span>
            )}
            <span className="text-[11px] font-medium text-slate-600">
              Selected Template: <strong className="text-slate-800">{selectedTemplate.name}</strong>
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="flex items-center gap-2 rounded-md border border-slate-200 px-5 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Back
          </button>
        )}
        {step > 1 && (
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={loading}
            className="rounded-md border border-slate-200 px-6 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Save Draft
          </button>
        )}
        {step < 3 ? (
          <button
            type="button"
            onClick={onContinue}
            disabled={loading}
            className="flex items-center gap-4 rounded-md bg-red-500 px-6 py-2.5 text-xs font-medium text-white hover:bg-red-600 transition-colors cursor-pointer"
          >
            {step === 1 ? "Continue" : "Next: Review & Preview"} <ArrowRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="flex items-center gap-3 rounded-md bg-red-500 px-7 py-2.5 text-xs font-medium text-white hover:bg-red-600 transition-colors cursor-pointer"
          >
            {loading
              ? mode === "edit"
                ? "Saving..."
                : "Creating..."
              : mode === "edit"
                ? "Save Changes"
                : "Create Quotation"} 
            <CheckCircle2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

const getClientDetails = (client) => {
  if (!client) {
    return {
      clientName: "",
      clientCompany: "",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
    };
  }
  const address = buildFullAddress(client.address);
  return {
    clientName: getDisplayName(client, { includeMiddleInitial: true, includeSuffix: true }),
    clientCompany: client.company || "",
    clientEmail: client.email || "",
    clientPhone: client.phone || "",
    clientAddress: address === "—" ? "" : address,
  };
};

const createInitialDetails = (formData = {}, clients = [], currentUser = null, viewingQuotation = null) => {
  const source = viewingQuotation || formData || {};
  const now = new Date();
  const selectedClient = clients.find((c) => String(c._id) === String(source.client || source.clientId || ""));
  const companyAddress = buildFullAddress(currentUser?.address);

  const rawValidUntil = source.expectedCloseDate || source.validUntil;

  return {
    quotationNumber: source.quotationNumber || createQuotationNumber(),
    quotationDate: source.quotationDate ? toDateInput(source.quotationDate) : toDateInput(now),
    validUntil: rawValidUntil ? toDateInput(rawValidUntil) : "", 
    quotationTitle: source.title || source.quotationTitle || "",
    currency: source.currency || "PHP",

    companyName: currentUser?.company ?? source.companyName ?? "",
    companyEmail: currentUser?.email ?? source.companyEmail ?? "",
    companyPhone: currentUser?.phone ?? source.companyPhone ?? "",
    companyAddress: companyAddress === "—" ? "" : companyAddress,

    clientId: source.client || source.clientId || "",
    ...getClientDetails(selectedClient),
    introduction: "",
    items: [],
    discount: "0",
    taxRate: "12",
    terms: "",
    notes: formData.notes || "",
    preparedBy: getDisplayName(currentUser, {
      includeMiddleInitial: true,
      includeSuffix: true,
      fallback: "",
    }),
    preparedByRole: currentUser?.role || "",
    stage: formData.stage || "Draft",
    assignedTo: formData.assignedTo || "",
  };
};

export default function QuotationWizard({
  clients = [],
  currentUser,
  formData = {},
  loading,
  onClose,
  onSubmit,
  open,
  mode = "create",
  viewingQuotation = null,
}) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(
    QUOTATION_TEMPLATES.find((t) => t.id === "product")
  );
  const [quotationTitle, setQuotationTitle] = useState(formData.title || viewingQuotation?.title || "");
  const [details, setDetails] = useState(() => createInitialDetails(formData, clients, currentUser, viewingQuotation));
  const [showBuilder, setShowBuilder] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setDetails(createInitialDetails(formData, clients, currentUser, viewingQuotation));
    setQuotationTitle(formData.title || viewingQuotation?.title || "");
    setStep(1);
    setFieldErrors({});
    setIsExpanded(false);
    setSelectedTemplate(
      QUOTATION_TEMPLATES.find((t) => t.id === "product")
    );
  }, [open, formData, viewingQuotation, clients, currentUser]);

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return QUOTATION_TEMPLATES.filter((t) => {
      const matchesCategory = category === "All" || t.category === category;
      const matchesSearch = !query || t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  const totals = useMemo(() => {
    return calculateQuotationTotals(details.items, details.taxRate, details.discount);
  }, [details.discount, details.items, details.taxRate]);

  if (!open) return null;

  const updateDetails = (name, value) => {
    if (name === "requestedTemplateChange") {
      setStep(1);
      return;
    }
    setDetails((curr) => ({ ...curr, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleTitleChange = (val) => {
    setQuotationTitle(val);
    if (fieldErrors.quotationTitle) {
      setFieldErrors((prev) => ({ ...prev, quotationTitle: null }));
    }
  };

  const changeClient = (clientId) => {
    const selectedClient = clients.find((c) => String(c._id) === String(clientId));
    setDetails((curr) => ({ ...curr, clientId, ...getClientDetails(selectedClient) }));
    if (fieldErrors.clientId) {
      setFieldErrors((prev) => ({ ...prev, clientId: null }));
    }
  };

  const addItem = () => {
    setDetails((curr) => ({
      ...curr,
      items: [...curr.items, { id: `item-${Date.now()}`, description: "", quantity: "1", unitPrice: "" }],
    }));
  };

  const updateItem = (itemId, name, value) => {
    setDetails((curr) => ({
      ...curr,
      items: curr.items.map((item) => (item.id === itemId ? { ...item, [name]: value } : item)),
    }));
  };

  const removeItem = (itemId) => {
    setDetails((curr) => ({
      ...curr,
      items: curr.items.filter((item) => item.id !== itemId),
    }));
  };

  const validateTemplate = () => {
    const errors = {};
    let firstMessage = null;

    if (!quotationTitle.trim()) {
      errors.quotationTitle = "Please enter a quotation title before continuing.";
      firstMessage = errors.quotationTitle;
    }

    if (!selectedTemplate) {
      firstMessage = firstMessage || "Please select a quotation template before continuing.";
    }

    if (firstMessage) {
      setFieldErrors(errors);
      alert(firstMessage);
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const validateDetails = () => {
    const errors = {};
    let firstMessage = null;

    if (!details.quotationNumber.trim()) {
      errors.quotationNumber = "Please enter a quotation number.";
      firstMessage = firstMessage || errors.quotationNumber;
    }

    if (!details.quotationDate.trim()) {
      errors.quotationDate = "Please select a quotation date.";
      firstMessage = firstMessage || errors.quotationDate;
    }

    if (!details.quotationTitle.trim()) {
      errors.quotationTitle = "Please enter a subject / title.";
      firstMessage = firstMessage || errors.quotationTitle;
    }

    if (
      selectedTemplate.sections.includes("company") &&
      !details.companyName.trim()
    ) {
      errors.companyName = "Please enter a company name.";
      firstMessage = firstMessage || "Please complete all required company information.";
    }

    if (
      selectedTemplate.sections.includes("company") &&
      !details.companyEmail.trim()
    ) {
      errors.companyEmail = "Please enter a company email.";
      firstMessage = firstMessage || "Please complete all required company information.";
    }

    if (
      selectedTemplate.sections.includes("client") &&
      !details.clientId
    ) {
      errors.clientId = "Please select a client record.";
      firstMessage = firstMessage || "Please select a client before continuing.";
    }

    if (firstMessage) {
      setFieldErrors(errors);
      alert(firstMessage);
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const continueToNextStep = () => {
    if (step === 1) {
      if (!validateTemplate()) return;
      setDetails((curr) => ({ ...curr, quotationTitle: quotationTitle.trim() }));
      setStep(2);
      return;
    }
    if (step === 2 && validateDetails()) {
      setStep(3);
    }
  };

  const createPayload = (stage) => ({
    ...formData,
    title: details.quotationTitle.trim() || quotationTitle.trim(),
    client: details.clientId,
    value: totals.total,
    currency: details.currency,
    stage: stage || details.stage || "Draft",
    expectedCloseDate: details.validUntil || null,
    assignedTo: details.assignedTo,
    notes: [details.notes, details.terms].filter(Boolean).join("\n\n"),
    quotationDetails: details,
  });

  const submitQuotation = async (stage) => {
    if (!validateTemplate() || !validateDetails()) {
      if (step !== 2 && step !== 1) setStep(2);
      return;
    }

    try {
      await onSubmit({ preventDefault: () => undefined }, createPayload(stage));
    } catch (err) {
      alert(err?.message || "An unexpected error occurred while saving the quotation.");
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      submitting={loading}
      closeOnBackdrop={false}
      maxWidth={isExpanded ? "max-w-[100vw]" : "max-w-[1180px]"}
      className={`${
        isExpanded ? "h-screen max-h-screen w-screen rounded-none" : "h-[94vh] max-h-[94vh]"
      } p-0 transition-all duration-200`}
    >
      {showBuilder ? (
        <TemplateBuilder
          onCancel={() => setShowBuilder(false)}
          onUseTemplate={(t) => {
            setSelectedTemplate(t);
            setShowBuilder(false);
            setStep(2);
            setDetails((curr) => ({
              ...curr,
              quotationTitle: quotationTitle.trim() || curr.quotationTitle,
            }));
          }}
        />
      ) : (
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <WizardHeader 
            mode={mode} 
            onClose={onClose}
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded((prev) => !prev)} 
          />
          <Stepper step={step} />

          {step === 1 && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ChooseTemplateStep
                category={category}
                errors={fieldErrors}
                filteredTemplates={filteredTemplates}
                onBuildCustom={() => setShowBuilder(true)}
                onCategoryChange={setCategory}
                onSearchChange={setSearch}
                onSelectTemplate={setSelectedTemplate}
                quotationTitle={quotationTitle}
                search={search}
                selectedTemplate={selectedTemplate}
                setQuotationTitle={handleTitleChange}
              />
            </div>
          )}

          {step === 2 && (
            <DetailsStep
              clients={clients}
              details={details}
              errors={fieldErrors}
              onAddItem={addItem}
              onChangeClient={changeClient}
              onRemoveItem={removeItem}
              onUpdate={updateDetails}
              onUpdateItem={updateItem}
              selectedTemplate={selectedTemplate}
            />
          )}

          {step === 3 && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ReviewStep
                details={details}
                selectedTemplate={selectedTemplate}
                totals={totals}
                onEditDetails={() => setStep(2)}
              />
            </div>
          )}

          <WizardFooter
            loading={loading}
            onBack={() => {
              setFieldErrors({});
              setStep((curr) => Math.max(1, curr - 1));
            }}
            onContinue={continueToNextStep}
            onSaveDraft={() => submitQuotation("Draft")}
            onSubmit={() => submitQuotation()}
            selectedTemplate={selectedTemplate}
            step={step}
            mode={mode}
          />
        </div>
      )}
    </BaseModal>
  );
}