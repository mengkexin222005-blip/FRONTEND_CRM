import { useState, useEffect } from "react";
import { Bell, Mail, Clock, AlertCircle } from "lucide-react";
import { FormLabel, FormInput } from "../../../components/form/FormField";
import api from "../../../services/api";
import Swal from "sweetalert2";

function CustomCheckbox({ checked, onChange }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className="w-4 h-4 rounded shrink-0 border transition-colors cursor-pointer flex items-center justify-center"
      style={{
        backgroundColor: checked ? "#b91c1c" : "#fff",
        borderColor: checked ? "#b91c1c" : "#d1d5db",
      }}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function CustomRadio({ checked, onChange }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onChange}
      className="w-4 h-4 rounded-full shrink-0 border-2 transition-colors cursor-pointer flex items-center justify-center"
      style={{
        borderColor: checked ? "#b91c1c" : "#d1d5db",
        backgroundColor: "#fff",
      }}
    >
      {checked && (
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#b91c1c" }} />
      )}
    </button>
  );
}

const defaultPreferences = {
  emailTaskAssignment: true,
  emailTaskReminder: true,
  emailQuotationUpdate: true,
  emailLeadUpdate: true,
  emailTeamMention: true,
  emailSystemAlert: true,
  inAppTaskAssignment: true,
  inAppTaskReminder: true,
  inAppQuotationUpdate: true,
  inAppLeadUpdate: true,
  inAppTeamMention: true,
  inAppSystemAlert: true,
  notificationFrequency: "realtime",
  notificationSound: true,
};

const emailItems = [
  { key: "emailTaskAssignment", label: "Task Assignments", desc: "Get notified when a task is assigned to you" },
  { key: "emailTaskReminder", label: "Task Reminders", desc: "Receive reminders for upcoming task due dates" },
  { key: "emailQuotationUpdate", label: "Quotation Updates", desc: "Get notified when quotation status changes" },
  { key: "emailLeadUpdate", label: "Lead Updates", desc: "Receive updates on lead status changes" },
  { key: "emailTeamMention", label: "Team Mentions", desc: "Get notified when mentioned by team members" },
  { key: "emailSystemAlert", label: "System Alerts", desc: "Important system notifications and updates" },
];

const inAppItems = [
  { key: "inAppTaskAssignment", label: "Task Assignments", desc: "Get notified when a task is assigned to you" },
  { key: "inAppTaskReminder", label: "Task Reminders", desc: "Receive reminders for upcoming task due dates" },
  { key: "inAppQuotationUpdate", label: "Quotation Updates", desc: "Get notified when quotation status changes" },
  { key: "inAppLeadUpdate", label: "Lead Updates", desc: "Receive updates on lead status changes" },
  { key: "inAppTeamMention", label: "Team Mentions", desc: "Get notified when mentioned by team members" },
  { key: "inAppSystemAlert", label: "System Alerts", desc: "Important system notifications and updates" },
];

const frequencyOptions = [
  { value: "realtime", label: "Real-time", desc: "Get notifications as they happen" },
  { value: "daily", label: "Daily Digest", desc: "Receive a daily summary at 9:00 AM" },
  { value: "weekly", label: "Weekly Digest", desc: "Receive a weekly summary on Monday" },
];

export default function NotificationsTab() {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data } = await api.get("/api/settings");
        if (data?.notificationPreferences) {
          setPreferences(data.notificationPreferences);
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
      }
    };
    loadPreferences();
  }, []);

  const handleToggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // const handleInputChange = (e) => {
  //   const { name, value } = e.target;
  //   setPreferences((prev) => ({ ...prev, [name]: value }));
  // };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      await api.patch("/api/settings/notifications", preferences);
      setSaveStatus("success");
    } catch (error) {
      console.error("Failed to save preferences:", error);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const result = await Swal.fire({
      title: "Reset to Defaults?",
      text: "This will restore all notification preferences to their original settings. Any unsaved changes will be lost.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Reset",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      setPreferences(defaultPreferences);
      Swal.fire({
        title: "Reset!",
        text: "Your notification preferences have been reset to defaults.",
        icon: "success",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Mail size={16} className="text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Email Notifications</h3>
        </div>
        <div className="border border-gray-200 rounded-md p-4 space-y-3">
          {emailItems.map((item) => (
            <div
              key={item.key}
              onClick={() => handleToggle(item.key)}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-gray-700">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
              <CustomCheckbox
                checked={preferences[item.key]}
                onChange={() => handleToggle(item.key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* In-App Notifications */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Bell size={16} className="text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">In-App Notifications</h3>
        </div>
        <div className="border border-gray-200 rounded-md p-4 space-y-3">
          {inAppItems.map((item) => (
            <div
              key={item.key}
              onClick={() => handleToggle(item.key)}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-gray-700">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
              <CustomCheckbox
                checked={preferences[item.key]}
                onChange={() => handleToggle(item.key)}
              />
            </div>
          ))}

          {/* Notification Sound */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div
              onClick={() => handleToggle("notificationSound")}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-gray-700">Notification Sound</p>
                <p className="text-xs text-gray-400">Play sound for in-app notifications</p>
              </div>
              <CustomCheckbox
                checked={preferences.notificationSound}
                onChange={() => handleToggle("notificationSound")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notification Frequency */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Notification Frequency</h3>
        </div>
        <div className="border border-gray-200 rounded-md p-4 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-3">Delivery Preference</p>
            {frequencyOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => setPreferences((prev) => ({ ...prev, notificationFrequency: option.value }))}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
              >
                <CustomRadio
                  checked={preferences.notificationFrequency === option.value}
                  onChange={() => setPreferences((prev) => ({ ...prev, notificationFrequency: option.value }))}
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">{option.label}</p>
                  <p className="text-xs text-gray-400">{option.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
  
      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        {saveStatus === "success" && (
          <p className="text-sm text-green-600 mr-auto">Preferences saved successfully!</p>
        )}
        {saveStatus === "error" && (
          <p className="text-sm text-red-600 mr-auto">Failed to save. Please try again.</p>
        )}
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Reset to Defaults
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}