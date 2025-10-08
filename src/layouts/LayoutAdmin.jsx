import React, { useState } from "react";
import SiderbarAdmin from "../components/admin/SiderbarAdmin";
import HeaderAdmin from "../components/admin/HeaderAdmin";
import { Outlet } from "react-router-dom";

const LayoutAdmin = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    <div className="flex h-screen">
      <SiderbarAdmin isExpanded={isSidebarExpanded} toggleSidebar={() => setIsSidebarExpanded(prev => !prev)} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300`}
        style={{
          marginLeft: isSidebarExpanded ? 192 : 64, // px ตามขนาด Sidebar (w-48=192, w-16=64)
        }}
      >
        {/* <HeaderAdmin /> */}
        <main className="flex-1 p-6 bg-gray-100 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LayoutAdmin;
