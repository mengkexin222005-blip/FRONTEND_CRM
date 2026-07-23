import { NavLink } from "react-router-dom";

export default function SidebarItem({ item, isCollapsed }) {
  const Icon = item.Icon;
  const ActiveIcon = item.ActiveIcon;

  return (
    <NavLink to={item.to} end>
      {({ isActive }) => (
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "gap-4 px-4"
          } py-3 rounded-md ${
            isActive
              ? "bg-[#f8f9fa] text-red-600"
              : "transition-colors hover:bg-red-50 hover:text-red-600"
          }`}
        >
          {isActive ? (
            <ActiveIcon size={20} strokeWidth={2.5} />
          ) : (
            <Icon size={20} strokeWidth={1.5} />
          )}

          {!isCollapsed && <span>{item.label}</span>}
        </div>
      )}
    </NavLink>
  );
}