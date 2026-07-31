import React from 'react';

export default function SharedFiles({ files = [] }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shared Files</h4>
      {files.length === 0 ? (
        <p className="text-xs text-slate-500">No shared files yet.</p>
      ) : (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
            >
              <span className="text-slate-300 truncate">{file.name}</span>
              <span className="text-slate-500 text-[10px] ml-2">{file.size}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}