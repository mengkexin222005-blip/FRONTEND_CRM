import React from 'react';

export default function MeetingFilters() {
  return (
    <div className="absolute right-0 top-12 w-48 bg-white border border-gray-100 shadow-xl rounded-lg p-3 z-50 hidden">
      <h4 className="text-xs font-bold text-gray-700 mb-2">Filter Type</h4>
      <label className="flex items-center gap-2 text-xs text-gray-600 mb-1.5 cursor-pointer">
        <input type="checkbox" defaultChecked className="rounded text-[#FF6A3A]" /> Client Consultations
      </label>
    </div>
  );
}