// app/dashboard/reports/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Filter,
  Sparkles,
  DoorOpen,
  CircleDollarSign,
  ArrowUpRight,
  UserCheck,
  UserX,
  Banknote,
  ChevronRight,
  Wallet,
  CreditCard,
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
}// ── Modern Color Tokens (Light Theme) ─────────────────────────────────────────
const THEME = {
  blue:   { bg: 'bg-sky-50',  text: 'text-sky-700',  border: 'border-sky-100',  icon: 'text-sky-500',  chart: '#38BDF8' },
  teal:   { bg: 'bg-teal-50',  text: 'text-teal-700',  border: 'border-teal-100',  icon: 'text-teal-500',  chart: '#2DD4BF' },
  green:  { bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-100',icon: 'text-emerald-500',chart: '#34D399' },
  amber:  { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: 'text-amber-500', chart: '#FBBF24' },
  purple: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100', icon: 'text-violet-500', chart: '#A78BFA' },
  rose:   { bg: 'bg-rose-50',  text: 'text-rose-700',  border: 'border-rose-100',  icon: 'text-rose-500',  chart: '#FB7185' },
  slate:  { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100', icon: 'text-slate-500', chart: '#94A3B8' },
  orange: { bg: 'bg-orange-50',text: 'text-orange-700',border: 'border-orange-100',icon: 'text-orange-500',chart: '#FB923C' },
};

function getTheme(key: string) {
  return THEME[key as keyof typeof THEME] || THEME.slate;
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
  const [debouncedPSearch, setDebouncedPSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPSearch(pSearch), 400);
    return () => clearTimeout(timer);
  }, [pSearch]);

  const { data: dashboard, isLoading: dashboardLoad, refetch: refetchDashboard } = useQuery({
    queryKey: ['reports-dashboard'],
    queryFn: () => api.get('/api/reports/dashboard').then((r) => r.data.data),
    enabled: tab === 'dashboard',
  });

  const { data: dbr, isLoading: dbrLoad, refetch: refetchDbr } = useQuery({
    queryKey: ['dbr', reportDate],
    queryFn: () => api.get('/api/reports/daily-business', { params: { date: reportDate } }).then((r) => r.data.data),
    enabled: tab === 'dbr',
  });

  const { data: occupancy, isLoading: occupancyLoad, refetch: refetchOccupancy } = useQuery({
    queryKey: ['occupancy', occStartDate, occEndDate],
    queryFn: () => api.get('/api/reports/occupancy', { params: { startDate: occStartDate, endDate: occEndDate } }).then((r) => r.data.data),
    enabled: tab === 'occupancy',
  });

  const { data: rev, isLoading: revLoad, refetch: refetchRevenue } = useQuery({
    queryKey: ['rev', startDate, endDate],
    queryFn: () => api.get('/api/reports/revenue', { params: { startDate, endDate } }).then((r) => r.data.data),
    enabled: tab === 'revenue',
  });

  const { data: gStats, isLoading: gLoad, refetch: refetchGuests } = useQuery({
    queryKey: ['guest-stats'],
    queryFn: () => api.get('/api/reports/guests').then((r) => r.data.data),
    enabled: tab === 'guests',
  });

  const { data: police, isLoading: policeLoad, refetch: refetchPolice } = useQuery({
    queryKey: ['police', pStart, pEnd, debouncedPSearch],
    queryFn: () => api.get('/api/reports/police-verification', {
      params: { startDate: pStart, endDate: pEnd, search: debouncedPSearch || undefined },
    }).then((r) => r.data.data),
    enabled: tab === 'police',
  });

  const { tenant } = useAuth();
  const hotelMeta = useMemo(() => getTenantMeta(tenant), [tenant]);

  const filtered = useMemo(() => {
    const rows = police?.records || [];
    if (!pSearch) return rows;
    return rows.filter((r: any) =>
      !r.address || r.address.toLowerCase().includes(pSearch.toLowerCase())
    );
  }, [police, pSearch]);

  function setPoliceRange(start: string, end: string) {
    setPStart(start);
    setPEnd(end);
  }

  function exportCSV() {
    if (!filtered.length) { toast.error('No records'); return; }
    const H = ['#','Hotel Name','Hotel Address','Guest Name','DOB','Gender','Nationality','ID Type','ID Number','Phone','Guest Address','Room','Check-in','Time','Check-out','Nights','Purpose','Status','ID Verified'];
    const R = filtered.map((r: any, i: number) => [
      i + 1, `"${hotelMeta.hotelName}"`, `"${hotelMeta.address || ''}"`, `"${r.guestName || ''}"`, `"${r.dob || ''}"`, `"${r.gender || ''}"`, `"${r.nationality || ''}"`, `"${r.idType || ''}"`, `"${r.idNumber || ''}"`, `"${r.phone || ''}"`, `"${r.address || ''}"`, `"${r.roomNumber || ''}"`, `"${r.checkIn || ''}"`, `"${r.checkInTime || ''}"`, `"${r.checkOut || ''}"`, `"${r.nights || ''}"`, `"${r.purposeOfVisit || ''}"`, `"${r.status || ''}"`, r.idVerified ? 'YES' : 'NO',
    ]);
    const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const csv = [H.join(','), ...R.map((r: any) => r.join(','))].join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `${slugify(hotelMeta.hotelName)}-police-register-${pStart}-${pEnd}.csv`
    });
    a.click();
    toast.success('Exported successfully!');
  }

  const TABS = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Sparkles, color: 'blue' },
    { id: 'dbr' as const, label: 'Daily Business', icon: BarChart3, color: 'teal' },
    { id: 'occupancy' as const, label: 'Occupancy', icon: BedDouble, color: 'green' },
    { id: 'revenue' as const, label: 'Revenue', icon: TrendingUp, color: 'purple' },
    { id: 'guests' as const, label: 'Guests', icon: Users, color: 'amber' },
    { id: 'police' as const, label: 'Police', icon: Shield, color: 'rose' },
  ];

  const handleRefresh = () => {
    if (tab === 'dashboard') refetchDashboard();
    if (tab === 'dbr') refetchDbr();
    if (tab === 'occupancy') refetchOccupancy();
    if (tab === 'revenue') refetchRevenue();
    if (tab === 'guests') refetchGuests();
    if (tab === 'police') refetchPolice();
  };

  return (
    <DashboardLayout title="Reports">
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-white p-8 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] backdrop-blur-sm">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-sky-100 to-violet-100 opacity-50 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 opacity-50 blur-3xl" />
            
            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-600 ring-1 ring-sky-100">
                  <Sparkles className="h-3 w-3" />
                  Analytics & Intelligence
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Reports Center
                </h1>
                <p className="mt-2 text-sm font-medium text-slate-400">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <button
                onClick={handleRefresh}
                className="group inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:shadow-md active:scale-95"
              >
                <RefreshCw className="h-4 w-4 transition-transform group-hover:rotate-180" />
                Refresh Data
              </button>
            </div>
          </div>

          {/* ── Tabs ───────────────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-2 rounded-[1.5rem] bg-white p-2 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
            {TABS.map((t) => {
              const theme = getTheme(t.color);
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'relative flex items-center gap-2.5 rounded-[1.2rem] px-5 py-3 text-sm font-semibold transition-all duration-300',
                    isActive
                      ? `${theme.bg} ${theme.text} shadow-sm ring-1 ${theme.border}`
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  )}
                >
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-xl transition-colors',
                    isActive ? 'bg-white/60' : 'bg-slate-100'
                  )}>
                    <t.icon className={cn('h-4 w-4', isActive ? theme.icon : 'text-slate-400')} />
                  </div>
                  {t.label}
                  {t.id === 'police' && (
                    <span className="ml-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 ring-1 ring-rose-200">
                      Legal
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className={cn('absolute inset-0 rounded-[1.2rem] ring-1', theme.border)}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {/* ═══════════════════════════════════════════════════════════════
                DASHBOARD
            ═══════════════════════════════════════════════════════════════ */}
            {tab === 'dashboard' && (
              <motion.div key="dashboard" {...fadeUp} className="space-y-6">
                {dashboardLoad ? (
                  <PageLoader />
                ) : dashboard ? (
                  <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                      {[
                        { label: 'Occupancy', value: `${dashboard.occupancyPct ?? 0}%`, sub: `${dashboard.occupied ?? 0} occupied`, color: 'blue', icon: Building2 },
                        { label: 'Total Rooms', value: dashboard.totalRooms ?? 0, sub: `${dashboard.vacant ?? 0} vacant`, color: 'teal', icon: BedDouble },
                        { label: 'Arrivals', value: dashboard.arrivalsToday ?? 0, sub: 'Confirmed today', color: 'green', icon: DoorOpen },
                        { label: 'Departures', value: dashboard.departuresToday ?? 0, sub: 'Expected today', color: 'amber', icon: DoorOpen },
                        { label: 'Revenue', value: formatCurrency(dashboard.revenueToday ?? 0), sub: 'Settled folios', color: 'purple', icon: CircleDollarSign },
                        { label: 'Pending', value: formatCurrency(dashboard.pendingBalance ?? 0), sub: `${dashboard.newGuests ?? 0} new guests`, color: 'rose', icon: Activity },
                      ].map((stat) => {
                        const theme = getTheme(stat.color);
                        return (
                          <motion.div
                            key={stat.label}
                            variants={fadeUp}
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            className={cn(
                              'group relative overflow-hidden rounded-2xl border p-5 transition-shadow hover:shadow-lg',
                              theme.bg, theme.border, 'bg-white'
                            )}
                          >
                            <div className={cn('absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-20 blur-2xl', theme.bg.replace('bg-', 'bg-'))} />
                            <div className="relative">
                              <div className="mb-3 flex items-center justify-between">
                                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1', theme.border)}>
                                  <stat.icon className={cn('h-5 w-5', theme.icon)} />
                                </div>
                                <ArrowUpRight className={cn('h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100', theme.icon)} />
                              </div>
                              <p className="text-2xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                              <p className="mt-1 text-xs font-medium text-slate-400">{stat.sub}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                      {/* Revenue Chart */}
                      <Card className="xl:col-span-2 overflow-hidden border-0 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)]">
                        <CardHeader className="border-b border-slate-50 px-6 py-5">
                          <SectionTitle title="Revenue Trend" sub="Last 7 days · Settled folios" />
                        </CardHeader>
                        <CardContent className="p-6">
                          <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={dashboard.revenueChart || []}>
                              <defs>
                                <linearGradient id="dashRev" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.25} />
                                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="4 4" stroke="#F1F5F9" vertical={false} />
                              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94A3B8', fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                              <YAxis tick={{ fontSize: 12, fill: '#94A3B8', fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
                              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E2E8F0', strokeWidth: 2 }} />
                              <Area type="monotone" dataKey="revenue" stroke="#38BDF8" strokeWidth={3} fill="url(#dashRev)" name="Revenue" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Operations Snapshot */}
                      <Card className="overflow-hidden border-0 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)]">
                        <CardHeader className="border-b border-slate-50 px-6 py-5">
                          <SectionTitle title="Operations" sub="Current day overview" />
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            {[
                              { label: 'Occupied Rooms', value: dashboard.occupied ?? 0, icon: BedDouble, color: 'blue' },
                              { label: 'Vacant Rooms', value: dashboard.vacant ?? 0, icon: Building2, color: 'slate' },
                              { label: "Today's Arrivals", value: dashboard.arrivalsToday ?? 0, icon: UserCheck, color: 'green' },
                              { label: "Today's Departures", value: dashboard.departuresToday ?? 0, icon: UserX, color: 'amber' },
                              { label: 'New Guests', value: dashboard.newGuests ?? 0, icon: Users, color: 'purple' },
                            ].map((item, i) => {
                              const theme = getTheme(item.color);
                              return (
                                <motion.div
                                  key={item.label}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  className="flex items-center justify-between rounded-xl bg-slate-50/50 px-4 py-3.5 transition-colors hover:bg-slate-50"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', theme.bg)}>
                                      <item.icon className={cn('h-4 w-4', theme.icon)} />
                                    </div>
                                    <span className="text-sm font-medium text-slate-600">{item.label}</span>
                                  </div>
                                  <span className="text-lg font-bold text-slate-900">{item.value}</span>
                                </motion.div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                ) : (
                  <EmptyState message="Failed to load dashboard" />
                )}
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                DAILY BUSINESS REPORT
            ═══════════════════════════════════════════════════════════════ */}
            {tab === 'dbr' && (
              <motion.div key="dbr" {...fadeUp} className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-slate-100">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <DateInput value={reportDate} onChange={setReportDate} />
                  </div>
                  <button
                    onClick={() => refetchDbr()}
                    className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-100 transition-all hover:bg-slate-50 active:scale-95"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </button>
                </div>

                {dbrLoad ? (
                  <PageLoader />
                ) : dbr ? (
                  <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
                    {/* Main Stats */}
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                      {[
                        { label: 'Occupancy', value: `${dbr.occupancy?.pct ?? 0}%`, sub: `${dbr.occupancy?.occupied}/${dbr.occupancy?.rooms}`, color: 'blue', icon: Building2 },
                        { label: 'ADR', value: formatCurrency(dbr.adr ?? 0), sub: 'Avg daily rate', color: 'green', icon: TrendingUp },
                        { label: 'RevPAR', value: formatCurrency(dbr.revpar ?? 0), sub: 'Per room', color: 'purple', icon: BarChart3 },
                        { label: 'Revenue', value: formatCurrency(dbr.revenue?.total ?? 0), sub: `Net: ${formatCurrency(dbr.revenue?.net ?? 0)}`, color: 'amber', icon: Receipt },
                        { label: 'Arrivals', value: dbr.arrivals?.count ?? 0, sub: 'Check-ins', color: 'teal', icon: UserCheck },
                        { label: 'Departures', value: dbr.departures?.count ?? 0, sub: 'Check-outs', color: 'rose', icon: UserX },
                      ].map((stat) => {
                        const theme = getTheme(stat.color);
                        return (
                          <motion.div key={stat.label} variants={fadeUp} whileHover={{ y: -2 }} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                            <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl', theme.bg)}>
                              <stat.icon className={cn('h-5 w-5', theme.icon)} />
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                            <p className="mt-1 text-xs font-medium text-slate-400">{stat.sub}</p>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Secondary Stats */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {[
                        { l: 'In-House', v: dbr.inHouse ?? 0, color: 'blue', icon: Users },
                        { l: 'No Shows', v: dbr.noShows ?? 0, color: 'rose', icon: UserX },
                        { l: 'Cancellations', v: dbr.cancellations ?? 0, color: 'amber', icon: AlertTriangle },
                        { l: 'Cash', v: formatCurrency(dbr.revenue?.cash ?? 0), color: 'green', icon: Banknote },
                        { l: 'Digital', v: formatCurrency((dbr.revenue?.upi ?? 0) + (dbr.revenue?.card ?? 0) + (dbr.revenue?.razorpay ?? 0)), color: 'purple', icon: CreditCard },
                      ].map((s) => {
                        const theme = getTheme(s.color);
                        return (
                          <motion.div key={s.l} variants={fadeUp} whileHover={{ scale: 1.02 }} className={cn('flex items-center gap-3 rounded-2xl border p-4', theme.bg, theme.border)}>
                            <s.icon className={cn('h-5 w-5', theme.icon)} />
                            <div>
                              <p className="text-lg font-bold text-slate-900">{s.v}</p>
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{s.l}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Revenue by Department */}
                    {dbr.revenue?.breakdown?.length > 0 && (
                      <Card className="overflow-hidden border-0 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)]">
                        <CardHeader className="border-b border-slate-50 px-6 py-5">
                          <SectionTitle title="Revenue by Department" />
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="flex flex-wrap gap-3">
                            {dbr.revenue.breakdown.map((d: any) => (
                              <motion.div
                                key={d._id}
                                whileHover={{ scale: 1.05 }}
                                className="flex items-center gap-3 rounded-xl bg-slate-50 px-5 py-3 ring-1 ring-slate-100 transition-shadow hover:shadow-md"
                              >
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: DEPT_COLORS[d._id] || '#64748B' }} />
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{d._id}</span>
                                <span className="text-sm font-bold text-slate-900">{formatCurrency(d.amount)}</span>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Arrivals & Departures */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {[
                        { title: 'Arrivals', data: dbr.arrivals?.list, badge: 'success' as const, accent: 'bg-emerald-50 text-emerald-700 ring-emerald-100', icon: UserCheck },
                        { title: 'Departures', data: dbr.departures?.list, badge: 'warning' as const, accent: 'bg-amber-50 text-amber-700 ring-amber-100', icon: UserX },
                      ].map((section) => (
                        <Card key={section.title} className="overflow-hidden border-0 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)]">
                          <CardHeader className="flex items-center justify-between border-b border-slate-50 px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', section.accent)}>
                                <section.icon className="h-4 w-4" />
                              </div>
                              <h3 className="font-semibold text-slate-900">{section.title}</h3>
                            </div>
                            <Badge variant={section.badge}>{section.data?.length || 0}</Badge>
                          </CardHeader>

                          {!section.data?.length ? (
                            <div className="px-6 py-10 text-center text-sm text-slate-400">None today</div>
                          ) : (
                            <div className="divide-y divide-slate-50">
                              {section.data.map((r: any) => (
                                <div key={r._id} className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/50">
                                  <div className={cn('flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ring-1', section.accent)}>
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
                                    <p className="text-xs text-slate-400">{r.nights} nights</p>
                                  </div>
                                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <EmptyState message="No data for this date" />
                )}
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                OCCUPANCY
            ═══════════════════════════════════════════════════════════════ */}
            {tab === 'occupancy' && (
              <motion.div key="occupancy" {...fadeUp} className="space-y-6">
                <div className="flex w-fit items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-slate-100">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <DateInput value={occStartDate} onChange={setOccStartDate} />
                  <span className="text-xs font-medium text-slate-300">to</span>
                  <DateInput value={occEndDate} onChange={setOccEndDate} />
                </div>

                {occupancyLoad ? (
                  <PageLoader />
                ) : occupancy ? (
                  <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
                    <Card className="overflow-hidden border-0 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)]">
                      <CardHeader className="border-b border-slate-50 px-6 py-5">
                        <SectionTitle title="Occupancy Trend" sub="Day-wise occupied rooms and percentage" />
                      </CardHeader>
                      <CardContent className="p-6">
                        <ResponsiveContainer width="100%" height={320}>
                          <LineChart data={occupancy}>
                            <CartesianGrid strokeDasharray="4 4" stroke="#F1F5F9" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94A3B8', fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                            <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} unit="%" />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E2E8F0', strokeWidth: 2 }} />
                            <Line yAxisId="left" type="monotone" dataKey="occupied" stroke="#38BDF8" strokeWidth={3} dot={{ r: 4, fill: '#38BDF8', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Occupied Rooms" />
                            <Line yAxisId="right" type="monotone" dataKey="occupancyPct" stroke="#34D399" strokeWidth={3} dot={{ r: 4, fill: '#34D399', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Occupancy %" />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-0 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)]">
                      <CardHeader className="border-b border-slate-50 px-6 py-5">
                        <SectionTitle title="Daily Breakdown" />
                      </CardHeader>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50/50">
                              {['Date', 'Occupied Rooms', 'Occupancy %'].map((h) => (
                                <th key={h} className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {occupancy.map((row: any, i: number) => (
                              <motion.tr
                                key={row.date}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="group transition-colors hover:bg-sky-50/30"
                              >
                                <td className="px-6 py-4 font-medium text-slate-700">{row.date}</td>
                                <td className="px-6 py-4 text-slate-600">{row.occupied}</td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${row.occupancyPct}%` }}
                                        transition={{ duration: 0.8, delay: i * 0.05 }}
                                        className="h-full rounded-full bg-gradient-to-r from-sky-400 to-teal-400"
                                      />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{row.occupancyPct}%</span>
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </motion.div>
                ) : (
                  <EmptyState message="No occupancy data" />
                )}
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                REVENUE
            ═══════════════════════════════════════════════════════════════ */}
            {tab === 'revenue' && (
              <motion.div key="revenue" {...fadeUp} className="space-y-6">
                <div className="flex w-fit items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-slate-100">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <DateInput value={startDate} onChange={setStartDate} />
                  <span className="text-xs font-medium text-slate-300">to</span>
                  <DateInput value={endDate} onChange={setEndDate} />
                </div>

                {revLoad ? (
                  <PageLoader />
                ) : rev ? (
                  <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
                    {/* Hero Stat */}
                    <motion.div
                      variants={fadeUp}
                      className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-500 via-blue-500 to-violet-500 p-8 text-white shadow-lg shadow-blue-200"
                    >
                      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                      <div className="relative">
                        <p className="mb-1 text-sm font-medium text-blue-100">
                          Total Revenue · {rev.period?.start} to {rev.period?.end}
                        </p>
                        <p className="text-5xl font-bold tracking-tight">{formatCurrency(rev.summary?.total || 0)}</p>
                        <div className="mt-4 flex items-center gap-2">
                          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                            {rev.summary?.count || 0} payments
                          </span>
                          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                            {rev.byDay?.length || 0} active days
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {rev.byDay?.length > 0 ? (
                      <Card className="overflow-hidden border-0 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)]">
                        <CardHeader className="border-b border-slate-50 px-6 py-5">
                          <SectionTitle title="Daily Revenue" />
                        </CardHeader>
                        <CardContent className="p-6">
                          <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={rev.byDay}>
                              <defs>
                                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#818CF8" stopOpacity={0.25} />
                                  <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="4 4" stroke="#F1F5F9" vertical={false} />
                              <XAxis dataKey="_id" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} dy={10} />
                              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E2E8F0', strokeWidth: 2 }} />
                              <Area type="monotone" dataKey="revenue" stroke="#818CF8" strokeWidth={3} fill="url(#revGrad)" dot={{ fill: '#818CF8', r: 4, strokeWidth: 2, stroke: '#fff' }} name="Revenue" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-0 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)]">
                        <CardContent className="py-16 text-center">
                          <Wallet className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                          <p className="text-sm font-medium text-slate-500">No payment data in this period</p>
                          <p className="mt-1 text-xs text-slate-400">Record payments in Billing to see revenue here</p>
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {/* By Department */}
                      <Card className="overflow-hidden border-0 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)]">
                        <CardHeader className="border-b border-slate-50 px-6 py-5">
                          <SectionTitle title="By Department" />
                        </CardHeader>
                        <CardContent className="p-6">
                          {rev.byDepartment?.length > 0 ? (
                            <div className="space-y-5">
                              {rev.byDepartment.map((d: any, i: number) => {
                                const pct = rev.byDepartment[0].revenue > 0 ? (d.revenue / rev.byDepartment[0].revenue) * 100 : 0;
                                return (
                                  <div key={d._id}>
                                    <div className="mb-2 flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: DEPT_COLORS[d._id] || '#64748B' }} />
                                        <span className="text-sm font-semibold capitalize text-slate-700">{d._id}</span>
                                      </div>
                                      <span className="text-sm font-bold text-slate-900">{formatCurrency(d.revenue)}</span>
                                    </div>
                                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.8, delay: i * 0.1 }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: DEPT_COLORS[d._id] || '#64748B' }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <EmptyState message="No charge data yet" />
                          )}
                        </CardContent>
                      </Card>

                      {/* By Payment Mode */}
                      <Card className="overflow-hidden border-0 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)]">
                        <CardHeader className="border-b border-slate-50 px-6 py-5">
                          <SectionTitle title="By Payment Mode" />
                        </CardHeader>
                        <CardContent className="p-6">
                          {rev.byPaymentMode?.length > 0 ? (
                            <div className="flex items-center gap-8">
                              <ResponsiveContainer width={140} height={140}>
                                <PieChart>
                                  <Pie
                                    data={rev.byPaymentMode}
                                    dataKey="amount"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={65}
                                    paddingAngle={4}
                                    stroke="none"
                                  >
                                    {rev.byPaymentMode.map((_: any, i: number) => (
                                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                  </Pie>
                                </PieChart>
                              </ResponsiveContainer>

                              <div className="flex-1 space-y-3">
                                {rev.byPaymentMode.map((m: any, i: number) => (
                                  <div key={m._id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                      <span className="text-sm font-medium text-slate-600">{MODE_LABELS[m._id] || m._id}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900">{formatCurrency(m.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <EmptyState message="No payment data yet" />
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {rev.bySource?.length > 0 && (
                      <Card className="overflow-hidden border-0 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)]">
                        <CardHeader className="border-b border-slate-50 px-6 py-5">
                          <SectionTitle title="Revenue by Booking Source" />
                        </CardHeader>
                        <CardContent className="p-6">
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={rev.bySource} layout="vertical" margin={{ top: 0, right: 16, left: 80, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                              <XAxis type="number" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                              <YAxis type="category" dataKey="_id" tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} axisLine={false} tickLine={false} width={80} />
                              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
                              <Bar dataKey="revenue" radius={[0, 8, 8, 0]} barSize={24}>
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

            {/* ═══════════════════════════════════════════════════════════════
                GUESTS
            ═══════════════════════════════════════════════════════════════ */}
            {tab === 'guests' && (
              <motion.div key="guests" {...fadeUp} className="space-y-6">
                {gLoad ? (
                  <PageLoader />
                ) : (
                  <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {[
                        { label: 'Total Guests', value: gStats?.total ?? '—', color: 'blue', icon: Users },
                        { label: 'VIP', value: gStats?.vip ?? '—', color: 'amber', icon: Star },
                        { label: 'Loyalty', value: gStats?.loyalty ?? '—', color: 'purple', icon: Sparkles },
                        { label: 'Foreign', value: gStats?.foreign ?? '—', color: 'teal', icon: Globe },
                      ].map((stat) => {
                        const theme = getTheme(stat.color);
                        return (
                          <motion.div key={stat.label} variants={fadeUp} whileHover={{ y: -2 }} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                            <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl', theme.bg)}>
                              <stat.icon className={cn('h-5 w-5', theme.icon)} />
                            </div>
                            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{stat.label}</p>
                          </motion.div>
                        );
                      })}
                    </div>

                    {gStats?.byTier?.length > 0 && (
                      <Card className="overflow-hidden border-0 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)]">
                        <CardHeader className="border-b border-slate-50 px-6 py-5">
                          <SectionTitle title="Loyalty Tiers" />
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            {gStats.byTier.map((t: any) => {
                              const cls: Record<string, string> = {
                                bronze: 'bg-amber-50 text-amber-700 ring-amber-100',
                                silver: 'bg-slate-50 text-slate-700 ring-slate-100',
                                gold: 'bg-yellow-50 text-yellow-700 ring-yellow-100',
                                platinum: 'bg-violet-50 text-violet-700 ring-violet-100',
                              };
                              return (
                                <motion.div
                                  key={t._id}
                                  whileHover={{ scale: 1.03 }}
                                  className={cn('rounded-2xl border p-6 text-center capitalize shadow-sm transition-shadow hover:shadow-md', cls[t._id] || 'border-slate-100 bg-slate-50 text-slate-700')}
                                >
                                  <p className="text-3xl font-bold">{t.count}</p>
                                  <p className="mt-2 text-xs font-bold uppercase tracking-wider opacity-70">{t._id || 'untagged'}</p>
                                </motion.div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {gStats?.byNationality?.length > 0 && (
                      <Card className="overflow-hidden border-0 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)]">
                        <CardHeader className="border-b border-slate-50 px-6 py-5">
                          <SectionTitle title="Nationality Breakdown" />
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {gStats.byNationality.slice(0, 8).map((n: any, i: number) => (
                              <div key={n._id} className="flex items-center gap-4">
                                <span className="w-28 flex-shrink-0 text-right text-sm font-semibold text-slate-700">{n._id}</span>
                                <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(n.count / gStats.byNationality[0].count) * 100}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.08 }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                                  />
                                </div>
                                <span className="w-10 flex-shrink-0 text-sm font-bold text-slate-900">{n.count}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {gStats?.topGuests?.length > 0 && (
                      <Card className="overflow-hidden border-0 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)]">
                        <CardHeader className="border-b border-slate-50 px-6 py-5">
                          <SectionTitle title="Top Guests by Revenue" sub="All-time highest value guests" />
                        </CardHeader>
                        <div className="divide-y divide-slate-50">
                          {gStats.topGuests.map((g: any, i: number) => (
                            <motion.div
                              key={g._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/50"
                            >
                              <span className={cn(
                                'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold',
                                i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400'
                              )}>
                                {i + 1}
                              </span>
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-blue-100 text-sm font-bold text-sky-700">
                                {g.firstName?.[0]}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-900">{g.firstName} {g.lastName}</p>
                                <p className="text-xs text-slate-400">{g.stayCount} stays · <span className="capitalize font-medium text-slate-500">{g.loyalty?.tier}</span></p>
                              </div>
                              <span className="text-sm font-bold text-slate-900">{formatCurrency(g.totalRevenue)}</span>
                              <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
                            </motion.div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {!gStats && (
                      <Card className="border-0 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)]">
                        <CardContent className="py-16 text-center">
                          <Users className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                          <p className="font-medium text-slate-500">No guest data available</p>
                          <p className="mt-1 text-sm text-slate-400">Add guests and complete reservations to see analytics</p>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                POLICE VERIFICATION
            ═══════════════════════════════════════════════════════════════ */}
            {tab === 'police' && (
              <motion.div key="police" {...fadeUp} className="space-y-6">
                {/* Legal Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-50 to-orange-50 p-5 ring-1 ring-rose-100">
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-rose-200/20 blur-2xl" />
                  <div className="relative flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-100">
                      <AlertTriangle className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-rose-900">Legal Requirement — India</p>
                      <p className="mt-1 text-xs leading-relaxed text-rose-700/80">
                        Under Rule 14, Registration of Foreigners Rules 1992 and Hotel and Lodging Houses Act, every hotel must maintain a guest register and submit to local police within 24 hours of check-in. Foreign nationals are mandatory within 24 hours per Foreigners Act 1946.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-slate-100">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <input type="date" value={pStart} onChange={(e) => setPStart(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 outline-none" />
                    <span className="text-xs text-slate-300">to</span>
                    <input type="date" value={pEnd} onChange={(e) => setPEnd(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 outline-none" />
                  </div>

                  <div className="flex items-center gap-1">
                    {[
                      { label: 'Today', start: today, end: today },
                      { label: 'This Month', start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0] },
                      { label: 'This Year', start: `${new Date().getFullYear()}-01-01`, end: `${new Date().getFullYear()}-12-31` },
                    ].map((range) => (
                      <button
                        key={range.label}
                        onClick={() => setPoliceRange(range.start, range.end)}
                        className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-100 transition-all hover:bg-slate-50 active:scale-95"
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-slate-100">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search name, ID, room..."
                      value={pSearch}
                      onChange={(e) => setPSearch(e.target.value)}
                      className="flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                    />
                    {pSearch && (
                      <button onClick={() => setPSearch('')} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>
                    )}
                  </div>

                  <button
                    onClick={exportCSV}
                    className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-200 transition-all hover:bg-emerald-600 active:scale-95"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </button>

                  <button
                    onClick={() => doPrint({ records: filtered, start: pStart, end: pEnd, hotel: hotelMeta })}
                    className="flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-rose-200 transition-all hover:bg-rose-600 active:scale-95"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </button>
                </div>

                {police?.period && (
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <Filter className="h-3 w-3" />
                    {police.period.start} → {police.period.end}
                    {police?.total !== undefined && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600"> {police.total} records</span>}
                  </div>
                )}

                {/* Summary Stats */}
                {police && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      { l: 'Total', v: police?.total ?? 0, color: 'blue', icon: Users },
                      { l: 'Verified', v: police.records?.filter((r: any) => r.idVerified).length ?? 0, color: 'green', icon: CheckCircle2 },
                      { l: 'Pending', v: police.records?.filter((r: any) => !r.idVerified).length ?? 0, color: 'rose', icon: AlertTriangle },
                      { l: 'Foreign', v: police.records?.filter((r: any) => r.nationality !== 'Indian').length ?? 0, color: 'amber', icon: Globe },
                    ].map((s) => {
                      const theme = getTheme(s.color);
                      return (
                        <motion.div
                          key={s.l}
                          variants={fadeUp}
                          whileHover={{ y: -2 }}
                          className={cn('flex items-center gap-4 rounded-2xl border p-5', theme.bg, theme.border)}
                        >
                          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm')}>
                            <s.icon className={cn('h-6 w-6', theme.icon)} />
                          </div>
                          <div>
                            <p className={cn('text-2xl font-bold', theme.text)}>{s.v}</p>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{s.l}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Table */}
                <Card className="overflow-hidden border-0 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)]">
                  <CardHeader className="flex items-center justify-between border-b border-slate-50 px-6 py-5">
                    <div>
                      <h3 className="font-semibold text-slate-900">Guest Register — Form C</h3>
                      <p className="mt-0.5 text-xs text-slate-400">Registration of Foreigners Rules, 1992</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {police && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{filtered.length} records</span>}
                      {filtered.some((r: any) => !r.idVerified) && (
                        <Badge variant="danger"> 
                          <AlertTriangle className="h-3 w-3" />
                          {filtered.filter((r: any) => !r.idVerified).length} unverified
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  {policeLoad ? (
                    <div className="flex justify-center py-16">
                      <Spinner />
                    </div>
                  ) : !filtered.length ? (
                    <div className="py-16 text-center">
                      <FileText className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                      <p className="font-medium text-slate-500">No check-ins in selected period</p>
                      <p className="mt-1 text-sm text-slate-400">Select a date range with actual check-ins</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50/80">
                            {['#','Guest Name','DOB','Gender','Nationality','ID Type','ID Number','Phone','Address','Room','Check-in','Check-out','Purpose','Status','ID Status'].map((h) => (
                              <th key={h} className="whitespace-nowrap px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filtered.map((r: any, i: number) => (
                            <motion.tr
                              key={r.reservationId}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: Math.min(i * 0.02, 0.5) }}
                              className={cn(
                                'group transition-colors hover:bg-sky-50/20',
                                !r.idVerified && 'bg-rose-50/20'
                              )}
                            >
                              <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{i + 1}</td>
                              <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-900">{r.guestName}</td>
                              <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-slate-500">{r.dob || '—'}</td>
                              <td className="px-4 py-3.5 capitalize text-slate-600">{r.gender || '—'}</td>
                              <td className="px-4 py-3.5">
                                <span className={cn(
                                  'whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold',
                                  r.nationality === 'Indian' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-sky-50 text-sky-700 ring-1 ring-sky-100'
                                )}>
                                  {r.nationality}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-slate-600">{(r.idType || '—').replace('_', ' ')}</td>
                              <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-slate-700">{r.idNumber || '—'}</td>
                              <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{r.phone}</td>
                              <td className="px-4 py-3.5 text-xs text-slate-600">
                                <div className="max-w-[240px] whitespace-normal break-words leading-relaxed">{r.address || '—'}</div>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{r.roomNumber}</span>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3.5">
                                <span className="block text-xs font-medium text-slate-700">{r.checkIn}</span>
                                <span className="font-mono text-[10px] text-slate-400">{r.checkInTime}</span>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3.5">
                                {r.checkOut || <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">In-house</span>}
                              </td>
                              <td className="px-4 py-3.5 text-xs capitalize text-slate-600">{r.purposeOfVisit || 'Leisure'}</td>
                              <td className="whitespace-nowrap px-4 py-3.5">
                                <span className={cn(
                                  'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase',
                                  r.status === 'checked_in' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' :
                                  r.status === 'checked_out' ? 'bg-slate-50 text-slate-700 ring-1 ring-slate-100' :
                                  'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
                                )}>
                                  {r.status?.replace('_', ' ') || '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                {r.idVerified ? (
                                  <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-bold text-emerald-600">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    Verified
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-bold text-rose-600">
                                    <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
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
                  <p className="text-center text-xs font-medium text-slate-400">
                    Compliant with Hotel & Lodging Houses Act, India. Export CSV or print for police submission.
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

// ── Helper Components ─────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-20 shadow-sm ring-1 ring-slate-100">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
        <FileText className="h-8 w-8 text-slate-300" />
      </div>
      <p className="text-sm font-semibold text-slate-500">{message}</p>
    </div>
  );
}