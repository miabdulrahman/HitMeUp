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

  const [demoMode, setDemoMode] = useState(() => {
    try {
      return sessionStorage.getItem("hmu_admin_demo_mode") === "true";
    } catch {
      return false;
    }
  });

  const [pendingCount, setPendingCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((message, type = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const refreshGlobalCounts = useCallback(async () => {
    try {
      const res = await adminService.getOverview({ range: "30d", demoMode });
      const pCount = res?.kpis?.pendingApplications?.value ?? 0;
      const feed = res?.recentActivity || [];
      setPendingCount(pCount);
      setNotifications(feed);
      setUnreadCount(pCount > 0 ? pCount : 0);
    } catch {
      // Handled individually by active page error state
    }
  }, [demoMode]);

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

  const handleToggleDemoMode = () => {
    setDemoMode((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem("hmu_admin_demo_mode", String(next));
      } catch {
        // ignore
      }
      notify(
        next
          ? "Switched to isolated Demo dataset for evaluation"
          : "Connected to Live MongoDB Platform API",
        "info"
      );
      return next;
    });
  };

  const contextValue = {
    demoMode,
    setDemoMode,
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
            demoMode={demoMode}
            onToggleDemoMode={handleToggleDemoMode}
            pendingCount={pendingCount}
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAllRead={() => setUnreadCount(0)}
          />

          {/* Explicit Demo Dataset Disclosure Banner */}
          {demoMode && (
            <div className="border-b border-[#FDE68A] bg-[#FFFBEB] px-4 py-2 sm:px-6">
              <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 text-[12px] text-[#92400E]">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} strokeWidth={1.5} className="shrink-0 text-[#D97706]" />
                  <span>
                    <strong className="font-semibold">Demo dataset active:</strong>{" "}
                    Displaying clearly labelled sample development records. Changes apply only in memory and do not alter production data.
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      adminService.resetDemoStore();
                      refreshGlobalCounts();
                      notify("Demo dataset reset to initial state", "info");
                    }}
                    className="inline-flex items-center gap-1 font-medium text-[#92400E] hover:underline cursor-pointer"
                  >
                    <RotateCcw size={12} strokeWidth={1.5} />
                    <span>Reset demo records</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleDemoMode}
                    className="rounded-[6px] border border-[#F59E0B]/40 bg-white px-2.5 py-0.5 font-medium text-[#92400E] hover:bg-[#FEF3C7] cursor-pointer"
                  >
                    Return to Live API
                  </button>
                </div>
              </div>
            </div>
          )}

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

