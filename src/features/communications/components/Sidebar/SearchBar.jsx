import React from "react";
import { Search, SquarePen, X } from "lucide-react";

export default function SearchBar({
  searchInputRef,
  showNew,
  setShowNew,
  searchQuery,
  setSearchQuery,
  userSearch,
  setUserSearch,
  hasThreads,
  onActivateNewConversation,
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder={showNew ? "Search user by name or email..." : "Search conversations..."}
          value={showNew ? userSearch : searchQuery}
          onChange={(e) => (showNew ? setUserSearch(e.target.value) : setSearchQuery(e.target.value))}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs outline-none transition focus:border-red-400 focus:bg-white"
        />
        {showNew && (
          <button
            type="button"
            onClick={() => {
              setShowNew(false);
              setUserSearch("");
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Show icon on top of search bar */}
      {hasThreads && !showNew && (
        <button
          type="button"
          onClick={onActivateNewConversation}
          title="New Conversation"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-[#E7000B] active:scale-95 cursor-pointer"
        >
          <SquarePen size={18} />
        </button>
      )}
    </div>
  );
}