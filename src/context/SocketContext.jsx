import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { io } from "socket.io-client";

import { useAuth } from "./AuthContext";

const SocketContext =
  createContext(null);

const SOCKET_URL =
  import.meta.env
    .VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export function SocketProvider({
  children,
}) {
  const {
    user,
    accessToken,
    authReady,
  } = useAuth();

  const [connected, setConnected] =
    useState(false);

  const socket = useMemo(
    () =>
      io(SOCKET_URL, {
        withCredentials: true,
        autoConnect: false,

        transports: [
          "websocket",
          "polling",
        ],

        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      }),
    [],
  );

  useEffect(() => {
    const handleConnect = () => {
      console.log(
        "[WS] Connected:",
        socket.id,
      );

      setConnected(true);
    };

    const handleDisconnect = (
      reason,
    ) => {
      console.log(
        "[WS] Disconnected:",
        reason,
      );

      setConnected(false);
    };

    const handleConnectError = (
      error,
    ) => {
      console.error(
        "[WS] Error:",
        error?.message ||
          "Connection error",
      );

      setConnected(false);
    };

    socket.on(
      "connect",
      handleConnect,
    );

    socket.on(
      "disconnect",
      handleDisconnect,
    );

    socket.on(
      "connect_error",
      handleConnectError,
    );

    return () => {
      socket.off(
        "connect",
        handleConnect,
      );

      socket.off(
        "disconnect",
        handleDisconnect,
      );

      socket.off(
        "connect_error",
        handleConnectError,
      );
    };
  }, [socket]);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (
      !user ||
      !accessToken
    ) {
      socket.disconnect();
      setConnected(false);

      return;
    }

    /*
     * The backend socket middleware can read:
     *
     * socket.handshake.auth.token
     */
    socket.auth = {
      token: accessToken,
      accessToken,
    };

    /*
     * Reconnect whenever the token changes,
     * ensuring Socket.IO uses the latest token.
     */
    if (socket.connected) {
      socket.disconnect();
    }

    socket.connect();

    return () => {
      socket.disconnect();
      setConnected(false);
    };
  }, [
    socket,
    user,
    accessToken,
    authReady,
  ]);

  const value = useMemo(
    () => ({
      socket,
      connected,
    }),
    [socket, connected],
  );

  return (
    <SocketContext.Provider
      value={value}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context =
    useContext(SocketContext);

  if (!context) {
    throw new Error(
      "useSocketContext must be used inside <SocketProvider>",
    );
  }

  return context;
}

export function useSocket() {
  return useSocketContext();
}

export default SocketContext;