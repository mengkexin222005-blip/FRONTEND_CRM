import { useAuth } from "../context/AuthContext";
import { PERMISSIONS } from "./permissions";
import { ROLES } from "./roles";

export const usePermissions = (feature) => {
  const { user } = useAuth();
  // Super Admin has implicit full access to everything.
  if (user?.role === ROLES.SUPERADMIN) {
    // Return a proxy that answers true for any permission key.
    return new Proxy(
      {},
      {
        get: () => true,
      }
    );
  }

  return {
    ...(PERMISSIONS[feature]?.[user?.role] ?? {}),
  };
};