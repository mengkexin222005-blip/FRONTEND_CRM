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

// Merges and extracts permission items from either permissions or accessModules array
const getSavedPermissions = (user) => {
  const rawList = Array.isArray(user?.permissions) && user.permissions.length > 0
    ? user.permissions
    : Array.isArray(user?.accessModules)
    ? user.accessModules
    : [];

  return rawList
    .map((permission) => String(permission || "").trim())
    .filter(Boolean);
};

export const hasPermission = (user, permission) => {
  if (!user || !permission) return false;

  // Super Admin & Admin bypass all restrictions
  if (user.role === "Super Admin" || user.role === "Admin") {
    return true;
  }

  // Dashboard is universally accessible to authenticated users
  if (normalize(permission) === "dashboard") {
    return true;
  }

  // If permissions are not explicitly customized or provided, default to role-based access
  const hasCustomFlags =
    user.permissionsCustomized === true ||
    (Array.isArray(user.accessModules) && user.accessModules.length > 0) ||
    (Array.isArray(user.permissions) && user.permissions.length > 0);

  if (!hasCustomFlags) {
    return true;
  }

  // Check saved permission array against normalized target permission
  const normTarget = normalize(permission);
  return getSavedPermissions(user).some(
    (savedPermission) => normalize(savedPermission) === normTarget
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

    // Check item.permission, item.label, and item.key against hasPermission
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
