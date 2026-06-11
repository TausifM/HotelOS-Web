'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronRight,
  CircleDot,
  Clock3,
  Filter,
  History,
  Loader2,
  MessageSquare,
  Minus,
  Phone,
  Search,
  Send,
  UserRound,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// ─── Types ──────────────────────────────────────────────────────────────────

type ConversationStatus = 'open' | 'pending_staff' | 'resolved' | 'closed';

type MessageRole = 'guest' | 'staff' | 'bot';

type ChatHistoryMessage = {
  _id: string;
  senderType: MessageRole;
  senderName?: string;
  text?: string;
  messageType?: string;
  status?: string;
  createdAt: string;
};

type ChatHistoryGuest = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | string[];
  email?: string | string[];
} | null;

type ChatHistoryAssignedStaff = {
  _id?: string;
  name?: string;
  role?: string;
} | null;

type ChatHistoryItem = {
  _id: string;
  reservationId?: string;
  roomNumber?: string;
  status: ConversationStatus;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  lastMessageBy?: MessageRole;
  unreadCountStaff?: number;
  unreadCountGuest?: number;
  guest?: ChatHistoryGuest;
  assignedStaff?: ChatHistoryAssignedStaff;
  messages: ChatHistoryMessage[];
  messageCount: number;
};

type ChatHistoryResponse = {
  docs: ChatHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type StaffMessage = {
  _id?: string;
  id?: string;
  conversationId?: string;
  senderType: MessageRole;
  senderName?: string;
  text?: string;
  messageType?: string;
  createdAt?: string;
  status?: string;
};

type ConversationDetail = {
  conversation: {
    _id: string;
    roomNumber?: string;
    status: ConversationStatus;
    lastMessageAt?: string;
    lastMessagePreview?: string;
    unreadCountStaff?: number;
    guestId?: ChatHistoryGuest;
    assignedStaffId?: ChatHistoryAssignedStaff;
  };
  messages: StaffMessage[];
};

// ─── Design Tokens ──────────────────────────────────────────────────────────

const MELON = '#F97316';
const CORAL = '#F43F5E';
const TEAL = '#0D9488';
const SAGE = '#16A34A';
const VIOLET = '#7C3AED';
const SKY = '#0284C7';
const SLATE = '#64748B';

const BG = '#FFFBF7';
const PANEL = '#FFF7EF';
const SURFACE = '#FFFFFF';
const BORDER = '#F0E4D8';
const BORDER_MID = '#E5CDB8';
const BORDER_LIGHT = '#FAF0E6';
const TEXT = '#1C0A02';
const TEXT_SUB = '#6B4535';
const TEXT_MUTED = '#A8836C';
const TEXT_LIGHT = '#C4A88A';

const GRADIENT_PRIMARY = `linear-gradient(135deg, ${MELON} 0%, ${CORAL} 100%)`;
const GRADIENT_SOFT = 'linear-gradient(135deg, #FFF3E6 0%, #FFE4EA 100%)';

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(value?: string) {
  if (!value) return '--';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function fmtTime(value?: string) {
  if (!value) return '--';
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function fmtDateTime(value?: string) {
  if (!value) return '--';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function fullGuestName(guest?: ChatHistoryGuest) {
  if (!guest) return 'Guest';
  const name = [guest.firstName, guest.lastName].filter(Boolean).join(' ').trim();
  return name || 'Guest';
}

function getGuestPhone(phone?: string | string[]) {
  return Array.isArray(phone) ? phone[0] : phone || '--';
}

function statusMeta(status: ConversationStatus) {
  const map: Record<string, { label: string; bg: string; color: string; border: string; dot: string }> = {
    open: { label: 'Open', bg: '#FFF7ED', color: '#9A3412', border: '#FED7AA', dot: MELON },
    pending_staff: { label: 'Pending Staff', bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
    resolved: { label: 'Resolved', bg: '#F0FDF4', color: '#166534', border: '#BBF7D0', dot: SAGE },
    closed: { label: 'Closed', bg: '#F8FAFC', color: '#475569', border: '#E2E8F0', dot: SLATE },
  };
  return map[status] || map.open;
}

function senderMeta(type: MessageRole) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    guest: { label: 'Guest', color: MELON, bg: '#FFF7ED' },
    staff: { label: 'Staff', color: TEAL, bg: '#F0FDFA' },
    bot: { label: 'AI Bot', color: VIOLET, bg: '#F5F3FF' },
  };
  return map[type] || map.guest;
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return <Loader2 className={cn(className, 'animate-spin')} />;
}

function Pill({
  children,
  bg,
  color,
  border,
  dot,
}: {
  children: React.ReactNode;
  bg: string;
  color: string;
  border: string;
  dot?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
      style={{ background: bg, color, border: `1px solid ${border}` }}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} /> : null}
      {children}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tint,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  tint: string;
  bg: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4"
      style={{
        background: SURFACE,
        border: `1.5px solid ${BORDER}`,
        boxShadow: '0 4px 16px rgba(249,115,22,0.05)',
      }}
    >
      <div
        className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ background: bg, color: tint }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-xl font-bold" style={{ color: TEXT }}>
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </div>
      <p className="mt-0.5 text-[11px] font-semibold" style={{ color: TEXT_MUTED }}>
        {label}
      </p>
    </motion.div>
  );
}

// ─── Chat Widget ────────────────────────────────────────────────────────────

function ChatWidget({
  conversationId,
  onClose,
}: {
  conversationId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [reply, setReply] = useState('');
  const [localMessages, setLocalMessages] = useState<StaffMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const { data: detail, isLoading } = useQuery<ConversationDetail>({
    queryKey: ['chatbot-conversation-detail', conversationId],
    queryFn: () =>
      api.get(`/api/chatbot/staff/conversations/${conversationId}`).then((r) => r.data.data),
    enabled: !!conversationId,
    refetchInterval: 5000,
  });

  const conversation = detail?.conversation;
  const guest = conversation?.guestId;

  useEffect(() => {
    if (!detail?.messages) return;
    const incoming = detail.messages;
    const hasNew = incoming.length > prevCountRef.current;

    setLocalMessages((prev) => {
      const serverIds = new Set(incoming.map((m) => m._id || m.id));
      const optimistic = prev.filter((m) => !serverIds.has(m._id || m.id));
      return [...incoming, ...optimistic];
    });

    if (hasNew && prevCountRef.current > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevCountRef.current = incoming.length;
  }, [detail]);

  useEffect(() => {
    setLocalMessages([]);
    prevCountRef.current = 0;
  }, [conversationId]);

  const sendReplyMutation = useMutation({
    mutationFn: async ({ text, tempId }: { text: string; tempId: string }) => {
      const res = await api.post(`/api/chatbot/staff/conversations/${conversationId}/reply`, { text });
      return res.data.data;
    },
    onSuccess: (data: StaffMessage | null, vars) => {
      toast.success('Reply sent');
      setLocalMessages((prev) =>
        prev.map((m) => ((m._id || m.id) === vars.tempId ? { ...data!, status: 'sent' } : m))
      );
      qc.invalidateQueries({ queryKey: ['chatbot-conversation-detail', conversationId] });
    },
    onError: (e: any, vars) => {
      setLocalMessages((prev) => prev.filter((m) => (m._id || m.id) !== vars.tempId));
      setReply((c) => c || vars.text);
      toast.error(e?.response?.data?.message || 'Failed to send');
    },
  });

  const handleSend = () => {
    const text = reply.trim();
    if (!text || sendReplyMutation.isPending) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic: StaffMessage = {
      id: tempId,
      conversationId,
      senderType: 'staff',
      senderName: 'Staff',
      text,
      messageType: 'text',
      createdAt: new Date().toISOString(),
      status: 'sending',
    };
    setReply('');
    setLocalMessages((prev) => [...prev, optimistic]);
    sendReplyMutation.mutate({ text, tempId });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  const visibleMessages = localMessages.filter((m) => !!String(m.text || '').trim());

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.96 }}
      transition={{ type: 'spring', damping: 26, stiffness: 280 }}
      className="fixed right-4 top-4 z-[100] flex h-[calc(100vh-2rem)] w-[420px] max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-[28px]"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFCFA 100%)',
        border: `1.5px solid ${BORDER}`,
        boxShadow: '0 24px 64px rgba(15,23,42,0.18)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-3 border-b px-5 py-4"
        style={{ borderColor: BORDER, background: 'rgba(255,252,248,0.98)', backdropFilter: 'blur(18px)' }}
      >
        <div className="min-w-0 flex items-center gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[16px] text-sm font-bold text-white"
            style={{ background: GRADIENT_PRIMARY, boxShadow: '0 6px 18px rgba(249,115,22,0.24)' }}
          >
            {conversation?.roomNumber || fullGuestName(guest).charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-bold" style={{ color: TEXT }}>
                Room {conversation?.roomNumber || '--'}
              </h3>
              {conversation?.status ? (
                <Pill
                  bg={statusMeta(conversation.status).bg}
                  color={statusMeta(conversation.status).color}
                  border={statusMeta(conversation.status).border}
                  dot={statusMeta(conversation.status).dot}
                >
                  {statusMeta(conversation.status).label}
                </Pill>
              ) : null}
            </div>
            <p className="truncate text-[11px]" style={{ color: TEXT_MUTED }}>
              {fullGuestName(guest)} · {conversation?.assignedStaffId?.name || 'Unassigned'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors hover:bg-red-50"
            style={{ color: CORAL }}
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 space-y-4 overflow-y-auto px-5 py-4"
        style={{
          background:
            'radial-gradient(circle at top right, rgba(249,115,22,0.04), transparent 30%), linear-gradient(180deg, #FFFCFA 0%, #FFF8F3 100%)',
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="h-6 w-6" />
          </div>
        ) : !visibleMessages.length ? (
          <div className="py-16 text-center">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[24px]"
              style={{ background: GRADIENT_SOFT, color: MELON }}
            >
              <MessageSquare className="h-6 w-6" />
            </div>
            <p className="font-bold" style={{ color: TEXT }}>
              No messages yet
            </p>
            <p className="mt-1 text-sm" style={{ color: TEXT_MUTED }}>
              Start the conversation below.
            </p>
          </div>
        ) : (
          visibleMessages.map((m, idx) => {
            const isStaff = m.senderType === 'staff';
            const isBot = m.senderType === 'bot';
            const meta = senderMeta(m.senderType);

            return (
              <motion.div
                key={m._id || m.id || idx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex w-full', isStaff ? 'justify-end' : 'justify-start')}
              >
                <div className={cn('flex max-w-[85%] flex-col', isStaff ? 'items-end' : 'items-start')}>
                  {!isStaff && (
                    <div className="mb-1 ml-1 flex items-center gap-2">
                      <span
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                        style={{
                          background: isBot
                            ? 'linear-gradient(135deg, #7C3AED, #4F46E5)'
                            : GRADIENT_PRIMARY,
                        }}
                      >
                        {isBot ? 'AI' : fullGuestName(guest).charAt(0)}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: meta.color }}>
                        {isBot ? 'AI Concierge' : m.senderName || 'Guest'}
                      </span>
                    </div>
                  )}

                  {isStaff && m.senderName && (
                    <div className="mb-1 mr-1 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: TEXT_MUTED }}>
                        {m.senderName}
                      </span>
                      <span
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #0D9488, #16A34A)' }}
                      >
                        S
                      </span>
                    </div>
                  )}

                  <div
                    className="rounded-[20px] px-4 py-3 text-sm leading-relaxed"
                    style={{
                      background: isStaff
                        ? 'linear-gradient(135deg, #0D9488 0%, #16A34A 100%)'
                        : isBot
                          ? 'linear-gradient(135deg, #F5F3FF, #EDE9FE)'
                          : SURFACE,
                      color: isStaff ? '#fff' : TEXT,
                      border: isStaff
                        ? 'none'
                        : isBot
                          ? '1.5px solid #DDD6FE'
                          : `1.5px solid ${BORDER}`,
                      borderTopRightRadius: isStaff ? 6 : 20,
                      borderTopLeftRadius: isStaff ? 20 : 6,
                      boxShadow: isStaff
                        ? '0 8px 24px rgba(13,148,136,0.18)'
                        : '0 2px 12px rgba(0,0,0,0.04)',
                    }}
                  >
                    <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</p>
                  </div>

                  <div className="mt-1 px-1 text-[10px] font-medium" style={{ color: TEXT_LIGHT }}>
                    {fmtDateTime(m.createdAt)}
                    {isStaff && <span className="ml-1.5" style={{ color: SAGE }}>✓✓</span>}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="border-t px-5 pb-4 pt-3"
        style={{ borderColor: BORDER, background: 'rgba(255,250,246,0.98)', backdropFilter: 'blur(20px)' }}
      >
        <div
          className="flex items-end gap-2 rounded-[22px] px-3 py-2.5"
          style={{
            background: SURFACE,
            border: `1.5px solid ${BORDER_MID}`,
            boxShadow: '0 4px 14px rgba(249,115,22,0.06)',
          }}
        >
          <div
            className="mb-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-[10px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #0D9488, #16A34A)' }}
          >
            S
          </div>

          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={1}
            placeholder="Reply to guest..."
            className="max-h-28 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none"
            style={{ color: TEXT, lineHeight: '1.5' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <button
            onClick={handleSend}
            disabled={!reply.trim() || sendReplyMutation.isPending}
            className="mb-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-40"
            style={{
              background: GRADIENT_PRIMARY,
              boxShadow: reply.trim() ? '0 6px 18px rgba(249,115,22,0.24)' : 'none',
            }}
          >
            {sendReplyMutation.isPending ? <Spinner className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px]" style={{ color: TEXT_LIGHT }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ChatHistoryPage() {
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [roomFilter, setRoomFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 25;

  // Chat widget
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, dateFrom, dateTo, roomFilter]);

  // Build query params
  const params = useMemo(() => {
    const p: Record<string, any> = { page, limit };
    if (debouncedSearch) p.search = debouncedSearch;
    if (statusFilter !== 'all') p.status = statusFilter;
    if (dateFrom) p.startDate = dateFrom;
    if (dateTo) p.endDate = dateTo;
    if (roomFilter) p.roomNumber = roomFilter;
    return p;
  }, [page, limit, debouncedSearch, statusFilter, dateFrom, dateTo, roomFilter]);

  const { data, isLoading, isFetching } = useQuery<ChatHistoryResponse>({
    queryKey: ['chat-history', params],
    queryFn: () => api.get('/api/chatbot/staff/chat-history', { params }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const docs = data?.docs || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Stats
  const stats = useMemo(() => {
    return {
      totalConversations: total,
      totalMessages: docs.reduce((sum, d) => sum + (d.messageCount || 0), 0),
      avgMessages: docs.length ? Math.round(docs.reduce((s, d) => s + (d.messageCount || 0), 0) / docs.length) : 0,
      activeNow: docs.filter((d) => d.status === 'open' || d.status === 'pending_staff').length,
    };
  }, [docs, total]);

  const statusOptions = [
    { key: 'all', label: 'All Status' },
    { key: 'open', label: 'Open' },
    { key: 'pending_staff', label: 'Pending Staff' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'closed', label: 'Closed' },
  ];

  return (
    <DashboardLayout title="Chat History">
      <div className="mx-auto max-w-[1600px] space-y-5" style={{ color: TEXT }}>
        {/* Header */}
        <div
          className="relative overflow-hidden rounded-[28px] p-6"
          style={{
            background:
              'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(244,63,94,0.05) 55%, rgba(236,72,153,0.04) 100%)',
            border: '1.5px solid rgba(249,115,22,0.14)',
            boxShadow: '0 10px 32px rgba(249,115,22,0.08)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full blur-3xl"
            style={{ background: 'rgba(249,115,22,0.12)' }}
          />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                  style={{
                    background: GRADIENT_PRIMARY,
                    boxShadow: '0 8px 24px rgba(249,115,22,0.24)',
                  }}
                >
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight" style={{ color: TEXT }}>
                    Chat History
                  </h1>
                  <p className="text-sm" style={{ color: TEXT_SUB }}>
                    Complete guest conversation archive with full message threads.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill bg="#F0FDFA" color="#115E59" border="#99F6E4">
                  <CircleDot className="mr-1 h-3 w-3" />
                  Live archive
                </Pill>
                <Pill bg="#FFF7ED" color="#9A3412" border="#FED7AA">
                  {total.toLocaleString('en-IN')} conversations
                </Pill>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={MessageSquare} label="Total Conversations" value={stats.totalConversations} tint={MELON} bg="#FFF7ED" />
          <StatCard icon={History} label="Total Messages" value={stats.totalMessages} tint={CORAL} bg="#FFF1F2" />
          <StatCard icon={Clock3} label="Avg. Messages / Chat" value={stats.avgMessages} tint={TEAL} bg="#F0FDFA" />
          <StatCard icon={Bell} label="Active Now" value={stats.activeNow} tint={SAGE} bg="#F0FDF4" />
        </div>

        {/* Filters Bar */}
        <div
          className="rounded-[24px] p-4"
          style={{
            background: SURFACE,
            border: `1.5px solid ${BORDER}`,
            boxShadow: '0 6px 20px rgba(249,115,22,0.05)',
          }}
        >
          <div className="flex flex-wrap items-end gap-3">
            {/* Search */}
            <div className="min-w-[240px] flex-1">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: TEXT_MUTED }}>
                Search messages
              </label>
              <div
                className="flex items-center gap-2.5 rounded-[18px] px-3 py-2.5"
                style={{ background: PANEL, border: `1.5px solid ${BORDER_MID}` }}
              >
                <Search className="h-4 w-4 flex-shrink-0" style={{ color: MELON }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search in guest messages..."
                  className="w-full bg-transparent text-sm outline-none"
                  style={{ color: TEXT }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ color: CORAL }}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="min-w-[140px]">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: TEXT_MUTED }}>
                Status
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none rounded-[18px] px-3 py-2.5 pr-8 text-sm outline-none"
                  style={{ background: PANEL, color: TEXT, border: `1.5px solid ${BORDER_MID}`, cursor: 'pointer' }}
                >
                  {statusOptions.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90" style={{ color: TEXT_MUTED }} />
              </div>
            </div>

            {/* Room */}
            <div className="min-w-[100px]">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: TEXT_MUTED }}>
                Room
              </label>
              <input
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                placeholder="e.g. 204"
                className="w-full rounded-[18px] px-3 py-2.5 text-sm outline-none"
                style={{ background: PANEL, color: TEXT, border: `1.5px solid ${BORDER_MID}` }}
              />
            </div>

            {/* Date From */}
            <div className="min-w-[150px]">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: TEXT_MUTED }}>
                From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-[18px] px-3 py-2.5 text-sm outline-none"
                style={{ background: PANEL, color: TEXT, border: `1.5px solid ${BORDER_MID}` }}
              />
            </div>

            {/* Date To */}
            <div className="min-w-[150px]">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: TEXT_MUTED }}>
                To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-[18px] px-3 py-2.5 text-sm outline-none"
                style={{ background: PANEL, color: TEXT, border: `1.5px solid ${BORDER_MID}` }}
              />
            </div>

            {/* Clear */}
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setDateFrom('');
                setDateTo('');
                setRoomFilter('');
                setPage(1);
              }}
              className="rounded-[18px] px-4 py-2.5 text-xs font-bold"
              style={{ background: '#FFF1F2', color: CORAL, border: '1.5px solid #FECDD3' }}
            >
              <X className="mr-1 inline h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* Table */}
        <div
          className="overflow-hidden rounded-[24px]"
          style={{
            background: SURFACE,
            border: `1.5px solid ${BORDER}`,
            boxShadow: '0 8px 28px rgba(249,115,22,0.06)',
          }}
        >
          {/* Table Header */}
          <div
            className="grid items-center gap-3 border-b px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{
              borderColor: BORDER,
              background: PANEL,
              color: TEXT_MUTED,
              gridTemplateColumns: '60px 1.2fr 1fr 140px 120px 100px 110px',
            }}
          >
            <span>Room</span>
            <span>Guest</span>
            <span>Last Message</span>
            <span>Status</span>
            <span>Assigned</span>
            <span className="text-right">Msgs</span>
            <span className="text-right">Last Active</span>
          </div>

          {/* Table Body */}
          <div className="min-h-[400px]">
            {isLoading && !docs.length ? (
              <div className="flex items-center justify-center py-20">
                <Spinner className="h-7 w-7" />
              </div>
            ) : !docs.length ? (
              <div className="py-20 text-center">
                <div
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl"
                  style={{ background: GRADIENT_SOFT, color: MELON }}
                >
                  <Search className="h-7 w-7" />
                </div>
                <p className="font-semibold" style={{ color: TEXT }}>
                  No conversations found
                </p>
                <p className="mt-1 text-sm" style={{ color: TEXT_MUTED }}>
                  Try adjusting your filters or search term.
                </p>
              </div>
            ) : (
              <div>
                {docs.map((item, idx) => {
                  const st = statusMeta(item.status);
                  const lastMsg = item.messages[item.messages.length - 1];
                  const lastSender = lastMsg ? senderMeta(lastMsg.senderType) : null;

                  return (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      onClick={() => setActiveChatId(item._id)}
                      className="group grid cursor-pointer items-center gap-3 border-b px-5 py-4 transition-all hover:bg-[#FFF8F3]"
                      style={{
                        borderColor: BORDER_LIGHT,
                        gridTemplateColumns: '60px 1.2fr 1fr 140px 120px 100px 110px',
                      }}
                    >
                      {/* Room */}
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white"
                          style={{ background: GRADIENT_PRIMARY }}
                        >
                          {item.roomNumber || '--'}
                        </div>
                      </div>

                      {/* Guest */}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold" style={{ color: TEXT }}>
                          {fullGuestName(item.guest)}
                        </p>
                        <p className="truncate text-[11px]" style={{ color: TEXT_MUTED }}>
                          {getGuestPhone(item.guest?.phone)}
                        </p>
                      </div>

                      {/* Last Message */}
                      <div className="min-w-0">
                        {lastMsg ? (
                          <div>
                            <div className="mb-0.5 flex items-center gap-1.5">
                              {lastSender && (
                                <span
                                  className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                                  style={{ background: lastSender.bg, color: lastSender.color }}
                                >
                                  {lastSender.label}
                                </span>
                              )}
                              <span className="text-[10px]" style={{ color: TEXT_LIGHT }}>
                                {fmtTime(lastMsg.createdAt)}
                              </span>
                            </div>
                            <p className="truncate text-xs leading-5" style={{ color: TEXT_SUB }}>
                              {lastMsg.text || '—'}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs italic" style={{ color: TEXT_LIGHT }}>
                            No messages
                          </p>
                        )}
                      </div>

                      {/* Status */}
                      <div>
                        <Pill bg={st.bg} color={st.color} border={st.border} dot={st.dot}>
                          {st.label}
                        </Pill>
                      </div>

                      {/* Assigned */}
                      <div className="min-w-0">
                        {item.assignedStaff?.name ? (
                          <div className="flex items-center gap-1.5">
                            <div
                              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
                              style={{ background: 'linear-gradient(135deg, #0D9488, #16A34A)' }}
                            >
                              {item.assignedStaff.name.charAt(0)}
                            </div>
                            <span className="truncate text-xs font-semibold" style={{ color: TEXT_SUB }}>
                              {item.assignedStaff.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs italic" style={{ color: TEXT_LIGHT }}>
                            Unassigned
                          </span>
                        )}
                      </div>

                      {/* Message Count */}
                      <div className="text-right">
                        <span
                          className="inline-flex min-w-[28px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold"
                          style={{
                            background: item.messageCount > 0 ? '#FFF7ED' : '#F8FAFC',
                            color: item.messageCount > 0 ? MELON : TEXT_LIGHT,
                            border: `1px solid ${item.messageCount > 0 ? '#FED7AA' : '#E2E8F0'}`,
                          }}
                        >
                          {item.messageCount}
                        </span>
                      </div>

                      {/* Last Active */}
                      <div className="text-right">
                        <p className="text-xs font-semibold" style={{ color: TEXT_SUB }}>
                          {fmtDate(item.lastMessageAt)}
                        </p>
                        <p className="text-[10px]" style={{ color: TEXT_LIGHT }}>
                          {fmtTime(item.lastMessageAt)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between border-t px-5 py-3"
              style={{ borderColor: BORDER, background: PANEL }}
            >
              <p className="text-xs" style={{ color: TEXT_MUTED }}>
                Showing <span className="font-semibold" style={{ color: TEXT }}>{(page - 1) * limit + 1}</span> –{' '}
                <span className="font-semibold" style={{ color: TEXT }}>
                  {Math.min(page * limit, total)}
                </span>{' '}
                of <span className="font-semibold" style={{ color: TEXT }}>{total.toLocaleString('en-IN')}</span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-xl disabled:opacity-40"
                  style={{ background: SURFACE, border: `1.5px solid ${BORDER_MID}`, color: TEXT_SUB }}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  const active = pageNum === page;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: active ? GRADIENT_PRIMARY : SURFACE,
                        color: active ? '#fff' : TEXT_SUB,
                        border: active ? 'none' : `1.5px solid ${BORDER_MID}`,
                        boxShadow: active ? '0 4px 14px rgba(249,115,22,0.24)' : 'none',
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-xl disabled:opacity-40"
                  style={{ background: SURFACE, border: `1.5px solid ${BORDER_MID}`, color: TEXT_SUB }}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Widget Overlay */}
      <AnimatePresence>
        {activeChatId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90]"
              style={{ background: 'rgba(15,23,42,0.15)' }}
              onClick={() => setActiveChatId(null)}
            />
            <ChatWidget
              conversationId={activeChatId}
              onClose={() => setActiveChatId(null)}
            />
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}