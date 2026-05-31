'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Download,
  Clock,
  X,
  Calendar,
  LogIn,
  LogOut,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  Search,
  Building2,
  Briefcase,
  Filter,
  RefreshCcw,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Spinner } from '@/components/ui';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

const THEME_GRADIENT =
  'bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600';

const STATUS_STYLES: Record<string, string> = {
  present: 'bg-green-100 text-green-700 border-green-200',
  absent: 'bg-gray-100 text-gray-500 border-gray-200',
  halfday: 'bg-amber-100 text-amber-700 border-amber-200',
  leave: 'bg-purple-100 text-purple-700 border-purple-200',
  holiday: 'bg-blue-100 text-blue-700 border-blue-200',
};

const METHOD_STYLES: Record<string, string> = {
  manual: 'bg-orange-100 text-orange-700 border-orange-200',
  qr: 'bg-pink-100 text-pink-700 border-pink-200',
  biometric: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

const STATUS_LABELS = {
  present: 'Present',
  absent: 'Absent',
  halfday: 'Half Day',
  leave: 'Leave',
  holiday: 'Holiday',
} as const;

const VIEW_OPTIONS = [
  { key: 'daily', label: 'Daily' },
  { key: 'range', label: 'Range' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
] as const;

type ViewMode = (typeof VIEW_OPTIONS)[number]['key'];
type AttendanceStatus = keyof typeof STATUS_LABELS;
type AttendanceMethod = 'manual' | 'qr' | 'biometric';

interface StaffMember {
  _id: string;
  name: string;
  role: string;
  phone?: string;
  department?: string;
  shift?: string;
  employeeId?: string;
  avatar?: string;
}

interface AttendanceRecord {
  _id?: string;
  date: string;
  staffId: StaffMember | string;
  status?: AttendanceStatus;
  method?: AttendanceMethod;
  checkIn?: string;
  checkOut?: string;
  hoursWorked?: number;
  lateMinutes?: number;
  overtimeMinutes?: number;
  markedBy?: { _id?: string; name?: string } | string;
}

interface AttendanceListSummary {
  totalStaff: number;
  totalRecords: number;
  present: number;
  absent: number;
  halfday: number;
  leave: number;
  holiday: number;
  checkedIn: number;
  checkedOut: number;
}

interface AttendanceResponse {
  records: AttendanceRecord[];
  staffList: StaffMember[];
  summary: AttendanceListSummary;
  page?: number;
  totalPages?: number;
  total?: number;
}

interface AttendanceSummaryRow {
  _id: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  leaveDays: number;
  overtimeMinutes: number;
  lateMinutes: number;
  totalHours: number;
}

function getTodayYmd() {
  return format(new Date(), 'yyyy-MM-dd');
}

function getThisMonth() {
  return format(new Date(), 'yyyy-MM');
}

function getThisYear() {
  return format(new Date(), 'yyyy');
}

function getStaffId(value: AttendanceRecord['staffId']) {
  return typeof value === 'string' ? value : value?._id;
}

function getStaffInfo(
  value: AttendanceRecord['staffId']
): Partial<StaffMember> | undefined {
  return typeof value === 'string' ? undefined : value;
}

function fmtTime(value?: string) {
  if (!value) return '--:--';
  try {
    return format(new Date(value), 'hh:mm a');
  } catch {
    return '--:--';
  }
}

function fmtDateLabel(viewMode: ViewMode, selDate: string, fromDate: string, toDate: string, month: string, year: string) {
  if (viewMode === 'daily') return format(new Date(selDate), 'MMMM dd, yyyy');
  if (viewMode === 'range') {
    return `${format(new Date(fromDate), 'dd MMM yyyy')} - ${format(new Date(toDate), 'dd MMM yyyy')}`;
  }
  if (viewMode === 'monthly') return format(new Date(`${month}-01`), 'MMMM yyyy');
  return year;
}

function uniq(values: Array<string | undefined>) {
  return [...new Set(values.filter(Boolean) as string[])].sort((a, b) =>
    a.localeCompare(b)
  );
}

function cleanParams<T extends Record<string, any>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== '' &&
        !(typeof value === 'number' && Number.isNaN(value))
    )
  );
}

function StatCard({
  label,
  count,
  grad,
  icon: Icon,
}: {
  label: string;
  count: number | string;
  grad: string;
  icon: React.ElementType;
}) {
  return (
    <div className="group bg-white/75 backdrop-blur-xl p-5 rounded-3xl border border-white/60 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={cn('p-3 rounded-2xl bg-gradient-to-br shadow-lg', grad)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p
        className={cn(
          'text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br',
          grad
        )}
      >
        {count}
      </p>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mt-2">
        {label}
      </p>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-orange-200',
        className
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
}

export default function AttendancePage() {
  const qc = useQueryClient();

  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [selDate, setSelDate] = useState(getTodayYmd());
  const [fromDate, setFromDate] = useState(getTodayYmd());
  const [toDate, setToDate] = useState(getTodayYmd());
  const [month, setMonth] = useState(getThisMonth());
  const [year, setYear] = useState(getThisYear());

  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [qrModal, setQrModal] = useState({
    open: false,
    token: '',
    qrDataUrl: '',
    expiresAt: '',
  });

  const { data: allStaff = [] } = useQuery<StaffMember[]>({
    queryKey: ['attendance-filter-staff'],
    queryFn: async () => {
      const res = await api.get('/api/staff', {
        params: { limit: 500, isActive: true },
      });
      return res.data?.data?.docs ?? res.data?.data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const roleOptions = useMemo(() => uniq(allStaff.map((s) => s.role)), [allStaff]);
  const departmentOptions = useMemo(
    () => uniq(allStaff.map((s) => s.department)),
    [allStaff]
  );
  const shiftOptions = useMemo(() => uniq(allStaff.map((s) => s.shift)), [allStaff]);

  const queryParams = useMemo(() => {
    const base: Record<string, any> = {
      role: roleFilter || undefined,
      department: departmentFilter || undefined,
      shift: shiftFilter || undefined,
      status: statusFilter || undefined,
      method: methodFilter || undefined,
      staffId: staffFilter || undefined,
      search: searchTerm.trim() || undefined,
      limit: 500,
    };

    if (viewMode === 'daily') base.date = selDate;
    if (viewMode === 'range') {
      base.from = fromDate;
      base.to = toDate;
    }
    if (viewMode === 'monthly') base.month = month;
    if (viewMode === 'yearly') base.year = year;

    return cleanParams(base);
  }, [
    viewMode,
    selDate,
    fromDate,
    toDate,
    month,
    year,
    roleFilter,
    departmentFilter,
    shiftFilter,
    statusFilter,
    methodFilter,
    staffFilter,
    searchTerm,
  ]);

  const {
    data: attendanceData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery<AttendanceResponse>({
    queryKey: ['attendance', queryParams],
    queryFn: async () => {
      const res = await api.get('/api/attendance', { params: queryParams });
      return res.data.data;
    },
    refetchInterval: viewMode === 'daily' ? 15000 : 30000,
  });

  const { data: summaryRows = [] } = useQuery<AttendanceSummaryRow[]>({
    queryKey: ['attendance-summary', queryParams],
    queryFn: async () => {
      const res = await api.get('/api/attendance/summary', {
        params: queryParams,
      });
      return res.data.data ?? [];
    },
    enabled: viewMode !== 'daily',
    staleTime: 15000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      staffId,
      status,
      date,
      notes,
    }: {
      staffId: string;
      status: AttendanceStatus;
      date?: string;
      notes?: string;
    }) => {
      return api.post('/api/attendance/mark', { staffId, status, date, notes });
    },
    onSuccess: () => {
      toast.success('Attendance status updated');
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance-summary'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Update failed');
    },
  });

  const clockInMutation = useMutation({
    mutationFn: async (staffId: string) => {
      return api.post('/api/attendance/mark', { staffId, type: 'checkin' });
    },
    onSuccess: () => {
      toast.success('Clock-in marked');
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance-summary'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Check-in failed');
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async (staffId: string) => {
      return api.post('/api/attendance/mark', { staffId, type: 'checkout' });
    },
    onSuccess: () => {
      toast.success('Clock-out marked');
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance-summary'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Check-out failed');
    },
  });

  const showQR = useCallback(async () => {
    try {
      const { data } = await api.get('/api/attendance/qr-token');

      const token = data.data.token;
      const expiresAt = data.data.expiresAt;
      const scanUrl = `${window.location.origin}/scan?token=${encodeURIComponent(token)}`;

      setQrModal({
        open: true,
        token,
        qrDataUrl: scanUrl,
        expiresAt,
      });
    } catch (error) {
      toast.error('Failed to generate QR token');
    }
  }, []);

  const exportReport = useCallback(async () => {
    try {
      if (viewMode !== 'monthly') {
        toast.error('Current backend export supports monthly report only');
        return;
      }

      toast.loading('Generating report...', { id: 'attendance-export' });

      const res = await api.get('/api/attendance/export', {
        params: { month },
        responseType: 'blob',
      });

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-${month}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Attendance report exported', { id: 'attendance-export' });
    } catch (error) {
      toast.error('Export failed', { id: 'attendance-export' });
    }
  }, [month, viewMode]);

  const closeQRModal = () => {
    setQrModal({
      open: false,
      token: '',
      qrDataUrl: '',
      expiresAt: '',
    });
  };

  const resetFilters = () => {
    setRoleFilter('');
    setDepartmentFilter('');
    setShiftFilter('');
    setStatusFilter('');
    setMethodFilter('');
    setStaffFilter('');
    setSearchTerm('');
  };

  const records = attendanceData?.records ?? [];
  const pageSummary = attendanceData?.summary ?? {
    totalStaff: 0,
    totalRecords: 0,
    present: 0,
    absent: 0,
    halfday: 0,
    leave: 0,
    holiday: 0,
    checkedIn: 0,
    checkedOut: 0,
  };

  const filteredStaffList = attendanceData?.staffList ?? [];
  const recordsByStaff = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const record of records) {
      const id = getStaffId(record.staffId);
      if (id) map.set(id, record);
    }
    return map;
  }, [records]);

  const summaryMap = useMemo(() => {
    const map = new Map<string, AttendanceSummaryRow>();
    for (const row of summaryRows) {
      map.set(row._id, row);
    }
    return map;
  }, [summaryRows]);

  const displayDate = fmtDateLabel(
    viewMode,
    selDate,
    fromDate,
    toDate,
    month,
    year
  );

  const qrRecordsCount = records.filter((r) => r.method === 'qr').length;
  const manualRecordsCount = records.filter((r) => r.method === 'manual').length;

  const handleStatusChange = (staffId: string, status: AttendanceStatus) => {
    updateStatusMutation.mutate({
      staffId,
      status,
      date: selDate,
    });
  };

  const isMutating =
    updateStatusMutation.isPending ||
    clockInMutation.isPending ||
    clockOutMutation.isPending;

  return (
    <DashboardLayout title="Attendance Dashboard">
      <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'relative isolate overflow-hidden rounded-[2.25rem] border border-white/20 p-5 sm:p-7 xl:p-8 text-white shadow-[0_30px_90px_-24px_rgba(249,115,22,0.45)]',
            THEME_GRADIENT
          )}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.16),transparent_24%)]" />
          <div className="pointer-events-none absolute -top-16 left-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute top-0 right-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 backdrop-blur-md shadow-lg">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[11px] font-black uppercase tracking-[0.22em]">
                  Smart attendance
                </span>
              </div>

              <div className="mt-5 max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">
                  Live workforce console
                </p>

                <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl xl:text-6xl">
                  Staff Attendance
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm sm:text-base">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/10 px-3 py-1.5 font-semibold text-white/90">
                    <Calendar className="h-4 w-4" />
                    {displayDate}
                  </span>

                  {isFetching && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/15 px-3 py-1.5 font-semibold text-white/90">
                      <RefreshCcw className="h-4 w-4 animate-spin" />
                      Refreshing live data
                    </span>
                  )}
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                  Track check-ins, check-outs, and staff activity from one clean control
                  panel with faster search and clearer action flow.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/15 bg-white/12 p-4 backdrop-blur-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
                      QR records
                    </span>
                    <QrCode className="h-4 w-4 text-white/80" />
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="text-3xl font-black leading-none">{qrRecordsCount}</p>
                    <span className="rounded-full border border-white/15 bg-black/10 px-2.5 py-1 text-[11px] font-semibold text-white/80">
                      Auto marked
                    </span>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/15 bg-white/12 p-4 backdrop-blur-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
                      Manual records
                    </span>
                    <FileText className="h-4 w-4 text-white/80" />
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="text-3xl font-black leading-none">{manualRecordsCount}</p>
                    <span className="rounded-full border border-white/15 bg-black/10 px-2.5 py-1 text-[11px] font-semibold text-white/80">
                      Desk action
                    </span>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/15 bg-white/12 p-4 backdrop-blur-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
                      Active staff
                    </span>
                    <Users className="h-4 w-4 text-white/80" />
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="text-3xl font-black leading-none">
                      {pageSummary.totalStaff}
                    </p>
                    <span className="rounded-full border border-white/15 bg-black/10 px-2.5 py-1 text-[11px] font-semibold text-white/80">
                      On roster
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full xl:max-w-md">
              <div className="rounded-[1.85rem] border border-white/20 bg-white/12 p-3 sm:p-4 backdrop-blur-2xl shadow-[0_24px_60px_-24px_rgba(15,23,42,0.6)]">
                <div className="mb-3 flex items-start justify-between gap-4 px-1">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
                      Quick actions
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white/90">
                      Search staff, launch QR terminal, and export attendance reports.
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-lg">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, employee ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-14 w-full rounded-2xl border border-white/20 bg-black/10 pl-11 pr-4 text-sm font-medium text-white placeholder:text-white/55 outline-none transition-all focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20"
                  />
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    onClick={showQR}
                    className="group inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/14 px-5 text-sm font-black text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-white/22"
                  >
                    <QrCode className="h-5 w-5 transition-transform group-hover:scale-110" />
                    Open QR Terminal
                  </button>

                  <button
                    onClick={exportReport}
                    className="group inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-orange-600 shadow-xl transition-all hover:-translate-y-0.5 hover:scale-[1.01]"
                  >
                    <Download className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
                    Export Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
          <StatCard
            label="Present"
            count={pageSummary.present}
            grad="from-green-500 to-emerald-600"
            icon={CheckCircle}
          />
          <StatCard
            label="Checked In"
            count={pageSummary.checkedIn}
            grad="from-teal-500 to-cyan-600"
            icon={LogIn}
          />
          <StatCard
            label="Checked Out"
            count={pageSummary.checkedOut}
            grad="from-pink-500 to-rose-600"
            icon={LogOut}
          />
          <StatCard
            label="Half Day"
            count={pageSummary.halfday}
            grad="from-amber-400 to-orange-500"
            icon={Clock}
          />
          <StatCard
            label="Leave"
            count={pageSummary.leave}
            grad="from-purple-500 to-violet-600"
            icon={FileText}
          />
          <StatCard
            label="Absent"
            count={pageSummary.absent}
            grad="from-gray-400 to-gray-600"
            icon={AlertCircle}
          />
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-white/90 to-orange-50/40">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 mb-1">
                    Attendance Records
                  </h2>
                  <p className="text-gray-500">
                    Manage daily marking, review reports, and track attendance patterns.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                    {VIEW_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        onClick={() => setViewMode(option.key)}
                        className={cn(
                          'px-5 py-2.5 text-sm font-black rounded-xl transition-all',
                          viewMode === option.key
                            ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-white'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={resetFilters}
                    className="h-11 px-4 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 bg-white hover:bg-gray-50 transition-all"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
                <div className="xl:col-span-3">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-[0.18em] mb-2 block">
                    <span className="inline-flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5" />
                      Time View
                    </span>
                  </label>

                  {viewMode === 'daily' && (
                    <input
                      type="date"
                      value={selDate}
                      onChange={(e) => setSelDate(e.target.value)}
                      className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 font-medium focus:ring-2 focus:ring-orange-200 outline-none"
                    />
                  )}

                  {viewMode === 'range' && (
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 font-medium focus:ring-2 focus:ring-orange-200 outline-none"
                      />
                      <input
                        type="date"
                        value={toDate}
                        min={fromDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 font-medium focus:ring-2 focus:ring-orange-200 outline-none"
                      />
                    </div>
                  )}

                  {viewMode === 'monthly' && (
                    <input
                      type="month"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 font-medium focus:ring-2 focus:ring-orange-200 outline-none"
                    />
                  )}

                  {viewMode === 'yearly' && (
                    <input
                      type="number"
                      min="2020"
                      max="2100"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 font-medium focus:ring-2 focus:ring-orange-200 outline-none"
                    />
                  )}
                </div>

                <div className="xl:col-span-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-[0.18em] mb-2 block">
                    <span className="inline-flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5" />
                      Role
                    </span>
                  </label>
                  <FilterSelect
                    value={roleFilter}
                    onChange={setRoleFilter}
                    options={roleOptions}
                    placeholder="All Roles"
                  />
                </div>

                <div className="xl:col-span-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-[0.18em] mb-2 block">
                    <span className="inline-flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5" />
                      Department
                    </span>
                  </label>
                  <FilterSelect
                    value={departmentFilter}
                    onChange={setDepartmentFilter}
                    options={departmentOptions}
                    placeholder="All Departments"
                  />
                </div>

                <div className="xl:col-span-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-[0.18em] mb-2 block">
                    Shift
                  </label>
                  <FilterSelect
                    value={shiftFilter}
                    onChange={setShiftFilter}
                    options={shiftOptions}
                    placeholder="All Shifts"
                  />
                </div>

                <div className="xl:col-span-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-[0.18em] mb-2 block">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-orange-200"
                  >
                    <option value="">All Status</option>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="xl:col-span-1.5">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-[0.18em] mb-2 block">
                    Method
                  </label>
                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-orange-200"
                  >
                    <option value="">All Methods</option>
                    <option value="manual">Manual</option>
                    <option value="qr">QR</option>
                    <option value="biometric">Biometric</option>
                  </select>
                </div>

                <div className="xl:col-span-12">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-[0.18em] mb-2 block">
                    Staff
                  </label>
                  <select
                    value={staffFilter}
                    onChange={(e) => setStaffFilter(e.target.value)}
                    className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-orange-200"
                  >
                    <option value="">All Staff</option>
                    {allStaff.map((staff) => (
                      <option key={staff._id} value={staff._id}>
                        {staff.name} {staff.role ? `• ${staff.role}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-20 text-center">
                <Spinner className="w-8 h-8 mx-auto text-orange-500" />
                <p className="mt-4 text-gray-500 font-medium">
                  Loading attendance data...
                </p>
              </div>
            ) : viewMode === 'daily' ? (
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="bg-gray-50/60">
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                      Check In
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                      Check Out
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredStaffList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-gray-500">
                        No staff data available for selected filters
                      </td>
                    </tr>
                  ) : (
                    filteredStaffList.map((member) => {
                      const rec = recordsByStaff.get(member._id);
                      const status = (rec?.status || 'absent') as AttendanceStatus;
                      const workingHours = rec?.hoursWorked || 0;

                      return (
                        <tr
                          key={member._id}
                          className="hover:bg-orange-50/50 transition-colors group"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg',
                                  THEME_GRADIENT
                                )}
                              >
                                {member.name?.charAt(0)?.toUpperCase() || 'S'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-gray-900 text-sm truncate">
                                  {member.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {[member.phone, member.department, member.shift]
                                    .filter(Boolean)
                                    .join(' • ') || 'No extra details'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <span className="px-2.5 py-1 bg-gray-100 text-xs font-bold rounded-full text-gray-700">
                              {member.role}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <select
                              value={status}
                              onChange={(e) =>
                                handleStatusChange(
                                  member._id,
                                  e.target.value as AttendanceStatus
                                )
                              }
                              disabled={updateStatusMutation.isPending}
                              className={cn(
                                'w-full max-w-[130px] px-3 py-2 text-sm font-bold rounded-xl border-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all',
                                STATUS_STYLES[status] ||
                                'bg-gray-100 text-gray-500 border-gray-200',
                                updateStatusMutation.isPending &&
                                'opacity-50 cursor-not-allowed'
                              )}
                            >
                              {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).map(
                                (s) => (
                                  <option key={s} value={s}>
                                    {STATUS_LABELS[s]}
                                  </option>
                                )
                              )}
                            </select>
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={cn(
                                'inline-flex px-2.5 py-1 rounded-full text-xs font-bold border',
                                METHOD_STYLES[rec?.method || 'manual'] ||
                                'bg-gray-100 text-gray-600 border-gray-200'
                              )}
                            >
                              {(rec?.method || 'manual').toUpperCase()}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-sm font-mono">
                            <span className="flex items-center gap-1 text-green-600 font-medium">
                              <LogIn className="w-4 h-4" />
                              {fmtTime(rec?.checkIn)}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-sm font-mono">
                            <span className="flex items-center gap-1 text-pink-600 font-medium">
                              <LogOut className="w-4 h-4" />
                              {fmtTime(rec?.checkOut)}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-bold rounded-full">
                              {workingHours ? `${workingHours.toFixed(1)}h` : '0h'}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => clockInMutation.mutate(member._id)}
                                disabled={!!rec?.checkIn || clockInMutation.isPending}
                                className="p-2.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title={rec?.checkIn ? 'Already checked in' : 'Clock In'}
                              >
                                <LogIn className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => clockOutMutation.mutate(member._id)}
                                disabled={
                                  !rec?.checkIn ||
                                  !!rec?.checkOut ||
                                  clockOutMutation.isPending
                                }
                                className="p-2.5 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                  !rec?.checkIn
                                    ? 'Check-in first'
                                    : !!rec?.checkOut
                                      ? 'Already checked out'
                                      : 'Clock Out'
                                }
                              >
                                <LogOut className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="bg-gray-50/60">
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                      Staff
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                      Shift
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                      Present
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                      Absent
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                      Half Day
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                      Leave
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                      Late
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                      Overtime
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredStaffList.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-16 text-center text-gray-500">
                        No attendance report available for selected filters
                      </td>
                    </tr>
                  ) : (
                    filteredStaffList.map((member) => {
                      const row = summaryMap.get(member._id);

                      return (
                        <tr
                          key={member._id}
                          className="hover:bg-orange-50/40 transition-colors"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg',
                                  THEME_GRADIENT
                                )}
                              >
                                {member.name?.charAt(0)?.toUpperCase() || 'S'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 text-sm truncate">
                                  {member.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {member.phone || member.employeeId || 'No ID'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-sm font-semibold text-gray-700">
                            {member.role || '--'}
                          </td>
                          <td className="px-6 py-5 text-sm text-gray-600">
                            {member.department || '--'}
                          </td>
                          <td className="px-6 py-5 text-sm text-gray-600">
                            {member.shift || '--'}
                          </td>
                          <td className="px-6 py-5">
                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-bold">
                              {row?.presentDays ?? 0}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-bold">
                              {row?.absentDays ?? 0}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-bold">
                              {row?.halfDays ?? 0}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-bold">
                              {row?.leaveDays ?? 0}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-bold">
                              {(row?.totalHours ?? 0).toFixed(1)}h
                            </span>
                          </td>
                          <td className="px-6 py-5 text-sm font-semibold text-gray-700">
                            {row?.lateMinutes ?? 0} min
                          </td>
                          <td className="px-6 py-5 text-sm font-semibold text-gray-700">
                            {row?.overtimeMinutes ?? 0} min
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
        {qrModal.open && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xl">
            <div className="flex min-h-screen items-center justify-center p-2">
              <div className="relative w-full max-w-[92vw] sm:max-w-lg lg:max-w-xl overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-white/20 bg-white/90 shadow-[0_30px_120px_-24px_rgba(15,23,42,0.55)] backdrop-blur-2xl">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(236,72,153,0.12),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_22%)]" />
                <div className="pointer-events-none absolute -top-10 -right-8 h-32 w-32 sm:h-36 sm:w-36 rounded-full bg-gradient-to-br from-orange-400/30 to-pink-500/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-gradient-to-br from-purple-500/20 to-orange-500/20 blur-3xl" />

                <button
                  onClick={closeQRModal}
                  className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white/85 text-gray-500 shadow-lg transition-all hover:scale-[1.03] hover:bg-white hover:text-gray-800"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="relative z-10 max-h-[92vh] overflow-y-auto px-2 pb-4 pt-5 sm:px-6 sm:pb-6 sm:pt-6 lg:pb-8">
                  <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-start">
                    <div
                      className={cn(
                        'flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-[1.4rem] sm:rounded-[1.75rem] shadow-xl',
                        THEME_GRADIENT
                      )}
                    >
                      <QrCode className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                    </div>

                    <div className="min-w-0 flex-1 pr-10">
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live terminal
                      </div>

                      <h2 className="mt-3 text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-gray-900 leading-tight">
                        QR Check-in Terminal
                      </h2>

                      <p className="mt-2 max-w-md text-sm sm:text-[15px] leading-6 sm:leading-7 text-gray-600">
                        Staff can scan this code on mobile to open the attendance scan
                        page and mark check-in or check-out for today.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.6rem] sm:rounded-[2rem] border border-orange-100 bg-gradient-to-br from-white via-orange-50/60 to-pink-50/70 p-3 sm:p-4 sm:shadow-[0_20px_60px_-24px_rgba(249,115,22,0.35)]">
                    <div className="rounded-[1.35rem] sm:rounded-[1.6rem] border border-white p-1 bg-white shadow-xl">
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">
                            Scan access
                          </p>
                        </div>

                        <div className="self-start rounded-xl sm:rounded-2xl border border-orange-100 bg-orange-50 px-2 py-1.5 text-[11px] sm:text-xs font-bold text-orange-700">
                          QR Enabled
                        </div>
                      </div>

                      <div className="flex items-center justify-center rounded-[1.25rem] sm:rounded-[1.5rem] bg-[linear-gradient(180deg,#ffffff_0%,#fff7f2_100%)]">
                        <div className="w-full max-w-[280px] sm:max-w-[320px] rounded-[1.25rem] sm:rounded-[1.5rem] border border-gray-100 bg-white p-3 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)]">
                          {qrModal.qrDataUrl ? (
                            <QRCodeSVG
                              value={qrModal.qrDataUrl}
                              size={220}
                              className="mx-auto block h-auto w-full"
                            />
                          ) : (
                            <QRCodeSVG
                              value={qrModal.token}
                              size={220}
                              className="mx-auto block h-auto w-full"
                            />
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-[1.1rem] sm:rounded-[1.35rem] border border-gray-200 bg-gray-50 px-4 py-3">
                          <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
                            Usage
                          </p>
                          <p className="mt-1 text-sm font-semibold leading-6 text-gray-700">
                            Scan, enter phone, submit attendance
                          </p>
                        </div>

                        <div className="rounded-[1.1rem] sm:rounded-[1.35rem] border border-gray-200 bg-gray-50 px-4 py-3">
                          <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
                            Status
                          </p>
                          <p className="mt-1 text-sm font-semibold text-emerald-700">
                            Active for today
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-5 space-y-3">
                    <div className="flex items-center justify-center gap-3 rounded-[1.1rem] sm:rounded-[1.35rem] border border-gray-200 bg-white/80 px-4 sm:px-5 py-3 text-sm text-gray-600 shadow-sm">
                      <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-center font-semibold">
                        Live hotel attendance terminal
                      </span>
                    </div>

                    {qrModal.expiresAt && (
                      <div className="rounded-[1.2rem] sm:rounded-[1.5rem] border border-orange-100 bg-gradient-to-r from-orange-50 to-pink-50 px-4 sm:px-5 py-4 text-center shadow-sm">
                        <p className="text-sm font-bold text-gray-800">
                          Expires at midnight
                        </p>
                        <p className="mt-1 text-xs sm:text-sm font-medium text-gray-500 leading-6">
                          {new Date(qrModal.expiresAt).toLocaleString('en-IN', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 sm:mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      onClick={closeQRModal}
                      className="inline-flex h-12 sm:h-14 items-center justify-center rounded-[1.15rem] sm:rounded-[1.4rem] border border-gray-200 bg-white px-5 text-sm font-black text-gray-700 shadow-sm transition-all hover:bg-gray-50"
                    >
                      Close Terminal
                    </button>

                    <button
                      onClick={() => {
                        if (qrModal.qrDataUrl) {
                          navigator.clipboard.writeText(qrModal.qrDataUrl);
                          toast.success('Scan link copied');
                        }
                      }}
                      className="inline-flex h-12 sm:h-14 items-center justify-center rounded-[1.15rem] sm:rounded-[1.4rem] bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 px-5 sm:px-6 text-sm font-black text-white shadow-[0_18px_40px_-18px_rgba(236,72,153,0.6)] transition-all hover:scale-[1.01]"
                    >
                      Copy Scan Link
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}