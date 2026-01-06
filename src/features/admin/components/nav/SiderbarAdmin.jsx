import React from "react";
import { NavLink } from "react-router-dom";
import {
  LogOut,
  Menu,
  X,
  Store,
  FileUp,
  ChartNoAxesCombined,
  Package2,
  LayoutDashboard
} from "lucide-react";
import useBmrStore from "../../../../store/bmr_store";

const SiderbarAdmin = ({ isMobile, isOpen, toggle, closeMobile }) => {
  const logout = useBmrStore((s) => s.logout);
  const handleLogout = async () => {
    await logout();
    if (isMobile) closeMobile();
  };

  // ---- Mobile Sidebar (Overlay) ----
  if (isMobile) {
    return (
      <>
        {/* backdrop */}
        <div
          className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300
          ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          onClick={closeMobile}
        />

        {/* panel */}
        <div
          className={`fixed top-0 left-0 w-64 h-full z-50 bg-gray-900 text-white 
            transition-transform duration-300 shadow-xl
            ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          {/* header */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-gray-700">
            <span className="text-lg font-bold">BMR</span>
            <button onClick={closeMobile} className="p-2 hover:bg-gray-700 rounded">
              <X size={20} />
            </button>
          </div>

          {/* items */}
          <nav className="p-4 space-y-2">
            <SidebarItem to="sales" label="Sales" icon={<ChartNoAxesCombined size={20} />} close={closeMobile} />
            <SidebarItem to="dashboard-shelf" label="Shelf Dashboard" icon={<LayoutDashboard size={20} />} close={closeMobile} />
            <SidebarItem to="shelf" label="Shelf" icon={<Store size={20} />} close={closeMobile} />
            <SidebarItem to="upload" label="Upload CSV" icon={<FileUp size={20} />} close={closeMobile} />
            <SidebarItem to="stock" label="Stock" icon={<Package2 size={20} />} close={closeMobile} />

            <div className="pt-4">
              <SidebarButton onClick={handleLogout} label="Logout" icon={<LogOut size={20} />} />
            </div>
          </nav>
        </div>
      </>
    );
  }

  // ---- Desktop Sidebar (Collapsed / Expanded) ----
  return (
    <div
      className={`
        bg-gray-900 text-gray-100 h-screen fixed left-0 top-0 z-30
        transition-[width] duration-200 ease-out flex flex-col
        ${isOpen ? "w-48" : "w-16"}
      `}
    >
      {/* header */}
      <div
        onClick={toggle}
        className="h-16 flex items-center justify-center hover:bg-gray-700 cursor-pointer"
      >
        {isOpen ? (
          <span className="text-lg font-bold">BMR</span>
        ) : (
          <Menu size={24} />
        )}
      </div>

      {/* items */}
      <nav className="flex-1 px-1 py-1 space-y-2">
        {/* <SidebarItem to="sales" label="Sales" icon={<ChartNoAxesCombined size={20} />} expanded={isOpen} /> */}
        <SidebarItem to="dashboard-shelf" label="Shelf Dashboard" icon={<LayoutDashboard size={20} />} expanded={isOpen} />
        <SidebarItem to="shelf" label="Shelf" icon={<Store size={20} />} expanded={isOpen} />
        <SidebarItem to="upload" label="Upload CSV" icon={<FileUp size={20} />} expanded={isOpen} />
        <SidebarItem to="stock" label="Stock" icon={<Package2 size={20} />} expanded={isOpen} />

        <div className="pt-8">
          <SidebarButton onClick={handleLogout} label="Logout" icon={<LogOut size={20} />} expanded={isOpen} />
        </div>
      </nav>
    </div>
  );
};

const SidebarItem = ({ to, label, icon, expanded, close }) => {
  const showLabel = expanded !== false;
  return (
    <NavLink
      to={to}
      onClick={() => close && close()}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition min-w-0
        ${isActive ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}
      `
      }
    >
      <span className="w-5 h-5 flex items-center justify-center shrink-0">
        {icon}
      </span>
      <span
        className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${
          showLabel ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
        }`}
      >
        {label}
      </span>
    </NavLink>
  );
};

const SidebarButton = ({ onClick, label, icon, expanded }) => {
  const showLabel = expanded !== false;
  return (
  <button
    onClick={onClick}
    className="flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition min-w-0"
  >
    <span className="w-5 h-5 flex items-center justify-center shrink-0">
      {icon}
    </span>
    <span
      className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${
        showLabel ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
      }`}
    >
      {label}
    </span>
  </button>
  );
};

export default SiderbarAdmin;
