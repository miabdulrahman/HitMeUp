/* eslint-disable react-refresh/only-export-components */
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardCheck,
  Store,
  Users,
  Tag,
  ShoppingBag,
  BarChart3,
  ScrollText,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  ExternalLink,
  X
} from "lucide-react";

export const ADMIN_NAV_GROUPS = [
  {
    label: "Marketplace",
    items: [
      {
        name: "Overview",
        path: "/admin",
        end: true,
        icon: LayoutDashboard
      },
      {
        name: "Seller Applications",
        path: "/admin/applications",
        icon: ClipboardCheck,
        badgeKey: "pendingApplications"
      },
      {
        name: "Sellers",
        path: "/admin/sellers",
        icon: Store
      },
      {
        name: "Customers",
        path: "/admin/customers",
        icon: Users
      }
    ]
  },
  {
    label: "Commerce",
    items: [
      {
        name: "Deals",
        path: "/admin/deals",
        icon: Tag
      },
      {
        name: "Orders",
        path: "/admin/orders",
        icon: ShoppingBag
      },
      {
        name: "Analytics",
        path: "/admin/analytics",
        icon: BarChart3
      }
    ]
  },
  {
    label: "Governance",
    items: [
      {
        name: "Activity Logs",
        path: "/admin/activity-logs",
        icon: ScrollText
      },
      {
        name: "Settings",
        path: "/admin/settings",
        icon: Settings
      }
    ]
  }
];

function SidebarContent({
  collapsed = false,
  onToggleCollapse,
  onCloseMobile,
  pendingCount = 0
}) {
  return (
    <div className="flex h-full flex-col bg-[#111318] text-[#D1D5DB]">
      {/* Brand Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.08] px-4">
        <Link
          to="/admin"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 min-w-0 focus:outline-none"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] bg-white p-1">
            <img
              src="/logo-icon.png"
              alt="HitMeUp"
              className="h-full w-full object-contain"
              onError={(e) => {
                e.currentTarget.src = "/favicon.png";
              }}
            />
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[14px] font-semibold tracking-[-0.01em] text-[#F9FAFB]">
                HitMeUp
              </div>
              <div className="font-mono text-[10px] font-medium tracking-[0.06em] text-[#9CA3AF]">
                PLATFORM ADMIN
              </div>
            </div>
          )}
        </Link>

        {onCloseMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[#9CA3AF] hover:bg-white/[0.06] hover:text-white lg:hidden cursor-pointer"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        ) : (
          !collapsed &&
          onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              className="hidden h-7 w-7 items-center justify-center rounded-[6px] text-[#9CA3AF] transition-colors hover:bg-white/[0.06] hover:text-white lg:flex cursor-pointer"
            >
              <PanelLeftClose size={15} strokeWidth={1.5} />
            </button>
          )
        )}
      </div>

      {/* Navigation Sections */}
      <nav
        aria-label="Platform administration navigation"
        className="flex-1 overflow-y-auto px-3 py-4 space-y-5"
      >
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <div className="mb-1.5 px-2.5 text-[11px] font-medium text-[#6B7280]">
                {group.label}
              </div>
            )}

            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const badgeVal =
                  item.badgeKey === "pendingApplications" ? pendingCount : 0;

                return (
                  <li key={item.path} className="relative group">
                    <NavLink
                      to={item.path}
                      end={item.end}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `flex h-9 items-center rounded-[8px] transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
                          collapsed
                            ? "justify-center px-0"
                            : "justify-between px-2.5"
                        } ${
                          isActive
                            ? "bg-white/[0.09] text-white font-medium"
                            : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-[#F3F4F6]"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="relative flex w-5 shrink-0 items-center justify-center">
                              <Icon
                                size={16}
                                strokeWidth={1.5}
                                className={
                                  isActive ? "text-[#60A5FA]" : "text-current"
                                }
                              />
                              {collapsed && badgeVal > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#F59E0B]" />
                              )}
                            </span>
                            {!collapsed && (
                              <span className="truncate text-[13px]">
                                {item.name}
                              </span>
                            )}
                          </div>

                          {!collapsed && badgeVal > 0 && (
                            <span
                              className={`ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-[5px] px-1.5 font-mono text-[11px] font-medium tabular-nums ${
                                isActive
                                  ? "bg-[#3B82F6]/25 text-[#93C5FD]"
                                  : "bg-[#F59E0B]/15 text-[#FBBF24]"
                              }`}
                            >
                              {badgeVal}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>

                    {/* Tooltip when sidebar is collapsed on desktop */}
                    {collapsed && (
                      <div
                        role="tooltip"
                        className="pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity duration-100 absolute left-full top-1/2 z-50 ml-2.5 -translate-y-1/2 whitespace-nowrap rounded-[6px] border border-white/10 bg-[#1F242D] px-2.5 py-1 text-[12px] font-medium text-white shadow-lg"
                      >
                        <span>{item.name}</span>
                        {badgeVal > 0 && (
                          <span className="ml-1.5 font-mono text-[11px] text-[#FBBF24]">
                            ({badgeVal})
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="shrink-0 border-t border-white/[0.08] p-3 space-y-1">
        {collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="hidden h-9 w-full items-center justify-center rounded-[8px] text-[#9CA3AF] hover:bg-white/[0.05] hover:text-white lg:flex cursor-pointer"
          >
            <PanelLeftOpen size={16} strokeWidth={1.5} />
          </button>
        )}

        <Link
          to="/"
          title="Open customer storefront"
          className={`flex h-9 items-center rounded-[8px] text-[12px] text-[#9CA3AF] transition-colors hover:bg-white/[0.05] hover:text-white ${
            collapsed ? "justify-center px-0" : "justify-between px-2.5"
          }`}
        >
          {!collapsed && <span>View marketplace</span>}
          <ExternalLink size={14} strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  );
}

export default function AdminSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  pendingCount
}) {
  return (
    <>
      {/* Desktop Fixed Rail */}
      <aside
        className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block border-r border-[#232730] transition-[width] duration-150 ${
          collapsed ? "lg:w-[68px]" : "lg:w-[248px]"
        }`}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          pendingCount={pendingCount}
        />
      </aside>

      {/* Mobile & Tablet Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden bg-[#111827]/50"
          onClick={onCloseMobile}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            className="h-full w-[264px] max-w-[82vw] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent
              collapsed={false}
              onCloseMobile={onCloseMobile}
              pendingCount={pendingCount}
            />
          </div>
        </div>
      )}
    </>
  );
}

