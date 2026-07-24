import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

import FormDrawer from '../../components/form/FormDrawer';
import FormSection from '../../components/form/FormSection';
import { FormLabel, FormInput, FormTextarea } from '../../components/form/FormField';
import { getAutoMeetingStatus } from './utils/meetingUtils';

function MeetingFormContent({ meeting, onSubmit }) {
  // --- Form Local State ---
  const [title, setTitle] = useState(meeting?.title ?? '');
  const [status, setStatus] = useState(meeting ? getAutoMeetingStatus(meeting) : 'Scheduled');
  const [location, setLocation] = useState(meeting?.location ?? '');
  const [locationScope, setLocationScope] = useState(meeting?.locationScope ?? 'Inside the Philippines');
  const [type, setType] = useState(meeting?.type ?? '');
  const [client, setClient] = useState(meeting?.client ?? '');
  const [date, setDate] = useState(meeting?.date ? new Date(meeting.date).toISOString().split("T")[0]: "");
  const [startTime, setStartTime] = useState(meeting?.startTime ?? '');
  const [endTime, setEndTime] = useState(meeting?.endTime ?? '');
  const [notes, setNotes] = useState(meeting?.notes ?? '');
  const [host, setHost] = useState(meeting?.host ?? meeting?.organizer ?? '');
  const [participants, setParticipants] = useState(meeting?.participants ?? []);
  const [participantName, setParticipantName] = useState('');
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);

  // --- Participant Handling Actions ---
  const addParticipant = () => {
    const trimmedName = participantName.trim();
    if (!trimmedName) return;
    setParticipants((prev) => [...prev, trimmedName]);
    setParticipantName('');
    setIsAddingParticipant(false);
  };

  const handleParticipantKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      addParticipant();
    }
  };

  const removeParticipant = (index) => {
    setParticipants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !date || !startTime || !endTime) {
      alert("Please complete all required fields.");
      return;
    }

    await onSubmit({
      title,
      status,
      date,
      startTime,
      endTime,
      location,
      locationScope,
      type,
      client,
      host,
      participants,
      notes,
    });
  };

  return (
    <form id="meeting-form" onSubmit={handleSubmit} className="space-y-6">

        {/* Section 1: Meeting Information */}
        <FormSection title="Meeting Information">
          <div className="space-y-4">
            <div>
              <FormLabel required>Meeting Title</FormLabel>
              <FormInput
                type="text"
                required
                value={title}
                placeholder="e.g. Discovery Call & Product Demo"
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FormLabel required>Status</FormLabel>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Rescheduled">Rescheduled</option>
                  <option value="No Show">No Show</option>
                </select>
              </div>

              <div>
                <FormLabel>Meeting Type</FormLabel>
                <FormInput
                  type="text"
                  list="meeting-types"
                  value={type}
                  placeholder="e.g. Online, On-site"
                  onChange={(e) => setType(e.target.value)}
                />
                <datalist id="meeting-types">
                  <option value="Client Meeting" />
                  <option value="Internal Meeting" />
                  <option value="Presentation" />
                  <option value="Online" />
                  <option value="Training" />
                  <option value="Sales Meeting" />
                </datalist>
              </div>
            </div>

            <div>
              <FormLabel>Client</FormLabel>
              <FormInput
                type="text"
                value={client}
                placeholder="Enter client name..."
                onChange={(e) => setClient(e.target.value)}
              />
            </div>

            <div className="grid gap-3">
              <div>
                <FormLabel required>Location</FormLabel>
                <FormInput
                  type="text"
                  required
                  value={location}
                  placeholder="e.g. Google Meet, Conference Room A"
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div>
                <FormLabel>Location scope</FormLabel>
                <div className="flex flex-wrap items-center gap-x-20 gap-y-2 pt-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-600 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="locationScope"
                      value="Inside the Philippines"
                      checked={locationScope === 'Inside the Philippines'}
                      onChange={(e) => setLocationScope(e.target.value)}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    Inside the Philippines
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-600 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="locationScope"
                      value="Outside the Philippines"
                      checked={locationScope === 'Outside the Philippines'}
                      onChange={(e) => setLocationScope(e.target.value)}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    Outside the Philippines
                  </label>
                </div>
              </div>
            </div>
          </div>
        </FormSection>

        {/* Section 2: Schedule */}
        <FormSection title="Schedule">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <FormLabel required>Date</FormLabel>
                <FormInput
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <FormLabel>Start Time</FormLabel>
                <FormInput
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <FormLabel>End Time</FormLabel>
                <FormInput
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <FormLabel>Host</FormLabel>
              <FormInput
                type="text"
                required
                value={host}
                placeholder="Enter host name..."
                onChange={(e) => setHost(e.target.value)}
              />
            </div>
          </div>
        </FormSection>

        {/* Section 3: Participants */}
        <FormSection title="Participants">
          <div className="space-y-3">
            {isAddingParticipant ? (
              <div className="flex items-center gap-2 max-w-md animate-in fade-in duration-150">
                <FormInput
                  type="text"
                  autoFocus
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  onKeyDown={handleParticipantKeyDown}
                  placeholder="Enter participant name..."
                />
                <button
                  type="button"
                  onClick={addParticipant}
                  className="h-9 px-4 text-xs font-semibold bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors cursor-pointer shrink-0"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingParticipant(false);
                    setParticipantName('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingParticipant(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-dashed border-gray-300 text-gray-600 rounded-md hover:border-gray-400 hover:text-gray-800 transition-all cursor-pointer bg-white"
              >
                <Plus size={14} /> Add Participant/s
              </button>
            )}

            <div className="flex flex-wrap gap-1.5 pt-1">
              {participants.length > 0 ? (
                participants.map((person, index) => (
                  <span 
                    key={`${person}-${index}`} 
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 pl-3 pr-1 py-1 text-xs font-medium text-gray-600 shadow-sm"
                  >
                    <span className="truncate max-w-45">{person}</span>
                    <button 
                      type="button" 
                      onClick={() => removeParticipant(index)} 
                      className="flex h-4 w-4 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">No participants added yet.</p>
              )}
            </div>
          </div>
        </FormSection>

        {/* Section 4: Notes */}
        <FormSection title="Notes">
          <div>
            <FormTextarea
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              placeholder="Add agendas, links, meeting summaries, or context details..."
            />
          </div>
        </FormSection>

    </form>
  );
}

export default function MeetingForm({ isOpen, onClose, onSubmit, meeting = null }) {
  if (!isOpen) return null;

  const formKey = meeting?.id || meeting?._id || 'new-meeting';

  return (
    <FormDrawer
      open={isOpen}
      title={meeting ? 'Edit Meeting Details' : 'Schedule New Meeting'}
      formId="meeting-form"
      loading={false}
      onClose={onClose}
      onCancel={onClose}
      footer={null} 
    >
      <MeetingFormContent
        key={formKey}
        meeting={meeting}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    </FormDrawer>
  );
}