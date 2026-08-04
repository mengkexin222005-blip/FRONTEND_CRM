import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useSocket } from "./useSocket";
import { SOCKET_EVENTS } from "../constants/socketEvents";
import { playNotificationSound, preloadNotificationSound } from "../utils/soundManager";

/**
 * useNotifications - Manage user notifications with real-time updates
 * 
 * Features:
 *   - Fetches initial notifications from API
 *   - Listens for real-time notification events via WebSocket
 *   - Tracks unread count
 *   - Provides methods to mark as read and delete
 *   - Auto-updates on incoming notifications
 * 
 * @returns {Object} Notifications management object
 * @returns {Array} .notifications - Array of notification objects
 * @returns {number} .unreadCount - Count of unread notifications
 * @returns {boolean} .loading - True while fetching initial notifications
 * @returns {Function} .markAsRead(id) - Mark single notification as read
 * @returns {Function} .markAllAsRead() - Mark all notifications as read
 * @returns {Function} .deleteNotification(id) - Delete a notification
 * @returns {Function} .refetch() - Manually refresh notifications list
 * 
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  /**
   * Fetches notifications from API
   * Limits to 20 most recent notifications
   */
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/notifications?limit=20");
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user settings and preload sound on mount
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        preloadNotificationSound();
        const { data } = await api.get("/api/settings");
        if (data?.notificationPreferences) {
          setSoundEnabled(data.notificationPreferences.notificationSound ?? true);
        }
      } catch (error) {
        console.error("Failed to load user settings:", error);
        setSoundEnabled(true);
      }
    };

    loadUserSettings();
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time: prepend incoming notification, bump unread count, and play sound
  useSocket(
    SOCKET_EVENTS.NOTIFICATION_NEW,
    useCallback(
      (incoming) => {
        setNotifications((prev) => [incoming, ...prev]);
        setUnreadCount((prev) => prev + 1);
        // Play notification sound if enabled
        playNotificationSound(soundEnabled);

        try {
          // If notification references a meeting invitation, trigger a meeting refresh
          const meta = incoming?.meta || incoming?.data || {};
          if (meta && (meta.type === 'meeting:invited' || meta.meetingId)) {
            try {
              window.dispatchEvent(
                new CustomEvent('crm:meeting:updated', { detail: { id: String(meta.meetingId || '') } }),
              );
            } catch (e) {
              // ignore
            }
          }
        } catch (err) {
          // ignore
        }
      },
      [soundEnabled],
    ),
  );

  // Mark single as read
  const markAsRead = useCallback(
    async (id) => {
      // Optimistic
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await api.patch(`/api/notifications/${id}/read`);
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
        // Rollback
        fetchNotifications();
      }
    },
    [fetchNotifications],
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    // Optimistic
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await api.patch("/api/notifications/read-all");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // Dismiss (delete) single
  const dismissNotification = useCallback(
    async (id) => {
      const target = notifications.find((n) => n._id === id);

      // Optimistic
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        await api.delete(`/api/notifications/${id}`);
      } catch (error) {
        console.error("Failed to dismiss notification:", error);
        fetchNotifications();
      }
    },
    [notifications, fetchNotifications],
  );

  // Clear all
  const clearAll = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);

    try {
      await api.delete("/api/notifications");
    } catch (error) {
      console.error("Failed to clear notifications:", error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
  };
}
