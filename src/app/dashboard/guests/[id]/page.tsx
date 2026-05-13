'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageLoader } from '@/components/ui';
import api from '@/lib/api';
import { cn, formatCurrency, formatDate, RESERVATION_STATUS_COLORS } from '@/lib/utils';
import {
  Star, ShieldCheck, AlertCircle, Edit2, Ban, Award,
  Phone, Mail, MapPin, Calendar, ChevronRight, ArrowLeft,
  MessageSquare, Bed, Clock, TrendingUp, User, FileText,
  Sparkles, Tag, X, Check, Loader2, Upload, RefreshCw,
  ShieldOff, ShieldAlert, Image as ImageIcon, RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';

function openWhatsApp(phone: string, message: string) {
  const cleaned = phone.replace(/\D/g, '');
  const number = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
}

const TIER_CONFIG: Record<string, { label: string; emoji: string; gradient: string }> = {
  bronze:   { label: 'Bronze',   emoji: '🥉', gradient: 'linear-gradient(135deg,#cd7f32,#a0522d)' },
  silver:   { label: 'Silver',   emoji: '🥈', gradient: 'linear-gradient(135deg,#94a3b8,#64748b)' },
  gold:     { label: 'Gold',     emoji: '🥇', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)' },
  platinum: { label: 'Platinum', emoji: '💎', gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
};

const ID_TYPES = [
  { value: 'aadhaar',          label: 'Aadhaar Card'    },
  { value: 'passport',         label: 'Passport'        },
  { value: 'driving_licence',  label: 'Driving Licence' },
  { value: 'pan',              label: 'PAN Card'        },
  { value: 'voter_id',         label: 'Voter ID'        },
  { value: 'foreign_passport', label: 'Foreign Passport'},
  { value: 'other',            label: 'Other'           },
];

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

const inp =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all';

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
        <div className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}>
          <span className="text-orange-500">{icon}</span>
        </div>
      </div>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function SectionCard({ icon, iconBg, title, badge, children }: {
  icon: React.ReactNode; iconBg: string; title: string;
  badge?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-50 px-5 py-4" style={{ background: '#fafafa' }}>
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: iconBg }}>
          {icon}
        </div>
        <p className="text-sm font-bold text-gray-900 flex-1">{title}</p>
        {badge}
      </div>
      {children}
    </div>
  );
}

// ── Inline modal wrapper ──────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
export default function GuestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc     = useQueryClient();

  // modal states
  const [showEdit,        setShowEdit]        = useState(false);
  const [showBlacklist,   setShowBlacklist]   = useState(false);
  const [showUnblacklist, setShowUnblacklist] = useState(false);
  const [showVerifyId,    setShowVerifyId]    = useState(false);
  const [showIdUpload,    setShowIdUpload]    = useState(false);

  const [blacklistReason, setBlacklistReason] = useState('');
  const [editForm,        setEditForm]        = useState<any>(null);

  // Verify-ID form state
  const [verifyForm, setVerifyForm] = useState({
    idType: 'aadhaar', idNumber: '', idExpiry: '',
  });

  // ID upload state
  const [idSide,       setIdSide]       = useState<'front' | 'back'>('front');
  const [idPreview,    setIdPreview]    = useState<string | null>(null);
  const [ocrLoading,   setOcrLoading]   = useState(false);
  const [ocrExtracted, setOcrExtracted] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['guest', id],
    queryFn: () => api.get(`/api/guests/${id}`).then(r => r.data.data),
  });

  const guest        = data?.guest;
  const reservations = data?.reservations || [];

  const refresh = () => qc.invalidateQueries({ queryKey: ['guest', id] });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const updateGuest = useMutation({
    mutationFn: (d: any) => api.put(`/api/guests/${id}`, d),
    onSuccess: () => { toast.success('Guest updated'); refresh(); setShowEdit(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const blacklistMutation = useMutation({
    mutationFn: () => api.patch(`/api/guests/${id}/blacklist`, { reason: blacklistReason }),
    onSuccess: () => { toast.success('Guest blacklisted'); refresh(); setShowBlacklist(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  // ✅ NEW — Unblacklist
  const unblacklistMutation = useMutation({
    mutationFn: () => api.patch(`/api/guests/${id}/unblacklist`),
    onSuccess: () => { toast.success('Guest removed from blacklist'); refresh(); setShowUnblacklist(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  // ✅ NEW — Verify ID (manual)
  const verifyIdMutation = useMutation({
    mutationFn: () => api.patch(`/api/guests/${id}/verify-id`, {
      idType:   verifyForm.idType,
      idNumber: verifyForm.idNumber,
      idExpiry: verifyForm.idExpiry || undefined,
    }),
    onSuccess: () => { toast.success('ID verified successfully'); refresh(); setShowVerifyId(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  // ✅ NEW — Loyalty refresh
  const refreshLoyalty = useMutation({
    mutationFn: () => api.get(`/api/guests/${id}/loyalty`),
    onSuccess: () => { toast.success('Loyalty data refreshed'); refresh(); },
    onError: () => toast.error('Failed to refresh loyalty'),
  });

  // ✅ NEW — OCR / ID upload from detail page
  async function handleIdUpload(file: File) {
    const reader = new FileReader();
    reader.onload = e => setIdPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setOcrLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('guestId', id as string);
      formData.append('side', idSide);

      const { data: res } = await api.post('/api/ai/ocr/id-card', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setOcrExtracted(res.data);
      toast.success('ID scanned & guest updated!');
      refresh();
    } catch {
      toast.error('OCR failed — try again');
    } finally {
      setOcrLoading(false);
    }
  }

  function openEdit() {
    setEditForm({
      firstName:     guest.firstName,
      lastName:      guest.lastName,
      phone:         guest.phone,
      email:         guest.email || '',
      nationality:   guest.nationality || 'Indian',
      title:         guest.title || '',
      internalNotes: guest.internalNotes || '',
      isVip:         guest.isVip,
      tags:          guest.tags?.join(', ') || '',
    });
    setShowEdit(true);
  }

  // ── Loading / not found ────────────────────────────────────────────────────
  if (isLoading) return <DashboardLayout><PageLoader /></DashboardLayout>;

  if (!guest) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}>
          <User className="w-8 h-8 text-orange-400" />
        </div>
        <p className="text-gray-400 text-lg font-medium">Guest not found</p>
        <button onClick={() => router.push('/dashboard/guests')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
          <ArrowLeft className="w-4 h-4" /> Back to Guests
        </button>
      </div>
    </DashboardLayout>
  );

  const tier     = guest.loyalty?.tier || 'bronze';
  const tierCfg  = TIER_CONFIG[tier] || TIER_CONFIG.bronze;
  const initials = `${guest.firstName?.[0] || ''}${guest.lastName?.[0] || ''}`;

  return (
    <DashboardLayout title={`${guest.firstName} ${guest.lastName}`}>
      <div className="space-y-5 max-w-5xl pb-10">

        {/* ── Hero Banner ──────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl px-5 py-6 sm:px-8 sm:py-8 text-white"
          style={{ background: 'linear-gradient(135deg,#F97316 0%,#F43F5E 100%)' }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-20"
            style={{ background: 'rgba(255,255,255,0.3)' }} />
          <div className="pointer-events-none absolute -bottom-6 left-20 h-28 w-28 rounded-full opacity-10"
            style={{ background: 'rgba(255,255,255,0.5)' }} />

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                style={{
                  background: 'rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(8px)',
                  border: '2px solid rgba(255,255,255,0.4)',
                }}
              >
                {initials}
              </div>
              {guest.isVip && (
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: '#f59e0b', boxShadow: '0 2px 8px rgba(245,158,11,0.6)' }}>
                  <Star className="w-3.5 h-3.5 fill-white text-white" />
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {guest.title && <span className="text-sm font-medium opacity-80">{guest.title}.</span>}
                <h1 className="text-2xl font-bold leading-tight">{guest.firstName} {guest.lastName}</h1>
                {guest.isBlacklisted && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.4)' }}>
                    🚫 Blacklisted
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 flex-wrap text-sm opacity-80">
                {guest.phone && (
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{guest.phone}</span>
                )}
                {guest.email && (
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{guest.email}</span>
                )}
                {guest.nationality && (
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{guest.nationality}</span>
                )}
              </div>

              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                <span>{tierCfg.emoji}</span>
                <span className="text-sm font-bold capitalize">{tier} Member</span>
                {guest.loyalty?.membershipId && (
                  <span className="font-mono text-xs opacity-70">· {guest.loyalty.membershipId}</span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap sm:flex-col sm:items-end">
              <button onClick={() => router.push('/dashboard/guests')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-white/30"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                <ArrowLeft className="w-3.5 h-3.5" /> Guests
              </button>

              <button
                onClick={() => openWhatsApp(guest.whatsappNumber || guest.phone, `Hi ${guest.firstName}, `)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:bg-white/30"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </button>

              <button onClick={openEdit}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:bg-white/30"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>

              {/* ✅ Blacklist / Unblacklist toggle */}
              {!guest.isBlacklisted ? (
                <button onClick={() => setShowBlacklist(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{ background: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.35)' }}>
                  <Ban className="w-3.5 h-3.5" /> Blacklist
                </button>
              ) : (
                <button onClick={() => setShowUnblacklist(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{ background: 'rgba(34,197,94,0.25)', border: '1px solid rgba(34,197,94,0.35)' }}>
                  <RotateCcw className="w-3.5 h-3.5" /> Unblacklist
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ✅ Blacklist reason banner (shown when blacklisted) */}
        {guest.isBlacklisted && guest.blacklistReason && (
          <div className="flex items-start gap-3 rounded-2xl px-5 py-4"
            style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <Ban className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800">Blacklisted Guest</p>
              <p className="text-xs text-red-600 mt-0.5">{guest.blacklistReason}</p>
            </div>
            <button onClick={() => setShowUnblacklist(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-green-700 transition-all hover:bg-green-50"
              style={{ background: '#dcfce7', border: '1px solid #bbf7d0' }}>
              <RotateCcw className="w-3 h-3" /> Remove
            </button>
          </div>
        )}

        {/* ── Quick Stats ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<Bed className="w-3.5 h-3.5" />}         label="Total Stays"   value={guest.stayCount || 0}                          sub="lifetime stays" />
          <StatCard icon={<Clock className="w-3.5 h-3.5" />}       label="Last Stay"     value={guest.lastStayAt ? formatDate(guest.lastStayAt) : 'First time'} sub={guest.lastStayAt ? 'most recent' : 'new guest'} />
          <StatCard icon={<TrendingUp className="w-3.5 h-3.5" />}  label="Total Revenue" value={formatCurrency(guest.totalRevenue || 0)}         sub="lifetime value" />
          <StatCard icon={<MessageSquare className="w-3.5 h-3.5" />} label="WhatsApp"
            value={guest.whatsappOptIn
              ? <span className="text-green-600 text-base">✅ Opted in</span>
              : <span className="text-gray-400 text-base">❌ Opted out</span>}
            sub="messaging preference"
          />
        </div>

        {/* ── Main grid ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT */}
          <div className="lg:col-span-1 space-y-4">

            {/* Contact & Identity */}
            <SectionCard
              iconBg="linear-gradient(135deg,#fff7ed,#fff1f2)"
              icon={<User className="h-4 w-4 text-orange-500" />}
              title="Contact & Identity"
            >
              <div className="p-5 space-y-3">
                {[
                  { icon: <Phone className="w-4 h-4" />,   val: guest.phone },
                  { icon: <Mail className="w-4 h-4" />,    val: guest.email },
                  { icon: <MapPin className="w-4 h-4" />,  val: guest.address?.city ? `${guest.address.city}, ${guest.address.state}` : null },
                  { icon: <Calendar className="w-4 h-4" />, val: guest.dob ? `DOB: ${formatDate(guest.dob)}` : null },
                ]
                  .filter(r => r.val)
                  .map((r, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-gray-400 flex-shrink-0">{r.icon}</span>
                      <span className="text-gray-700 truncate">{r.val}</span>
                    </div>
                  ))}

                {/* ── ID Status with actions ─────────────────────────────── */}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  {guest.idVerified ? (
                    <div>
                      <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
                        style={{ background: '#ecfdf5', border: '1px solid #bbf7d0' }}>
                        <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-green-800">ID Verified</p>
                          <p className="text-xs text-green-600 capitalize">
                            {guest.idType?.replace('_', ' ')} · {guest.idNumber}
                          </p>
                        </div>
                      </div>

                      {/* ✅ ID Image thumbnails */}
                      {(guest.idImageFront || guest.idImageBack) && (
                        <div className="flex gap-2 mt-2">
                          {guest.idImageFront && (
                            <a href={guest.idImageFront} target="_blank" rel="noopener noreferrer"
                              className="flex-1 relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex flex-col items-center justify-center p-2 gap-1 hover:bg-orange-50 transition-all group">
                              <ImageIcon className="w-4 h-4 text-gray-400 group-hover:text-orange-400" />
                              <span className="text-xs text-gray-400 font-medium">Front</span>
                            </a>
                          )}
                          {guest.idImageBack && (
                            <a href={guest.idImageBack} target="_blank" rel="noopener noreferrer"
                              className="flex-1 relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex flex-col items-center justify-center p-2 gap-1 hover:bg-orange-50 transition-all group">
                              <ImageIcon className="w-4 h-4 text-gray-400 group-hover:text-orange-400" />
                              <span className="text-xs text-gray-400 font-medium">Back</span>
                            </a>
                          )}
                        </div>
                      )}

                      {/* ✅ Re-scan button */}
                      <button onClick={() => { setShowIdUpload(true); setIdPreview(null); setOcrExtracted(null); }}
                        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all hover:bg-orange-50"
                        style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }}>
                        <RefreshCw className="w-3.5 h-3.5" /> Re-scan / Update ID
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
                        style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                        <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <p className="text-xs font-bold text-amber-800 flex-1">ID Not Verified</p>
                      </div>

                      {/* ✅ Two action buttons: Manual verify or AI scan */}
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setShowVerifyId(true)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-white transition-all hover:opacity-90"
                          style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                          <ShieldCheck className="w-3.5 h-3.5" /> Verify ID
                        </button>
                        <button onClick={() => { setShowIdUpload(true); setIdPreview(null); setOcrExtracted(null); }}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-white transition-all hover:opacity-90"
                          style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
                          <Upload className="w-3.5 h-3.5" /> Scan ID
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {guest.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {guest.tags.map((tag: string) => (
                      <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: '#f1f5f9', color: '#475569' }}>
                        <Tag className="w-2.5 h-2.5" />{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Staff notes */}
                {guest.internalNotes && (
                  <div className="rounded-xl p-3.5" style={{ background: '#fefce8', border: '1px solid #fde68a' }}>
                    <p className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1.5">
                      <FileText className="w-3 h-3" /> Staff Notes
                    </p>
                    <p className="text-xs text-amber-700 leading-relaxed">{guest.internalNotes}</p>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* ── Loyalty Card ─────────────────────────────────────────────── */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="px-5 py-5 text-white" style={{ background: tierCfg.gradient }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-wider opacity-90">Loyalty</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize"
                      style={{ background: 'rgba(255,255,255,0.25)' }}>
                      {tierCfg.emoji} {tier}
                    </span>
                    {/* ✅ Loyalty refresh button */}
                    <button
                      onClick={() => refreshLoyalty.mutate()}
                      disabled={refreshLoyalty.isPending}
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:bg-white/30 disabled:opacity-50"
                      style={{ background: 'rgba(255,255,255,0.2)' }}
                      title="Refresh loyalty"
                    >
                      {refreshLoyalty.isPending
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <RefreshCw className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <p className="text-4xl font-bold">{(guest.loyalty?.points || 0).toLocaleString()}</p>
                <p className="text-sm opacity-80 mt-0.5">
                  points · {formatCurrency((guest.loyalty?.points || 0) * 0.5)} value
                </p>
                {guest.loyalty?.memberSince && (
                  <p className="text-xs opacity-60 mt-2">Member since {formatDate(guest.loyalty.memberSince)}</p>
                )}
              </div>

              <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
                {[
                  { label: 'Stays',  value: guest.loyalty?.totalStays  || guest.stayCount || 0 },
                  { label: 'Nights', value: guest.loyalty?.totalNights || 0 },
                  { label: 'Spent',  value: formatCurrency(guest.loyalty?.totalSpend || guest.totalRevenue || 0) },
                ].map(s => (
                  <div key={s.label} className="flex flex-col items-center py-3.5">
                    <p className="font-bold text-gray-900 text-sm">{s.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {guest.loyalty?.membershipId && (
                <p className="text-xs text-gray-400 text-center font-mono pb-3">
                  ID: {guest.loyalty.membershipId}
                </p>
              )}
            </div>

            {/* Preferences */}
            {guest.preferences && Object.keys(guest.preferences).some(k => guest.preferences[k]) && (
              <SectionCard
                iconBg="linear-gradient(135deg,#eff6ff,#dbeafe)"
                icon={<Sparkles className="h-4 w-4 text-blue-500" />}
                title="Preferences"
              >
                <div className="p-5 flex flex-wrap gap-2">
                  {guest.preferences.bedType && <span className="text-xs px-2.5 py-1.5 rounded-xl font-medium" style={{ background: '#eff6ff', color: '#1d4ed8' }}>🛏 {guest.preferences.bedType} bed</span>}
                  {guest.preferences.floor && <span className="text-xs px-2.5 py-1.5 rounded-xl font-medium" style={{ background: '#eff6ff', color: '#1d4ed8' }}>🏢 {guest.preferences.floor} floor</span>}
                  {guest.preferences.smoking === false && <span className="text-xs px-2.5 py-1.5 rounded-xl font-medium" style={{ background: '#f0fdf4', color: '#166534' }}>🚭 Non-smoking</span>}
                  {guest.preferences.earlyCheckin && <span className="text-xs px-2.5 py-1.5 rounded-xl font-medium" style={{ background: '#f5f3ff', color: '#5b21b6' }}>⏰ Early check-in</span>}
                  {guest.preferences.lateCheckout && <span className="text-xs px-2.5 py-1.5 rounded-xl font-medium" style={{ background: '#f5f3ff', color: '#5b21b6' }}>🌙 Late checkout</span>}
                  {guest.preferences.extraPillows && <span className="text-xs px-2.5 py-1.5 rounded-xl font-medium" style={{ background: '#fff7ed', color: '#c2410c' }}>🪶 Extra pillows</span>}
                  {guest.preferences.dietaryRestrictions?.map((d: string) => (
                    <span key={d} className="text-xs px-2.5 py-1.5 rounded-xl font-medium" style={{ background: '#fefce8', color: '#854d0e' }}>🥗 {d}</span>
                  ))}
                  {guest.preferences.specialRequests && (
                    <span className="text-xs px-2.5 py-1.5 rounded-xl font-medium" style={{ background: '#f9fafb', color: '#374151' }}>📝 {guest.preferences.specialRequests}</span>
                  )}
                </div>
              </SectionCard>
            )}
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-2">
            <SectionCard
              iconBg="linear-gradient(135deg,#fff7ed,#fff1f2)"
              icon={<Calendar className="h-4 w-4 text-orange-500" />}
              title="Stay History"
              badge={
                <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)', color: '#ea580c' }}>
                  {reservations.length} stays
                </span>
              }
            >
              {!reservations.length ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}>
                    <Bed className="w-7 h-7 text-orange-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">No stays yet</p>
                  <p className="text-xs text-gray-400">This guest hasn't checked in yet</p>
                  <button onClick={() => router.push('/dashboard/reservations/new')}
                    className="flex items-center gap-1.5 mt-1 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
                    Create Reservation <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ background: '#fafafa' }}>
                        {['Booking Ref', 'Room', 'Check-in', 'Check-out', 'Amount', 'Status'].map(h => (
                          <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 border-b border-gray-100">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {reservations.map((r: any) => (
                        <tr key={r._id}
                          onClick={() => router.push(`/dashboard/reservations/${r._id}`)}
                          className="hover:bg-orange-50/40 cursor-pointer transition-colors">
                          <td className="px-4 py-3.5">
                            <span className="font-mono text-xs px-2 py-1 rounded-lg font-semibold"
                              style={{ background: '#f1f5f9', color: '#475569' }}>
                              {r.bookingRef}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-sm text-gray-800">{r.roomNumber}</td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">{formatDate(r.checkIn)}</td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">{formatDate(r.checkOut)}</td>
                          <td className="px-4 py-3.5 text-sm font-bold text-gray-900">{formatCurrency(r.totalAmount)}</td>
                          <td className="px-4 py-3.5">
                            <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold capitalize',
                              RESERVATION_STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600')}>
                              {r.status?.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          EDIT MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showEdit && editForm && (
        <Modal onClose={() => setShowEdit(false)}>
          <div className="max-w-2xl w-full">
            <ModalHeader
              title="Edit Guest"
              subtitle={`${guest.firstName} ${guest.lastName}`}
              icon={<Edit2 className="w-4 h-4" />}
              gradient="linear-gradient(135deg,#F97316,#F43F5E)"
              onClose={() => setShowEdit(false)}
            />
            <form
              className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
              onSubmit={e => {
                e.preventDefault();
                updateGuest.mutate({
                  ...editForm,
                  email:    editForm.email    || undefined,
                  tags: editForm.tags
                    ? editForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
                    : [],
                });
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <Field label="Title">
                  <select className={inp} value={editForm.title}
                    onChange={e => setEditForm((p: any) => ({ ...p, title: e.target.value }))}>
                    <option value="">None</option>
                    {['Mr','Mrs','Ms','Dr','Prof'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Nationality">
                  <input className={inp} value={editForm.nationality}
                    onChange={e => setEditForm((p: any) => ({ ...p, nationality: e.target.value }))} />
                </Field>
                <Field label="First Name" required>
                  <input className={inp} value={editForm.firstName} required
                    onChange={e => setEditForm((p: any) => ({ ...p, firstName: e.target.value }))} />
                </Field>
                <Field label="Last Name" required>
                  <input className={inp} value={editForm.lastName} required
                    onChange={e => setEditForm((p: any) => ({ ...p, lastName: e.target.value }))} />
                </Field>
                <Field label="Phone" required>
                  <input className={inp} value={editForm.phone} required
                    onChange={e => setEditForm((p: any) => ({ ...p, phone: e.target.value }))} />
                </Field>
                <Field label="Email">
                  <input type="email" className={inp} value={editForm.email}
                    onChange={e => setEditForm((p: any) => ({ ...p, email: e.target.value }))} />
                </Field>
              </div>

              <Field label="Tags (comma separated)">
                <input className={inp} value={editForm.tags} placeholder="corporate, repeat-guest"
                  onChange={e => setEditForm((p: any) => ({ ...p, tags: e.target.value }))} />
              </Field>

              <Field label="Internal Notes (staff only)">
                <textarea className={`${inp} resize-none`} rows={3} value={editForm.internalNotes}
                  onChange={e => setEditForm((p: any) => ({ ...p, internalNotes: e.target.value }))} />
              </Field>

              <div className="flex items-center gap-3 cursor-pointer rounded-xl px-4 py-3 border transition-all"
                style={{ background: editForm.isVip ? '#fffbeb' : '#f9fafb', borderColor: editForm.isVip ? '#fde68a' : '#e5e7eb' }}
                onClick={() => setEditForm((p: any) => ({ ...p, isVip: !p.isVip }))}>
                <input type="checkbox" id="isVip" checked={editForm.isVip} onChange={() => {}} className="w-4 h-4 accent-amber-500" />
                <Star className={`w-4 h-4 ${editForm.isVip ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
                <label htmlFor="isVip" className="text-sm font-semibold cursor-pointer"
                  style={{ color: editForm.isVip ? '#92400e' : '#374151' }}>
                  Mark as VIP guest
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowEdit(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={updateGuest.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)', boxShadow: '0 4px 14px rgba(249,115,22,0.35)' }}>
                  {updateGuest.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          BLACKLIST MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showBlacklist && (
        <Modal onClose={() => setShowBlacklist(false)}>
          <ModalHeader title="Blacklist Guest" icon={<Ban className="w-4 h-4" />}
            gradient="linear-gradient(135deg,#ef4444,#dc2626)" onClose={() => setShowBlacklist(false)} />
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 rounded-xl p-4" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 leading-relaxed">
                This guest will be flagged across all future reservations. This action is logged and reversible by management.
              </p>
            </div>
            <Field label="Reason for Blacklisting">
              <textarea className={`${inp} resize-none`} rows={3}
                placeholder="e.g. Property damage, payment fraud..."
                value={blacklistReason}
                onChange={e => setBlacklistReason(e.target.value)} />
            </Field>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowBlacklist(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => blacklistMutation.mutate()}
                disabled={blacklistMutation.isPending || !blacklistReason.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}>
                {blacklistMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Ban className="w-4 h-4" /> Confirm Blacklist</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ✅ NEW — UNBLACKLIST MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showUnblacklist && (
        <Modal onClose={() => setShowUnblacklist(false)}>
          <ModalHeader title="Remove from Blacklist" icon={<RotateCcw className="w-4 h-4" />}
            gradient="linear-gradient(135deg,#22c55e,#16a34a)" onClose={() => setShowUnblacklist(false)} />
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 rounded-xl p-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800 leading-relaxed">
                {guest.firstName} {guest.lastName} will be removed from the blacklist and can make new reservations.
                {guest.blacklistReason && (
                  <span className="block mt-1 text-xs text-green-600">
                    Previous reason: <em>{guest.blacklistReason}</em>
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowUnblacklist(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => unblacklistMutation.mutate()}
                disabled={unblacklistMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 14px rgba(34,197,94,0.35)' }}>
                {unblacklistMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Removing...</> : <><RotateCcw className="w-4 h-4" /> Remove Blacklist</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ✅ NEW — MANUAL VERIFY ID MODAL  (PATCH /verify-id)
      ══════════════════════════════════════════════════════════════════════ */}
      {showVerifyId && (
        <Modal onClose={() => setShowVerifyId(false)}>
          <ModalHeader title="Verify Guest ID" icon={<ShieldCheck className="w-4 h-4" />}
            gradient="linear-gradient(135deg,#22c55e,#16a34a)" onClose={() => setShowVerifyId(false)} />
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <Field label="ID Type">
                <select className={inp} value={verifyForm.idType}
                  onChange={e => setVerifyForm(p => ({ ...p, idType: e.target.value }))}>
                  {ID_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="ID Number" required>
                <input className={inp} placeholder="Enter ID number"
                  value={verifyForm.idNumber}
                  onChange={e => setVerifyForm(p => ({ ...p, idNumber: e.target.value }))} />
              </Field>
              <Field label="Expiry Date (optional)">
                <input type="date" className={inp} value={verifyForm.idExpiry}
                  onChange={e => setVerifyForm(p => ({ ...p, idExpiry: e.target.value }))} />
              </Field>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowVerifyId(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => verifyIdMutation.mutate()}
                disabled={verifyIdMutation.isPending || !verifyForm.idNumber.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 14px rgba(34,197,94,0.35)' }}>
                {verifyIdMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : <><ShieldCheck className="w-4 h-4" /> Mark as Verified</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ✅ NEW — AI OCR ID UPLOAD MODAL  (POST /ocr/id-card)
      ══════════════════════════════════════════════════════════════════════ */}
      {showIdUpload && (
        <Modal onClose={() => setShowIdUpload(false)}>
          <ModalHeader title="Scan ID Card" subtitle="AI-powered extraction"
            icon={<Upload className="w-4 h-4" />}
            gradient="linear-gradient(135deg,#F97316,#F43F5E)"
            onClose={() => setShowIdUpload(false)} />
          <div className="p-6 space-y-4">
            {/* Side selector */}
            <div className="flex gap-2">
              {(['front', 'back'] as const).map(s => (
                <button key={s} onClick={() => setIdSide(s)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all capitalize"
                  style={
                    idSide === s
                      ? { background: 'linear-gradient(135deg,#F97316,#F43F5E)', color: '#fff' }
                      : { background: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb' }
                  }>
                  {s} Side
                </button>
              ))}
            </div>

            {/* Drop zone */}
            <label
              className="relative cursor-pointer overflow-hidden rounded-2xl flex flex-col items-center gap-3 p-8 transition-all"
              style={{
                border: '2px dashed #fed7aa',
                background: ocrLoading ? '#fff7ed' : '#fafafa',
              }}>
              <input type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => e.target.files?.[0] && handleIdUpload(e.target.files[0])} />

              {ocrLoading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                  <p className="text-sm font-bold text-orange-700">Scanning with AI...</p>
                  <div className="h-1.5 w-40 overflow-hidden rounded-full bg-orange-100">
                    <div className="h-full animate-pulse rounded-full"
                      style={{ width: '65%', background: 'linear-gradient(90deg,#F97316,#F43F5E)' }} />
                  </div>
                </>
              ) : idPreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={idPreview} alt="ID preview"
                    className="max-h-40 rounded-xl border border-gray-100 object-contain shadow-sm" />
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Click to change image
                  </p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}>
                    <Upload className="w-7 h-7 text-orange-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Click to upload ID photo</p>
                  <p className="text-xs text-gray-400">Aadhaar · Passport · DL · PAN · Voter ID</p>
                </>
              )}
            </label>

            {/* OCR result preview */}
            {ocrExtracted && (
              <div className="rounded-xl p-4 space-y-1.5" style={{ background: '#ecfdf5', border: '1px solid #bbf7d0' }}>
                <p className="text-xs font-bold text-green-800 flex items-center gap-1.5 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> Extracted Data
                </p>
                {[
                  ['Name',       ocrExtracted.name],
                  ['ID Type',    ocrExtracted.idType],
                  ['ID Number',  ocrExtracted.idNumber],
                  ['DOB',        ocrExtracted.dob],
                  ['Nationality',ocrExtracted.nationality],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-green-700 font-medium">{label}</span>
                    <span className="text-green-900 font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowIdUpload(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
                {ocrExtracted ? 'Done' : 'Cancel'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}