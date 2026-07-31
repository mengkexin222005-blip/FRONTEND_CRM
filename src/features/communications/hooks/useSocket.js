import { useState, useEffect } from 'react';

export function useSocket(conversationId) {
  const [isConnected, setIsConnected] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');

  useEffect(() => {
    if (!conversationId) return;

    // Socket.IO hook integration stub
    setIsConnected(true);
  }, [conversationId]);

  return { isConnected, isTyping, typingUser };
}