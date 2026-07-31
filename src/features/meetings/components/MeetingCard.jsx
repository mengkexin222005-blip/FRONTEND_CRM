import React from 'react';

export default function MeetingCard({ meeting, onClick }) {
  return (
    <div 
      onClick={() => onClick(meeting)}
      className={`p-5 rounded-lg border text-xs cursor-pointer transition-all hover:shadow-sm ${meeting.color}`}
    >
      <div className="flex justify-between font-bold mb-1">
        <span>{meeting.time}</span>
        <span className="opacity-70">{meeting.type}</span>
      </div>
      <h4 className="font-semibold text-gray-800 truncate">{meeting.title}</h4>
      <p className="text-[11px] opacity-90 mt-1"> {meeting.location}</p>
    </div>
  );
}