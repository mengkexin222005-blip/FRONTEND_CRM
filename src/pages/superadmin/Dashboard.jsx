import React from "react";
import AdminDashboard from "../admin/Dashboard";

export default function SuperAdminDashboard(props) {
  // Reuse the admin dashboard UI; Super Admin sees everything.
  return <AdminDashboard {...props} />;
}
