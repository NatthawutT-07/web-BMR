import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Handshake, UserCog,
  PackageSearch,
  LogOut,
  Menu,
  Layers,
  Store,
  MonitorCog,
  FileUp
} from "lucide-react";
import useBmrStore from "../../store/bmr_store";

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
        <Menu size={28} />
      </div>

      {/* Menu */}
      <nav className="flex-1 px-2 py-4 space-y-2">
        <SidebarItem
          to="/admin"
          icon={<LayoutDashboard size={20} />}
          label="Dashboard"
          expanded={isExpanded}
        />
        {/* <SidebarItem
          to="manage"
          icon={<UserCog size={20} />}
          label="Manage User"
          expanded={isExpanded}
        /> */}
        {/* <SidebarItem
          to="partner"
          icon={<Handshake size={20} />}
          label="Partner"
          expanded={isExpanded}
        /> */}
        {/* <SidebarItem
          to="product"
          icon={<PackageSearch size={20} />}
          label="List of Item Hold"
          expanded={isExpanded}
        /> */}
        <SidebarItem
          to="station"
          icon={<Store size={20} />}
          label="Station"
          expanded={isExpanded}
        />
        <SidebarItem
          to="edit-station"
          icon={<MonitorCog size={20} />}
          label="View Shelf"
          expanded={isExpanded}
        />
        {/* <SidebarItem
          to="stock"
          icon={<Layers size={20} />}
          label="Stock All Station"
          expanded={isExpanded}
        /> */}
        <SidebarItem
          to="upload"
          icon={<FileUp size={20} />}
          label="Upload CSV"
          expanded={isExpanded}
        />

      </nav>

      {/* Logout */}
      <div className="px-2 py-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-700 rounded-lg text-sm"
        >
          <LogOut size={20} />
          {isExpanded && <span>Logout</span>}
        </button>
      </div>
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


export default SiderbarAdmin;
