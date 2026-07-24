export function getMeetingColorClass(type) {
  switch (type) {
    case 'Client Consultation':
      return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'Internal Meeting':
      return 'bg-red-50 text-red-600 border-red-200';
    case 'Product Demo':
      return 'bg-purple-50 text-purple-600 border-purple-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
}

export function getAutoMeetingStatus(meeting) {
  // Preserve manual override statuses
  const manualOverrides = ["Cancelled", "Rescheduled", "No Show"];
  if (meeting.status && manualOverrides.includes(meeting.status)) {
    return meeting.status;
  }

  if (!meeting.date) return meeting.status || "Scheduled";

  const now = new Date();

  // Normalize date string (YYYY-MM-DD)
  const dateStr = typeof meeting.date === "string" 
    ? meeting.date.split("T")[0] 
    : new Date(meeting.date).toISOString().split("T")[0];

  const [year, month, day] = dateStr.split("-").map(Number);

  // Parse time formats like "09:00", "14:30", "9:00 AM", or "2:30 PM"
  const parseTimeToDate = (timeStr) => {
    if (!timeStr) return null;
    const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!timeMatch) return null;

    let [_, hours, minutes, modifier] = timeMatch;
    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10);

    if (modifier) {
      if (modifier.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
    }

    return new Date(year, month - 1, day, hours, minutes, 0);
  };

  const startDateTime = parseTimeToDate(meeting.startTime) || new Date(year, month - 1, day, 0, 0, 0);
  const endDateTime = parseTimeToDate(meeting.endTime) || new Date(year, month - 1, day, 23, 59, 59);

  // Automatic progression logic based on time
  if (now > endDateTime) {
    return "Completed";
  } else if (now >= startDateTime && now <= endDateTime) {
    return "In Progress";
  } else {
    return "Scheduled";
  }
}