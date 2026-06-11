'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageLoader } from '@/components/ui';
import api from '@/lib/api';
import { formatCurrency, formatDate, RESERVATION_STATUS_COLORS } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  Plus, Search, Calendar, Home, LogIn, LogOut,
  ChevronLeft, ChevronRight, Bed, Moon, AlertTriangle,
  Clock, CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

const FILTERS = [
  { label: 'All',          value: '',            icon: null },
  { label: 'Confirmed',    value: 'confirmed',   icon: '✅' },
  { label: 'In-House',     value: 'checked_in',  icon: '🏠' },
  { label: 'Checked Out',  value: 'checked_out', icon: '🏁' },
  { label: 'Cancelled',    value: 'cancelled',   icon: '❌' },
];

const MEAL_PLAN_LABELS: Record<string, string> = {
  room_only:  'RO',
  cp:         'CP',
  map:        'MAP',
  ap:         'AP',
  ep:         'EP',
};

const MEAL_PLAN_COLORS: Record<string, string> = {
  room_only: 'bg-gray-100 text-gray-600',
  cp:        'bg-blue-50 text-blue-700',
  map:       'bg-purple-50 text-purple-700',
  ap:        'bg-green-50 text-green-700',
  ep:        'bg-orange-50 text-orange-700',
};

const LOYALTY_COLORS: Record<string, string> = {
  bronze:   'bg-amber-50  text-amber-700',
  silver:   'bg-gray-100  text-gray-600',
  gold:     'bg-yellow-50 text-yellow-700',
  platinum: 'bg-indigo-50 text-indigo-700',
};

// ── Days-Staying helper ──────────────────────────────────────────────────────
function getDaysStaying(r: any): { label: string; colorClass: string; icon: React.ReactNode } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkIn  = new Date(r.checkIn);
  const checkOut = new Date(r.checkOut);
  checkIn.setHours(0, 0, 0, 0);
  checkOut.setHours(0, 0, 0, 0);

  if (r.status === 'checked_out') {
    return {
      label: `${r.nights}N stayed`,
      colorClass: 'bg-gray-100 text-gray-500',
      icon: <CheckCircle className="w-3 h-3" />,
    };
  }

  if (r.status === 'cancelled') {
    return {
      label: `${r.nights}N (cancelled)`,
      colorClass: 'bg-red-50 text-red-400 line-through',
      icon: <Moon className="w-3 h-3" />,
    };
  }

  if (r.status === 'confirmed') {
    const daysUntil = Math.round((checkIn.getTime() - today.getTime()) / 86_400_000);
    return {
      label: daysUntil === 0 ? 'Arrives today' : `Arrives in ${daysUntil}d`,
      colorClass: 'bg-blue-50 text-blue-700',
      icon: <Calendar className="w-3 h-3" />,
    };
  }

  // checked_in
  const daysIn   = Math.round((today.getTime() - checkIn.getTime()) / 86_400_000);
  const daysLeft = Math.round((checkOut.getTime() - today.getTime()) / 86_400_000);

  if (daysLeft < 0) {
    return {
      label: `Overstay +${Math.abs(daysLeft)}d`,
      colorClass: 'bg-rose-50 text-rose-700 font-semibold',
      icon: <AlertTriangle className="w-3 h-3" />,
    };
  }
  if (daysLeft === 0) {
    return {
      label: `Day ${daysIn + 1} · CO Today`,
      colorClass: 'bg-orange-50 text-orange-700 font-semibold',
      icon: <LogOut className="w-3 h-3" />,
    };
  }
  return {
    label: `Day ${daysIn + 1} · ${daysLeft}d left`,
    colorClass: daysLeft === 1 ? 'bg-orange-50 text-orange-700' : 'bg-sky-50 text-sky-700',
    icon: <Clock className="w-3 h-3" />,
  };
}

export default function ReservationsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page,   setPage]   = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', search, status, page],
    queryFn: () =>
      api.get('/api/reservations', {
        params: { search, status: status || undefined, page, limit: 25 },
      }).then(r => r.data.data),
    placeholderData: p => p,
  });

  const { data: arrivalsData } = useQuery({
    queryKey: ['arrivals-today'],
    queryFn: () => api.get('/api/reservations/arrivals-today').then(r => r.data.data),
    staleTime: 60_000,
  });
  const { data: departuresData } = useQuery({
    queryKey: ['departures-today'],
    queryFn: () => api.get('/api/reservations/departures-today').then(r => r.data.data),
    staleTime: 60_000,
  });
  const { data: inHouseData } = useQuery({
    queryKey: ['in-house'],
    queryFn: () => api.get('/api/reservations/in-house').then(r => r.data.data),
    staleTime: 60_000,
  });

  return (
    <DashboardLayout title="Reservations">
      <div className="space-y-5 max-w-7xl pb-10">

        {/* ── Hero Banner ──────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl px-5 py-6 sm:px-8 sm:py-7 text-white"
          style={{ background: 'linear-gradient(135deg,#F97316 0%,#F43F5E 100%)' }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-20"
            style={{ background: 'rgba(255,255,255,0.3)' }} />
          <div className="pointer-events-none absolute -bottom-6 left-24 h-28 w-28 rounded-full opacity-10"
            style={{ background: 'rgba(255,255,255,0.5)' }} />

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                  Reservations
                </span>
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl">Reservation Manager</h1>
              <p className="mt-1 text-sm opacity-80">{data?.totalDocs || 0} total reservations</p>
            </div>

            <div className="flex gap-3 flex-wrap">
              {[
                { label: 'Arrivals',   count: arrivalsData?.length   || 0, icon: <LogIn  className="w-3.5 h-3.5" />, color: 'rgba(134,239,172,0.25)' },
                { label: 'Departures', count: departuresData?.length || 0, icon: <LogOut className="w-3.5 h-3.5" />, color: 'rgba(253,186,116,0.25)' },
                { label: 'In-House',   count: inHouseData?.length    || 0, icon: <Home   className="w-3.5 h-3.5" />, color: 'rgba(147,197,253,0.25)' },
              ].map(s => (
                <div key={s.label}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
                  style={{ background: s.color, border: '1px solid rgba(255,255,255,0.2)' }}>
                  {s.icon}
                  <div>
                    <p className="text-lg font-bold leading-none">{s.count}</p>
                    <p className="text-xs opacity-75 leading-tight">{s.label} today</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/dashboard/reservations/new">
              <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}
              >
                <Plus className="w-4 h-4" /> New Reservation
              </button>
            </Link>
          </div>
        </div>

        {/* ── Quick-view Today tabs ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickViewCard
            title="Arrivals Today"
            icon={<LogIn className="w-4 h-4 text-green-600" />}
            iconBg="linear-gradient(135deg,#f0fdf4,#dcfce7)"
            items={arrivalsData || []}
            emptyText="No arrivals today"
            router={router}
            renderItem={(r: any) => (
              <div key={r._id}
                onClick={() => router.push(`/dashboard/reservations/${r._id}`)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-green-50/50 cursor-pointer transition-colors border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                  {r.guestId?.firstName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {r.guestId?.firstName} {r.guestId?.lastName}
                  </p>
                  <p className="text-xs text-gray-400">Room {r.roomNumber}</p>
                </div>
                {!r.guestId?.idVerified && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700">
                    ID Pending
                  </span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              </div>
            )}
          />

          <QuickViewCard
            title="Departures Today"
            icon={<LogOut className="w-4 h-4 text-orange-600" />}
            iconBg="linear-gradient(135deg,#fff7ed,#fed7aa)"
            items={departuresData || []}
            emptyText="No departures today"
            router={router}
            renderItem={(r: any) => (
              <div key={r._id}
                onClick={() => router.push(`/dashboard/reservations/${r._id}`)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50/50 cursor-pointer transition-colors border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#c2410c,#9f1239)' }}>
                  {r.guestId?.firstName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {r.guestId?.firstName} {r.guestId?.lastName}
                  </p>
                  <p className="text-xs text-gray-400">Room {r.roomNumber}</p>
                </div>
                {r.folioId?.balance > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600">
                    ₹{r.folioId.balance} due
                  </span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              </div>
            )}
          />

          <QuickViewCard
            title="In-House Now"
            icon={<Home className="w-4 h-4 text-blue-600" />}
            iconBg="linear-gradient(135deg,#eff6ff,#dbeafe)"
            items={(inHouseData || []).slice(0, 5)}
            emptyText="No guests in-house"
            router={router}
            renderItem={(r: any) => {
              const stay = getDaysStaying(r);
              return (
                <div key={r._id}
                  onClick={() => router.push(`/dashboard/reservations/${r._id}`)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50/50 cursor-pointer transition-colors border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                    {r.guestId?.firstName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {r.guestId?.firstName} {r.guestId?.lastName}
                    </p>
                    <p className="text-xs text-gray-400">Room {r.roomNumber}</p>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1', stay.colorClass)}>
                    {stay.icon}{stay.label}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                </div>
              );
            }}
          />
        </div>

        {/* ── Main table card ──────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

          {/* Filters + search */}
          <div className="border-b border-gray-100 px-4 py-4 space-y-3" style={{ background: '#fafafa' }}>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(f => (
                <button key={f.value}
                  onClick={() => { setStatus(f.value); setPage(1); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  style={
                    status === f.value
                      ? { background: 'linear-gradient(135deg,#c2410c,#9f1239)', color: '#fff', boxShadow: '0 2px 8px rgba(194,65,12,0.3)' }
                      : { background: '#fff', border: '1px solid #e5e7eb', color: '#4b5563' }
                  }
                >
                  {f.icon && <span>{f.icon}</span>} {f.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                placeholder="Search by guest name, booking ref, room..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <PageLoader />
          ) : !data?.docs?.length ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-orange-50">
                <Bed className="w-7 h-7 text-orange-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">No reservations found</p>
              <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
              <Link href="/dashboard/reservations/new">
                <button className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#c2410c,#9f1239)' }}>
                  <Plus className="w-3.5 h-3.5" /> New Reservation
                </button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto border border-orange-100/60 shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #fff7f0 0%, #fff0f6 100%)' }}>
                    {[
                      'Guest', 'Booking Ref', 'Room', 'Check-in', 'Check-out',
                      'Nights', 'Days Staying', 'Meal Plan', 'Amount', 'Payment', 'Status',
                    ].map(h => (
                      <th key={h}
                        className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3.5 border-b border-orange-100/80 whitespace-nowrap"
                        style={{ color: '#c2410c' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {data.docs.map((r: any) => {
                    const stay = getDaysStaying(r);
                    const mealLabel = MEAL_PLAN_LABELS[r.mealPlan] || r.mealPlan?.toUpperCase() || '—';
                    const mealColor = MEAL_PLAN_COLORS[r.mealPlan] || 'bg-gray-100 text-gray-500';
                    const loyaltyTier = r.guestId?.loyalty?.tier || 'bronze';
                    const loyaltyColor = LOYALTY_COLORS[loyaltyTier] || LOYALTY_COLORS.bronze;

                    const isPaid    = r.paymentStatus === 'paid';
                    const isPartial = r.paymentStatus === 'partial';
                    const balanceDue = r.balanceDue ?? r.folioId?.balance ?? 0;

                    // Pick a gradient per guest initial for variety
                    const gradients = [
                      'linear-gradient(135deg, #f97316, #ec4899)',
                      'linear-gradient(135deg, #fb923c, #f43f5e)',
                      'linear-gradient(135deg, #f59e0b, #ef4444)',
                      'linear-gradient(135deg, #e879f9, #f97316)',
                      'linear-gradient(135deg, #a78bfa, #ec4899)',
                    ];
                    const gradientIndex = (r.guestId?.firstName?.charCodeAt(0) || 0) % gradients.length;

                    return (
                      <tr key={r._id}
                        onClick={() => router.push(`/dashboard/reservations/${r._id}`)}
                        className="cursor-pointer transition-all duration-150 group"
                        style={{ background: 'white' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'linear-gradient(135deg, #fff7f0 0%, #fff0f6 100%)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'white')}>

                        {/* Guest */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm"
                              style={{ background: gradients[gradientIndex] }}>
                              {r.guestId?.firstName?.[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-semibold text-gray-800">
                                  {r.guestId?.firstName} {r.guestId?.lastName}
                                </p>
                                {r.guestId?.isVip && (
                                  <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                                    style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#92400e' }}>
                                    VIP
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <p className="text-xs text-gray-400">{r.guestId?.phone}</p>
                                <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium capitalize', loyaltyColor)}>
                                  {loyaltyTier}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Booking Ref */}
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs px-2.5 py-1 rounded-lg font-semibold"
                            style={{ background: 'linear-gradient(135deg, #fff1f2, #fce7f3)', color: '#be185d' }}>
                            {r.bookingRef}
                          </span>
                        </td>

                        {/* Room */}
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-bold text-gray-800">{r.roomNumber}</p>
                          <p className="text-xs text-gray-400 capitalize">{r.roomId?.type} · {r.roomId?.view}</p>
                        </td>

                        {/* Check-in */}
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-600 whitespace-nowrap bg-orange-50 px-2 py-0.5 rounded-md">
                            {formatDate(r.checkIn)}
                          </span>
                        </td>

                        {/* Check-out */}
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-600 whitespace-nowrap bg-pink-50 px-2 py-0.5 rounded-md">
                            {formatDate(r.checkOut)}
                          </span>
                        </td>

                        {/* Nights */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                            style={{ background: 'linear-gradient(135deg, #fff7ed, #fce7f3)', color: '#c2410c' }}>
                            <Moon className="w-3 h-3" /> {r.nights}N
                          </span>
                        </td>

                        {/* Days Staying */}
                        <td className="px-4 py-3.5">
                          <span className={cn(
                            'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full whitespace-nowrap text-red-500',
                            stay.colorClass,
                          )}>
                            {stay.icon}
                            {stay.label}
                          </span>
                        </td>

                        {/* Meal Plan */}
                        <td className="px-4 py-3.5">
                          <span className={cn('text-xs font-bold px-2.5 py-1 rounded-lg font-mono', mealColor)}>
                            {mealLabel}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-bold text-green-900">{formatCurrency(r.totalAmount)}</p>
                          {r.advancePaid > 0 && (
                            <p className="text-xs mt-0.5 font-medium"
                              style={{ color: '#16a34a' }}>
                              Adv: {formatCurrency(r.advancePaid)}
                            </p>
                          )}
                        </td>

                        {/* Payment */}
                        <td className="px-4 py-3.5">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{ background: 'linear-gradient(135deg, #dcfce7, #d1fae5)', color: '#15803d' }}>
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                              Paid
                            </span>
                          ) : isPartial ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{ background: 'linear-gradient(135deg, #e0f2fe, #dbeafe)', color: '#1d4ed8' }}>
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                              Partial
                            </span>
                          ) : balanceDue > 0 ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{ background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)', color: '#be123c' }}>
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                              ₹{balanceDue.toLocaleString('en-IN')} due
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{ background: 'linear-gradient(135deg, #fff7ed, #fef3c7)', color: '#b45309' }}>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 w-16 text-center">
                          <span className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-semibold capitalize',
                            RESERVATION_STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600',
                          )}>
                            {r.status?.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Page {page} of {data.totalPages} · {data.totalDocs} reservations
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <button
                  disabled={page === data.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ── Quick-view card helper ────────────────────────────────────────────────────
function QuickViewCard({ title, icon, iconBg, items, emptyText, renderItem }: {
  title: string; icon: React.ReactNode; iconBg: string;
  items: any[]; emptyText: string; router: any;
  renderItem: (item: any) => React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-50 px-4 py-3.5" style={{ background: '#fafafa' }}>
        <div className="w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ background: iconBg }}>
          {icon}
        </div>
        <p className="text-sm font-bold text-gray-900 flex-1">{title}</p>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">
          {items.length}
        </span>
      </div>
      {!items.length ? (
        <div className="flex items-center justify-center py-8 text-xs text-gray-400">{emptyText}</div>
      ) : (
        <div>{items.map(renderItem)}</div>
      )}
    </div>
  );
}