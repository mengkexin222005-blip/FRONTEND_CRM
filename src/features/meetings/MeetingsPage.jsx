import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

import { PageBase, PageHeader } from '../../components/page';
import { useMeetings } from './hooks/useMeetings';
import MeetingCalendar from './MeetingCalendar';
import MeetingDetails from './MeetingDetails';
import MeetingForm from './MeetingForm';
import MeetingDayDrawer from './MeetingDayDrawer';

// Shared Filter Components
import FilterPopover from '../../components/filters/FilterPopover'; 
import { useFilterPopover } from '../../components/filters/useFilterPopover'; 

import { formatMonthYear } from './utils/calendarUtils';

export default function MeetingsPage() {
  const {
    meetings = [],
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
    filters = { date: '', type: 'all', status: 'all' },
    setFilters,
    resetFilters,
    filterOptions = { types: [] },
    openCreateMeeting,
    openEditMeeting,
    closeMeetingForm,
    handleAddMeeting,
    handleDeleteMeeting,
  } = useMeetings();

  // Safely map filters for popover hook count
  const activeFilters = {
    date: filters?.date || null,
    type: filters?.type && filters.type !== 'all' ? filters.type : null,
    status: filters?.status && filters.status !== 'all' ? filters.status : null,
  };

  const {
    filterOpen,
    setFilterOpen,
    filterRef,
    activeFilterCount,
    clearAllFilters,
  } = useFilterPopover(activeFilters, resetFilters);

  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDayMeetings, setSelectedDayMeetings] = useState([]);
  const [isDayDrawerOpen, setIsDayDrawerOpen] = useState(false);
  const searchInputRef = useRef(null);

  const handleDayClick = (date, dayMeetings) => {
    setSelectedDay(date);
    setSelectedDayMeetings(dayMeetings);
    setIsDayDrawerOpen(true);
  };  

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <PageBase className="overflow-hidden">
      <div className="mb-5 flex items-start justify-between gap-4">
        <PageHeader
          title="Meetings"
          subtitle="Manage scheduled meetings and calendar events"
        />

        <div className="flex items-center gap-2">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search meetings..."
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-56 rounded-md border border-gray-300 px-3 py-1.75 text-sm text-gray-700 placeholder-gray-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
          />

          {/* Reusable Filter Popover Component */}
          <FilterPopover
            filterRef={filterRef}
            filterOpen={filterOpen}
            onToggle={() => setFilterOpen((prev) => !prev)}
            activeFilterCount={activeFilterCount}
            onClearAll={clearAllFilters}
          >
            <div className="space-y-3">
              {/* 1. Date */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Date</label>
                <input
                  type="date"
                  value={filters?.date || ''}
                  onChange={(e) => setFilters((prev) => ({ ...(prev || {}), date: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-100 cursor-pointer"
                />
              </div>

              {/* 2. Meeting Type */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Meeting Type</label>
                <select
                  value={filters?.type || 'all'}
                  onChange={(e) => setFilters((prev) => ({ ...(prev || {}), type: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-100 cursor-pointer"
                >
                  <option value="all">All meeting types</option>
                  {(filterOptions?.types || []).map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* 3. Status */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
                <select
                  value={filters?.status || 'all'}
                  onChange={(e) => setFilters((prev) => ({ ...(prev || {}), status: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-100 cursor-pointer"
                >
                  <option value="all">All statuses</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Rescheduled">Rescheduled</option>
                  <option value="No Show">No Show</option>
                </select>
              </div>
            </div>
          </FilterPopover>

          <button
            type="button"
            onClick={openCreateMeeting}
            className="flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-1.75 text-sm font-medium text-white transition-colors hover:bg-red-600 cursor-pointer"
          >
            <Plus size={14} />
            Add Meeting
          </button>
        </div>
      </div>

      <div className={`grid flex-1 min-h-0 grid-cols-1 gap-4 ${selectedMeeting ? 'xl:grid-cols-[minmax(0,1fr)_320px]' : 'xl:grid-cols-1'}`}>
        <div className="flex min-h-0 flex-col gap-4">

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-gray-200 bg-white">
            <div className="relative flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  className="rounded-md border border-gray-200 p-1.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  className="rounded-md border border-gray-200 p-1.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="pointer-events-none absolute inset-x-0 flex justify-center">
                <span className="text-lg font-semibold text-gray-600">{formatMonthYear(currentMonth)}</span>
              </div>

              <div className="flex items-center rounded-md border border-gray-200 bg-gray-50 p-0.5">
                {['Day', 'Week', 'Month'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setActiveView(mode)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      activeView === mode
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              <MeetingCalendar
                currentMonth={currentMonth}
                meetings={meetings}
                onSelectMeeting={setSelectedMeeting}
                activeMeetingId={selectedMeeting?._id || selectedMeeting?.id}
                activeView={activeView}
                onSelectDay={handleDayClick}
              />
            </div>
          </div>
        </div>

        {selectedMeeting && (
          <MeetingDetails
            meeting={selectedMeeting}
            onClose={() => setSelectedMeeting(null)}
            onEdit={() => openEditMeeting(selectedMeeting)}
            onDelete={() => handleDeleteMeeting(selectedMeeting?.id || selectedMeeting?._id)}
          />
        )}
      </div>

      <MeetingForm
        isOpen={isFormOpen}
        onClose={closeMeetingForm}
        onSubmit={handleAddMeeting}
        meeting={meetingToEdit}
      />

      <MeetingDayDrawer
        isOpen={isDayDrawerOpen}
        date={selectedDay}
        meetings={selectedDayMeetings}
        onClose={() => setIsDayDrawerOpen(false)}
        onSelectMeeting={setSelectedMeeting}
      />

    </PageBase>
  );
}