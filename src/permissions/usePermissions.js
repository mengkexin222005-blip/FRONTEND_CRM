import { useAuth } from "../context/AuthContext";
import { PERMISSIONS } from "./permissions";
import { ROLES } from "./roles";
import { hasPermission } from "../utils/navigation";

export const usePermissions = (feature) => {
  const { user } = useAuth();
  const userRole = user?.role;

  // 1. Super Admin and Admin get full implicit access
  if (
    userRole === ROLES.SUPERADMIN ||
    userRole === "Admin" ||
    userRole === "Super Admin"
  ) {
    return new Proxy(
      {},
      {
        get: (_target, prop) => true,
      }
    );
  }

  // 2. Dynamic Module Access check using normalized comparison
  const hasModuleAccess = feature ? hasPermission(user, feature) : true;

  // 3. Case-insensitive lookup in static PERMISSIONS dictionary
  const matchedKey = feature
    ? Object.keys(PERMISSIONS).find(
        (key) => key.toLowerCase() === feature.toLowerCase()
      )
    : null;

  const featurePermissions = matchedKey
    ? PERMISSIONS[matchedKey]?.[userRole] ?? {}
    : feature
    ? PERMISSIONS[feature]?.[userRole] ?? {}
    : {};

  // If the user hasn't been granted access to this module, disable all actions
  if (!hasModuleAccess) {
    return {
      hasAccess: false,
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canAssign: false,
      canConvert: false,
    };
  }

  return {
    hasAccess: true,
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    ...featurePermissions,
  };
};

/**
 * Helper hook for simple module/role checks without passing a feature key
 */
export const useHasAccess = () => {
  const { user } = useAuth();
  const userRole = user?.role;

  const isAdmin = [ROLES.SUPERADMIN, "Admin", "Super Admin"].includes(userRole);

  const checkAccess = (moduleName) => {
    if (!user) return false;
    return hasPermission(user, moduleName);
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(userRole);
  };

  return { hasAccess: checkAccess, hasRole, isAdmin, user };
};
