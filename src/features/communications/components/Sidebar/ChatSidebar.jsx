import React, { useState, useEffect, useRef } from "react";
import SearchBar from "./SearchBar";
import ChatFilters from "./ChatFilters";
import ConversationList from "./ConversationList";
import api from "../../../../services/api";

export default function ChatSidebar({
  threads,
  setThreads,
  activeThreadId,
  setActiveThreadId,
  fetchConversation,
  getRoleBadgeStyles,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const searchInputRef = useRef(null);

  const handleActivateNewConversation = () => {
    setShowNew(true);
    setTimeout(() => {
      if (searchInputRef.current) searchInputRef.current.focus();
    }, 50);
  };

  const filteredThreads = threads.filter((thread) => {
    const match =
      (thread.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (thread.lastMessage || "").toLowerCase().includes(searchQuery.toLowerCase());

    switch (statusFilter) {
      case "unread":
        return match && thread.unread > 0;
      case "archived":
        return match && thread.isArchived;
      default:
        return match && !thread.isArchived;
    }
  });

  // Stored Database Users Query
  useEffect(() => {
    let active = true;

    const doSearch = async () => {
      if (!showNew) {
        setUserResults([]);
        return;
      }

      setIsSearchingUsers(true);
      try {
        const query = userSearch.trim().toLowerCase();
        let endpoint = "/api/users";
        if (query) endpoint += `?search=${encodeURIComponent(query)}`;

        const res = await api.get(endpoint);
        let rawUsers = res.data?.users || (Array.isArray(res.data) ? res.data : res.data?.data || []);

        if (query) {
          rawUsers = rawUsers.filter((u) =>
            `${u.firstName || ""} ${u.lastName || ""} ${u.email || ""}`.toLowerCase().includes(query)
          );
        }

        if (active) setUserResults(rawUsers);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        if (active) setUserResults([]);
      } finally {
        if (active) setIsSearchingUsers(false);
      }
    };

    const t = setTimeout(doSearch, 200);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [userSearch, showNew]);

  // INSTANT SINGLE-CLICK SELECTION HANDLER
  const handleSelectUserToChat = (u) => {
    const otherId = u._id || u.employeeId || u.id;
    const name =
      `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
      u.email ||
      "User";
  
    // 1. Immediately update threads list
    setThreads((prev) => {
      const exists = prev.some(
        (t) => String(t.id) === String(otherId)
      );
  
      if (exists) return prev;
  
      return [
        {
          id: otherId,
          name,
          role: u.role || "User",
          lastMessage: "",
          time: "Just now",
          unread: 0,
          online: true,
          isArchived: false,
        },
        ...prev,
      ];
    });
  
    // 2. Instantly set active thread
    setActiveThreadId(otherId);

    // 3. Immediately close suggestions view and clear search
    setShowNew(false);
    setUserSearch("");
    setUserResults([]);

    // 4. Fetch messages in background without blocking UI render
    if (typeof fetchConversation === "function") {
      fetchConversation(otherId).catch((err) =>
        console.error("Failed to load conversation:", err)
      );
    }
  };

  return (
    <aside className="flex w-85 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-3.5 shrink-0">
        <SearchBar
          searchInputRef={searchInputRef}
          showNew={showNew}
          setShowNew={setShowNew}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          userSearch={userSearch}
          setUserSearch={setUserSearch}
          hasThreads={threads.length > 0}
          onActivateNewConversation={handleActivateNewConversation}
        />

        {!showNew && (
          <ChatFilters statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {showNew ? (
          <div className="p-2 space-y-1">
            <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {isSearchingUsers ? "Loading database users..." : `Suggestions (${userResults.length})`}
            </div>

            {userResults.length === 0 && !isSearchingUsers ? (
              <div className="p-6 text-center text-xs text-slate-400">No users found.</div>
            ) : (
              userResults.map((u) => {
                const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "User";
                const initial = (fullName[0] || "U").toUpperCase();

                return (
                  <button
                  key={u._id || u.employeeId || u.id}
                  type="button"
                  onClick={() => handleSelectUserToChat(u)}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-50 rounded-lg transition border border-transparent hover:border-slate-100 cursor-pointer block"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-red-50 text-[#E7000B] flex items-center justify-center text-xs font-bold shrink-0 border border-red-100">
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-xs font-semibold text-slate-800">{fullName}</span>
                          {u.role && (
                            <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${getRoleBadgeStyles(u.role)}`}>
                              {u.role}
                            </span>
                          )}
                        </div>
                        <div className="truncate text-[11px] text-slate-400">{u.email}</div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <ConversationList
            threads={filteredThreads}
            activeThreadId={activeThreadId}
            onSelectThread={(id) => {
              setActiveThreadId(id);
              setThreads((prev) =>
                prev.map((t) => (String(t.id) === String(id) ? { ...t, unread: 0 } : t))
              );
            }}
            onActivateNewConversation={handleActivateNewConversation}
            getRoleBadgeStyles={getRoleBadgeStyles}
          />
        )}
      </div>
    </aside>
  );
}