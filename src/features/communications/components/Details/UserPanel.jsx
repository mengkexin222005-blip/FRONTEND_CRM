import React from 'react';
import GroupMembers from './GroupMembers';
import SharedFiles from './SharedFiles';

export default function UserPanel({ activeConversation }) {
  if (!activeConversation) return null;

  const { name, role, avatar, department, email, phone, online, isGroup, members, files } =
    activeConversation;

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        {isGroup ? (
          <div className="w-16 h-16 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-2xl flex items-center justify-center mx-auto mb-3">
            👥
          </div>
        ) : (
          <img src={avatar} alt={name} className="w-20 h-20 rounded-full object-cover mx-auto mb-3" />
        )}
        <h3 className="text-base font-semibold text-slate-100">{name}</h3>
        <p className="text-xs text-slate-400">{role}</p>
        {!isGroup && (
          <span
            className={`inline-block text-[10px] mt-2 px-2 py-0.5 rounded-full ${
              online
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {online ? 'Active Now' : 'Offline'}
          </span>
        )}
      </div>

      <hr className="border-slate-800" />

      {isGroup ? (
        <GroupMembers members={members || []} />
      ) : (
        <div className="space-y-4 text-xs">
          <div>
            <span className="text-slate-500 block mb-1">Department</span>
            <span className="text-slate-200 font-medium">{department || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-1">Email Address</span>
            <span className="text-slate-200 font-medium">{email || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-1">Phone</span>
            <span className="text-slate-200 font-medium">{phone || 'N/A'}</span>
          </div>
        </div>
      )}

      <hr className="border-slate-800" />

      <SharedFiles files={files || []} />
    </div>
  );
}