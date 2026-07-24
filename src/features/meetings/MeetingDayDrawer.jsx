import React from "react";
import FormDrawer from "../../components/form/FormDrawer";
import { CalendarDays } from "lucide-react";

export default function MeetingDayDrawer({
  isOpen,
  onClose,
  date,
  meetings,
  onSelectMeeting,
}) {

  return (
    <FormDrawer
      open={isOpen}
      title="Meetings"
      onClose={onClose}
      onCancel={onClose}
      formId=""
      loading={false}
      showFooter={false}
    >

      <div className="space-y-4">

        <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2 text-gray-500">
            <CalendarDays size={14}/>
            <span className="text-xs uppercase tracking-wide">
              Schedule
            </span>
          </div>

          <p className="mt-1 text-sm font-semibold text-gray-700">
            {date?.toLocaleDateString("en-US", {
              weekday:"long",
              month:"long",
              day:"numeric",
              year:"numeric",
            })}
          </p>
        </div>

        <div className="space-y-2">
          {meetings.length > 0 ? (

            meetings.map((meeting)=>(
              <button
                key={meeting._id}
                type="button"
                onClick={()=>{
                  onClose();
                  onSelectMeeting(meeting);
                }}
                className="w-full rounded-md border border-gray-200 bg-white p-3 text-left transition hover:bg-gray-50 hover:border-gray-300"
              >
                <div className="flex justify-between">
                  <p className="text-xs font-semibold text-gray-700">
                    {meeting.time}
                  </p>
                  <span
                    className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600">
                    {meeting.type}
                  </span>
                </div>

                <div className="mt-1">
                  <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                    {meeting.status ?? "Scheduled"}
                  </span>
                </div>

                <p className="mt-2 text-sm font-medium text-gray-800">
                  {meeting.title}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {meeting.client || "No client"}
                </p>

              </button>
            ))
          ) : (
            <div className="
              rounded-md
              border border-dashed
              border-gray-200
              bg-gray-50
              p-4
              text-sm
              text-gray-400
            ">
              No meetings scheduled.
            </div>
          )}
        </div>
      </div>
    </FormDrawer>
  );
}