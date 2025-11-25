import React, { useState } from "react";
import SiderbarAdmin from "../components/admin/nav/SiderbarAdmin";
import HeaderAdmin from "../components/admin/nav/HeaderAdmin";
import { Outlet, useLocation } from "react-router-dom";

const LayoutAdmin = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const location = useLocation();

  const headerPaths = ["/admin/viewshelf", "/admin/sales-view"];
  const showHeader = headerPaths.includes(location.pathname);

  return (
    <div className="flex h-screen">
      <SiderbarAdmin
        isExpanded={isSidebarExpanded}
        toggleSidebar={() => setIsSidebarExpanded(prev => !prev)}
      />
      <div
        className={`flex-1 flex flex-col transition-all duration-300`}
        style={{
          marginLeft: isSidebarExpanded ? 192 : 64,
        }}
      >
        {/* {showHeader && <HeaderAdmin />} */}
        <main className="flex-1 p-6 pt-1 bg-gray-100 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LayoutAdmin;
