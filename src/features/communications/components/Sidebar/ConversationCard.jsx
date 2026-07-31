import React from "react";
import { getRoleBadgeStyles } from "../../utils/communicationHelpers";

export default function ConversationCard({ conversation, isActive, onClick }) {
  if (!conversation) return null;

  const { name, role, time, lastMessage, unread, online } = conversation;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full border-b border-slate-100 px-4 py-4 text-left transition-all duration-200 block ${
        isActive ? "bg-red-50/50 border-l-4 border-l-[#E7000B]" : "hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrin-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200/50">
            {name
              ? name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
              : "U"}
          </div>
          {online && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h3 className={`truncate text-xs ${unread ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
              {name}
            </h3>
            <span className="text-[10px] text-slate-400 whitespace-nowrap">{time}</span>
          </div>

          <div className="mt-1 flex items-center gap-1.5">
            <span className={`rounded-full border px-1.5 py-0.2 text-[9px] font-medium ${getRoleBadgeStyles(role)}`}>
              {role}
            </span>
            {unread > 0 && (
              <span className="rounded-full bg-[#E7000B] px-1.5 py-0.2 text-[9px] font-semibold text-white">
                {unread}
              </span>
            )}
          </div>

          <p className="mt-1.5 truncate text-xs text-slate-400">{lastMessage || "No messages yet"}</p>
        </div>
      </div>
    </button>
  );
}