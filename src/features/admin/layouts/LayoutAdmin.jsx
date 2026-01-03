import React, { useState, useEffect } from "react";
import SiderbarAdmin from "../components/nav/SiderbarAdmin";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";

const LayoutAdmin = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [sidebarOpen, setSidebarOpen] = useState(false);      // mobile only
  const [sidebarExpanded, setSidebarExpanded] = useState(false); // desktop only

  const location = useLocation();

  // ---- Detect screen size ----
  useEffect(() => {
    const resizeHandler = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", resizeHandler);
    return () => window.removeEventListener("resize", resizeHandler);
  }, []);

  // ---- Auto-close sidebar when route changes ----
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarExpanded(false); // desktop: collapse back to icon
    }
  }, [location.pathname, isMobile]);

  return (
    <div className="relative min-h-screen flex bg-gray-100 overflow-hidden">

      {/* 🔥 Mobile Hamburger button */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md hover:bg-gray-100 transition"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Sidebar */}
      <SiderbarAdmin
        isMobile={isMobile}
        isOpen={isMobile ? sidebarOpen : sidebarExpanded}
        toggle={() =>
          isMobile
            ? setSidebarOpen(!sidebarOpen)
            : setSidebarExpanded(!sidebarExpanded)
        }
        closeMobile={() => setSidebarOpen(false)}
      />

      {/* Desktop content shift (only when expanded) */}
      <div
        className="flex-1 min-h-screen transition-all duration-300"
        style={{
          marginLeft:
            !isMobile ? (sidebarExpanded ? 192 : 64) : 0,
        }}
      >
        <main className="h-full min-h-screen overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LayoutAdmin;
