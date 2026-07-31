import { useState, useEffect } from 'react';
import { INITIAL_CONVERSATIONS, INITIAL_MESSAGES } from '../constants/communicationConstants';

export function useConversation() {
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [activeId, setActiveId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Ready for API fetch: e.g. useEffect(() => { fetchConversations(); }, []);

  const activeConversation = conversations.find((c) => c.id === activeId) || null;
  const currentMessages = activeId ? messages[activeId] || [] : [];

  const selectConversation = (id) => {
    setActiveId(id);
  };

  const sendMessage = async (text) => {
    if (!activeId || !text.trim()) return;

    const newMsg = {
      id: `temp-${Date.now()}`,
      senderId: 'me',
      text: text.trim(),
      timestamp: new Date().toISOString(),
      isMine: true
    };

    setMessages((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMsg]
    }));

    // TODO: Connect to backend API
    // await communicationService.sendMessage(activeId, text);
  };

  return {
    conversations,
    setConversations,
    activeConversation,
    messages: currentMessages,
    setMessages,
    isLoading,
    selectConversation,
    sendMessage
  };
}