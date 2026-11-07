import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Database,
  ArrowRight,
  X
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { formatRelativeTime } from "./AdminUI";

const PAGE_TITLES = {
  "/admin": "Overview",
  "/admin/applications": "Seller Applications",
  "/admin/sellers": "Sellers",
  "/admin/customers": "Customers",
  "/admin/deals": "Deals",
  "/admin/orders": "Orders",
  "/admin/analytics": "Analytics",
  "/admin/activity-logs": "Activity Logs",
  "/admin/settings": "Settings"
};

const QUICK_DESTINATIONS = [
  { label: "Overview dashboard", path: "/admin", hint: "KPIs, funnel & activity" },
  { label: "Pending seller applications", path: "/admin/applications?status=pending", hint: "Approve or reject merchants" },
  { label: "Registered sellers", path: "/admin/sellers", hint: "Directory & suspension controls" },
  { label: "Customer accounts", path: "/admin/customers", hint: "Shopper accounts & orders" },
  { label: "Flash deals ledger", path: "/admin/deals", hint: "Active, draft & expired passes" },
  { label: "Marketplace orders", path: "/admin/orders", hint: "Order status & LKR payments" },
  { label: "Platform analytics", path: "/admin/analytics", hint: "Growth & top businesses" },
  { label: "Activity & audit logs", path: "/admin/activity-logs", hint: "Admin actions & events" },
  { label: "Platform settings", path: "/admin/settings", hint: "Profile, security & rules" }
];

export default function AdminTopbar({
  onOpenMobileMenu,
  demoMode,
  onToggleDemoMode,
  pendingCount = 0,
  notifications = [],
  unreadCount = 0,
  onMarkAllRead
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const pageTitle = PAGE_TITLES[location.pathname] || "Platform Admin";

  // Keyboard shortcut Ctrl/Cmd + K for quick command search
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Click outside handler for popovers
  useEffect(() => {
    const onDocClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filteredDestinations = QUICK_DESTINATIONS.filter(
    (d) =>
      !searchQuery.trim() ||
      d.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.hint.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGlobalSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    setSearchQuery("");
    navigate(`/admin/applications?q=${encodeURIComponent(q)}`);
  };

  const initials = (user?.name || "Admin")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-[#E5E7EB] bg-white px-4 sm:px-6">
        {/* Left: Hamburger + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] lg:hidden cursor-pointer"
          >
            <Menu size={16} strokeWidth={1.5} />
          </button>

          <div className="flex items-center gap-2 text-[13px] min-w-0">
            <span className="hidden text-[#6B7280] sm:inline">Admin</span>
            <span className="hidden text-[#D1D5DB] sm:inline">/</span>
            <h1 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[#111827]">
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Search Trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-8 items-center gap-2.5 rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 text-[12px] text-[#6B7280] transition-colors hover:border-[#D1D5DB] hover:text-[#111827] cursor-pointer"
            aria-label="Search administration console"
          >
            <Search size={14} strokeWidth={1.5} />
            <span className="hidden md:inline">Search records or jump...</span>
            <kbd className="hidden rounded-[4px] border border-[#E5E7EB] bg-white px-1.5 py-0.2 font-mono text-[10px] text-[#6B7280] md:inline">
              Ctrl K
            </kbd>
          </button>

          {/* Data Source Mode Toggle (Live API vs Labelled Demo Sandbox) */}
          <button
            type="button"
            onClick={onToggleDemoMode}
            title={
              demoMode
                ? "Switch back to Live MongoDB API"
                : "Preview with isolated demo dataset"
            }
            className={`hidden sm:inline-flex h-8 items-center gap-1.5 rounded-[8px] border px-2.5 text-[12px] font-medium transition-colors cursor-pointer ${
              demoMode
                ? "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]"
                : "border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB]"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                demoMode ? "bg-[#F59E0B]" : "bg-[#10B981]"
              }`}
            />
            <Database size={13} strokeWidth={1.5} className="text-current opacity-75" />
            <span>{demoMode ? "Demo data" : "Live API"}</span>
          </button>

          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((prev) => !prev)}
              aria-label="Notifications"
              className="relative flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-white text-[#4B5563] transition-colors hover:bg-[#F9FAFB] hover:text-[#111827] cursor-pointer"
            >
              <Bell size={15} strokeWidth={1.5} />
              {(unreadCount > 0 || pendingCount > 0) && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#1D4ED8] ring-2 ring-white" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-[340px] max-w-[92vw] overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
                  <span className="text-[13px] font-semibold text-[#111827]">
                    Operational alerts
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={onMarkAllRead}
                      className="text-[11px] font-medium text-[#1D4ED8] hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {pendingCount > 0 && (
                  <div className="border-b border-[#E5E7EB] bg-[#EFF6FF]/60 px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="font-medium text-[#1E40AF]">
                        {pendingCount} seller{" "}
                        {pendingCount === 1 ? "application" : "applications"} awaiting review
                      </span>
                      <Link
                        to="/admin/applications?status=pending"
                        onClick={() => setNotifOpen(false)}
                        className="font-medium text-[#1D4ED8] hover:underline shrink-0"
                      >
                        Review &rarr;
                      </Link>
                    </div>
                  </div>
                )}

                <div className="max-h-[280px] divide-y divide-[#E5E7EB] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-[12px] text-[#6B7280]">
                      No recent platform events
                    </div>
                  ) : (
                    notifications.slice(0, 6).map((item) => (
                      <div key={item.id} className="px-4 py-2.5 text-[12px]">
                        <p className="text-[#111827] leading-snug">
                          {item.description}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-[#6B7280]">
                          {formatRelativeTime(item.timestamp)}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2 text-right">
                  <Link
                    to="/admin/activity-logs"
                    onClick={() => setNotifOpen(false)}
                    className="text-[12px] font-medium text-[#374151] hover:text-[#111827]"
                  >
                    View all activity logs &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Administrator Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex h-8 items-center gap-2 rounded-[8px] border border-[#E5E7EB] bg-white pl-1.5 pr-2 text-[13px] text-[#111827] transition-colors hover:bg-[#F9FAFB] cursor-pointer"
              aria-label="Administrator account menu"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || "Admin"}
                  className="h-6 w-6 rounded-[5px] object-cover"
                />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-[#111827] font-mono text-[11px] font-medium text-white">
                  {initials}
                </span>
              )}
              <span className="hidden max-w-[120px] truncate text-[12px] font-medium sm:inline">
                {user?.name || "Administrator"}
              </span>
              <ChevronDown size={13} strokeWidth={1.5} className="text-[#6B7280]" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-[230px] overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
                <div className="border-b border-[#E5E7EB] px-4 py-3">
                  <div className="truncate text-[13px] font-medium text-[#111827]">
                    {user?.name || "Platform Administrator"}
                  </div>
                  <div className="truncate font-mono text-[11px] text-[#6B7280]">
                    {user?.email || "admin@hitmeup.com"}
                  </div>
                </div>

                <div className="p-1.5 space-y-0.5">
                  <Link
                    to="/admin/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-[6px] px-2.5 py-2 text-[13px] text-[#374151] hover:bg-[#F3F4F6] hover:text-[#111827]"
                  >
                    <User size={15} strokeWidth={1.5} className="text-[#6B7280]" />
                    <span>Administrator profile</span>
                  </Link>

                  <Link
                    to="/admin/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-[6px] px-2.5 py-2 text-[13px] text-[#374151] hover:bg-[#F3F4F6] hover:text-[#111827]"
                  >
                    <Settings size={15} strokeWidth={1.5} className="text-[#6B7280]" />
                    <span>Platform settings</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      onToggleDemoMode();
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-[6px] px-2.5 py-2 text-left text-[13px] text-[#374151] hover:bg-[#F3F4F6] sm:hidden cursor-pointer"
                  >
                    <Database size={15} strokeWidth={1.5} className="text-[#6B7280]" />
                    <span>{demoMode ? "Switch to Live API" : "Enable Demo preview"}</span>
                  </button>
                </div>

                <div className="border-t border-[#E5E7EB] p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                      navigate("/login");
                    }}
                    className="flex w-full items-center gap-2 rounded-[6px] px-2.5 py-2 text-left text-[13px] font-medium text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer"
                  >
                    <LogOut size={15} strokeWidth={1.5} />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Command Search Palette Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[#111827]/40 pt-[10vh] px-4"
          onClick={() => setSearchOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Quick navigation and search"
        >
          <div
            className="w-full max-w-[520px] overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-[0_20px_48px_rgba(15,23,42,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={handleGlobalSearchSubmit}
              className="flex items-center border-b border-[#E5E7EB] px-4"
            >
              <Search size={16} strokeWidth={1.5} className="text-[#6B7280]" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jump to admin page or search seller applications..."
                className="h-12 flex-1 bg-transparent px-3 text-[14px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] cursor-pointer"
                aria-label="Close search"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </form>

            <div className="max-h-[320px] overflow-y-auto p-2">
              {searchQuery.trim() && (
                <div className="mb-2 space-y-1 border-b border-[#E5E7EB] pb-2">
                  <div className="px-2.5 py-1 text-[11px] font-medium text-[#6B7280]">
                    Search query across modules
                  </div>
                  {[
                    {
                      label: `Search Seller Applications for "${searchQuery.trim()}"`,
                      to: `/admin/applications?q=${encodeURIComponent(searchQuery.trim())}`
                    },
                    {
                      label: `Search Sellers for "${searchQuery.trim()}"`,
                      to: `/admin/sellers?q=${encodeURIComponent(searchQuery.trim())}`
                    },
                    {
                      label: `Search Deals for "${searchQuery.trim()}"`,
                      to: `/admin/deals?q=${encodeURIComponent(searchQuery.trim())}`
                    },
                    {
                      label: `Search Orders for "${searchQuery.trim()}"`,
                      to: `/admin/orders?q=${encodeURIComponent(searchQuery.trim())}`
                    }
                  ].map((item) => (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                        navigate(item.to);
                      }}
                      className="flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-left text-[13px] text-[#1D4ED8] hover:bg-[#EFF6FF] cursor-pointer"
                    >
                      <span className="truncate font-medium">{item.label}</span>
                      <ArrowRight size={14} strokeWidth={1.5} className="shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              <div className="px-2.5 py-1 text-[11px] font-medium text-[#6B7280]">
                Console sections
              </div>
              {filteredDestinations.map((dest) => (
                <button
                  key={dest.path}
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                    navigate(dest.path);
                  }}
                  className="flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-left text-[13px] text-[#111827] hover:bg-[#F3F4F6] cursor-pointer"
                >
                  <div>
                    <div className="font-medium">{dest.label}</div>
                    <div className="text-[11px] text-[#6B7280]">{dest.hint}</div>
                  </div>
                  <ArrowRight size={14} strokeWidth={1.5} className="text-[#9CA3AF]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

