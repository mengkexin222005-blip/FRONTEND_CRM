import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import prospectService from "../services/prospectService";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  width: "auto",
});

function normalizeProspects(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.prospects)) return data.prospects;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getFullName(name) {
  if (!name) return "";

  return [name.firstName, name.middleInitial, name.lastName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getErrorMessage(error, fallback) {
  console.error("Full API error response:", error.response?.data);

  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    fallback
  );
}

export default function useProspect() {
  const [allProspects, setAllProspects] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");

  const fetchProspects = useCallback(async () => {
    setLoading(true);

    try {
      const data = await prospectService.getProspects();
      setAllProspects(normalizeProspects(data));
    } catch (error) {
      console.error("Error loading prospects:", error);

      Toast.fire({
        icon: "error",
        title: getErrorMessage(error, "Failed to load prospects"),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  const prospects = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return allProspects.filter((prospect) => {
      const representativeName = getFullName(prospect.representativeName);
      const ownerName = getFullName(prospect.ownerName);

      const searchableText = [
        prospect.companyName,
        prospect.companyEmailAddress,
        prospect.companyWebsite,
        prospect.natureOfBusiness,
        prospect.numberOfEmployees,
        prospect.phone,
        prospect.emailAddress,
        prospect.viber,
        prospect.title,
        prospect.leadSource,
        prospect.status,
        representativeName,
        ownerName,
        prospect.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);

      const matchesStatus =
        statusFilter === "All" || prospect.status === statusFilter;

      const matchesSource =
        sourceFilter === "All" || prospect.leadSource === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [allProspects, searchTerm, statusFilter, sourceFilter]);

  const addProspect = async (payload) => {
    try {
      const data = await prospectService.createProspect(payload);
      const createdProspect = data?.prospect || data;

      setAllProspects((prev) => [createdProspect, ...prev]);

      Toast.fire({
        icon: "success",
        title: "Prospect created successfully",
      });

      return true;
    } catch (error) {
      console.error("Error creating prospect:", error);

      Toast.fire({
        icon: "error",
        title: getErrorMessage(error, "Failed to create prospect"),
      });

      return false;
    }
  };

  const editProspect = async (id, payload) => {
    try {
      await prospectService.updateProspect(id, payload);

      await fetchProspects();

      Toast.fire({
        icon: "success",
        title: "Prospect updated successfully",
      });

      return true;
    } catch (error) {
      console.error("Error updating prospect:", error);

      Toast.fire({
        icon: "error",
        title: getErrorMessage(error, "Failed to update prospect"),
      });

      return false;
    }
  };

  const removeProspect = async (id) => {
    const result = await Swal.fire({
      title: "Delete prospect?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Delete",
    });

    if (!result.isConfirmed) return false;

    try {
      await prospectService.deleteProspect(id);

      setAllProspects((prev) =>
        prev.filter((prospect) => prospect._id !== id)
      );

      Toast.fire({
        icon: "success",
        title: "Prospect deleted successfully",
      });

      return true;
    } catch (error) {
      console.error("Error deleting prospect:", error);

      Toast.fire({
        icon: "error",
        title: getErrorMessage(error, "Failed to delete prospect"),
      });

      return false;
    }
  };

  const markAsContacted = async (id) => {
    const result = await Swal.fire({
      title: "Move prospect to leads?",
      text: "Once contacted, this prospect will be moved to the Leads module.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Move to Leads",
    });

    if (!result.isConfirmed) return false;

    try {
      const data = await prospectService.markAsContacted(id);

      if (data?.moved) {
        setAllProspects((prev) =>
          prev.filter((prospect) => prospect._id !== id)
        );
      }

      Toast.fire({
        icon: "success",
        title: data?.message || "Prospect moved to leads",
      });

      return true;
    } catch (error) {
      console.error("Error moving prospect to leads:", error);

      Toast.fire({
        icon: "error",
        title: getErrorMessage(error, "Failed to move prospect to leads"),
      });

      return false;
    }
  };

  const updateProspectStatus = async (prospectOrId, status) => {
    const prospect =
      typeof prospectOrId === "object"
        ? prospectOrId
        : allProspects.find((p) => p._id === prospectOrId);

    const id = prospect?._id || prospectOrId;

    if (status === "Contacted") {
      return await markAsContacted(id);
    }

    await editProspect(id, {
      ...(prospect || {}),
      status,
    });

    return true;
  };

  return {
    prospects,
    allProspects,
    loading,

    searchTerm,
    setSearchTerm,

    statusFilter,
    setStatusFilter,

    sourceFilter,
    setSourceFilter,

    fetchProspects,
    addProspect,
    editProspect,
    removeProspect,
    markAsContacted,
    updateProspectStatus,

    contactProspect: markAsContacted,
  };
}