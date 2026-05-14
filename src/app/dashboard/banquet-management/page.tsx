'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Modal, Input, Spinner } from '@/components/ui';
import api from '@/lib/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import {
  PartyPopper,
  Plus,
  Edit2,
  Trash2,
  Search,
  Phone,
  Calendar,
  Building2,
  RefreshCw,
  X,
  Receipt,
  Utensils,
  Mic,
  Monitor,
  Car,
  Music,
  Camera,
  Star,
  Users,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  MapPin,
  FileText,
  BadgeIndianRupee,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BanquetHall {
  _id: string;
  name: string;
  capacity: number;
  area: number;
  ratePerDay: number;
  ratePerHour?: number;
  ratePerHalfDay: number;
  amenities: string[];
  isActive: boolean;
}

interface BanquetBooking {
  id?: string;
  _id: string;
  bookingRef: string;
  hallId: any;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  duration: 'full_day' | 'half_day' | 'hourly';
  guestCount: number;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  company?: string;
  services: string[];
  menuPackage?: string;
  cateringPax?: number;
  totalAmount: number;
  advancePaid: number;
  balanceDue: number;
  status: 'inquiry' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;

  billingName?: string;
  billingAddress?: string;
  gstin?: string;
  pan?: string;
  leadSource?: string;
  leadOwner?: string;
  eventCoordinator?: string;
  vegPax?: number;
  nonVegPax?: number;
  childPax?: number;
  complimentaryPax?: number;
  paymentMode?: string;
  paymentDueDate?: string;
  internalNotes?: string;
}

const EVENT_TYPES = [
  { value: 'wedding', label: '💍 Wedding' },
  { value: 'reception', label: '🥂 Reception' },
  { value: 'birthday', label: '🎂 Birthday Party' },
  { value: 'corporate', label: '💼 Corporate Event' },
  { value: 'conference', label: '🎤 Conference' },
  { value: 'seminar', label: '📚 Seminar' },
  { value: 'product_launch', label: '🚀 Product Launch' },
  { value: 'anniversary', label: '💑 Anniversary' },
  { value: 'engagement', label: '💍 Engagement' },
  { value: 'other', label: '🎉 Other' },
];

const ADDON_SERVICES = [
  { key: 'catering', label: 'Catering', icon: Utensils },
  { key: 'decoration', label: 'Decoration', icon: Star },
  { key: 'sound_system', label: 'Sound System', icon: Mic },
  { key: 'projector_av', label: 'Projector / AV', icon: Monitor },
  { key: 'parking', label: 'Valet Parking', icon: Car },
  { key: 'dj_music', label: 'DJ / Music', icon: Music },
  { key: 'photography', label: 'Photography', icon: Camera },
  { key: 'welcome_drinks', label: 'Welcome Drinks', icon: Sparkles },
];

const STATUS_CONFIG = {
  inquiry: { label: 'Inquiry', color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  confirmed: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  in_progress: { label: 'Happening', color: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500 animate-pulse' },
  completed: { label: 'Completed', color: 'bg-teal-100 text-teal-700', dot: 'bg-teal-500' },
  cancelled: { label: 'Cancelled', color: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
} as const;

const MENU_PACKAGES = [
  { value: 'veg_basic', label: 'Veg Basic — ₹650/pax', rate: 650 },
  { value: 'veg_premium', label: 'Veg Premium — ₹950/pax', rate: 950 },
  { value: 'nonveg_basic', label: 'Non-veg Basic — ₹850/pax', rate: 850 },
  { value: 'nonveg_premium', label: 'Non-veg Premium — ₹1200/pax', rate: 1200 },
  { value: 'custom', label: 'Custom Menu', rate: 0 },
];

const LEAD_SOURCES = [
  'walk_in',
  'phone',
  'website',
  'wedding_planner',
  'corporate_reference',
  'ota',
  'social_media',
  'repeat_client',
];

const PAYMENT_MODES = ['cash', 'upi', 'card', 'bank_transfer', 'cheque'];

const EMPTY_BOOKING = {
  hallId: '',
  eventType: 'wedding',
  eventDate: '',
  startTime: '09:00',
  endTime: '21:00',
  duration: 'full_day',
  guestCount: 100,

  clientName: '',
  clientPhone: '',
  clientEmail: '',
  company: '',
  billingName: '',
  billingAddress: '',
  gstin: '',
  pan: '',

  services: [] as string[],
  menuPackage: '',
  menuRate: 0,
  cateringPax: 0,

  vegPax: 0,
  nonVegPax: 0,
  childPax: 0,
  complimentaryPax: 0,

  hallRateOverride: 0,
  decorationCharge: 0,
  soundCharge: 0,
  avCharge: 0,
  parkingCharge: 0,
  miscCharge: 0,
  securityDeposit: 0,
  serviceChargePercent: 0,
  gstPercent: 18,
  roundOff: 0,

  advancePaid: 0,
  paymentMode: '',
  paymentDueDate: '',
  leadSource: 'walk_in',
  leadOwner: '',
  eventCoordinator: '',
  notes: '',
  internalNotes: '',
  status: 'inquiry',
};

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: any;
  tone: string;
}) {
  return (
    <div className={cn('rounded-3xl border p-4 shadow-sm', tone)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-75">{label}</p>
          <p className="mt-2 text-lg font-black tracking-tight">{value}</p>
        </div>
        <div className="rounded-2xl bg-white/70 p-3">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  onEdit,
  onDelete,
  onViewInvoice,
}: {
  booking: BanquetBooking;
  onEdit: (b: BanquetBooking) => void;
  onDelete: (id: string) => void;
  onViewInvoice: (id: string) => void;
}) {
  const st = STATUS_CONFIG[booking.status] || STATUS_CONFIG.inquiry;
  const evtType = EVENT_TYPES.find((e) => e.value === booking.eventType);
  const hall = booking.hallId && typeof booking.hallId === 'object' ? booking.hallId : null;

  const flags = [
    booking.balanceDue > 0 ? 'Advance Pending' : null,
    booking.services?.includes('catering') && !booking.menuPackage ? 'Menu Pending' : null,
    !booking.eventCoordinator ? 'Coordinator Missing' : null,
    booking.company && !booking.gstin ? 'GST Missing' : null,
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-[0_18px_45px_-24px_rgba(255,120,92,0.35)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_65px_-24px_rgba(255,120,92,0.45)]"
    >
      <div className="h-1 bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500" />

      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 via-rose-100 to-fuchsia-100 text-xl">
              {evtType?.label.split(' ')[0] || '🎉'}
            </div>
            <div className="min-w-0">
              <p className="truncate font-extrabold text-slate-900">{booking.clientName}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <Phone className="h-3 w-3" />
                {booking.clientPhone}
              </p>
            </div>
          </div>

          <span className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold', st.color)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
            {st.label}
          </span>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          {[
            { label: 'Event', value: evtType?.label || booking.eventType },
            { label: 'Date', value: formatDate(booking.eventDate) },
            { label: 'Hall', value: hall?.name || '—' },
            { label: 'Guests', value: `${booking.guestCount} pax` },
            { label: 'Time', value: `${booking.startTime} – ${booking.endTime}` },
            { label: 'Ref', value: booking.bookingRef, mono: true },
          ].map((d) => (
            <div key={d.label} className="rounded-2xl border border-orange-50 bg-gradient-to-b from-orange-50/70 to-white p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{d.label}</p>
              <p className={cn('mt-1 truncate text-xs font-bold text-slate-900', d.mono && 'font-mono')}>{d.value}</p>
            </div>
          ))}
        </div>

        {booking.services?.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {booking.services.map((s) => {
              const svc = ADDON_SERVICES.find((a) => a.key === s);
              return (
                <span
                  key={s}
                  className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2 py-1 text-[10px] font-semibold text-fuchsia-700"
                >
                  {svc?.label || s}
                </span>
              );
            })}
          </div>
        )}

        {flags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {flags.map((f) => (
              <span
                key={String(f)}
                className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700"
              >
                {f}
              </span>
            ))}
          </div>
        )}

        <div className="mb-4 grid grid-cols-3 gap-2 border-t border-orange-100 pt-3 text-center">
          {[
            { label: 'Total', value: formatCurrency(booking.totalAmount), color: 'text-slate-900' },
            { label: 'Advance', value: formatCurrency(booking.advancePaid), color: 'text-emerald-600' },
            { label: 'Balance', value: formatCurrency(booking.balanceDue), color: booking.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600' },
          ].map((f) => (
            <div key={f.label} className="rounded-2xl bg-slate-50 p-2">
              <p className={cn('text-sm font-black', f.color)}>{f.value}</p>
              <p className="mt-0.5 text-[10px] text-slate-400">{f.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onViewInvoice(booking._id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
          >
            <Receipt className="h-3.5 w-3.5" />
            Invoice
          </button>
          <button
            onClick={() => onEdit(booking)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-rose-50 py-2.5 text-xs font-bold text-orange-700 transition hover:brightness-95"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm('Cancel this booking?')) onDelete(booking._id);
            }}
            className="rounded-2xl border border-rose-200 p-2.5 text-rose-500 transition hover:bg-rose-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function HallCard({ hall }: { hall: BanquetHall }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-[0_16px_40px_-22px_rgba(255,120,92,0.35)]"
    >
      <div className="h-1 bg-gradient-to-r from-orange-400 via-rose-400 to-fuchsia-500" />
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-black text-slate-900">{hall.name}</h3>
            <p className="mt-1 text-xs text-slate-400">
              {hall.area} sq ft · {hall.capacity} capacity
            </p>
          </div>
          <span className={cn(
            'rounded-full px-2.5 py-1 text-[10px] font-bold',
            hall.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          )}>
            {hall.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-orange-100 bg-gradient-to-b from-orange-50 to-white p-3 text-center">
            <p className="text-sm font-black text-slate-900">{formatCurrency(hall.ratePerDay)}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Full Day</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-gradient-to-b from-rose-50 to-white p-3 text-center">
            <p className="text-sm font-black text-slate-900">{formatCurrency(hall.ratePerHalfDay)}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Half Day</p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-2xl bg-slate-50 p-2 text-slate-600">
            Theatre: <span className="font-bold text-slate-900">{Math.floor(hall.capacity * 1.1)}</span>
          </div>
          <div className="rounded-2xl bg-slate-50 p-2 text-slate-600">
            Dining: <span className="font-bold text-slate-900">{Math.floor(hall.capacity * 0.8)}</span>
          </div>
          <div className="rounded-2xl bg-slate-50 p-2 text-slate-600">
            Cluster: <span className="font-bold text-slate-900">{Math.floor(hall.capacity * 0.7)}</span>
          </div>
          <div className="rounded-2xl bg-slate-50 p-2 text-slate-600">
            Classroom: <span className="font-bold text-slate-900">{Math.floor(hall.capacity * 0.6)}</span>
          </div>
        </div>

        {hall.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {hall.amenities.map((a) => (
              <span
                key={a}
                className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2 py-1 text-[10px] font-semibold text-fuchsia-700"
              >
                {a}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function BanquetPage() {
  const qc = useQueryClient();

  const [tab, setTab] = useState<'bookings' | 'halls' | 'calendar'>('bookings');
  const [search, setSearch] = useState('');
  const [stFilter, setStFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editBooking, setEditBooking] = useState<BanquetBooking | null>(null);
  const [form, setForm] = useState<any>(EMPTY_BOOKING);
  const [selectedHall, setSelectedHall] = useState('');
  const [showHallModal, setShowHallModal] = useState(false);
  const [hallForm, setHallForm] = useState<any>({
    name: '',
    capacity: 200,
    area: 3000,
    ratePerDay: 25000,
    ratePerHalfDay: 15000,
    amenities: [] as string[],
    isActive: true,
  });
  const [calMonth, setCalMonth] = useState(new Date());
  const [step, setStep] = useState(1);

  const { data: bookings, isLoading, refetch } = useQuery<BanquetBooking[]>({
    queryKey: ['banquet-bookings', stFilter],
    queryFn: () =>
      api
        .get('/api/banquet/bookings', { params: stFilter ? { status: stFilter } : {} })
        .then((r) => r.data.data?.docs || r.data.data || []),
    refetchInterval: 60_000,
  });

  const { data: halls } = useQuery<BanquetHall[]>({
    queryKey: ['banquet-halls'],
    queryFn: () => api.get('/api/banquet/halls').then((r) => r.data.data || []),
  });

  const selectedHallData = useMemo(
    () => (halls || []).find((h) => h._id === selectedHall),
    [halls, selectedHall]
  );

  const pricing = useMemo(() => {
    const num = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const hallRateDefault =
      form.duration === 'half_day'
        ? num(selectedHallData?.ratePerHalfDay)
        : form.duration === 'hourly'
          ? num(selectedHallData?.ratePerHour) * 4
          : num(selectedHallData?.ratePerDay);

    const hallRate =
      num(form.hallRateOverride) > 0 ? num(form.hallRateOverride) : hallRateDefault;

    const vegPax = num(form.vegPax);
    const nonVegPax = num(form.nonVegPax);
    const childPax = num(form.childPax);

    const totalCateringPax =
      num(form.cateringPax) > 0 ? num(form.cateringPax) : vegPax + nonVegPax + childPax;

    const menuRate = num(form.menuRate);

    const catering =
      form.services?.includes('catering') ? totalCateringPax * menuRate : 0;

    const addons =
      num(form.decorationCharge) +
      num(form.soundCharge) +
      num(form.avCharge) +
      num(form.parkingCharge) +
      num(form.miscCharge);

    const subTotal = hallRate + catering + addons;

    const serviceChargePercent = num(form.serviceChargePercent);
    const gstPercent = num(form.gstPercent);

    const serviceCharge = (subTotal * serviceChargePercent) / 100;
    const taxableAmount = subTotal + serviceCharge;
    const gst = (taxableAmount * gstPercent) / 100;

    const securityDeposit = num(form.securityDeposit);
    const roundOff = num(form.roundOff);
    const advancePaid = num(form.advancePaid);

    const grandTotal = taxableAmount + gst + securityDeposit + roundOff;
    const balanceDue = Math.max(0, grandTotal - advancePaid);

    return {
      hallRate,
      menuRate,
      totalCateringPax,
      catering,
      addons,
      subTotal,
      serviceCharge,
      taxableAmount,
      gst,
      securityDeposit,
      roundOff,
      advancePaid,
      grandTotal,
      balanceDue,
    };
  }, [form, selectedHallData]);

  const saveMut = useMutation({
    mutationFn: (d: any) =>
      editBooking
        ? api.put(`/api/banquet/bookings/${editBooking._id}`, d)
        : api.post('/api/banquet/bookings', d),
    onSuccess: () => {
      toast.success(editBooking ? 'Booking updated!' : 'Banquet booking created!');
      qc.invalidateQueries({ queryKey: ['banquet-bookings'] });
      setShowModal(false);
      setEditBooking(null);
      setForm(EMPTY_BOOKING);
      setSelectedHall('');
      setStep(1);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/api/banquet/bookings/${id}`),
    onSuccess: () => {
      toast.success('Booking cancelled');
      qc.invalidateQueries({ queryKey: ['banquet-bookings'] });
    },
  });

  const saveHallMut = useMutation({
    mutationFn: (d: any) => api.post('/api/banquet/halls', d),
    onSuccess: () => {
      toast.success('Hall added!');
      qc.invalidateQueries({ queryKey: ['banquet-halls'] });
      setShowHallModal(false);
      setHallForm({
        name: '',
        capacity: 200,
        area: 3000,
        ratePerDay: 25000,
        ratePerHalfDay: 15000,
        amenities: [],
        isActive: true,
      });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  function openEdit(b: BanquetBooking) {
    setEditBooking(b);
    setForm({
      ...EMPTY_BOOKING,
      eventType: b.eventType,
      eventDate: b.eventDate.split('T')[0],
      startTime: b.startTime,
      endTime: b.endTime,
      duration: b.duration,
      guestCount: b.guestCount,
      clientName: b.clientName,
      clientPhone: b.clientPhone,
      clientEmail: b.clientEmail || '',
      company: b.company || '',
      services: b.services || [],
      menuPackage: b.menuPackage || '',
      cateringPax: b.cateringPax || 0,
      advancePaid: b.advancePaid,
      notes: b.notes || '',
      billingName: b.billingName || '',
      billingAddress: b.billingAddress || '',
      gstin: b.gstin || '',
      pan: b.pan || '',
      leadSource: b.leadSource || 'walk_in',
      leadOwner: b.leadOwner || '',
      eventCoordinator: b.eventCoordinator || '',
      vegPax: b.vegPax || 0,
      nonVegPax: b.nonVegPax || 0,
      childPax: b.childPax || 0,
      complimentaryPax: b.complimentaryPax || 0,
      paymentMode: b.paymentMode || '',
      paymentDueDate: b.paymentDueDate || '',
      internalNotes: b.internalNotes || '',
      status: b.status || 'inquiry',
    });
    setSelectedHall(typeof b.hallId === 'object' ? b.hallId?._id : b.hallId || '');
    setStep(1);
    setShowModal(true);
  }

  function toggleService(key: string) {
    setForm((p: any) => ({
      ...p,
      services: p.services.includes(key)
        ? p.services.filter((s: string) => s !== key)
        : [...p.services, key],
    }));
  }
  function openInvoicePdf(bookingId?: string) {
  if (!bookingId) {
    toast.error('Invoice not available for this booking');
    return;
  }

  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

  window.open(`${base}/api/banquet-booking/${bookingId}/invoice`, '_blank', 'noopener,noreferrer');
}
  function resetModal() {
    setShowModal(false);
    setEditBooking(null);
    setForm(EMPTY_BOOKING);
    setSelectedHall('');
    setStep(1);
  }

  const all = Array.isArray(bookings) ? bookings : [];

  const filtered = all.filter((b: any) => {
    if (stFilter && (b.status || '') !== stFilter) return false;

    if (search) {
      const q = search.toLowerCase().trim();

      const clientName = String(b.clientName || '').toLowerCase();
      const bookingRef = String(b.bookingRef || '').toLowerCase();
      const clientPhone = String(b.clientPhone || '');
      const company = String(b.company || '').toLowerCase();

      const matches =
        clientName.includes(q) ||
        bookingRef.includes(q) ||
        clientPhone.includes(search) ||
        company.includes(q);

      if (!matches) return false;
    }

    return true;
  });
  function handleSave() {
    const payload = {
      ...form,
      hallId: selectedHall || undefined,

      hallRate: pricing.hallRate,
      menuRate: pricing.menuRate,
      cateringPax: pricing.totalCateringPax,

      subTotal: pricing.subTotal,
      serviceChargeAmount: pricing.serviceCharge,
      gstAmount: pricing.gst,
      totalAmount: pricing.grandTotal,
      balanceDue: pricing.balanceDue,

      paymentDueDate: form.paymentDueDate || undefined,
    };

    saveMut.mutate(payload);
  }
  const stats = {
    total: all.length,
    confirmed: all.filter((b) => b.status === 'confirmed').length,
    thisMonth: all.filter((b) => {
      const d = new Date(b.eventDate);
      const n = new Date();
      return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
    }).length,
    revenue: all
      .filter((b) => b.status === 'completed')
      .reduce((s, b) => s + Number(b.totalAmount || 0), 0),
    outstanding: all
      .filter((b) => b.status !== 'cancelled')
      .reduce((s, b) => s + Number(b.balanceDue || 0), 0),
    upcoming: all.filter(
      (b) => new Date(b.eventDate).getTime() >= new Date().setHours(0, 0, 0, 0)
    ).length,
  };

  const calBookings = all.filter((b) => {
    const d = new Date(b.eventDate);
    return d.getMonth() === calMonth.getMonth() && d.getFullYear() === calMonth.getFullYear();
  });

  const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay();

  const upcomingBookings = [...all]
    .filter((b) => new Date(b.eventDate).getTime() >= new Date().setHours(0, 0, 0, 0))
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 5);

  return (
    <DashboardLayout title="Banquet">
      <div className="max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[30px] bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500 p-6 text-white shadow-[0_30px_80px_-28px_rgba(244,63,94,0.7)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Premium Banquet Workspace
              </div>
              <h1 className="text-2xl font-black tracking-tight">Banquet & Events</h1>
              <p className="mt-1 text-sm text-white/80">
                {stats.total} bookings · {stats.confirmed} confirmed · {stats.upcoming} upcoming · {halls?.length || 0} halls
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>

              {tab === 'halls' && (
                <Button
                  variant="secondary"
                  onClick={() => setShowHallModal(true)}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Add Hall
                </Button>
              )}

              <Button
                onClick={() => {
                  setEditBooking(null);
                  setForm(EMPTY_BOOKING);
                  setSelectedHall('');
                  setStep(1);
                  setShowModal(true);
                }}
                icon={<Plus className="h-4 w-4" />}
                className="rounded-2xl border-0 bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_30px_-10px_rgba(244,63,94,0.65)] hover:brightness-105"
              >
                New Booking
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Total" value={stats.total} icon={ClipboardList} tone="bg-white text-slate-900 border-orange-100" />
          <StatCard label="Confirmed" value={stats.confirmed} icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700 border-emerald-200" />
          <StatCard label="This Month" value={stats.thisMonth} icon={Calendar} tone="bg-sky-50 text-sky-700 border-sky-200" />
          <StatCard label="Revenue" value={formatCurrency(stats.revenue)} icon={IndianRupee} tone="bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" />
          <StatCard label="Outstanding" value={formatCurrency(stats.outstanding)} icon={AlertTriangle} tone="bg-amber-50 text-amber-700 border-amber-200" />
          <StatCard label="Upcoming" value={stats.upcoming} icon={PartyPopper} tone="bg-rose-50 text-rose-700 border-rose-200" />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.65fr_1fr]">
          <div className="rounded-[28px] border border-orange-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex gap-1 rounded-2xl bg-slate-100 p-1 w-fit">
              {[
                { id: 'bookings', label: 'Bookings' },
                { id: 'calendar', label: 'Calendar' },
                { id: 'halls', label: 'Halls' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as any)}
                  className={cn(
                    'rounded-2xl px-4 py-2 text-sm font-semibold transition-all',
                    tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'bookings' && (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-2xl border border-orange-100 bg-orange-50/50 px-3 py-2.5">
                    <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search client, ref, phone..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <select
                    value={stFilter}
                    onChange={(e) => setStFilter(e.target.value)}
                    className="rounded-2xl border border-orange-100 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
                  >
                    <option value="">All Statuses</option>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>

                  {(search || stFilter) && (
                    <button
                      onClick={() => {
                        setSearch('');
                        setStFilter('');
                      }}
                      className="flex items-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold text-rose-500"
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear
                    </button>
                  )}
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-20">
                    <Spinner size="lg" />
                  </div>
                ) : !filtered.length ? (
                  <div className="rounded-[26px] border border-dashed border-orange-200 bg-gradient-to-b from-orange-50/70 to-white py-16 text-center">
                    <PartyPopper className="mx-auto mb-3 h-12 w-12 text-orange-200" />
                    <p className="font-semibold text-slate-500">No banquet bookings yet</p>
                    <Button
                      className="mt-4"
                      onClick={() => setShowModal(true)}
                      icon={<Plus className="h-4 w-4" />}
                    >
                      Create First Booking
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {filtered.map((b) => (
                      <BookingCard
                        key={b._id || b.id || b.bookingRef}
                        booking={b}
                        onEdit={openEdit}
                        onDelete={(id) => deleteMut.mutate(id)}
                        onViewInvoice={openInvoicePdf}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'calendar' && (
              <div className="overflow-hidden rounded-[26px] border border-orange-100 bg-white">
                <div className="flex items-center justify-between border-b border-orange-100 px-5 py-4">
                  <button
                    onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                    className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <h3 className="font-bold text-slate-900">
                    {calMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                    className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-4">
                  <div className="mb-2 grid grid-cols-7 gap-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                      <div key={d} className="py-1 text-center text-[11px] font-semibold text-slate-400">
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}

                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                      const dayBookings = calBookings.filter(
                        (b) => new Date(b.eventDate).getDate() === day
                      );
                      const isToday =
                        new Date().getDate() === day &&
                        new Date().getMonth() === calMonth.getMonth() &&
                        new Date().getFullYear() === calMonth.getFullYear();

                      return (
                        <div
                          key={day}
                          className={cn(
                            'min-h-[78px] cursor-pointer rounded-2xl border p-1.5 transition-all hover:border-orange-300',
                            isToday
                              ? 'border-orange-400 bg-orange-50'
                              : dayBookings.length > 0
                                ? 'border-slate-200 bg-white'
                                : 'border-slate-100 bg-slate-50/60'
                          )}
                        >
                          <p className={cn('mb-1 text-right text-xs font-black', isToday ? 'text-orange-600' : 'text-slate-700')}>
                            {day}
                          </p>

                          {dayBookings.slice(0, 2).map((b) => {
                            const st = STATUS_CONFIG[b.status];
                            const et = EVENT_TYPES.find((e) => e.value === b.eventType);
                            return (
                              <div
                                key={b._id}
                                className={cn('mb-0.5 truncate rounded-md px-1.5 py-0.5 text-[9px] font-bold', st.color)}
                              >
                                {et?.label.split(' ')[0]} {b.clientName.split(' ')[0]}
                              </div>
                            );
                          })}

                          {dayBookings.length > 2 && (
                            <div className="text-[9px] font-medium text-slate-400">
                              +{dayBookings.length - 2} more
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {calBookings.length > 0 && (
                  <div className="px-5 pb-5">
                    <h4 className="mb-3 text-sm font-black text-slate-900">This Month's Events</h4>
                    <div className="space-y-2">
                      {calBookings
                        .sort(
                          (a, b) =>
                            new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
                        )
                        .map((b) => {
                          const st = STATUS_CONFIG[b.status];
                          const et = EVENT_TYPES.find((e) => e.value === b.eventType);
                          const hall = typeof b.hallId === 'object' ? b.hallId : null;
                          return (
                            <div
                              key={b._id}
                              className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                            >
                              <span className="text-xl">{et?.label.split(' ')[0] || '🎉'}</span>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-slate-900">{b.clientName}</p>
                                <p className="text-xs text-slate-400">
                                  {formatDate(b.eventDate)} · {b.startTime}–{b.endTime} · {b.guestCount} guests
                                  {hall && ` · ${hall.name}`}
                                </p>
                              </div>
                              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', st.color)}>
                                {st.label}
                              </span>
                              <span className="text-sm font-black text-slate-900">
                                {formatCurrency(b.totalAmount)}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'halls' && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {!halls?.length ? (
                  <div className="col-span-2 rounded-[26px] border border-dashed border-orange-200 bg-gradient-to-b from-orange-50/70 to-white py-16 text-center">
                    <Building2 className="mx-auto mb-3 h-10 w-10 text-orange-200" />
                    <p className="font-semibold text-slate-500">No banquet halls configured</p>
                    <Button
                      onClick={() => setShowHallModal(true)}
                      icon={<Plus className="h-4 w-4" />}
                      className="rounded-2xl mt-4 border-0 bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_30px_-10px_rgba(244,63,94,0.65)] hover:brightness-105"

                    >
                      Add First Hall
                    </Button>
                  </div>
                ) : (
                  halls.map((hall) => <HallCard key={hall._id} hall={hall} />)
                )}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-gradient-to-br from-orange-100 to-rose-100 p-2.5">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900">Upcoming Events</h3>
                  <p className="text-xs text-slate-400">Closest banquet schedule</p>
                </div>
              </div>

              {!upcomingBookings.length ? (
                <p className="text-sm text-slate-400">No upcoming events.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((b) => {
                    const et = EVENT_TYPES.find((e) => e.value === b.eventType);
                    const hall = typeof b.hallId === 'object' ? b.hallId : null;
                    return (
                      <div key={b._id} className="rounded-2xl bg-slate-50 p-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 text-lg">{et?.label.split(' ')[0] || '🎉'}</div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-900">{b.clientName}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {formatDate(b.eventDate)} · {b.startTime}–{b.endTime}
                              {hall ? ` · ${hall.name}` : ''}
                            </p>
                          </div>
                          <span className="text-xs font-black text-slate-900">{formatCurrency(b.totalAmount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-orange-100 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-2xl bg-white p-2.5 shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900">India checklist</h3>
                  <p className="text-xs text-slate-400">Suggested banquet essentials</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="rounded-2xl bg-white/80 p-3">GST billing fields for company bookings</div>
                <div className="rounded-2xl bg-white/80 p-3">Advance, balance, payment mode, due date</div>
                <div className="rounded-2xl bg-white/80 p-3">Banquet order readiness: menu, AV, décor, parking</div>
                <div className="rounded-2xl bg-white/80 p-3">Lead source and coordinator tracking</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={resetModal}
        title={editBooking ? 'Edit Booking' : 'New Banquet Booking'}
        size="xl"
      >
        <div className="grid max-h-[80vh] grid-cols-1 gap-5 overflow-y-auto pr-1 lg:grid-cols-[1.35fr_0.8fr]">
          <div className="space-y-5">
            <div className="rounded-[24px] border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-rose-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-black text-slate-900">Booking flow</h3>
                <span className="text-xs font-semibold text-slate-400">Step {step} / 4</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 1, label: 'Client' },
                  { id: 2, label: 'Event' },
                  { id: 3, label: 'Services' },
                  { id: 4, label: 'Commercials' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStep(s.id)}
                    className={cn(
                      'rounded-2xl border px-3 py-2 text-xs font-bold transition',
                      step === s.id
                        ? 'border-orange-300 bg-white text-orange-700 shadow-sm'
                        : 'border-transparent bg-white/70 text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-5">
                <section className="rounded-[24px] border border-orange-100 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-2xl bg-orange-100 p-2.5">
                      <Users className="h-4 w-4 text-orange-600" />
                    </div>
                    <h4 className="font-black text-slate-900">Client Information</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Input label="Client Name *" value={form.clientName} onChange={(e) => setForm((p: any) => ({ ...p, clientName: e.target.value }))} placeholder="Full name" required />
                    <Input label="Phone *" value={form.clientPhone} onChange={(e) => setForm((p: any) => ({ ...p, clientPhone: e.target.value }))} placeholder="+91 XXXXX XXXXX" required />
                    <Input label="Email" value={form.clientEmail} onChange={(e) => setForm((p: any) => ({ ...p, clientEmail: e.target.value }))} placeholder="email@example.com" />
                    <Input label="Company / Organisation" value={form.company} onChange={(e) => setForm((p: any) => ({ ...p, company: e.target.value }))} placeholder="Optional" />
                    <div className="md:col-span-2">
                      <Input label="Billing Name" value={form.billingName} onChange={(e) => setForm((p: any) => ({ ...p, billingName: e.target.value }))} placeholder="Billing party name" />
                    </div>
                    <Input label="GSTIN" value={form.gstin} onChange={(e) => setForm((p: any) => ({ ...p, gstin: e.target.value.toUpperCase() }))} placeholder="22AAAAA0000A1Z5" />
                    <Input label="PAN" value={form.pan} onChange={(e) => setForm((p: any) => ({ ...p, pan: e.target.value.toUpperCase() }))} placeholder="ABCDE1234F" />
                    <div className="md:col-span-2">
                      <Input label="Billing Address" value={form.billingAddress} onChange={(e) => setForm((p: any) => ({ ...p, billingAddress: e.target.value }))} placeholder="Address for invoice" />
                    </div>
                  </div>
                </section>

                <section className="rounded-[24px] border border-rose-100 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-2xl bg-rose-100 p-2.5">
                      <FileText className="h-4 w-4 text-rose-600" />
                    </div>
                    <h4 className="font-black text-slate-900">Lead Tracking</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-slate-700">Lead Source</p>
                      <select
                        value={form.leadSource}
                        onChange={(e) => setForm((p: any) => ({ ...p, leadSource: e.target.value }))}
                        className="w-full rounded-2xl border border-orange-100 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none"
                      >
                        {LEAD_SOURCES.map((s) => (
                          <option key={s} value={s}>
                            {s.replaceAll('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input label="Lead Owner" value={form.leadOwner} onChange={(e) => setForm((p: any) => ({ ...p, leadOwner: e.target.value }))} placeholder="Sales executive" />
                  </div>
                </section>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <section className="rounded-[24px] border border-orange-100 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-2xl bg-orange-100 p-2.5">
                      <PartyPopper className="h-4 w-4 text-orange-600" />
                    </div>
                    <h4 className="font-black text-slate-900">Event Type</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {EVENT_TYPES.map((et) => (
                      <button
                        key={et.value}
                        onClick={() => setForm((p: any) => ({ ...p, eventType: et.value }))}
                        className={cn(
                          'rounded-2xl border px-2 py-2.5 text-xs font-bold transition',
                          form.eventType === et.value
                            ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-rose-50 text-orange-700'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        )}
                      >
                        {et.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-[24px] border border-rose-100 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-2xl bg-rose-100 p-2.5">
                      <Calendar className="h-4 w-4 text-rose-600" />
                    </div>
                    <h4 className="font-black text-slate-900">Event Details</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <Input label="Event Date *" type="date" value={form.eventDate} onChange={(e) => setForm((p: any) => ({ ...p, eventDate: e.target.value }))} required />
                    <Input label="Start Time" type="time" value={form.startTime} onChange={(e) => setForm((p: any) => ({ ...p, startTime: e.target.value }))} />
                    <Input label="End Time" type="time" value={form.endTime} onChange={(e) => setForm((p: any) => ({ ...p, endTime: e.target.value }))} />
                    <Input label="Guest Count *" type="number" value={form.guestCount} onChange={(e) => setForm((p: any) => ({ ...p, guestCount: parseInt(e.target.value) || 0 }))} min="1" />
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-slate-700">Hall</p>
                      <select
                        value={selectedHall}
                        onChange={(e) => setSelectedHall(e.target.value)}
                        className="w-full rounded-2xl border border-orange-100 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none"
                      >
                        <option value="">Select a hall...</option>
                        {(halls || []).map((h) => (
                          <option key={h._id} value={h._id}>
                            {h.name} — {h.capacity} pax
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <p className="mb-1.5 text-sm font-medium text-slate-700">Duration</p>
                      <select
                        value={form.duration}
                        onChange={(e) => setForm((p: any) => ({ ...p, duration: e.target.value }))}
                        className="w-full rounded-2xl border border-orange-100 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none"
                      >
                        <option value="full_day">Full Day</option>
                        <option value="half_day">Half Day</option>
                        <option value="hourly">Hourly</option>
                      </select>
                    </div>
                  </div>

                  {selectedHallData && (
                    <div className="mt-4 rounded-[22px] border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-rose-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-900">{selectedHallData.name}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {selectedHallData.capacity} pax · {selectedHallData.area} sq ft
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Default rate</p>
                          <p className="font-black text-slate-900">
                            {formatCurrency(
                              form.duration === 'half_day'
                                ? selectedHallData.ratePerHalfDay
                                : selectedHallData.ratePerDay
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Input label="Veg Pax" type="number" value={form.vegPax} onChange={(e) => setForm((p: any) => ({ ...p, vegPax: parseInt(e.target.value) || 0 }))} />
                    <Input label="Non-veg Pax" type="number" value={form.nonVegPax} onChange={(e) => setForm((p: any) => ({ ...p, nonVegPax: parseInt(e.target.value) || 0 }))} />
                    <Input label="Child Pax" type="number" value={form.childPax} onChange={(e) => setForm((p: any) => ({ ...p, childPax: parseInt(e.target.value) || 0 }))} />
                    <Input label="Complimentary" type="number" value={form.complimentaryPax} onChange={(e) => setForm((p: any) => ({ ...p, complimentaryPax: parseInt(e.target.value) || 0 }))} />
                  </div>
                </section>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <section className="rounded-[24px] border border-fuchsia-100 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-2xl bg-fuchsia-100 p-2.5">
                      <Sparkles className="h-4 w-4 text-fuchsia-600" />
                    </div>
                    <h4 className="font-black text-slate-900">Add-on Services</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {ADDON_SERVICES.map((svc) => {
                      const selected = form.services?.includes(svc.key);
                      return (
                        <button
                          key={svc.key}
                          onClick={() => toggleService(svc.key)}
                          className={cn(
                            'flex items-center gap-2 rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition-all',
                            selected
                              ? 'border-fuchsia-300 bg-gradient-to-r from-fuchsia-50 to-rose-50 text-fuchsia-700'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          )}
                        >
                          {svc.icon && <svc.icon className="h-4 w-4 flex-shrink-0" />}
                          {svc.label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {form.services?.includes('catering') && (
                  <section className="rounded-[24px] border border-emerald-100 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="rounded-2xl bg-emerald-100 p-2.5">
                        <Utensils className="h-4 w-4 text-emerald-600" />
                      </div>
                      <h4 className="font-black text-slate-900">Catering Package</h4>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <p className="mb-1.5 text-sm font-medium text-slate-700">Menu Package</p>
                        <select
                          value={form.menuPackage}
                          onChange={(e) => {
                            const pkg = MENU_PACKAGES.find((m) => m.value === e.target.value);
                            setForm((p: any) => ({
                              ...p,
                              menuPackage: e.target.value,
                              menuRate: pkg?.rate || 0,
                            }));
                          }}
                          className="w-full rounded-2xl border border-orange-100 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none"
                        >
                          <option value="">Select package...</option>
                          {MENU_PACKAGES.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <Input
                        label="Menu Rate / Pax"
                        type="number"
                        value={form.menuRate}
                        onChange={(e) => setForm((p: any) => ({ ...p, menuRate: parseFloat(e.target.value) || 0 }))}
                      />

                      <Input
                        label="Catering Pax"
                        type="number"
                        value={form.cateringPax}
                        onChange={(e) => setForm((p: any) => ({ ...p, cateringPax: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </section>
                )}

                <section className="rounded-[24px] border border-amber-100 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-2xl bg-amber-100 p-2.5">
                      <ClipboardList className="h-4 w-4 text-amber-600" />
                    </div>
                    <h4 className="font-black text-slate-900">Operations</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Input label="Event Coordinator" value={form.eventCoordinator} onChange={(e) => setForm((p: any) => ({ ...p, eventCoordinator: e.target.value }))} placeholder="Assign coordinator" />
                    <Input label="Notes" value={form.notes} onChange={(e) => setForm((p: any) => ({ ...p, notes: e.target.value }))} placeholder="Special requirements" />
                    <div className="md:col-span-2">
                      <Input label="Internal Notes" value={form.internalNotes} onChange={(e) => setForm((p: any) => ({ ...p, internalNotes: e.target.value }))} placeholder="Ops, kitchen, AV, décor, vendor notes" />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <section className="rounded-[24px] border border-orange-100 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-2xl bg-orange-100 p-2.5">
                      <BadgeIndianRupee className="h-4 w-4 text-orange-600" />
                    </div>
                    <h4 className="font-black text-slate-900">Charges</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <Input label="Hall Rate Override" type="number" value={form.hallRateOverride} onChange={(e) => setForm((p: any) => ({ ...p, hallRateOverride: parseFloat(e.target.value) || 0 }))} />
                    <Input label="Decoration Charge" type="number" value={form.decorationCharge} onChange={(e) => setForm((p: any) => ({ ...p, decorationCharge: parseFloat(e.target.value) || 0 }))} />
                    <Input label="Sound Charge" type="number" value={form.soundCharge} onChange={(e) => setForm((p: any) => ({ ...p, soundCharge: parseFloat(e.target.value) || 0 }))} />
                    <Input label="AV Charge" type="number" value={form.avCharge} onChange={(e) => setForm((p: any) => ({ ...p, avCharge: parseFloat(e.target.value) || 0 }))} />
                    <Input label="Parking Charge" type="number" value={form.parkingCharge} onChange={(e) => setForm((p: any) => ({ ...p, parkingCharge: parseFloat(e.target.value) || 0 }))} />
                    <Input label="Misc Charge" type="number" value={form.miscCharge} onChange={(e) => setForm((p: any) => ({ ...p, miscCharge: parseFloat(e.target.value) || 0 }))} />
                    <Input label="Security Deposit" type="number" value={form.securityDeposit} onChange={(e) => setForm((p: any) => ({ ...p, securityDeposit: parseFloat(e.target.value) || 0 }))} />
                    <Input label="Service Charge %" type="number" value={form.serviceChargePercent} onChange={(e) => setForm((p: any) => ({ ...p, serviceChargePercent: parseFloat(e.target.value) || 0 }))} />
                    <Input label="GST %" type="number" value={form.gstPercent} onChange={(e) => setForm((p: any) => ({ ...p, gstPercent: parseFloat(e.target.value) || 0 }))} />
                    <Input label="Round Off" type="number" value={form.roundOff} onChange={(e) => setForm((p: any) => ({ ...p, roundOff: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </section>

                <section className="rounded-[24px] border border-emerald-100 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-2xl bg-emerald-100 p-2.5">
                      <IndianRupee className="h-4 w-4 text-emerald-600" />
                    </div>
                    <h4 className="font-black text-slate-900">Payments</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Input label="Advance Paid" type="number" value={form.advancePaid} onChange={(e) => setForm((p: any) => ({ ...p, advancePaid: parseFloat(e.target.value) || 0 }))} />
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-slate-700">Payment Mode</p>
                      <select
                        value={form.paymentMode}
                        onChange={(e) => setForm((p: any) => ({ ...p, paymentMode: e.target.value }))}
                        className="w-full rounded-2xl border border-orange-100 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none"
                      >
                        <option value="">Select payment mode</option>
                        {PAYMENT_MODES.map((p) => (
                          <option key={p} value={p}>
                            {p.replaceAll('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input label="Payment Due Date" type="date" value={form.paymentDueDate} onChange={(e) => setForm((p: any) => ({ ...p, paymentDueDate: e.target.value }))} />
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-slate-700">Booking Status</p>
                      <select
                        value={form.status}
                        onChange={(e) => setForm((p: any) => ({ ...p, status: e.target.value }))}
                        className="w-full rounded-2xl border border-orange-100 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none"
                      >
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>
              </div>
            )}

            <div className="flex gap-2 border-t border-orange-100 pt-2">
              <Button variant="outline" className="flex-1" onClick={resetModal}>
                Cancel
              </Button>

              {step > 1 && (
                <Button variant="secondary" className="flex-1" onClick={() => setStep((s) => s - 1)}>
                  Back
                </Button>
              )}

              {step < 4 ? (
                <Button
                  className="flex-1"
                  disabled={
                    (step === 1 && (!form.clientName || !form.clientPhone)) ||
                    (step === 2 && (!form.eventDate || !selectedHall))
                  }
                  onClick={() => setStep((s) => s + 1)}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  // className="flex-1"
                  loading={saveMut.isPending}
                  // disabled={!form.clientName || !form.clientPhone || !form.eventDate || !selectedHall}
                  onClick={handleSave}
                  disabled={saveMut.isPending}
                  className="rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {saveMut.isPending ? 'Saving...' : editBooking ? 'Update Booking' : 'Create Booking'}

                  {/* {editBooking ? 'Save Changes' : 'Create Booking'} */}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[26px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50 p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-white p-2.5 shadow-sm">
                  <Receipt className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900">Commercial Summary</h4>
                  <p className="text-xs text-slate-400">Live banquet estimate</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {[
                  ['Hall Charge', pricing.hallRate],
                  ['Catering', pricing.catering],
                  ['Add-ons', pricing.addons],
                  ['Subtotal', pricing.subTotal],
                  ['Service Charge', pricing.serviceCharge],
                  ['GST', pricing.gst],
                  ['Security Deposit', Number(form.securityDeposit || 0)],
                  ['Round Off', Number(form.roundOff || 0)],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-bold text-slate-900">{formatCurrency(Number(value || 0))}</span>
                  </div>
                ))}
              </div>

              <div className="my-4 border-t border-orange-100" />

              <div className="rounded-[22px] bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500 p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/80">Grand Total</span>
                  <span className="text-xl font-black">{formatCurrency(pricing.grandTotal)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/80">Advance Paid</span>
                  <span className="text-lg font-black">{formatCurrency(pricing.advancePaid)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/80">Balance Due</span>
                  <span className="text-lg font-black">{formatCurrency(pricing.balanceDue)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-rose-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-rose-100 p-2.5">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900">Booking checks</h4>
                  <p className="text-xs text-slate-400">Helpful before saving</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className={cn('rounded-2xl p-3', selectedHall ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                  {selectedHall ? 'Hall selected.' : 'Select a hall for availability and pricing.'}
                </div>
                <div className={cn('rounded-2xl p-3', form.eventDate ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                  {form.eventDate ? 'Event date selected.' : 'Event date is required.'}
                </div>
                <div className={cn('rounded-2xl p-3', form.clientName && form.clientPhone ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                  {form.clientName && form.clientPhone ? 'Client info looks complete.' : 'Client name and phone are required.'}
                </div>
                <div className={cn('rounded-2xl p-3', !form.company || form.gstin ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                  {!form.company || form.gstin ? 'Billing detail is acceptable.' : 'Company booking without GSTIN.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={showHallModal} onClose={() => setShowHallModal(false)} title="Add Banquet Hall" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input label="Hall Name *" value={hallForm.name} onChange={(e) => setHallForm((p: any) => ({ ...p, name: e.target.value }))} placeholder="e.g. Crystal Hall" required />
            </div>
            <Input label="Capacity (pax)" type="number" value={hallForm.capacity} onChange={(e) => setHallForm((p: any) => ({ ...p, capacity: parseInt(e.target.value) || 0 }))} />
            <Input label="Area (sq ft)" type="number" value={hallForm.area} onChange={(e) => setHallForm((p: any) => ({ ...p, area: parseInt(e.target.value) || 0 }))} />
            <Input label="Full Day Rate (₹)" type="number" value={hallForm.ratePerDay} onChange={(e) => setHallForm((p: any) => ({ ...p, ratePerDay: parseFloat(e.target.value) || 0 }))} />
            <Input label="Half Day Rate (₹)" type="number" value={hallForm.ratePerHalfDay} onChange={(e) => setHallForm((p: any) => ({ ...p, ratePerHalfDay: parseFloat(e.target.value) || 0 }))} />
          </div>

          <Input
            label="Amenities (comma separated)"
            value={hallForm.amenities?.join(', ') || ''}
            onChange={(e) =>
              setHallForm((p: any) => ({
                ...p,
                amenities: e.target.value
                  .split(',')
                  .map((x) => x.trim())
                  .filter(Boolean),
              }))
            }
            placeholder="Stage, Green Room, Projector, Parking"
          />

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowHallModal(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              loading={saveHallMut.isPending}
              disabled={!hallForm.name}
              onClick={() => saveHallMut.mutate(hallForm)}
            >
              Add Hall
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}