import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

/**
 * useActivities - Fetch and manage activity logs for an entity
 * 
 * Fetches all activity records related to a specific entity (Lead, Client, Quotation, etc.)
 * Activities include creation, updates, status changes, and user interactions
 * 
 * @param {string} relatedToType - Type of entity ('Lead', 'Client', 'Quotation', 'Task')
 * @param {string} relatedToId - ID of the entity to fetch activities for
 * @returns {Object} Activity management object
 * @returns {Array} .activities - Array of activity records
 * @returns {boolean} .loading - True while fetching
 * @returns {Function} .refetch - Function to manually refresh activities
 */


export function useActivities(relatedToType, relatedToId) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchActivities = useCallback(async () => {
    if (!relatedToType || !relatedToId) {
      setActivities([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get("/api/activities", {
        params: { relatedToType, relatedToId },
      });
      setActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn("Failed to fetch activities:", error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [relatedToType, relatedToId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return { activities, loading, refetch: fetchActivities };
}
