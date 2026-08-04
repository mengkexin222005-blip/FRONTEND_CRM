import React, { useState, useMemo, useEffect } from 'react';
import CreatableSelect from 'react-select/creatable';
import { Plus, X } from 'lucide-react';

import { useUsers } from '../../users/hooks/useUsers';
import FormDrawer from '../../../components/form/FormDrawer';
import FormSection from '../../../components/form/FormSection';
import { FormLabel, FormInput, FormTextarea } from '../../../components/form/FormField';
import { getAutoMeetingStatus } from '../utils/meetingUtils';
import { getDisplayName } from '../../../utils/name';
import { getSelectProps } from '../../../components/select/selectConfig';

function MeetingFormContent({ meeting, onSubmit }) {
  const [title, setTitle] = useState(meeting?.title ?? meeting?.meetingTitle ?? '');
  const [status, setStatus] = useState(
    meeting?.status ?? (meeting ? getAutoMeetingStatus(meeting) : 'Scheduled')
  );
  const [location, setLocation] = useState(meeting?.location ?? meeting?.link ?? meeting?.url ?? '');
  const [locationScope, setLocationScope] = useState(meeting?.locationScope ?? 'Inside the Philippines');
  const [type, setType] = useState(meeting?.type ?? meeting?.meetingType ?? '');
  const [client, setClient] = useState(meeting?.client ?? '');
  const [date, setDate] = useState(meeting?.date ? new Date(meeting.date).toISOString().split("T")[0] : "");
  const [startTime, setStartTime] = useState(meeting?.startTime ?? '');
  const [endTime, setEndTime] = useState(meeting?.endTime ?? '');
  const [notes, setNotes] = useState(meeting?.notes ?? '');
  const [host, setHost] = useState(meeting?.host ?? meeting?.organizer ?? '');
  const [participants, setParticipants] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const { users = [] } = useUsers();

  const createParticipantOption = (participant) => {
    if (!participant) return null;
    if (typeof participant === 'string') {
      return { label: participant, value: participant, isCustom: true };
    }

    const displayName = getDisplayName(participant, {
      fallback:
        participant.email || participant.name || participant.fullName || participant.firstName || participant.lastName || participant._id || participant.id || '',
    });

    return {
      label: displayName,
      value: participant._id || participant.id || participant.userId || displayName,
      user: participant,
      isCustom: false,
    };
  };

  useEffect(() => {
    setParticipants((meeting?.participants || []).map(createParticipantOption).filter(Boolean));
  }, [meeting]);

  const lowerType = type.trim().toLowerCase();
  const isOnlineType = lowerType.includes("online") || lowerType.includes("virtual") || lowerType.includes("zoom") || lowerType.includes("teams") || lowerType.includes("meet");

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user._id || user.id || user.userId || user.email || getDisplayName(user),
        label: getDisplayName(user, { includeMiddleInitial: true, fallback: user.email || user.name || user._id || user.id || '' }),
        user,
      })),
    [users],
  );

  const handleParticipantsChange = (selectedOptions) => {
    setParticipants(selectedOptions || []);
    setInputValue('');
  };

  const handleCreateParticipant = (inputValue) => {
    const trimmedName = inputValue.trim();
    if (!trimmedName) return;
    setParticipants((prev) => [
      ...prev,
      { label: trimmedName, value: trimmedName, isCustom: true },
    ]);
    setInputValue('');
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

    const normalizedParticipants = participants
      .map((participant) => participant?.label || participant?.value)
      .filter(Boolean);

    const participantIds = participants
      .filter((participant) => participant?.user)
      .map((participant) => participant.user._id || participant.user.id || participant.value)
      .filter(Boolean);

    await onSubmit({
      ...(meeting?._id ? { _id: meeting._id } : {}),
      ...(meeting?.id ? { id: meeting.id } : {}),
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
      participants: normalizedParticipants,
      participantIds,
      assignedTo: participantIds,
      notes,
    });
  };

  return (
    <form id="meeting-form" onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 cursor-pointer"
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
                <option value="On-site" />
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
              <FormLabel required>Location / Meeting Link</FormLabel>
              <FormInput
                type="text"
                required
                value={location}
                placeholder={isOnlineType ? "e.g. https://meet.google.com/abc-defg-hij" : "e.g. Google Meet, Conference Room A"}
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
                    onChange={(e) => getLocationScope(e.target.value)}
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

      <FormSection title="Participants">
        <div className="space-y-3">
          <CreatableSelect
            {...getSelectProps({ theme: 'red', variant: 'form', isSearchable: true, isClearable: true })}
            isMulti
            options={userOptions}
            value={participants}
            onChange={(val) => handleParticipantsChange(val)}
            onCreateOption={handleCreateParticipant}
            inputValue={inputValue}
            onInputChange={(val, meta) => {
              if (meta && meta.action === 'input-change') setInputValue(val);
              if (meta && meta.action === 'set-value') setInputValue('');
            }}
            blurInputOnSelect
            backspaceRemovesValue
            hideSelectedOptions
            controlShouldRenderValue={false}
            placeholder="Search or type participant name..."
            formatCreateLabel={(inputValue) => `Add "${inputValue}" as participant`}
            noOptionsMessage={() => 'Type a name to add a non-user participant'}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />

          <div className="flex flex-wrap gap-1.5 pt-1">
            {participants.length > 0 ? (
              participants.map((participant, index) => (
                <span
                  key={`${participant.value}-${index}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 pl-3 pr-1 py-1 text-xs font-medium text-gray-600 shadow-sm"
                >
                  <span className="truncate max-w-[10rem]">
                    {participant.label}
                  </span>
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
      />
    </FormDrawer>
  );
}