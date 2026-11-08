/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { AlertTriangle, RotateCcw } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { ToastViewport } from "./AdminUI";
import adminService from "../../services/adminService";

const AdminContext = createContext(null);

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdmin must be used within AdminLayout");
  }
  return ctx;
};

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("hmu_admin_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const refreshGlobalCounts = useCallback(async () => {
    try {
      const res = await adminService.getOverview({ range: "30d" });
      const pCount = res?.kpis?.pendingApplications?.value ?? 0;
      const feed = res?.recentActivity || [];
      setPendingCount(pCount);
      setNotifications(feed);
      setUnreadCount(pCount > 0 ? pCount : 0);
    } catch {
      // Handled individually by active page error state
    }
  }, []);

  useEffect(() => {
    refreshGlobalCounts();
  }, [refreshGlobalCounts]);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("hmu_admin_sidebar_collapsed", String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const contextValue = {
    demoMode: false,
    pendingCount,
    refreshGlobalCounts,
    notify
  };

  return (
    <AdminContext.Provider value={contextValue}>
      <div className="admin-shell min-h-screen w-full bg-[#F8F9FB] text-[#111827]">
        <AdminSidebar
          collapsed={collapsed}
          onToggleCollapse={handleToggleCollapse}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          pendingCount={pendingCount}
        />

        <div
          className={`flex min-h-screen flex-col transition-[padding] duration-150 ${
            collapsed ? "lg:pl-[68px]" : "lg:pl-[248px]"
          }`}
        >
          <AdminTopbar
            onOpenMobileMenu={() => setMobileOpen(true)}
            pendingCount={pendingCount}
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAllRead={() => setUnreadCount(0)}
          />

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1440px]">
              <Outlet />
            </div>
          </main>
        </div>

        <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      </div>
    </AdminContext.Provider>
  );
}

