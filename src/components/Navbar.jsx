import { useEffect, useRef, useState } from "react";
import { LogOut, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import { getProfileImage } from "../utils/avatar";
import { getDisplayName } from "../utils/name";
import UserDisplayName from "./UserDisplayName";
import NotificationPanel from "./notifications/NotificationPanel";
import { useNotifications } from "../hooks/useNotifications";

const roleRoutes = {
  Admin: "/admin",
  "Sales Manager": "/sales-manager",
  "Sales Agent": "/sales-agent",
  "Support Staff": "/support-staff",
};

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);

const formatTime = (value) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(value);

const getGreeting = (date) => {
  const hour = date.getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";

  return "Good Evening";
};

const getFirstName = (user) => {
  const directFirstName =
    user?.firstName ||
    user?.firstname ||
    user?.first_name ||
    user?.givenName;

  if (directFirstName) {
    return String(directFirstName).trim();
  }

  const displayName = getDisplayName(user, {
    includeMiddle: false,
    includeSuffix: false,
  });

  return String(displayName || "User")
    .trim()
    .split(/\s+/)[0];
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
  } = useNotifications();

  const rolePath = roleRoutes[user?.role];
  const profilePath = rolePath ? `${rolePath}/profile` : "/profile";

  const greeting = getGreeting(currentDateTime);
  const firstName = getFirstName(user);
  const date = formatDate(currentDateTime);
  const time = formatTime(currentDateTime);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentDateTime(new Date());
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }

      if (
        notifRef.current &&
        !notifRef.current.contains(event.target)
      ) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogoutClick = () => {
    Swal.fire({
      title: "Are you sure you want to Logout?",
      text: "You will be redirected to the Login page.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Logout",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        await logout();
      } catch (error) {
        console.error("Logout error:", error);

        Swal.fire({
          icon: "error",
          title: "Logout Failed",
          text: "An error occurred while trying to logout.",
        });
      }
    });
  };

  const handleProfileClick = () => {
    navigate(profilePath);
    setOpen(false);
  };

  const handleProfileToggle = () => {
    setOpen((current) => !current);
    setNotifOpen(false);
  };

  return (
    <header className="flex w-full min-w-0 items-center justify-between gap-[clamp(8px,1.5vw,24px)] rounded-md border border-gray-200 bg-white px-[clamp(12px,2vw,24px)] py-[clamp(10px,1.2vw,14px)]">
      <div className="min-w-0 flex-1">
        <h1
          title={`${greeting}, ${firstName}`}
          className="truncate text-[clamp(14px,1.55vw,20px)] font-semibold leading-tight text-gray-800"
        >
          {greeting}, {firstName}
        </h1>

        <p className="mt-0.5 hidden truncate text-[clamp(9px,0.85vw,12px)] text-gray-400 sm:block">
          Welcome back to your dashboard
        </p>
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-[clamp(8px,1.4vw,20px)]">
        <div className="hidden shrink-0 whitespace-nowrap text-[clamp(10px,0.9vw,13px)] text-gray-500 lg:block">
          {date}
          <span className="mx-1.5 text-gray-300">·</span>
          {time}
        </div>

        <NotificationPanel
          notifRef={notifRef}
          notifOpen={notifOpen}
          setNotifOpen={setNotifOpen}
          setOpen={setOpen}
          notifications={notifications}
          unreadCount={unreadCount}
          loading={loading}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDismiss={dismissNotification}
          onClearAll={clearAll}
        />

        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            aria-label="Open profile menu"
            aria-expanded={open}
            onClick={handleProfileToggle}
            className="block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            <img
              src={getProfileImage(user)}
              alt="User avatar"
              className="h-[clamp(32px,3vw,40px)] w-[clamp(32px,3vw,40px)] rounded-full border-2 border-red-500 object-cover"
            />
          </button>

          {open && (
            <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(16rem,calc(100vw-2rem))] rounded-md border border-gray-200 bg-white p-[clamp(12px,1.5vw,16px)] shadow-lg">
              <div className="mb-3 flex min-w-0 items-center gap-3">
                <img
                  src={getProfileImage(user)}
                  alt="User avatar"
                  className="h-10 w-10 shrink-0 rounded-full border border-gray-200 object-cover"
                />

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">
                    <UserDisplayName user={user} showYou={false}>
                      {getDisplayName(user, {
                        includeMiddle: false,
                        includeSuffix: true,
                      })}
                    </UserDisplayName>
                  </p>

                  <p className="truncate text-xs text-gray-500">
                    {user?.role || "User"}
                  </p>
                </div>
              </div>

              <div className="my-2 border-t border-gray-200" />

              <button
                type="button"
                onClick={handleProfileClick}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
              >
                <UserIcon size={16} className="shrink-0" />
                <span>View Profile</span>
              </button>

              <button
                type="button"
                onClick={handleLogoutClick}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-gray-700 transition hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={16} className="shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}