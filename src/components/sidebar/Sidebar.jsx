import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronRight, ChevronDown, Folder } from "lucide-react";
import logo from "../../assets/intellicrm_logo.svg";
import logoOnly from "../../assets/i7logo.svg";
import { useAuth } from "../../context/AuthContext";
import { getNavLinks, filterNavItems, hasPermission } from "../../utils/navigation";
import SidebarItem from "./SidebarItem";

const ROLE_ROUTES = {
  Admin: "/admin",
  "Sales Manager": "/sales-manager",
  "Sales Agent": "/sales-agent",
  "Support Staff": "/support-staff",
};

const MODULE_PAGES = [
  "prospects",
  "leads",
  "clients",
  "quotations",
  "tasks",
  "meetings",
  "calls",
];

// Explicit Item Identification Helpers
const isDashboardItem = (item) => item.key === "dashboard";
const isReportsItem = (item) => item.key === "reports";
const isSettingsItem = (item) => item.key === "settings";

// Checks for "settings", "users", or route matches
const isSettingsItem = (item) =>
  item.key === "settings" ||
  item.key === "users" ||
  Boolean(item.to?.includes("/users")) ||
  Boolean(item.to?.includes("/settings"));

// Robust evaluation for plural, singular, keys, or URL segments
const isCommunicationItem = (item) =>
  item.key === "communications" ||
  item.key === "communication" ||
  Boolean(item.to?.includes("/communication")) ||
  Boolean(item.to?.includes("/communications"));

const isSupportItem = (item) =>
  item.key === "support" || Boolean(item.to?.includes("/support"));

const isModuleItem = (item) => {
  if (!item.to) return false;
  return MODULE_PAGES.some((page) => item.to.includes(`/${page}`));
};

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [moduleOpen, setModuleOpen] = useState(false);

  const baseRoute = ROLE_ROUTES[user?.role] || "";
  const settingsPath = `${baseRoute}/users`;

  // Filter and memoize nav list
  const navItems = useMemo(
    () => filterNavItems(getNavLinks(user?.role), user),
    [user]
  );

  // Group items to manage strict layout sequence
  const dashboardItems = useMemo(() => navItems.filter(isDashboardItem), [navItems]);
  const moduleItems = useMemo(() => navItems.filter(isModuleItem), [navItems]);
  const reportsItems = useMemo(() => navItems.filter(isReportsItem), [navItems]);
  const communicationItems = useMemo(() => navItems.filter(isCommunicationItem), [navItems]);
  const supportItems = useMemo(() => navItems.filter(isSupportItem), [navItems]);
  const settingsItems = useMemo(() => navItems.filter(isSettingsItem), [navItems]);

  // Settings items with explicitly forced label to "Settings"
  const settingsItems = useMemo(() => {
    return navItems
      .filter(isSettingsItem)
      .map((item) => ({ ...item, label: "Settings" }));
  }, [navItems]);

  useEffect(() => {
    const insideModule = MODULE_PAGES.some((page) =>
      location.pathname.includes(`/${page}`)
    );
    if (insideModule && moduleItems.length) {
      setModuleOpen(true);
    }
  }, [location.pathname, moduleItems.length]);

  return (
    <div
      className={`${
        isCollapsed ? "w-20" : "w-60"
      } flex flex-col border-r border-gray-200 bg-white text-gray-900 transition-all duration-300`}
    >
      {/* Brand Header */}
      <div className="relative flex h-23 items-center border-b-2 border-gray-200 px-4">
        <img
          src={isCollapsed ? logoOnly : logo}
          alt="CRM Logo"
          className={`${isCollapsed ? "h-8" : "h-10"} transition-all duration-300`}
        />

        {/* Collapse Toggle Trigger Button */}
        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className={`absolute -bottom-4.5 -right-4.5 z-10 flex cursor-pointer items-center justify-center rounded-full border-4 border-gray-100 bg-[#E7000B] p-1 transition-transform ${
            isCollapsed ? "" : "rotate-180"
          }`}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronRight size={23} color="white" />
        </button>
      </div>

      {/* Navigation List rendered sequentially */}
      <nav className="flex-1 space-y-2 overflow-y-auto p-4">
        {/* Dashboard */}
        {dashboardItems.map((item) => (
          <SidebarItem key={item.to} item={item} isCollapsed={isCollapsed} />
        ))}

        {/* Module Group Dropdown */}
        {moduleItems.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => {
                if (isCollapsed) {
                  setIsCollapsed(false);
                  setModuleOpen(true);
                  return;
                }
                setModuleOpen((prev) => !prev);
              }}
              className={`group flex w-full items-center rounded-md py-3 transition-colors ${
                isCollapsed ? "justify-center" : "justify-between px-4"
              } ${
                moduleOpen
                  ? "bg-red-50 text-red-600 font-medium"
                  : "text-gray-800 hover:bg-red-50 hover:text-red-600"
              }`}
            >
              <div className="flex items-center gap-4">
                <Folder size={20} />
                {!isCollapsed && <span>Module</span>}
              </div>

              {!isCollapsed && (
                moduleOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />
              )}
            </button>

            {moduleOpen &&
              moduleItems.map((item) => (
                <div key={item.to} className={isCollapsed ? "" : "ml-6"}>
                  <SidebarItem item={item} isCollapsed={isCollapsed} />
                </div>
              ))}
          </>
        )}

        {/* Reports */}
        {reportsItems.map((item) => (
          <SidebarItem key={item.to} item={item} isCollapsed={isCollapsed} />
        ))}

        {/* Communication */}
        {communicationItems.map((item) => (
          <SidebarItem key={item.to} item={item} isCollapsed={isCollapsed} />
        ))}

        {/* Support */}
        {supportItems.map((item) => (
          <SidebarItem key={item.to} item={item} isCollapsed={isCollapsed} />
        ))}

        {/* Settings Toggle */}
        {shouldShowSettings && (
          <NavLink
            to={settingsPath}
            onClick={() => {
              if (isCollapsed) {
                setIsCollapsed(false);
              }
            }}
            className={({ isActive }) =>
              `flex w-full items-center rounded-md py-3 transition ${
                isCollapsed ? "justify-center" : "px-4"
              } ${
                isActive
                  ? "bg-gray-100 text-red-600"
                  : "text-gray-900 hover:bg-gray-100"
              }`
            }
          >
            <div className="flex items-center gap-4">
              <Settings size={20} />
              {!isCollapsed && <span>Settings</span>}
            </div>
          </NavLink>
        )}
      </nav>
    </div>
  );
}