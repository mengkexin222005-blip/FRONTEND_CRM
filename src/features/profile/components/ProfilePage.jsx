import { useState } from "react";

import { useProfile } from "../hooks/useProfile";
import { useProfileForm } from "../hooks/useProfileForm";

import PageHeader from "../../../components/page/PageHeader";

import ProfileTab from "../tabs/ProfileTab";
import SecurityTab from "../tabs/SecurityTab";
import NotificationsTab from "../tabs/NotificationsTab";

const TABS = ["My Profile", "Security", "Notifications"];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("My Profile");

  const { settings, loading } = useProfile();
  const form = useProfileForm(settings);

  const { saving, isProfileDirty, isAddressDirty, handleSave, resetForm } =
    form;

  const showProfileActions = activeTab === "My Profile";

  return (
    <div className="border bg-white border-gray-200 rounded-md p-6 mt-4 flex flex-col h-[calc(100vh-120px)]">
      <PageHeader
        title="View Profile"
        subtitle="View and manage your profile information"
      />

      <div className="flex border-b border-gray-200 mb-4 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 min-h-0">
        {activeTab === "My Profile" && (
          <ProfileTab loading={loading} form={form} />
        )}

        {activeTab === "Security" && <SecurityTab form={form} />}

        {activeTab === "Notifications" && <NotificationsTab />}
      </div>

      {showProfileActions && (
        <div className="pt-4 mt-2 border-t border-gray-100 shrink-0 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={resetForm}
            disabled={saving || (!isProfileDirty && !isAddressDirty)}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || (!isProfileDirty && !isAddressDirty)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}