'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Spinner } from '@/components/ui';
import { formatDateTime, cn } from '@/lib/utils';
import {
  MessageSquare, Send, CheckCircle, XCircle, Clock, RefreshCw,
  Search, ChevronLeft, ChevronRight, Bell, TrendingUp, Phone,
  AlertCircle, X, Sparkles, Megaphone, CalendarClock, RotateCw,
  Users, AlertTriangle, LogOut, MessageCircle, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// ─── PALETTE ──────────────────────────────────────────────────────────────────
const MELON            = '#F97316';
const CORAL            = '#F43F5E';
const PINK             = '#EC4899';
const GRADIENT_PRIMARY = `linear-gradient(135deg, ${MELON} 0%, ${CORAL} 100%)`;
const GRADIENT_SOFT    = 'linear-gradient(135deg, #FFF3E6 0%, #FFE4EA 100%)';

// ─── TYPES ────────────────────────────────────────────────────────────────────
type NotificationStatus  = 'queued' | 'sent' | 'delivered' | 'failed' | 'pending';
type NotificationChannel = 'whatsapp' | 'sms' | 'email' | 'push';

interface Notification {
  id: string;
  guestId?: { id: string; firstName: string; lastName: string; phone?: string; whatsappNumber?: string };
  reservationId?: { id: string; bookingRef?: string; roomNumber?: string };
  channel: NotificationChannel;
  trigger: string;
  to: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
  sentAt?: string;
  externalId?: string;
  failureReason?: string;
  retryCount?: number;
}

interface OverdueGuest {
  id: string;
  guestId: string;
  guestName: string;
  phone: string;
  roomNumber: string;
  bookingRef: string;
  checkOut: string;
  minutesOverdue: number;
  conversationId?: string;
}

interface Template { id: string; trigger: string; label: string; body: string; }

interface StatsResponse {
  byStatus:  { _id: { channel: string; status: string }; count: number }[];
  byChannel: { _id: string; count: number }[];
  byTrigger: { _id: string; count: number }[];
  last7Days: { _id: string; total: number; delivered: number; sent: number; failed: number }[];
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CHANNEL_CONFIG: Record<string, { label: string; tint: string; bg: string; ring: string }> = {
  whatsapp: { label: 'WhatsApp', tint: '#10B981', bg: '#ECFDF5', ring: '#A7F3D0' },
  sms:      { label: 'SMS',      tint: '#3B82F6', bg: '#EFF6FF', ring: '#BFDBFE' },
  email:    { label: 'Email',    tint: '#8B5CF6', bg: '#F5F3FF', ring: '#DDD6FE' },
  push:     { label: 'Push',     tint: MELON,     bg: '#FFF7ED', ring: '#FED7AA' },
};

const STATUS_CONFIG: Record<NotificationStatus, { label: string; icon: any; tint: string; bg: string }> = {
  queued:    { label: 'Queued',    icon: Clock,        tint: '#6366F1', bg: '#EEF2FF' },
  sent:      { label: 'Sent',      icon: Send,         tint: '#2563EB', bg: '#EFF6FF' },
  delivered: { label: 'Delivered', icon: CheckCircle,  tint: '#059669', bg: '#ECFDF5' },
  failed:    { label: 'Failed',    icon: XCircle,      tint: '#DC2626', bg: '#FEF2F2' },
  pending:   { label: 'Pending',   icon: Clock,        tint: '#D97706', bg: '#FFFBEB' },
};

const TRIGGER_LABELS: Record<string, string> = {
  manual: 'Manual', booking_confirmed: 'Booking Confirmed',
  pre_arrival_24h: 'Pre-arrival 24h', pre_arrival_2h: 'Pre-arrival 2h',
  checkin_done: 'Check-in', checkout_reminder: 'Checkout Reminder',
  checkout_done: 'Post-checkout', payment_received: 'Payment',
  feedback_request: 'Feedback', upsell_offer: 'Upsell',
  welcome: 'Welcome', promotional: 'Promotional',
  reservation_ended: 'Res. Ended', checkout_overdue: 'Checkout Overdue',
};

const BROADCAST_GROUPS = [
  { value: 'checked_in',       label: "In-house guests",    desc: 'Currently checked-in' },
  { value: 'arrivals_today',   label: "Today's arrivals",   desc: 'Confirmed, arriving today' },
  { value: 'departures_today', label: "Today's departures", desc: 'Checking out today' },
  { value: 'all_confirmed',    label: 'All confirmed',       desc: 'Confirmed + checked-in' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fmtOverdue(mins: number): string {
  if (mins < 60) return `${mins}m overdue`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}m overdue` : `${h}h overdue`;
}

// ─── STAT TILE ────────────────────────────────────────────────────────────────
function StatTile({
  label, value, icon: Icon, tint, bg, highlight,
}: {
  label: string; value: number | string; icon: any; tint: string; bg: string; highlight?: boolean;
}) {
  return (
    <motion.div
      variants={{ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }}
      className="relative overflow-hidden rounded-2xl p-4 shadow-sm transition-all hover:shadow-md"
      style={{
        background:  highlight ? GRADIENT_PRIMARY : '#fff',
        border:      highlight ? 'none' : `1.5px solid ${MELON}1F`,
        boxShadow:   highlight ? `0 10px 30px ${MELON}33` : `0 2px 14px ${MELON}0A`,
      }}
    >
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ background: highlight ? 'rgba(255,255,255,0.22)' : bg, color: highlight ? '#fff' : tint }}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-bold tracking-tight" style={{ color: highlight ? '#fff' : '#1C0A02' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="mt-0.5 text-xs font-medium" style={{ color: highlight ? 'rgba(255,255,255,0.85)' : '#A8836C' }}>
        {label}
      </p>
    </motion.div>
  );
}

// ─── PRIMARY BUTTON ───────────────────────────────────────────────────────────
function PrimaryBtn({
  children, onClick, disabled, loading, icon, variant = 'gradient',
}: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  loading?: boolean; icon?: React.ReactNode; variant?: 'gradient' | 'soft' | 'outline';
}) {
  const styles = variant === 'gradient'
    ? { background: GRADIENT_PRIMARY, color: '#fff', boxShadow: `0 6px 18px ${MELON}55`, border: 'none' }
    : variant === 'soft'
    ? { background: GRADIENT_SOFT, color: CORAL, border: `1.5px solid ${MELON}33` }
    : { background: '#fff', color: '#6B4535', border: `1.5px solid ${MELON}30`, boxShadow: `0 2px 10px ${MELON}08` };
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
      style={styles}>
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}

// ─── CHECKOUT OVERDUE BANNER ──────────────────────────────────────────────────
function CheckoutOverdueBanner({
  guests,
  onSendAlert,
  onSendToChat,
  isPending,
}: {
  guests: OverdueGuest[];
  onSendAlert: (guest: OverdueGuest) => void;
  onSendToChat: (guest: OverdueGuest) => void;
  isPending: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  if (!guests.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, #FFF1F2 0%, #FFF7F0 100%)',
        border: `1.5px solid #FECDD3`,
        boxShadow: '0 4px 20px rgba(244,63,94,0.10)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left"
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: '#FEE2E2', color: '#B91C1C' }}>
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: '#7F1D1D' }}>
            {guests.length} Checkout{guests.length > 1 ? 's' : ''} Overdue
          </p>
          <p className="text-xs" style={{ color: '#B91C1C' }}>
            These guests have passed checkout time (11:00 AM). Send reminder via WhatsApp or guest chat.
          </p>
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ background: '#FEE2E2', color: '#B91C1C' }}>
          <ChevronRight className={cn('h-4 w-4 transition-transform', expanded && 'rotate-90')} />
        </div>
      </button>

      {/* Guest list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="divide-y px-5 pb-4" style={{ borderColor: '#FECDD3' }}>
              {guests.map((g) => (
                <div key={g.id} className="flex flex-wrap items-center gap-3 py-3">
                  {/* Avatar */}
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[14px] text-sm font-bold text-white"
                    style={{ background: GRADIENT_PRIMARY, boxShadow: `0 6px 14px ${MELON}33` }}
                  >
                    {g.roomNumber}
                  </div>
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold" style={{ color: '#1C0A02' }}>{g.guestName}</p>
                    <p className="text-xs" style={{ color: '#6B4535' }}>
                      Room {g.roomNumber} · {g.bookingRef} ·{' '}
                      <span className="font-semibold" style={{ color: '#B91C1C' }}>
                        {fmtOverdue(g.minutesOverdue)}
                      </span>
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {/* Send to guest chat */}
                    <button
                      onClick={() => onSendToChat(g)}
                      disabled={isPending}
                      className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
                      style={{
                        background: '#EFF6FF', color: '#1D4ED8',
                        border: '1.5px solid #BFDBFE',
                      }}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Guest Chat
                    </button>
                    {/* Send WhatsApp */}
                    <button
                      onClick={() => onSendAlert(g)}
                      disabled={isPending}
                      className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
                      style={{
                        background: GRADIENT_PRIMARY, color: '#fff',
                        boxShadow: `0 4px 12px ${MELON}40`,
                        border: 'none',
                      }}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      WhatsApp Alert
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── SEND MODAL ───────────────────────────────────────────────────────────────
function SendModal({
  open, onClose, onSent, templates, tenant, staff,
}: {
  open: boolean; onClose: () => void; onSent: () => void;
  templates: Template[]; tenant?: any; staff?: any;
}) {
  const [guestSearch, setGuestSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [trigger, setTrigger] = useState('manual');
  const [step, setStep] = useState<'guest' | 'message'>('guest');
  const [schedule, setSchedule] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');
  const [sendToChat, setSendToChat] = useState(false);

  const minScheduleAt = useMemo(() => {
    const d = new Date(Date.now() + 5 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  }, []);

  const { data: guests, isLoading: guestsLoading } = useQuery({
    queryKey: ['guests-search', guestSearch],
    queryFn: () => api.get('/api/guests', { params: { search: guestSearch, limit: 8 } }).then((r) => r.data.data?.docs),
    enabled: guestSearch.length >= 2,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const promises: Promise<any>[] = [];
      // WhatsApp send
      if (schedule && scheduleAt) {
        promises.push(api.post('/api/notifications/schedule', {
          guestId: selectedGuest.id, message, sendAt: new Date(scheduleAt).toISOString(), trigger,
        }));
      } else {
        promises.push(api.post('/api/notifications/whatsapp', {
          guestId: selectedGuest.id, message, trigger,
        }));
      }
      // Also send to guest chat if checked
      if (sendToChat && selectedGuest?.conversationId) {
        promises.push(api.post(`/api/conversations/${selectedGuest.conversationId}/messages`, {
          text: message, senderType: 'staff',
        }));
      }
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast.success(schedule ? 'Message scheduled' : sendToChat ? 'Sent to WhatsApp & Guest Chat' : 'Message sent');
      onSent();
      handleClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to send'),
  });

  function handleClose() {
    setGuestSearch(''); setSelectedGuest(null); setMessage('');
    setSelectedTemplate(null); setTrigger('manual');
    setStep('guest'); setSchedule(false); setScheduleAt('');
    setSendToChat(false);
    onClose();
  }

  function applyTemplate(tpl: Template) {
    setSelectedTemplate(tpl.id); setTrigger(tpl.trigger);
    const vars: Record<string, string> = {
      name: selectedGuest?.firstName ?? '{name}',
      guestName: selectedGuest?.firstName ?? '{guestName}',
      hotelName: tenant?.name ?? tenant?.hotelName ?? '{hotelName}',
      roomNumber: selectedGuest?.reservation?.roomNumber ?? '{roomNumber}',
      bookingRef: selectedGuest?.reservation?.bookingRef ?? '{bookingRef}',
      staffName: staff?.name ?? '{staffName}',
    };
    let rendered = tpl.body;
    Object.entries(vars).forEach(([k, v]) => { rendered = rendered.replaceAll(`{${k}}`, v); });
    setMessage(rendered);
  }

  return (
    <Modal open={open} onClose={handleClose} title="Send WhatsApp Message" size="lg">
      <div className="space-y-4">
        {/* STEP 1: Guest search */}
        {step === 'guest' && (
          <>
            <p className="mb-2 text-sm font-semibold" style={{ color: '#6B4535' }}>Search guest</p>
            <div className="relative flex items-center rounded-xl px-3 py-2.5"
              style={{ background: '#fff', border: `1.5px solid ${MELON}30`, boxShadow: `0 2px 10px ${MELON}10` }}>
              <Search className="mr-2 h-4 w-4" style={{ color: MELON }} />
              <input type="text" autoFocus placeholder="Type name or phone…"
                value={guestSearch} onChange={(e) => setGuestSearch(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none" style={{ color: '#1C0A02' }} />
            </div>
            {guestsLoading && <div className="flex justify-center py-4"><Spinner /></div>}
            {guests?.length > 0 && (
              <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                {guests.map((g: any) => (
                  <button key={g.id} onClick={() => { setSelectedGuest(g); setStep('message'); }}
                    className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-white px-3 py-2.5 text-left transition-all hover:scale-[0.99] hover:border-orange-200 hover:bg-orange-50/60">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: GRADIENT_PRIMARY }}>{g.firstName?.[0]}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold" style={{ color: '#1C0A02' }}>{g.firstName} {g.lastName}</p>
                      <p className="truncate text-xs" style={{ color: '#A8836C' }}>{g.whatsappNumber ?? g.phone}</p>
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4" style={{ color: MELON }} />
                  </button>
                ))}
              </div>
            )}
            {guestSearch.length >= 2 && !guestsLoading && !guests?.length && (
              <p className="py-4 text-center text-sm" style={{ color: '#A8836C' }}>No guests found</p>
            )}
          </>
        )}

        {/* STEP 2: Compose */}
        {step === 'message' && selectedGuest && (
          <>
            {/* Selected guest chip */}
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ background: GRADIENT_SOFT, border: `1.5px solid ${MELON}33` }}>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: GRADIENT_PRIMARY, boxShadow: `0 4px 12px ${MELON}55` }}>
                {selectedGuest.firstName?.[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold" style={{ color: '#1C0A02' }}>{selectedGuest.firstName} {selectedGuest.lastName}</p>
                <p className="flex items-center gap-1 text-xs" style={{ color: '#6B4535' }}>
                  <Phone className="h-3 w-3" />{selectedGuest.whatsappNumber ?? selectedGuest.phone}
                </p>
              </div>
              <button onClick={() => { setSelectedGuest(null); setStep('guest'); setMessage(''); }}
                className="rounded-full p-1.5" style={{ color: '#6B4535' }} aria-label="Change guest">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Templates */}
            {templates.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: MELON }}>
                  Quick Templates
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {templates.map((t) => {
                    const active = selectedTemplate === t.id;
                    return (
                      <button key={t.id} onClick={() => applyTemplate(t)}
                        className="rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all"
                        style={{
                          border: active ? `1.5px solid ${MELON}` : `1.5px solid ${MELON}22`,
                          background: active ? GRADIENT_SOFT : '#fff',
                          color: active ? CORAL : '#6B4535',
                          boxShadow: active ? `0 4px 12px ${MELON}22` : 'none',
                        }}>
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Message textarea */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: '#6B4535' }}>Message</p>
                <span className="text-xs font-semibold" style={{ color: message.length > 900 ? CORAL : '#A8836C' }}>
                  {message.length}/1000
                </span>
              </div>
              <textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message… *bold*, _italic_"
                className="w-full resize-none rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  border: `1.5px solid ${MELON}30`, background: '#FFFDFB', color: '#1C0A02',
                  boxShadow: `0 2px 10px ${MELON}10`,
                }} />
              <p className="mt-1 text-xs" style={{ color: '#A8836C' }}>
                Use *bold*, _italic_ for WhatsApp formatting. Placeholders like {'{bookingRef}'} are filled at send time.
              </p>
            </div>

            {/* Send to guest chat toggle */}
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5"
              style={{ border: `1.5px solid ${MELON}22`, background: '#FFFBF7' }}>
              <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-semibold" style={{ color: '#6B4535' }}>
                <input type="checkbox" checked={sendToChat} onChange={(e) => setSendToChat(e.target.checked)}
                  className="h-4 w-4 accent-orange-500" />
                <MessageCircle className="h-4 w-4" style={{ color: MELON }} />
                Also send to Guest Chat (in-app)
              </label>
            </div>

            {/* Schedule toggle */}
            <div className="flex items-center gap-3 rounded-xl px-3 py-2"
              style={{ border: `1.5px solid ${MELON}22`, background: '#FFFBF7' }}>
              <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-semibold" style={{ color: '#6B4535' }}>
                <input type="checkbox" checked={schedule} onChange={(e) => setSchedule(e.target.checked)}
                  className="h-4 w-4 accent-orange-500" />
                <CalendarClock className="h-4 w-4" style={{ color: MELON }} />
                Send later
              </label>
              {schedule && (
                <input type="datetime-local" min={minScheduleAt} value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  className="rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                  style={{ border: `1.5px solid ${MELON}33`, background: '#fff', color: '#1C0A02' }} />
              )}
            </div>

            {/* Footer buttons */}
            <div className="flex gap-2 pt-1">
              <PrimaryBtn variant="outline" onClick={() => setStep('guest')}>Back</PrimaryBtn>
              <div className="flex-1">
                <PrimaryBtn
                  disabled={!message.trim() || message.length > 1000 || !selectedGuest ||
                    (!selectedGuest?.whatsappNumber && !selectedGuest?.phone) ||
                    (schedule && !scheduleAt)}
                  loading={sendMutation.isPending}
                  onClick={() => sendMutation.mutate()}
                  icon={<Send className="h-4 w-4" />}
                >
                  {schedule ? 'Schedule' : sendToChat ? 'Send to Both' : 'Send WhatsApp'}
                </PrimaryBtn>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ─── BROADCAST MODAL ──────────────────────────────────────────────────────────
function BroadcastModal({ open, onClose, onSent }: { open: boolean; onClose: () => void; onSent: () => void }) {
  const [targetGroup, setTargetGroup] = useState('checked_in');
  const [message, setMessage] = useState('');

  const broadcastMutation = useMutation({
    mutationFn: () => api.post('/api/notifications/broadcast', { targetGroup, message }),
    onSuccess: (r) => {
      const d = r.data?.data;
      toast.success(`Broadcast: ${d.sent}/${d.total} sent · ${d.failed} failed`);
      onSent(); handleClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Broadcast failed'),
  });

  function handleClose() { setMessage(''); setTargetGroup('checked_in'); onClose(); }

  return (
    <Modal open={open} onClose={handleClose} title="Broadcast Message" size="lg">
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: MELON }}>Target Group</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {BROADCAST_GROUPS.map((g) => {
              const active = targetGroup === g.value;
              return (
                <button key={g.value} onClick={() => setTargetGroup(g.value)}
                  className="rounded-xl px-3 py-2.5 text-left transition-all"
                  style={{
                    border: active ? `1.5px solid ${MELON}` : `1.5px solid ${MELON}22`,
                    background: active ? GRADIENT_SOFT : '#fff',
                    boxShadow: active ? `0 4px 14px ${MELON}22` : 'none',
                  }}>
                  <p className="text-sm font-bold" style={{ color: active ? CORAL : '#1C0A02' }}>{g.label}</p>
                  <p className="text-xs" style={{ color: '#A8836C' }}>{g.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: '#6B4535' }}>Message</p>
            <span className="text-xs font-semibold" style={{ color: message.length > 900 ? CORAL : '#A8836C' }}>
              {message.length}/1000
            </span>
          </div>
          <textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi {name}, …  use {name} for personalization"
            className="w-full resize-none rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              border: `1.5px solid ${MELON}30`, background: '#FFFDFB', color: '#1C0A02',
              boxShadow: `0 2px 10px ${MELON}10`,
            }} />
          <p className="mt-1 text-xs" style={{ color: '#A8836C' }}>{'{name}'} will be replaced with each guest's first name.</p>
        </div>
        <div className="flex items-start gap-2 rounded-xl p-3 text-xs"
          style={{ background: '#FEF2F2', border: `1.5px solid ${CORAL}33`, color: '#991B1B' }}>
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>This sends a WhatsApp message to every matching guest immediately. Rate-limited at 12 messages/sec.</p>
        </div>
        <div className="flex gap-2">
          <PrimaryBtn variant="outline" onClick={handleClose}>Cancel</PrimaryBtn>
          <div className="flex-1">
            <PrimaryBtn disabled={!message.trim() || message.length > 1000} loading={broadcastMutation.isPending}
              onClick={() => broadcastMutation.mutate()} icon={<Megaphone className="h-4 w-4" />}>
              Start Broadcast
            </PrimaryBtn>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const qc = useQueryClient();
  const { staff, tenant, hasPermission, hasRole } = useAuth();

  const [page, setPage]                   = useState(1);
  const [channelFilter, setChannelFilter] = useState('');
  const [statusFilter, setStatusFilter]   = useState('');
  const [search, setSearch]               = useState('');
  const [showSend, setShowSend]           = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [expandedId, setExpandedId]       = useState<string | null>(null);

  const LIMIT = 20;

  // ── Queries ──
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['notifications', page, channelFilter, statusFilter],
    queryFn:  () => api.get('/api/notifications', {
      params: { page, limit: LIMIT, ...(channelFilter && { channel: channelFilter }), ...(statusFilter && { status: statusFilter }) },
    }).then((r) => r.data.data),
    refetchInterval: 30_000,
  });

  const { data: statsRaw } = useQuery<StatsResponse>({
    queryKey: ['notification-stats'],
    queryFn:  () => api.get('/api/notifications/stats').then((r) => r.data.data),
    refetchInterval: 60_000,
  });

  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ['notification-templates'],
    queryFn:  () => api.get('/api/notifications/templates').then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

  // ── Overdue checkouts — from reservations API ──
  const { data: overdueGuests = [] } = useQuery<OverdueGuest[]>({
    queryKey: ['overdue-checkouts'],
    queryFn:  () => api.get('/api/reservations', {
      params: { status: 'checked_in', checkOutBefore: new Date().toISOString(), limit: 50 },
    }).then((r) => {
      const now = Date.now();
      return (r.data.data?.docs ?? [])
        .filter((rv: any) => rv.checkOut && new Date(rv.checkOut).getTime() < now)
        .map((rv: any) => ({
          id:            rv._id,
          guestId:       rv.guestId?._id ?? rv.guestId,
          guestName:     `${rv.guestId?.firstName ?? ''} ${rv.guestId?.lastName ?? ''}`.trim() || 'Guest',
          phone:         rv.guestId?.whatsappNumber ?? rv.guestId?.phone ?? '',
          roomNumber:    rv.roomNumber ?? '--',
          bookingRef:    rv.bookingRef ?? '--',
          checkOut:      rv.checkOut,
          minutesOverdue: Math.floor((now - new Date(rv.checkOut).getTime()) / 60000),
          conversationId: rv.conversationId,
        }));
    }),
    refetchInterval: 5 * 60_000,
  });

  // ── Mutations ──
  const overdueAlertMutation = useMutation({
    mutationFn: (g: OverdueGuest) => api.post('/api/notifications/whatsapp', {
      guestId: g.guestId,
      trigger: 'checkout_overdue',
      message: `⏰ *Checkout Overdue Reminder*\n\nDear ${g.guestName}, your checkout from Room *${g.roomNumber}* was scheduled for 11:00 AM and is now ${fmtOverdue(g.minutesOverdue)}.\n\nPlease proceed to the front desk at your earliest convenience. Thank you! 🙏`,
    }),
    onSuccess: () => {
      toast.success('Checkout overdue alert sent via WhatsApp');
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notification-stats'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to send alert'),
  });

  const overdueChatMutation = useMutation({
    mutationFn: (g: OverdueGuest) => {
      if (!g.conversationId) throw new Error('No conversation found for this guest');
      return api.post(`/api/conversations/${g.conversationId}/messages`, {
        text: `⏰ *Checkout Reminder* — ${g.guestName}, your checkout from Room ${g.roomNumber} is now overdue. Please proceed to the front desk. Thank you!`,
        senderType: 'staff',
        trigger: 'checkout_overdue',
      });
    },
    onSuccess: () => toast.success('Checkout alert sent to Guest Chat'),
    onError:   (e: any) => toast.error(e.message ?? e.response?.data?.message ?? 'Failed to send'),
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/notifications/${id}/retry`),
    onSuccess: (r) => {
      const sent = r.data?.data?.sent;
      toast.success(sent ? 'Retry sent' : 'Retry attempted but failed');
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notification-stats'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Retry failed'),
  });

  // ── Derived stats ──
  const byStatus  = statsRaw?.byStatus  ?? [];
  const byChannel = statsRaw?.byChannel ?? [];

  const stats = {
    total:     byStatus.reduce((s, x) => s + x.count, 0),
    sent:      byStatus.filter((x) => x._id.status === 'sent').reduce((s, x) => s + x.count, 0),
    delivered: byStatus.filter((x) => x._id.status === 'delivered').reduce((s, x) => s + x.count, 0),
    failed:    byStatus.filter((x) => x._id.status === 'failed').reduce((s, x) => s + x.count, 0),
    queued:    byStatus.filter((x) => x._id.status === 'queued').reduce((s, x) => s + x.count, 0),
    whatsapp:  byChannel.find((x) => x._id === 'whatsapp')?.count ?? 0,
  };

  const deliveryRate = stats.total > 0
    ? Math.round(((stats.delivered + stats.sent) / stats.total) * 100) : 0;

  const docs: Notification[] = data?.docs ?? [];
  const total:     number    = data?.total ?? 0;
  const totalPages: number   = data?.totalPages ?? Math.ceil(total / LIMIT);

  const filtered = search
    ? docs.filter((n) =>
        [n.guestId?.firstName, n.guestId?.lastName, n.to, n.body]
          .join(' ').toLowerCase().includes(search.toLowerCase()))
    : docs;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['notifications'] });
    qc.invalidateQueries({ queryKey: ['notification-stats'] });
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout title="Notifications">
      <div className="mx-auto max-w-6xl space-y-5">

        {/* ── HEADER ── */}
        <div className="relative overflow-hidden rounded-3xl p-6"
          style={{
            background: `linear-gradient(135deg, ${MELON}12 0%, ${CORAL}10 50%, ${PINK}10 100%)`,
            border: `1.5px solid ${MELON}25`,
            boxShadow: `0 10px 30px ${MELON}15`,
          }}>
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-30 blur-3xl"
            style={{ background: GRADIENT_PRIMARY }} />
          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                style={{ background: GRADIENT_PRIMARY, boxShadow: `0 8px 24px ${MELON}55` }}>
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#1C0A02' }}>Notifications</h1>
                <p className="mt-0.5 text-sm" style={{ color: '#6B4535' }}>
                  WhatsApp &amp; messaging logs ·{' '}
                  <span className="font-semibold" style={{ color: MELON }}>{total.toLocaleString()}</span> total
                  {overdueGuests.length > 0 && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                      style={{ background: '#FEE2E2', color: '#B91C1C' }}>
                      <AlertTriangle className="h-3 w-3" />
                      {overdueGuests.length} overdue
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <PrimaryBtn variant="outline" onClick={() => refetch()}
                icon={<RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} style={{ color: MELON }} />}>
                Refresh
              </PrimaryBtn>
              {hasPermission('notifications.create') && (
                <PrimaryBtn onClick={() => setShowSend(true)} icon={<Send className="h-4 w-4" />}>
                  Send Message
                </PrimaryBtn>
              )}
              {(hasRole('owner') || hasRole('manager') || hasPermission('notifications.broadcast')) && (
                <PrimaryBtn variant="soft" onClick={() => setShowBroadcast(true)} icon={<Megaphone className="h-4 w-4" />}>
                  Broadcast
                </PrimaryBtn>
              )}
            </div>
          </div>
        </div>

        {/* ── CHECKOUT OVERDUE BANNER ── */}
        <CheckoutOverdueBanner
          guests={overdueGuests}
          onSendAlert={(g) => overdueAlertMutation.mutate(g)}
          onSendToChat={(g) => overdueChatMutation.mutate(g)}
          isPending={overdueAlertMutation.isPending || overdueChatMutation.isPending}
        />

        {/* ── STATS ── */}
        <motion.div
          variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
          initial="initial" animate="animate"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        >
          <StatTile label="Total"         value={stats.total}     icon={Bell}        tint="#6B4535" bg="#FFF7EF" />
          <StatTile label="Delivered"     value={stats.delivered} icon={CheckCircle} tint="#059669" bg="#ECFDF5" />
          <StatTile label="Sent"          value={stats.sent}      icon={Send}        tint="#2563EB" bg="#EFF6FF" />
          <StatTile label="Queued"        value={stats.queued}    icon={Clock}       tint="#6366F1" bg="#EEF2FF" />
          <StatTile label="Failed"        value={stats.failed}    icon={XCircle}     tint="#DC2626" bg="#FEF2F2" />
          <StatTile label="Delivery Rate" value={`${deliveryRate}%`} icon={TrendingUp} tint="#fff" bg="#fff" highlight />
        </motion.div>

        {/* ── CHANNEL BREAKDOWN ── */}
        {byChannel.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {byChannel.map(({ _id: channel, count }) => {
              const cfg = CHANNEL_CONFIG[channel] ?? CHANNEL_CONFIG.whatsapp;
              const active = channelFilter === channel;
              return (
                <button key={channel}
                  onClick={() => { setChannelFilter(channelFilter === channel ? '' : channel); setPage(1); }}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all hover:scale-[1.01]"
                  style={{
                    background: active ? GRADIENT_SOFT : '#fff',
                    border: active ? `1.5px solid ${MELON}66` : `1.5px solid ${MELON}1A`,
                    boxShadow: active ? `0 6px 18px ${MELON}22` : `0 2px 10px ${MELON}08`,
                  }}>
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: cfg.tint }} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold" style={{ color: active ? CORAL : '#1C0A02' }}>{cfg.label}</p>
                    <p className="text-xs" style={{ color: '#A8836C' }}>{count.toLocaleString()} messages</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── FILTERS ── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-48 flex-1 items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: '#fff', border: `1.5px solid ${MELON}25`, boxShadow: `0 2px 10px ${MELON}08` }}>
            <Search className="h-4 w-4 flex-shrink-0" style={{ color: MELON }} />
            <input type="text" placeholder="Search guest, phone, message…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none" style={{ color: '#1C0A02' }} />
            {search && (
              <button onClick={() => setSearch('')} className="rounded-full p-0.5" style={{ color: '#A8836C' }} aria-label="Clear">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Channel filter */}
          <select value={channelFilter} onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
            className="rounded-xl px-3 py-2 text-sm font-medium focus:outline-none"
            style={{ background: '#fff', border: `1.5px solid ${MELON}25`, color: '#6B4535', boxShadow: `0 2px 10px ${MELON}08` }}>
            <option value="">All Channels</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
            <option value="push">Push</option>
          </select>

          {/* Status filter */}
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-xl px-3 py-2 text-sm font-medium focus:outline-none"
            style={{ background: '#fff', border: `1.5px solid ${MELON}25`, color: '#6B4535', boxShadow: `0 2px 10px ${MELON}08` }}>
            <option value="">All Statuses</option>
            <option value="queued">Queued</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>

          {(channelFilter || statusFilter || search) && (
            <button onClick={() => { setChannelFilter(''); setStatusFilter(''); setSearch(''); setPage(1); }}
              className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition-colors"
              style={{ color: CORAL, background: '#FEF2F4', border: `1.5px solid ${CORAL}30` }}>
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
          <span className="ml-auto text-xs font-semibold" style={{ color: '#A8836C' }}>{filtered.length} shown</span>
        </div>

        {/* ── NOTIFICATION LIST ── */}
        <div className="overflow-hidden rounded-2xl"
          style={{ background: '#fff', border: `1.5px solid ${MELON}1F`, boxShadow: `0 4px 20px ${MELON}0D` }}>
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : !filtered.length ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: GRADIENT_SOFT }}>
                <Bell className="h-6 w-6" style={{ color: MELON }} />
              </div>
              <p className="font-semibold" style={{ color: '#1C0A02' }}>No notifications found</p>
              <p className="mt-1 text-sm" style={{ color: '#A8836C' }}>
                {channelFilter || statusFilter ? 'Try clearing filters' : 'Send a WhatsApp message to get started'}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: `${MELON}10` }}>
              {filtered.map((n, i) => {
                const statusCfg  = STATUS_CONFIG[n.status]  ?? STATUS_CONFIG.pending;
                const channelCfg = CHANNEL_CONFIG[n.channel] ?? CHANNEL_CONFIG.whatsapp;
                const StatusIcon = statusCfg.icon;
                const isExpanded = expandedId === n.id;
                const isFailed   = n.status === 'failed';
                const canRetry   = isFailed && (n.retryCount ?? 0) < 3;

                return (
                  <motion.div key={n.id}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    style={{ background: isFailed ? '#FEF2F230' : 'transparent' }}>
                    <div className="flex w-full items-start gap-4 px-5 py-4 transition-colors hover:bg-orange-50/40">

                      {/* Expand button */}
                      <button onClick={() => setExpandedId(isExpanded ? null : n.id)}
                        className="flex flex-1 items-start gap-4 text-left">
                        {/* Status icon */}
                        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                          style={{ background: statusCfg.bg }}>
                          <StatusIcon className="h-4 w-4" style={{ color: statusCfg.tint }} />
                        </div>

                        <div className="min-w-0 flex-1">
                          {/* Title row */}
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold" style={{ color: '#1C0A02' }}>
                              {n.guestId ? `${n.guestId.firstName} ${n.guestId.lastName}` : n.to}
                            </span>
                            {/* Channel pill */}
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={{ background: channelCfg.bg, color: channelCfg.tint, border: `1px solid ${channelCfg.ring}` }}>
                              {channelCfg.label}
                            </span>
                            {/* Trigger pill */}
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{ background: '#FFF7EF', color: '#6B4535', border: `1px solid ${MELON}22` }}>
                              {TRIGGER_LABELS[n.trigger] ?? n.trigger}
                            </span>
                            {/* Retry count */}
                            {(n.retryCount ?? 0) > 0 && (
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                style={{ background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}>
                                Retried {n.retryCount}×
                              </span>
                            )}
                            {/* Status badge (right) */}
                            <span className="ml-auto flex-shrink-0 text-[10px] font-bold" style={{ color: statusCfg.tint }}>
                              {statusCfg.label}
                            </span>
                          </div>

                          {/* Message preview */}
                          <p className={cn('text-sm leading-snug', isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-1')}
                            style={{ color: '#6B4535' }}>{n.body}</p>

                          {/* Failure reason */}
                          {isFailed && n.failureReason && isExpanded && (
                            <div className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs"
                              style={{ background: '#FEF2F2', color: '#991B1B', border: `1px solid ${CORAL}33` }}>
                              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                              {n.failureReason}
                            </div>
                          )}

                          {/* Meta row */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: '#A8836C' }}>
                            <span className="font-mono">{n.to}</span>
                            <span>·</span>
                            <span>{formatDateTime(n.createdAt)}</span>
                            {isExpanded && n.reservationId?.bookingRef && (
                              <><span>·</span><span className="font-mono">{n.reservationId.bookingRef}</span></>
                            )}
                            {isExpanded && n.externalId && (
                              <><span>·</span>
                              <span className="truncate font-mono" title={n.externalId}>
                                ID {n.externalId.slice(0, 20)}
                              </span></>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Actions column */}
                      <div className="flex flex-shrink-0 flex-col gap-1.5 self-center">
                        {/* Retry */}
                        {canRetry && (
                          <button
                            onClick={(e) => { e.stopPropagation(); retryMutation.mutate(n.id); }}
                            disabled={retryMutation.isPending}
                            title={`Retry (${n.retryCount ?? 0}/3)`}
                            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:scale-[1.03] disabled:opacity-50"
                            style={{ background: GRADIENT_SOFT, color: CORAL, border: `1.5px solid ${MELON}33` }}>
                            <RotateCw className={cn('h-3.5 w-3.5', retryMutation.isPending && 'animate-spin')} />
                            Retry
                          </button>
                        )}
                        {/* Send to chat (if guest has a phone) */}
                        {n.guestId?.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Open send modal pre-filled for this guest
                              setShowSend(true);
                            }}
                            title="Send to Guest Chat"
                            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:scale-[1.03]"
                            style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1.5px solid #BFDBFE' }}>
                            <MessageCircle className="h-3.5 w-3.5" />
                            Chat
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── PAGINATION ── */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium" style={{ color: '#6B4535' }}>
              Page <span style={{ color: MELON }}>{page}</span> of {totalPages} ·{' '}
              {total.toLocaleString()} total
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: '#fff', border: `1.5px solid ${MELON}25`, color: '#6B4535', boxShadow: `0 2px 10px ${MELON}08` }}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                const active = p === page;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className="h-9 w-9 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: active ? GRADIENT_PRIMARY : '#fff',
                      color: active ? '#fff' : '#6B4535',
                      border: active ? 'none' : `1.5px so
lid ${MELON}25`,
                      boxShadow: active ? `0 6px 16px ${MELON}55` : `0 2px 10px ${MELON}08`,
                    }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: '#fff', border: `1.5px solid ${MELON}25`, color: '#6B4535', boxShadow: `0 2px 10px ${MELON}08` }}>
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── MODALS ── */}
        <SendModal open={showSend} onClose={() => setShowSend(false)} onSent={invalidate}
          templates={templates} tenant={tenant} staff={staff} />
        <BroadcastModal open={showBroadcast} onClose={() => setShowBroadcast(false)} onSent={invalidate} />
      </div>
    </DashboardLayout>
  );
}