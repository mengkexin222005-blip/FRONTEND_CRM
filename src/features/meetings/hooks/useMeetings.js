import { useState, useMemo, useEffect } from "react";
import api from '../../../services/api';
import Swal from 'sweetalert2';
import { canViewMeeting, getAutoMeetingStatus } from '../utils/meetingUtils';
import { useSocketContext } from '../../../context/SocketContext';
import { SOCKET_EVENTS } from '../../../constants/socketEvents';
import { useAuth } from '../../../context/AuthContext';

const normalizeMeetingStatus = (value) => {
  const status = String(value || '').trim().toLowerCase();
  if (status === 'completed' || status === 'complete' || status === 'done') return 'Completed';
  if (status === 'in progress') return 'In Progress';
  if (status === 'ongoing') return 'Ongoing';
  if (status === 'cancelled' || status === 'canceled') return 'Cancelled';
  if (status === 'rescheduled') return 'Rescheduled';
  if (status === 'no show') return 'No Show';
  if (status === 'scheduled' || !status) return 'Scheduled';
  return value;
};

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  width: 'auto',
});

const getMeetingColor = (type = "") => {
  switch (type.trim().toLowerCase()) {
    case "client consultation":
    case "client meeting":
      return "bg-blue-50 text-blue-600 border-blue-200";

    case "internal meeting":
      return "bg-green-50 text-green-600 border-green-200";

    case "presentation":
      return "bg-purple-50 text-purple-600 border-purple-200";

    case "training":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";

    case "online":
      return "bg-cyan-50 text-cyan-600 border-cyan-200";

    case "sales meeting":
      return "bg-orange-50 text-orange-600 border-orange-200";

    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
};

const mapMeeting = (meeting) => {
  // Check for manually saved status (checking both status and meetingStatus) before falling back to auto status
  const currentStatus = meeting.status || meeting.meetingStatus || getAutoMeetingStatus(meeting);

  return {
    id: meeting._id,
    _id: meeting._id,
    title: meeting.meetingTitle || meeting.title,
    type: meeting.meetingType || meeting.type,
    status: currentStatus,
    date: meeting.date ? new Date(meeting.date).toISOString().split("T")[0] : "",
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    time: `${meeting.startTime} - ${meeting.endTime}`,
    client: meeting.client || "",
    location: meeting.location || "",
    locationScope: meeting.locationScope || "Inside the Philippines",
    organizer: meeting.host || meeting.organizer || "",
    host: meeting.host || meeting.organizer || "",
    createdBy: meeting.createdBy || meeting.creator || meeting.userId || null,
    creator: meeting.creator || null,
    userId: meeting.userId || null,
    notes: meeting.notes || "",
    participants: meeting.participants || [],
    participantIds: meeting.participantIds || [],
    assignedTo: meeting.assignedTo || [],
    attendees: meeting.attendees || [],
    color: getMeetingColor(meeting.meetingType || meeting.type),
  };
};

const initialFilters = {
  date: '',
  type: 'all',
  status: 'all',
};

export function useMeetings() {
  const { user: currentUser } = useAuth();
  const [allMeetings, setAllMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [meetingToEdit, setMeetingToEdit] = useState(null);
  const [activeView, setActiveView] = useState('Month');
  const [filters, setFilters] = useState(initialFilters);
  const socketCtx = useSocketContext();

  const fetchMeetings = async () => {
    try {
      const { data } = await api.get("/api/meetings");
      const mapped = (data || []).map(mapMeeting);
      setAllMeetings(mapped);

      if (selectedMeeting) {
        const targetId = selectedMeeting.id || selectedMeeting._id;
        const updatedSelected = mapped.find((m) => m.id === targetId || m._id === targetId);
        if (updatedSelected) {
          setSelectedMeeting(updatedSelected);
        }
      }
    } catch (error) {
      console.error(error);
      Toast.fire({
        icon: "error",
        title: "Unable to load meetings",
      });
    }
  };
  
  useEffect(() => {
    fetchMeetings();
  }, []);

  // Listen for client-side meeting updates dispatched by dashboard actions
  useEffect(() => {
    const handler = (e) => {
      try {
        const id = e?.detail?.id;
        if (id) {
          void fetchMeetings();
        }
      } catch (err) {
        console.error("Error handling crm:meeting:updated event", err);
      }
    };

    window.addEventListener("crm:meeting:updated", handler);
    return () => window.removeEventListener("crm:meeting:updated", handler);
  }, []);

  // Websocket listeners for meeting events so participant dashboards refresh immediately
  useEffect(() => {
    try {
      const socket = socketCtx?.socket;
      if (!socket) return undefined;

      const createdHandler = () => {
        void fetchMeetings();
      };

      const updatedHandler = () => {
        void fetchMeetings();
      };

      socket.on(SOCKET_EVENTS.MEETING_CREATED, createdHandler);
      socket.on(SOCKET_EVENTS.MEETING_UPDATED, updatedHandler);

      return () => {
        socket.off(SOCKET_EVENTS.MEETING_CREATED, createdHandler);
        socket.off(SOCKET_EVENTS.MEETING_UPDATED, updatedHandler);
      };
    } catch (err) {
      console.error('Socket meeting listeners setup failed', err);
    }
  }, [fetchMeetings, socketCtx]);

  const filterOptions = useMemo(() => {
    const types = Array.from(new Set((allMeetings || []).map((m) => m.type).filter(Boolean)));
    return { types };
  }, [allMeetings]);

  const filteredMeetings = useMemo(() => {
    const query = (searchQuery || '').toLowerCase().trim();

    return (allMeetings || []).filter((meeting) => {
      if (!canViewMeeting(meeting, currentUser)) return false;

      const currentStatus = meeting.status || meeting.meetingStatus || getAutoMeetingStatus(meeting);
      const normalizedStatus = normalizeMeetingStatus(currentStatus);

      const matchesSearch =
        !query ||
        meeting.title?.toLowerCase().includes(query) ||
        meeting.client?.toLowerCase().includes(query) ||
        meeting.type?.toLowerCase().includes(query);

      const matchesDate = !filters?.date || meeting.date === filters.date;
      const matchesType = !filters?.type || filters.type === 'all' || meeting.type === filters.type;
      const matchesStatus = !filters?.status || filters.status === 'all' || normalizedStatus === filters.status;

      return matchesSearch && matchesDate && matchesType && matchesStatus;
    });
  }, [allMeetings, currentUser, searchQuery, filters]);

  const resetFilters = () => setFilters(initialFilters);

  const openCreateMeeting = () => {
    setMeetingToEdit(null);
    setIsFormOpen(true);
  };

  const openEditMeeting = (meeting) => {
    setMeetingToEdit(meeting);
    setIsFormOpen(true);
  };

  const closeMeetingForm = () => {
    setIsFormOpen(false);
    setMeetingToEdit(null);
  };

  const handleAddMeeting = async (meetingData) => {
    try {
      const participantIds = meetingData.participantIds || [];
      const normalizedParticipants = Array.isArray(meetingData.participants)
        ? meetingData.participants
        : [];

      const payload = {
        meetingTitle: meetingData.title,
        meetingType: meetingData.type,
        status: meetingData.status,
        meetingStatus: meetingData.status, // Included for backward and forward schema compatibility
        client: meetingData.client,
        date: meetingData.date,
        startTime: meetingData.startTime,
        endTime: meetingData.endTime,
        host: meetingData.host || meetingData.organizer,
        location: meetingData.location,
        locationScope: meetingData.locationScope,
        notes: meetingData.notes,
        participants: normalizedParticipants,
        participantIds,
        // Also set assignedTo/attendees to help dashboards that look at these fields
        assignedTo: participantIds,
        attendees: participantIds,
      };
  
      if (meetingToEdit) {
        const targetId = meetingToEdit.id || meetingToEdit._id;
        const { data } = await api.patch(`/api/meetings/${targetId}`, payload);
        Toast.fire({ icon: "success", title: "Meeting updated successfully" });

        setSelectedMeeting(mapMeeting(data || { ...meetingToEdit, ...payload }));
      } else {
        const { data } = await api.post("/api/meetings", payload);
        const created = data || null;

        Toast.fire({ icon: "success", title: "Meeting added successfully" });

        // If backend accepted participant IDs, create notifications for them
        try {
          const participantIds = payload.participantIds || (meetingData.participantIds || []);
          if (Array.isArray(participantIds) && participantIds.length) {
            await Promise.allSettled(
              participantIds.map((userId) =>
                api.post('/api/notifications', {
                  userId,
                  title: 'You were added to a meeting',
                  message: `You were added to meeting: ${meetingData.title}`,
                  meta: { type: 'meeting:invited', meetingId: created?._id || created?.id || null },
                }),
              ),
            );
          }
        } catch (err) {
          console.error('Failed to create notifications for meeting participants', err);
        }

        // Inform other parts of the UI
        try {
          const createdId = created?._id || created?.id;
          window.dispatchEvent(
            new CustomEvent('crm:meeting:updated', { detail: { id: String(createdId || '') } }),
          );
        } catch (e) {
          // ignore
        }
        // Emit socket event so participant clients can refresh immediately (server should broadcast to target users)
        try {
          const socket = socketCtx?.socket;
          const participantIds = payload.participantIds || (meetingData.participantIds || []);
          if (socket && socket.emit) {
            socket.emit(SOCKET_EVENTS.MEETING_CREATED, { meeting: created, participantIds });
          }
        } catch (err) {
          console.error('Failed to emit meeting.created socket event', err);
        }
      }

      await fetchMeetings();
      closeMeetingForm();
  
    } catch (error) {
      console.error(error);
      Toast.fire({
        icon: "error",
        title: error.response?.data?.error || "Unable to save meeting",
      });
    }
  };

  // Refresh when dashboard dispatches meeting updates
  useEffect(() => {
    const handler = (e) => {
      try {
        const id = e?.detail?.id;
        if (id) {
          void fetchMeetings();
        }
      } catch (err) {
        console.error("Error handling crm:meeting:updated event", err);
      }
    };

    window.addEventListener("crm:meeting:updated", handler);
    return () => window.removeEventListener("crm:meeting:updated", handler);
  }, []);

  const handleDeleteMeeting = async (meetingId) => {
    try {
      await api.delete(`/api/meetings/${meetingId}`);
      await fetchMeetings();
      setSelectedMeeting(null);
      Toast.fire({ icon: "success", title: "Meeting deleted successfully" });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: "error", title: "Unable to delete meeting" });
    }
  };

  const updateMeetingStatus = async (meetingId, newStatus) => {
    try {
      if (!meetingId) throw new Error("Invalid meeting id");

      await api.patch(`/api/meetings/${meetingId}`, {
        status: newStatus,
        meetingStatus: newStatus,
      });

      // Refresh local meetings list
      await fetchMeetings();

      // Notify other parts of the UI (dashboard, other hooks)
      try {
        window.dispatchEvent(
          new CustomEvent("crm:meeting:updated", {
            detail: { id: String(meetingId), status: newStatus },
          }),
        );
      } catch (e) {
        // ignore
      }

      Toast.fire({ icon: "success", title: `Meeting status updated to ${newStatus}` });
      return true;
    } catch (error) {
      console.error("Failed to update meeting status", error);
      Toast.fire({ icon: "error", title: error.response?.data?.error || "Unable to update meeting status" });
      return false;
    }
  };

  return {
    meetings: filteredMeetings,
    selectedMeeting,
    setSelectedMeeting,
    currentMonth,
    setCurrentMonth,
    searchQuery,
    setSearchQuery,
    isFormOpen,
    meetingToEdit,
    activeView,
    setActiveView,
    filters,
    setFilters,
    resetFilters,
    filterOptions,
    openCreateMeeting,
    openEditMeeting,
    closeMeetingForm,
    handleAddMeeting,
    handleDeleteMeeting,
    updateMeetingStatus,
  };
}
