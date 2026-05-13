'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/auth.store';
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
  CreditCard,
  Star,
  LogOut,
  X,
  Zap,
  Sparkles,
  Home,
  TrendingUp,
  UserCog,
  ShieldCheck,
  Building2,
  CalendarRange,
} from 'lucide-react';

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
    label: 'Front Desk',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: null },
      { href: '/dashboard/checkin', label: 'Check-in', icon: ClipboardList, permission: 'checkin.read' },
      { href: '/dashboard/reservations', label: 'Reservations', icon: CalendarDays, permission: 'reservations.read' },
      { href: '/dashboard/guests', label: 'Guests', icon: Users, permission: 'guests.read' },
    ],
  },
  {
    label: 'Hotel',
    items: [
      { href: '/dashboard/rooms', label: 'Rooms', icon: BedDouble, permission: 'rooms.read' },
      { href: '/dashboard/rate-calendar', label: 'Rate Calendar', icon: CalendarRange, permission: 'rates.read' },
      { href: '/dashboard/housekeeping', label: 'Housekeeping', icon: Home, permission: 'housekeeping.read' },
      { href: '/dashboard/maintenance', label: 'Maintenance', icon: Wrench, permission: null },
      { href: '/dashboard/restaurant', label: 'Restaurant', icon: ChefHat, permission: null },
      { href: '/dashboard/inventory', label: 'Inventory', icon: Building2, permission: null },
      { href: '/dashboard/roomqr', label: 'Room QR Codes', icon: ShieldCheck, permission: null, badge: 'NEW' },
      {
        href: '/dashboard/channel-manager',
        label: 'Channel Manager',
        icon: Home,
        permission: 'channel_manager.read',
        badge: 'NEW',
        feature: 'channel_manager',
      },
      { href: '/dashboard/banquet-management', label: 'Banquet Management', icon: CalendarRange, permission: null, badge: 'NEW' },
      { href: '/dashboard/audit', label: 'Audit Logs', icon: ClipboardList, permission: 'audits.read' },
      { href: '/dashboard/attendance', label: 'Staff Attendance', icon: CalendarDays, permission: 'attendance.read' },
      { href: '/dashboard/guest-operations', label: 'Guest Chat', icon: CalendarDays, permission: 'attendance.read' },
      // {
      //   href: '/dashboard/express-checkout',
      //   label: 'Express Checkout',
      //   icon: CreditCard,
      //   permission: 'checkin.read',
      //   badge: 'NEW',
      // },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/dashboard/billing', label: 'Billing & Folios', icon: Receipt, permission: 'folios.read' },
      { href: '/dashboard/revenue', label: 'Revenue AI', icon: TrendingUp, permission: 'reports.read', badge: 'AI' },
      { href: '/dashboard/reports', label: 'Reports', icon: BarChart3, permission: 'reports.read' },
      { href: '/dashboard/reports/gst', label: 'GST Export', icon: Receipt, permission: 'reports.read', badge: 'NEW' },
    ],
  },
  {
    label: 'Engagement',
    items: [
      { href: '/dashboard/notifications', label: 'Notifications', icon: Bell, permission: 'notifications.read' },
      { href: '/dashboard/loyalty', label: 'Loyalty', icon: Star, permission: 'loyalty.read' },
      { href: '/dashboard/aifeatures', label: 'AI Tools', icon: Bot, permission: null, badge: 'NEW' },
      { href: '/dashboard/walkin', label: 'Self Check-in', icon: Sparkles, permission: null, badge: 'NEW' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { href: '/dashboard/staff', label: 'Staff', icon: UserCog, permission: 'staff.read' },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings, permission: null },
    ],
  },
];

function getBadgeClass(badge?: string) {
  if (badge === 'AI') return 'bg-violet-100 text-violet-700 border border-violet-200';
  if (badge === 'NEW') return 'bg-gradient-to-r from-orange-500 to-pink-500 text-white';
  return 'bg-slate-100 text-slate-700';
}

export function Sidebar() {
  const pathname = usePathname();
  const { staff, tenant, logout, hasPermission } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

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
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/45 backdrop-blur-[1px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-30 flex h-full w-72 flex-col border-r border-orange-100 bg-white transition-transform duration-300',
          !sidebarOpen && '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-orange-100 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 shadow-sm">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-none text-slate-900">HotelOS</p>
              <p className="mt-0.5 max-w-[150px] truncate text-[11px] text-slate-400">
                {tenant?.hotelName || 'Loading...'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-orange-50 hover:text-slate-700 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {tenant?.subscription?.status === 'trial' && (tenant?.trialDaysLeft ?? 0) <= 14 && (
          <div className="mx-3 mt-3 flex-shrink-0 rounded-2xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-700">
              ⏳ {tenant.trialDaysLeft} days left in trial
            </p>
            <Link
              href="/dashboard/settings"
              className="mt-1 inline-block text-xs font-medium text-amber-600 hover:underline"
            >
              Upgrade plan →
            </Link>
          </div>
        )}

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {filteredSections.map((section) => (
            <div key={section.label}>
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {section.label}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                      }}
                      className={cn(
                        'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all',
                        active
                          ? 'bg-gradient-to-r from-orange-50 to-pink-50 text-pink-700 shadow-sm ring-1 ring-orange-100'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-all',
                          active
                            ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <span className="flex-1 truncate">{item.label}</span>

                      {item.badge && (
                        <span
                          className={cn(
                            'flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                            getBadgeClass(item.badge),
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-orange-100 p-3 flex-shrink-0">
          <div className="flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-orange-50">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
              {staff?.name?.charAt(0).toUpperCase() || '?'}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{staff?.name}</p>
              <p className="text-[11px] capitalize text-slate-400">
                {staff?.role?.replace(/_/g, ' ')}
              </p>
            </div>

            <button
              onClick={logout}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}