'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageLoader } from '@/components/ui';
import api from '@/lib/api';
import { cn, formatCurrency, formatDate, RESERVATION_STATUS_COLORS } from '@/lib/utils';
import {
  ArrowLeft, Calendar, Bed, User, Phone, Mail, ShieldCheck,
  ShieldAlert, Star, LogIn, LogOut, X, Check, Loader2,
  FileText, Edit2, Ban, MessageSquare, Sparkles, ExternalLink,
  CreditCard, Clock, AlertCircle, Download, ChevronRight,
  LinkIcon,
  MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

function openWhatsApp(phone: string, message: string) {
  const cleaned = phone.replace(/\D/g, '');
  const number = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
}

const STATUS_META: Record<string, { label: string; gradient: string; bg: string; text: string }> = {
  confirmed: { label: 'Confirmed', gradient: 'linear-gradient(135deg,#22c55e,#16a34a)', bg: '#ecfdf5', text: '#166534' },
  checked_in: { label: 'Checked In', gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)', bg: '#eff6ff', text: '#1e40af' },
  checked_out: { label: 'Checked Out', gradient: 'linear-gradient(135deg,#6b7280,#4b5563)', bg: '#f9fafb', text: '#374151' },
  cancelled: { label: 'Cancelled', gradient: 'linear-gradient(135deg,#ef4444,#dc2626)', bg: '#fef2f2', text: '#991b1b' },
  inquiry: { label: 'Inquiry', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', bg: '#fffbeb', text: '#92400e' },
};

const MEAL_PLANS: Record<string, string> = {
  room_only: 'Room Only',
  cp: 'Continental Plan (Breakfast)',
  map: 'Modified American Plan (2 meals)',
  ap: 'American Plan (All meals)',
};

const inp =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle, icon, gradient, onClose }: {
  title: string; subtitle?: string; icon: React.ReactNode;
  gradient: string; onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-5 text-white" style={{ background: gradient }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.2)' }}>
          {icon}
        </div>
        <div>
          <p className="font-bold">{title}</p>
          {subtitle && <p className="text-xs opacity-75">{subtitle}</p>}
        </div>
      </div>
      <button onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:bg-white/30"
        style={{ background: 'rgba(255,255,255,0.2)' }}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-400 flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value || '—'}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  // Modal states
  const [showCheckin, setShowCheckin] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [editForm, setEditForm] = useState<any>(null);

  // Chat link state (returned from checkin)
  const [chatLink, setChatLink] = useState<string | null>(null);

  const { data: res, isLoading } = useQuery({
    queryKey: ['reservation', id],
    queryFn: () => api.get(`/api/reservations/${id}`).then(r => r.data.data),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['reservation', id] });

  const checkinMutation = useMutation({
    mutationFn: () => api.post(`/api/reservations/${id}/checkin`),
    onSuccess: (data) => {
      const link = data.data.data?.chatLink;
      if (link) setChatLink(link);
      toast.success('Guest checked in!');
      refresh();
      setShowCheckin(false);

      // ✅ FIX 1: was `res?.guestId?.firstName` — welcome message used wrong field
      // "Welcome to ${res?.guestId?.firstName}" → should be hotel name, not guest name
      // ✅ FIX 2: phone number must be digits only — strip spaces/dashes for wa.me
      // ✅ FIX 3: WhatsApp block should use `link` not stale `chatLink` state
      if (
        res?.guestId?.whatsappOptIn &&
        (res?.guestId?.whatsappNumber || res?.guestId?.phone) &&
        link
      ) {
        const hotelName = res?.tenantId?.hotelName ?? 'our hotel';
        const guestName = `${res?.guestId?.firstName ?? 'Guest'} ${res?.guestId?.lastName ?? ''}`.trim();
        const rawPhone = (res?.guestId?.whatsappNumber || res?.guestId?.phone) as string;
        const phone = rawPhone.replace(/\D/g, '');

        const HOTEL = '\u{1F3E8}';
        const CHAT = '\u{1F4AC}';
        const STAR = '\u{1F31F}';

        const msg = [
          `${HOTEL} *Welcome to ${hotelName}, ${guestName}!*`,
          ``,
          `You're now checked in to Room *${res?.roomNumber}*.`,
          ``,
          `${CHAT} Chat with us anytime:`,
          link,
          ``,
          `Enjoy your stay! ${STAR}`,
        ].join('\n');

        openWhatsApp(phone, msg);
      }
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || 'Check-in failed'),
  });
  const checkoutMutation = useMutation({
    mutationFn: () => api.post(`/api/reservations/${id}/checkout`),
    onSuccess: async (data) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['reservations'] }),
        qc.invalidateQueries({ queryKey: ['in-house'] }),
        qc.invalidateQueries({ queryKey: ['departures-today'] }),
        qc.invalidateQueries({ queryKey: ['arrivals-today'] }),
      ]);
      const pts = data.data.data?.pointsEarned;
      toast.success(`Checkout complete! ${pts ? `+${pts} loyalty pts earned` : ''}`);
      refresh();
      setShowCheckout(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Checkout failed'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.delete(`/api/reservations/${id}`, { data: { reason: cancelReason } }),
    onSuccess: () => {
      toast.success('Reservation cancelled');
      refresh();
      setShowCancel(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Cancellation failed'),
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => api.put(`/api/reservations/${id}`, d),
    onSuccess: () => {
      toast.success('Reservation updated');
      refresh();
      setShowEdit(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Update failed'),
  });

  function openEdit() {
    setEditForm({
      specialRequests: res.specialRequests || '',
      mealPlan: res.mealPlan || 'room_only',
      adults: res.adults || 1,
      children: res.children || 0,
      internalNotes: res.internalNotes || '',
      earlyCheckin: res.earlyCheckin || false,
      lateCheckout: res.lateCheckout || false,
    });
    setShowEdit(true);
  }

  function downloadCForm() {
    window.open(`/api/reservations/${id}/cform`, '_blank');
  }

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (isLoading) return <DashboardLayout><PageLoader /></DashboardLayout>;
  if (!res) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-gray-400">Reservation not found</p>
        <button onClick={() => router.push('/dashboard/reservations')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
    </DashboardLayout>
  );

  const guest = res.guestId as any;
  const room = res.roomId as any;
  const status = res.status;
  const sMeta = STATUS_META[status] || STATUS_META.inquiry;

  const canCheckin = status === 'confirmed';
  const canCheckout = status === 'checked_in';
  const canCancel = !['checked_in', 'checked_out', 'cancelled'].includes(status);
  const canEdit = !['checked_out', 'cancelled'].includes(status);

  const initials = `${guest?.firstName?.[0] || ''}${guest?.lastName?.[0] || ''}`;

  return (
    <DashboardLayout title={`${res.bookingRef}`}>
      <div className="space-y-5 max-w-5xl pb-10">

        {/* ── Hero Banner ──────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl px-5 py-6 sm:px-8 sm:py-7 text-white"
          style={{ background: 'linear-gradient(135deg,#F97316 0%,#F43F5E 100%)' }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-20"
            style={{ background: 'rgba(255,255,255,0.3)' }} />

          <div className="relative flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Reservation</span>
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl font-mono">{res.bookingRef}</h1>
              <p className="mt-1 text-sm opacity-80">Room {res.roomNumber} · {res.nights} night{res.nights !== 1 ? 's' : ''}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold"
                  style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(res.checkIn)} → {formatDate(res.checkOut)}
                </span>
                <span className="px-3 py-1.5 rounded-xl text-sm font-bold capitalize"
                  style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                  {sMeta.label}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap sm:flex-col sm:items-end">
              <button onClick={() => router.push('/dashboard/reservations')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-white/30"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              {canEdit && (
                <button onClick={openEdit}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:bg-white/30"
                  style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
              )}

              <button onClick={downloadCForm}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:bg-white/30"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                <Download className="w-3.5 h-3.5" /> C-Form
              </button>

              <div className="flex items-center gap-2">
                {guest?.phone && (
                  <button
                    onClick={() =>
                      openWhatsApp(
                        guest.whatsappNumber || guest.phone,
                        `Hi ${guest.firstName}, regarding your booking ${res.bookingRef} — `
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:bg-white/30"
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </button>
                )}

                {(chatLink || res?.chatLink) && (
                  <a
                    href={chatLink || res?.chatLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:bg-white/30"
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Chat Link
                  </a>
                )}
              </div>

              {canCancel && (
                <button onClick={() => setShowCancel(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{ background: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.35)' }}>
                  <Ban className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Check-in / Check-out Action Banner ───────────────────────────── */}
        {canCheckin && (
          <div className="flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
            style={{ background: '#ecfdf5', border: '1px solid #bbf7d0' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#dcfce7' }}>
                <LogIn className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-green-800">Ready to Check In</p>
                <p className="text-xs text-green-600">
                  {!guest?.idVerified
                    ? '⚠️ ID not verified — verify before check-in'
                    : 'Guest ID verified · All systems go'}
                </p>
              </div>
            </div>
            <button onClick={() => setShowCheckin(true)}
              disabled={!guest?.idVerified}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 14px rgba(34,197,94,0.3)' }}>
              <LogIn className="w-4 h-4" /> Check In Guest
            </button>
          </div>
        )}

        {canCheckout && (
          <div className="flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
            style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#dbeafe' }}>
                <LogOut className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-800">Guest In-House · Ready for Checkout</p>
                <p className="text-xs text-blue-600">
                  {res.guestChatUrl
                    ? '💬 Chat active — guest can request services'
                    : 'Checkout clears the folio and releases the room'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {res.guestChatUrl && (
                <a href={res.guestChatUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-blue-200 text-blue-700 hover:bg-blue-50 transition-all">
                  <ExternalLink className="w-3.5 h-3.5" /> Chat Link
                </a>
              )}
              <button onClick={() => setShowCheckout(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}>
                <LogOut className="w-4 h-4" /> Check Out
              </button>
            </div>
          </div>
        )}

        {/* ── Chat link (after check-in) ───────────────────────────────────── */}
        {chatLink && status === 'checked_in' && (
          <div className="flex items-center gap-3 rounded-2xl px-5 py-4"
            style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-violet-800">Guest Chat Active</p>
              <p className="text-xs text-violet-600 truncate font-mono">{chatLink}</p>
            </div>
            <button onClick={() => {
              if (guest?.phone) {
                openWhatsApp(guest.whatsappNumber || guest.phone,
                  `Hi ${guest.firstName}! 💬 Chat with us anytime here: ${chatLink}`);
              }
            }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-violet-700 transition-all hover:bg-violet-100"
              style={{ background: '#ede9fe' }}>
              Resend Link
            </button>
          </div>
        )}

        {/* ── Main grid ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT */}
          <div className="lg:col-span-1 space-y-4">

            {/* Guest card */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-50 px-5 py-4"
                style={{ background: '#fafafa' }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}>
                  <User className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-sm font-bold text-gray-900 flex-1">Guest</p>
                <button onClick={() => router.push(`/dashboard/guests/${guest?._id}`)}
                  className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                  Profile <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
                    {initials}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 flex items-center gap-1.5">
                      {guest?.firstName} {guest?.lastName}
                      {guest?.isVip && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{guest?.loyalty?.tier || 'bronze'} member</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={guest?.phone} />
                  <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={guest?.email} />
                </div>

                {/* ID Status */}
                <div className="pt-1">
                  {guest?.idVerified ? (
                    <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
                      style={{ background: '#ecfdf5', border: '1px solid #bbf7d0' }}>
                      <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-green-800">ID Verified</p>
                        <p className="text-xs text-green-600 capitalize">
                          {guest?.idType?.replace('_', ' ')} · {guest?.idNumber}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
                      style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                      <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-amber-800">ID Not Verified</p>
                        <p className="text-xs text-amber-600">Required before check-in</p>
                      </div>
                      <button onClick={() => router.push(`/dashboard/guests/${guest?._id}`)}
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors">
                        Verify →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Room card */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-50 px-5 py-4"
                style={{ background: '#fafafa' }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)' }}>
                  <Bed className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-sm font-bold text-gray-900 flex-1">Room</p>
                <span className="font-mono text-sm font-bold text-blue-600">{res.roomNumber}</span>
              </div>

              <div className="p-5 space-y-2.5">
                <InfoRow icon={<Bed className="w-3.5 h-3.5" />} label="Type" value={room?.type} />
                <InfoRow icon={<Sparkles className="w-3.5 h-3.5" />} label="View" value={room?.view} />
                <InfoRow icon={<CreditCard className="w-3.5 h-3.5" />} label="Bed Type" value={room?.bedType} />
                <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Check-in" value={formatDate(res.checkIn)} />
                <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Check-out" value={formatDate(res.checkOut)} />
                <InfoRow icon={<Clock className="w-3.5 h-3.5" />} label="Nights" value={`${res.nights} night${res.nights !== 1 ? 's' : ''}`} />
                <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Guests" value={`${res.adults} adults${res.children ? `, ${res.children} children` : ''}`} />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-2 space-y-4">

            {/* Financials */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-50 px-5 py-4"
                style={{ background: '#fafafa' }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}>
                  <CreditCard className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm font-bold text-gray-900 flex-1">Billing Summary</p>
              </div>

              <div className="p-5 space-y-3">
                {[
                  { label: 'Rate per Night', value: formatCurrency(res.ratePerNight), mono: false },
                  { label: 'Nights', value: res.nights, mono: false },
                  { label: 'Room Charges', value: formatCurrency(res.totalRoomCharge), mono: false },
                  { label: 'GST / Tax', value: formatCurrency(res.totalTaxAmount), mono: false },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{row.label}</span>
                    <span className="font-semibold text-gray-800">{row.value}</span>
                  </div>
                ))}

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="font-bold text-gray-900">Total Amount</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(res.totalAmount)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl p-3.5" style={{ background: '#ecfdf5' }}>
                    <p className="text-xs text-green-600">Advance Paid</p>
                    <p className="text-base font-bold text-green-800">{formatCurrency(res.advancePaid || 0)}</p>
                  </div>
                  <div className="rounded-xl p-3.5"
                    style={{ background: (res.balanceDue || 0) > 0 ? '#fef2f2' : '#ecfdf5' }}>
                    <p className="text-xs" style={{ color: (res.balanceDue || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                      Balance Due
                    </p>
                    <p className="text-base font-bold"
                      style={{ color: (res.balanceDue || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                      {formatCurrency(res.balanceDue || 0)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-gray-500">Rate Plan</span>
                  <span className="text-xs font-semibold text-gray-700 capitalize">{res.ratePlan}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Meal Plan</span>
                  <span className="text-xs font-semibold text-gray-700">
                    {MEAL_PLANS[res.mealPlan] || res.mealPlan || 'Room Only'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Source</span>
                  <span className="text-xs font-semibold text-gray-700 capitalize">{res.source}</span>
                </div>
              </div>
            </div>

            {/* Stay details */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-50 px-5 py-4"
                style={{ background: '#fafafa' }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)' }}>
                  <FileText className="w-4 h-4 text-violet-600" />
                </div>
                <p className="text-sm font-bold text-gray-900 flex-1">Stay Details</p>
                {canEdit && (
                  <button onClick={openEdit}
                    className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                )}
              </div>

              <div className="p-5 space-y-3">
                {res.specialRequests && (
                  <div className="rounded-xl p-3.5" style={{ background: '#fefce8', border: '1px solid #fde68a' }}>
                    <p className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> Special Requests
                    </p>
                    <p className="text-xs text-amber-700 leading-relaxed">{res.specialRequests}</p>
                  </div>
                )}

                {res.internalNotes && (
                  <div className="rounded-xl p-3.5" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                    <p className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                      <FileText className="w-3 h-3" /> Internal Notes
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">{res.internalNotes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Early Check-in', value: res.earlyCheckin ? '✅ Requested' : 'Not requested' },
                    { label: 'Late Checkout', value: res.lateCheckout ? '✅ Requested' : 'Not requested' },
                    { label: 'Actual Check-in', value: res.actualCheckIn ? formatDate(res.actualCheckIn) : '—' },
                    { label: 'Actual Checkout', value: res.actualCheckOut ? formatDate(res.actualCheckOut) : '—' },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl p-3" style={{ background: '#f9fafb' }}>
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="text-sm font-semibold text-gray-700 mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>

                {res.cancelledAt && (
                  <div className="rounded-xl p-3.5" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                    <p className="text-xs font-bold text-red-800 mb-1 flex items-center gap-1.5">
                      <Ban className="w-3 h-3" /> Cancellation
                    </p>
                    <p className="text-xs text-red-600">
                      {formatDate(res.cancelledAt)} · {res.cancellationReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════════════════ */}

      {/* Check-in Confirm */}
      {showCheckin && (
        <Modal onClose={() => setShowCheckin(false)}>
          <ModalHeader
            title="Confirm Check-in"
            subtitle={`${guest?.firstName} ${guest?.lastName} · Room ${res.roomNumber}`}
            icon={<LogIn className="w-4 h-4" />}
            gradient="linear-gradient(135deg,#22c55e,#16a34a)"
            onClose={() => setShowCheckin(false)}
          />
          <div className="p-6 space-y-4">
            <div className="rounded-xl p-4 space-y-2" style={{ background: '#ecfdf5', border: '1px solid #bbf7d0' }}>
              {[
                { label: 'Guest', value: `${guest?.firstName} ${guest?.lastName}` },
                { label: 'Room', value: res.roomNumber },
                { label: 'Check-in', value: formatDate(res.checkIn) },
                { label: 'Check-out', value: formatDate(res.checkOut) },
                { label: 'Nights', value: res.nights },
                { label: 'Total', value: formatCurrency(res.totalAmount) },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-green-700">{r.label}</span>
                  <span className="font-bold text-green-900">{r.value}</span>
                </div>
              ))}
            </div>
            {guest?.whatsappOptIn && (
              <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <p className="text-xs text-green-700 font-medium">WhatsApp welcome + chat link will be sent</p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCheckin(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={() => checkinMutation.mutate()}
                disabled={checkinMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 14px rgba(34,197,94,0.3)' }}>
                {checkinMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  : <><LogIn className="w-4 h-4" /> Confirm Check-in</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Check-out Confirm */}
      {showCheckout && (
        <Modal onClose={() => setShowCheckout(false)}>
          <ModalHeader
            title="Confirm Checkout"
            subtitle={`${guest?.firstName} ${guest?.lastName} · Room ${res.roomNumber}`}
            icon={<LogOut className="w-4 h-4" />}
            gradient="linear-gradient(135deg,#3b82f6,#2563eb)"
            onClose={() => setShowCheckout(false)}
          />
          <div className="p-6 space-y-4">
            <div className="rounded-xl p-4 space-y-2" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              {[
                { label: 'Guest', value: `${guest?.firstName} ${guest?.lastName}` },
                { label: 'Room Released', value: res.roomNumber },
                { label: 'Total Amount', value: formatCurrency(res.totalAmount) },
                { label: 'Advance Paid', value: formatCurrency(res.advancePaid || 0) },
                { label: 'Balance Due', value: formatCurrency(res.balanceDue || 0) },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-blue-700">{r.label}</span>
                  <span className="font-bold text-blue-900">{r.value}</span>
                </div>
              ))}
            </div>
            {(res.balanceDue || 0) > 0 && (
              <div className="flex items-start gap-2.5 rounded-xl p-3.5"
                style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">
                  Outstanding balance of {formatCurrency(res.balanceDue)} must be settled before checkout.
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCheckout(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={() => checkoutMutation.mutate()}
                disabled={checkoutMutation.isPending || (res.balanceDue || 0) > 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}>
                {checkoutMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  : <><LogOut className="w-4 h-4" /> Confirm Checkout</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Modal */}
      {showCancel && (
        <Modal onClose={() => setShowCancel(false)}>
          <ModalHeader
            title="Cancel Reservation"
            subtitle={res.bookingRef}
            icon={<Ban className="w-4 h-4" />}
            gradient="linear-gradient(135deg,#ef4444,#dc2626)"
            onClose={() => setShowCancel(false)}
          />
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 rounded-xl p-4"
              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 leading-relaxed">
                This reservation will be marked as cancelled. This action is logged and cannot be undone.
              </p>
            </div>
            <Field label="Reason for Cancellation" required>
              <textarea
                className={`${inp} resize-none`}
                rows={3}
                placeholder="e.g. Guest request, no-show, payment failure..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              />
            </Field>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCancel(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                Keep Reservation
              </button>
              <button onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending || !cancelReason.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 14px rgba(239,68,68,0.3)' }}>
                {cancelMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling...</>
                  : <><Ban className="w-4 h-4" /> Confirm Cancel</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEdit && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
            <ModalHeader
              title="Edit Reservation"
              subtitle={res.bookingRef}
              icon={<Edit2 className="w-4 h-4" />}
              gradient="linear-gradient(135deg,#F97316,#F43F5E)"
              onClose={() => setShowEdit(false)}
            />
            <form
              className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
              onSubmit={e => { e.preventDefault(); updateMutation.mutate(editForm); }}
            >
              <div className="grid grid-cols-2 gap-4">
                <Field label="Adults" required>
                  <input type="number" min={1} className={inp} value={editForm.adults}
                    onChange={e => setEditForm((p: any) => ({ ...p, adults: +e.target.value }))} />
                </Field>
                <Field label="Children">
                  <input type="number" min={0} className={inp} value={editForm.children}
                    onChange={e => setEditForm((p: any) => ({ ...p, children: +e.target.value }))} />
                </Field>
              </div>

              <Field label="Meal Plan">
                <select className={inp} value={editForm.mealPlan}
                  onChange={e => setEditForm((p: any) => ({ ...p, mealPlan: e.target.value }))}>
                  {Object.entries(MEAL_PLANS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </Field>

              <Field label="Special Requests">
                <textarea className={`${inp} resize-none`} rows={3} value={editForm.specialRequests}
                  onChange={e => setEditForm((p: any) => ({ ...p, specialRequests: e.target.value }))}
                  placeholder="Any special requests..." />
              </Field>

              <Field label="Internal Notes (staff only)">
                <textarea className={`${inp} resize-none`} rows={2} value={editForm.internalNotes}
                  onChange={e => setEditForm((p: any) => ({ ...p, internalNotes: e.target.value }))} />
              </Field>

              <div className="flex gap-3">
                {[
                  { key: 'earlyCheckin', label: '⏰ Early Check-in' },
                  { key: 'lateCheckout', label: '🌙 Late Checkout' },
                ].map(opt => (
                  <div key={opt.key}
                    onClick={() => setEditForm((p: any) => ({ ...p, [opt.key]: !p[opt.key] }))}
                    className="flex flex-1 items-center gap-2 cursor-pointer rounded-xl border px-3.5 py-2.5 transition-all"
                    style={{
                      background: editForm[opt.key] ? '#f5f3ff' : '#f9fafb',
                      borderColor: editForm[opt.key] ? '#ddd6fe' : '#e5e7eb',
                    }}>
                    <input type="checkbox" checked={editForm[opt.key]} onChange={() => { }}
                      className="w-4 h-4 accent-violet-500" />
                    <label className="text-xs font-semibold cursor-pointer"
                      style={{ color: editForm[opt.key] ? '#5b21b6' : '#374151' }}>
                      {opt.label}
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowEdit(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={updateMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)', boxShadow: '0 4px 14px rgba(249,115,22,0.35)' }}>
                  {updateMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    : <><Check className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}