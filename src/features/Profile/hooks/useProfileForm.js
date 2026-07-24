import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { useFormBase } from "../../../hooks/useFormBase";
import { formatDateInput } from "../../../utils/date";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  width: "auto",
});

const EMPTY_PROFILE = {
  firstName: "",
  middleName: "",
  lastName: "",
  suffixName: "",
  email: "",
  phone: "",
  sex: "",
  dateOfBirth: "",
  placeOfBirth: "",
  employeeId: "",
  role: "",
  memberSince: "",
  lastLogin: "",
  removeProfilePicture: false,
};

const EMPTY_PASSWORD = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const EMPTY_ADDRESS = {
  country: "Philippines",
  province: "",
  municipality: "",
  barangay: "",
  street: "",
  houseNumber: "",
  zipCode: "",
};

export function useProfileForm(settings) {
  const base = useFormBase(EMPTY_PROFILE);
  const { user, updateUser } = useAuth();

  const [savedProfile, setSavedProfile] = useState(EMPTY_PROFILE);
  const [savedAddress, setSavedAddress] = useState(EMPTY_ADDRESS);

  const [passwordData, setPasswordData] = useState(EMPTY_PASSWORD);
  const [addressData, setAddressData] = useState(EMPTY_ADDRESS);
  const [saving, setSaving] = useState(false);

  // Dirty checks
  const isProfileDirty =
    JSON.stringify(savedProfile) !== JSON.stringify(base.formData);
  const isPasswordDirty =
    JSON.stringify(EMPTY_PASSWORD) !== JSON.stringify(passwordData);
  const isAddressDirty =
    JSON.stringify(savedAddress) !== JSON.stringify(addressData);
  const isAnyDirty = isProfileDirty || isPasswordDirty || isAddressDirty;

  // Populate form when settings data arrives
  useEffect(() => {
    if (!settings) return;

    const addr = settings.currentAddress || {};
    const province = addr.province || "";
    const municipality = addr.municipality || "";

    const mappedProfile = {
      firstName: settings.firstName || "",
      middleName: settings.middleName || "",
      lastName: settings.lastName || "",
      suffixName: settings.suffixName || "",
      email: settings.email || "",
      phone: settings.phone || "",
      sex: settings.sex || "",
      dateOfBirth: formatDateInput(settings.dateOfBirth),
      placeOfBirth: settings.placeOfBirth || "",
      employeeId: settings.employeeId || "",
      role: settings.role || "",
      memberSince: settings.createdAt || "",
      lastLogin: settings.signInAt || "",
      removeProfilePicture: false,
    };

    const mappedAddress = {
      country: addr.country || "Philippines",
      province,
      municipality,
      barangay: addr.barangay || "",
      street: addr.street || "",
      houseNumber: addr.houseNumber || "",
      zipCode: addr.zipCode || "",
    };

    base.setFormData(mappedProfile);
    setSavedProfile(mappedProfile);

    setAddressData(mappedAddress);
    setSavedAddress(mappedAddress);

    base.setAddressCodes(
      base.resolveEditCodes("Philippines", province, municipality),
    );
    base.setPreviewFromPath(settings.profilePicture);
  }, [settings]);

  const handlePasswordChange = (e) =>
    setPasswordData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAddressChange = (e) =>
    setAddressData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAddressSelect = (formPatch, codePatch = {}) => {
    setAddressData((prev) => ({ ...prev, ...formPatch }));
    if (Object.keys(codePatch).length > 0)
      base.setAddressCodes((prev) => ({ ...prev, ...codePatch }));
  };

  const handleAvatarChange = async (e) => {
    base.handleAvatarChange(e);
    const file = e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);
      const { data } = await api.patch("/api/settings/photo", formData);
      Toast.fire({ icon: "success", title: "Photo updated successfully" });
      // Update the user in auth context with new profile picture
      if (data?.profilePicture) {
        updateUser({ profilePicture: data.profilePicture });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.error || "Failed to upload photo",
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isProfileDirty) {
        await api.patch("/api/settings/profile", {
          firstName: base.formData.firstName,
          middleName: base.formData.middleName,
          lastName: base.formData.lastName,
          suffixName: base.formData.suffixName,
          email: base.formData.email,
          phone: base.formData.phone,
          sex: base.formData.sex,
          dateOfBirth: base.formData.dateOfBirth,
          placeOfBirth: base.formData.placeOfBirth,
        });
        setSavedProfile({ ...base.formData });
        // Update the user in auth context with new profile data
        updateUser({
          firstName: base.formData.firstName,
          middleName: base.formData.middleName,
          lastName: base.formData.lastName,
          suffixName: base.formData.suffixName,
          email: base.formData.email,
          phone: base.formData.phone,
          sex: base.formData.sex,
          dateOfBirth: base.formData.dateOfBirth,
          placeOfBirth: base.formData.placeOfBirth,
        });
      }

      const isPasswordFilled =
        passwordData.currentPassword ||
        passwordData.newPassword ||
        passwordData.confirmPassword;

      if (isPasswordFilled) {
        await api.patch("/api/settings/password", passwordData);
        setPasswordData(EMPTY_PASSWORD);
      }

      if (isAddressDirty) {
        await api.patch("/api/settings/address", addressData);
        setSavedAddress({ ...addressData });
      }

      Toast.fire({ icon: "success", title: "Changes saved successfully" });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.error || "Failed to save changes",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    base.setFormData(savedProfile);
    setAddressData(savedAddress);
    setPasswordData(EMPTY_PASSWORD);
  };

  return {
    ...base,
    handleAvatarChange,
    saving,
    isProfileDirty,
    isAddressDirty,
    isAnyDirty,
    passwordData,
    addressData,
    handlePasswordChange,
    handleAddressChange,
    handleAddressSelect,
    handleSave,
    resetForm,
  };
}