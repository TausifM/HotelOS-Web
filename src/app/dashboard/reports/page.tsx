// app/dashboard/reports/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Users,
  Shield,
  Download,
  Calendar,
  Building2,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Printer,
  Search,
  Star,
  Globe,
  RefreshCw,
  Hotel,
  BedDouble,
  Receipt,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: 'easeOut' as const },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const PIE_COLORS = ['#1B4FD8', '#059669', '#7C3AED', '#EA580C', '#0D9488', '#F59E0B', '#64748B'];

const DEPT_COLORS: Record<string, string> = {
  room: '#1B4FD8',
  fb: '#059669',
  spa: '#7C3AED',
  laundry: '#EA580C',
  transport: '#0D9488',
  misc: '#64748B',
  discount: '#DC2626',
};

const MODE_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  razorpay: 'Razorpay',
  net_banking: 'Net Banking',
  cheque: 'Cheque',
};

const COLOR_SETS = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-100 text-blue-600' },
  green: { bg: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-green-100 text-green-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100 text-amber-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', iconBg: 'bg-purple-100 text-purple-600' },
  red: { bg: 'bg-red-50', text: 'text-red-700', iconBg: 'bg-red-100 text-red-600' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', iconBg: 'bg-teal-100 text-teal-600' },
} as const;
type TenantAddress =
  | string
  | {
    line1?: string;
    line2?: string;
    area?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
    pincode?: string;
    zip?: string;
  }
  | undefined
  | null;

function formatAddress(address: TenantAddress) {
  if (!address) return '—';
  if (typeof address === 'string') return address.trim() || '—';

  return [
    address.line1,
    address.line2,
    address.area,
    address.city,
    address.district,
    address.state,
    address.country,
    address.pincode || address.zip,
  ]
    .filter(Boolean)
    .join(', ') || '—';
}

function getTenantHotelName(tenant: any) {
  return (
    tenant?.hotelName ||
    tenant?.name ||
    tenant?.legalName ||
    tenant?.brandName ||
    'Hotel PMS'
  );
}

function getTenantMeta(tenant: any) {
  return {
    hotelName: getTenantHotelName(tenant),
    legalName: tenant?.legalName || '',
    phone: tenant?.phone || '',
    email: tenant?.email || '',
    website: tenant?.website || '',
    gstin: tenant?.gstin || '',
    address: formatAddress(tenant?.address),
    logo: tenant?.logo || '',
  };
}
type ColorKey = keyof typeof COLOR_SETS;
type TabKey = 'dashboard' | 'dbr' | 'occupancy' | 'revenue' | 'guests' | 'police';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-3xl border border-slate-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}

function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4', className)}>
      {children}
    </div>
  );
}

function CardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const styles = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', styles[variant])}>
      {children}
    </span>
  );
}

function PageLoader() {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
    </div>
  );
}

function Spinner() {
  return <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />;
}

function DateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <Calendar className="h-4 w-4 flex-shrink-0 text-slate-400" />
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm text-slate-700 outline-none"
      />
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-slate-700">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === 'number' && p.value > 100 ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  colorKey = 'blue',
  icon: Icon,
}: {
  label: string;
  value: any;
  sub?: string;
  colorKey?: ColorKey;
  icon?: any;
}) {
  const c = COLOR_SETS[colorKey];

  return (
    <motion.div variants={fadeUp} className={`${c.bg} rounded-3xl border border-white/60 p-5 shadow-sm`}>
      {Icon && (
        <div className={`${c.iconBg} mb-3 flex h-10 w-10 items-center justify-center rounded-2xl`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className={`text-2xl font-bold leading-none tracking-tight ${c.text}`}>{value}</p>
      <p className="mt-1.5 text-xs font-semibold text-slate-600">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </motion.div>
  );
}

function SectionTitle({
  title,
  sub,
}: {
  title: string;
  sub?: string;
}) {
  return (
    <div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function doPrint({
  records,
  start,
  end,
  hotel,
}: {
  records: any[];
  start: string;
  end: string;
  hotel: {
    hotelName: string;
    legalName?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    gstin?: string;
    logo?: string;
  };
}) {
  if (!records.length) {
    toast.error('No records to print');
    return;
  }

  const rows = records
    .map(
      (r: any, i: number) => `
    <tr style="border-bottom:1px solid #e5e7eb;${!r.idVerified ? 'background:#fff5f5' : i % 2 === 0 ? 'background:#f8fafc' : ''}">
      <td style="padding:6px">${i + 1}</td>
      <td style="padding:6px;font-weight:600;white-space:nowrap">${r.guestName || '—'}</td>
      <td style="padding:6px;font-family:monospace">${r.dob || '—'}</td>
      <td style="padding:6px;text-transform:capitalize">${r.gender || '—'}</td>
      <td style="padding:6px">${r.nationality || '—'}</td>
      <td style="padding:6px;text-transform:capitalize">${(r.idType || '—').replace(/_/g, ' ')}</td>
      <td style="padding:6px;font-family:monospace">${r.idNumber || '—'}</td>
      <td style="padding:6px;font-family:monospace">${r.phone || '—'}</td>
      <td style="padding:6px;max-width:240px;line-height:1.35">${r.address || '—'}</td>
      <td style="padding:6px;text-align:center;font-weight:700">${r.roomNumber || '—'}</td>
      <td style="padding:6px;white-space:nowrap">${r.checkIn || '—'} ${r.checkInTime ? `<span style="color:#9ca3af">${r.checkInTime}</span>` : ''}</td>
      <td style="padding:6px;white-space:nowrap">${r.checkOut || 'In-house'}</td>
      <td style="padding:6px">${r.purposeOfVisit || 'Leisure'}</td>
      <td style="padding:6px;font-weight:700;color:${r.idVerified ? '#059669' : '#dc2626'}">
        ${r.idVerified ? 'Verified' : 'Pending'}
      </td>
    </tr>
  `,
    )
    .join('');

  const win = window.open('', '_blank', 'width=1400,height=900');
  if (!win) {
    toast.error('Allow pop-ups in browser settings');
    return;
  }

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Police Register - ${hotel.hotelName}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 10px; color: #111; padding: 12px 16px; }
          .hdr { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; margin-bottom:10px; }
          .hname { font-size:22px; font-weight:800; color:#1D4ED8; }
          .sub { font-size:10px; color:#6b7280; margin-top:3px; line-height:1.35; }
          .legal { background:#fff5f5; border:1px solid #fecaca; padding:8px 12px; border-radius:6px; margin-bottom:10px; font-size:9.5px; color:#b91c1c; }
          .summary { display:flex; gap:18px; margin-bottom:10px; flex-wrap:wrap; }
          .si { font-size:10px; color:#374151; }
          .si span { font-weight:700; color:#1D4ED8; }
          table { width:100%; border-collapse:collapse; }
          th { background:#1D4ED8; color:white; padding:6px 7px; text-align:left; font-size:8.5px; text-transform:uppercase; letter-spacing:.45px; }
          td { padding:5px 7px; vertical-align:top; }
          .footer { margin-top:20px; padding-top:10px; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; font-size:9px; color:#9ca3af; }
          .muted { color:#6b7280; }
          .right { text-align:right; }
          @page { size:A4 landscape; margin:8mm; }
        </style>
      </head>
      <body>
        <div class="hdr">
          <div>
            <div class="hname">${hotel.hotelName}</div>
            ${hotel.legalName ? `<div class="sub">${hotel.legalName}</div>` : ''}
            <div class="sub">GUEST REGISTER — FORM C</div>
            <div class="sub">Rule 14, Registration of Foreigners Rules 1992 | Hotel & Lodging Houses Act, India</div>
            ${hotel.address ? `<div class="sub"><strong>Address:</strong> ${hotel.address}</div>` : ''}
            <div class="sub">
              ${hotel.phone ? `<strong>Phone:</strong> ${hotel.phone}` : ''}
              ${hotel.email ? ` &nbsp; | &nbsp; <strong>Email:</strong> ${hotel.email}` : ''}
              ${hotel.website ? ` &nbsp; | &nbsp; <strong>Website:</strong> ${hotel.website}` : ''}
            </div>
            ${hotel.gstin ? `<div class="sub"><strong>GSTIN:</strong> ${hotel.gstin}</div>` : ''}
          </div>

          <div class="right" style="font-size:9px;color:#6b7280">
            <div>Period: <strong>${start}</strong> to <strong>${end}</strong></div>
            <div style="margin-top:4px">Generated: ${new Date().toLocaleString('en-IN')}</div>
            <div style="margin-top:4px">Total: <strong>${records.length}</strong> records</div>
          </div>
        </div>

        <div class="legal">
          CONFIDENTIAL — Submit to local police within 24 hrs of check-in. Foreign nationals mandatory within 24 hrs per Foreigners Act 1946.
        </div>

        <div class="summary">
          <div class="si">Total: <span>${records.length}</span></div>
          <div class="si">Verified: <span style="color:#059669">${records.filter((r: any) => r.idVerified).length}</span></div>
          <div class="si">Pending: <span style="color:#dc2626">${records.filter((r: any) => !r.idVerified).length}</span></div>
          <div class="si">Foreign: <span style="color:#7c3aed">${records.filter((r: any) => r.nationality !== 'Indian').length}</span></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Guest Name</th>
              <th>DOB</th>
              <th>Gender</th>
              <th>Nationality</th>
              <th>ID Type</th>
              <th>ID Number</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Room</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Purpose</th>
              <th>ID Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="footer">
          <span>Signature of Manager: ___________________________</span>
          <span>Hotel Stamp: __________________</span>
          <span>${hotel.hotelName}</span>
        </div>

        <script>setTimeout(() => window.print(), 400)<\/script>
      </body>
    </html>
  `);

  win.document.close();
}

export default function ReportsPage() {
  const today = new Date().toISOString().split('T')[0];
  const last7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const last30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [tab, setTab] = useState<TabKey>('dashboard');
  const [reportDate, setReportDate] = useState(today);
  const [startDate, setStartDate] = useState(last7);
  const [endDate, setEndDate] = useState(today);
  const [occStartDate, setOccStartDate] = useState(last30);
  const [occEndDate, setOccEndDate] = useState(today);
  const [pStart, setPStart] = useState(today);
  const [pEnd, setPEnd] = useState(today);
  const [pSearch, setPSearch] = useState('');

  const { data: dashboard, isLoading: dashboardLoad, refetch: refetchDashboard } = useQuery({
    queryKey: ['reports-dashboard'],
    queryFn: () => api.get('/api/reports/dashboard').then((r) => r.data.data),
    enabled: tab === 'dashboard',
  });

  const { data: dbr, isLoading: dbrLoad, refetch: refetchDbr } = useQuery({
    queryKey: ['dbr', reportDate],
    queryFn: () =>
      api.get('/api/reports/daily-business', { params: { date: reportDate } }).then((r) => r.data.data),
    enabled: tab === 'dbr',
  });

  const { data: occupancy, isLoading: occupancyLoad } = useQuery({
    queryKey: ['occupancy', occStartDate, occEndDate],
    queryFn: () =>
      api
        .get('/api/reports/occupancy', {
          params: { startDate: occStartDate, endDate: occEndDate },
        })
        .then((r) => r.data.data),
    enabled: tab === 'occupancy',
  });

  const { data: rev, isLoading: revLoad } = useQuery({
    queryKey: ['rev', startDate, endDate],
    queryFn: () =>
      api.get('/api/reports/revenue', { params: { startDate, endDate } }).then((r) => r.data.data),
    enabled: tab === 'revenue',
  });

  const { data: gStats, isLoading: gLoad } = useQuery({
    queryKey: ['guest-stats'],
    queryFn: () => api.get('/api/reports/guests').then((r) => r.data.data),
    enabled: tab === 'guests',
  });

  const { data: police, isLoading: policeLoad } = useQuery({
    queryKey: ['police', pStart, pEnd],
    queryFn: () =>
      api
        .get('/api/reports/police-verification', {
          params: { startDate: pStart, endDate: pEnd },
        })
        .then((r) => r.data.data),
    enabled: tab === 'police',
  });

  const { tenant } = useAuth();
  const hotelMeta = useMemo(() => getTenantMeta(tenant), [tenant]);

  const filtered = useMemo(() => {
    const rows = police?.records || [];
    return rows.filter(
      (r: any) =>
        !pSearch ||
        r.guestName?.toLowerCase().includes(pSearch.toLowerCase()) ||
        r.bookingRef?.toLowerCase().includes(pSearch.toLowerCase()) ||
        r.idNumber?.includes(pSearch) ||
        r.roomNumber?.includes(pSearch) ||
        r.address?.toLowerCase().includes(pSearch.toLowerCase())
    );
  }, [police, pSearch]);

  function exportCSV() {
    if (!filtered.length) {
      toast.error('No records');
      return;
    }

    const H = [
      '#',
      'Hotel Name',
      'Hotel Address',
      'Guest Name',
      'DOB',
      'Gender',
      'Nationality',
      'ID Type',
      'ID Number',
      'Phone',
      'Guest Address',
      'Room',
      'Check-in',
      'Time',
      'Check-out',
      'Nights',
      'Purpose',
      'Status',
      'ID Verified',
    ];

    const R = filtered.map((r: any, i: number) => [
      i + 1,
      `"${hotelMeta.hotelName}"`,
      `"${hotelMeta.address || ''}"`,
      `"${r.guestName || ''}"`,
      `"${r.dob || ''}"`,
      `"${r.gender || ''}"`,
      `"${r.nationality || ''}"`,
      `"${r.idType || ''}"`,
      `"${r.idNumber || ''}"`,
      `"${r.phone || ''}"`,
      `"${r.address || ''}"`,
      `"${r.roomNumber || ''}"`,
      `"${r.checkIn || ''}"`,
      `"${r.checkInTime || ''}"`,
      `"${r.checkOut || ''}"`,
      `"${r.nights || ''}"`,
      `"${r.purposeOfVisit || ''}"`,
      `"${r.status || ''}"`,
      r.idVerified ? 'YES' : 'NO',
    ]);
    function slugify(value: string) {
      return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    const csv = [H.join(','), ...R.map((r: any) => r.join(','))].join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `${slugify(hotelMeta.hotelName)}-police-register-${pStart}-${pEnd}.csv`
    });
    a.click();
    toast.success('Exported!');
  }

  const TABS = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Hotel },
    { id: 'dbr' as const, label: 'Daily Business', icon: BarChart3 },
    { id: 'occupancy' as const, label: 'Occupancy', icon: BedDouble },
    { id: 'revenue' as const, label: 'Revenue Analysis', icon: TrendingUp },
    { id: 'guests' as const, label: 'Guest Statistics', icon: Users },
    { id: 'police' as const, label: 'Police Verification', icon: Shield },
  ];

  return (
    <DashboardLayout title='Reports'>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports & Analytics</h1>
              <p className="mt-1 text-sm text-slate-500">
                Hotel PMS business intelligence · {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  if (tab === 'dashboard') refetchDashboard();
                  if (tab === 'dbr') refetchDbr();
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 rounded-3xl bg-slate-100 p-1.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all',
                  tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
                {t.id === 'police' && (
                  <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">
                    Legal
                  </span>
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === 'dashboard' && (
              <motion.div key="dashboard" {...fadeUp} className="space-y-4">
                {dashboardLoad ? (
                  <PageLoader />
                ) : dashboard ? (
                  <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                      <StatCard
                        label="Occupancy"
                        value={`${dashboard.occupancyPct ?? 0}%`}
                        sub={`${dashboard.occupied ?? 0} occupied`}
                        colorKey="blue"
                        icon={Building2}
                      />
                      <StatCard
                        label="Total Rooms"
                        value={dashboard.totalRooms ?? 0}
                        sub={`${dashboard.vacant ?? 0} vacant`}
                        colorKey="teal"
                        icon={BedDouble}
                      />
                      <StatCard
                        label="Arrivals Today"
                        value={dashboard.arrivalsToday ?? 0}
                        sub="Confirmed arrivals"
                        colorKey="green"
                        icon={Users}
                      />
                      <StatCard
                        label="Departures Today"
                        value={dashboard.departuresToday ?? 0}
                        sub="Expected departures"
                        colorKey="amber"
                        icon={Users}
                      />
                      <StatCard
                        label="Revenue Today"
                        value={formatCurrency(dashboard.revenueToday ?? 0)}
                        sub="Settled folios"
                        colorKey="purple"
                        icon={Receipt}
                      />
                      <StatCard
                        label="Pending Balance"
                        value={formatCurrency(dashboard.pendingBalance ?? 0)}
                        sub={`${dashboard.newGuests ?? 0} new guests today`}
                        colorKey="red"
                        icon={Activity}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                      <Card className="xl:col-span-2">
                        <CardHeader>
                          <SectionTitle title="7-Day Revenue Trend" sub="Based on settled folios" />
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={dashboard.revenueChart || []}>
                              <defs>
                                <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#1B4FD8" stopOpacity={0.18} />
                                  <stop offset="95%" stopColor="#1B4FD8" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                              <YAxis
                                tick={{ fontSize: 11, fill: '#94A3B8' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#1B4FD8"
                                strokeWidth={2.5}
                                fill="url(#dashboardRevenue)"
                                name="Revenue"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <SectionTitle title="Operations Snapshot" sub="Current day overview" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {[
                            { label: 'Occupied Rooms', value: dashboard.occupied ?? 0 },
                            { label: 'Vacant Rooms', value: dashboard.vacant ?? 0 },
                            { label: "Today's Arrivals", value: dashboard.arrivalsToday ?? 0 },
                            { label: "Today's Departures", value: dashboard.departuresToday ?? 0 },
                            { label: 'New Guests', value: dashboard.newGuests ?? 0 },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                            >
                              <span className="text-sm font-medium text-slate-600">{item.label}</span>
                              <span className="text-sm font-bold text-slate-900">{item.value}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                ) : (
                  <div className="py-16 text-center text-sm text-slate-400">Failed to load dashboard</div>
                )}
              </motion.div>
            )}

            {tab === 'dbr' && (
              <motion.div key="dbr" {...fadeUp} className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <DateInput value={reportDate} onChange={setReportDate} />
                  <button
                    onClick={() => refetchDbr()}
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </button>
                </div>

                {dbrLoad ? (
                  <PageLoader />
                ) : dbr ? (
                  <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                      <StatCard
                        label="Occupancy"
                        value={`${dbr.occupancy?.pct ?? 0}%`}
                        sub={`${dbr.occupancy?.occupied}/${dbr.occupancy?.rooms}`}
                        colorKey="blue"
                        icon={Building2}
                      />
                      <StatCard
                        label="ADR"
                        value={formatCurrency(dbr.adr ?? 0)}
                        sub="Avg daily rate"
                        colorKey="green"
                        icon={TrendingUp}
                      />
                      <StatCard
                        label="RevPAR"
                        value={formatCurrency(dbr.revpar ?? 0)}
                        sub="Per available room"
                        colorKey="purple"
                        icon={BarChart3}
                      />
                      <StatCard
                        label="Revenue"
                        value={formatCurrency(dbr.revenue?.total ?? 0)}
                        sub={`Net: ${formatCurrency(dbr.revenue?.net ?? 0)}`}
                        colorKey="amber"
                        icon={Receipt}
                      />
                      <StatCard
                        label="Arrivals"
                        value={dbr.arrivals?.count ?? 0}
                        sub="Check-ins"
                        colorKey="teal"
                        icon={Users}
                      />
                      <StatCard
                        label="Departures"
                        value={dbr.departures?.count ?? 0}
                        sub="Check-outs"
                        colorKey="red"
                        icon={Users}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {[
                        { l: 'In-House', v: dbr.inHouse ?? 0, c: 'bg-blue-50 text-blue-700' },
                        { l: 'No Shows', v: dbr.noShows ?? 0, c: 'bg-red-50 text-red-700' },
                        { l: 'Cancellations', v: dbr.cancellations ?? 0, c: 'bg-amber-50 text-amber-700' },
                        { l: 'Cash Revenue', v: formatCurrency(dbr.revenue?.cash ?? 0), c: 'bg-green-50 text-green-700' },
                        {
                          l: 'Digital Payments',
                          v: formatCurrency((dbr.revenue?.upi ?? 0) + (dbr.revenue?.card ?? 0) + (dbr.revenue?.razorpay ?? 0)),
                          c: 'bg-purple-50 text-purple-700',
                        },
                      ].map((s) => (
                        <motion.div
                          key={s.l}
                          variants={fadeUp}
                          className={`${s.c} rounded-2xl border border-white/60 p-3 text-center`}
                        >
                          <p className="text-lg font-bold">{s.v}</p>
                          <p className="mt-0.5 text-xs font-medium text-slate-500">{s.l}</p>
                        </motion.div>
                      ))}
                    </div>

                    {dbr.revenue?.breakdown?.length > 0 && (
                      <Card>
                        <CardHeader>
                          <SectionTitle title="Revenue by Department" />
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {dbr.revenue.breakdown.map((d: any) => (
                              <div
                                key={d._id}
                                className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5"
                              >
                                <div
                                  className="h-2.5 w-2.5 rounded-sm"
                                  style={{ backgroundColor: DEPT_COLORS[d._id] || '#64748B' }}
                                />
                                <span className="text-xs font-semibold capitalize text-slate-700">{d._id}</span>
                                <span className="text-sm font-bold text-slate-900">{formatCurrency(d.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {[
                        {
                          title: 'Arrivals',
                          data: dbr.arrivals?.list,
                          badge: 'success' as const,
                          accent: 'bg-green-50 text-green-700 border-green-100',
                        },
                        {
                          title: 'Departures',
                          data: dbr.departures?.list,
                          badge: 'warning' as const,
                          accent: 'bg-orange-50 text-orange-700 border-orange-100',
                        },
                      ].map((section) => (
                        <Card key={section.title}>
                          <CardHeader>
                            <h3 className="font-semibold text-slate-900">{section.title}</h3>
                            <Badge variant={section.badge}>{section.data?.length || 0}</Badge>
                          </CardHeader>

                          {!section.data?.length ? (
                            <div className="px-5 py-8 text-center text-sm text-slate-400">None today</div>
                          ) : (
                            <div className="divide-y divide-slate-100">
                              {section.data.map((r: any) => (
                                <div key={r._id} className="flex items-center gap-3 px-5 py-3">
                                  <div
                                    className={`${section.accent} flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border text-xs font-bold`}
                                  >
                                    {r.roomNumber}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-900">
                                      {r.guestId?.firstName} {r.guestId?.lastName}
                                    </p>
                                    <p className="font-mono text-xs text-slate-400">{r.bookingRef}</p>
                                  </div>
                                  <div className="flex-shrink-0 text-right">
                                    <p className="text-sm font-bold text-slate-900">{formatCurrency(r.totalAmount)}</p>
                                    <p className="text-xs text-slate-400">{r.nights}n</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="py-16 text-center text-sm text-slate-400">No data for this date</div>
                )}
              </motion.div>
            )}

            {tab === 'occupancy' && (
              <motion.div key="occupancy" {...fadeUp} className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <DateInput value={occStartDate} onChange={setOccStartDate} />
                  <span className="text-sm font-medium text-slate-400">to</span>
                  <DateInput value={occEndDate} onChange={setOccEndDate} />
                </div>

                {occupancyLoad ? (
                  <PageLoader />
                ) : occupancy ? (
                  <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <SectionTitle title="Occupancy Trend" sub="Day-wise occupied rooms and occupancy percentage" />
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={occupancy}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                            <YAxis
                              yAxisId="left"
                              tick={{ fontSize: 11, fill: '#94A3B8' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              tick={{ fontSize: 11, fill: '#94A3B8' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="occupied"
                              stroke="#1B4FD8"
                              strokeWidth={2.5}
                              dot={{ r: 3 }}
                              name="Occupied Rooms"
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="occupancyPct"
                              stroke="#059669"
                              strokeWidth={2.5}
                              dot={{ r: 3 }}
                              name="Occupancy %"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <SectionTitle title="Daily Occupancy Table" />
                      </CardHeader>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr>
                              {['Date', 'Occupied Rooms', 'Occupancy %'].map((h) => (
                                <th
                                  key={h}
                                  className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {occupancy.map((row: any) => (
                              <tr key={row.date} className="border-b border-slate-100">
                                <td className="px-4 py-3 font-medium text-slate-700">{row.date}</td>
                                <td className="px-4 py-3 text-slate-600">{row.occupied}</td>
                                <td className="px-4 py-3">
                                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                    {row.occupancyPct}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </motion.div>
                ) : (
                  <div className="py-16 text-center text-sm text-slate-400">No occupancy data</div>
                )}
              </motion.div>
            )}

            {tab === 'revenue' && (
              <motion.div key="revenue" {...fadeUp} className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <DateInput value={startDate} onChange={setStartDate} />
                  <span className="text-sm font-medium text-slate-400">to</span>
                  <DateInput value={endDate} onChange={setEndDate} />
                </div>

                {revLoad ? (
                  <PageLoader />
                ) : rev ? (
                  <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-4">
                    <motion.div variants={fadeUp} className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white">
                      <p className="mb-1 text-sm font-medium text-blue-200">
                        Total Revenue — {rev.period?.start} to {rev.period?.end}
                      </p>
                      <p className="text-4xl font-bold tracking-tight">{formatCurrency(rev.summary?.total || 0)}</p>
                      <p className="mt-1 text-sm text-blue-200">{rev.summary?.count || 0} payments recorded</p>
                    </motion.div>

                    {rev.byDay?.length > 0 ? (
                      <Card>
                        <CardHeader>
                          <SectionTitle title="Daily Revenue" />
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={rev.byDay} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#1B4FD8" stopOpacity={0.15} />
                                  <stop offset="95%" stopColor="#1B4FD8" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                              <YAxis
                                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#1B4FD8"
                                strokeWidth={2.5}
                                fill="url(#rg)"
                                dot={{ fill: '#1B4FD8', r: 3 }}
                                name="Revenue"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardContent className="py-10 text-center text-sm text-slate-400">
                          No payment data in this period. Record payments in Billing to see revenue here.
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <SectionTitle title="By Department" />
                        </CardHeader>
                        <CardContent>
                          {rev.byDepartment?.length > 0 ? (
                            <div className="space-y-3">
                              {rev.byDepartment.map((d: any, i: number) => {
                                const pct = rev.byDepartment[0].revenue > 0 ? (d.revenue / rev.byDepartment[0].revenue) * 100 : 0;
                                return (
                                  <div key={d._id}>
                                    <div className="mb-1 flex justify-between text-sm">
                                      <span className="font-medium capitalize text-slate-700">{d._id}</span>
                                      <span className="font-bold text-slate-900">{formatCurrency(d.revenue)}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.7, delay: i * 0.08 }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: DEPT_COLORS[d._id] || '#64748B' }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="py-8 text-center text-sm text-slate-400">No charge data yet</p>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <SectionTitle title="By Payment Mode" />
                        </CardHeader>
                        <CardContent>
                          {rev.byPaymentMode?.length > 0 ? (
                            <div className="flex items-center gap-4">
                              <ResponsiveContainer width={120} height={120}>
                                <PieChart>
                                  <Pie data={rev.byPaymentMode} dataKey="amount" cx="50%" cy="50%" innerRadius={32} outerRadius={52} paddingAngle={3}>
                                    {rev.byPaymentMode.map((_: any, i: number) => (
                                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                  </Pie>
                                </PieChart>
                              </ResponsiveContainer>

                              <div className="flex-1 space-y-2">
                                {rev.byPaymentMode.map((m: any, i: number) => (
                                  <div key={m._id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                      <span className="font-medium text-slate-600">{MODE_LABELS[m._id] || m._id}</span>
                                    </div>
                                    <span className="font-bold text-slate-900">{formatCurrency(m.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="py-8 text-center text-sm text-slate-400">No payment data yet</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {rev.bySource?.length > 0 && (
                      <Card>
                        <CardHeader>
                          <SectionTitle title="Revenue by Booking Source" />
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={rev.bySource} layout="vertical" margin={{ top: 0, right: 16, left: 70, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                              <XAxis
                                type="number"
                                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                              />
                              <YAxis
                                type="category"
                                dataKey="_id"
                                tick={{ fontSize: 11, fill: '#374151' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="revenue" radius={[0, 4, 4, 0]} name="Revenue">
                                {rev.bySource.map((_: any, i: number) => (
                                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                ) : null}
              </motion.div>
            )}

            {tab === 'guests' && (
              <motion.div key="guests" {...fadeUp} className="space-y-4">
                {gLoad ? (
                  <PageLoader />
                ) : (
                  <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <StatCard label="Total Guests" value={gStats?.total ?? '—'} colorKey="blue" icon={Users} />
                      <StatCard label="VIP Guests" value={gStats?.vip ?? '—'} colorKey="amber" icon={Star} />
                      <StatCard label="Loyalty Members" value={gStats?.loyalty ?? '—'} colorKey="purple" icon={Star} />
                      <StatCard label="Foreign Guests" value={gStats?.foreign ?? '—'} colorKey="teal" icon={Globe} />
                    </div>

                    {gStats?.byTier?.length > 0 && (
                      <Card>
                        <CardHeader>
                          <SectionTitle title="Loyalty Tier Distribution" />
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {gStats.byTier.map((t: any) => {
                              const cls: Record<string, string> = {
                                bronze: 'bg-amber-50 text-amber-700 border-amber-100',
                                silver: 'bg-slate-50 text-slate-700 border-slate-100',
                                gold: 'bg-yellow-50 text-yellow-700 border-yellow-100',
                                platinum: 'bg-purple-50 text-purple-700 border-purple-100',
                              };

                              return (
                                <div
                                  key={t._id}
                                  className={cn(
                                    'rounded-2xl border p-4 text-center capitalize',
                                    cls[t._id] || 'border-slate-100 bg-slate-50 text-slate-700',
                                  )}
                                >
                                  <p className="text-2xl font-bold">{t.count}</p>
                                  <p className="mt-1 text-xs font-semibold">{t._id || 'untagged'}</p>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {gStats?.byNationality?.length > 0 && (
                      <Card>
                        <CardHeader>
                          <SectionTitle title="Nationality Breakdown" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {gStats.byNationality.slice(0, 8).map((n: any, i: number) => (
                            <div key={n._id} className="flex items-center gap-3">
                              <span className="w-24 flex-shrink-0 text-right text-sm font-medium text-slate-700">{n._id}</span>
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(n.count / gStats.byNationality[0].count) * 100}%` }}
                                  transition={{ duration: 0.7, delay: i * 0.06 }}
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                                />
                              </div>
                              <span className="w-8 flex-shrink-0 text-sm font-bold text-slate-900">{n.count}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {gStats?.topGuests?.length > 0 && (
                      <Card>
                        <CardHeader>
                          <h3 className="font-semibold text-slate-900">Top Guests by Revenue</h3>
                          <span className="text-xs text-slate-400">All-time</span>
                        </CardHeader>
                        <div className="divide-y divide-slate-100">
                          {gStats.topGuests.map((g: any, i: number) => (
                            <div key={g._id} className="flex items-center gap-3 px-5 py-3">
                              <span
                                className={cn(
                                  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold',
                                  i === 0
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : i === 1
                                      ? 'bg-slate-100 text-slate-600'
                                      : i === 2
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-slate-50 text-slate-400',
                                )}
                              >
                                {i + 1}
                              </span>

                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                                {g.firstName?.[0]}
                              </div>

                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-900">
                                  {g.firstName} {g.lastName}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {g.stayCount} stays · <span className="capitalize">{g.loyalty?.tier}</span>
                                </p>
                              </div>

                              <span className="text-sm font-bold text-slate-900">{formatCurrency(g.totalRevenue)}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {!gStats && (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Users className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                          <p className="font-medium text-slate-500">No guest data available</p>
                          <p className="mt-1 text-sm text-slate-400">Add guests and complete reservations to see analytics</p>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {tab === 'police' && (
              <motion.div key="police" {...fadeUp} className="space-y-4">
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">Legal Requirement — India</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-red-700">
                      Under Rule 14, Registration of Foreigners Rules 1992 and Hotel and Lodging Houses Act, every hotel must maintain a guest register and submit to local police within 24 hours of check-in. Foreign nationals are mandatory within 24 hours per Foreigners Act 1946.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <input
                      type="date"
                      value={pStart}
                      onChange={(e) => setPStart(e.target.value)}
                      className="bg-transparent text-sm outline-none"
                    />
                    <span className="text-xs text-slate-300">|</span>
                    <input
                      type="date"
                      value={pEnd}
                      onChange={(e) => setPEnd(e.target.value)}
                      className="bg-transparent text-sm outline-none"
                    />
                  </div>

                  <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search name, ID, room..."
                      value={pSearch}
                      onChange={(e) => setPSearch(e.target.value)}
                      className="flex-1 bg-transparent text-sm outline-none"
                    />
                  </div>

                  <button
                    onClick={exportCSV}
                    className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export CSV
                  </button>

                  <button
                    onClick={() =>
                      doPrint({
                        records: filtered,
                        start: pStart,
                        end: pEnd,
                        hotel: hotelMeta,
                      })
                    }
                    className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print Register
                  </button>
                </div>

                {police && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { l: 'Total Check-ins', v: police.total, k: 'blue' as ColorKey },
                      { l: 'ID Verified', v: police.records?.filter((r: any) => r.idVerified).length ?? 0, k: 'green' as ColorKey },
                      { l: 'ID Pending', v: police.records?.filter((r: any) => !r.idVerified).length ?? 0, k: 'red' as ColorKey },
                      {
                        l: 'Foreign Nationals',
                        v: police.records?.filter((r: any) => r.nationality !== 'Indian').length ?? 0,
                        k: 'amber' as ColorKey,
                      },
                    ].map((s) => (
                      <motion.div key={s.l} variants={fadeUp} className={`${COLOR_SETS[s.k].bg} rounded-2xl border border-white/60 p-4`}>
                        <p className={`text-2xl font-bold leading-none ${COLOR_SETS[s.k].text}`}>{s.v}</p>
                        <p className="mt-1.5 text-xs font-semibold text-slate-500">{s.l}</p>
                      </motion.div>
                    ))}
                  </div>
                )}

                <Card>
                  <CardHeader>
                    <div>
                      <h3 className="font-semibold text-slate-900">Guest Register — Form C</h3>
                      <p className="mt-0.5 text-xs text-slate-400">Registration of Foreigners Rules, 1992</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {police && <span className="text-xs font-medium text-slate-500">{filtered.length} records</span>}
                      {filtered.some((r: any) => !r.idVerified) && (
                        <Badge variant="danger">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {filtered.filter((r: any) => !r.idVerified).length} unverified
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  {policeLoad ? (
                    <div className="flex justify-center py-12">
                      <Spinner />
                    </div>
                  ) : !filtered.length ? (
                    <div className="py-14 text-center">
                      <FileText className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                      <p className="font-medium text-slate-500">No check-ins in selected period</p>
                      <p className="mt-1 text-sm text-slate-400">Select a date range with actual check-ins</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr>
                            {[
                              '#',
                              'Guest Name',
                              'DOB',
                              'Gender',
                              'Nationality',
                              'ID Type',
                              'ID Number',
                              'Phone',
                              'Address',
                              'Room',
                              'Check-in',
                              'Check-out',
                              'Purpose',
                              'ID Status',
                            ].map((h) => (
                              <th
                                key={h}
                                className="whitespace-nowrap border-b border-gray-200 bg-gray-50 px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((r: any, i: number) => (
                            <motion.tr
                              key={r.reservationId}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: Math.min(i * 0.025, 0.4) }}
                              className={cn(
                                'border-b border-slate-100 transition-colors hover:bg-slate-50',
                                !r.idVerified && 'bg-red-50/30',
                              )}
                            >
                              <td className="px-3 py-2.5 font-mono text-slate-400">{i + 1}</td>
                              <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-900">{r.guestName}</td>
                              <td className="whitespace-nowrap px-3 py-2.5 font-mono text-slate-600">{r.dob || '—'}</td>
                              <td className="px-3 py-2.5 capitalize text-slate-600">{r.gender || '—'}</td>
                              <td className="px-3 py-2.5">
                                <span
                                  className={cn(
                                    'whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                    r.nationality === 'Indian' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700',
                                  )}
                                >
                                  {r.nationality}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 capitalize text-slate-600">
                                {(r.idType || '—').replace('_', ' ')}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 font-mono text-slate-700">{r.idNumber || '—'}</td>
                              <td className="px-3 py-2.5 font-mono text-slate-600">{r.phone}</td>
                              <td className="px-3 py-2.5 text-gray-600 min-w-[220px]">
                                <div className="max-w-[260px] whitespace-normal break-words leading-relaxed">
                                  {r.address || '—'}
                                </div>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-bold text-slate-900">{r.roomNumber}</span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                                <span className="block">{r.checkIn}</span>
                                <span className="font-mono text-[10px] text-slate-400">{r.checkInTime}</span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                                {r.checkOut || <span className="text-[10px] font-medium text-green-600">In-house</span>}
                              </td>
                              <td className="px-3 py-2.5 capitalize text-slate-600">{r.purposeOfVisit || 'Leisure'}</td>
                              <td className="px-3 py-2.5">
                                {r.idVerified ? (
                                  <span className="flex items-center gap-1 whitespace-nowrap font-semibold text-green-700">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Verified
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 whitespace-nowrap font-semibold text-red-600">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Pending
                                  </span>
                                )}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>

                {filtered.length > 0 && (
                  <p className="text-center text-xs text-slate-400">
                    Compliant with Hotel & Lodging Houses Act, India. Export CSV or print for police submission. Foreign nationals must be reported within 24 hours.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}