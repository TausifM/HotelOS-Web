'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Spinner } from '@/components/ui';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from "qrcode.react"
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
} from 'lucide-react';

import toast from 'react-hot-toast';
import { format } from 'date-fns';

const THEME_GRADIENT = 'bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600';

const STATUS_STYLES: Record<string, string> = {
  present: 'bg-green-100 text-green-700 border-green-200',
  absent: 'bg-gray-100 text-gray-500 border-gray-200',
  halfday: 'bg-amber-100 text-amber-700 border-amber-200',
  leave: 'bg-purple-100 text-purple-700 border-purple-200',
  holiday: 'bg-blue-100 text-blue-700 border-blue-200',
} as const;

const STATUS_LABELS: Record<string, string> = {
  present: 'Present',
  absent: 'Absent',
  halfday: 'Half Day',
  leave: 'Leave',
  holiday: 'Holiday',
} as const;

type AttendanceStatus = keyof typeof STATUS_LABELS;

interface StaffMember {
  _id: string;
  name: string;
  role: string;
  phone?: string;
}

interface AttendanceRecord {
  staffId: { _id: string } | string;
  status?: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  hoursWorked?: number;
}

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  halfday: number;
  leave: number;
}

interface AttendanceResponse {
  records: AttendanceRecord[];
  summary: AttendanceSummary;
}

export default function AttendancePage() {
  const qc = useQueryClient();

  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [selDate, setSelDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [qrModal, setQrModal] = useState({
    open: false,
    token: '',
    qrDataUrl: '',
    expiresAt: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  // STAFF LIST
  const { data: staffList = [] } = useQuery<StaffMember[]>({
    queryKey: ['staff-list'],
    queryFn: async () => {
      const res = await api.get('/api/staff');
      return res.data.data?.docs || [];
    },
  });

  // ATTENDANCE DATA
  const { data: attendanceData, isLoading, refetch } = useQuery<AttendanceResponse>({
    queryKey: ['attendance', viewMode, viewMode === 'daily' ? selDate : month],
    queryFn: async () => {
      const res = await api.get('/api/attendance', {
        params: viewMode === 'daily' ? { date: selDate } : { month },
      });
      return res.data.data;
    },
    refetchInterval: 15000,
  });

  // UPDATE STATUS
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
      toast.success('Status updated successfully');
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Update failed');
    },
  });

  // CLOCK IN
  const clockInMutation = useMutation({
    mutationFn: async (staffId: string) => {
      return api.post('/api/attendance/mark', { staffId, type: 'checkin' });
    },
    onSuccess: () => {
      toast.success('Clocked In Successfully');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Check-in failed');
    },
  });

  // CLOCK OUT
  const clockOutMutation = useMutation({
    mutationFn: async (staffId: string) => {
      return api.post('/api/attendance/mark', { staffId, type: 'checkout' });
    },
    onSuccess: () => {
      toast.success('Clocked Out Successfully');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Check-out failed');
    },
  });

  // EXPORT REPORT
  const exportReport = useCallback(async () => {
    try {
      toast.loading('Generating report...', { id: 'export' });
      const res = await api.get('/api/attendance/export', {
        params: { month },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Attendance-${month}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported successfully', { id: 'export' });
    } catch (error) {
      toast.error('Export failed', { id: 'export' });
    }
  }, [month]);

  // QR MODAL
  const showQR = useCallback(async () => {
    try {
      const { data } = await api.get('/api/attendance/qr-token');
      setQrModal({
        open: true,
        token: data.data.token,
        qrDataUrl: data.data.qrDataUrl,
        expiresAt: data.data.expiresAt,
      });
    } catch (error) {
      toast.error('Failed to generate QR code');
    }
  }, []);

  const closeQRModal = () => {
    setQrModal({ open: false, token: '', qrDataUrl: '', expiresAt: '' });
  };

  const records = attendanceData?.records || [];
  const summary = attendanceData?.summary || {
    total: 0,
    present: 0,
    absent: 0,
    halfday: 0,
    leave: 0,
  };

  const filteredStaff = staffList.filter((staff) => {
    return (
      staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleStatusChange = (staffId: string, status: AttendanceStatus) => {
    updateStatusMutation.mutate({
      staffId,
      status,
      date: viewMode === 'daily' ? selDate : undefined,
    });
  };

  const displayDate =
    viewMode === 'daily'
      ? format(new Date(selDate), 'MMMM dd, yyyy')
      : format(new Date(`${month}-01`), 'MMMM yyyy');

  // Find record helper
  const findRecordForStaff = (staffId: string): AttendanceRecord | undefined => {
    return records.find((r) =>
      (typeof r.staffId === 'string' ? r.staffId : r.staffId?._id) === staffId
    );
  };

  return (
    <DashboardLayout title="Attendance Dashboard">
      <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className={cn('relative overflow-hidden rounded-[2rem] p-8 text-white shadow-2xl shadow-orange-200/40', THEME_GRADIENT)}>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight">
                Staff Attendance
              </h1>
              <p className="opacity-90 font-semibold flex items-center justify-center lg:justify-start gap-2 mt-2 text-lg">
                <Calendar className="w-5 h-5" />
                {displayDate}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
              </div>

              <button
                onClick={showQR}
                className="bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2"
              >
                <QrCode className="w-5 h-5" />
                Terminal
              </button>

              <button
                onClick={exportReport}
                className="bg-white text-orange-600 px-6 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export Report
              </button>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            { label: 'Present', count: summary.present, grad: 'from-green-500 to-emerald-600', icon: CheckCircle },
            { label: 'Leave', count: summary.leave, grad: 'from-purple-500 to-violet-600', icon: FileText },
            { label: 'Half Day', count: summary.halfday, grad: 'from-amber-400 to-orange-500', icon: Clock },
            { label: 'Absent', count: summary.absent, grad: 'from-gray-400 to-gray-600', icon: AlertCircle },
            { label: 'Total Staff', count: summary.total, grad: 'from-blue-500 to-indigo-600', icon: Users },
          ].map(({ label, count, grad, icon: Icon }) => (
            <div key={label} className="group bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-lg hover:shadow-2xl hover:border-orange-200/50 transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <div className={cn('p-3 rounded-2xl bg-gradient-to-br', grad)}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className={cn('text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br', grad)}>
                {count}
              </p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* CONTENT */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-white/90 to-orange-50/30">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-1">
                  Attendance Records
                </h2>
                <p className="text-gray-500">Total Staff: <span className="font-bold text-gray-900">{summary.total}</span></p>
              </div>

              <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                {['daily', 'monthly'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as 'daily' | 'monthly')}
                    className={cn(
                      'px-6 py-2.5 text-sm font-black rounded-xl transition-all',
                      viewMode === mode
                        ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-white'
                    )}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>

              <input
                type={viewMode === 'daily' ? 'date' : 'month'}
                value={viewMode === 'daily' ? selDate : month}
                onChange={(e) => viewMode === 'daily' ? setSelDate(e.target.value) : setMonth(e.target.value)}
                className="bg-white border border-gray-200 rounded-2xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-orange-200"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 backdrop-blur-sm">
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Check In</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Check Out</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <Spinner className="w-8 h-8 mx-auto text-orange-500" />
                      <p className="mt-4 text-gray-500 font-medium">Loading attendance data...</p>
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-500">
                      {searchTerm ? `No staff found matching "${searchTerm}"` : 'No staff data available'}
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((member) => {
                    const rec = findRecordForStaff(member._id);
                    const status = rec?.status || 'absent';
                    const workingHours = rec?.hoursWorked || 0;

                    return (
                      <tr key={member._id} className="hover:bg-orange-50/50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg', THEME_GRADIENT)}>
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-900 text-sm truncate">{member.name}</p>
                              {member.phone && (
                                <p className="text-xs text-gray-500 truncate">{member.phone}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span className="px-2 py-1 bg-gray-100 text-xs font-bold rounded-full text-gray-700">
                            {member.role}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <select
                            value={status}
                            onChange={(e) => handleStatusChange(member._id, e.target.value as AttendanceStatus)}
                            disabled={updateStatusMutation.isPending}
                            className={cn(
                              'w-full max-w-[120px] px-3 py-2 text-sm font-bold rounded-xl border-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all',
                              STATUS_STYLES[status] || 'bg-gray-100 text-gray-500 border-gray-200',
                              updateStatusMutation.isPending && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).map((s) => (
                              <option key={s} value={s}>
                                {STATUS_LABELS[s]}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-6 py-5 text-sm font-mono">
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <LogIn className="w-4 h-4" />
                            {rec?.checkIn ? format(new Date(rec.checkIn), 'hh:mm a') : '--:--'}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-sm font-mono">
                          <span className="flex items-center gap-1 text-pink-600 font-medium">
                            <LogOut className="w-4 h-4" />
                            {rec?.checkOut ? format(new Date(rec.checkOut), 'hh:mm a') : '--:--'}
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
                              className="p-2.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                              title={rec?.checkIn ? 'Already checked in' : 'Clock In'}
                            >
                              <LogIn className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>

                            <button
                              onClick={() => clockOutMutation.mutate(member._id)}
                              disabled={!rec?.checkIn || !!rec?.checkOut || clockOutMutation.isPending}
                              className="p-2.5 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                              title={!rec?.checkIn ? 'Check-in first' : !!rec?.checkOut ? 'Already checked out' : 'Clock Out'}
                            >
                              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ENHANCED QR MODAL */}
      {qrModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 sm:p-6 animate-in fade-in zoom-in duration-300">
          <div className="bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-2xl shadow-black/20  max-h-[95vh] w-full max-w-md relative overflow-hidden border border-white/20">

            {/* Close Button */}
            <button
              onClick={closeQRModal}
              className="absolute right-6 top-6 z-20 p-2.5 bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-gray-200"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Content */}
            <div className="p-8 sm:p-12 relative z-10 h-full flex flex-col">

              {/* Header Icon */}
              <div className={cn('mx-auto mb-8 p-6 rounded-[2.5rem] shadow-2xl shrink-0', THEME_GRADIENT)}>
                <QrCode className="w-14 h-14 mx-auto" />
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-4xl font-black text-gray-900 mb-6 text-center px-4 drop-shadow-sm">
                Check-in Station
              </h2>

              {/* Description */}
              <p className="text-gray-600 text-lg sm:text-xl mb-4 leading-relaxed max-w-sm mx-auto text-center px-4">
                Staff can scan this QR code to mark their entry or exit for today.
              </p>

              {/* QR Container - Fixed Height */}
              <div className="flex-1 flex flex-col items-center justify-center mb-2 shrink-0">
                <div className="bg-gradient-to-br from-gray-50 to-orange-50 shadow-2xl w-full max-w-xs mx-auto">
                  {qrModal.qrDataUrl ? (
                    <img
                      src={qrModal.qrDataUrl}
                      alt="Attendance QR Code"
                      className="w-60 h-60 sm:w-64 sm:h-64 mx-auto block rounded-2xl shadow-xl ring-2 ring-white/50 hover:ring-orange-200/50 transition-all duration-300"
                    />
                  ) : (
                    <div className="w-60 h-60 sm:w-64 sm:h-64 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-lg animate-pulse ring-2 ring-white/50">
                      <QRCodeSVG
                        value={qrModal.token}
                        className="text-gray-400"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Status Bar */}
              <div className="space-y-3 mb-10 px-4 shrink-0">
                <div className="flex items-center justify-center gap-3 text-sm text-gray-600 bg-white/80 py-3 px-6 rounded-2xl shadow-lg border border-gray-200">
                  <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse shadow-lg" />
                  <span className="font-semibold">Live Terminal</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">
                    Active
                  </span>
                </div>

                {qrModal.expiresAt && (
                  <div className="text-center bg-orange-50/80 p-4 rounded-2xl border border-orange-100 shadow-sm">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Expires at midnight</p>
                    <p className="text-xs text-gray-500">
                      {new Date(qrModal.expiresAt).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={closeQRModal}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold py-5 px-8 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 mx-4 mb-6 shrink-0 text-lg"
              >
                Close Terminal
              </button>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-orange-400/30 to-pink-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-orange-500/20 rounded-full blur-2xl" />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}