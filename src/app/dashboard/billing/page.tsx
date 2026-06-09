'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  Modal,
  Table,
  Th,
  Td,
  Tr,
  EmptyState,
  Spinner,
} from '@/components/ui';
import api from '@/lib/api';
import { cn, formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import {
  Receipt,
  Plus,
  Download,
  CreditCard,
  Trash2,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Send,
  BedDouble,
  Utensils,
  ShieldCheck,
  FileText,
  Clock3,
  IndianRupee,
  Wallet,
  Mail,
  Percent,
  RotateCcw,
  Scale,
  XCircle,
  ArrowRightLeft,
  CalendarDays,
  Activity,
  UserCircle2,
  Sparkles,
  Eye,
  RefreshCw,
  Loader2,
  FileDown,
  Phone,
  Calendar,
  ChevronRight,
  Search,
  MoreHorizontal,
  ExternalLink,
  FileWarning,
  CheckCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SectionTitle } from '@/components/components/ui/card';

interface Charge {
  id: string;
  description: string;
  department: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxPct: number;
  taxAmount: number;
  postedAt: string;
  postedBy?: {
    name?: string;
    role?: string;
  };
  addedByType?: 'staff' | 'owner';
  staffName?: string;
  staffRole?: string;
  approvalRequired?: boolean;
  approvalNote?: string;
  ownerApprovedBy?: {
    name?: string;
    role?: string;
  };
  isVoid: boolean;
  voidReason?: string;
}

interface Payment {
  id: string;
  amount: number;
  mode: string;
  reference?: string;
  paidAt: string;
  receivedBy?: { name?: string };
  isRefund: boolean;
  notes?: string;
}

interface Folio {
  id: string;
  folioNumber: string;
  folioType?: string;
  settlementType?: string;
  totalCharges: number;
  totalPayments: number;
  balance: number;
  cgst: number;
  sgst: number;
  igst?: number;
  totalTax: number;
  isSettled: boolean;
  settledAt?: string;
  gstInvoiceNo?: string;
  gstInvoiceDate?: string;
  charges: Charge[];
  payments: Payment[];
  guestId?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    address?: any;
  };
  reservationId?: {
    bookingRef?: string;
    roomNumber?: string;
    checkIn?: string;
    checkOut?: string;
    nights?: number;
  };
}

const DEPT_LABELS: Record<string, string> = {
  room: 'Room Charges',
  fb: 'Food & Beverage',
  spa: 'Spa',
  laundry: 'Laundry',
  transport: 'Transport',
  misc: 'Miscellaneous',
  tax: 'Tax',
  discount: 'Discount',
  refund: 'Refund',
};

const DEPT_COLORS: Record<string, string> = {
  room: 'bg-blue-100 text-blue-800',
  fb: 'bg-green-100 text-green-800',
  spa: 'bg-purple-100 text-purple-800',
  laundry: 'bg-cyan-100 text-cyan-800',
  transport: 'bg-orange-100 text-orange-800',
  misc: 'bg-slate-100 text-slate-700',
  tax: 'bg-yellow-100 text-yellow-800',
  discount: 'bg-emerald-100 text-emerald-800',
  refund: 'bg-rose-100 text-rose-800',
};

const PAYMENT_MODE_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
  net_banking: 'Net Banking',
  cheque: 'Cheque',
  direct_billing: 'Direct Billing',
  loyalty_points: 'Loyalty Points',
  razorpay: 'Razorpay',
  stripe: 'Stripe',
  wallet: 'Wallet',
};

function ActionCard({
  icon,
  title,
  subtitle,
  onClick,
  tone = 'default',
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
  tone?: 'default' | 'danger' | 'success' | 'warning';
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-rose-200 bg-rose-50/80'
      : tone === 'success'
        ? 'border-emerald-200 bg-emerald-50/80'
        : tone === 'warning'
          ? 'border-amber-200 bg-amber-50/80'
          : 'border-white/60 bg-white/85';

  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-3xl border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg',
        toneClass
      )}
      type="button"
    >
      <div className="mb-3 inline-flex rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 p-2.5 text-white shadow">
        {icon}
      </div>
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
    </button>
  );
}

function FolioListPanel({
  onSelect,
  selectedFolioId,
}: {
  onSelect: (id: string) => void;
  selectedFolioId?: string | null;
}) {
  const [search, setSearch] = useState('');
  const [listType, setListType] = useState<'open' | 'unsettled'>('open');

  const { data, isLoading } = useQuery({
    queryKey: ['folios-list', listType],
    queryFn: () => api.get(`/api/folios/${listType}`).then((r) => r.data.data),
  });

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    const rows = data || [];
    if (!term) return rows;

    return rows.filter((f: any) => {
      const guest =
        `${f.guestId?.firstName || ''} ${f.guestId?.lastName || ''}`.toLowerCase();
      const room = String(f.reservationId?.roomNumber || '').toLowerCase();
      const ref = String(f.reservationId?.bookingRef || '').toLowerCase();
      const folioNo = String(f.folioNumber || '').toLowerCase();
      const phone = String(f.guestId?.phone || '').toLowerCase();

      return (
        guest.includes(term) ||
        room.includes(term) ||
        ref.includes(term) ||
        folioNo.includes(term) ||
        phone.includes(term)
      );
    });
  }, [data, search]);

  const totalDue = useMemo(
    () =>
      (filtered || []).reduce(
        (sum: number, f: any) => sum + Number(f?.balance || 0),
        0
      ),
    [filtered]
  );

  return (
    <Card className="overflow-hidden border-white/60 bg-white/85 shadow-xl backdrop-blur">
      <CardHeader className="border-b border-orange-100 bg-gradient-to-r from-orange-50 via-pink-50 to-rose-50 p-0">
        <div className="relative overflow-hidden px-5 py-5">
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20"
            style={{ background: 'rgba(249,115,22,0.25)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-6 left-10 h-20 w-20 rounded-full opacity-20"
            style={{ background: 'rgba(236,72,153,0.22)' }}
          />

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg"
                style={{
                  background: 'linear-gradient(135deg,#F97316,#F43F5E)',
                  boxShadow: '0 10px 24px rgba(249,115,22,0.28)',
                }}
              >
                <Receipt className="h-5 w-5" />
              </div>

              <div>
                <p className="text-lg font-bold text-slate-900">Folio Queue</p>
                <p className="text-xs text-slate-600">
                  Open balances and unsettled guest folios
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-white/70">
                {(filtered || []).length} folios
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              View
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900 capitalize">
              {listType}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-500">
              Queue Due
            </p>
            <p className="mt-1 text-sm font-bold text-rose-700">
              {formatCurrency(totalDue)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setListType('open')}
            className={cn(
              'rounded-xl px-3 py-2.5 text-sm font-bold transition-all',
              listType === 'open'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-orange-200'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            Open Folios
          </button>

          <button
            type="button"
            onClick={() => setListType('unsettled')}
            className={cn(
              'rounded-xl px-3 py-2.5 text-sm font-bold transition-all',
              listType === 'unsettled'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-orange-200'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            Unsettled
          </button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-10"
            placeholder="Search guest, folio, booking, room, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !filtered?.length ? (
          <EmptyState
            title="No folios found"
            description="Try another filter or search term."
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((f: any) => {
              const folioId = String(f?._id || f?.id || '');
              const guestName =
                `${f.guestId?.firstName || ''} ${f.guestId?.lastName || ''}`.trim() ||
                'Guest';
              const selected = selectedFolioId === folioId;
              const phone = f.guestId?.phone || '';
              const room = f.reservationId?.roomNumber || '-';
              const bookingRef = f.reservationId?.bookingRef || '-';
              const checkIn = f.reservationId?.checkIn
                ? formatDate(f.reservationId.checkIn)
                : null;
              const checkOut = f.reservationId?.checkOut
                ? formatDate(f.reservationId.checkOut)
                : null;

              return (
                <button
                  key={folioId}
                  type="button"
                  onClick={() => onSelect(folioId)}
                  className={cn(
                    'group w-full rounded-2xl border px-4 py-4 text-left shadow-sm transition-all',
                    selected
                      ? 'border-orange-200 bg-gradient-to-r from-orange-50 via-rose-50 to-white ring-1 ring-orange-200 shadow-md'
                      : 'border-slate-100 bg-white hover:border-orange-100 hover:bg-orange-50/40 hover:shadow-md'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow"
                      style={{
                        background: selected
                          ? 'linear-gradient(135deg,#F97316,#F43F5E)'
                          : 'linear-gradient(135deg,#fb923c,#f472b6)',
                      }}
                    >
                      {guestName?.[0] || 'G'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {guestName}
                            </p>

                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[11px] font-bold',
                                f.isSettled
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              )}
                            >
                              {f.isSettled ? 'Settled' : 'Due'}
                            </span>
                          </div>

                          <p className="mt-1 font-mono text-[11px] text-slate-500">
                            {f.folioNumber || '-'}
                          </p>
                        </div>

                        <div className="text-right">
                          <p
                            className={cn(
                              'text-sm font-bold',
                              Number(f.balance || 0) > 0
                                ? 'text-rose-600'
                                : 'text-emerald-600'
                            )}
                          >
                            {formatCurrency(f.balance || 0)}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {Number(f.balance || 0) > 0 ? 'Outstanding' : 'Cleared'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Booking
                          </p>
                          <p className="mt-0.5 text-xs font-medium text-slate-700">
                            {bookingRef}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Room
                          </p>
                          <p className="mt-0.5 text-xs font-medium text-slate-700">
                            Room {room}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        {phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            {phone}
                          </span>
                        ) : null}

                        {checkIn ? (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {checkIn}
                            {checkOut ? ` → ${checkOut}` : ''}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <ChevronRight
                      className={cn(
                        'mt-1 h-4 w-4 flex-shrink-0 transition-all',
                        selected
                          ? 'text-orange-500'
                          : 'text-slate-300 group-hover:text-orange-400'
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

function ReconciliationPanel() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  const { data, isLoading } = useQuery({
    queryKey: ['folio-reconciliation', date],
    queryFn: () =>
      api
        .get('/api/folios/reconciliation/daily', {
          params: { date },
        })
        .then((r) => r.data.data),
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-50 px-5 py-4"
        style={{ background: '#fafafa' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}
          >
            <CalendarDays className="h-4 w-4 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Daily Reconciliation</p>
            <p className="text-xs text-gray-500">
              Cashier and finance summary for the selected business date
            </p>
          </div>
        </div>

        <div className="w-48">
          <Input
            label="Business Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-5 p-5">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !data ? (
          <EmptyState title="No reconciliation data" />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Charges
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatCurrency(data.totals?.totalCharges || 0)}
                </p>
                <p className="text-xs text-slate-400">All charge lines posted</p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  Total Payments
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-700">
                  {formatCurrency(data.totals?.totalPayments || 0)}
                </p>
                <p className="text-xs text-emerald-500">Collected across all payment modes</p>
              </div>

              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
                  Outstanding
                </p>
                <p className="mt-2 text-2xl font-bold text-rose-700">
                  {formatCurrency(data.totals?.totalBalance || 0)}
                </p>
                <p className="text-xs text-rose-500">Still pending at folio level</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <Table>
                <thead>
                  <tr>
                    <Th>Folio</Th>
                    <Th>Guest</Th>
                    <Th>Booking</Th>
                    <Th>Room</Th>
                    <Th>Charges</Th>
                    <Th>Payments</Th>
                    <Th>Balance</Th>
                    <Th>Invoice</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>

                <tbody>
                  {data.rows?.map((row: any, index: number) => {
                    const rowKey = String(
                      row?.folioId || row?.folioNumber || `recon-${index}`
                    );

                    return (
                      <Tr key={rowKey}>
                        <Td>
                          <div className="space-y-1">
                            <p className="font-mono text-xs font-semibold text-slate-700">
                              {row.folioNumber || '-'}
                            </p>
                            <p className="text-[11px] text-slate-400">{row.folioId || '-'}</p>
                          </div>
                        </Td>

                        <Td className="text-sm font-medium text-slate-800">
                          {row.guestName || '-'}
                        </Td>

                        <Td className="text-xs text-slate-500">
                          {row.bookingRef || '-'}
                        </Td>

                        <Td className="text-sm text-slate-700">
                          {row.roomNumber || '-'}
                        </Td>

                        <Td className="font-medium text-slate-900">
                          {formatCurrency(row.totalCharges || 0)}
                        </Td>

                        <Td className="font-medium text-emerald-700">
                          {formatCurrency(row.totalPayments || 0)}
                        </Td>

                        <Td
                          className={cn(
                            'font-semibold',
                            row.balance > 0 ? 'text-rose-600' : 'text-emerald-600'
                          )}
                        >
                          {formatCurrency(row.balance || 0)}
                        </Td>

                        <Td>
                          {row.gstInvoiceNo ? (
                            <span className="font-mono text-xs text-slate-600">
                              {row.gstInvoiceNo}
                            </span>
                          ) : (
                            <span className="text-xs text-amber-600">Pending</span>
                          )}
                        </Td>

                        <Td>
                          {row.settled ? (
                            <Badge variant="success">Settled</Badge>
                          ) : (
                            <Badge variant="danger">Open</Badge>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FolioDetailPanel({ folioId }: { folioId: string }) {
  const qc = useQueryClient();
  const { user, hasRole, isHydrated } = useAuth();

  const currentUserName = user?.name || user?.email || 'Current User';
  const currentUserRole = user?.role || 'Staff';

  const isOwnerUser =
    hasRole('owner', 'superadmin') ||
    ['owner', 'admin', 'super_admin', 'superadmin'].includes(
      String(currentUserRole).toLowerCase()
    );

  const [activeTab, setActiveTab] = useState<'overview' | 'charges' | 'payments' | 'timeline' | 'invoice'>('overview');
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const [chargeForm, setChargeForm] = useState({
    description: '',
    department: 'fb',
    amount: '',
    quantity: '1',
    taxPct: '5',
    addedByType: 'staff' as 'staff' | 'owner',
    staffName: '',
    staffRole: '',
    approvalRequired: false,
    approvalNote: '',
  });

  const [payForm, setPayForm] = useState({
    amount: '',
    mode: 'cash',
    reference: '',
    notes: '',
  });

  const [discountForm, setDiscountForm] = useState({
    description: '',
    amount: '',
    reason: '',
  });

  const [refundForm, setRefundForm] = useState({
    amount: '',
    mode: 'cash',
    reference: '',
    notes: '',
  });

  const [advanceForm, setAdvanceForm] = useState({
    amount: '',
    reference: '',
    notes: '',
  });

  const [settleForm, setSettleForm] = useState({
    mode: 'cash',
    reference: '',
    notes: '',
  });

  const [emailForm, setEmailForm] = useState({
    email: '',
  });

  function openChargeModal(mode: 'staff' | 'owner' = isOwnerUser ? 'owner' : 'staff') {
    setChargeForm({
      description: '',
      department: 'fb',
      amount: '',
      quantity: '1',
      taxPct: '5',
      addedByType: mode,
      staffName: currentUserName,
      staffRole: currentUserRole,
      approvalRequired: false,
      approvalNote: '',
    });
    setShowChargeModal(true);
  }

  const { data: folio, isLoading } = useQuery<Folio>({
    queryKey: ['folio', folioId],
    queryFn: () => api.get(`/api/folios/${folioId}`).then((r) => r.data.data),
    refetchInterval: 15000,
    enabled: !!folioId && isHydrated,
  });

  const { data: summary } = useQuery({
    queryKey: ['folio-summary', folioId],
    queryFn: () => api.get(`/api/folios/${folioId}/summary`).then((r) => r.data.data),
    enabled: !!folioId && isHydrated,
  });

  const { data: timeline } = useQuery({
    queryKey: ['folio-timeline', folioId],
    queryFn: () => api.get(`/api/folios/${folioId}/timeline`).then((r) => r.data.data),
    enabled: !!folioId && activeTab === 'timeline' && isHydrated,
  });

  const { data: invoicePreview } = useQuery({
    queryKey: ['folio-invoice-preview', folioId],
    queryFn: () => api.get(`/api/folios/${folioId}/invoice-preview`).then((r) => r.data.data),
    enabled: !!folioId && activeTab === 'invoice' && isHydrated,
  });

  const { data: checkoutValidation, refetch: refetchCheckoutValidation } = useQuery({
    queryKey: ['folio-checkout-validate', folioId],
    queryFn: () => api.post(`/api/folios/${folioId}/checkout-validate`).then((r) => r.data.data),
    enabled: false,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['folio', folioId] });
    qc.invalidateQueries({ queryKey: ['folio-summary', folioId] });
    qc.invalidateQueries({ queryKey: ['folio-timeline', folioId] });
    qc.invalidateQueries({ queryKey: ['folio-invoice-preview', folioId] });
    qc.invalidateQueries({ queryKey: ['folios-list'] });
    qc.invalidateQueries({ queryKey: ['folio-reconciliation'] });
  };

  const postCharge = useMutation({
    mutationFn: (d: any) => api.post(`/api/folios/${folioId}/charges`, d),
    onSuccess: () => {
      toast.success('Charge posted');
      invalidateAll();
      setShowChargeModal(false);
      setChargeForm({
        description: '',
        department: 'fb',
        amount: '',
        quantity: '1',
        taxPct: '5',
        addedByType: isOwnerUser ? 'owner' : 'staff',
        staffName: currentUserName,
        staffRole: currentUserRole,
        approvalRequired: false,
        approvalNote: '',
      });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const postPayment = useMutation({
    mutationFn: (d: any) => api.post(`/api/folios/${folioId}/payments`, d),
    onSuccess: () => {
      toast.success('Payment recorded');
      invalidateAll();
      setShowPayModal(false);
      setPayForm({ amount: '', mode: 'cash', reference: '', notes: '' });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const addDiscount = useMutation({
    mutationFn: (d: any) => api.post(`/api/folios/${folioId}/discounts`, d),
    onSuccess: () => {
      toast.success('Discount applied');
      invalidateAll();
      setShowDiscountModal(false);
      setDiscountForm({ description: '', amount: '', reason: '' });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const postRefund = useMutation({
    mutationFn: (d: any) => api.post(`/api/folios/${folioId}/refunds`, d),
    onSuccess: () => {
      toast.success('Refund recorded');
      invalidateAll();
      setShowRefundModal(false);
      setRefundForm({ amount: '', mode: 'cash', reference: '', notes: '' });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const adjustAdvance = useMutation({
    mutationFn: (d: any) => api.post(`/api/folios/${folioId}/advance-adjust`, d),
    onSuccess: () => {
      toast.success('Advance adjusted');
      invalidateAll();
      setShowAdvanceModal(false);
      setAdvanceForm({ amount: '', reference: '', notes: '' });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const settleFolio = useMutation({
    mutationFn: (d: any) => api.post(`/api/folios/${folioId}/settle`, d),
    onSuccess: async () => {
      qc.setQueryData(['reservation', folio?.reservationId], (old: any) =>
        !old
          ? old
          : {
            ...old,
            balanceDue: 0,
            folioId: {
              ...old.folioId,
              balance: 0,
              status: 'settled',
            },
          }
      );

      await Promise.all([
        qc.invalidateQueries({ queryKey: ['reservation', folio?.reservationId] }),
        qc.invalidateQueries({ queryKey: ['reservations'] }),
        qc.invalidateQueries({ queryKey: ['folio', folioId] }),
      ]);

      toast.success('Folio settled');
      setShowSettleModal(false);
      setSettleForm({ mode: 'cash', reference: '', notes: '' });
      // Trigger server-side invoice generation so GST invoice number is created in realtime
      try {
        await api.post(`/api/folios/${folioId}/generate-invoice`);
      } catch (e) {
        // non-fatal; invoice may be generated manually by user
      }
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const closeFolio = useMutation({
    mutationFn: () => api.post(`/api/folios/${folioId}/close`),
    onSuccess: () => {
      toast.success('Folio closed');
      invalidateAll();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const voidCharge = useMutation({
    mutationFn: ({ chargeId, reason }: { chargeId: string; reason: string }) =>
      api.delete(`/api/folios/${folioId}/charges/${chargeId}`, { data: { reason } }),
    onSuccess: () => {
      toast.success('Charge voided');
      invalidateAll();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const emailInvoice = useMutation({
    mutationFn: (d: any) => api.post(`/api/folios/${folioId}/email-invoice`, d),
    onSuccess: () => {
      toast.success('Invoice email queued');
      setShowEmailModal(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  function formatAddress(address: any) {
    if (!address) return '';
    if (typeof address === 'string') return address;
    if (typeof address === 'object') {
      return [
        address.line1,
        address.line2,
        address.city,
        address.state,
        address.postalCode || address.pincode,
        address.country,
      ]
        .filter(Boolean)
        .join(', ');
    }
    return '';
  }

  async function generateInvoice() {
    setInvoiceLoading(true);
    try {
      const res = await api.post(`/api/folios/${folioId}/generate-invoice`, {}, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${folio?.gstInvoiceNo || folioId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Invoice downloaded');
      invalidateAll();
    } catch {
      toast.error('Invoice generation failed');
    } finally {
      setInvoiceLoading(false);
    }
  }

  async function loadQR() {
    try {
      const data = await api.get(`/api/payments/upi-qr/${folioId}`);
      setQrData(data.data.data || data.data);
      setShowQR(true);
    } catch {
      toast.error('QR generation failed');
    }
  }

  const uploadQr = useMutation({
    mutationFn: (fd: FormData) =>
      api.post(`/api/payments/upi-qr/${folioId}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: (res: any) => {
      const d = res.data?.data || res.data;
      setQrData(d || null);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadPreview(null);
      toast.success('UPI QR uploaded');
      invalidateAll();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Upload failed'),
  });

  async function sendPaymentLink() {
    try {
      await api.post('/api/payments/payment-link', { folioId });
      toast.success('Payment link sent');
    } catch {
      toast.error('Failed to send payment link');
    }
  }

  async function postRoomCharges() {
    try {
      await api.post(`/api/folios/${folioId}/post-room-charges`);
      toast.success('Room charges posted');
      invalidateAll();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  }

  async function postRestaurantCharges() {
    try {
      await api.post(`/api/folios/${folioId}/post-restaurant-charges`);
      toast.success('Restaurant charges added');
      invalidateAll();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  }

  async function runCheckoutValidation() {
    const result = await refetchCheckoutValidation();
    if (result.data?.valid) toast.success('Checkout validation passed');
    else toast.error('Checkout validation found issues');
  }

  if (!isHydrated) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!folio) return <EmptyState title="Folio not found" />;

  const resv = folio.reservationId as any;
  const guest = folio.guestId as any;
  const activeCharges = folio.charges?.filter((c) => !c.isVoid) || [];
  const roomChargePosted = folio.charges?.some((c: any) => c.department === 'room' && !c.isVoid);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'charges', label: 'Charges' },
    { id: 'payments', label: 'Payments' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'invoice', label: 'Invoice Preview' },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[28px] border border-white/60 bg-white/85 shadow-xl backdrop-blur">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(236,72,153,0.18),transparent_28%),linear-gradient(135deg,#fff7ed,#fff1f2_45%,#ffffff)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 p-2.5 text-white shadow-lg">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-mono text-xl font-bold text-slate-900">{folio.folioNumber}</h2>
                  <p className="text-sm text-slate-500">
                    {guest?.firstName} {guest?.lastName} · Room {resv?.roomNumber} · {resv?.bookingRef}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {folio.isSettled ? (
                  <Badge variant="success">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    Settled
                  </Badge>
                ) : (
                  <Badge variant={folio.balance > 0 ? 'danger' : 'warning'}>
                    <AlertCircle className="mr-1 h-3.5 w-3.5" />
                    {folio.balance > 0 ? `${formatCurrency(folio.balance)} Due` : 'Open'}
                  </Badge>
                )}
                {folio.gstInvoiceNo ? <Badge variant="info">GST Invoice {folio.gstInvoiceNo}</Badge> : null}
                {summary?.settlementType ? <Badge variant="default">{summary.settlementType}</Badge> : null}
                <Badge variant="default">{currentUserName}</Badge>
                <Badge variant="info">{currentUserRole}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Button
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow hover:from-orange-600 hover:to-pink-600"
                icon={<Download className="h-3.5 w-3.5" />}
                onClick={generateInvoice}
                loading={invoiceLoading}
              >
                GST Invoice
              </Button>
              <Button size="sm" variant="secondary" icon={<QrCode className="h-3.5 w-3.5" />} onClick={loadQR}>
                UPI QR
              </Button>
              <Button size="sm" variant="secondary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowUploadModal(true)}>
                Upload QR
              </Button>
              <Button size="sm" variant="secondary" icon={<Send className="h-3.5 w-3.5" />} onClick={sendPaymentLink}>
                Send Link
              </Button>
              <Button size="sm" variant="secondary" icon={<ShieldCheck className="h-3.5 w-3.5" />} onClick={runCheckoutValidation}>
                Validate
              </Button>
              <Button size="sm" variant="secondary" icon={<Mail className="h-3.5 w-3.5" />} onClick={() => setShowEmailModal(true)}>
                Email Invoice
              </Button>
              <Button
                size="sm"
                variant="secondary"
                icon={<XCircle className="h-3.5 w-3.5" />}
                onClick={() => closeFolio.mutate()}
                loading={closeFolio.isPending}
                disabled={folio.balance > 0}
              >
                Close
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-white/60">
              <p className="text-xs text-slate-500">Taxable Amount</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatCurrency(folio.totalCharges - folio.totalTax)}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4 shadow-sm ring-1 ring-amber-100">
              <p className="text-xs text-amber-700">GST</p>
              <p className="mt-1 text-xl font-bold text-amber-700">{formatCurrency(folio.totalTax)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4 shadow-sm ring-1 ring-emerald-100">
              <p className="text-xs text-emerald-700">Amount Paid</p>
              <p className="mt-1 text-xl font-bold text-emerald-700">{formatCurrency(folio.totalPayments)}</p>
            </div>
            <div className="rounded-2xl bg-rose-50 p-4 shadow-sm ring-1 ring-rose-100">
              <p className="text-xs text-rose-700">Balance Due</p>
              <p className="mt-1 text-xl font-bold text-rose-700">{formatCurrency(folio.balance)}</p>
            </div>
          </div>

          {checkoutValidation ? (
            <div
              className={cn(
                'mt-4 rounded-2xl border p-4 text-sm',
                checkoutValidation.valid
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-rose-200 bg-rose-50 text-rose-800'
              )}
            >
              <div className="mb-1 flex items-center gap-2 font-semibold">
                {checkoutValidation.valid ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                Checkout Validation
              </div>
              {checkoutValidation.valid ? (
                <p>No blocking issues found.</p>
              ) : (
                <ul className="list-disc space-y-1 pl-5">
                  {checkoutValidation.issues?.map((issue: string) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {!folio.isSettled && !roomChargePosted ? (
          <ActionCard
            icon={<BedDouble className="h-4 w-4" />}
            title="Post Room Charges"
            subtitle="Add room revenue and GST"
            onClick={postRoomCharges}
          />
        ) : null}

        {!folio.isSettled ? (
          <ActionCard
            icon={<Utensils className="h-4 w-4" />}
            title="Add Food Charges"
            subtitle="Import delivered restaurant items"
            onClick={postRestaurantCharges}
          />
        ) : null}

        {!folio.isSettled ? (
          <ActionCard
            icon={<Plus className="h-4 w-4" />}
            title="Post Charge"
            subtitle={`Quick manual charge as ${currentUserRole}`}
            onClick={() => openChargeModal(isOwnerUser ? 'owner' : 'staff')}
          />
        ) : null}

        {!folio.isSettled ? (
          <ActionCard
            icon={<ShieldCheck className="h-4 w-4" />}
            title="Staff Charge Entry"
            subtitle="Track staff name, role and approval flow"
            onClick={() => openChargeModal('staff')}
          />
        ) : null}

        {!folio.isSettled ? (
          <ActionCard
            icon={<CreditCard className="h-4 w-4" />}
            title="Record Payment"
            subtitle="Cash, card, UPI and direct billing"
            onClick={() => {
              setPayForm((p) => ({ ...p, amount: String(folio.balance) }));
              setShowPayModal(true);
            }}
            tone="success"
          />
        ) : null}

        {!folio.isSettled ? (
          <ActionCard
            icon={<Percent className="h-4 w-4" />}
            title="Discount"
            subtitle="Apply approved discount or waiver"
            onClick={() => setShowDiscountModal(true)}
          />
        ) : null}

        {!folio.isSettled ? (
          <ActionCard
            icon={<RotateCcw className="h-4 w-4" />}
            title="Refund"
            subtitle="Record refund against folio payment"
            onClick={() => setShowRefundModal(true)}
            tone="danger"
          />
        ) : null}

        {!folio.isSettled ? (
          <ActionCard
            icon={<ArrowRightLeft className="h-4 w-4" />}
            title="Advance Adjust"
            subtitle="Adjust deposit or advance payment"
            onClick={() => setShowAdvanceModal(true)}
          />
        ) : null}

        {!folio.isSettled ? (
          <ActionCard
            icon={<Scale className="h-4 w-4" />}
            title="Settle Folio"
            subtitle="Auto-settle remaining balance"
            onClick={() => setShowSettleModal(true)}
            tone="warning"
          />
        ) : null}
      </div>

      <Card className="border-white/60 bg-white/85 shadow-xl backdrop-blur">
        <div className="border-b border-slate-100 px-4 pt-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <CardContent className="pt-4">
          {activeTab === 'overview' ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <SectionTitle title="Guest & Stay" subtitle="Current reservation and guest details" />
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p><span className="font-semibold text-slate-900">Guest:</span> {guest?.firstName} {guest?.lastName}</p>
                  <p><span className="font-semibold text-slate-900">Phone:</span> {guest?.phone || '-'}</p>
                  <p><span className="font-semibold text-slate-900">Email:</span> {guest?.email || '-'}</p>
                  <p><span className="font-semibold text-slate-900">Booking Ref:</span> {resv?.bookingRef || '-'}</p>
                  <p><span className="font-semibold text-slate-900">Room:</span> {resv?.roomNumber || '-'}</p>
                  <p>
                    <span className="font-semibold text-slate-900">Stay:</span>{' '}
                    {resv?.checkIn ? formatDate(resv.checkIn) : '-'} to{' '}
                    {resv?.checkOut ? formatDate(resv.checkOut) : '-'}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <SectionTitle title="Folio Snapshot" subtitle="Financial and invoice summary" />
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs text-slate-500">Charges</p>
                    <p className="mt-1 font-bold text-slate-900">{activeCharges.length}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs text-slate-500">Payments</p>
                    <p className="mt-1 font-bold text-slate-900">{folio.payments?.length || 0}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs text-slate-500">Invoice No</p>
                    <p className="mt-1 font-mono text-xs font-bold text-slate-900">
                      {folio.gstInvoiceNo || 'Not generated'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs text-slate-500">Settled At</p>
                    <p className="mt-1 text-xs font-semibold text-slate-900">
                      {folio.settledAt ? formatDateTime(folio.settledAt) : 'Not settled'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'charges' ? (
            !folio.charges?.length ? (
              <EmptyState title="No charges yet" description="Post room, food, spa or misc charges." />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Description</Th>
                    <Th>Dept</Th>
                    <Th>Qty</Th>
                    <Th>Rate</Th>
                    <Th>Tax</Th>
                    <Th>Amount</Th>
                    <Th>Posted</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {folio.charges.map((c: any, i: number) => (
                    <Tr key={i} className={c.isVoid ? 'opacity-40 line-through' : ''}>
                      <Td className="font-medium text-sm">
                        <div>{c.description}</div>
                        {c.approvalNote ? (
                          <div className="mt-1 text-xs text-slate-500">{c.approvalNote}</div>
                        ) : null}
                      </Td>

                      <Td>
                        <span
                          className={cn(
                            'rounded-full px-2 py-1 text-[10px] font-semibold',
                            DEPT_COLORS[c.department] || 'bg-slate-100 text-slate-600'
                          )}
                        >
                          {DEPT_LABELS[c.department] || c.department}
                        </span>
                      </Td>

                      <Td className="text-sm">{c.quantity}</Td>
                      <Td className="text-sm">{formatCurrency(c.unitPrice)}</Td>
                      <Td className="text-sm text-amber-700">
                        {c.taxPct}% · {formatCurrency(c.taxAmount)}
                      </Td>
                      <Td className="font-semibold text-sm">{formatCurrency(c.amount + c.taxAmount)}</Td>

                      <Td className="text-xs text-slate-400">
                        <span className="block">{formatDate(c.postedAt, 'dd MMM, h:mm a')}</span>

                        {c.postedBy?.name ? (
                          <span className="mt-1 block font-medium text-slate-700">{c.postedBy.name}</span>
                        ) : c.staffName ? (
                          <span className="mt-1 block font-medium text-slate-700">{c.staffName}</span>
                        ) : null}

                        {(c.staffRole || c.postedBy?.role) ? (
                          <span className="block text-[11px] text-slate-500">
                            {c.staffRole || c.postedBy?.role}
                          </span>
                        ) : null}

                        {c.addedByType ? (
                          <span
                            className={cn(
                              'mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
                              c.addedByType === 'owner'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-sky-100 text-sky-700'
                            )}
                          >
                            {c.addedByType === 'owner' ? 'Owner Added' : 'Staff Added'}
                          </span>
                        ) : null}

                        {c.approvalRequired ? (
                          <span className="mt-1 block text-[11px] font-medium text-amber-600">
                            Approval marked
                          </span>
                        ) : null}

                        {c.ownerApprovedBy?.name ? (
                          <span className="block text-[11px] text-emerald-600">
                            Approved by {c.ownerApprovedBy.name}
                          </span>
                        ) : null}
                      </Td>

                      <Td>
                        {!c.isVoid && !folio.isSettled ? (
                          <button
                            onClick={() => {
                              if (confirm('Void this charge?')) {
                                voidCharge.mutate({ chargeId: c.id, reason: 'Voided by staff' });
                              }
                            }}
                            className="text-rose-500 transition hover:text-rose-700"
                            title="Void charge"
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : c.isVoid ? (
                          <span className="text-xs font-medium text-rose-500">VOID</span>
                        ) : null}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )
          ) : null}

          {activeTab === 'payments' ? (
            !folio.payments?.length ? (
              <EmptyState title="No payments yet" />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Mode</Th>
                    <Th>Amount</Th>
                    <Th>Reference</Th>
                    <Th>Date</Th>
                    <Th>Received By</Th>
                  </tr>
                </thead>
                <tbody>
                  {folio.payments.map((p:any) => (
                    <Tr key={p._id}>
                      <Td>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                          {PAYMENT_MODE_LABELS[p.mode] || p.mode}
                        </span>
                        {p.isRefund ? (
                          <span className="ml-2 rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
                            Refund
                          </span>
                        ) : null}
                      </Td>
                      <Td className={cn('font-bold text-sm', p.isRefund ? 'text-rose-700' : 'text-emerald-700')}>
                        {p.isRefund ? '-' : ''}
                        {formatCurrency(p.amount)}
                      </Td>
                      <Td className="font-mono text-xs text-slate-500">{p.reference}</Td>
                      <Td className="text-xs text-slate-400">{formatDateTime(p.paidAt)}</Td>
                      <Td className="text-xs text-slate-500">{(p.receivedBy as any)?.name}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )
          ) : null}

          {activeTab === 'timeline' ? (
            !timeline?.length ? (
              <EmptyState title="No timeline events" />
            ) : (
              <div className="space-y-3">
                {timeline.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="mt-0.5 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 p-2 text-white">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold capitalize text-slate-900">
                        {String(item.type).replace(/_/g, ' ')}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.description || item.notes || item.reference || item.invoiceNo || 'Folio event'}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.at ? formatDateTime(item.at) : ''}
                      </p>
                    </div>
                    <div className="text-right text-sm font-bold text-slate-900">
                      {typeof item.amount === 'number' ? formatCurrency(item.amount) : ''}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}

          {activeTab === 'invoice' ? (
            !invoicePreview ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <SectionTitle title="Hotel" />
                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <p className="font-semibold text-slate-900">{invoicePreview.hotel?.name}</p>
                      <p>{invoicePreview.hotel?.address}</p>
                      <p>GSTIN {invoicePreview.hotel?.gstin}</p>
                      <p>{invoicePreview.hotel?.phone} {invoicePreview.hotel?.email}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <SectionTitle title="Invoice To" />
                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <p className="font-semibold text-slate-900">{invoicePreview.guest?.name}</p>
                      <p>{formatAddress(invoicePreview.guest?.address)}</p>
                      <p>Phone {invoicePreview.guest?.phone}</p>
                      <p>GSTIN {invoicePreview.guest?.gstin}</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-100">
                  <Table>
                    <thead>
                      <tr>
                        <Th>Description</Th>
                        <Th>Qty</Th>
                        <Th>Rate</Th>
                        <Th>Tax %</Th>
                        <Th>Tax</Th>
                        <Th>Amount</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoicePreview.charges?.map((c: any, i: number) => (
                        <Tr key={i}>
                          <Td>{c.description}</Td>
                          <Td>{c.quantity}</Td>
                          <Td>{formatCurrency(c.unitPrice)}</Td>
                          <Td>{c.taxPct}</Td>
                          <Td>{formatCurrency(c.taxAmount)}</Td>
                          <Td>{formatCurrency(c.amount + c.taxAmount)}</Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <div className="rounded-2xl bg-slate-50 p-3 text-center">
                    <p className="text-xs text-slate-500">Subtotal</p>
                    <p className="mt-1 font-bold text-slate-900">{formatCurrency(invoicePreview.subtotal || 0)}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-3 text-center">
                    <p className="text-xs text-amber-700">CGST</p>
                    <p className="mt-1 font-bold text-amber-700">{formatCurrency(invoicePreview.cgst || 0)}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-3 text-center">
                    <p className="text-xs text-amber-700">SGST</p>
                    <p className="mt-1 font-bold text-amber-700">{formatCurrency(invoicePreview.sgst || 0)}</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-3 text-center">
                    <p className="text-xs text-emerald-700">Paid</p>
                    <p className="mt-1 font-bold text-emerald-700">{formatCurrency(invoicePreview.amountPaid || 0)}</p>
                  </div>
                  <div className="rounded-2xl bg-rose-50 p-3 text-center">
                    <p className="text-xs text-rose-700">Balance</p>
                    <p className="mt-1 font-bold text-rose-700">{formatCurrency(invoicePreview.balance || 0)}</p>
                  </div>
                </div>
              </div>
            )
          ) : null}
        </CardContent>
      </Card>

      <Modal open={showChargeModal} onClose={() => setShowChargeModal(false)} title="Post Charge">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();

            if (!chargeForm.description.trim()) {
              toast.error('Description is required');
              return;
            }

            if (!chargeForm.amount || Number(chargeForm.amount) <= 0) {
              toast.error('Enter valid unit price');
              return;
            }

            if (!chargeForm.quantity || Number(chargeForm.quantity) <= 0) {
              toast.error('Enter valid quantity');
              return;
            }

            postCharge.mutate({
              description: chargeForm.description,
              department: chargeForm.department,
              amount: parseFloat(chargeForm.amount),
              quantity: parseFloat(chargeForm.quantity),
              taxPct: parseFloat(chargeForm.taxPct || '0'),
              addedByType: chargeForm.addedByType,
              staffName: chargeForm.staffName,
              staffRole: chargeForm.staffRole,
              approvalRequired: chargeForm.approvalRequired,
              approvalNote: chargeForm.approvalNote || undefined,
            });
          }}
        >
          <div className="rounded-3xl border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-pink-50 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 p-2 text-white shadow">
                <UserCircle2 className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Posting user</p>
                <p className="text-sm font-bold text-slate-900">{chargeForm.staffName || currentUserName}</p>
                <p className="text-xs text-slate-500">{chargeForm.staffRole || currentUserRole}</p>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                {chargeForm.addedByType === 'owner' ? 'Owner Entry' : 'Staff Entry'}
              </div>
            </div>
          </div>

          <Input
            label="Description"
            value={chargeForm.description}
            onChange={(e) => setChargeForm((p) => ({ ...p, description: e.target.value }))}
            required
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Department"
              value={chargeForm.department}
              onChange={(e) => setChargeForm((p) => ({ ...p, department: e.target.value }))}
            >
              {Object.entries(DEPT_LABELS)
                .filter(([k]) => !['tax'].includes(k))
                .map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
            </Select>

            <Input
              label="Tax %"
              type="number"
              min="0"
              max="28"
              value={chargeForm.taxPct}
              onChange={(e) => setChargeForm((p) => ({ ...p, taxPct: e.target.value }))}
            />

            <Input
              label="Unit Price (₹)"
              type="number"
              min="0"
              step="0.01"
              value={chargeForm.amount}
              onChange={(e) => setChargeForm((p) => ({ ...p, amount: e.target.value }))}
              required
            />

            <Input
              label="Quantity"
              type="number"
              min="1"
              step="1"
              value={chargeForm.quantity}
              onChange={(e) => setChargeForm((p) => ({ ...p, quantity: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Added By" value={chargeForm.staffName} disabled />
            <Input label="Role" value={chargeForm.staffRole} disabled />

            <Select
              label="Entry Type"
              value={chargeForm.addedByType}
              onChange={(e) =>
                setChargeForm((p) => ({
                  ...p,
                  addedByType: e.target.value as 'staff' | 'owner',
                }))
              }
            >
              <option value="staff">Staff</option>
              <option value="owner">Owner</option>
            </Select>

            <Select
              label="Owner Approval"
              value={chargeForm.approvalRequired ? 'yes' : 'no'}
              onChange={(e) =>
                setChargeForm((p) => ({
                  ...p,
                  approvalRequired: e.target.value === 'yes',
                }))
              }
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </Select>
          </div>

          <Input
            label="Approval Note"
            value={chargeForm.approvalNote}
            onChange={(e) => setChargeForm((p) => ({ ...p, approvalNote: e.target.value }))}
            placeholder="Approved by owner / charge reason"
          />

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Sparkles className="h-4 w-4 text-orange-500" />
                Estimated total
              </div>
              <div className="text-base font-bold text-slate-900">
                {formatCurrency(
                  Number(chargeForm.amount || 0) *
                  Number(chargeForm.quantity || 0) *
                  (1 + Number(chargeForm.taxPct || 0) / 100)
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowChargeModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={postCharge.isPending}>
              Post Charge
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={showPayModal} onClose={() => setShowPayModal(false)} title="Record Payment">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            postPayment.mutate({
              amount: parseFloat(payForm.amount),
              mode: payForm.mode,
              reference: payForm.reference || undefined,
              notes: payForm.notes || undefined,
            });
          }}
        >
          <div className="rounded-xl bg-amber-50 p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-amber-700">Balance Due</span>
            <span className="text-lg font-bold text-amber-900">{formatCurrency(folio.balance)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              min="0.01"
              step="0.01"
              value={payForm.amount}
              onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))}
              required
            />
            <Select label="Mode" value={payForm.mode} onChange={(e) => setPayForm((p) => ({ ...p, mode: e.target.value }))}>
              {Object.entries(PAYMENT_MODE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </div>

          <Input label="Reference" value={payForm.reference} onChange={(e) => setPayForm((p) => ({ ...p, reference: e.target.value }))} />
          <Input label="Notes" value={payForm.notes} onChange={(e) => setPayForm((p) => ({ ...p, notes: e.target.value }))} />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowPayModal(false)}>Cancel</Button>
            <Button type="submit" loading={postPayment.isPending}>Record Payment</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showDiscountModal} onClose={() => setShowDiscountModal(false)} title="Apply Discount">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            addDiscount.mutate({
              description: discountForm.description,
              amount: parseFloat(discountForm.amount),
              reason: discountForm.reason,
            });
          }}
        >
          <Input
            label="Description"
            value={discountForm.description}
            onChange={(e) => setDiscountForm((p) => ({ ...p, description: e.target.value }))}
            required
          />
          <Input
            label="Amount"
            type="number"
            min="0.01"
            step="0.01"
            value={discountForm.amount}
            onChange={(e) => setDiscountForm((p) => ({ ...p, amount: e.target.value }))}
            required
          />
          <Input
            label="Reason"
            value={discountForm.reason}
            onChange={(e) => setDiscountForm((p) => ({ ...p, reason: e.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowDiscountModal(false)}>Cancel</Button>
            <Button type="submit" loading={addDiscount.isPending}>Apply Discount</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showRefundModal} onClose={() => setShowRefundModal(false)} title="Post Refund">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            postRefund.mutate({
              amount: parseFloat(refundForm.amount),
              mode: refundForm.mode,
              reference: refundForm.reference || undefined,
              notes: refundForm.notes || undefined,
            });
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              min="0.01"
              step="0.01"
              value={refundForm.amount}
              onChange={(e) => setRefundForm((p) => ({ ...p, amount: e.target.value }))}
              required
            />
            <Select label="Mode" value={refundForm.mode} onChange={(e) => setRefundForm((p) => ({ ...p, mode: e.target.value }))}>
              {Object.entries(PAYMENT_MODE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </div>
          <Input label="Reference" value={refundForm.reference} onChange={(e) => setRefundForm((p) => ({ ...p, reference: e.target.value }))} />
          <Input label="Notes" value={refundForm.notes} onChange={(e) => setRefundForm((p) => ({ ...p, notes: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowRefundModal(false)}>Cancel</Button>
            <Button type="submit" loading={postRefund.isPending}>Post Refund</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showAdvanceModal} onClose={() => setShowAdvanceModal(false)} title="Adjust Advance">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            adjustAdvance.mutate({
              amount: parseFloat(advanceForm.amount),
              reference: advanceForm.reference || undefined,
              notes: advanceForm.notes || undefined,
            });
          }}
        >
          <Input
            label="Amount"
            type="number"
            min="0.01"
            step="0.01"
            value={advanceForm.amount}
            onChange={(e) => setAdvanceForm((p) => ({ ...p, amount: e.target.value }))}
            required
          />
          <Input label="Reference" value={advanceForm.reference} onChange={(e) => setAdvanceForm((p) => ({ ...p, reference: e.target.value }))} />
          <Input label="Notes" value={advanceForm.notes} onChange={(e) => setAdvanceForm((p) => ({ ...p, notes: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowAdvanceModal(false)}>Cancel</Button>
            <Button type="submit" loading={adjustAdvance.isPending}>Adjust Advance</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showSettleModal} onClose={() => setShowSettleModal(false)} title="Settle Folio">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            settleFolio.mutate(settleForm);
          }}
        >
          <div className="rounded-xl bg-rose-50 p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-rose-700">Remaining Balance</span>
            <span className="text-lg font-bold text-rose-900">{formatCurrency(folio.balance)}</span>
          </div>

          <Select label="Settlement Mode" value={settleForm.mode} onChange={(e) => setSettleForm((p) => ({ ...p, mode: e.target.value }))}>
            {Object.entries(PAYMENT_MODE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
          <Input label="Reference" value={settleForm.reference} onChange={(e) => setSettleForm((p) => ({ ...p, reference: e.target.value }))} />
          <Input label="Notes" value={settleForm.notes} onChange={(e) => setSettleForm((p) => ({ ...p, notes: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowSettleModal(false)}>Cancel</Button>
            <Button type="submit" loading={settleFolio.isPending}>Settle Folio</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showEmailModal} onClose={() => setShowEmailModal(false)} title="Email Invoice" size="sm">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            emailInvoice.mutate(emailForm);
          }}
        >
          <Input
            label="Email"
            type="email"
            value={emailForm.email}
            onChange={(e) => setEmailForm({ email: e.target.value })}
            placeholder={guest?.email || 'guest@example.com'}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowEmailModal(false)}>Cancel</Button>
            <Button type="submit" loading={emailInvoice.isPending}>Send Invoice</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showQR} onClose={() => setShowQR(false)} title="UPI QR Code" size="sm">
        {qrData ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-slate-500">Scan to pay</p>
            <img src={qrData.qrDataUrl} alt="UPI QR Code" className="mx-auto h-56 w-56 rounded-2xl border border-slate-200" />
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(qrData.amount)}</p>
              <p className="mt-1 font-mono text-xs text-slate-400">{qrData.folioNumber}</p>
            </div>
            <p className="text-xs text-slate-400">After payment, record it manually in the folio.</p>
          </div>
        ) : null}
      </Modal>
      <Modal open={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload UPI QR" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Upload a UPI QR image to Cloudinary (backend will persist).</p>
          <div className="flex flex-col items-center gap-2">
            {uploadPreview ? (
              <img src={uploadPreview} className="h-44 w-44 rounded-2xl border border-slate-200 object-contain" />
            ) : (
              <div className="h-44 w-44 rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">Preview</div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setUploadFile(f);
                if (f) setUploadPreview(URL.createObjectURL(f));
              }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowUploadModal(false)}>Cancel</Button>
            <Button
              type="button"
              loading={uploadQr.isPending}
              onClick={() => {
                if (!uploadFile) return toast.error('Select an image');
                const fd = new FormData();
                fd.append('file', uploadFile);
                uploadQr.mutate(fd);
              }}
            >
              Upload
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

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

function PaymentMode({ label, value }: { label: string; value?: number }) {
  if (!value) return <span className="text-xs text-slate-400">-</span>;
  return (
    <div className="text-[11px] text-slate-500">
      {label}: <span className="font-medium text-slate-700">{formatCurrency(value)}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   GUEST BILLING SUMMARY — Full Actions Edition
   ═══════════════════════════════════════════════════════════════════════════ */
function SettledGuestsTable() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'settled' | 'open'>('all');

  /* ─── Modals ─── */
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailTarget, setEmailTarget] = useState<{ folioId: string; email: string } | null>(null);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [creditTarget, setCreditTarget] = useState<{ folioId: string; folioNumber: string } | null>(null);
  const [creditReason, setCreditReason] = useState('');
  const [validateModalOpen, setValidateModalOpen] = useState(false);
  const [validateResult, setValidateResult] = useState<any>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['folio-summary-range', startDate, endDate],
    queryFn: () =>
      api
        .get('/api/folios/reconciliation/summary', {
          params: { startDate, endDate },
        })
        .then((r) => r.data.data),
  });

  /* ─── Mutations ─── */
  const generateInvoice = useMutation({
    mutationFn: (folioId: string) =>
      api.post(`/api/folios/${folioId}/generate-invoice`, {}, { responseType: 'blob' }),
    onSuccess: (res, folioId) => {
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${folioId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Invoice PDF downloaded');
    },
    onError: () => toast.error('Invoice generation failed'),
  });

  const emailInvoice = useMutation({
    mutationFn: ({ folioId, email }: { folioId: string; email: string }) =>
      api.post(`/api/folios/${folioId}/email-invoice`, { email }),
    onSuccess: () => {
      toast.success('Invoice emailed successfully');
      setEmailModalOpen(false);
      setEmailTarget(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Email failed'),
  });

  const generateCreditNote = useMutation({
    mutationFn: ({ folioId, reason }: { folioId: string; reason: string }) =>
      api.post(`/api/folios/${folioId}/generate-credit-note`, { reason }),
    onSuccess: (res) => {
      toast.success(`Credit note ${res.data.data.creditNoteNo} generated`);
      setCreditModalOpen(false);
      setCreditTarget(null);
      setCreditReason('');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Credit note failed'),
  });

  const runValidate = useMutation({
    mutationFn: (folioId: string) =>
      api.post(`/api/folios/${folioId}/checkout-validate`).then((r) => r.data.data),
    onSuccess: (data) => {
      setValidateResult(data);
      setValidateModalOpen(true);
    },
    onError: () => toast.error('Validation failed'),
  });

  const closeFolio = useMutation({
    mutationFn: (folioId: string) => api.post(`/api/folios/${folioId}/close`),
    onSuccess: () => {
      toast.success('Folio closed');
      refetch();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Close failed'),
  });

  const postRoomCharges = useMutation({
    mutationFn: (folioId: string) => api.post(`/api/folios/${folioId}/post-room-charges`),
    onSuccess: () => {
      toast.success('Room charges posted');
      refetch();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const postRestaurantCharges = useMutation({
    mutationFn: (folioId: string) => api.post(`/api/folios/${folioId}/post-restaurant-charges`),
    onSuccess: () => {
      toast.success('Restaurant charges posted');
      refetch();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  /* ─── Filtering ─── */
  const filteredRows = useMemo(() => {
    if (!data?.rows) return [];
    let rows = data.rows;

    if (statusFilter !== 'all') {
      rows = rows.filter((r: any) => (statusFilter === 'settled' ? r.settled : !r.settled));
    }

    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      rows = rows.filter(
        (r: any) =>
          r.guestName?.toLowerCase().includes(term) ||
          r.folioNumber?.toLowerCase().includes(term) ||
          r.bookingRef?.toLowerCase().includes(term) ||
          r.roomNumber?.toLowerCase().includes(term)
      );
    }

    return rows;
  }, [data, statusFilter, searchQuery]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc: any, r: any) => {
        acc.totalCharges = (acc.totalCharges || 0) + Number(r.totalCharges || 0);
        acc.totalPayments = (acc.totalPayments || 0) + Number(r.totalPayments || 0);
        acc.totalBalance = (acc.totalBalance || 0) + Number(r.balance || 0);
        return acc;
      },
      { totalCharges: 0, totalPayments: 0, totalBalance: 0 }
    );
  }, [filteredRows]);

  /* ─── Helpers ─── */
  function openEmailModal(folioId: string, defaultEmail: string) {
    setEmailTarget({ folioId, email: defaultEmail || '' });
    setEmailModalOpen(true);
    setActionMenuOpen(null);
  }

  function openCreditModal(folioId: string, folioNumber: string) {
    setCreditTarget({ folioId, folioNumber });
    setCreditModalOpen(true);
    setActionMenuOpen(null);
  }

  function openValidate(folioId: string) {
    runValidate.mutate(folioId);
    setActionMenuOpen(null);
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="w-full"
    >
      <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-2xl shadow-slate-200/50">
        {/* ═══ Header ═══ */}
        <div className="relative overflow-hidden border-b border-slate-100  px-8 py-6"  style={{ background: 'linear-gradient(135deg,#F97316 0%,#F43F5E 100%)' }}>
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="absolute -bottom-16 left-20 h-48 w-48 rounded-full bg-pink-500/10 blur-3xl" />
          
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 text-white shadow-lg shadow-orange-500/25">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Guest Billing Summary</h2>
                <p className="text-sm text-slate-400 mt-0.5">Complete folio management with all actions</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  max={endDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-sm text-white outline-none w-32"
                />
                <span className="text-slate-500">→</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-sm text-white outline-none w-32"
                />
              </div>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* ═══ Stats Bar ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-slate-100 border-b border-slate-100">
          <div className="px-6 py-5 hover:bg-slate-50/80 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Total Charges</span>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(totals.totalCharges)}</p>
            <p className="text-xs text-slate-400 mt-1">{filteredRows.length} folios</p>
          </div>
          <div className="px-6 py-5 hover:bg-emerald-50/40 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600">Total Payments</span>
            </div>
            <p className="text-2xl font-black text-emerald-700 tracking-tight">{formatCurrency(totals.totalPayments)}</p>
            <p className="text-xs text-emerald-500/70 mt-1">Collected</p>
          </div>
          <div className="px-6 py-5 hover:bg-rose-50/40 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-rose-600">Outstanding</span>
            </div>
            <p className="text-2xl font-black text-rose-700 tracking-tight">{formatCurrency(totals.totalBalance)}</p>
            <p className="text-xs text-rose-500/70 mt-1">Still due</p>
          </div>
          <div className="px-6 py-5 hover:bg-orange-50/40 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-orange-600">Folios</span>
            </div>
            <p className="text-2xl font-black text-orange-700 tracking-tight">{filteredRows.length}</p>
            <p className="text-xs text-orange-500/70 mt-1">In selected range</p>
          </div>
        </div>

        {/* ═══ Toolbar ═══ */}
        <div className="flex flex-wrap items-center gap-4 px-8 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="relative flex-1 min-w-[300px] max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search guest, folio, booking, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all shadow-sm"
            />
          </div>
          <div className="flex rounded-xl bg-white p-1 shadow-sm border border-slate-200">
            {(['all', 'open', 'settled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all',
                  statusFilter === s
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ Wide Table ═══ */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
              <p className="text-sm text-slate-400 font-medium">Loading folios...</p>
            </div>
          </div>
        ) : !filteredRows?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No folios found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">Adjust your date range or search filters to see billing results.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full h-full min-w-max table-fixed">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Folio</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Guest</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Booking</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Room</th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-slate-500">Charges</th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-slate-500">Payments</th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-slate-500">Balance</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Invoice</th>
                  <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row: any, index: number) => {
                  const rowKey = String(row?.folioId || row?.folioNumber || `sum-${index}`);
                  const hasInvoice = !!row.gstInvoiceNo;
                  const isSettled = row.settled;

                  return (
                    <motion.tr
                      key={rowKey}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                      className="group hover:bg-orange-50/30 transition-colors duration-200"
                    >
                      {/* Folio */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
                            <Receipt className="h-4 w-4 text-slate-500" />
                          </div>
                          <div>
                            <div className="font-mono text-sm font-bold text-slate-900">{row.folioNumber || '-'}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{row.folioId?.slice(-8)}</div>
                          </div>
                        </div>
                      </td>

                      {/* Guest */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center text-xs font-bold text-orange-700 flex-shrink-0">
                            {row.guestName?.charAt(0) || 'G'}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{row.guestName || '-'}</div>
                            <div className="text-[11px] text-slate-400">{row.guestPhone}</div>
                          </div>
                        </div>
                      </td>

                      {/* Booking */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                          {row.bookingRef || '-'}
                        </span>
                      </td>

                      {/* Room */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 border border-blue-100">
                          <BedDouble className="h-3 w-3" />
                          {row.roomNumber || '-'}
                        </span>
                      </td>

                      {/* Charges */}
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(row.totalCharges || 0)}</span>
                      </td>

                      {/* Payments */}
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-emerald-700 tabular-nums">{formatCurrency(row.totalPayments || 0)}</span>
                      </td>

                      {/* Balance */}
                      <td className="px-6 py-4 text-right">
                        <span className={cn(
                          'text-sm font-black tabular-nums',
                          row.balance > 0 ? 'text-rose-600' : 'text-emerald-600'
                        )}>
                          {formatCurrency(row.balance || 0)}
                        </span>
                      </td>

                      {/* Invoice */}
                      <td className="px-6 py-4">
                        {hasInvoice ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-[11px] font-bold text-purple-700 border border-purple-200">
                            <FileText className="h-3 w-3" />
                            {row.gstInvoiceNo}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        {isSettled ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Settled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                            <AlertCircle className="h-3 w-3" />
                            Open
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === rowKey ? null : rowKey)}
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200",
                              actionMenuOpen === rowKey
                                ? "border-orange-400 bg-orange-50 text-orange-600 shadow-md"
                                : "border-slate-200 bg-white text-slate-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 hover:shadow-sm"
                            )}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          <AnimatePresence>
                            {actionMenuOpen === rowKey && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 8 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="absolute right-0 top-11 z-50 w-60 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-2xl shadow-slate-200/50"
                              >
                                {/* Invoice Section */}
                                <div className="px-3 py-2">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice</span>
                                </div>
                                <button
                                  onClick={() => {
                                    generateInvoice.mutate(row.folioId);
                                    setActionMenuOpen(null);
                                  }}
                                  disabled={generateInvoice.isPending}
                                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition-colors disabled:opacity-40"
                                >
                                  <div className="h-7 w-7 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                    <FileDown className="h-3.5 w-3.5 text-orange-600" />
                                  </div>
                                  {generateInvoice.isPending ? 'Generating...' : 'Download PDF'}
                                </button>
                                <button
                                  onClick={() => openEmailModal(row.folioId, row.guestEmail || '')}
                                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                                >
                                  <div className="h-7 w-7 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                    <Mail className="h-3.5 w-3.5 text-orange-600" />
                                  </div>
                                  Email Invoice
                                </button>
                                {hasInvoice && (
                                  <button
                                    onClick={() => openCreditModal(row.folioId, row.folioNumber)}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                                  >
                                    <div className="h-7 w-7 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                                      <FileWarning className="h-3.5 w-3.5 text-rose-600" />
                                    </div>
                                    Credit Note
                                  </button>
                                )}

                                <div className="my-2 h-px bg-slate-100 mx-2" />

                                {/* Folio Section */}
                                <div className="px-3 py-2">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Folio</span>
                                </div>
                                <Link
                                  href={`/dashboard/billing/${row.folioId}`}
                                  onClick={() => setActionMenuOpen(null)}
                                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                >
                                  <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                                  </div>
                                  Open Folio Detail
                                </Link>
                                <button
                                  onClick={() => openValidate(row.folioId)}
                                  disabled={runValidate.isPending}
                                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors disabled:opacity-40"
                                >
                                  <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                                  </div>
                                  {runValidate.isPending ? 'Validating...' : 'Checkout Validate'}
                                </button>
                                {!isSettled && (
                                  <>
                                    <button
                                      onClick={() => {
                                        postRoomCharges.mutate(row.folioId);
                                        setActionMenuOpen(null);
                                      }}
                                      disabled={postRoomCharges.isPending}
                                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors disabled:opacity-40"
                                    >
                                      <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <BedDouble className="h-3.5 w-3.5 text-blue-600" />
                                      </div>
                                      Post Room Charges
                                    </button>
                                    <button
                                      onClick={() => {
                                        postRestaurantCharges.mutate(row.folioId);
                                        setActionMenuOpen(null);
                                      }}
                                      disabled={postRestaurantCharges.isPending}
                                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors disabled:opacity-40"
                                    >
                                      <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <Utensils className="h-3.5 w-3.5 text-blue-600" />
                                      </div>
                                      Post F&B Charges
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm('Close this folio? Balance must be zero.')) {
                                          closeFolio.mutate(row.folioId);
                                          setActionMenuOpen(null);
                                        }
                                      }}
                                      disabled={closeFolio.isPending || row.balance > 0}
                                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors disabled:opacity-30"
                                    >
                                      <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                        <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                                      </div>
                                      {closeFolio.isPending ? 'Closing...' : 'Close Folio'}
                                    </button>
                                  </>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-4 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-900">{filteredRows.length}</span> of <span className="font-bold text-slate-900">{data?.rows?.length || 0}</span> folios
          </p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-500">Last updated: {formatDateTime(new Date())}</span>
          </div>
        </div>
      </div>

      {/* ═══ Modals ═══ */}
      <Modal open={emailModalOpen} onClose={() => setEmailModalOpen(false)} title="Email Invoice" size="sm">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!emailTarget?.email) return toast.error('Email required');
            emailInvoice.mutate({ folioId: emailTarget.folioId, email: emailTarget.email });
          }}
        >
          <Input
            label="Recipient Email"
            type="email"
            value={emailTarget?.email || ''}
            onChange={(e) => setEmailTarget((p) => (p ? { ...p, email: e.target.value } : null))}
            placeholder="guest@example.com"
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setEmailModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={emailInvoice.isPending}>Send Invoice</Button>
          </div>
        </form>
      </Modal>

      <Modal open={creditModalOpen} onClose={() => setCreditModalOpen(false)} title="Generate Credit Note" size="sm">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!creditReason.trim()) return toast.error('Reason required');
            if (!creditTarget) return;
            generateCreditNote.mutate({ folioId: creditTarget.folioId, reason: creditReason });
          }}
        >
          <div className="rounded-xl bg-rose-50 p-4 border border-rose-200">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-1">Folio</p>
            <p className="text-lg font-black text-rose-900">{creditTarget?.folioNumber}</p>
          </div>
          <Input
            label="Credit Reason"
            value={creditReason}
            onChange={(e) => setCreditReason(e.target.value)}
            placeholder="e.g. Billing error, guest complaint..."
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setCreditModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={generateCreditNote.isPending} variant="danger">Generate Credit Note</Button>
          </div>
        </form>
      </Modal>

      <Modal open={validateModalOpen} onClose={() => setValidateModalOpen(false)} title="Checkout Validation" size="sm">
        {validateResult && (
          <div className="space-y-4">
            <div className={cn(
              'rounded-2xl border p-5 flex items-start gap-4',
              validateResult.valid ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'
            )}>
              {validateResult.valid ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-6 w-6 text-rose-600 flex-shrink-0" />
              )}
              <div>
                <p className={cn('font-bold text-base', validateResult.valid ? 'text-emerald-900' : 'text-rose-900')}>
                  {validateResult.valid ? 'Ready for Checkout' : 'Validation Issues Found'}
                </p>
                {!validateResult.valid && (
                  <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm text-rose-700">
                    {validateResult.issues?.map((issue: string, i: number) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/70 p-3">
                    <p className="text-xs text-slate-500 mb-1">Balance</p>
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(validateResult.balance)}</p>
                  </div>
                  <div className="rounded-xl bg-white/70 p-3">
                    <p className="text-xs text-slate-500 mb-1">Settled</p>
                    <p className="text-sm font-bold text-slate-900">{validateResult.isSettled ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setValidateModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BILLING PAGE — Updated with modern orange-pink light theme
   ═══════════════════════════════════════════════════════════════════════════ */
function BillingContent() {
  const searchParams = useSearchParams();
  const [selectedFolioId, setSelectedFolioId] = useState<string | null>(searchParams.get('folioId'));
  const [showRecon, setShowRecon] = useState(false);
  const qc = useQueryClient();

  const refreshBilling = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['folios-list'] }),
      qc.invalidateQueries({ queryKey: ['folio'] }),
      qc.invalidateQueries({ queryKey: ['folio-summary'] }),
      qc.invalidateQueries({ queryKey: ['folio-timeline'] }),
      qc.invalidateQueries({ queryKey: ['folio-invoice-preview'] }),
      qc.invalidateQueries({ queryKey: ['folio-reconciliation'] }),
      qc.invalidateQueries({ queryKey: ['folio-bottom-summary'] }),
    ]);
  };

  return (
    <DashboardLayout title="Billing">
      <div className="space-y-6 max-w-7xl pb-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl  text-white p-8 shadow-xl shadow-orange-500/15"
         style={{ background: 'linear-gradient(135deg,#F97316 0%,#F43F5E 100%)' }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-300/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-lg bg-white/20 backdrop-blur-md border-2 border-white/40">
                <Receipt className="w-9 h-9" />
              </div>
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center bg-emerald-500 shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-medium opacity-80">Cashier Console</span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 border border-white/25">
                  GST-ready
                </span>
              </div>
              <h1 className="text-3xl font-bold leading-tight">Billing Folios</h1>
              <div className="flex items-center gap-4 flex-wrap text-sm opacity-80 mt-2">
                <span className="flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5" /> Charges & taxes</span>
                <span className="flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Payments & settlement</span>
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> GST invoice workflow</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-col sm:items-end">
              <Button variant="ghost" className="!rounded-xl !bg-white/20 !px-3 !py-2 !text-xs !font-semibold !text-white backdrop-blur hover:!bg-white/30" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={refreshBilling}>
                Refresh
              </Button>
              <Button variant="ghost" className="!rounded-xl !bg-white/20 !px-3 !py-2 !text-xs !font-bold !text-white backdrop-blur hover:!bg-white/30" icon={<CalendarDays className="h-3.5 w-3.5" />} onClick={() => setShowRecon((s) => !s)}>
                {showRecon ? 'Hide Reconciliation' : 'Show Reconciliation'}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Charges', icon: IndianRupee, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', desc: 'Real-time posting' },
            { label: 'Payments', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', desc: 'Multi-mode collection' },
            { label: 'Invoices', icon: FileText, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100', desc: 'GST workflow' },
            { label: 'Settlement', icon: Clock3, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', desc: 'Validate & close' },
          ].map((f) => (
            <motion.div key={f.label} whileHover={{ y: -3 }} className={`rounded-2xl border ${f.border} ${f.bg} p-4 shadow-sm hover:shadow-md transition-all`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{f.label}</span>
                <div className={`w-8 h-8 rounded-lg ${f.bg} border ${f.border} flex items-center justify-center`}>
                  <f.icon className={`w-4 h-4 ${f.color}`} />
                </div>
              </div>
              <p className="text-lg font-bold text-slate-900">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {showRecon ? <ReconciliationPanel /> : null}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <FolioListPanel onSelect={setSelectedFolioId} selectedFolioId={selectedFolioId} />
          </div>
          <div className="lg:col-span-8">
            {selectedFolioId ? (
              <FolioDetailPanel folioId={selectedFolioId} />
            ) : (
              <Card className="overflow-hidden border border-gray-200/80 bg-white shadow-xl">
                <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 via-pink-50 to-rose-50 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg bg-gradient-to-br from-orange-500 to-pink-500">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">No folio selected</p>
                      <p className="text-xs text-slate-500">Choose an item from the folio queue to start billing actions</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl text-white shadow-lg bg-gradient-to-br from-orange-400 to-pink-400">
                    <Receipt className="h-9 w-9" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Select a folio</h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                    Pick an open or unsettled folio from the left to manage charges, payments, invoice preview, GST generation, settlement and closure.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* ═══ THE UPGRADED GUEST BILLING SUMMARY ═══ */}
        <SettledGuestsTable />
      </div>
    </DashboardLayout>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BillingContent />
    </Suspense>
  );
}