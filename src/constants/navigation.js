import {
  LayoutDashboard,
  Users,
  Magnet,
  UserCheck,
  BarChart2,
  ListTodo,
  Briefcase,
  CalendarDays,
  Phone,
  FileText,
  Headset,
  MessageSquareDot,
  Settings,
} from "lucide-react";

const createIcon = (Icon) => ({
  default: Icon,
  active: Icon,
});

export const BASE_NAV = {
  dashboard: {
    icon: createIcon(LayoutDashboard),
    label: "Dashboard",
  },

  users: {
    icon: createIcon(Users),
    label: "Users",
  },

  reports: {
    icon: createIcon(BarChart2),
    label: "Reports",
  },

  module: {
    label: "Modules",
    type: "group",
  },

  prospects: {
    icon: createIcon(Briefcase),
    label: "Prospects",
  },

  leads: {
    icon: createIcon(Magnet),
    label: "Leads",
  },

  clients: {
    icon: createIcon(UserCheck),
    label: "Clients",
  },

  quotations: {
    icon: createIcon(FileText),
    label: "Quotations",
  },

  tasks: {
    icon: createIcon(ListTodo),
    label: "Tasks",
  },

  meetings: {
    icon: createIcon(CalendarDays),
    label: "Meetings",
  },

  calls: {
    icon: createIcon(Phone),
    label: "Calls",
  },

  communications: {
    icon: createIcon(MessageSquareDot),
    label: "Messages",
  },

  support: {
    icon: createIcon(Headset),
    label: "Support",
  },

  settings: {
    icon: createIcon(Settings),
    label: "Settings",
  },
};

export const ROLE_ROUTES = {
  Admin: [
    "dashboard",
    "users",
    "teams",
    "reports",
    "module",
    "prospects",
    "leads",
    "clients",
    "quotations",
    "tasks",
    "meetings",
    "calls",
    "communications",
    "support",
    "settings",
  ],

  "Sales Manager": [
    "dashboard",
    "team",
    "reports",
    "module",
    "prospects",
    "leads",
    "clients",
    "quotations",
    "tasks",
    "meetings",
    "calls",
    "communications",
    "support",
    "settings",
  ],

  "Sales Agent": [
    "dashboard",
    "reports",
    "module",
    "prospects",
    "leads",
    "clients",
    "quotations",
    "tasks",
    "meetings",
    "calls",
    "communications",
    "support",
    "settings",
  ],

  "Support Staff": [
    "dashboard",
    "communications",
    "support",
  ],
};

export const ROLE_BASE_PATH = {
  Admin: "/admin",
  "Sales Manager": "/sales-manager",
  "Sales Agent": "/sales-agent",
  "Support Staff": "/support-staff",
};