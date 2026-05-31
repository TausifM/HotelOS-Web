"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/auth.store";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BedDouble,
  Receipt,
  ClipboardList,
  BarChart3,
  Settings,
  Wrench,
  ChefHat,
  Bot,
  Bell,
  Star,
  LogOut,
  X,
  Sparkles,
  Home,
  TrendingUp,
  UserCog,
  ShieldCheck,
  Building2,
  CalendarRange,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: any;
  permission: string | null;
  badge?: string;
  feature?: string;
};

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Front Desk",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: null },
      { href: "/dashboard/checkin", label: "Check-in", icon: ClipboardList, permission: "checkin.read" },
      { href: "/dashboard/reservations", label: "Reservations", icon: CalendarDays, permission: "reservations.read" },
      { href: "/dashboard/guests", label: "Guests", icon: Users, permission: "guests.read" },
    ],
  },
  {
    label: "Hotel",
    items: [
      { href: "/dashboard/rooms", label: "Rooms", icon: BedDouble, permission: "rooms.read" },
      { href: "/dashboard/rate-calendar", label: "Rate Calendar", icon: CalendarRange, permission: "rates.read" },
      { href: "/dashboard/housekeeping", label: "Housekeeping", icon: Home, permission: "housekeeping.read" },
      { href: "/dashboard/maintenance", label: "Maintenance", icon: Wrench, permission: null },
      { href: "/dashboard/restaurant", label: "Restaurant", icon: ChefHat, permission: null },
      { href: "/dashboard/inventory", label: "Inventory", icon: Building2, permission: null },
      { href: "/dashboard/roomqr", label: "Room QR Codes", icon: ShieldCheck, permission: null, badge: "NEW" },
      {
        href: "/dashboard/channel-manager",
        label: "Channel Manager",
        icon: Home,
        permission: "channel_manager.read",
        badge: "NEW",
        feature: "channel_manager",
      },
      { href: "/dashboard/banquet-management", label: "Banquet Management", icon: CalendarRange, permission: null, badge: "NEW" },
      { href: "/dashboard/audit", label: "Audit Logs", icon: ClipboardList, permission: "audits.read" },
      { href: "/dashboard/attendance", label: "Staff Attendance", icon: CalendarDays, permission: "attendance.read" },
      { href: "/dashboard/guest-operations", label: "Guest Chat", icon: CalendarDays, permission: "attendance.read" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/dashboard/billing", label: "Billing & Folios", icon: Receipt, permission: "folios.read" },
      { href: "/dashboard/revenue", label: "Revenue AI", icon: TrendingUp, permission: "reports.read", badge: "AI" },
      { href: "/dashboard/reports", label: "Reports", icon: BarChart3, permission: "reports.read" },
      { href: "/dashboard/reports/gst", label: "GST Export", icon: Receipt, permission: "reports.read", badge: "NEW" },
    ],
  },
  {
    label: "Engagement",
    items: [
      { href: "/dashboard/notifications", label: "Notifications", icon: Bell, permission: "notifications.read" },
      { href: "/dashboard/loyalty", label: "Loyalty", icon: Star, permission: "loyalty.read" },
      { href: "/dashboard/aifeatures", label: "AI Tools", icon: Bot, permission: null, badge: "NEW" },
      { href: "/dashboard/walkin", label: "Self Check-in", icon: Sparkles, permission: null, badge: "NEW" },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/dashboard/staff", label: "Staff", icon: UserCog, permission: "staff.read" },
      { href: "/dashboard/settings", label: "Settings", icon: Settings, permission: null },
    ],
  },
];

const sidebarVariants = {
  hidden: { x: "-100%", opacity: 1 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 320,
      damping: 32,
      mass: 0.9,
    },
  },
  exit: {
    x: "-100%",
    opacity: 1,
    transition: {
      duration: 0.22,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.04 + i * 0.02,
      duration: 0.22,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

function getBadgeClass(badge?: string) {
  if (badge === "AI") return "bg-violet-100 text-violet-700 border border-violet-200";
  if (badge === "NEW") return "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-sm";
  return "bg-slate-100 text-slate-700";
}

export function Sidebar() {
  const pathname = usePathname();
  const { staff, tenant, logout, hasPermission } = useAuth();
  const sidebarOpen = useUIStore((s: any) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s: any) => s.setSidebarOpen);

  useEffect(() => {
    const syncSidebarState = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    syncSidebarState();
    window.addEventListener("resize", syncSidebarState);
    return () => window.removeEventListener("resize", syncSidebarState);
  }, [setSidebarOpen]);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname, setSidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen, setSidebarOpen]);

  const filteredSections = NAV_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.feature && !tenant?.features?.[item.feature]) return false;
        if (item.permission && !hasPermission(item.permission)) return false;
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const closeMobileSidebar = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const sidebarBody = (
    <motion.aside
      key="sidebar"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-y-0 left-0 z-50 flex h-dvh w-[292px] max-w-[86vw] flex-col border-r border-orange-100/80 bg-white/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.18)] lg:w-72 lg:max-w-none lg:border-r lg:bg-white lg:shadow-none"
    >
      <div className="relative flex h-16 flex-shrink-0 items-center justify-between border-b border-orange-100/80 px-6">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/60 to-transparent" />

          <div className="flex min-w-0 items-center p-2">
            <div className="relative h-16 w-[240px] flex-shrink-0 overflow-hidden rounded-xl bg-white px-2 py-1 ring-1 ring-orange-100 shadow-[0_8px_24px_rgba(249,115,22,0.12)]">
              <Image
                src="/logo.png"
                alt="HoteloS logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

            <motion.button
              type="button"
              onClick={closeMobileSidebar}
              whileTap={{ scale: 0.94 }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-orange-100 bg-white text-slate-500 shadow-sm transition-colors hover:bg-orange-50 hover:text-orange-600 lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </motion.button>
      </div>

      {tenant?.subscription?.status === "trial" && (tenant?.trialDaysLeft ?? 0) <= 14 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.25 }}
          className="mx-3 mt-3 flex-shrink-0 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-3 shadow-sm"
        >
          <p className="text-xs font-bold text-amber-700">
            ⏳ {tenant.trialDaysLeft} days left in trial
          </p>
          <Link
            href="/dashboard/settings"
            onClick={closeMobileSidebar}
            className="mt-1 inline-block text-xs font-semibold text-amber-600 hover:underline"
          >
            Upgrade plan →
          </Link>
        </motion.div>
      )}

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {filteredSections.map((section, sectionIndex) => (
          <div key={section.label}>
            <motion.p
              custom={sectionIndex}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400"
            >
              {section.label}
            </motion.p>

            <div className="space-y-1">
              {section.items.map((item, itemIndex) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                const order = sectionIndex * 10 + itemIndex;

                return (
                  <motion.div
                    key={item.href}
                    custom={order}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Link
                      href={item.href}
                      onClick={closeMobileSidebar}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-gradient-to-r from-orange-50 via-rose-50 to-pink-50 text-pink-700 ring-1 ring-orange-100 shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="sidebar-active-pill"
                          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-50 via-rose-50 to-pink-50"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}

                      <div
                        className={cn(
                          "relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl transition-all duration-200",
                          active
                            ? "bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-[0_10px_24px_rgba(244,63,94,0.22)]"
                            : "bg-slate-100 text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <span className="relative z-10 flex-1 truncate">{item.label}</span>

                      {item.badge && (
                        <span
                          className={cn(
                            "relative z-10 flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black",
                            getBadgeClass(item.badge)
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-orange-100/80 p-3 flex-shrink-0 bg-gradient-to-t from-orange-50/30 to-transparent">
        <div className="flex items-center gap-3 rounded-2xl border border-transparent px-2 py-2 transition-colors hover:border-orange-100 hover:bg-orange-50/80">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-bold text-white shadow-sm">
            {staff?.name?.charAt(0).toUpperCase() || "?"}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{staff?.name}</p>
            <p className="text-[11px] capitalize font-medium text-slate-400">
              {staff?.role?.replace(/_/g, " ")}
            </p>
          </div>

          <motion.button
            type="button"
            onClick={logout}
            whileTap={{ scale: 0.94 }}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );

  return (
    <>
      <div className="hidden lg:block">{sidebarBody}</div>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.button
              key="sidebar-overlay"
              type="button"
              aria-label="Close sidebar overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[2px] lg:hidden"
              onClick={closeMobileSidebar}
            />
            <div className="lg:hidden">{sidebarBody}</div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}