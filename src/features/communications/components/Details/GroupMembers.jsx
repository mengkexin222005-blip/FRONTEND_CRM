import React from 'react';

export default function GroupMembers({ members = [] }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Members ({members.length})
      </h4>
      {members.length === 0 ? (
        <p className="text-xs text-slate-500">No members listed.</p>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between text-xs">
              <span className="text-slate-200 font-medium">{member.name}</span>
              <span className="text-slate-500">{member.role}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}