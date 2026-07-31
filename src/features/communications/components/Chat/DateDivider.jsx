import React from 'react';

export default function DateDivider({ date = 'Today' }) {
  return (
    <div className="flex items-center my-4">
      <div className="flex-1 border-t border-slate-800" />
      <span className="px-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
        {date}
      </span>
      <div className="flex-1 border-t border-slate-800" />
    </div>
  );
}