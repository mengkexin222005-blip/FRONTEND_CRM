import React, { useEffect, useRef } from "react";

export default function MessageList({ activeMessages = [] }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  if (!activeMessages || activeMessages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-slate-400">
        No messages yet. Start the conversation by sending a message below.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {activeMessages.map((msg) => {
        const isMe = msg.sender === "me";

        return (
          <div
            key={msg.id || msg._id}
            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
          >
            {/* Message Bubble */}
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm font-normal shadow-sm ${
                isMe
                  ? "bg-[#E7000B] text-white rounded-br-none"
                  : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
              }`}
            >
              <p className="whitespace-pre-wrap wrap-break-word leading-relaxed">{msg.text}</p>
            </div>

            {/* Timestamp Outside the Bubble */}
            <span
              className={`mt-1 text-[2px] font-[5px] text-slate-400 px-1 ${
                isMe ? "text-right" : "text-left"
              }`}
            >
              {msg.time}
            </span>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}