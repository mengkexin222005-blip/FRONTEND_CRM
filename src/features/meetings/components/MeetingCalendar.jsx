import React from 'react';
import { getDaysInMonth } from '../utils/calendarUtils';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MeetingCalendar({ 
  currentMonth, 
  meetings = [], 
  onSelectMeeting, 
  onSelectDay, 
  activeMeetingId, 
  activeView = 'Month' 
}) {
  const calendarCells = getDaysInMonth(currentMonth);

  const getDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
  
    return `${year}-${month}-${day}`;
  };

  const formatMeetingDate = (date) => {
    if (!date) return "";
  
    const d = new Date(date);
  
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
  
    return `${year}-${month}-${day}`;
  };

  const getMeetingsForDate = (date) =>
    meetings.filter(
      (meeting) => formatMeetingDate(meeting.date) === getDateKey(date)
    );

  const renderMeetingCard = (meeting) => {
    const meetingColor = meeting.color || '';
    const accentClass = meetingColor.includes('red')
      ? 'bg-red-500'
      : meetingColor.includes('purple')
        ? 'bg-purple-500'
        : meetingColor.includes('green')
          ? 'bg-green-500'
          : 'bg-blue-500';

    return (
      <button
        key={meeting._id || meeting.id}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelectMeeting(meeting);
        }}
        className={`flex w-full items-center gap-1 rounded border px-1.5 py-1 text-[10px] text-left
          ${meetingColor}
          ${activeMeetingId === (meeting._id || meeting.id) ? 'ring-2 ring-red-200' : ''}
        `}
      >
        <span className={`h-4 w-1 shrink-0 rounded-full ${accentClass}`} />
        <span className="min-w-0 overflow-hidden">
          <div className="truncate text-[10px] font-semibold leading-none">{meeting.time}</div>
          <div className="truncate text-[9px] leading-none text-gray-600">{meeting.title}</div>
        </span>
      </button>
    );
  };

  const currentView = String(activeView || 'month').toLowerCase();

  if (currentView === 'day') {
    const dayMeetings = getMeetingsForDate(currentMonth);

    return (
      <div className="h-full overflow-auto bg-white p-4">
        <div className="mb-4 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Day view</p>
          <p className="text-sm font-semibold text-gray-700">
            {currentMonth.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="space-y-2">
          {dayMeetings.length > 0 ? (
            dayMeetings.map((meeting) => renderMeetingCard(meeting))
          ) : (
            <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
              No meetings for this day.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'week') {
    const startOfWeek = new Date(currentMonth);
    startOfWeek.setDate(currentMonth.getDate() - currentMonth.getDay());

    const weekDays = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + index);
      return day;
    });

    return (
      <div className="h-full overflow-auto bg-white p-4">
        <div className="mb-3 grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayMeetings = getMeetingsForDate(day);
            return (
              <div key={day.toISOString()} className="rounded-md border border-gray-100 bg-gray-50 p-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <p className="text-sm font-semibold text-gray-700">{day.getDate()}</p>
                <div className="mt-2 space-y-1">
                  {dayMeetings.length > 0 ? (
                    dayMeetings.map((meeting) => renderMeetingCard(meeting))
                  ) : (
                    <p className="text-[10px] text-gray-400">No events</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="grid shrink-0 grid-cols-7 border-b border-gray-100 bg-gray-50/70 py-2 text-center">
        {WEEKDAYS.map((day) => (
          <span key={day} className="text-[15px] font-semibold uppercase tracking-wide text-gray-500">
            {day}
          </span>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid h-230 grid-cols-7 grid-rows-6">
          {calendarCells.map((cell, idx) => {
            const dayMeetings = getMeetingsForDate(cell.date);

            return (
              <div
                key={idx}
                onClick={() => {
                  if (cell.isCurrentMonth && onSelectDay) {
                    onSelectDay(cell.date, dayMeetings);
                  }
                }}
                className={`flex h-full cursor-pointer flex-col overflow-hidden border-b border-r border-gray-100 p-2 transition hover:bg-blue-50 ${
                  cell.isCurrentMonth
                    ? "bg-white"
                    : "bg-gray-50/70 text-gray-400"
                }`}
              >
                <div className="mb-2 flex shrink-0 items-center justify-between">
                  <span
                    className={`text-[11px] font-semibold ${
                      cell.isCurrentMonth
                        ? "text-gray-600"
                        : "text-gray-400"
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>

                  {dayMeetings.length > 0 && (
                    <span className="text-[10px] text-gray-400">
                      {dayMeetings.length}
                    </span>
                  )}
                </div>

                <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
                  {dayMeetings.map((meeting) =>
                    renderMeetingCard(meeting)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}