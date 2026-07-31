import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { useSocketContext } from "../../../context/SocketContext";

export function useCommunications(initialThreads = [], initialMessages = {}) {
  const [threads, setThreads] = useState(initialThreads);
  const [messages, setMessages] = useState(initialMessages);
  const [loading, setLoading] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState(initialThreads[0]?.id ?? null);

  const { user } = useAuth();
  const { socket } = useSocketContext();

  // Fix 2: Safe resolution using nullish coalescing
  const activeThread =
    threads.find((t) => String(t.id) === String(activeThreadId)) ?? null;

  const activeMessages = useMemo(
    () => messages[activeThreadId] || [],
    [messages, activeThreadId]
  );

  // Fix 3: Expose initialize helper
  const initializeConversation = useCallback((otherId) => {
    setMessages((prev) => ({
      ...prev,
      [otherId]: prev[otherId] || [],
    }));
  }, []);

  const buildThreadsFromCommunications = useCallback((comms = []) => {
    const map = new Map();
    comms.forEach((c) => {
      const other = c.sender?._id === user?._id ? c.recipient : c.sender;
      if (!other) return;
      const id = other._id || other.id;
      const existing = map.get(id) || {
        id,
        name: `${other.firstName || ""} ${other.lastName || ""}`.trim() || other.email || "Unknown",
        role: other.role || "User",
        avatar: other.avatar || other.profilePicture || null,
        lastMessage: "",
        time: "",
        unread: 0,
        online: false,
        isArchived: c.isArchived || false,
      };

      existing.lastMessage = c.body || existing.lastMessage;
      existing.time = c.createdAt
        ? new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : existing.time;

      if (c.recipient && String(c.recipient._id || c.recipient) === String(user?._id) && !c.isRead) {
        existing.unread = (existing.unread || 0) + 1;
      }

      map.set(id, existing);
    });

    return Array.from(map.values()).sort((a, b) => (b.time || "").localeCompare(a.time || ""));
  }, [user]);

  // Fix 1: Merge instead of replacing
  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/communications");
      const comms = data?.communications || (Array.isArray(data) ? data : []);
      const built = buildThreadsFromCommunications(comms);

      if (built.length > 0) {
        setThreads((prev) => {
          const merged = [...prev];

          built.forEach((thread) => {
            const index = merged.findIndex(
              (t) => String(t.id) === String(thread.id)
            );

            if (index >= 0) {
              merged[index] = {
                ...merged[index],
                ...thread,
              };
            } else {
              merged.push(thread);
            }
          });

          return merged;
        });

        if (!activeThreadId) {
          setActiveThreadId(built[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load communications:", err);
    } finally {
      setLoading(false);
    }
  }, [buildThreadsFromCommunications, activeThreadId]);

  const fetchConversation = useCallback(async (otherId) => {
    try {
      const { data } = await api.get(`/api/communications/user/${otherId}`);
      const comms = data?.communications || (Array.isArray(data) ? data : []);
      const msgs = comms.map((c) => ({
        id: c._id || c.id,
        sender: String(c.sender?._id || c.sender) === String(user?._id) ? "me" : String(c.sender?._id),
        text: c.body,
        time: c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
      }));
      setMessages((prev) => ({ ...prev, [otherId]: msgs }));
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  }, [user]);

  const sendMessage = async (text) => {
    if (!text.trim() || !activeThreadId) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const tempId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    
    const payload = { id: tempId, sender: "me", text: text.trim(), time };

    setMessages((prev) => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] || []), payload],
    }));

    setThreads((prev) =>
      prev.map((t) => (String(t.id) === String(activeThreadId) ? { ...t, lastMessage: text, time } : t))
    );

    try {
      await api.post("/api/communications", { recipientId: activeThreadId, body: text });
    } catch (err) {
      console.error("Send message failed:", err);
    }
  };

  const archiveThread = async (threadId) => {
    const targetThread = threads.find((t) => String(t.id) === String(threadId));
    if (!targetThread) return;

    const nextArchivedState = !targetThread.isArchived;

    setThreads((prev) =>
      prev.map((t) => (String(t.id) === String(threadId) ? { ...t, isArchived: nextArchivedState } : t))
    );

    try {
      await api.patch(`/api/communications/archive/${threadId}`, { isArchived: nextArchivedState });
    } catch (err) {
      console.error("Failed to toggle archive:", err);
    }
  };

  const deleteThread = async (threadId) => {
    setThreads((prev) => prev.filter((t) => String(t.id) !== String(threadId)));
    setMessages((prev) => {
      const next = { ...prev };
      delete next[threadId];
      return next;
    });

    if (String(activeThreadId) === String(threadId)) {
      setActiveThreadId(null);
    }

    try {
      await api.delete(`/api/communications/thread/${threadId}`);
    } catch (err) {
      console.error("Failed to delete thread:", err);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    if (activeThreadId && !(messages[activeThreadId] && messages[activeThreadId].length)) {
      fetchConversation(activeThreadId);
    }
  }, [activeThreadId, fetchConversation, messages]);

  return {
    threads,
    setThreads,
    activeThread,
    activeThreadId,
    setActiveThreadId,
    activeMessages,
    sendMessage,
    archiveThread,
    deleteThread,
    initializeConversation,
    loading,
    fetchConversation,
  };
}