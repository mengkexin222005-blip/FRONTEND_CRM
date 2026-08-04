import React, { useState } from "react";
import { SquarePen, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { getAvatarUrl } from "../../utils/avatar";
import ConfirmModal from "../../../../components/modal/ConfirmModal";

export default function ConversationList({
  threads,
  activeThreadId,
  onSelectThread,
  onActivateNewConversation,
  onArchiveThread,
  onDeleteThread,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingThread, setPendingThread] = useState(null);

  const openDeleteConfirm = (thread) => {
    setPendingThread(thread);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingThread) return;
    await onDeleteThread(pendingThread.id);
    setConfirmOpen(false);
    setPendingThread(null);
  };

  if (threads.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <button
          type="button"
          onClick={onActivateNewConversation}
          className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 transition hover:border-red-300 hover:bg-red-50/30 cursor-pointer"
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-[#E7000B] transition group-hover:scale-110">
            <SquarePen size={28} />
          </div>
          <span className="text-xs font-bold text-slate-800 group-hover:text-[#E7000B]">
            Start New Conversation
          </span>
          <p className="mt-1 text-[11px] text-slate-400 max-w-45">
            Click here to focus search and select a user.
          </p>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-slate-100">
        {threads.map((thread) => {
          const isActive = String(activeThreadId) === String(thread.id);
          const profileImage =
            thread.avatar ||
            thread.profilePicture ||
            thread.avatarUrl ||
            thread.image ||
            null;
          const avatar = getAvatarUrl(profileImage);

          const initials = (thread.name || "")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          // Get the latest message object if thread has a messages array
          const latestMessageObj =
            Array.isArray(thread.messages) && thread.messages.length > 0
              ? thread.messages[thread.messages.length - 1]
              : null;

          // Extract recent text and timestamp across possible data formats
          const lastMessageText =
            typeof thread.lastMessage === "string"
              ? thread.lastMessage
              : thread.lastMessage?.text ||
                thread.recentMessage ||
                latestMessageObj?.text ||
                latestMessageObj?.body ||
                "No messages yet";

          const lastMessageTime =
            thread.time ||
            thread.lastMessageTime ||
            latestMessageObj?.time ||
            "";

          return (
            <div
              key={thread.id}
              onClick={() => onSelectThread(thread.id)}
              className={`group relative w-full border-b border-slate-100 px-3.5 py-2 text-left transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-red-50/50 border-l-4 border-l-[#E7000B]"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Avatar Container */}
                <div className="relative shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={thread.name}
                      className="h-8 w-8 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 border border-slate-200/80">
                      {initials || "U"}
                    </div>
                  )}

                  {/* Online Indicator Badge */}
                  {thread.online && (
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white bg-emerald-500" />
                  )}
                </div>

                {/* Text Info */}
                <div className="min-w-0 flex-1">
                  {/* Name & Time */}
                  <div className="flex items-center justify-between gap-1">
                    <h3
                      className={`truncate text-xs ${
                        thread.unread
                          ? "font-bold text-slate-900"
                          : "font-semibold text-slate-700"
                      }`}
                    >
                      {thread.name}
                    </h3>

                    {/* Time / Actions on Hover */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-slate-400 group-hover:hidden">
                        {lastMessageTime}
                      </span>

                      {/* Hover Quick Actions */}
                      <div className="hidden group-hover:flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onArchiveThread(thread.id);
                          }}
                          title={thread.isArchived ? "Unarchive" : "Archive"}
                          className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                        >
                          {thread.isArchived ? (
                            <ArchiveRestore size={13} />
                          ) : (
                            <Archive size={13} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteConfirm(thread);
                          }}
                          title="Delete conversation"
                          className="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-600 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Last Message & Unread Badge */}
                  <div className="mt-0.5 flex items-center justify-between gap-1">
                    <p
                      className={`truncate text-[11px] leading-tight ${
                        thread.unread
                          ? "font-semibold text-slate-800"
                          : "text-slate-500"
                      }`}
                    >
                      {lastMessageText}
                    </p>
                    {thread.unread > 0 && (
                      <span className="shrink-0 rounded-full bg-[#E7000B] px-1.5 py-0.2 text-[9px] font-bold text-white">
                        {thread.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete conversation?"
        description={`This will remove ${
          pendingThread?.name || "this contact"
        } from your conversations list.`}
        warning="This action cannot be undone."
        confirmText="Delete conversation"
        confirmClass="bg-red-600 hover:bg-red-700"
        onClose={() => {
          setConfirmOpen(false);
          setPendingThread(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}