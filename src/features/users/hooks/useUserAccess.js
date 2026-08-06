import { useState, useEffect, useMemo } from "react";
import api from "../../../services/api"; // Gamit ang working axios api instance mo
import Swal from "sweetalert2";

const ALL_ACCESS = [
  "Dashboard",
  "Leads",
  "Clients",
  "Quotations",
  "Tasks",
  "Meetings",
  "Calls",
  "Settings",
  "Reports",
  "Prospects",
  "Messages", // ADDED
  "Support",  // ADDED
];

// 🌟 Dito natin itinakda ang eksaktong specifications mo para sa defaults ng bawat role
const ROLE_ACCESS = {
  Admin: ALL_ACCESS,
  "Super Admin": ALL_ACCESS,
  "Sales Manager": [
    "Dashboard",
    "Leads",
    "Clients",
    "Quotations",
    "Tasks",
    "Meetings",
    "Calls",
    "Settings",
    "Reports",
    "Prospects",
    "Messages", // ADDED
    "Support",  // ADDED
  ],
  "Sales Agent": [
    "Dashboard",
    "Leads",
    "Clients",
    "Quotations",
    "Tasks",
    "Meetings",
    "Calls",
    "Messages", // ADDED
  ],
  "Support Staff": [
    "Dashboard",
    "Clients",
    "Tasks",
    "Meetings",
    "Calls",
    "Messages", // ADDED
    "Support",  // ADDED
  ],
};

export default function useUserAccess() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUser, setSelectedUserData] = useState(null);
  const [roleTemplate, setRoleTemplateState] = useState("");
  const [access, setAccess] = useState([]);
  const [saving, setSaving] = useState(false);

  // Kuhanin ang listahan ng lahat ng user mula sa database gamit ang working endpoint
  useEffect(() => {
    const fetchDropdownUsers = async () => {
      try {
        const response = await api.get("/api/users");
        const fetchedUsers = Array.isArray(response.data)
          ? response.data
          : response.data?.users || [];
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Failed to load user list for dropdown selection:", error);
      }
    };
    fetchDropdownUsers();
  }, []);

  const selectedAccess = useMemo(
    () => ALL_ACCESS.filter((item) => access.includes(item)),
    [access]
  );

  const unselectedAccess = useMemo(
    () => ALL_ACCESS.filter((item) => !access.includes(item)),
    [access]
  );

  // 🌟 Pagpili ng user sa dropdown: Automatic layout configuration base sa role at db custom updates
  const setSelectedUser = async (id) => {
    if (!id) {
      setSelectedUserId("");
      setSelectedUserData(null);
      setRoleTemplateState("");
      setAccess([]);
      return;
    }

    setSelectedUserId(id);

    try {
      const response = await api.get(`/api/users/${id}`);
      const data = response.data;

      setSelectedUserData(data);

      // Kunin ang kasalukuyang role ng napiling user sa db
      const currentRole = data.role || "";
      setRoleTemplateState(currentRole);

      // Kung may naka-save nang specific accessModules sa database para sa user na ito, gamitin yun.
      if (data.accessModules && data.accessModules.length > 0) {
        setAccess(data.accessModules.filter((item) => item !== "Teams"));
      } else if (currentRole && ROLE_ACCESS[currentRole]) {
        setAccess([...ROLE_ACCESS[currentRole]]);
      } else {
        setAccess([]);
      }
    } catch (error) {
      console.error("Failed to load chosen user permission mappings:", error);
    }
  };

  // 🌟 Kapag binago ng Admin ang Role template dropdown, nagpapalit din ang active checkboxes
  const setRoleTemplate = (value) => {
    setRoleTemplateState(value);
    if (value && ROLE_ACCESS[value]) {
      setAccess([...ROLE_ACCESS[value]]);
    } else {
      setAccess([]);
    }
  };

  // 🌟 Kapag nagki-click o nagbabawas ang Admin ng custom privileges sa screen
  const toggleAccess = (item) => {
    setAccess((previous) =>
      previous.includes(item)
        ? previous.filter((accessItem) => accessItem !== item)
        : [...previous, item]
    );
  };

  const cancelChanges = () => {
    if (selectedUserId) {
      setSelectedUser(selectedUserId);
    }
  };

  const saveAccess = async () => {
    if (!selectedUserId) return false;
    setSaving(true);

    try {
      const payload = {
        role: roleTemplate,
        accessModules: access.filter((item) => item !== "Teams"), // never persist Teams access
      };

      // Use the dedicated access update endpoint so the backend saves accessModules correctly
      await api.patch(`/api/users/${selectedUserId}/access`, payload);

      // Refresh the selected user data from the backend
      await setSelectedUser(selectedUserId);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Access permissions saved successfully",
        showConfirmButton: false,
        timer: 2200,
        timerProgressBar: true,
      });

      return true;
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Save Operation Failed",
        text:
          error.response?.data?.error ||
          "Unable to save module permission variations.",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    users,
    selectedUserId,
    selectedUser,
    setSelectedUser,
    roleTemplate,
    setRoleTemplate,
    access,
    selectedAccess,
    unselectedAccess,
    toggleAccess,
    saveAccess,
    cancelChanges,
    saving,
  };
}
