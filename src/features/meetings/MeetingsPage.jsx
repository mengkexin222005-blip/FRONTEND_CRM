import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  List,
} from "lucide-react";

import { PageBase, PageHeader, PageToolbar } from "../../components/page";
import { useMeetings } from "./hooks/useMeetings";
import MeetingCalendar from "./components/MeetingCalendar";
import MeetingDetails from "./components/MeetingDetails";
import MeetingForm from "./components/MeetingForm";
import MeetingTable from "./components/MeetingTable";
import MeetingDayDrawer from "./components/MeetingDayDrawer";

// Shared Filter Components
import FilterPopover from "../../components/filters/FilterPopover";
import { useFilterPopover } from "../../components/filters/useFilterPopover";

import { formatMonthYear } from "./utils/calendarUtils";

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
    calendarView,
    setCalendarView,
    filters = { date: "", type: "all", status: "all" },
    setFilters,
    resetFilters,
    filterOptions = { types: [] },
    openCreateMeeting,
    openEditMeeting,
    closeMeetingForm,
    handleAddMeeting,
    handleDeleteMeeting,
    updateMeetingStatus,
  } = useMeetings();

  const [view, setView] = useState("calendar");

  // Reset selected details pane whenever switching between Calendar & Table view
  useEffect(() => {
    setSelectedMeeting(null);
  }, [view, setSelectedMeeting]);

  // Safely map filters for popover hook count
  const activeFilters = {
    date: filters?.date || null,
    type: filters?.type && filters.type !== "all" ? filters.type : null,
    status: filters?.status && filters.status !== "all" ? filters.status : null,
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

  const handleDayClick = (date, dayMeetings) => {
    setSelectedDay(date);
    setSelectedDayMeetings(dayMeetings);
    setIsDayDrawerOpen(true);
  };

  return (
    <PageBase className="overflow-hidden">
      {/* Header layout aligns toolbar & buttons level with title */}
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          title="Meetings"
          subtitle="Manage scheduled meetings and calendar events"
        />

        <PageToolbar
          searchValue={searchQuery || ""}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
          searchPlaceholder="Search meetings..."
          view={view}
          onViewChange={setView}
          viewOptions={[
            {
              value: "calendar",
              icon: CalendarDays,
              title: "Calendar",
            },
            {
              value: "table",
              icon: List,
              title: "Table",
            },
          ]}
          filterSlot={
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
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Date
                  </label>
                  <input
                    type="date"
                    value={filters?.date || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...(prev || {}),
                        date: e.target.value,
                      }))
                    }
                    className="w-full cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-100"
                  />
                </div>

                {/* 2. Meeting Type */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Meeting Type
                  </label>
                  <select
                    value={filters?.type || "all"}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...(prev || {}),
                        type: e.target.value,
                      }))
                    }
                    className="w-full cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-100"
                  >
                    <option value="all">All meeting types</option>
                    {(filterOptions?.types || []).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Status */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Status
                  </label>
                  <select
                    value={filters?.status || "all"}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...(prev || {}),
                        status: e.target.value,
                      }))
                    }
                    className="w-full cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-100"
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
          }
          actionButton={
            <button
              type="button"
              onClick={openCreateMeeting}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
            >
              <Plus size={14} />
              Add Meeting
            </button>
          }
        />
      </div>

      <div
        className={`grid flex-1 min-h-0 grid-cols-1 gap-4 ${
          selectedMeeting
            ? "xl:grid-cols-[1fr_340px]"
            : "xl:grid-cols-1"
        }`}
      >
        <div className="flex min-h-0 flex-col gap-4">
          {view === "calendar" ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-gray-200 bg-white">
              {/* Calendar Controls Header */}
              <div className="relative flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentMonth(
                        (prev) =>
                          new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                      )
                    }
                    className="cursor-pointer rounded-md border border-gray-200 p-1.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentMonth(
                        (prev) =>
                          new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                      )
                    }
                    className="cursor-pointer rounded-md border border-gray-200 p-1.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="pointer-events-none absolute inset-x-0 flex justify-center">
                  <span className="text-lg font-semibold text-gray-600">
                    {formatMonthYear(currentMonth)}
                  </span>
                </div>

                {/* Day / Week / Month View Switcher */}
                <div className="z-10 flex items-center rounded-md border border-gray-200 bg-gray-50 p-0.5">
                  {["Day", "Week", "Month"].map((mode) => {
                    const isActive =
                      String(calendarView || "").toLowerCase() === mode.toLowerCase();
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setCalendarView(mode)}
                        className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                          isActive
                            ? "bg-red-500 text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {mode}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden">
                <MeetingCalendar
                  currentMonth={currentMonth}
                  meetings={meetings}
                  onSelectMeeting={setSelectedMeeting}
                  activeMeetingId={selectedMeeting?._id || selectedMeeting?.id}
                  activeView={calendarView}
                  onSelectDay={handleDayClick}
                />
              </div>
            </div>
          ) : (
            <MeetingTable
              meetings={meetings}
              onView={setSelectedMeeting}
              onEdit={openEditMeeting}
              onDelete={handleDeleteMeeting}
              onUpdateStatus={updateMeetingStatus}
            />
          )}
        </div>

        {/* Details Pane Wrapper */}
        {selectedMeeting && (
          <div className="flex flex-col min-h-0 h-full overflow-y-auto rounded-md border border-gray-200 bg-white">
            <MeetingDetails
              meeting={selectedMeeting}
              onClose={() => setSelectedMeeting(null)}
              onEdit={() => openEditMeeting(selectedMeeting)}
              onDelete={() =>
                handleDeleteMeeting(selectedMeeting?.id || selectedMeeting?._id)
              }
            />
          </div>
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