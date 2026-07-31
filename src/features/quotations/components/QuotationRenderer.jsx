import React from "react";
import { Search, Plus, Layers3, Check, FileText, Download, Pencil } from "lucide-react";
import { TEMPLATE_CATEGORIES } from "../Templates/templateDefaults";
import QuotationPreview from "./QuotationPreview";
import { QuotationSummaryWidget, FormDataPanel, SettingsPanel } from "./QuotationSummary";
import { FieldLabel } from "./QuotationForm";

const FIELD_CLASS =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:ring-2 focus:ring-red-100";

const PREVIEW_TABS = [
  { id: "preview", label: "Preview Quotation", icon: FileText },
  { id: "data", label: "Form Data", icon: Layers3 },
  { id: "settings", label: "Settings", icon: SettingsPanel ? FileText : Layers3 },
];

export function ChooseTemplateStep({
  category,
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
        <FieldLabel required>Quotation Title</FieldLabel>
        <input
          id="quotationTitle"
          value={quotationTitle}
          onChange={(e) => setQuotationTitle(e.target.value)}
          className={`${FIELD_CLASS} py-3`}
          placeholder="Untitled Quotation Document Title..."
        />
      </div>

      <div className="mt-7 flex items-end justify-between gap-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Choose a Template</h3>
          <p className="mt-1 text-xs text-slate-500">Start with a professionally designed layout.</p>
        </div>
        <label className="relative w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`${FIELD_CLASS} pl-9`}
            placeholder="Search templates..."
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {TEMPLATE_CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onCategoryChange(item)}
            className={`rounded-full border px-5 py-2 text-[11px] font-medium transition ${
              category === item ? "border-red-400 bg-red-50 text-red-500" : "border-slate-200 text-slate-600 hover:bg-slate-50"
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
          className="flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-5 text-center transition hover:border-red-300 hover:bg-red-50/30 cursor-pointer"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-500">
            <Plus size={20} />
          </span>
          <h3 className="mt-3 text-xs font-semibold text-slate-800">Build Custom Template</h3>
          <p className="mt-1 max-w-40 text-[10px] leading-relaxed text-slate-500">Drag and drop custom layouts.</p>
        </button>

        {filteredTemplates.map((template) => {
          const Icon = template.icon;
          const selected = selectedTemplate?.id === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelectTemplate(template)}
              className={`relative flex min-h-36 flex-col justify-between rounded-lg border p-5 text-left transition cursor-pointer ${
                selected 
                  ? "border-red-400 bg-red-50/40 shadow-sm ring-1 ring-red-400/20" 
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              <div className="w-full">
                <div className="flex w-full items-start justify-between gap-2">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${template.iconClass}`}>
                    <Icon size={18} />
                  </span>
                  {selected && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
                      <Check size={13} /> Selected
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-xs font-semibold text-slate-800">{template.name}</h3>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-500 line-clamp-2">{template.description}</p>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-500">
                {template.sections.length} Sections
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ReviewStep({
  activeTab,
  details,
  onEditDetails,
  onTabChange,
  onUpdate,
  permissions,
  salesAgents,
  selectedTemplate,
  stages,
  totals,
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 pb-5">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200">
        <div className="flex">
          {PREVIEW_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-[11px] font-medium cursor-pointer ${
                  activeTab === tab.id ? "border-red-500 text-red-500" : "border-transparent text-slate-600"
                }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onEditDetails}
          className="flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <Pencil size={13} />
          Edit Details
        </button>
      </div>

      {activeTab === "preview" && (
        <>
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2.5 text-[11px]">
            <div className="flex items-center gap-3">
              <span>Template: <strong>{selectedTemplate.name} Template</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Download size={13} /> Download PDF
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 gap-5 overflow-auto bg-slate-50 p-4">
            <div className="min-w-0 flex-1">
              <QuotationPreview details={details} selectedTemplate={selectedTemplate} totals={totals} />
            </div>
            <QuotationSummaryWidget details={details} selectedTemplate={selectedTemplate} totals={totals} />
          </div>
        </>
      )}

      {activeTab === "data" && (
        <div className="min-h-0 flex-1 overflow-auto bg-slate-50 p-5">
          <FormDataPanel details={details} totals={totals} />
        </div>
      )}

      {activeTab === "settings" && (
        <div className="min-h-0 flex-1 overflow-auto bg-slate-50 p-5">
          <SettingsPanel
            details={details}
            onUpdate={onUpdate}
            permissions={permissions}
            salesAgents={salesAgents}
            stages={stages}
          />
        </div>
      )}
    </div>
  );
}