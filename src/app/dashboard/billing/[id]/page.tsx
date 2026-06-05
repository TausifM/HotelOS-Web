'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  BedDouble,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Download,
  FileText,
  IndianRupee,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User,
  Wallet,
  X,
} from 'lucide-react';
import api from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const inp =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all';

function downloadPdf(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {label}
        </span>
        <div
          className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}
        >
          <span className="text-orange-500">{icon}</span>
        </div>
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub ? <p className="text-xs text-gray-400">{sub}</p> : null}
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  iconBg,
  title,
  badge,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div
        className="flex items-center gap-3 border-b border-gray-50 px-5 py-4"
        style={{ background: '#fafafa' }}
      >
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
        <p className="text-sm font-bold text-gray-900 flex-1">{title}</p>
        {badge}
      </div>
      {children}
    </div>
  );
}

function Modal({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  title,
  subtitle,
  icon,
  gradient,
  onClose,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  gradient: string;
  onClose: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between px-6 py-5 text-white"
      style={{ background: gradient }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.2)' }}
        >
          {icon}
        </div>
        <div>
          <p className="font-bold">{title}</p>
          {subtitle ? <p className="text-xs opacity-75">{subtitle}</p> : null}
        </div>
      </div>
      <button
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
        style={{ background: 'rgba(255,255,255,0.2)' }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500">{label}</label>
      {children}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-gray-400 flex-shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-gray-700 break-words">{value}</p>
      </div>
    </div>
  );
}

const TIMELINE_META: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  chargeposted: { label: 'Charge Posted', bg: '#fff7ed', color: '#ea580c' },
  chargevoided: { label: 'Charge Voided', bg: '#fef2f2', color: '#dc2626' },
  paymentposted: { label: 'Payment Received', bg: '#ecfdf5', color: '#16a34a' },
  refundposted: { label: 'Refund', bg: '#eff6ff', color: '#2563eb' },
  foliosettled: { label: 'Folio Settled', bg: '#f0fdf4', color: '#15803d' },
  invoicegenerated: { label: 'Invoice Generated', bg: '#faf5ff', color: '#7c3aed' },
};

export default function FolioDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const qc = useQueryClient();

  const [showSettle, setShowSettle] = useState(false);
  const [showEmailInvoice, setShowEmailInvoice] = useState(false);

  const [settleForm, setSettleForm] = useState({
    mode: 'cash',
    reference: '',
    notes: '',
  });

  const [emailForm, setEmailForm] = useState({
    email: '',
  });

  const {
    data: folio,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['folio', id],
    queryFn: () => api.get(`/api/folios/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: summary } = useQuery({
    queryKey: ['folio-summary', id],
    queryFn: () => api.get(`/api/folios/${id}/summary`).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: timeline } = useQuery({
    queryKey: ['folio-timeline', id],
    queryFn: () => api.get(`/api/folios/${id}/timeline`).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: invoicePreview } = useQuery({
    queryKey: ['folio-invoice-preview', id],
    queryFn: () =>
      api.get(`/api/folios/${id}/invoice-preview`).then((r) => r.data.data),
    enabled: !!id,
  });

  const refresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['folio', id] }),
      qc.invalidateQueries({ queryKey: ['folio-summary', id] }),
      qc.invalidateQueries({ queryKey: ['folio-timeline', id] }),
      qc.invalidateQueries({ queryKey: ['folio-invoice-preview', id] }),
      qc.invalidateQueries({ queryKey: ['folio-bottom-summary'] }),
      qc.invalidateQueries({ queryKey: ['reservations'] }),
      qc.invalidateQueries({ queryKey: ['reservation', folio?.reservationId?._id || folio?.reservationId] }),
    ]);
  };

  const generateInvoice = useMutation({
    mutationFn: async () => {
      const res = await api.post(
        `/api/folios/${id}/generate-invoice`,
        {},
        { responseType: 'blob' }
      );
      downloadPdf(
        res.data,
        `invoice-${summary?.gstInvoiceNo || folio?.folioNumber || id}.pdf`
      );
    },
    onSuccess: async () => {
      toast.success(summary?.gstInvoiceNo ? 'Invoice downloaded' : 'Invoice generated');
      await refresh();
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || 'Failed to generate invoice'),
  });

  const emailInvoice = useMutation({
    mutationFn: (payload: { email: string }) =>
      api.post(`/api/folios/${id}/email-invoice`, payload),
    onSuccess: async () => {
      toast.success('Invoice emailed');
      setShowEmailInvoice(false);
      await refresh();
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || 'Failed to email invoice'),
  });

  const settleFolio = useMutation({
    mutationFn: (payload: any) => api.post(`/api/folios/${id}/settle`, payload),
    onSuccess: async () => {
      toast.success('Folio settled');
      setShowSettle(false);
      setSettleForm({ mode: 'cash', reference: '', notes: '' });
      await refresh();
      // trigger server-side invoice generation so gst invoice number is created
      try {
        await api.post(`/api/folios/${id}/generate-invoice`);
      } catch (e) {
        // ignore non-fatal
      }
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const closeFolio = useMutation({
    mutationFn: () => api.post(`/api/folios/${id}/close`),
    onSuccess: async () => {
      toast.success('Folio closed');
      await refresh();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const guest = folio?.guestId || summary?.guest;
  const reservation = folio?.reservationId || summary?.reservation;
  const activeCharges = useMemo(
    () => (folio?.charges || []).filter((c: any) => !c.isVoid),
    [folio]
  );

  const payments = folio?.payments || [];
  const guestName =
    [guest?.firstName, guest?.lastName].filter(Boolean).join(' ') || 'Guest';
  const balance = Number(summary?.balance ?? folio?.balance ?? 0);
  const isSettled = Boolean(summary?.isSettled ?? folio?.isSettled);
  const invoiceNo = summary?.gstInvoiceNo || folio?.gstInvoiceNo || null;

  if (isLoading) {
    return (
      <DashboardLayout title="Folio Details">
        <div className="flex items-center justify-center py-24">
          <div className="flex items-center gap-3 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading folio...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!folio) {
    return (
      <DashboardLayout title="Folio Details">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}
          >
            <Receipt className="w-8 h-8 text-orange-400" />
          </div>
          <p className="text-gray-400 text-lg font-medium">Folio not found</p>
          <button
            onClick={() => router.push('/dashboard/billing')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Billing
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={folio?.folioNumber || 'Folio Details'}>
      <div className="space-y-5 max-w-6xl pb-10">
        <div
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl px-5 py-6 sm:px-8 sm:py-8 text-white"
          style={{ background: 'linear-gradient(135deg,#F97316 0%,#F43F5E 100%)' }}
        >
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-20"
            style={{ background: 'rgba(255,255,255,0.3)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-6 left-20 h-28 w-28 rounded-full opacity-10"
            style={{ background: 'rgba(255,255,255,0.5)' }}
          />

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative flex-shrink-0">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                style={{
                  background: 'rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(8px)',
                  border: '2px solid rgba(255,255,255,0.4)',
                }}
              >
                <Receipt className="w-9 h-9" />
              </div>

              {invoiceNo ? (
                <div
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: '#16a34a',
                    boxShadow: '0 2px 8px rgba(22,163,74,0.45)',
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              ) : null}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-medium opacity-80">
                  {folio?.folioType || 'guest'} folio
                </span>

                <span
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: isSettled
                      ? 'rgba(34,197,94,0.2)'
                      : 'rgba(255,255,255,0.2)',
                    border: isSettled
                      ? '1px solid rgba(34,197,94,0.35)'
                      : '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  {isSettled ? 'Settled' : 'Open'}
                </span>

                {invoiceNo ? (
                  <span
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: '1px solid rgba(255,255,255,0.25)',
                    }}
                  >
                    {invoiceNo}
                  </span>
                ) : null}
              </div>

              <h1 className="text-2xl font-bold leading-tight">
                {folio?.folioNumber || 'Untitled Folio'}
              </h1>

              <div className="flex items-center gap-4 flex-wrap text-sm opacity-80 mt-2">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {guestName}
                </span>

                {guest?.phone ? (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {guest.phone}
                  </span>
                ) : null}

                {reservation?.roomNumber ? (
                  <span className="flex items-center gap-1.5">
                    <BedDouble className="w-3.5 h-3.5" />
                    Room {reservation.roomNumber}
                  </span>
                ) : null}

                {reservation?.bookingRef ? (
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {reservation.bookingRef}
                  </span>
                ) : null}
              </div>

              <div
                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-bold">
                  {balance > 0
                    ? `${formatCurrency(balance)} pending`
                    : 'No outstanding balance'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap sm:flex-col sm:items-end">
              <button
                onClick={() => router.push('/dashboard/billing')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Billing
              </button>

              <button
                onClick={() => refresh()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {isFetching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Refresh
              </button>

              <button
                onClick={() => generateInvoice.mutate()}
                disabled={generateInvoice.isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-60"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {generateInvoice.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {invoiceNo ? 'Download Invoice' : 'Generate Invoice'}
              </button>

              <button
                onClick={() => {
                  setEmailForm({ email: guest?.email || '' });
                  setShowEmailInvoice(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Mail className="w-3.5 h-3.5" />
                Email Invoice
              </button>

              {!isSettled && balance > 0 ? (
                <button
                  onClick={() => setShowSettle(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: 'rgba(34,197,94,0.25)',
                    border: '1px solid rgba(34,197,94,0.35)',
                  }}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  Settle
                </button>
              ) : (
                <button
                  onClick={() => closeFolio.mutate()}
                  disabled={closeFolio.isPending || balance > 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {closeFolio.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  Close Folio
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<Receipt className="w-3.5 h-3.5" />}
            label="Total Charges"
            value={formatCurrency(summary?.totalCharges || 0)}
            sub={`${summary?.chargeCount ?? activeCharges.length} active charges`}
          />

          <StatCard
            icon={<CreditCard className="w-3.5 h-3.5" />}
            label="Payments"
            value={formatCurrency(summary?.totalPayments || 0)}
            sub={`${summary?.paymentCount ?? payments.length} entries`}
          />

          <StatCard
            icon={<IndianRupee className="w-3.5 h-3.5" />}
            label="Balance"
            value={
              <span className={balance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {formatCurrency(balance)}
              </span>
            }
            sub={balance > 0 ? 'outstanding' : 'fully cleared'}
          />

          <StatCard
            icon={<FileText className="w-3.5 h-3.5" />}
            label="Tax"
            value={formatCurrency(summary?.totalTax || 0)}
            sub={invoiceNo ? 'invoice ready' : 'invoice pending'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 space-y-4">
            <SectionCard
              iconBg="linear-gradient(135deg,#fff7ed,#fff1f2)"
              icon={<User className="h-4 w-4 text-orange-500" />}
              title="Guest & Stay"
            >
              <div className="p-5 space-y-3">
                <DetailRow
                  icon={<User className="w-4 h-4" />}
                  label="Guest"
                  value={guestName}
                />
                <DetailRow
                  icon={<Phone className="w-4 h-4" />}
                  label="Phone"
                  value={guest?.phone}
                />
                <DetailRow
                  icon={<Mail className="w-4 h-4" />}
                  label="Email"
                  value={guest?.email}
                />
                <DetailRow
                  icon={<MapPin className="w-4 h-4" />}
                  label="Room"
                  value={reservation?.roomNumber ? `Room ${reservation.roomNumber}` : undefined}
                />
                <DetailRow
                  icon={<FileText className="w-4 h-4" />}
                  label="Booking Ref"
                  value={reservation?.bookingRef}
                />
                <DetailRow
                  icon={<Calendar className="w-4 h-4" />}
                  label="Check-in"
                  value={reservation?.checkIn ? formatDate(reservation.checkIn) : undefined}
                />
                <DetailRow
                  icon={<Calendar className="w-4 h-4" />}
                  label="Check-out"
                  value={reservation?.checkOut ? formatDate(reservation.checkOut) : undefined}
                />

                {reservation?.nights ? (
                  <div className="pt-3 border-t border-gray-100">
                    <div
                      className="rounded-xl px-3.5 py-2.5"
                      style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
                    >
                      <p className="text-xs font-bold text-blue-800">
                        {reservation.nights} night{reservation.nights > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-blue-600 mt-0.5">
                        Stay duration
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard
              iconBg="linear-gradient(135deg,#f0fdf4,#ecfdf5)"
              icon={<FileText className="h-4 w-4 text-green-600" />}
              title="Invoice Snapshot"
              badge={
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: invoiceNo ? '#ecfdf5' : '#fff7ed',
                    color: invoiceNo ? '#15803d' : '#ea580c',
                  }}
                >
                  {invoiceNo ? 'Generated' : 'Pending'}
                </span>
              }
            >
              <div className="p-5 space-y-3">
                <DetailRow
                  icon={<Receipt className="w-4 h-4" />}
                  label="Invoice No"
                  value={invoiceNo || 'Not generated'}
                />
                <DetailRow
                  icon={<Calendar className="w-4 h-4" />}
                  label="Invoice Date"
                  value={
                    summary?.gstInvoiceDate
                      ? formatDate(summary.gstInvoiceDate)
                      : undefined
                  }
                />
                <DetailRow
                  icon={<IndianRupee className="w-4 h-4" />}
                  label="Subtotal"
                  value={formatCurrency(invoicePreview?.subtotal || 0)}
                />
                <DetailRow
                  icon={<IndianRupee className="w-4 h-4" />}
                  label="CGST"
                  value={formatCurrency(invoicePreview?.cgst || 0)}
                />
                <DetailRow
                  icon={<IndianRupee className="w-4 h-4" />}
                  label="SGST"
                  value={formatCurrency(invoicePreview?.sgst || 0)}
                />
                <DetailRow
                  icon={<IndianRupee className="w-4 h-4" />}
                  label="IGST"
                  value={formatCurrency(invoicePreview?.igst || 0)}
                />
                <DetailRow
                  icon={<IndianRupee className="w-4 h-4" />}
                  label="Total"
                  value={formatCurrency(invoicePreview?.total || 0)}
                />
                <DetailRow
                  icon={<Wallet className="w-4 h-4" />}
                  label="Amount Paid"
                  value={formatCurrency(invoicePreview?.amountPaid || 0)}
                />
              </div>
            </SectionCard>

            <SectionCard
              iconBg="linear-gradient(135deg,#eff6ff,#dbeafe)"
              icon={<Sparkles className="h-4 w-4 text-blue-500" />}
              title="Settlement Status"
            >
              <div className="p-5 space-y-3">
                <div
                  className="rounded-xl px-3.5 py-3"
                  style={{
                    background: isSettled ? '#ecfdf5' : '#fff7ed',
                    border: isSettled ? '1px solid #bbf7d0' : '1px solid #fed7aa',
                  }}
                >
                  <p
                    className="text-xs font-bold"
                    style={{ color: isSettled ? '#166534' : '#c2410c' }}
                  >
                    {isSettled ? 'Folio is settled' : 'Folio is still open'}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: isSettled ? '#15803d' : '#ea580c' }}
                  >
                    {balance > 0
                      ? `${formatCurrency(balance)} needs to be collected`
                      : 'No pending amount'}
                  </p>
                </div>

                {summary?.settledAt ? (
                  <DetailRow
                    icon={<Clock3 className="w-4 h-4" />}
                    label="Settled At"
                    value={formatDate(summary.settledAt)}
                  />
                ) : null}

                <DetailRow
                  icon={<FileText className="w-4 h-4" />}
                  label="Settlement Type"
                  value={summary?.settlementType || folio?.settlementType || 'standard'}
                />
              </div>
            </SectionCard>
          </div>

          <div className="lg:col-span-2 space-y-5">
            <SectionCard
              iconBg="linear-gradient(135deg,#fff7ed,#fff1f2)"
              icon={<Receipt className="h-4 w-4 text-orange-500" />}
              title="Charges"
              badge={
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: 'linear-gradient(135deg,#fff7ed,#fff1f2)',
                    color: '#ea580c',
                  }}
                >
                  {activeCharges.length} items
                </span>
              }
            >
              {!activeCharges.length ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}
                  >
                    <Receipt className="w-7 h-7 text-orange-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">No charges yet</p>
                  <p className="text-xs text-gray-400">
                    This folio has no active charge lines.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {activeCharges.map((c: any) => (
                    <div
                      key={c._id || c.id}
                      className="px-5 py-4 flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">
                            {c.description}
                          </p>
                          <span
                            className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase"
                            style={{ background: '#f1f5f9', color: '#475569' }}
                          >
                            {c.department}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Qty {c.quantity || 1} · Unit {formatCurrency(c.unitPrice || c.amount || 0)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {c.postedAt ? formatDate(c.postedAt) : '-'}
                          {c.hsnSacCode ? ` · HSN/SAC ${c.hsnSacCode}` : ''}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">
                          {formatCurrency((c.amount || 0) + (c.taxAmount || 0))}
                        </p>
                        <p className="text-xs text-gray-500">
                          Base {formatCurrency(c.amount || 0)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Tax {formatCurrency(c.taxAmount || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              iconBg="linear-gradient(135deg,#ecfdf5,#f0fdf4)"
              icon={<CreditCard className="h-4 w-4 text-green-600" />}
              title="Payments"
              badge={
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ background: '#ecfdf5', color: '#15803d' }}
                >
                  {payments.length} entries
                </span>
              }
            >
              {!payments.length ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#ecfdf5,#f0fdf4)' }}
                  >
                    <Wallet className="w-7 h-7 text-green-500" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">No payments yet</p>
                  <p className="text-xs text-gray-400">
                    Payments will appear here after collection.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {payments.map((p: any) => (
                    <div
                      key={p._id || p.id}
                      className="px-5 py-4 flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900 capitalize">
                            {p.isRefund ? 'Refund' : 'Payment'} · {p.mode}
                          </p>
                          <span
                            className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase"
                            style={{
                              background: p.isRefund ? '#eff6ff' : '#ecfdf5',
                              color: p.isRefund ? '#2563eb' : '#15803d',
                            }}
                          >
                            {p.isRefund ? 'refund' : 'received'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {p.reference || 'No reference'}
                          {p.utr ? ` · UTR ${p.utr}` : ''}
                          {p.gatewayTxnId ? ` · TXN ${p.gatewayTxnId}` : ''}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {p.paidAt ? formatDate(p.paidAt) : '-'}
                        </p>
                        {p.notes ? (
                          <p className="text-xs text-gray-500 mt-1">{p.notes}</p>
                        ) : null}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p
                          className={cn(
                            'text-sm font-bold',
                            p.isRefund ? 'text-blue-600' : 'text-green-700'
                          )}
                        >
                          {formatCurrency(p.amount || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              iconBg="linear-gradient(135deg,#f5f3ff,#faf5ff)"
              icon={<Clock3 className="h-4 w-4 text-violet-500" />}
              title="Timeline"
              badge={
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ background: '#faf5ff', color: '#7c3aed' }}
                >
                  {(timeline || []).length} events
                </span>
              }
            >
              {!(timeline || []).length ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#f5f3ff,#faf5ff)' }}
                  >
                    <Clock3 className="w-7 h-7 text-violet-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">No timeline events</p>
                  <p className="text-xs text-gray-400">
                    Charge, payment, settlement, and invoice events show here.
                  </p>
                </div>
              ) : (
                <div className="p-5 space-y-3">
                  {(timeline || []).map((event: any, index: number) => {
                    const meta =
                      TIMELINE_META[event.type] || {
                        label: event.type,
                        bg: '#f8fafc',
                        color: '#475569',
                      };

                    return (
                      <div
                        key={`${event.type}-${event.chargeId || event.paymentId || index}`}
                        className="rounded-xl border border-gray-100 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase"
                                style={{ background: meta.bg, color: meta.color }}
                              >
                                {meta.label}
                              </span>
                              {event.invoiceNo ? (
                                <span className="font-mono text-xs text-gray-500">
                                  {event.invoiceNo}
                                </span>
                              ) : null}
                            </div>

                            <p className="text-sm text-gray-800 mt-2">
                              {event.description || event.mode || event.reason || 'Activity recorded'}
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                              {event.at ? formatDate(event.at) : '-'}
                            </p>

                            {event.by?.name ? (
                              <p className="text-xs text-gray-500 mt-1">
                                By {event.by.name}
                              </p>
                            ) : null}
                          </div>

                          {typeof event.amount === 'number' ? (
                            <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                              {formatCurrency(event.amount)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>

      {showSettle ? (
        <Modal onClose={() => setShowSettle(false)}>
          <ModalHeader
            title="Settle Folio"
            subtitle={folio?.folioNumber}
            icon={<Wallet className="w-4 h-4" />}
            gradient="linear-gradient(135deg,#22c55e,#16a34a)"
            onClose={() => setShowSettle(false)}
          />
          <form
            className="p-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              settleFolio.mutate(settleForm);
            }}
          >
            <div
              className="rounded-xl p-4"
              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
            >
              <p className="text-sm font-bold text-green-800">
                Outstanding amount: {formatCurrency(balance)}
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                Final payment will be posted and the folio will be marked settled.
              </p>
            </div>

            <Field label="Payment Mode">
              <select
                className={inp}
                value={settleForm.mode}
                onChange={(e) =>
                  setSettleForm((p) => ({ ...p, mode: e.target.value }))
                }
              >
                {[
                  'cash',
                  'card',
                  'upi',
                  'netbanking',
                  'cheque',
                  'directbilling',
                  'loyaltypoints',
                  'razorpay',
                  'stripe',
                  'wallet',
                ].map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Reference">
              <input
                className={inp}
                value={settleForm.reference}
                onChange={(e) =>
                  setSettleForm((p) => ({ ...p, reference: e.target.value }))
                }
                placeholder="UTR / card / receipt no."
              />
            </Field>

            <Field label="Notes">
              <textarea
                className={`${inp} resize-none`}
                rows={3}
                value={settleForm.notes}
                onChange={(e) =>
                  setSettleForm((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="Final settlement note"
              />
            </Field>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSettle(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={settleFolio.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                  boxShadow: '0 4px 14px rgba(34,197,94,0.35)',
                }}
              >
                {settleFolio.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Settling...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirm Settlement
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {showEmailInvoice ? (
        <Modal onClose={() => setShowEmailInvoice(false)}>
          <ModalHeader
            title="Email Invoice"
            subtitle={invoiceNo || folio?.folioNumber}
            icon={<Mail className="w-4 h-4" />}
            gradient="linear-gradient(135deg,#6366f1,#4f46e5)"
            onClose={() => setShowEmailInvoice(false)}
          />
          <form
            className="p-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              emailInvoice.mutate(emailForm);
            }}
          >
            <div
              className="rounded-xl p-4"
              style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
            >
              <p className="text-sm font-bold text-blue-800">
                Email current invoice PDF
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                Generate the invoice first if no GST invoice number exists yet.
              </p>
            </div>

            <Field label="Recipient Email">
              <input
                type="email"
                className={inp}
                value={emailForm.email}
                onChange={(e) =>
                  setEmailForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="guest@example.com"
                required
              />
            </Field>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowEmailInvoice(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={emailInvoice.isPending || !emailForm.email.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                  boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
                }}
              >
                {emailInvoice.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    Send Invoice
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </DashboardLayout>
  );
}