import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";

import callService from "../services/callService";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

const normalizeCall = (call) => {

  const contactMethod =
    call.contactMethod ||
    (call.WhatsApp
      ? "WhatsApp"
      : call.Viber
      ? "Viber"
      : "Mobile");

  const contactValue =
    call.contactValue ||
    call.contactNumber ||
    call.phone ||
    call.WhatsApp ||
    call.Viber ||
    "";

  return {
    ...call,
    _id: call._id,
    contactPerson: call.client || call.contactPerson || "",
    companyName: call.company || call.companyName || "",
    contactMethod,
    contactValue,
    status: call.status || "Scheduled",
    category: call.status === "Completed" ? "Past Call" : "Future Call",
    scheduledAt: call.schedule || call.scheduledAt || null,
    completedAt: call.completedAt || null,
    notes: call.notes || "",
  };
};

export default function useCalls() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCalls = useCallback(async () => {
    setLoading(true);

    try {
      const data = await callService.getCalls();
      setCalls(data.map(normalizeCall));
    } catch (error) {
      console.error("FETCH CALLS ERROR:", error);

      Toast.fire({
        icon: "error",
        title: "Failed to load calls",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const addCall = useCallback(async (payload) => {
    setLoading(true);

    try {
      const data = await callService.createCall(payload);

      setCalls((previous) => [normalizeCall(data), ...previous]);

      Toast.fire({
        icon: "success",
        title: "Call added",
      });

      return true;
    } catch (error) {
      console.error("CREATE CALL ERROR:", error);

      Toast.fire({
        icon: "error",
        title: "Failed to add call",
      });

      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const editCall = useCallback(async (id, payload) => {
    setLoading(true);

    try {
      const data = await callService.updateCall(id, payload);

      setCalls((previous) =>
        previous.map((call) =>
          call._id === id ? normalizeCall(data) : call
        )
      );

      Toast.fire({
        icon: "success",
        title: "Call updated",
      });

      return true;
    } catch (error) {
      console.error("UPDATE CALL ERROR:", error);

      Toast.fire({
        icon: "error",
        title: "Failed to update call",
      });

      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeCall = useCallback(async (id) => {
    const confirm = await Swal.fire({
      title: "Delete call?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
    });

    if (!confirm.isConfirmed) {
      return false;
    }

    try {
      await callService.deleteCall(id);

      setCalls((previous) => previous.filter((call) => call._id !== id));

      Toast.fire({
        icon: "success",
        title: "Call deleted",
      });

      return true;
    } catch (error) {
      console.error("DELETE CALL ERROR:", error);

      Toast.fire({
        icon: "error",
        title: "Failed to delete call",
      });

      return false;
    }
  }, []);

  const completeCall = useCallback(async (id) => {
    try {
      const data = await callService.updateCall(id, {
        status: "Completed",
      });

      setCalls((previous) =>
        previous.map((call) =>
          call._id === id ? normalizeCall(data) : call
        )
      );

      Toast.fire({
        icon: "success",
        title: "Call completed",
      });

      return true;
    } catch (error) {
      console.error("COMPLETE CALL ERROR:", error);

      Toast.fire({
        icon: "error",
        title: "Failed to complete call",
      });

      return false;
    }
  }, []);

  return {
    calls,
    loading,
    fetchCalls,
    addCall,
    editCall,
    removeCall,
    completeCall,
  };
}