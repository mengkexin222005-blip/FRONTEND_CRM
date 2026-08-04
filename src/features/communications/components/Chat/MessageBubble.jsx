import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";

export default function MessageBubble({ msg, onEdit, onDelete }) {
  const isMe = msg.sender === "me";
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.text || "");
  const [showTimestamp, setShowTimestamp] = useState(Boolean(msg.showTimestamp));

  const displayText = useMemo(() => msg.text || "", [msg.text]);

  const openEditor = () => {
    setEditText(displayText);
    setIsEditing(true);
  };

  // Toggle timestamp when clicking the bubble manually
  const toggleTimestamp = () => {
    if (!isEditing) {
      setShowTimestamp((prev) => !prev);
    }
  };

  useEffect(() => {
    if (!msg.showTimestamp) return;

    const timer = window.setTimeout(() => setShowTimestamp(false), 1800);
    return () => window.clearTimeout(timer);
  }, [msg.showTimestamp, msg.id]);

  const handleSave = () => {
    if (editText.trim() && editText !== msg.text) {
      onEdit(msg.id, editText);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditText(msg.text);
    }
  };

  return (
    <div
      className={`group relative mb-1 flex flex-col ${
        isMe ? "items-end" : "items-start"
      }`}
    >
      {/* Nano "Edited" label */}
      {!isEditing && msg.isEdited && !msg.isDeleted && (
        <span
          className={`text-[7px] leading-none italic text-slate-400 scale-90 transform-gpu ${
            isMe ? "self-end origin-bottom-right" : "self-start origin-bottom-left"
          }`}
        >
          Edited
        </span>
      )}

      <div className="flex items-center gap-1 max-w-[85%]">
        {/* Compact Edit/Delete action toolbar */}
        {isMe && !isEditing && !msg.isDeleted && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 rounded border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={openEditor}
              className="rounded-xl p-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              title="Edit message"
            >
              <Pencil size={13} />
            </button>

            <button
              type="button"
              onClick={() => onDelete(msg.id)}
              className="rounded-xl p-0.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
              title="Delete message"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}

        {/* Compact Message Bubble (Click to toggle timestamp) */}
        <div
          onClick={toggleTimestamp}
          className={`px-3 py-1.5 rounded-xl text-[13px] sm:text-xs leading-snug wrap-break-word select-none transition-all ${
            isEditing ? "" : "cursor-pointer"
          } ${
            isMe
              ? "bg-[#E7000B] text-white rounded-br-none"
              : "bg-slate-100 text-slate-800 rounded-bl-none"
          }`}
        >
          {isEditing ? (
            <div
              className="flex flex-col gap-1 min-w-44 py-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-full rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-slate-900 focus:outline-none"
              />

              <div className="flex justify-end gap-1 text-[8px]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded bg-slate-200 px-1.5 py-0.5 text-slate-700 hover:bg-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded bg-slate-800 px-1.5 py-0.5 text-white hover:bg-slate-900 transition cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className={msg.isDeleted ? "italic text-slate-400" : ""}>{displayText}</div>
          )}
        </div>
      </div>

      {showTimestamp && (
        <span
          className={`mt-0.5 text-[7px] leading-none text-slate-400 select-none scale-90 transform-gpu transition-all ${
            isMe ? "origin-top-right" : "origin-top-left"
          }`}
        >
          {msg.time}
        </span>
      )}
    </div>
  );
}