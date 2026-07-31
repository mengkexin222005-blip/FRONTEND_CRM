import React from "react";

export default function ChatFilters({ statusFilter, setStatusFilter }) {
  const tabs = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "archived", label: "Archived" },
  ];

  return (
    <div className="mt-2 grid grid-cols-3 rounded-lg bg-slate-100 p-1">
      {tabs.map((tab) => {
        const isActive = statusFilter === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`rounded-md py-1.5 text-xs font-semibold transition cursor-pointer ${
              isActive
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}