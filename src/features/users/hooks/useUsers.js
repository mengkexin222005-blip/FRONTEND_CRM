import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import api from "../../../services/api";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

// --- Helper Functions ---

const isFile = (value) =>
  typeof File !== "undefined" && value instanceof File;

const getErrorMessage = (error) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong";

const unwrapUsers = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const unwrapUser = (data) =>
  data?.data && !Array.isArray(data.data) ? data.data : data;

const inputToObject = (input) => {
  if (!(input instanceof FormData)) {
    return { ...input };
  }

  const values = {};
  for (const [key, value] of input.entries()) {
    if (!isFile(value)) {
      values[key] = value;
    }
  }
  return values;
};

const getProfilePicture = (input) => {
  const value =
    input instanceof FormData
      ? input.get("profilePicture")
      : input?.profilePicture;

  return isFile(value) ? value : null;
};

const normalizeTeam = (team) => {
  if (!team) return null;
  if (typeof team === "object") {
    return team._id || team.id || null;
  }
  return team;
};

const getAddress = (values) => {
  if (values.currentAddress && typeof values.currentAddress === "object") {
    return values.currentAddress;
  }

  if (typeof values.currentAddress === "string") {
    try {
      const parsed = JSON.parse(values.currentAddress);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch (error) {
      console.debug("Address is not a valid JSON string, using fallback key mapping:", error.message);
    }
  }

  return {
    houseNumber: values["currentAddress.houseNumber"] ?? values.houseNumber ?? "",
    street: values["currentAddress.street"] ?? values.street ?? "",
    barangay: values["currentAddress.barangay"] ?? values.barangay ?? "",
    municipality: values["currentAddress.municipality"] ?? values.municipality ?? "",
    province: values["currentAddress.province"] ?? values.province ?? "",
    zipCode: values["currentAddress.zipCode"] ?? values.zipCode ?? "",
    country: values["currentAddress.country"] ?? values.country ?? "Philippines",
  };
};

const buildCreatePayload = (input) => {
  const values = inputToObject(input);

  return {
    team: normalizeTeam(values.team),
    firstName: values.firstName ?? "",
    middleName: values.middleName ?? "",
    lastName: values.lastName ?? "",
    suffixName: values.suffixName ?? "",
    email: values.email ?? "",
    password: values.password ?? "",
    role: values.role ?? "",
    phone: values.phone ?? "",
    sex: values.sex ?? "",
    dateOfBirth: values.dateOfBirth ?? "",
    placeOfBirth: values.placeOfBirth ?? "",
    currentAddress: getAddress(values),
  };
};

const buildUpdatePayload = (input, profilePicture = null) => {
  const values = inputToObject(input);
  const address = getAddress(values);
  const payload = profilePicture ? new FormData() : {};

  const append = (key, value) => {
    if (value === undefined) return;

    if (payload instanceof FormData) {
      payload.append(key, value === null ? "" : value);
    } else {
      payload[key] = value;
    }
  };

  append("team", normalizeTeam(values.team));
  append("firstName", values.firstName);
  append("middleName", values.middleName ?? "");
  append("lastName", values.lastName);
  append("suffixName", values.suffixName ?? "");
  append("email", values.email);
  append("role", values.role);
  append("phone", values.phone);
  append("sex", values.sex);
  append("dateOfBirth", values.dateOfBirth);
  append("placeOfBirth", values.placeOfBirth);
  append("currentAddress.houseNumber", address.houseNumber ?? "");
  append("currentAddress.street", address.street ?? "");
  append("currentAddress.barangay", address.barangay ?? "");
  append("currentAddress.municipality", address.municipality ?? "");
  append("currentAddress.province", address.province ?? "");
  append("currentAddress.zipCode", address.zipCode ?? "");
  append("currentAddress.country", address.country ?? "Philippines");

  if (values.password) {
    append("password", values.password);
  }

  if (values.removeProfilePicture !== undefined) {
    append("removeProfilePicture", String(values.removeProfilePicture));
  }

  if (profilePicture) {
    append("profilePicture", profilePicture);
  }

  return payload;
};

// --- Custom Hook ---

export function useUsers({ skip = false } = {}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(!skip);

  const endpoint = useMemo(() => "/api/users", []);

  const fetchUsers = useCallback(
    async (onSuccess) => {
      if (skip) {
        setLoading(false);
        return [];
      }

      setLoading(true);

      try {
        const response = await api.get(endpoint);
        const loadedUsers = unwrapUsers(response.data);

        if (onSuccess) {
          onSuccess(loadedUsers);
        } else {
          setUsers(loadedUsers);
        }

        return loadedUsers;
      } catch (error) {
        console.error("Fetch users error:", error);

        if (!onSuccess) {
          setUsers([]);
        }

        Toast.fire({
          icon: "error",
          title: getErrorMessage(error),
        });

        return [];
      } finally {
        setLoading(false);
      }
    },
    [endpoint, skip]
  );

  useEffect(() => {
    let active = true;

    const runFetch = async () => {
      await fetchUsers((loadedUsers) => {
        if (active) {
          setUsers(loadedUsers);
        }
      });
    };

    void runFetch();

    return () => {
      active = false;
    };
  }, [fetchUsers]);

  const createUser = async (formData) => {
    setLoading(true);

    try {
      const profilePicture = getProfilePicture(formData);
      const createPayload = buildCreatePayload(formData);

      const response = await api.post("/api/users", createPayload);
      let createdUser = unwrapUser(response.data);

      if (profilePicture && createdUser?.employeeId) {
        const uploadPayload = buildUpdatePayload(createPayload, profilePicture);
        const uploadResponse = await api.patch(
          `/api/users/${createdUser.employeeId}`,
          uploadPayload
        );
        createdUser = unwrapUser(uploadResponse.data);
      }

      setUsers((previous) => [...previous, createdUser]);

      Toast.fire({
        icon: "success",
        title: "User created",
      });

      return createdUser;
    } catch (error) {
      console.error("Create user error:", error);

      Toast.fire({
        icon: "error",
        title: getErrorMessage(error),
      });

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (employeeId, formData) => {
    setLoading(true);

    try {
      const profilePicture = getProfilePicture(formData);
      const payload = buildUpdatePayload(formData, profilePicture);

      const response = await api.patch(`/api/users/${employeeId}`, payload);
      const updatedUser = unwrapUser(response.data);

      setUsers((previous) =>
        previous.map((currentUser) =>
          currentUser.employeeId === employeeId ? updatedUser : currentUser
        )
      );

      Toast.fire({
        icon: "success",
        title: "User updated",
      });

      return updatedUser;
    } catch (error) {
      console.error("Update user error:", error);

      Toast.fire({
        icon: "error",
        title: getErrorMessage(error),
      });

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (identifier) => {
    const selectedUser =
      typeof identifier === "object"
        ? identifier
        : users.find(
            (currentUser) =>
              currentUser.employeeId === identifier ||
              currentUser._id === identifier
          );

    const employeeId =
      selectedUser?.employeeId ||
      (typeof identifier === "string" ? identifier : null);

    if (!employeeId) {
      Toast.fire({
        icon: "error",
        title: "User identifier was not found",
      });
      return false;
    }

    const confirmation = await Swal.fire({
      title: "Delete user?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
    });

    if (!confirmation.isConfirmed) {
      return false;
    }

    setLoading(true);

    try {
      await api.delete(`/api/users/${employeeId}`);

      setUsers((previous) =>
        previous.filter((currentUser) => currentUser.employeeId !== employeeId)
      );

      Toast.fire({
        icon: "success",
        title: "User deleted",
      });

      return true;
    } catch (error) {
      console.error("Delete user error:", error);

      Toast.fire({
        icon: "error",
        title: getErrorMessage(error),
      });

      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    loading,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}