import { BASE_NAV, ROLE_ROUTES, ROLE_BASE_PATH } from "../constants/navigation";

const PERMISSION_BY_KEY = {
  dashboard: "Dashboard",
  users: "Settings",
  teams: "Teams",
  team: "Teams",
  reports: "Reports",
  prospects: "Prospects",
  leads: "Leads",
  clients: "Clients",
  quotations: "Quotations",
  tasks: "Tasks",
  meetings: "Meetings",
  calls: "Calls",
  support: "Support",
  communications: "Communications",
};

// Strips spaces, lowercases, and safely drops trailing "s" so plural/singular variations match perfectly
const normalize = (value) => {
  const str = String(value || "").trim().toLowerCase();
  return str.endsWith("s") && str !== "status" ? str.slice(0, -1) : str;
};

const getSavedPermissions = (user) =>
  Array.isArray(user?.permissions)
    ? user.permissions
        .map((permission) => String(permission || "").trim())
        .filter(Boolean)
    : [];

export const hasPermission = (user, permission) => {
  if (!user || !permission) return false;

  // Users without customized access keep the normal navigation supplied by their role.
  if (user.permissionsCustomized !== true) {
    return true;
  }

  // Customized users only receive permissions that were explicitly selected in Edit Access.
  return getSavedPermissions(user).some(
    (savedPermission) => normalize(savedPermission) === normalize(permission)
  );
};

const removeEmptyGroups = (items) =>
  items.filter((item, index, list) => {
    if (item.type !== "group") {
      return true;
    }

    const nextGroupIndex = list.findIndex(
      (candidate, candidateIndex) => candidateIndex > index && candidate.type === "group"
    );

    const sectionEnd = nextGroupIndex === -1 ? list.length : nextGroupIndex;

    return list
      .slice(index + 1, sectionEnd)
      .some((candidate) => candidate.type !== "group");
  });

export const getNavLinks = (role) => {
  const basePath = ROLE_BASE_PATH[role] || "";

  return (ROLE_ROUTES[role] || [])
    .map((key) => {
      const item = BASE_NAV[key];
      if (!item) return null;

      if (item.type === "group") {
        return {
          ...item,
          key,
        };
      }

      return {
        key,
        permission: PERMISSION_BY_KEY[key] || item.label,
        to: key === "dashboard" ? basePath : `${basePath}/${key}`,
        label: item.label,
        Icon: item.icon.default,
        ActiveIcon: item.icon.active,
      };
    })
    .filter(Boolean);
};

export const filterNavItems = (items, user) => {
  const permissionFiltered = items.filter((item) => {
    if (item.type === "group") {
      return true;
    }

    // Fallback chain to verify permission definitions against user clearances
    return (
      hasPermission(user, item.permission) ||
      hasPermission(user, item.label) ||
      hasPermission(user, item.key)
    );
  });

  const uniqueItems = permissionFiltered.filter(
    (item, index, self) =>
      index ===
      self.findIndex(
        (candidate) =>
          candidate.key === item.key &&
          candidate.to === item.to
      )
  );
  
  return removeEmptyGroups(uniqueItems);
};