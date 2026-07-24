import { useState, useMemo, useEffect } from "react";
import api from '../../../services/api';
import Swal from 'sweetalert2';
import { getAutoMeetingStatus } from '../utils/meetingUtils';

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
  const currentStatus = getAutoMeetingStatus(meeting);

  return {
    id: meeting._id,
    _id: meeting._id,
    title: meeting.meetingTitle,
    type: meeting.meetingType,
    status: currentStatus,
    date: meeting.date ? new Date(meeting.date).toISOString().split("T")[0] : "",
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    time: `${meeting.startTime} - ${meeting.endTime}`,
    client: meeting.client || "",
    location: meeting.location || "",
    locationScope: meeting.locationScope || "Inside the Philippines",
    organizer: meeting.host || "",
    host: meeting.host || "",
    notes: meeting.notes || "",
    participants: meeting.participants || [],
    color: getMeetingColor(meeting.meetingType),
  };
};

const initialFilters = {
  date: '',
  type: 'all',
  status: 'all',
};

export function useMeetings() {
  const [allMeetings, setAllMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [meetingToEdit, setMeetingToEdit] = useState(null);
  const [activeView, setActiveView] = useState('Month');
  const [filters, setFilters] = useState(initialFilters);

  const fetchMeetings = async () => {
    try {
      const { data } = await api.get("/api/meetings");
      setAllMeetings((data || []).map(mapMeeting));
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

  const filterOptions = useMemo(() => {
    const types = Array.from(new Set((allMeetings || []).map((m) => m.type).filter(Boolean)));
    return { types };
  }, [allMeetings]);

  const filteredMeetings = useMemo(() => {
    const query = (searchQuery || '').toLowerCase().trim();

    return (allMeetings || []).filter((meeting) => {
      // Search Match
      const matchesSearch =
        !query ||
        meeting.title?.toLowerCase().includes(query) ||
        meeting.client?.toLowerCase().includes(query) ||
        meeting.type?.toLowerCase().includes(query);

      // Category Matches
      const matchesDate = !filters?.date || meeting.date === filters.date;
      const matchesType = !filters?.type || filters.type === 'all' || meeting.type === filters.type;
      const matchesStatus = !filters?.status || filters.status === 'all' || meeting.status === filters.status;

      return matchesSearch && matchesDate && matchesType && matchesStatus;
    });
  }, [allMeetings, searchQuery, filters]);

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
      const payload = {
        meetingTitle: meetingData.title,
        meetingType: meetingData.type,
        status: meetingData.status,
        client: meetingData.client,
        date: meetingData.date,
        startTime: meetingData.startTime,
        endTime: meetingData.endTime,
        host: meetingData.host || meetingData.organizer,
        location: meetingData.location,
        locationScope: meetingData.locationScope,
        notes: meetingData.notes,
        participants: meetingData.participants || [],
      };
  
      if (meetingToEdit) {
        const targetId = meetingToEdit.id || meetingToEdit._id;
        await api.patch(`/api/meetings/${targetId}`, payload);
        Toast.fire({ icon: "success", title: "Meeting updated successfully" });
      } else {
        await api.post("/api/meetings", payload);
        Toast.fire({ icon: "success", title: "Meeting added successfully" });
      }
  
      await fetchMeetings();
      closeMeetingForm();
      setSelectedMeeting(null);
  
    } catch (error) {
      console.error(error);
      Toast.fire({
        icon: "error",
        title: error.response?.data?.error || "Unable to save meeting",
      });
    }
  };

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
  };
}