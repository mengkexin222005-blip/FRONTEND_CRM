// src/pages/CommunicationPage.jsx
import React from "react";
import { PageBase } from "../../components/page";
import ChatLayout from "./components/ChatLayout";
import { useCommunications } from "./hooks/useCommunications";

export default function CommunicationPage() {
  const {
    threads,
    setThreads,
    activeThread,
    activeThreadId,
    setActiveThreadId,
    activeMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    archiveThread,
    deleteThread,
    loading,
    fetchConversation,
    initializeConversation,
  } = useCommunications();

  if (loading && (!threads || threads.length === 0)) {
    return (
      <PageBase>
        <div className="flex flex-1 h-full w-full items-center justify-center">
          <p className="text-xs text-slate-400">Loading communications...</p>
        </div>
      </PageBase>
    );
  }

  return (
    <PageBase>
      <div className="flex flex-1 flex-col h-full w-full min-h-0">
        <ChatLayout
          threads={threads || []}
          setThreads={setThreads}
          activeThread={activeThread}
          activeThreadId={activeThreadId}
          setActiveThreadId={setActiveThreadId}
          activeMessages={activeMessages}
          onSendMessage={sendMessage}
          onArchiveThread={archiveThread}
          onDeleteThread={deleteThread}
          fetchConversation={fetchConversation}
          initializeConversation={initializeConversation}
          onEditMessage={editMessage}
          onDeleteMessage={deleteMessage}
        />
      </div>
    </PageBase>
  );
}