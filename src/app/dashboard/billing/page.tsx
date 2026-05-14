'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Charge {
  _id: string;
  description: string;
  department: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxPct: number;
  taxAmount: number;
  postedAt: string;
  postedBy?: { name: string };
  isVoid: boolean;
  voidReason?: string;
}

interface Payment {
  _id: string;
  amount: number;
  mode: string;
  reference?: string;
  paidAt: string;
  receivedBy?: { name: string };
  isRefund: boolean;
  notes?: string;
}

interface Folio {
  _id: string;
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
  guestId?: { firstName: string; lastName: string; phone: string; email?: string };
  reservationId?: { bookingRef: string; roomNumber: string; checkIn: string; checkOut: string; nights: number };
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

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h3 className="text-sm font-bold tracking-wide text-slate-900">{title}</h3>
      {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
    </div>
  );
}

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
      ? 'border-rose-200 bg-rose-50'
      : tone === 'success'
        ? 'border-emerald-200 bg-emerald-50'
        : tone === 'warning'
          ? 'border-amber-200 bg-amber-50'
          : 'border-white/60 bg-white/80';

  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-2xl border p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
        toneClass
      )}
      type="button"
    >
      <div className="mb-3 inline-flex rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 p-2 text-white shadow">
        {icon}
      </div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
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
      const guest = `${f.guestId?.firstName || ''} ${f.guestId?.lastName || ''}`.toLowerCase();
      const room = String(f.reservationId?.roomNumber || '').toLowerCase();
      const ref = String(f.reservationId?.bookingRef || '').toLowerCase();
      const folioNo = String(f.folioNumber || '').toLowerCase();
      return guest.includes(term) || room.includes(term) || ref.includes(term) || folioNo.includes(term);
    });
  }, [data, search]);

  return (
    <Card className="overflow-hidden border-white/60 bg-white/80 shadow-xl backdrop-blur">
      <CardHeader className="border-b border-orange-100 bg-gradient-to-r from-orange-50 via-pink-50 to-rose-50">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle title="Folio Queue" subtitle="Cashier-ready folio list" />
          <Badge variant="info">{filtered?.length || 0}</Badge>
        </div>
      </CardHeader>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setListType('open')}
            className={cn(
              'rounded-xl px-3 py-2 text-sm font-semibold transition',
              listType === 'open' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            )}
          >
            Open
          </button>
          <button
            type="button"
            onClick={() => setListType('unsettled')}
            className={cn(
              'rounded-xl px-3 py-2 text-sm font-semibold transition',
              listType === 'unsettled' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            )}
          >
            Unsettled
          </button>
        </div>

        <Input
          placeholder="Search folio, guest, room..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : !filtered?.length ? (
        <EmptyState title="No folios found" description="Try another filter or search term." />
      ) : (
        <div className="divide-y divide-slate-100">
          {filtered.map((f: any) => {
            const guestName = `${f.guestId?.firstName || ''} ${f.guestId?.lastName || ''}`.trim();
            const selected = selectedFolioId === f?._id;

            return (
              <Link href={`/dashboard/guests/${f?.guestId?._id}`}>
                <button
                  key={f._id}
                  onClick={() => onSelect(f?._id)}
                  className={cn(
                    'w-full px-4 py-3 text-left transition hover:bg-orange-50/60',
                    selected && 'bg-gradient-to-r from-orange-50 to-pink-50'
                  )}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 text-sm font-bold text-white shadow">
                      {guestName?.[0] || 'F'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{guestName || f.folioNumber}</p>
                      <p className="text-xs text-slate-500">
                        Folio {f.folioNumber} Â· Room {f.reservationId?.roomNumber || 'â€”'} Â· {f.reservationId?.bookingRef || 'â€”'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn('text-sm font-bold', f.balance > 0 ? 'text-rose-600' : 'text-emerald-600')}>
                        {formatCurrency(f.balance || 0)}
                      </p>
                      <p className="text-[11px] text-slate-400">{f.isSettled ? 'settled' : 'due'}</p>
                    </div>
                  </div>
                </button>

              </Link>

            );
          })}
        </div>
      )}
    </Card>
  );
}

function ReconciliationPanel() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, isLoading } = useQuery({
    queryKey: ['folio-reconciliation', date],
    queryFn: () =>
      api.get('/api/folios/reconciliation/daily', { params: { date } }).then((r) => r.data.data),
  });

  return (
    <Card className="border-white/60 bg-white/80 shadow-xl backdrop-blur">
      <CardHeader className="border-b border-orange-100 bg-gradient-to-r from-orange-50 via-pink-50 to-rose-50">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle title="Daily Reconciliation" subtitle="Finance and cashier summary" />
          <div className="w-44">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : !data ? (
          <EmptyState title="No reconciliation data" />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Total Charges</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(data.totals?.totalCharges || 0)}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs text-emerald-600">Total Payments</p>
                <p className="mt-1 text-xl font-bold text-emerald-700">{formatCurrency(data.totals?.totalPayments || 0)}</p>
              </div>
              <div className="rounded-2xl bg-rose-50 p-4">
                <p className="text-xs text-rose-600">Outstanding</p>
                <p className="mt-1 text-xl font-bold text-rose-700">{formatCurrency(data.totals?.totalBalance || 0)}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <Table>
                <thead>
                  <tr>
                    <Th>Folio</Th>
                    <Th>Guest</Th>
                    <Th>Charges</Th>
                    <Th>Payments</Th>
                    <Th>Balance</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows?.map((row: any) => (
                    <Tr key={row.folioId}>
                      <Td className="font-mono text-xs">{row.folioNumber}</Td>
                      <Td className="text-sm">{row.guestName || 'â€”'}</Td>
                      <Td>{formatCurrency(row.totalCharges)}</Td>
                      <Td>{formatCurrency(row.totalPayments)}</Td>
                      <Td className={cn('font-semibold', row.balance > 0 ? 'text-rose-600' : 'text-emerald-600')}>
                        {formatCurrency(row.balance)}
                      </Td>
                      <Td>{row.settled ? <Badge variant="success">Settled</Badge> : <Badge variant="danger">Open</Badge>}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function FolioDetailPanel({ folioId }: { folioId: string }) {
  const qc = useQueryClient();

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
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const [chargeForm, setChargeForm] = useState({
    description: '',
    department: 'fb',
    amount: '',
    quantity: '1',
    taxPct: '5',
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

  const { data: folio, isLoading } = useQuery<Folio>({
    queryKey: ['folio', folioId],
    queryFn: () => api.get(`/api/folios/${folioId}`).then((r) => r.data.data),
    refetchInterval: 15000,
  });

  const { data: summary } = useQuery({
    queryKey: ['folio-summary', folioId],
    queryFn: () => api.get(`/api/folios/${folioId}/summary`).then((r) => r.data.data),
    enabled: !!folioId,
  });

  const { data: timeline } = useQuery({
    queryKey: ['folio-timeline', folioId],
    queryFn: () => api.get(`/api/folios/${folioId}/timeline`).then((r) => r.data.data),
    enabled: !!folioId && activeTab === 'timeline',
  });

  const { data: invoicePreview } = useQuery({
    queryKey: ['folio-invoice-preview', folioId],
    queryFn: () => api.get(`/api/folios/${folioId}/invoice-preview`).then((r) => r.data.data),
    enabled: !!folioId && activeTab === 'invoice',
  });

  const { data: checkoutValidation, refetch: refetchCheckoutValidation, isFetching: checkoutChecking } = useQuery({
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
      setChargeForm({ description: '', department: 'fb', amount: '', quantity: '1', taxPct: '5' });
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
    onSuccess: () => {
      toast.success('Folio settled');
      invalidateAll();
      setShowSettleModal(false);
      setSettleForm({ mode: 'cash', reference: '', notes: '' });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });
  function formatAddress(address: any) {
    if (!address) return '—';
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

    return '—';
  }
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
      const { data } = await api.get(`/api/payments/upi-qr/${folioId}`);
      setQrData(data.data);
      setShowQR(true);
    } catch {
      toast.error('QR generation failed');
    }
  }

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
      <div className="overflow-hidden rounded-[28px] border border-white/60 bg-white/80 shadow-xl backdrop-blur">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(236,72,153,0.18),_transparent_28%),linear-gradient(135deg,_#fff7ed,_#fff1f2_45%,_#ffffff)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 p-2.5 text-white shadow-lg">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-mono text-xl font-bold text-slate-900">{folio.folioNumber}</h2>
                  <p className="text-sm text-slate-500">
                    {guest?.firstName} {guest?.lastName} Â· Room {resv?.roomNumber || 'â€”'} Â· {resv?.bookingRef || 'â€”'}
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
              <p className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(folio.totalCharges - folio.totalTax)}</p>
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
        </div>
      </div>

      {checkoutValidation ? (
        <div
          className={cn(
            'rounded-2xl border p-4 text-sm',
            checkoutValidation.valid ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {!folio.isSettled && !roomChargePosted ? (
          <ActionCard icon={<BedDouble className="h-4 w-4" />} title="Post Room Charges" subtitle="Add room revenue and GST" onClick={postRoomCharges} />
        ) : null}
        {!folio.isSettled ? (
          <>
            <ActionCard icon={<Utensils className="h-4 w-4" />} title="Add Food Charges" subtitle="Import delivered restaurant items" onClick={postRestaurantCharges} />
            <ActionCard icon={<Plus className="h-4 w-4" />} title="Post Charge" subtitle="Manual laundry, transport, misc and more" onClick={() => setShowChargeModal(true)} />
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
            <ActionCard icon={<Percent className="h-4 w-4" />} title="Discount" subtitle="Apply approved discount or waiver" onClick={() => setShowDiscountModal(true)} />
            <ActionCard icon={<RotateCcw className="h-4 w-4" />} title="Refund" subtitle="Record refund against folio payment" onClick={() => setShowRefundModal(true)} tone="danger" />
            <ActionCard icon={<ArrowRightLeft className="h-4 w-4" />} title="Advance Adjust" subtitle="Adjust deposit or advance payment" onClick={() => setShowAdvanceModal(true)} />
            <ActionCard icon={<Scale className="h-4 w-4" />} title="Settle Folio" subtitle="Auto-settle remaining balance" onClick={() => setShowSettleModal(true)} tone="warning" />
          </>
        ) : null}
      </div>

      <Card className="border-white/60 bg-white/80 shadow-xl backdrop-blur">
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
          {activeTab === 'overview' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <SectionTitle title="Guest & Stay" />
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p><span className="font-semibold text-slate-900">Guest:</span> {guest?.firstName} {guest?.lastName}</p>
                  <p><span className="font-semibold text-slate-900">Phone:</span> {guest?.phone || 'â€”'}</p>
                  <p><span className="font-semibold text-slate-900">Email:</span> {guest?.email || 'â€”'}</p>
                  <p><span className="font-semibold text-slate-900">Booking Ref:</span> {resv?.bookingRef || 'â€”'}</p>
                  <p><span className="font-semibold text-slate-900">Room:</span> {resv?.roomNumber || 'â€”'}</p>
                  <p><span className="font-semibold text-slate-900">Stay:</span> {resv?.checkIn ? formatDate(resv.checkIn) : 'â€”'} to {resv?.checkOut ? formatDate(resv.checkOut) : 'â€”'}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <SectionTitle title="Folio Snapshot" />
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs text-slate-500">Charges</p>
                    <p className="mt-1 font-bold text-slate-900">{activeCharges.length}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs text-slate-500">Payments</p>
                    <p className="mt-1 font-bold text-slate-900">{folio.payments?.length || 0}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs text-slate-500">Invoice No</p>
                    <p className="mt-1 font-mono text-xs font-bold text-slate-900">{folio.gstInvoiceNo || 'Not generated'}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs text-slate-500">Settled At</p>
                    <p className="mt-1 text-xs font-semibold text-slate-900">{folio.settledAt ? formatDateTime(folio.settledAt) : 'Not settled'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'charges' && (
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
                  {folio.charges.map((c) => (
                    <Tr key={c._id} className={c.isVoid ? 'opacity-40 line-through' : ''}>
                      <Td className="font-medium text-sm">{c.description}</Td>
                      <Td>
                        <span className={cn('rounded-full px-2 py-1 text-[10px] font-semibold', DEPT_COLORS[c.department] || 'bg-slate-100 text-slate-600')}>
                          {DEPT_LABELS[c.department] || c.department}
                        </span>
                      </Td>
                      <Td className="text-sm">{c.quantity}</Td>
                      <Td className="text-sm">{formatCurrency(c.unitPrice)}</Td>
                      <Td className="text-sm text-amber-700">
                        {c.taxPct}% ({formatCurrency(c.taxAmount)})
                      </Td>
                      <Td className="font-semibold text-sm">{formatCurrency(c.amount + c.taxAmount)}</Td>
                      <Td className="text-xs text-slate-400">
                        {formatDate(c.postedAt, 'dd MMM, h:mm a')}
                        {c.postedBy && <span className="block">{c.postedBy.name}</span>}
                      </Td>
                      <Td>
                        {!c.isVoid && !folio.isSettled ? (
                          <button
                            onClick={() => {
                              if (confirm('Void this charge?')) voidCharge.mutate({ chargeId: c._id, reason: 'Voided by staff' });
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
          )}

          {activeTab === 'payments' && (
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
                  {folio.payments.map((p) => (
                    <Tr key={p._id}>
                      <Td>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                          {PAYMENT_MODE_LABELS[p.mode] || p.mode}
                        </span>
                        {p.isRefund ? <span className="ml-2 rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">Refund</span> : null}
                      </Td>
                      <Td className={cn('font-bold text-sm', p.isRefund ? 'text-rose-700' : 'text-emerald-700')}>
                        {p.isRefund ? '-' : '+'}
                        {formatCurrency(p.amount)}
                      </Td>
                      <Td className="font-mono text-xs text-slate-500">{p.reference || 'â€”'}</Td>
                      <Td className="text-xs text-slate-400">{formatDateTime(p.paidAt)}</Td>
                      <Td className="text-xs text-slate-500">{(p.receivedBy as any)?.name || 'â€”'}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )
          )}

          {activeTab === 'timeline' && (
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
                      <p className="text-sm font-semibold capitalize text-slate-900">{String(item.type).replace(/_/g, ' ')}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.description || item.notes || item.reference || item.invoiceNo || 'Folio event'}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.at ? formatDateTime(item.at) : 'â€”'}</p>
                    </div>
                    <div className="text-right text-sm font-bold text-slate-900">
                      {typeof item.amount === 'number' ? formatCurrency(item.amount) : ''}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'invoice' && (
            !invoicePreview ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <SectionTitle title="Hotel" />
                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <p className="font-semibold text-slate-900">{invoicePreview.hotel?.name}</p>
                      <p>{invoicePreview.hotel?.address}</p>
                      <p>GSTIN: {invoicePreview.hotel?.gstin || 'â€”'}</p>
                      <p>{invoicePreview.hotel?.phone} Â· {invoicePreview.hotel?.email}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <SectionTitle title="Invoice To" />
                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <p className="font-semibold text-slate-900">{invoicePreview.guest?.name}</p>
                      <p>{formatAddress(invoicePreview.guest?.address)}</p>
                      <p>Phone: {invoicePreview.guest?.phone || 'â€”'}</p>
                      <p>GSTIN: {invoicePreview.guest?.gstin || 'â€”'}</p>
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
                          <Td>{c.taxPct}%</Td>
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
          )}
        </CardContent>
      </Card>

      <Modal open={showChargeModal} onClose={() => setShowChargeModal(false)} title="Post Charge">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            postCharge.mutate({
              description: chargeForm.description,
              department: chargeForm.department,
              amount: parseFloat(chargeForm.amount),
              quantity: parseFloat(chargeForm.quantity),
              taxPct: parseFloat(chargeForm.taxPct),
            });
          }}
        >
          <Input
            label="Description"
            value={chargeForm.description}
            onChange={(e) => setChargeForm((p) => ({ ...p, description: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Department" value={chargeForm.department} onChange={(e) => setChargeForm((p) => ({ ...p, department: e.target.value }))}>
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
              label="Unit Price (â‚¹)"
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
              value={chargeForm.quantity}
              onChange={(e) => setChargeForm((p) => ({ ...p, quantity: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowChargeModal(false)}>Cancel</Button>
            <Button type="submit" loading={postCharge.isPending}>Post Charge</Button>
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
            <Input label="Amount (â‚¹)" type="number" min="0.01" step="0.01" value={payForm.amount} onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))} required />
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
          <Input label="Description" value={discountForm.description} onChange={(e) => setDiscountForm((p) => ({ ...p, description: e.target.value }))} required />
          <Input label="Amount (â‚¹)" type="number" min="0.01" step="0.01" value={discountForm.amount} onChange={(e) => setDiscountForm((p) => ({ ...p, amount: e.target.value }))} required />
          <Input label="Reason" value={discountForm.reason} onChange={(e) => setDiscountForm((p) => ({ ...p, reason: e.target.value }))} />
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
            <Input label="Amount (â‚¹)" type="number" min="0.01" step="0.01" value={refundForm.amount} onChange={(e) => setRefundForm((p) => ({ ...p, amount: e.target.value }))} required />
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
          <Input label="Amount (â‚¹)" type="number" min="0.01" step="0.01" value={advanceForm.amount} onChange={(e) => setAdvanceForm((p) => ({ ...p, amount: e.target.value }))} required />
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
    </div>
  );
}

function BillingContent() {
  const searchParams = useSearchParams();
  const [selectedFolioId, setSelectedFolioId] = useState<string | null>(searchParams.get('folioId'));
  const [showRecon, setShowRecon] = useState(false);

  return (
    <DashboardLayout title="Billing">
      <div className="space-y-5">
        <div className="overflow-hidden rounded-[28px] border border-white/60 bg-white/70 shadow-xl backdrop-blur">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(236,72,153,0.18),_transparent_24%),linear-gradient(135deg,_#fff7ed,_#fff1f2_45%,_#ffffff)] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-3xl bg-gradient-to-br from-orange-500 via-pink-500 to-rose-500 p-3 text-white shadow-lg">
                  <Receipt className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Billing & Folios</h1>
                  <p className="text-sm text-slate-600">Cashier console for charges, payments, settlement, GST invoices and reconciliation.</p>
                </div>
              </div>

              <Button
                variant="secondary"
                icon={<CalendarDays className="h-4 w-4" />}
                onClick={() => setShowRecon((s) => !s)}
              >
                {showRecon ? 'Hide Reconciliation' : 'Show Reconciliation'}
              </Button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-white/60">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-orange-500" />
                  <p className="text-xs text-slate-500">Charges</p>
                </div>
                <p className="mt-2 text-xl font-bold text-slate-900">Real-time folio posting</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-white/60">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs text-slate-500">Payments</p>
                </div>
                <p className="mt-2 text-xl font-bold text-slate-900">Cash, card, UPI, direct billing</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-white/60">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-pink-500" />
                  <p className="text-xs text-slate-500">Invoices</p>
                </div>
                <p className="mt-2 text-xl font-bold text-slate-900">GST preview, download and email</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-white/60">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-amber-500" />
                  <p className="text-xs text-slate-500">Settlement</p>
                </div>
                <p className="mt-2 text-xl font-bold text-slate-900">Validate, settle and close</p>
              </div>
            </div>
          </div>
        </div>

        {showRecon ? <ReconciliationPanel /> : null}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <FolioListPanel onSelect={setSelectedFolioId} selectedFolioId={selectedFolioId} />
          </div>

          <div className="lg:col-span-2">
            {selectedFolioId ? (
              <FolioDetailPanel folioId={selectedFolioId} />
            ) : (
              <Card className="border-white/60 bg-white/80 shadow-xl backdrop-blur">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="mb-4 rounded-3xl bg-gradient-to-br from-orange-500 to-pink-500 p-4 text-white shadow-lg">
                    <Receipt className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Select a folio</h3>
                  <p className="mt-2 max-w-sm text-sm text-slate-500">
                    Pick an open or unsettled folio from the left to manage charges, payments, settlement, invoice preview and reconciliation actions.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
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
