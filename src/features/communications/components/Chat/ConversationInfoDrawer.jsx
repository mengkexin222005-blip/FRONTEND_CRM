import React, { useState } from "react";
import { X, Archive, ArchiveRestore, Trash2, User, Mail, Shield } from "lucide-react";
import { getAvatarUrl } from "../../utils/avatar";
import ConfirmModal from "../../../../components/modal/ConfirmModal";

export default function ConversationInfoDrawer({
  activeThread,
  getRoleBadgeStyles,
  onClose,
  onArchiveThread,
  onDeleteThread,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  if (!activeThread) return null;

  const initials = (activeThread.name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const profileImage = getAvatarUrl(
    activeThread.avatar ||
    activeThread.profilePicture ||
    activeThread.avatarUrl ||
    activeThread.image
  );

  const openDeleteConfirm = () => {
    setPendingAction("delete");
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (pendingAction === "delete") {
      await onDeleteThread(activeThread.id);
    }
    setConfirmOpen(false);
    setPendingAction(null);
  };

  return (
    <>
    <aside className="w-72 shrink-0 border-l border-slate-200 bg-white flex flex-col h-full overflow-y-auto transition-all">
      {/* Header with Close Button */}
      <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4 shrink-0">
        <span className="text-xs font-bold text-slate-800">Conversation Details</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* User Profile Card Section */}
      <div className="flex flex-col items-center p-6 border-b border-slate-100 text-center">
        <div className="relative mb-3">
          {profileImage ? (
            <img
              src={profileImage}
              alt={activeThread.name}
              className="h-16 w-16 rounded-full object-cover border-2 border-slate-100 shadow-sm"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-base font-bold text-slate-700 border border-slate-200">
              {initials || "U"}
            </div>
          )}
          {activeThread.online && (
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
          )}
        </div>

        <h3 className="text-sm font-bold text-slate-900">{activeThread.name}</h3>
        
        <span
          className={`mt-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${getRoleBadgeStyles(
            activeThread.role
          )}`}
        >
          {activeThread.role || "User"}
        </span>

        <p className="text-[11px] text-slate-400 mt-1">
          {activeThread.online ? "Active Now" : "Offline"}
        </p>
      </div>

      {/* Quick Details Section */}
      <div className="p-4 space-y-3 border-b border-slate-100 text-xs">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          User Information
        </span>

        <div className="space-y-2">
          <div className="flex items-center gap-2.5 text-slate-600">
            <User size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">{activeThread.name}</span>
          </div>

          {activeThread.email && (
            <div className="flex items-center gap-2.5 text-slate-600">
              <Mail size={14} className="text-slate-400 shrink-0" />
              <span className="truncate">{activeThread.email}</span>
            </div>
          )}

          <div className="flex items-center gap-2.5 text-slate-600">
            <Shield size={14} className="text-slate-400 shrink-0" />
            <span className="capitalize">{activeThread.role || "Standard User"}</span>
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="p-4 space-y-1">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
          Actions
        </span>

        <button
          type="button"
          onClick={() => onArchiveThread(activeThread.id)}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          {activeThread.isArchived ? (
            <>
              <ArchiveRestore size={15} className="text-slate-500" />
              <span>Unarchive Conversation</span>
            </>
          ) : (
            <>
              <Archive size={15} className="text-slate-500" />
              <span>Archive Conversation</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={openDeleteConfirm}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition cursor-pointer"
        >
          <Trash2 size={15} />
          <span>Delete Conversation</span>
        </button>
      </div>
    </aside>

    <ConfirmModal
      open={confirmOpen}
      title="Delete conversation?"
      description={`This will remove ${activeThread.name || "this contact"} from your conversations list and hide the thread from future refreshes.`}
      warning="This action cannot be undone."
      confirmText="Delete conversation"
      confirmClass="bg-red-600 hover:bg-red-700"
      onClose={() => {
        setConfirmOpen(false);
        setPendingAction(null);
      }}
      onConfirm={handleConfirm}
    />
    </>
  );
}