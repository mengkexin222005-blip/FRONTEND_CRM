import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { useSocketContext } from "../../../context/SocketContext";

export function useCommunications(initialThreads = [], initialMessages = {}) {
  const [threads, setThreads] = useState(initialThreads);
  const [messages, setMessages] = useState(initialMessages);
  const [loading, setLoading] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState(
    initialThreads[0]?.id ?? null
  );
  const [deletedThreadIds, setDeletedThreadIds] = useState([]);
  const [archivedThreadIds, setArchivedThreadIds] = useState([]);

  const { user } = useAuth();
  const { socket } = useSocketContext();
  const threadsRef = useRef(threads);
  const messagesRef = useRef(messages);
  const activeThreadIdRef = useRef(activeThreadId);

  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);

  const currentUserId = useMemo(() => {
    if (!user) return "";
    return String(user._id || user.id || user.userId || user.employeeId || "");
  }, [user]);

  const deletedThreadIdSet = useMemo(
    () => new Set(deletedThreadIds.map((id) => String(id))),
    [deletedThreadIds]
  );

  const archivedThreadIdSet = useMemo(
    () => new Set(archivedThreadIds.map((id) => String(id))),
    [archivedThreadIds]
  );

  const getEntityId = useCallback((entity) => {
    if (!entity) return "";
    if (typeof entity === "string") return entity;
    return String(entity._id || entity.id || entity.userId || "");
  }, []);

  const formatMessageTimestamp = useCallback((value) => {
    if (!value) {
      return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const normalizeMessage = useCallback(
    (communication) => {
      const senderId = getEntityId(communication?.sender);
      const recipientId = getEntityId(communication?.recipient);
      const isMe = String(senderId) === String(currentUserId);
      const threadId = isMe ? recipientId : senderId;

      return {
        id: communication?._id || communication?.id,
        sender: isMe ? "me" : senderId,
        text: communication?.isDeleted ? "Message is unavailable" : communication?.body || communication?.text || "",
        time: formatMessageTimestamp(communication?.createdAt),
        createdAt: communication?.createdAt || null,
        isEdited: Boolean(communication?.isEdited),
        isDeleted: Boolean(communication?.isDeleted),
        threadId,
      };
    },
    [currentUserId, formatMessageTimestamp, getEntityId]
  );

  const activeThread =
    threads.find((t) => String(t.id) === String(activeThreadId)) ?? null;

  const activeMessages = useMemo(
    () => messages[activeThreadId] || [],
    [messages, activeThreadId]
  );

  const removeConversationThread = useCallback(
    (threadId, fallbackThreadId = null) => {
      const normalizedThreadId = String(threadId);

      setDeletedThreadIds((prev) =>
        prev.includes(normalizedThreadId) ? prev : [...prev, normalizedThreadId]
      );

      setThreads((prev) => prev.filter((t) => String(t.id) !== normalizedThreadId));
      setMessages((prev) => {
        const next = { ...prev };
        delete next[normalizedThreadId];
        return next;
      });

      setActiveThreadId((prev) => {
        if (String(prev) === normalizedThreadId) {
          return fallbackThreadId ?? null;
        }
        return prev;
      });
    },
    []
  );

  const initializeConversation = useCallback((otherId) => {
    setMessages((prev) => ({
      ...prev,
      [otherId]: prev[otherId] || [],
    }));
  }, []);

  const buildThreadsFromCommunications = useCallback(
    (comms = []) => {
      const map = new Map();

      comms.forEach((c) => {
        const senderId = getEntityId(c?.sender);
        const recipientId = getEntityId(c?.recipient);
        const other = String(senderId) === String(currentUserId) ? c?.recipient : c?.sender;
        if (!other) return;

        const otherId = getEntityId(other);
        const avatar =
          other.avatar ||
          other.profilePicture ||
          other.avatarUrl ||
          other.image ||
          null;

        const existing = map.get(otherId) || {
          id: otherId,
          name:
            `${other.firstName || ""} ${other.lastName || ""}`.trim() ||
            other.email ||
            "Unknown",
          role: other.role || "User",
          avatar,
          lastMessage: "",
          time: "",
          unread: 0,
          online: false,
          isArchived: archivedThreadIdSet.has(String(otherId)),
          createdAt: c?.createdAt || null,
        };

        existing.lastMessage = c?.body || existing.lastMessage;
        existing.time = c?.createdAt ? formatMessageTimestamp(c.createdAt) : existing.time;
        existing.createdAt = c?.createdAt || existing.createdAt;
        existing.isArchived = archivedThreadIdSet.has(String(otherId)) || Boolean(existing.isArchived);

        if (String(recipientId) === String(currentUserId) && !c?.isRead) {
          existing.unread = (existing.unread || 0) + 1;
        }

        map.set(otherId, existing);
      });

      return Array.from(map.values())
        .filter((thread) => !deletedThreadIdSet.has(String(thread.id)))
        .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    },
    [archivedThreadIdSet, currentUserId, deletedThreadIdSet, formatMessageTimestamp, getEntityId]
  );

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
              merged[index] = { ...merged[index], ...thread };
            } else {
              merged.push(thread);
            }
          });

          return merged;
        });

        if (!activeThreadIdRef.current) {
          setActiveThreadId(built[0].id);
        }
      } else {
        setThreads([]);
        setActiveThreadId(null);
      }
    } catch (err) {
      console.error("Failed to load communications:", err);
    } finally {
      setLoading(false);
    }
  }, [buildThreadsFromCommunications]);

  const fetchConversation = useCallback(
    async (otherId) => {
      try {
        const { data } = await api.get(`/api/communications/user/${otherId}`);
        const comms = data?.communications || (Array.isArray(data) ? data : []);
        const msgs = comms.map((c) => normalizeMessage(c));
        setMessages((prev) => ({ ...prev, [otherId]: msgs }));
      } catch (err) {
        console.error("Failed to load conversation:", err);
      }
    },
    [normalizeMessage]
  );

  const markThreadAsRead = useCallback(
    async (otherId) => {
      if (!otherId || !currentUserId) return;

      try {
        await api.patch(`/api/communications/user/${otherId}/read`);
        setThreads((prev) =>
          prev.map((thread) =>
            String(thread.id) === String(otherId)
              ? { ...thread, unread: 0 }
              : thread
          )
        );
      } catch (err) {
        console.error("Failed to mark conversation as read:", err);
      }
    },
    [currentUserId]
  );

  const sendMessage = async (text) => {
    if (!text.trim() || !activeThreadId) return;

    const time = formatMessageTimestamp(new Date());
    const tempId = crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString();

    const payload = {
      id: tempId,
      sender: "me",
      text: text.trim(),
      time,
      createdAt: new Date().toISOString(),
      showTimestamp: true,
      isEdited: false,
    };

    const previousMessages = messages[activeThreadId] || [];

    setMessages((prev) => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] || []), payload],
    }));

    setThreads((prev) =>
      prev.map((t) =>
        String(t.id) === String(activeThreadId)
          ? { ...t, lastMessage: text, time }
          : t
      )
    );

    try {
      const { data } = await api.post("/api/communications", {
        recipientId: activeThreadId,
        body: text,
      });

      const serverMessage = data?.communication;
      if (serverMessage) {
        const normalized = normalizeMessage(serverMessage);
        setMessages((prev) => ({
          ...prev,
          [activeThreadId]: [
            ...(prev[activeThreadId] || []).filter((msg) => String(msg.id) !== String(tempId)),
            { ...payload, ...normalized, id: normalized.id || tempId, createdAt: normalized.createdAt || payload.createdAt, showTimestamp: true },
          ],
        }));
      }
    } catch (err) {
      console.error("Send message failed:", err);
      setMessages((prev) => ({
        ...prev,
        [activeThreadId]: previousMessages,
      }));
    }
  };

  const editMessage = async (messageId, newText) => {
    if (!newText.trim() || !activeThreadId) return;

    const nextText = newText.trim();

    setMessages((prev) => ({
      ...prev,
      [activeThreadId]: (prev[activeThreadId] || []).map((msg) =>
        String(msg.id) === String(messageId)
          ? { ...msg, text: nextText, isEdited: true }
          : msg
      ),
    }));

    try {
      const { data } = await api.patch(`/api/communications/${messageId}`, {
        body: nextText,
      });

      const serverMessage = data?.communication;
      if (serverMessage) {
        const normalized = normalizeMessage(serverMessage);
        setMessages((prev) => ({
          ...prev,
          [activeThreadId]: (prev[activeThreadId] || []).map((msg) =>
            String(msg.id) === String(messageId)
              ? { ...msg, ...normalized, text: nextText, isEdited: true, createdAt: normalized.createdAt || msg.createdAt }
              : msg
          ),
        }));
      }
    } catch (err) {
      console.error("Failed to edit message:", err);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!activeThreadId) return;

    const previousMessages = messagesRef.current[activeThreadId] || [];
    const previousThreads = threadsRef.current;
    const previousActiveThreadId = activeThreadId;

    const nextMessages = (previousMessages || []).map((msg) =>
      String(msg.id) === String(messageId)
        ? { ...msg, text: "Message is unavailable", isDeleted: true, isEdited: false }
        : msg
    );

    setMessages((prev) => ({
      ...prev,
      [activeThreadId]: nextMessages,
    }));

    setThreads((prev) =>
      prev.map((thread) => {
        if (String(thread.id) !== String(activeThreadId)) return thread;

        const latestVisibleMessage = [...nextMessages].reverse().find((msg) => !msg.isDeleted);
        return {
          ...thread,
          lastMessage: latestVisibleMessage ? latestVisibleMessage.text : "Message is unavailable",
          time: thread.time,
        };
      })
    );

    try {
      await api.delete(`/api/communications/${messageId}`);
    } catch (err) {
      console.error("Failed to delete message:", err);

      setMessages((prev) => ({
        ...prev,
        [activeThreadId]: previousMessages,
      }));
      setThreads(previousThreads);
      setActiveThreadId(previousActiveThreadId);
    }
  };

  const deleteThread = async (threadId) => {
    const normalizedThreadId = String(threadId);
    const fallbackThreadId = threadsRef.current
      .filter((thread) => String(thread.id) !== normalizedThreadId)
      .map((thread) => String(thread.id))[0] || null;

    try {
      await api.delete(`/api/communications/user/${normalizedThreadId}`);
      removeConversationThread(normalizedThreadId, fallbackThreadId);
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const archiveThread = async (threadId) => {
    const targetThread = threadsRef.current.find((t) => String(t.id) === String(threadId));
    if (!targetThread) return;

    const nextArchivedState = !targetThread.isArchived;

    try {
      await api.patch(`/api/communications/user/${threadId}/archive`, {
        isArchived: nextArchivedState,
      });

      setArchivedThreadIds((prev) => {
        const normalizedThreadId = String(threadId);
        if (nextArchivedState) {
          return prev.includes(normalizedThreadId) ? prev : [...prev, normalizedThreadId];
        }

        return prev.filter((id) => String(id) !== normalizedThreadId);
      });

      setThreads((prev) =>
        prev.map((t) =>
          String(t.id) === String(threadId)
            ? { ...t, isArchived: nextArchivedState }
            : t
        )
      );
    } catch (err) {
      console.error("Failed to update archive state:", err);
    }
  };

  // Socket Real-time Listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      const formattedMsg = normalizeMessage(newMsg);
      const otherId = formattedMsg.threadId;
      const otherUser = newMsg?.sender && String(newMsg.sender?._id || newMsg.sender) !== String(currentUserId)
        ? newMsg.sender
        : newMsg?.recipient;
      const displayName = otherUser
        ? `${otherUser.firstName || ""} ${otherUser.lastName || ""}`.trim() || otherUser.email || "Unknown"
        : "Unknown";

      setMessages((prev) => ({
        ...prev,
        [otherId]: [
          ...(prev[otherId] || []).filter(
            (msg) => String(msg.id) !== String(formattedMsg.id)
          ),
          { ...formattedMsg, sender: formattedMsg.sender, text: formattedMsg.text, showTimestamp: true, createdAt: formattedMsg.createdAt || new Date().toISOString() },
        ],
      }));

      setThreads((prev) => {
        const exists = prev.some((t) => String(t.id) === String(otherId));
        if (!exists) {
          const newThread = {
            id: otherId,
            name: displayName,
            role: otherUser?.role || "User",
            avatar:
              otherUser?.avatar ||
              otherUser?.profilePicture ||
              otherUser?.avatarUrl ||
              otherUser?.image ||
              null,
            lastMessage: formattedMsg.text,
            time: formattedMsg.time,
            unread: formattedMsg.sender !== "me" ? 1 : 0,
            online: false,
            isArchived: false,
            createdAt: new Date().toISOString(),
          };

          return [newThread, ...prev];
        }

        return prev.map((t) => {
          if (String(t.id) === String(otherId)) {
            const isActive = String(activeThreadId) === String(otherId);
            return {
              ...t,
              lastMessage: formattedMsg.text,
              time: formattedMsg.time,
              unread: formattedMsg.sender !== "me" && !isActive ? (t.unread || 0) + 1 : t.unread,
            };
          }
          return t;
        });
      });
    };

    socket.on("communication:received", handleNewMessage);
    socket.on("communication:sent", handleNewMessage);
    socket.on("communication:updated", (updatedCommunication) => {
      const updatedMessage = normalizeMessage(updatedCommunication);
      const threadId = updatedMessage.threadId;

      setMessages((prev) => ({
        ...prev,
        [threadId]: (prev[threadId] || []).map((msg) =>
          String(msg.id) === String(updatedMessage.id)
            ? {
                ...msg,
                text: updatedMessage.text,
                isEdited: true,
                createdAt: updatedMessage.createdAt || msg.createdAt,
              }
            : msg
        ),
      }));
    });

    socket.on("communication:deleted", ({ communicationId }) => {
      setMessages((prev) => {
        const updated = {};

        Object.entries(prev).forEach(([threadId, msgs]) => {
          const nextMsgs = msgs.map((msg) =>
            String(msg.id) === String(communicationId)
              ? { ...msg, text: "Message is unavailable", isDeleted: true, isEdited: false }
              : msg
          );

          updated[threadId] = nextMsgs;
        });

        return updated;
      });

      setThreads((prev) =>
        prev.map((thread) => {
          const matchingThreadMessages = messagesRef.current[String(thread.id)] || [];
          const latestVisibleMessage = [...matchingThreadMessages]
            .reverse()
            .find((msg) => !msg.isDeleted);

          return {
            ...thread,
            lastMessage: latestVisibleMessage ? latestVisibleMessage.text : "Message is unavailable",
          };
        })
      );
    });

    socket.on("communication:archived", ({ otherUserId, isArchived }) => {
      const normalizedThreadId = String(otherUserId);

      setArchivedThreadIds((prev) =>
        isArchived
          ? prev.includes(normalizedThreadId)
            ? prev
            : [...prev, normalizedThreadId]
          : prev.filter((id) => String(id) !== normalizedThreadId)
      );

      setThreads((prev) =>
        prev.map((thread) =>
          String(thread.id) === normalizedThreadId
            ? { ...thread, isArchived }
            : thread
        )
      );
    });

    socket.on("communication:conversationDeleted", ({ otherUserId }) => {
      const normalizedThreadId = String(otherUserId);
      const fallbackThreadId = threadsRef.current
        .filter((thread) => String(thread.id) !== normalizedThreadId)
        .map((thread) => String(thread.id))[0] || null;

      removeConversationThread(normalizedThreadId, fallbackThreadId);
    });

    return () => {
      socket.off("communication:received", handleNewMessage);
      socket.off("communication:sent", handleNewMessage);
      socket.off("communication:updated");
      socket.off("communication:deleted");
      socket.off("communication:archived");
      socket.off("communication:conversationDeleted");
    };
  }, [activeThreadId, currentUserId, fetchThreads, normalizeMessage, removeConversationThread, socket]);

  useEffect(() => {
    void fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    if (!activeThreadId) return;

    if (!(messages[activeThreadId] && messages[activeThreadId].length)) {
      void fetchConversation(activeThreadId);
    }

    void markThreadAsRead(activeThreadId);
  }, [activeThreadId, fetchConversation, markThreadAsRead, messages]);

  return {
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
    initializeConversation,
    loading,
    fetchConversation,
  };
}