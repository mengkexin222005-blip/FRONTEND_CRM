import React from "react";
import { MoreVertical } from "lucide-react";
import { getAvatarUrl } from "../../utils/avatar";

export default function ChatHeader({ activeThread, getRoleBadgeStyles, onToggleDrawer, isDrawerOpen }) {
  const initials = (activeThread?.name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const profileImage = getAvatarUrl(
    activeThread?.avatar ||
    activeThread?.profilePicture ||
    activeThread?.avatarUrl ||
    activeThread?.image
  );

  return (
    <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6 shrink-0">
      {/* User Info Section */}
      <div className="flex items-center gap-3">
        <div className="relative">
          {profileImage ? (
            <img
              src={profileImage}
              alt={activeThread?.name}
              className="h-10 w-10 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">
              {initials || "U"}
            </div>
          )}
          {activeThread?.online && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          )}
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 leading-none">
              {activeThread?.name}
            </h2>
            <span
              className={`rounded-full border px-2 py-0.5 text-[5px] font-medium leading-none ${getRoleBadgeStyles(
                activeThread?.role
              )}`}
            >
              {activeThread?.role}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
            {activeThread?.online ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Drawer Toggle Action */}
      <div className="flex items-center text-slate-500">
        <button
          type="button"
          onClick={onToggleDrawer}
          className={`rounded-lg p-2 transition cursor-pointer ${
            isDrawerOpen ? "bg-slate-100 text-slate-800" : "hover:bg-slate-100 hover:text-slate-700"
          }`}
          title="Conversation Information"
        >
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
}