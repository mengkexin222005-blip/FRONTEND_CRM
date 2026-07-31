import React from "react";

export default function MessageBubble({ msg }) {
  const isMine = msg.sender === "me";

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
          isMine
            ? "rounded-br-none bg-[#E7000B] text-white"
            : "rounded-bl-none border border-slate-200 bg-white text-slate-800"
        }`}
      >
        <p className="whitespace-pre-wrap text-xs leading-relaxed">{msg.text}</p>
        <p className={`mt-1 text-[9px] ${isMine ? "text-red-100 text-right" : "text-slate-400 text-left"}`}>
          {msg.time}
        </p>
      </div>
    </div>
  );
}