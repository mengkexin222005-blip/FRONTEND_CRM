import { Routes, Route } from "react-router-dom";

// Layouts & Routing Wrappers
import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";
import PrivateRoute from "./components/PrivateRoute";
import SessionRedirect from "./components/SessionRedirect";

// Common Pages
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import UserManagementPage from "./features/users/UserManagementPage";

// ADMIN
import AdminIndex from "./pages/admin/Dashboard";
import AdminLeads from "./pages/admin/Leads";
import AdminClients from "./pages/admin/Clients";
import AdminQuotations from "./pages/admin/Quotations";
import AdminReports from "./pages/admin/Reports";
import AdminTasks from "./pages/admin/Tasks";
import AdminProspects from "./pages/admin/Prospects";
import AdminMeetings from "./pages/admin/Meetings";
import AdminCalls from "./pages/admin/Calls";
import AdminSettings from "./pages/admin/Settings";
import AdminProfile from "./pages/admin/Profile";
import AdminCommunication from "./pages/admin/Communications";
import AdminSupport from "./pages/admin/Support";

// SALES MANAGER
import SalesManagerIndex from "./pages/salesManager/Dashboard";
import SalesManagerLeads from "./pages/salesManager/Leads";
import SalesManagerClients from "./pages/salesManager/Clients";
import SalesManagerQuotations from "./pages/salesManager/Quotations";
import SalesManagerTasks from "./pages/salesManager/Tasks";
import SalesManagerProspects from "./pages/salesManager/Prospects";
import SalesManagerMeetings from "./pages/salesManager/Meetings";
import SalesManagerCalls from "./pages/salesManager/Calls";
import SalesManagerSettings from "./pages/salesManager/Settings";
import SalesManagerProfile from "./pages/salesManager/Profile";
import SalesManagerCommunication from "./pages/salesManager/Communications";
import SalesManagerSupport from "./pages/admin/Support";

// SALES AGENT
import SalesAgentIndex from "./pages/salesAgent/Dashboard";
import SalesAgentLeads from "./pages/salesAgent/Leads";
import SalesAgentClients from "./pages/salesAgent/Clients";
import SalesAgentQuotations from "./pages/salesAgent/Quotations";
import SalesAgentTasks from "./pages/salesAgent/Tasks";
import SalesAgentProspects from "./pages/salesAgent/Prospects";
import SalesAgentMeetings from "./pages/salesAgent/Meetings";
import SalesAgentCalls from "./pages/salesAgent/Calls";
import SalesAgentSettings from "./pages/salesAgent/Settings";
import SalesAgentProfile from "./pages/salesAgent/Profile";
import SalesAgentCommunication from "./pages/salesAgent/Communications";
import SalesAgentSupport from "./pages/admin/Support";

// SUPPORT STAFF
import SupportStaffIndex from "./pages/supportStaff/Dashboard";
import SupportStaffProfile from "./pages/supportStaff/Profile";
import SupportCommunication from "./pages/supportStaff/Communications";
import SupportStaffSupport from "./pages/admin/Support"; 

function App() {
  return (
    <Routes>
      {/* PUBLIC & AUTHENTICATION */}
      <Route path="/" element={<SessionRedirect />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* ADMIN ROUTES */}
      <Route element={<PrivateRoute roles={["Admin"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminIndex />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/leads" element={<AdminLeads />} />
          <Route path="/admin/clients" element={<AdminClients />} />
          <Route path="/admin/quotations" element={<AdminQuotations />} />
          <Route path="/admin/tasks" element={<AdminTasks />} />
          <Route path="/admin/prospects" element={<AdminProspects />} />
          <Route path="/admin/meetings" element={<AdminMeetings />} />
          <Route path="/admin/calls" element={<AdminCalls />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/communications" element={<AdminCommunication />} />
          <Route path="/admin/support" element={<AdminSupport />} />
        </Route>
      </Route>

      {/* SALES MANAGER ROUTES */}
      <Route element={<PrivateRoute roles={["Sales Manager"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/sales-manager" element={<SalesManagerIndex />} />
          <Route path="/sales-manager/users" element={<UserManagementPage />} />
          <Route path="/sales-manager/leads" element={<SalesManagerLeads />} />
          <Route path="/sales-manager/clients" element={<SalesManagerClients />} />
          <Route path="/sales-manager/quotations" element={<SalesManagerQuotations />} />
          <Route path="/sales-manager/tasks" element={<SalesManagerTasks />} />
          <Route path="/sales-manager/prospects" element={<SalesManagerProspects />} />
          <Route path="/sales-manager/meetings" element={<SalesManagerMeetings />} />
          <Route path="/sales-manager/calls" element={<SalesManagerCalls />} />
          <Route path="/sales-manager/settings" element={<SalesManagerSettings />} />
          <Route path="/sales-manager/profile" element={<SalesManagerProfile />} />
          <Route path="/sales-manager/communications" element={<SalesManagerCommunication />} />
          <Route path="/sales-manager/support" element={<SalesManagerSupport />} />
        </Route>
      </Route>

      {/* SALES AGENT ROUTES */}
      <Route element={<PrivateRoute roles={["Sales Agent"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/sales-agent" element={<SalesAgentIndex />} />
          <Route path="/sales-agent/users" element={<UserManagementPage />} />
          <Route path="/sales-agent/leads" element={<SalesAgentLeads />} />
          <Route path="/sales-agent/clients" element={<SalesAgentClients />} />
          <Route path="/sales-agent/quotations" element={<SalesAgentQuotations />} />
          <Route path="/sales-agent/tasks" element={<SalesAgentTasks />} />
          <Route path="/sales-agent/prospects" element={<SalesAgentProspects />} />
          <Route path="/sales-agent/meetings" element={<SalesAgentMeetings />} />
          <Route path="/sales-agent/calls" element={<SalesAgentCalls />} />
          <Route path="/sales-agent/settings" element={<SalesAgentSettings />} />
          <Route path="/sales-agent/profile" element={<SalesAgentProfile />} />
          <Route path="/sales-agent/communications" element={<SalesAgentCommunication />} />
          <Route path="/sales-agent/support" element={<SalesAgentSupport />} />
        </Route>
      </Route>

      {/* SUPPORT STAFF ROUTES */}
      <Route element={<PrivateRoute roles={["Support Staff"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/support-staff" element={<SupportStaffIndex />} />
          <Route path="/support-staff/users" element={<UserManagementPage />} />
          {/* <Route path="/support-staff/leads" element={<SalesAgentLeads />} />
          <Route path="/support-staff/clients" element={<SalesAgentClients />} />
          <Route path="/support-staff/quotations" element={<SalesAgentQuotations />} />
          <Route path="/support-staff/tasks" element={<SalesAgentTasks />} />
          <Route path="/support-staff/prospects" element={<SalesAgentProspects />} /> */}
          {/* <Route path="/support-staff/meetings" element={<SalesAgentMeetings />} />
          <Route path="/support-staff/calls" element={<SalesAgentCalls />} /> */}
          {/* <Route path="/support-staff/settings" element={<SalesAgentSettings />} /> */}
          <Route path="/support-staff/profile" element={<SupportStaffProfile />} />
          <Route path="/support-staff/communications" element={<SupportCommunication />} />
          <Route path="/support-staff/support" element={<SupportStaffSupport />} />
        </Route>
      </Route>

      {/* FALLBACK 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;