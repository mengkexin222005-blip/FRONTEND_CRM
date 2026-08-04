import React, { useState, useRef, useEffect } from "react";
import { Paperclip, Image as ImageIcon, Smile, Send, X, FileText } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

export default function MessageComposer({ activeThreadName, onSendMessage }) {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() && !selectedFile && !imagePreview) return;

    onSendMessage(text.trim() || (imagePreview ? "Sent an image" : "Sent an attachment"));

    setText("");
    setSelectedFile(null);
    setImagePreview(null);
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="relative border-t border-slate-200 bg-white p-3 flex-shrink-0">
      {/* Hidden File Inputs */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageChange} className="hidden" />

      {/* Full Emoji & Sticker Picker Popover */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-16 left-4 z-50 shadow-2xl rounded-2xl">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            height={380}
            width={320}
            searchPlaceHolder="Search emoji..."
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}

      {/* Attachment / Image Preview Area */}
      {(selectedFile || imagePreview) && (
        <div className="mb-2 flex items-center gap-2">
          {imagePreview && (
            <div className="relative group">
              <img
                src={imagePreview}
                alt="Upload preview"
                className="h-12 w-12 rounded-lg object-cover border border-slate-200"
              />
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="absolute -top-1.5 -right-1.5 rounded-full bg-slate-800 text-white p-0.5 hover:bg-red-600 transition"
              >
                <X size={10} />
              </button>
            </div>
          )}

          {selectedFile && (
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
              <FileText size={14} className="text-slate-400" />
              <span className="max-w-[150px] truncate">{selectedFile.name}</span>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="ml-1 text-slate-400 hover:text-red-600 transition"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          >
            <Paperclip size={18} />
          </button>

          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            title="Attach photo"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          >
            <ImageIcon size={18} />
          </button>

          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            title="Emojis"
            className={`rounded-lg p-1.5 transition cursor-pointer ${
              showEmojiPicker ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            }`}
          >
            <Smile size={18} />
          </button>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Message ${activeThreadName || "user"}...`}
            className="rounded-lg w-full bg-transparent px-2 text-xs text-slate-800 placeholder-slate-400 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim() && !selectedFile && !imagePreview}
          className="flex items-center gap-1.5 rounded-xl bg-[#E7000B] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 transition cursor-pointer shrink-0"
        >
          <Send size={14} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}