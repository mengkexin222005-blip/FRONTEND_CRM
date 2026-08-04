import React, { useEffect, useMemo, useRef } from "react";
import MessageBubble from "./MessageBubble";

const formatDayLabel = (value) => {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return "Today";
  }

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) => a.toDateString() === b.toDateString();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export default function MessageList({
  activeMessages = [],
  onEditMessage,
  onDeleteMessage,
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [activeMessages]);

  const groupedMessages = useMemo(() => {
    const groups = [];
    activeMessages.forEach((msg) => {
      const dayKey = msg.createdAt ? new Date(msg.createdAt).toDateString() : "unknown";
      const lastGroup = groups[groups.length - 1];

      if (!lastGroup || lastGroup.dayKey !== dayKey) {
        groups.push({ dayKey, label: formatDayLabel(msg.createdAt), messages: [msg] });
      } else {
        lastGroup.messages.push(msg);
      }
    });

    return groups;
  }, [activeMessages]);

  if (activeMessages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-slate-400">
        No messages yet. Start the conversation by sending a message below.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {groupedMessages.map((group) => (
        <div key={group.dayKey} className="mb-3">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px flex-1" />
            <span className="px-3 py-1 text-[7px] font-semibold text-slate-400">
              {group.label}
            </span>
            <div className="h-px flex-1" />
          </div>

          <div className="space-y-3">
            {group.messages.map((msg) => (
              <MessageBubble
                key={msg.id || msg._id}
                msg={msg}
                onEdit={onEditMessage}
                onDelete={onDeleteMessage}
              />
            ))}
          </div>
        </div>
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}
