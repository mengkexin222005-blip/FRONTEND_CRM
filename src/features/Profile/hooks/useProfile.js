  import { useState, useEffect, useCallback } from "react";
  import Swal from "sweetalert2";
  import api from "../../../services/api";

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    width: "auto",
  });


  export function useProfile() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading]   = useState(true);

    const fetchSettings = useCallback(async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/api/settings");
        setSettings(data);
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.error || "Failed to load settings",
        });
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      fetchSettings();
    }, [fetchSettings]);

    return { settings, loading };
  }