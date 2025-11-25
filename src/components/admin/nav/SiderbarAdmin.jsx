import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, LogOut, Menu, Store, FileUp, ChartNoAxesCombined
} from "lucide-react";
import useBmrStore from "../../../store/bmr_store";

const SiderbarAdmin = ({ isExpanded, toggleSidebar }) => {
  const logout = useBmrStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div
      className={`bg-gradient-to-b from-gray-800 to-gray-900 text-gray-100 h-screen flex flex-col transition-all duration-300
        ${isExpanded ? "w-48" : "w-16"} fixed left-0 top-0 z-50`}
    >
      {/* Header */}
      <div
        className="h-20 flex items-center justify-center cursor-pointer hover:bg-gray-700"
        onClick={toggleSidebar}
      >
        {isExpanded ? (
          <span className="text-white font-bold text-lg">BMR</span>
        ) : (
          <Menu size={28} />
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 px-2 py-4 space-y-2">
        <SidebarItem
          to="sales"
          icon={<ChartNoAxesCombined size={20} />}
          label="Sales"
          expanded={isExpanded}
        />
        <SidebarItem
          to="shelf"
          icon={<Store size={20} />}
          label="Shelf"
          expanded={isExpanded}
        />
        <SidebarItem
          to="upload"
          icon={<FileUp size={20} />}
          label="Upload CSV"
          expanded={isExpanded}
        />

        {/* Logout as menu item */}
        <div className="pt-10 py-4 px-0.5 space-y-2">
          <SidebarButton
            onClick={handleLogout}
            icon={<LogOut size={20} />}
            label="Logout"
            expanded={isExpanded}
          />
        </div>
      </nav>
    </div>
  );
};

const SidebarItem = ({ to, icon, label, expanded }) => {
  return (
    <NavLink
      to={to}
      end={to === "/admin"}
      className={({ isActive }) => {
        if (isActive) {
          return expanded
            ? "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm bg-gray-900 text-white shadow hover:bg-gray-700 transition"
            : "flex items-center justify-center px-3 py-2 rounded-lg text-white bg-gray-900 hover:bg-gray-700 transition";
        } else {
          return expanded
            ? "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition"
            : "flex items-center justify-center px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition";
        }
      }}
    >
      {icon}
      {expanded && <span>{label}</span>}
    </NavLink>
  );
};

// SidebarButton ใช้สำหรับปุ่ม action เช่น Logout/Login
const SidebarButton = ({ onClick, icon, label, expanded }) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition"
    >
      {icon}
      {expanded && <span>{label}</span>}
    </button>
  );
};

export default SiderbarAdmin;
