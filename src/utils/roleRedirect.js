import { ROLES } from "../permissions/roles";

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");

export const normalizeRoleName = (role) => {
  const normalizedRole = normalizeRole(role);

  switch (normalizedRole) {
    case "super admin":
    case "superadmin":
    case "super admin role":
    case "super-admin":
      return ROLES.SUPERADMIN;
    case "admin":
      return ROLES.ADMIN;
    case "sales manager":
      return ROLES.SALES_MANAGER;
    case "sales agent":
      return ROLES.SALES_AGENT;
    case "support staff":
      return ROLES.SUPPORT_STAFF;
    default:
      return String(role || "").trim();
  }
};

export const getDashboardByRole = (role) => {
  switch (normalizeRoleName(role)) {
    case ROLES.ADMIN:
      return "/admin";
    case ROLES.SUPERADMIN:
      return "/superadmin";
    case ROLES.SALES_MANAGER:
      return "/sales-manager";
    case ROLES.SALES_AGENT:
      return "/sales-agent";
    case ROLES.SUPPORT_STAFF:
      return "/support-staff";
    default:
      return "/login";
  }
};
