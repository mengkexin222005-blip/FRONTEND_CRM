import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  setAccessToken as setAxiosToken,
  setLogoutCallback,
} from "../services/api";
import {
  logout as logoutService,
  refreshToken,
} from "../services/authService";

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = "crm_auth";

const normalizePermissions = value => [
  ...new Set(
    (Array.isArray(value) ? value : [])
      .map(permission => String(permission || "").trim())
      .filter(Boolean),
  ),
];

const normalizeUser = userData => {
  if (!userData) return null;

  return {
    ...userData,
    employeeId: userData.employeeId || "",
    roleTemplate:
      userData.roleTemplate ||
      userData.role ||
      "",
    permissions: normalizePermissions(
      userData.permissions,
    ),
    permissionsCustomized:
      userData.permissionsCustomized === true,
  };
};

const getStoredAuth = () => {
  try {
    const stored = localStorage.getItem(
      AUTH_STORAGE_KEY,
    );

    if (!stored) return null;

    const parsed = JSON.parse(stored);

    if (
      !parsed?.accessToken ||
      !parsed?.user
    ) {
      localStorage.removeItem(
        AUTH_STORAGE_KEY,
      );

      return null;
    }

    return {
      accessToken: parsed.accessToken,
      user: normalizeUser(parsed.user),
    };
  } catch (error) {
    console.error(
      "Read stored authentication error:",
      error,
    );

    localStorage.removeItem(
      AUTH_STORAGE_KEY,
    );

    return null;
  }
};

const saveStoredAuth = (token, user) => {
  try {
    if (!token || !user) {
      localStorage.removeItem(
        AUTH_STORAGE_KEY,
      );

      return;
    }

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        accessToken: token,
        user,
      }),
    );
  } catch (error) {
    console.error(
      "Save authentication error:",
      error,
    );
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const refreshInProgressRef = useRef(false);
  const navigate = useNavigate();

  const clearAuth = useCallback(() => {
    setAxiosToken(null);
    setAccessToken(null);
    setUser(null);

    localStorage.removeItem(
      AUTH_STORAGE_KEY,
    );
  }, []);

  const applyAuth = useCallback((token, userData) => {
    const normalizedUser = normalizeUser(userData);

    if (!token || !normalizedUser) {
      return null;
    }

    setAxiosToken(token);
    setAccessToken(token);
    setUser(normalizedUser);

    saveStoredAuth(
      token,
      normalizedUser,
    );

    return normalizedUser;
  }, []);

  const handleLogout = useCallback(
    async (callServer = false) => {
      try {
        if (callServer) {
          await logoutService();
        }
      } catch (error) {
        console.error(
          "Logout error:",
          error,
        );
      } finally {
        clearAuth();

        navigate(
          "/login",
          { replace: true },
        );
      }
    },
    [
      clearAuth,
      navigate,
    ],
  );

  useEffect(() => {
    setLogoutCallback(() => {
      void handleLogout(false);
    });

    return () => {
      setLogoutCallback(null);
    };
  }, [handleLogout]);

  const refreshAuth = useCallback(async () => {
    if (refreshInProgressRef.current) {
      return null;
    }

    refreshInProgressRef.current = true;

    try {
      const data = await refreshToken();

      if (!data) {
        return null;
      }

      if (!data.accessToken || !data.user) {
        throw new Error(
          "Invalid authentication refresh response.",
        );
      }

      return applyAuth(
        data.accessToken,
        data.user,
      );
    } catch (error) {
      if (error?.response?.status === 401) {
        return null;
      }

      throw error;
    } finally {
      
      refreshInProgressRef.current = false;
    }
  }, [applyAuth]);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const storedAuth = getStoredAuth();

      /*
       * Restore local authentication first so the sidebar
       * and protected routes do not disappear during refresh.
       */
      if (storedAuth && active) {
        applyAuth(
          storedAuth.accessToken,
          storedAuth.user,
        );
      }

      try {
        await refreshAuth();
      } catch (error) {
        if (!active) return;

        /*
         * A missing refresh cookie must not remove a valid
         * locally stored session and navigation.
         */
        if (!storedAuth) {
          clearAuth();
        } else if (error?.response?.status !== 401) {
          console.error(
            "Session restore error:",
            error,
          );
        }
      } finally {
        if (active) {
          setAuthReady(true);
        }
      }
    };

    void restoreSession();

    return () => {
      active = false;
    };
  }, [
    applyAuth,
    clearAuth,
    refreshAuth,
  ]);

  const saveAuth = useCallback(
    (token, userData) =>
      applyAuth(token, userData),
    [applyAuth],
  );

  const logout = useCallback(
    () => handleLogout(true),
    [handleLogout],
  );

  const updateUser = useCallback(
    updatedUserData => {
      setUser(previousUser => {
        if (!previousUser) {
          return previousUser;
        }

        const updatedUser = normalizeUser({
          ...previousUser,
          ...updatedUserData,
        });

        const storedAuth = getStoredAuth();

        const token =
          accessToken ||
          storedAuth?.accessToken;

        if (token) {
          saveStoredAuth(
            token,
            updatedUser,
          );
        }

        return updatedUser;
      });
    },
    [accessToken],
  );

  const contextValue = useMemo(
    () => ({
      accessToken,
      user,
      saveAuth,
      logout,
      updateUser,
      refreshAuth,
    }),
    [
      accessToken,
      user,
      saveAuth,
      logout,
      updateUser,
      refreshAuth,
    ],
  );

  if (!authReady) return null;

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside <AuthProvider>",
    );
  }

  return context;
}