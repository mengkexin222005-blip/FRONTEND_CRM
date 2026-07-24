import { useState } from "react";
import { BsFillEyeFill, BsFillEyeSlashFill } from "react-icons/bs";
import { FormLabel, FormInput } from "../../../components/form/FormField";

export default function SecurityTab({ form }) {
  const [open, setOpen] = useState(false);

  if (!form) return null;

  const { passwordData, handlePasswordChange, handleSave, saving } = form;

  const isPasswordFilled =
    passwordData.currentPassword ||
    passwordData.newPassword ||
    passwordData.confirmPassword;

  return (
    <>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
        Password
      </p>
      <div className="border border-gray-200 rounded-md p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Change Password</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Update your password to keep your account secure.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen((p) => !p)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-md transition-all"
          >
            {open ? "Hide" : "Change Password"}
          </button>
        </div>

        {/* collapsible fields */}
        <div
          className={`transition-all duration-300 overflow-hidden ${
            open ? "max-h-96 opacity-100 mt-5" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t border-gray-100 pt-5 grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <FormLabel required>Current Password</FormLabel>
              <PasswordInput
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
              />
            </div>
            <div>
              <FormLabel required>New Password</FormLabel>
              <PasswordInput
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <FormLabel required>Confirm New Password</FormLabel>
              <PasswordInput
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Re-enter new password"
              />
            </div>
          </div>

          {/* Save row */}
          <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                await handleSave();
                setOpen(false);
              }}
              disabled={saving || !isPasswordFilled}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {saving ? "Saving..." : "Update Password"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function PasswordInput({ name, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <FormInput
        name={name}
        value={value}
        onChange={onChange}
        type={show ? "text" : "password"}
        placeholder={placeholder}
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setShow((p) => !p)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {show ? <BsFillEyeFill size={15} /> : <BsFillEyeSlashFill size={15} />}
      </button>
    </div>
  );
}
