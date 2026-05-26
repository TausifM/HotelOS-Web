'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import {
  LogIn, LogOut, Search, RefreshCw, BedDouble, Calendar,
  ShieldCheck, ShieldAlert, AlertTriangle, Phone, ChevronRight,
  Clock, Receipt, Star, Wifi, MessageSquare, FileText,
  UserCheck, Loader2, Check, X, CheckSquare, Coffee,
  Moon, Sun, Zap, Users, Home, Filter, ArrowRight,
  TrendingUp, Bell,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Reservation {
  _id: string;
  bookingRef: string;
  roomNumber: string;
  roomId: any;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  balanceDue: number;
  advancePaid: number;
  idVerified: boolean;
  source: string;
  mealPlan: string;
  specialRequests?: string;
  earlyCheckin?: boolean;
  lateCheckout?: boolean;
  guestChatUrl?: string;
  guestId: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    idVerified: boolean;
    idType?: string;
    idNumber?: string;
    isVip?: boolean;
    loyalty?: { tier: string; points: number };
  };
  folioId?: { balance: number; isSettled: boolean };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function openWhatsApp(phone: string, message: string) {
  const cleaned = phone.replace(/\D/g, '');
  const number = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
}

const AVATAR_GRADS = [
  'linear-gradient(135deg,#F97316,#F43F5E)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
  'linear-gradient(135deg,#0d9488,#0f766e)',
  'linear-gradient(135deg,#2563eb,#1d4ed8)',
  'linear-gradient(135deg,#d97706,#b45309)',
];

function avatarGrad(name: string) {
  return AVATAR_GRADS[(name.charCodeAt(0) || 0) % AVATAR_GRADS.length];
}

const MEAL_PLAN_LABELS: Record<string, string> = {
  room_only: 'Room Only',
  cp: '🍳 Breakfast',
  map: '🍽️ 2 Meals',
  ap: '🍽️ All Meals',
};

const SOURCE_LABELS: Record<string, string> = {
  walk_in: '🚶 Walk-in',
  phone: '📞 Phone',
  ota_booking: '🌐 OTA',
  direct: '🏨 Direct',
  agent: '🤝 Agent',
};

const TIER_COLORS: Record<string, { bg: string; text: string; emoji: string }> = {
  bronze: { bg: '#fdf3e8', text: '#92400e', emoji: '🥉' },
  silver: { bg: '#f1f5f9', text: '#475569', emoji: '🥈' },
  gold: { bg: '#fefce8', text: '#854d0e', emoji: '🥇' },
  platinum: { bg: '#f5f3ff', text: '#5b21b6', emoji: '💎' },
};

const ID_TYPES = [
  { value: 'aadhaar', label: '🪪 Aadhaar' },
  { value: 'passport', label: '📕 Passport' },
  { value: 'driving_licence', label: '🚗 DL' },
  { value: 'pan', label: '💳 PAN' },
  { value: 'voter_id', label: '🗳️ Voter ID' },
  { value: 'foreign_passport', label: '🌍 Foreign' },
  { value: 'other', label: '📄 Other' },
];

const inp =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all';

// ── Verify ID Modal ───────────────────────────────────────────────────────────
function VerifyIDModal({
  reservation, onClose, onVerified,
}: {
  reservation: Reservation | null;
  onClose: () => void;
  onVerified: () => void;
}) {
  const [idType, setIdType] = useState('aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [loading, setLoading] = useState(false);
  if (!reservation) return null;

  async function verify() {
    if (!idNumber.trim()) { toast.error('Enter ID number'); return; }
    setLoading(true);
    try {
      await api.patch(`/api/guests/${reservation?.guestId._id}/verify-id`, {
        idType, idNumber: idNumber.trim(), idVerified: true,
      });
      toast.success('ID verified ✓');
      onVerified();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 text-white"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)' }}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm">Verify Guest ID</p>
              <p className="text-xs opacity-75">
                {reservation.guestId.firstName} {reservation.guestId.lastName} · Room {reservation.roomNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 rounded-xl p-3.5"
            style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Physically check the original ID document before entering details.
              This is mandatory under Indian hotel registration law.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Select ID Type</p>
            <div className="grid grid-cols-2 gap-2">
              {ID_TYPES.map(t => (
                <button key={t.value} onClick={() => setIdType(t.value)}
                  className="px-3 py-2 rounded-xl border text-xs font-semibold text-left transition-all"
                  style={idType === t.value
                    ? { background: '#fffbeb', borderColor: '#f59e0b', color: '#92400e' }
                    : { background: '#f9fafb', borderColor: '#e5e7eb', color: '#4b5563' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">ID Number *</label>
            <input
              className={inp}
              value={idNumber}
              onChange={e => setIdNumber(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && verify()}
              placeholder="Enter ID number"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button onClick={verify} disabled={loading || !idNumber.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 4px 14px rgba(245,158,11,0.35)' }}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                : <><ShieldCheck className="w-4 h-4" /> Verify ID</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Check-out Confirm Modal ───────────────────────────────────────────────────
function CheckoutModal({
  reservation, onClose, onConfirm, loading,
}: {
  reservation: Reservation | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!reservation) return null;
  const hasBalance = (reservation.folioId?.balance ?? reservation.balanceDue) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 text-white"
          style={{ background: hasBalance ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)' }}>
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm">Confirm Check-out</p>
              <p className="text-xs opacity-75">
                {reservation.guestId.firstName} {reservation.guestId.lastName} · Room {reservation.roomNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {hasBalance && (
            <div className="flex items-start gap-3 rounded-xl p-3.5"
              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-800">Outstanding Balance</p>
                <p className="text-xs text-red-600 mt-0.5">
                  {formatCurrency(reservation.folioId?.balance ?? reservation.balanceDue)} must be settled before checkout.
                </p>
              </div>
            </div>
          )}

          {/* Stay summary */}
          <div className="rounded-2xl overflow-hidden border border-gray-100">
            <div className="px-4 py-3 grid grid-cols-2 gap-3">
              {[
                { label: 'Guest', value: `${reservation.guestId.firstName} ${reservation.guestId.lastName}` },
                { label: 'Room', value: reservation.roomNumber },
                { label: 'Check-in', value: formatDate(reservation.checkIn) },
                { label: 'Nights', value: `${reservation.nights} nights` },
                { label: 'Total Bill', value: formatCurrency(reservation.totalAmount) },
                { label: 'Balance', value: formatCurrency(reservation.folioId?.balance ?? reservation.balanceDue) },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-xs text-gray-400">{s.label}</p>
                  <p className="text-sm font-semibold text-gray-900">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={loading || hasBalance}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)', boxShadow: '0 4px 14px rgba(249,115,22,0.35)' }}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking out...</>
                : <><LogOut className="w-4 h-4" /> Confirm Check-out</>}
            </button>
          </div>

          {hasBalance && (
            <p className="text-center text-xs text-gray-400">
              Go to <span className="font-semibold text-orange-500">Billing → Folio</span> to settle the outstanding balance first.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Check-in Success Modal (with chat link) ───────────────────────────────────
function CheckinSuccessModal({
  data, guestPhone, guestName, roomNumber, onClose,
}: {
  data: { folioId: string; chatLink: string; conversationId?: string };
  guestPhone: string;
  guestName: string;
  roomNumber: string;
  onClose: () => void;
}) {
  const waMessage =
    `🏨 *Welcome, ${guestName}!*\n\n` +
    `You are now checked into *Room ${roomNumber}*.\n\n` +
    `Chat with your personal concierge anytime:\n` +
    `👇 ${data.chatLink}\n\n` +
    `Order room service, request housekeeping, and more — *no app needed*.\n\n` +
    `We hope you have a wonderful stay! 🙏`;
  const router = useRouter()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Success header */}
        <div className="px-6 pt-8 pb-6 text-center text-white"
          style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.25)' }}>
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Checked In! 🎉</h2>
          <p className="text-sm opacity-80 mt-1">{guestName} · Room {roomNumber}</p>
        </div>

        <div className="p-6 space-y-3">
          {/* Send chat link via WhatsApp */}
          {guestPhone && (
            <button
              onClick={() => openWhatsApp(guestPhone, waMessage)}
              className="flex w-full items-center justify-center gap-2.5 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 14px rgba(34,197,94,0.3)' }}>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Send Concierge Link via WhatsApp
            </button>
          )}

          <button
            onClick={() => window.open(data.chatLink, '_blank')}
            className="flex w-full items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
            <MessageSquare className="w-4 h-4" />
            Open Guest Chat
          </button>

          <button onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Done
          </button>
          {data.conversationId && (
            <button
              onClick={() => {
                onClose();
                router.push('/dashboard/guest-operations');
                // selectedId will auto-select via URL state or pass via context
              }}
              className="flex w-full items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border"
            >
              <MessageSquare className="w-4 h-4" />
              Open in Guest Operations
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Reservation Card ──────────────────────────────────────────────────────────
function ReservationCard({
  res, type, onCheckin, onCheckout, onVerify, onViewFolio, onCForm, checkingInId,
}: {
  res: Reservation;
  type: 'arrival' | 'inhouse' | 'departure';
  onCheckin: (r: Reservation) => void;
  onCheckout: (r: Reservation) => void;
  onVerify: (r: Reservation) => void;
  onViewFolio: (r: Reservation) => void;
  onCForm: (r: Reservation) => void;
  checkingInId: string | null;   // ✅ add this
}) {
  const router = useRouter();
  const idOk = res.idVerified || res.guestId?.idVerified;
  const balance = res.folioId?.balance ?? res.balanceDue ?? 0;
  const tier = res.guestId?.loyalty?.tier;
  const tierCfg = tier ? TIER_COLORS[tier] : null;
  const isCheckingIn = checkingInId === res._id;
  const borderColor =
    type === 'departure' && balance > 0 ? '#fecaca' :
      !idOk && type === 'arrival' ? '#fde68a' :
        type === 'arrival' ? '#bbf7d0' :
          type === 'inhouse' ? '#bfdbfe' : '#e5e7eb';

  const accentGrad =
    type === 'arrival' ? 'linear-gradient(135deg,#22c55e,#16a34a)' :
      type === 'inhouse' ? 'linear-gradient(135deg,#3b82f6,#2563eb)' :
        'linear-gradient(135deg,#F97316,#F43F5E)';

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
      style={{ border: `2px solid ${borderColor}` }}
    >
      {/* Accent top strip */}
      <div className="h-1" style={{ background: accentGrad }} />

      {/* Card body */}
      <div className="p-4 space-y-3.5">

        {/* Guest row */}
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white"
              style={{ background: avatarGrad(res.guestId?.firstName || 'G') }}>
              {res.guestId?.firstName?.[0]}{res.guestId?.lastName?.[0]}
            </div>
            {res.guestId?.isVip && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: '#f59e0b' }}>
                <Star className="w-2.5 h-2.5 fill-white text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-gray-900 text-sm">
                {res.guestId?.firstName} {res.guestId?.lastName}
              </p>
              {tierCfg && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: tierCfg.bg, color: tierCfg.text }}>
                  {tierCfg.emoji}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3" /> {res.guestId?.phone}
            </p>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
              {res.bookingRef}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {SOURCE_LABELS[res.source] || res.source}
            </p>
          </div>
        </div>

        {/* Stay info chips */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: 'Room', value: res.roomNumber, bold: true },
            { label: 'Nights', value: `${res.nights}n` },
            { label: 'Guests', value: `${res.adults + (res.children || 0)} pax` },
            { label: 'Meal', value: MEAL_PLAN_LABELS[res.mealPlan] || res.mealPlan || '—' },
          ].map(c => (
            <div key={c.label} className="rounded-xl p-2 text-center" style={{ background: '#f8fafc' }}>
              <p className="text-[10px] text-gray-400 leading-tight">{c.label}</p>
              <p className={cn('text-xs leading-tight mt-0.5', c.bold ? 'font-bold text-gray-900' : 'font-semibold text-gray-700')}>
                {c.value}
              </p>
            </div>
          ))}
        </div>

        {/* Dates */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <LogIn className="w-3 h-3 text-green-500" />
            <span>{formatDate(res.checkIn)}</span>
          </div>
          <ArrowRight className="w-3 h-3 text-gray-300" />
          <div className="flex items-center gap-1">
            <LogOut className="w-3 h-3 text-orange-500" />
            <span>{formatDate(res.checkOut)}</span>
          </div>
          {res.earlyCheckin && (
            <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: '#f0fdf4', color: '#16a34a' }}>⏰ Early CI</span>
          )}
          {res.lateCheckout && (
            <span className={cn('px-1.5 py-0.5 rounded-full text-[10px] font-bold', !res.earlyCheckin && 'ml-auto')}
              style={{ background: '#f5f3ff', color: '#5b21b6' }}>🌙 Late CO</span>
          )}
        </div>

        {/* Special requests */}
        {res.specialRequests && (
          <div className="rounded-xl px-3 py-2 text-xs text-amber-800 flex items-start gap-2"
            style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <Bell className="w-3 h-3 flex-shrink-0 mt-0.5 text-amber-600" />
            <span className="line-clamp-2">{res.specialRequests}</span>
          </div>
        )}

        {/* Payment status */}
        <div className="flex items-center justify-between rounded-xl px-3 py-2.5"
          style={{
            background: balance > 0 ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${balance > 0 ? '#fecaca' : '#bbf7d0'}`,
          }}>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: balance > 0 ? '#dc2626' : '#16a34a' }}>
              {balance > 0 ? 'Balance Due' : 'Fully Paid'}
            </p>
            <p className="text-sm font-bold"
              style={{ color: balance > 0 ? '#dc2626' : '#16a34a' }}>
              {balance > 0 ? formatCurrency(balance) : '✓ Settled'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400">Total Bill</p>
            <p className="text-sm font-bold text-gray-700">{formatCurrency(res.totalAmount)}</p>
          </div>
        </div>

        {/* ID verification */}
        <div className="flex items-center justify-between rounded-xl px-3 py-2"
          style={{
            background: idOk ? '#ecfdf5' : '#fffbeb',
            border: `1px solid ${idOk ? '#bbf7d0' : '#fde68a'}`,
          }}>
          <div className="flex items-center gap-2">
            {idOk
              ? <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
              : <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />}
            <div>
              <p className="text-xs font-semibold" style={{ color: idOk ? '#166534' : '#92400e' }}>
                {idOk ? 'ID Verified' : 'ID Pending'}
              </p>
              {res.guestId?.idType && (
                <p className="text-[10px] text-gray-400 capitalize">
                  {res.guestId.idType.replace('_', ' ')} · {res.guestId.idNumber}
                </p>
              )}
            </div>
          </div>
          {!idOk && (
            <button onClick={() => onVerify(res)}
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors"
              style={{ background: '#fef3c7', color: '#92400e' }}>
              <ShieldCheck className="w-3 h-3" /> Verify
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          {type === 'arrival' && (
            <>
              <button
                onClick={() => onCForm(res)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all flex-shrink-0">
                <FileText className="w-3.5 h-3.5" /> C-Form
              </button>
              <button
                onClick={() => idOk && onCheckin(res)}
                disabled={!idOk || isCheckingIn}
                title={!idOk ? 'Verify ID before check-in' : undefined}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: idOk ? 'linear-gradient(135deg,#22c55e,#16a34a)' : '#e5e7eb',
                  boxShadow: idOk ? '0 4px 12px rgba(34,197,94,0.3)' : 'none',
                  color: idOk ? '#fff' : '#9ca3af',
                }}>
                {isCheckingIn
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking in...</>
                  : <><LogIn className="w-3.5 h-3.5" /> Check In</>
                }
              </button>
            </>
          )}

          {type === 'inhouse' && (
            <>
              <button
                onClick={() => router.push(`/dashboard/reservations/${res._id}`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all flex-shrink-0">
                <ChevronRight className="w-3.5 h-3.5" /> View
              </button>
              {res.guestChatUrl && (
                // ✅ FIX — in ReservationCard inhouse section, regenerate link on demand
                <button onClick={async () => {
                  try {
                    const r = await api.post(`/api/reservations/${res._id}/resend-chat-link`);
                    openWhatsApp(res.guestId.phone,
                      `Here is your concierge chat link: ${r.data.data.chatLink}`);
                  } catch {
                    toast.error('Could not generate chat link');
                  }
                }}>
                  Chat
                </button>
              )}
              <button
                onClick={() => onViewFolio(res)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
                <Receipt className="w-3.5 h-3.5" /> View Folio
              </button>
            </>
          )}

          {type === 'departure' && (
            <>
              <button
                onClick={() => onViewFolio(res)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all flex-shrink-0">
                <Receipt className="w-3.5 h-3.5" /> Folio
              </button>
              <button
                onClick={() => onCForm(res)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all flex-shrink-0">
                <FileText className="w-3.5 h-3.5" /> C-Form
              </button>
              <button
                onClick={() => onCheckout(res)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
                <LogOut className="w-3.5 h-3.5" /> Check Out
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CheckInPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'arrivals' | 'inhouse' | 'departures'>('arrivals');
  const [verifyRes, setVerifyRes] = useState<Reservation | null>(null);
  const [checkoutRes, setCheckoutRes] = useState<Reservation | null>(null);
  const [successData, setSuccessData] = useState<{
    folioId: string;
    chatLink: string;
    conversationId?: string;   // ✅ add
  } | null>(null);
  const [successMeta, setSuccessMeta] = useState<{ phone: string; name: string; room: string } | null>(null);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: arrivals, isLoading: arrLoad, refetch: refetchArr } = useQuery<Reservation[]>({
    queryKey: ['checkin-arrivals', today],
    queryFn: () => api.get('/api/reservations/arrivals-today').then(r => r.data.data || []),
    refetchInterval: 60_000,
  });

  const { data: inhouse, isLoading: ihLoad, refetch: refetchIH } = useQuery<Reservation[]>({
    queryKey: ['checkin-inhouse'],
    queryFn: () => api.get('/api/reservations/in-house').then(r => r.data.data || []),
    refetchInterval: 60_000,
  });

  const { data: departures, isLoading: depLoad, refetch: refetchDep } = useQuery<Reservation[]>({
    queryKey: ['checkin-departures', today],
    queryFn: () => api.get('/api/reservations/departures-today').then(r => r.data.data || []),
    refetchInterval: 60_000,
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const checkinMut = useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/reservations/${id}/checkin`).then(r => r.data.data),

    onMutate: (id) => {
      setCheckingInId(id);   // ✅ start loader
    },

    onSuccess: (data, id) => {
      setCheckingInId(null);  // ✅ stop loader
      const res = arrivals?.find(r => r._id === id);
      if (res) {
        setSuccessData({
          folioId: data.folioId,
          chatLink: data.chatLink ?? data.guestChatUrl ?? '',
          conversationId: data.conversationId,
        });
        setSuccessMeta({
          phone: res.guestId.phone,
          name: `${res.guestId.firstName} ${res.guestId.lastName}`,
          room: res.roomNumber,
        });
      }
      qc.invalidateQueries({ queryKey: ['checkin-arrivals'] });
      qc.invalidateQueries({ queryKey: ['checkin-inhouse'] });
    },

    onError: (e: any, id) => {
      setCheckingInId(null);  // ✅ stop loader on error too
      const msg = e.response?.data?.message || 'Check-in failed';
      toast.error(msg.toLowerCase().includes('id') ? 'Verify guest ID first' : msg);
    },
  });

  const checkoutMut = useMutation({
    mutationFn: (id: string) => api.post(`/api/reservations/${id}/checkout`).then(r => r.data.data),
    onSuccess: (data) => {
      toast.success(`Checked out! +${data?.pointsEarned || 0} loyalty pts 🎉`);
      setCheckoutRes(null);
      qc.invalidateQueries({ queryKey: ['checkin-inhouse'] });
      qc.invalidateQueries({ queryKey: ['checkin-departures'] });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || 'Checkout failed');
    },
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function filterList(list: Reservation[] = []) {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(r =>
      r.guestId?.firstName?.toLowerCase().includes(q) ||
      r.guestId?.lastName?.toLowerCase().includes(q) ||
      r.guestId?.phone?.includes(q) ||
      r.bookingRef?.toLowerCase().includes(q) ||
      r.roomNumber?.includes(q)
    );
  }

  function downloadCForm(res: Reservation) {
    window.open(`/api/reservations/${res._id}/cform`, '_blank');
  }

  function refetchAll() {
    refetchArr(); refetchIH(); refetchDep();
    toast.success('Refreshed');
  }

  const tabData = {
    arrivals: { list: filterList(arrivals), loading: arrLoad, label: 'Arrivals', iconColor: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
    inhouse: { list: filterList(inhouse), loading: ihLoad, label: 'In-House', iconColor: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
    departures: { list: filterList(departures), loading: depLoad, label: 'Departures', iconColor: '#F97316', bg: '#fff7ed', border: '#fed7aa' },
  };

  const current = tabData[activeTab];
  const unverifiedCount = (arrivals || []).filter(r => !r.idVerified && !r.guestId?.idVerified).length;
  const balanceDueCount = (departures || []).filter(r => (r.folioId?.balance ?? r.balanceDue) > 0).length;

  return (
    <DashboardLayout title="Check-in / Check-out">
      <div className="space-y-5 max-w-7xl pb-10">

        {/* ── Hero Banner ───────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl px-5 py-6 sm:px-8 sm:py-7 text-white"
          style={{ background: 'linear-gradient(135deg,#F97316 0%,#F43F5E 100%)' }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-20"
            style={{ background: 'rgba(255,255,255,0.3)' }} />
          <div className="pointer-events-none absolute -bottom-6 left-24 h-28 w-28 rounded-full opacity-10"
            style={{ background: 'rgba(255,255,255,0.5)' }} />

          <div className="relative flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Title */}
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <CheckSquare className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                  Front Desk
                </span>
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl leading-tight">Check-in / Check-out</h1>
              <p className="mt-1 text-sm opacity-80">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Live counters */}
            <div className="flex gap-3 flex-wrap">
              {[
                { label: 'Arrivals', count: arrivals?.length || 0, icon: <LogIn className="w-3.5 h-3.5" />, color: 'rgba(134,239,172,0.25)' },
                { label: 'In-House', count: inhouse?.length || 0, icon: <Home className="w-3.5 h-3.5" />, color: 'rgba(147,197,253,0.25)' },
                { label: 'Departures', count: departures?.length || 0, icon: <LogOut className="w-3.5 h-3.5" />, color: 'rgba(253,186,116,0.25)' },
              ].map(s => (
                <div key={s.label}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
                  style={{ background: s.color, border: '1px solid rgba(255,255,255,0.2)' }}>
                  {s.icon}
                  <div>
                    <p className="text-lg font-bold leading-none">{s.count}</p>
                    <p className="text-xs opacity-75 leading-tight">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={refetchAll}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => router.push('/dashboard/reservations/new')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                <Calendar className="w-4 h-4" /> New Reservation
              </button>
            </div>
          </div>
        </div>

        {/* ── Alert banners ─────────────────────────────────────────────────── */}
        <div className="space-y-2">
          {unverifiedCount > 0 && (
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
              style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-900">
                  {unverifiedCount} arrival{unverifiedCount > 1 ? 's' : ''} with unverified ID
                </p>
                <p className="text-xs text-amber-700">Required by Indian hotel registration law (Form C)</p>
              </div>
              <button onClick={() => setActiveTab('arrivals')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                style={{ background: '#f59e0b', color: '#fff' }}>
                Review <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
          {balanceDueCount > 0 && (
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-900">
                  {balanceDueCount} departure{balanceDueCount > 1 ? 's' : ''} with outstanding balance
                </p>
                <p className="text-xs text-red-600">Settle folio before allowing checkout</p>
              </div>
              <button onClick={() => setActiveTab('departures')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                style={{ background: '#ef4444', color: '#fff' }}>
                Review <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* ── Stat pills + search + tabs ────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tab pills */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f1f5f9' }}>
            {(Object.entries(tabData) as [typeof activeTab, typeof tabData.arrivals][]).map(([key, val]) => (
              <button key={key}
                onClick={() => setActiveTab(key)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={activeTab === key
                  ? { background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', color: '#111827' }
                  : { color: '#6b7280' }}>
                {val.label}
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={activeTab === key
                    ? { background: val.bg, color: val.iconColor, border: `1px solid ${val.border}` }
                    : { background: '#e2e8f0', color: '#64748b' }}>
                  {val.loading ? '…' : val.list.length}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 shadow-sm flex-1 min-w-56">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search name, room, ref, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="text-sm flex-1 focus:outline-none bg-transparent"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter info */}
          {search && (
            <p className="text-xs text-gray-400">
              {current.list.length} result{current.list.length !== 1 ? 's' : ''} for "{search}"
            </p>
          )}
        </div>

        {/* ── Card grid ─────────────────────────────────────────────────────── */}
        {current.loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <div className="h-1 w-full animate-pulse" style={{ background: 'linear-gradient(90deg,#f1f5f9,#e2e8f0,#f1f5f9)' }} />
                <div className="p-4 space-y-3">
                  {[80, 60, 100, 50].map((w, j) => (
                    <div key={j} className="h-3 rounded-full animate-pulse" style={{ width: `${w}%`, background: '#f1f5f9' }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : current.list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}>
              <BedDouble className="w-8 h-8 text-orange-300" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700">
                {search ? `No results for "${search}"` : `No ${current.label.toLowerCase()} today`}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {!search && activeTab === 'arrivals' && 'Create a reservation to see arrivals here'}
              </p>
            </div>
            {!search && activeTab === 'arrivals' && (
              <button
                onClick={() => router.push('/dashboard/reservations/new')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
                <Calendar className="w-4 h-4" /> New Reservation
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {current.list.map(res => (
              <ReservationCard
                key={res._id}
                res={res}
                type={activeTab === 'arrivals' ? 'arrival' : activeTab === 'inhouse' ? 'inhouse' : 'departure'}
                onCheckin={r => checkinMut.mutate(r._id)}
                onCheckout={r => setCheckoutRes(r)}
                onVerify={r => setVerifyRes(r)}
                onViewFolio={r => router.push(`/dashboard/billing?reservationId=${r._id}`)}
                onCForm={r => downloadCForm(r)}
                checkingInId={checkingInId}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {verifyRes && (
        <VerifyIDModal
          reservation={verifyRes}
          onClose={() => setVerifyRes(null)}
          onVerified={() => {
            qc.invalidateQueries({ queryKey: ['checkin-arrivals'] });
            qc.invalidateQueries({ queryKey: ['checkin-departures'] });
          }}
        />
      )}

      {checkoutRes && (
        <CheckoutModal
          reservation={checkoutRes}
          onClose={() => setCheckoutRes(null)}
          onConfirm={() => checkoutMut.mutate(checkoutRes._id)}
          loading={checkoutMut.isPending}
        />
      )}

      {successData && successMeta && (
        <CheckinSuccessModal
          data={successData}
          guestPhone={successMeta.phone}
          guestName={successMeta.name}
          roomNumber={successMeta.room}
          onClose={() => { setSuccessData(null); setSuccessMeta(null); }}
        />
      )}
    </DashboardLayout>
  );
}