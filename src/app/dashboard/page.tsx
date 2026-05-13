'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, Badge, PageLoader } from '@/components/ui';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { OccupancyGauge, RoomStatusGrid } from '@/components/charts/OccupancyGauge';
import { ArrivalsTable } from '@/components/dashboard/ArrivalsTable';
import { useSocketEvent } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  BedDouble, Users, TrendingUp, DollarSign, ClipboardList,
  ArrowRight, Utensils, KeyRound, CalendarCheck, Wrench,
  Package, UserCheck, Star, Bell, ChevronRight,
  Activity, Coffee, Wallet,
} from 'lucide-react';
import Link from 'next/link';

// ── Quick-action tile data ────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'New Reservation', icon: CalendarCheck, href: '/dashboard/reservations/new',  color: '#3b82f6', bg: '#eff6ff' },
  { label: 'Check In',        icon: KeyRound,       href: '/dashboard/checkin',            color: '#10b981', bg: '#ecfdf5' },
  { label: 'Check Out',       icon: UserCheck,      href: '/dashboard/checkin?tab=out',    color: '#f59e0b', bg: '#fffbeb' },
  { label: 'Restaurant',      icon: Utensils,       href: '/dashboard/restaurant',         color: '#f97316', bg: '#fff7ed' },
  { label: 'Housekeeping',    icon: Wrench,         href: '/dashboard/housekeeping',       color: '#8b5cf6', bg: '#f5f3ff' },
  { label: 'Inventory',       icon: Package,        href: '/dashboard/inventory',          color: '#06b6d4', bg: '#ecfeff' },
  { label: 'Room Service',    icon: Coffee,         href: '/dashboard/restaurant',         color: '#ec4899', bg: '#fdf2f8' },
  { label: 'Billing',         icon: Wallet,         href: '/dashboard/billing',            color: '#64748b', bg: '#f8fafc' },
];

export default function DashboardPage() {
  const { staff, tenant } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/reports/dashboard').then(r => r.data.data),
    refetchInterval: 60_000,
  });

  useSocketEvent('reservation:checkin',  () => qc.invalidateQueries({ queryKey: ['dashboard'] }));
  useSocketEvent('reservation:checkout', () => qc.invalidateQueries({ queryKey: ['dashboard'] }));
  useSocketEvent('reservation:created',  () => qc.invalidateQueries({ queryKey: ['dashboard'] }));

  if (isLoading) return <DashboardLayout title="Dashboard"><PageLoader /></DashboardLayout>;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6 pb-8">

        {/* ── HERO HEADER ─────────────────────────────────────────────────── */}
        <div
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden px-5 py-6 sm:px-8 sm:py-8 text-white"
          style={{ background: "linear-gradient(135deg, #F97316 0%, #F43F5E 100%)" }}
        >
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -top-8 -right-8 h-40 w-40 rounded-full opacity-20"
            style={{ background: "rgba(255,255,255,0.3)" }} />
          <div className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full opacity-10"
            style={{ background: "rgba(255,255,255,0.4)" }} />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest opacity-75 mb-1">
                {formatDate(new Date(), 'EEEE, dd MMM yyyy')}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                {greeting}, {staff?.name?.split(' ')[0]} 👋
              </h1>
              <p className="mt-1 text-sm opacity-80">{tenant?.hotelName}</p>
            </div>

            {/* Live occupancy pill */}
            <div
              className="flex-shrink-0 flex items-center gap-3 rounded-2xl px-4 py-3 sm:self-start"
              style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}
            >
              <div className="text-center">
                <p className="text-2xl font-bold">{data?.occupancyPct || 0}%</p>
                <p className="text-xs opacity-75">Occupancy</p>
              </div>
              <div className="w-px h-10 opacity-30" style={{ background: "#fff" }} />
              <div className="text-center">
                <p className="text-2xl font-bold">{data?.occupied || 0}</p>
                <p className="text-xs opacity-75">Occupied</p>
              </div>
              <div className="w-px h-10 opacity-30" style={{ background: "#fff" }} />
              <div className="text-center">
                <p className="text-2xl font-bold">{data?.vacant || 0}</p>
                <p className="text-xs opacity-75">Vacant</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI STAT CARDS ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              label: 'Revenue Today',
              value: formatCurrency(data?.revenueToday || 0),
              sub: 'Total collected',
              icon: DollarSign,
              iconColor: '#f97316',
              iconBg: '#fff7ed',
              accent: '#f97316',
            },
            {
              label: 'Arrivals Today',
              value: data?.arrivalsToday || 0,
              sub: 'Expected check-ins',
              icon: UserCheck,
              iconColor: '#10b981',
              iconBg: '#ecfdf5',
              accent: '#10b981',
            },
            {
              label: 'Departures',
              value: data?.departuresToday || 0,
              sub: 'Check-outs due',
              icon: TrendingUp,
              iconColor: '#3b82f6',
              iconBg: '#eff6ff',
              accent: '#3b82f6',
            },
            {
              label: 'Total Rooms',
              value: data?.totalRooms || 0,
              sub: `${data?.occupied || 0} occupied`,
              icon: BedDouble,
              iconColor: '#8b5cf6',
              iconBg: '#f5f3ff',
              accent: '#8b5cf6',
            },
          ].map(stat => (
            <div
              key={stat.label}
              className="relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm overflow-hidden"
            >
              {/* Accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                style={{ background: stat.accent }}
              />
              <div className="flex items-start justify-between gap-2">
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: stat.iconBg, color: stat.iconColor }}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <Activity className="h-3.5 w-3.5 text-gray-300 mt-1" />
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">{stat.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ── QUICK ACTIONS ────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
            {QUICK_ACTIONS.map(action => (
              <Link key={action.label} href={action.href}>
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm hover:shadow-md hover:border-orange-200 transition-all cursor-pointer group">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                    style={{ background: action.bg, color: action.color }}
                  >
                    <action.icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-gray-600 text-center leading-tight">{action.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── CHARTS ROW ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div>
                <h3 className="font-bold text-gray-900">Revenue</h3>
                <p className="text-xs text-gray-400 mt-0.5">Last 7 days</p>
              </div>
              <Link href="/dashboard/revenue"
                className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                Full report <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="p-4">
              <RevenueChart data={data?.revenueChart || []} />
            </div>
          </div>

          {/* Occupancy Gauge */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div>
                <h3 className="font-bold text-gray-900">Occupancy</h3>
                <p className="text-xs text-gray-400 mt-0.5">Live status</p>
              </div>
              <span
                className="text-xs font-bold px-2 py-1 rounded-full"
                style={{
                  background: (data?.occupancyPct || 0) >= 80 ? '#fef2f2' : '#f0fdf4',
                  color: (data?.occupancyPct || 0) >= 80 ? '#dc2626' : '#16a34a',
                }}
              >
                {(data?.occupancyPct || 0) >= 80 ? 'High' : 'Normal'}
              </span>
            </div>
            <div className="p-4">
              <OccupancyGauge value={data?.occupancyPct || 0} />
              <div className="grid grid-cols-2 gap-2 mt-4">
                {[
                  { label: 'Occupied', value: data?.occupied || 0,  color: '#3b82f6', bg: '#eff6ff' },
                  { label: 'Vacant',   value: data?.vacant   || 0,  color: '#10b981', bg: '#ecfdf5' },
                  { label: 'Dirty',    value: data?.dirty    || 0,  color: '#f59e0b', bg: '#fffbeb' },
                  { label: 'Out of Order', value: data?.outOfOrder || 0, color: '#ef4444', bg: '#fef2f2' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ background: s.bg }}>
                    <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── ROOM STATUS + ARRIVALS ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Room Status */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div>
                <h3 className="font-bold text-gray-900">Room Status</h3>
                <p className="text-xs text-gray-400 mt-0.5">Live floor view</p>
              </div>
              <Link href="/dashboard/rooms"
                className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                Manage <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="p-3">
              <RoomStatusGrid />
            </div>
          </div>

          {/* Today's Arrivals */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div>
                <h3 className="font-bold text-gray-900">Today's Arrivals</h3>
                <p className="text-xs text-gray-400 mt-0.5">Guests checking in</p>
              </div>
              <span
                className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg,#F97316,#F43F5E)" }}
              >
                {data?.arrivalsToday || 0}
              </span>
            </div>
            <ArrivalsTable />
          </div>
        </div>

        {/* ── SERVICE SHORTCUTS ────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Hotel Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            {/* Restaurant */}
            <Link href="/dashboard/restaurant">
              <div className="group relative rounded-2xl overflow-hidden border border-orange-100 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="h-2 w-full" style={{ background: "linear-gradient(90deg,#F97316,#F43F5E)" }} />
                <div className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#fff7ed", color: "#f97316" }}>
                    <Utensils className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">Restaurant</p>
                    <p className="text-xs text-gray-400 mt-0.5">Orders · Menu · Kitchen</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
                </div>
              </div>
            </Link>

            {/* Housekeeping */}
            <Link href="/dashboard/housekeeping">
              <div className="group relative rounded-2xl overflow-hidden border border-purple-100 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="h-2 w-full" style={{ background: "linear-gradient(90deg,#8b5cf6,#6366f1)" }} />
                <div className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#f5f3ff", color: "#8b5cf6" }}>
                    <Wrench className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">Housekeeping</p>
                    <p className="text-xs text-gray-400 mt-0.5">Tasks · Room status</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-purple-400 transition-colors" />
                </div>
              </div>
            </Link>

            {/* Notifications */}
            <Link href="/dashboard/notifications">
              <div className="group relative rounded-2xl overflow-hidden border border-blue-100 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="h-2 w-full" style={{ background: "linear-gradient(90deg,#3b82f6,#06b6d4)" }} />
                <div className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#eff6ff", color: "#3b82f6" }}>
                    <Bell className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">Notifications</p>
                    <p className="text-xs text-gray-400 mt-0.5">Alerts · Updates</p>
                  </div>
                  {(data?.unreadNotifications || 0) > 0 && (
                    <span className="flex-shrink-0 h-5 min-w-5 px-1 rounded-full text-xs font-bold text-white flex items-center justify-center"
                      style={{ background: "#ef4444" }}>
                      {data?.unreadNotifications}
                    </span>
                  )}
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            </Link>

            {/* Loyalty */}
            <Link href="/dashboard/loyalty">
              <div className="group relative rounded-2xl overflow-hidden border border-yellow-100 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="h-2 w-full" style={{ background: "linear-gradient(90deg,#f59e0b,#fbbf24)" }} />
                <div className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#fffbeb", color: "#f59e0b" }}>
                    <Star className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">Loyalty</p>
                    <p className="text-xs text-gray-400 mt-0.5">Points · Members · Rewards</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-yellow-400 transition-colors" />
                </div>
              </div>
            </Link>

            {/* Inventory */}
            <Link href="/dashboard/inventory">
              <div className="group relative rounded-2xl overflow-hidden border border-cyan-100 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="h-2 w-full" style={{ background: "linear-gradient(90deg,#06b6d4,#0891b2)" }} />
                <div className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#ecfeff", color: "#06b6d4" }}>
                    <Package className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">Inventory</p>
                    <p className="text-xs text-gray-400 mt-0.5">Stock · Supplies</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-cyan-400 transition-colors" />
                </div>
              </div>
            </Link>

            {/* Reports */}
            <Link href="/dashboard/reports">
              <div className="group relative rounded-2xl overflow-hidden border border-green-100 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="h-2 w-full" style={{ background: "linear-gradient(90deg,#10b981,#059669)" }} />
                <div className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#ecfdf5", color: "#10b981" }}>
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">Reports</p>
                    <p className="text-xs text-gray-400 mt-0.5">Analytics · Exports</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-green-400 transition-colors" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* ── OUTSTANDING BALANCE BANNER ───────────────────────────────────── */}
        {(data?.pendingBalance || 0) > 0 && (
          <div
            className="rounded-2xl border border-amber-200 px-5 py-4 flex items-center justify-between gap-4"
            style={{ background: "linear-gradient(135deg,#fffbeb,#fef3c7)" }}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#fef9c3", color: "#d97706" }}>
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-amber-900 text-sm">Outstanding Balance</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {formatCurrency(data?.pendingBalance || 0)} across unsettled folios
                </p>
              </div>
            </div>
            <Link href="/dashboard/billing">
              <button
                className="flex-shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all"
                style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)" }}
              >
                View Billing <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}