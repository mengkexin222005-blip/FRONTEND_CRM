import React, { useState } from "react";
import ChatSidebar from "./Sidebar/ChatSidebar";
import ChatHeader from "./Chat/ChatHeader";
import MessageList from "./Chat/MessageList";
import MessageComposer from "./Chat/MessageComposer";
import ConversationInfoDrawer from "./Chat/ConversationInfoDrawer";
import { Inbox } from "lucide-react";

export default function ChatLayout({
  threads,
  setThreads,
  activeThread,
  activeThreadId,
  setActiveThreadId,
  activeMessages,
  onSendMessage,
  onArchiveThread,
  onDeleteThread,
  fetchConversation,
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const getRoleBadgeStyles = (role) => {
    switch (role?.toLowerCase()) {
      case "client":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "lead":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "prospect":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    
    <div className="flex flex-1 h-full w-full min-h-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <ChatSidebar
        threads={threads}
        setThreads={setThreads}
        activeThreadId={activeThreadId}
        setActiveThreadId={setActiveThreadId}
        onArchiveThread={onArchiveThread}
        onDeleteThread={onDeleteThread}
        fetchConversation={fetchConversation}
        getRoleBadgeStyles={getRoleBadgeStyles}
      />

      {activeThread ? (
        <div className="flex flex-1 overflow-hidden">
          <section className="flex flex-1 flex-col overflow-hidden bg-slate-50/50">
            <ChatHeader
              activeThread={activeThread}
              getRoleBadgeStyles={getRoleBadgeStyles}
              onToggleDrawer={() => setIsDrawerOpen((prev) => !prev)}
              isDrawerOpen={isDrawerOpen}
            />
            <MessageList activeMessages={activeMessages} />
            <MessageComposer activeThreadName={activeThread.name} onSendMessage={onSendMessage} />
          </section>

          {isDrawerOpen && (
            <ConversationInfoDrawer
              activeThread={activeThread}
              getRoleBadgeStyles={getRoleBadgeStyles}
              onClose={() => setIsDrawerOpen(false)}
              onArchiveThread={onArchiveThread}
              onDeleteThread={onDeleteThread}
            />
          )}
        </div>
      ) : (
        <section className="flex flex-1 flex-col items-center justify-center bg-slate-50/50">
          <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm text-slate-300 mb-3">
            <Inbox size={36} />
          </div>
          <h2 className="text-sm font-bold text-slate-800">Select a conversation</h2>
          <p className="mt-1 max-w-xs text-center text-xs text-slate-400 leading-relaxed">
            Choose a contact from the left sidebar or start a new conversation to begin chatting.
          </p>
        </section>
      )}
    </div>
  );
}