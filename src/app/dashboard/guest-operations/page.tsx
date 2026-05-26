'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import {
  Bell,
  CalendarClock,
  ChevronRight,
  CircleDot,
  ClipboardList,
  Clock3,
  HandPlatter,
  House,
  IndianRupee,
  Loader2,
  LogOut,
  MessageSquare,
  Phone,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  UserRound,
  UtensilsCrossed,
  Wrench,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  Minus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

type Room = {
  _id?: string;
  id?: string;
  roomNumber: string;
  floor?: string | number;
  status?: string;
  roomType?: string;
  housekeepingStatus?: string;
  occupancyStatus?: string;
};

type GuestSearchItem = {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | string[];
  email?: string | string[];
  loyalty?:
  | string
  | {
    tier?: string;
    points?: number;
    totalStays?: number;
    totalNights?: number;
    totalSpend?: number;
    membershipId?: string;
    memberSince?: string;
  };
};

type ConversationStatus = 'open' | 'pending_staff' | 'resolved' | 'closed';
type Priority = 'low' | 'normal' | 'high' | 'urgent';
type MessageRole = 'guest' | 'staff' | 'bot';
type MessageType = 'text' | 'actionresult' | 'image';
type ActionType =
  | 'restaurantorder'
  | 'housekeeping'
  | 'maintenance'
  | 'folio'
  | 'checkout'
  | 'stayextension'
  | 'escalation';
type StatusBadge = 'pending' | 'preparing' | 'ready' | 'delivered';

type StaffConversationListItem = {
  _id: string;
  roomNumber?: string;
  status: ConversationStatus;
  priority?: Priority;
  subject?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCountStaff?: number;
  unreadCountGuest?: number;
  humanHandoverRequired?: boolean;
  guestId?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    phone?: string | string[];
    email?: string | string[];
    loyalty?:
    | string
    | {
      tier?: string;
      points?: number;
      totalStays?: number;
      totalNights?: number;
      totalSpend?: number;
      membershipId?: string;
      memberSince?: string;
    };
  };
  assignedStaffId?: {
    _id?: string;
    name?: string;
    role?: string;
  };
  reservationId?: string | { _id?: string };
  tags?: string[];
};

type ActionResult = {
  type: ActionType;
  items?: string[];
  summary?: string;
  issueTitle?: string;
  total?: number | string;
  newCheckout?: string;
  amount?: number | string;
  paymentLink?: string;
  status?: StatusBadge;
};

type StaffMessage = {
  _id?: string;
  id?: string;
  conversationId?: string;
  senderType: MessageRole;
  senderName?: string;
  text?: string;
  messageType?: MessageType;
  actionResult?: ActionResult;
  imageUrl?: string;
  mediaUrl?: string;
  thumbUrl?: string;
  imageName?: string;
  createdAt?: string;
  status?: string;
};

type ConversationDetail = {
  conversation: StaffConversationListItem;
  messages: StaffMessage[];
};

type StatsPayload = {
  open: number;
  pendingStaff: number;
  humanRequired?: number;
  resolved?: number;
  totalUnreadMessages: number;
};

type ServiceItem = {
  id: string;
  roomNumber: string;
  guestName: string;
  type: ActionType;
  label: string;
  status: StatusBadge | 'resolved';
  summary?: string;
  amount?: number | string;
  createdAt: string;
  assignee?: string;
  etaLabel?: string;
  priority?: Priority;
};

const MELON = '#F97316';
const CORAL = '#F43F5E';
const AMBER = '#F59E0B';
const TEAL = '#0D9488';
const VIOLET = '#7C3AED';
const INDIGO = '#4F46E5';
const SKY = '#0284C7';
const SAGE = '#16A34A';
const BG = '#FFFBF7';
const PANEL = '#FFF7EF';
const SURFACE = '#FFFFFF';
const BORDER = '#F0E4D8';
const BORDER_MID = '#E5CDB8';
const TEXT = '#1C0A02';
const TEXT_SUB = '#6B4535';
const TEXT_MUTED = '#A8836C';

const GRADIENT_PRIMARY = `linear-gradient(135deg, ${MELON} 0%, ${CORAL} 100%)`;
const GRADIENT_SOFT = 'linear-gradient(135deg, #FFF3E6 0%, #FFE4EA 100%)';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'restaurantorder', label: 'Room Service' },
  { key: 'housekeeping', label: 'Housekeeping' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'checkout', label: 'Checkout' },
  { key: 'stayextension', label: 'Extension' },
  { key: 'escalation', label: 'Escalation' },
] as const;

const QUICK_REPLIES = [
  'Namaste sir/ma’am, we are checking this right away.',
  'Your request has been assigned and our team is on the way.',
  'Kitchen is preparing your order. ETA 20 minutes.',
  'Housekeeping will reach your room in 15 minutes.',
  'Engineer has been informed and will visit shortly.',
  'Front desk is reviewing your checkout / extension request.',
];

const ACTION_META: Record<
  ActionType,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  restaurantorder: {
    label: 'Room Service',
    color: AMBER,
    bg: '#FFFBEB',
    border: '#FDE68A',
    icon: UtensilsCrossed,
  },
  housekeeping: {
    label: 'Housekeeping',
    color: TEAL,
    bg: '#F0FDFA',
    border: '#99F6E4',
    icon: House,
  },
  maintenance: {
    label: 'Maintenance',
    color: VIOLET,
    bg: '#F5F3FF',
    border: '#DDD6FE',
    icon: Wrench,
  },
  folio: {
    label: 'Folio / Bill',
    color: MELON,
    bg: '#FFF7ED',
    border: '#FED7AA',
    icon: ReceiptText,
  },
  checkout: {
    label: 'Checkout',
    color: CORAL,
    bg: '#FFF1F2',
    border: '#FECDD3',
    icon: LogOut,
  },
  stayextension: {
    label: 'Stay Extension',
    color: SKY,
    bg: '#F0F9FF',
    border: '#BAE6FD',
    icon: CalendarClock,
  },
  escalation: {
    label: 'Escalation',
    color: SAGE,
    bg: '#F0FDF4',
    border: '#86EFAC',
    icon: ShieldAlert,
  },
};

const STATUS_META: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pending: { label: 'Pending', bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  preparing: { label: 'Preparing', bg: '#F0FDFA', color: '#134E4A', border: '#99F6E4' },
  ready: { label: 'Ready', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  delivered: { label: 'Delivered', bg: '#F0FDF4', color: '#14532D', border: '#86EFAC' },
  resolved: { label: 'Resolved', bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
};

const PRIORITY_META: Record<
  Priority,
  { label: string; bg: string; color: string; border: string }
> = {
  low: { label: 'Low', bg: '#F9FAFB', color: '#4B5563', border: '#E5E7EB' },
  normal: { label: 'Normal', bg: '#FFF7ED', color: '#9A3412', border: '#FED7AA' },
  high: { label: 'High', bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
  urgent: { label: 'Urgent', bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
};

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

function normalizeText(value: unknown) {
  return String(value ?? '').toLowerCase().trim();
}

function normalizeRoomNo(value: unknown) {
  return String(value ?? '').replace(/\s+/g, '').trim();
}

function fullGuestName(guest?: StaffConversationListItem['guestId']) {
  const name = [guest?.firstName, guest?.lastName].filter(Boolean).join(' ').trim();
  return name || 'Guest';
}

function getGuestPhoneText(phone?: string | string[]) {
  return Array.isArray(phone) ? phone.join(' ') : phone || '';
}

function getGuestEmailText(email?: string | string[]) {
  return Array.isArray(email) ? email.join(' ') : email || '';
}

function getLoyaltyText(
  loyalty?:
    | string
    | {
      tier?: string;
      points?: number;
      totalStays?: number;
      totalNights?: number;
      totalSpend?: number;
      membershipId?: string;
      memberSince?: string;
    }
) {
  if (!loyalty) return '';
  if (typeof loyalty === 'string') return loyalty;
  return [
    loyalty.tier,
    loyalty.membershipId,
    loyalty.points,
    loyalty.totalStays,
    loyalty.totalNights,
    loyalty.totalSpend,
  ]
    .filter((v) => v !== undefined && v !== null && v !== '')
    .join(' ');
}

function getReservationId(reservationId?: string | { _id?: string }) {
  if (!reservationId) return null;
  if (typeof reservationId === 'string') return reservationId;
  return reservationId._id || null;
}

function deriveServiceItems(
  conversation?: StaffConversationListItem,
  messages: StaffMessage[] = []
): ServiceItem[] {
  if (!conversation) return [];

  return messages
    .filter((m) => m.actionResult?.type)
    .map((m, idx) => {
      const a = m.actionResult!;
      return {
        id: m._id || m.id || `${conversation._id}-${idx}`,
        roomNumber: conversation.roomNumber || '--',
        guestName: fullGuestName(conversation.guestId),
        type: a.type,
        label: ACTION_META[a.type].label,
        status: (a.status as StatusBadge) || 'pending',
        summary:
          a.summary ||
          a.issueTitle ||
          (a.items?.length ? a.items.join(', ') : undefined) ||
          (a.total ? `Folio ₹${a.total}` : undefined) ||
          (a.amount ? `Amount ₹${a.amount}` : undefined),
        amount: a.amount || a.total,
        createdAt: m.createdAt || new Date().toISOString(),
        assignee: conversation.assignedStaffId?.name || 'Unassigned',
        etaLabel:
          a.type === 'restaurantorder'
            ? 'ETA 20–25 min'
            : a.type === 'housekeeping'
              ? 'ETA 15–30 min'
              : a.type === 'maintenance'
                ? 'ETA 30 min'
                : a.type === 'checkout'
                  ? 'Front desk in 10 min'
                  : a.type === 'stayextension'
                    ? 'Approval in 15 min'
                    : undefined,
        priority: conversation.priority || 'normal',
      };
    })
    .reverse();
}

function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return <Loader2 className={cn(className, 'animate-spin')} />;
}

function Pill({
  children,
  bg,
  color,
  border,
}: {
  children: React.ReactNode;
  bg: string;
  color: string;
  border: string;
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
      style={{ background: bg, color, border: `1px solid ${border}` }}
    >
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
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  tint: string;
  bg: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-4"
      style={{
        background: highlight ? GRADIENT_PRIMARY : SURFACE,
        border: highlight ? 'none' : `1.5px solid ${BORDER}`,
        boxShadow: highlight
          ? '0 12px 30px rgba(249,115,22,0.22)'
          : '0 4px 20px rgba(249,115,22,0.06)',
      }}
    >
      <div
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl"
        style={{
          background: highlight ? 'rgba(255,255,255,0.18)' : bg,
          color: highlight ? '#fff' : tint,
        }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-bold" style={{ color: highlight ? '#fff' : TEXT }}>
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </div>
      <p
        className="mt-1 text-xs font-semibold"
        style={{ color: highlight ? 'rgba(255,255,255,0.84)' : TEXT_MUTED }}
      >
        {label}
      </p>
    </motion.div>
  );
}

function StaffOrderCardBubble({ action }: { action: ActionResult }) {
  const actionMeta = action.type ? ACTION_META[action.type] : null;
  const statusMeta = action.status ? STATUS_META[action.status] : null;
  const items = action.items || [];
  const hasAmount = !!(action.total || action.amount);
  const ActionIcon = actionMeta?.icon;

  return (
    <div
      className="overflow-hidden rounded-[22px] border"
      style={{
        background: '#FFFFFF',
        borderColor: BORDER_MID,
        boxShadow: '0 8px 28px rgba(249,115,22,0.12)',
        maxWidth: 320,
        minWidth: 220,
      }}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-3"
        style={{
          background: actionMeta?.bg || '#FFF7ED',
          borderBottom: `1px solid ${actionMeta?.border || BORDER}`,
        }}
      >
        <div className="flex items-center gap-2.5">
          {ActionIcon ? (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: SURFACE,
                color: actionMeta?.color,
                border: `1px solid ${actionMeta?.border}`,
                boxShadow: `0 4px 10px ${(actionMeta?.color || MELON)}18`,
              }}
            >
              <ActionIcon className="h-4 w-4" />
            </div>
          ) : null}

          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ color: actionMeta?.color || MELON }}
            >
              {actionMeta?.label || 'Service'}
            </p>
            {items.length > 0 ? (
              <p className="text-[10px]" style={{ color: TEXT_MUTED }}>
                {items.length} item{items.length > 1 ? 's' : ''}
              </p>
            ) : null}
          </div>
        </div>

        {statusMeta ? (
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{
              background: statusMeta.bg,
              color: statusMeta.color,
              border: `1px solid ${statusMeta.border}`,
            }}
          >
            {statusMeta.label}
          </span>
        ) : null}
      </div>

      <div className="space-y-2 px-4 py-3">
        {items.length > 0 ? (
          <div className="space-y-1.5">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span
                  className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ background: actionMeta?.color || MELON }}
                />
                <span className="text-xs leading-5" style={{ color: TEXT_SUB }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {action.summary ? (
          <p className="text-xs leading-5" style={{ color: TEXT_SUB }}>
            {action.summary}
          </p>
        ) : null}

        {action.issueTitle ? (
          <p className="text-xs font-semibold" style={{ color: TEXT }}>
            {action.issueTitle}
          </p>
        ) : null}

        {action.newCheckout ? (
          <p className="text-xs" style={{ color: TEXT_SUB }}>
            New checkout:{' '}
            <span className="font-semibold" style={{ color: TEXT }}>
              {action.newCheckout}
            </span>
          </p>
        ) : null}

        {hasAmount ? <div className="h-px" style={{ background: BORDER }} /> : null}

        {hasAmount ? (
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold"
              style={{ background: '#FFF7ED', color: MELON, border: '1px solid #FED7AA' }}
            >
              <IndianRupee className="h-3.5 w-3.5" />
              <span className="text-sm">{action.total || action.amount}</span>
            </div>

            <span
              className="rounded-full px-3 py-1 text-[10px] font-bold text-white"
              style={{ background: GRADIENT_PRIMARY }}
            >
              Ordered ✓
            </span>
          </div>
        ) : null}

        {action.paymentLink ? (
          <a
            href={action.paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold underline"
            style={{ color: SKY }}
          >
            <LinkIcon className="h-3 w-3" />
            Payment link
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default function GuestOperationsPage() {
  const qc = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [search, setSearch] = useState('');
  const [guestSearch, setGuestSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [localMessages, setLocalMessages] = useState<StaffMessage[]>([]);
  const [assignStaffId, setAssignStaffId] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const prevMessageCountRef = useRef(0);

  const { data: statsData, refetch: refetchStats } = useQuery<StatsPayload>({
    queryKey: ['chatbot-stats'],
    queryFn: () => api.get('/api/chatbot/staff/stats').then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const {
    data: conversationsRes,
    isLoading: conversationsLoading,
    refetch: refetchConversations,
  } = useQuery<{ docs: StaffConversationListItem[]; total: number; page: number; limit: number }>({
    queryKey: ['chatbot-conversations'],
    queryFn: () =>
      api
        .get('/api/chatbot/staff/conversations', { params: { page: 1, limit: 100 } })
        .then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const conversations = conversationsRes?.docs || [];

  const { data: detailRes, isLoading: detailLoading, refetch: refetchDetail } =
    useQuery<ConversationDetail>({
      queryKey: ['chatbot-conversation-detail', selectedId],
      queryFn: () =>
        api.get(`/api/chatbot/staff/conversations/${selectedId}`).then((r) => r.data.data),
      enabled: !!selectedId,
      refetchInterval: 4000,
      refetchIntervalInBackground: false,
      staleTime: 2000,
    });

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: () => api.get('/api/rooms').then((r) => r.data.data?.docs || r.data.data || []),
    refetchInterval: 30000,
  });

  const { data: staffList = [] } = useQuery<
    Array<{ _id: string; name: string; role: string; department?: string }>
  >({
    queryKey: ['staff-all'],
    queryFn: async () => {
      const res = await api.get('/api/staff', { params: { limit: 100, isActive: true } });
      return res.data.data?.docs ?? [];
    },
    staleTime: 2 * 60_000,
  });

  const { data: guestResults = [], isLoading: guestSearchLoad } = useQuery<GuestSearchItem[]>({
    queryKey: ['guest-search-walkin', guestSearch],
    queryFn: () =>
      api
        .get('/api/guests', { params: { search: guestSearch, limit: 6 } })
        .then((r) => r.data.data?.docs || []),
    enabled: guestSearch.trim().length >= 2,
  });

  const selectedConversation = detailRes?.conversation;
  const selectedGuest = selectedConversation?.guestId;

  const selectedRoom = useMemo(() => {
    if (!selectedConversation?.roomNumber || !rooms.length) return null;
    const target = normalizeRoomNo(selectedConversation.roomNumber);
    return rooms.find((r) => normalizeRoomNo(r.roomNumber) === target) || null;
  }, [rooms, selectedConversation?.roomNumber]);

  const searchedGuests = useMemo(() => {
    return guestResults.map((g, index) => ({
      ...g,
      displayName: [g.firstName, g.lastName].filter(Boolean).join(' ').trim() || 'Guest',
      phoneText: Array.isArray(g.phone) ? g.phone[0] : g.phone || '--',
      emailText: Array.isArray(g.email) ? g.email[0] : g.email || '--',
      loyaltyLabel: typeof g.loyalty === 'string' ? g.loyalty : g.loyalty?.tier || null,
      guestKey: g._id || g.id || `${g.firstName || 'guest'}-${g.lastName || ''}-${index}`,
    }));
  }, [guestResults]);

  const roomSearchResults = useMemo(() => {
    const q = normalizeRoomNo(search);
    if (!q || !rooms.length) return [];
    return rooms.filter((r) => {
      const roomNo = normalizeRoomNo(r.roomNumber);
      const blob = [
        r.roomNumber,
        r.floor,
        r.roomType,
        r.status,
        r.occupancyStatus,
        r.housekeepingStatus,
      ]
        .filter(Boolean)
        .map(normalizeText)
        .join(' | ');
      return roomNo.includes(q) || blob.includes(normalizeText(search));
    });
  }, [rooms, search]);

  const selectedServices = useMemo(
    () => deriveServiceItems(selectedConversation, localMessages),
    [selectedConversation, localMessages]
  );

  const filteredConversations = useMemo(() => {
    const q = normalizeText(search);

    return conversations
      .map((c) => {
        const guest = c.guestId;
        const room = rooms.find(
          (r) => String(r.roomNumber).trim() === String(c.roomNumber || '').trim()
        );

        const guestName = fullGuestName(guest);
        const guestPhone = getGuestPhoneText(guest?.phone);
        const guestEmail = getGuestEmailText(guest?.email);
        const guestLoyalty = getLoyaltyText(guest?.loyalty as any);

        const haystack = [
          c.roomNumber,
          c.subject,
          c.status,
          c.priority,
          ...(c.tags || []),
          guestName,
          guestPhone,
          guestEmail,
          guestLoyalty,
          room?.roomNumber,
          room?.floor,
          room?.roomType,
          room?.status,
          room?.occupancyStatus,
          room?.housekeepingStatus,
        ]
          .filter(Boolean)
          .map(normalizeText)
          .join(' | ');

        let score = 0;

        if (!q) score = 1;
        else {
          if (normalizeText(c.roomNumber) === q) score += 120;
          if (normalizeText(guestName) === q) score += 110;
          if (normalizeText(guestPhone).includes(q)) score += 90;
          if (normalizeText(guestName).includes(q)) score += 80;
          if (normalizeText(c.subject).includes(q)) score += 70;
          if (normalizeText(room?.roomType).includes(q)) score += 40;
          if (normalizeText(room?.housekeepingStatus).includes(q)) score += 35;
          if (normalizeText(room?.status || room?.occupancyStatus).includes(q)) score += 35;
          if (haystack.includes(q)) score += 20;
        }

        if (activeFilter === 'unread' && (c.unreadCountStaff || 0) <= 0) score = 0;

        if (activeFilter !== 'all' && activeFilter !== 'unread') {
          const selectedMsgs = c._id === selectedId ? localMessages : [];
          const matchesAction =
            c._id === selectedId
              ? selectedMsgs.some((m) => m.actionResult?.type === activeFilter)
              : (c.tags || []).includes(activeFilter);
          if (!matchesAction) score = 0;
        }

        return { ...c, __score: score };
      })
      .filter((c: any) => c.__score > 0)
      .sort((a: any, b: any) => {
        if (b.__score !== a.__score) return b.__score - a.__score;
        return new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime();
      });
  }, [conversations, rooms, search, activeFilter, selectedId, localMessages]);

  const topStats = {
    open: statsData?.open || 0,
    unread: statsData?.totalUnreadMessages || 0,
    pending: statsData?.pendingStaff || 0,
    human: statsData?.humanRequired || 0,
    liveServices: selectedServices.filter((s) => s.status !== 'resolved' && s.status !== 'delivered')
      .length,
    roomService: selectedServices.filter((s) => s.type === 'restaurantorder').length,
  };

  useEffect(() => {
    if (!selectedId && conversations.length) {
      setSelectedId(conversations[0]._id);
    }
  }, [conversations, selectedId]);

  useEffect(() => {
    if (!detailRes?.messages) return;

    const incoming = detailRes.messages;
    const prevCount = prevMessageCountRef.current;
    const hasNew = incoming.length > prevCount;

    setLocalMessages((prev) => {
      const serverIds = new Set(incoming.map((m: any) => m._id || m.id));
      const optimistic = prev.filter((m) => !serverIds.has(m._id || m.id));
      return [...incoming, ...optimistic];
    });

    if (hasNew && prevCount > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    prevMessageCountRef.current = incoming.length;
  }, [detailRes]);

  useEffect(() => {
    setLocalMessages([]);
    prevMessageCountRef.current = 0;
  }, [selectedId]);

  const markReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const res = await api.patch(`/api/chatbot/staff/conversations/${conversationId}/read`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chatbot-conversations'] });
      qc.invalidateQueries({ queryKey: ['chatbot-stats'] });
    },
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({ text }: { text: string; tempId: string }) => {
      if (!selectedId || !text) return null;
      const res = await api.post(`/api/chatbot/staff/conversations/${selectedId}/reply`, { text });
      return res.data.data;
    },
    onSuccess: (data: StaffMessage | null, vars: { text: string; tempId: string }) => {
      toast.success('Reply sent');

      setLocalMessages((prev) => {
        if (!data) {
          return prev.filter((m) => (m._id || m.id) !== vars.tempId);
        }
        return prev.map((m) =>
          (m._id || m.id) === vars.tempId ? { ...data, status: 'sent' } : m
        );
      });

      qc.invalidateQueries({ queryKey: ['chatbot-conversations'] });
      qc.invalidateQueries({ queryKey: ['chatbot-stats'] });
      qc.invalidateQueries({ queryKey: ['chatbot-conversation-detail', selectedId] });
    },
    onError: (e: any, vars: { text: string; tempId: string }) => {
      setLocalMessages((prev) => prev.filter((m) => (m._id || m.id) !== vars.tempId));
      setReply((curr) => curr || vars.text);
      toast.error(e?.response?.data?.message || 'Failed to send reply');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: ConversationStatus) => {
      if (!selectedId) return null;
      const res = await api.patch(`/api/chatbot/staff/conversations/${selectedId}/status`, {
        status,
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Conversation status updated');
      qc.invalidateQueries({ queryKey: ['chatbot-conversations'] });
      qc.invalidateQueries({ queryKey: ['chatbot-conversation-detail', selectedId] });
      qc.invalidateQueries({ queryKey: ['chatbot-stats'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Status update failed'),
  });

  const assignConversationMutation = useMutation({
    mutationFn: async (staffId?: string | null) => {
      if (!selectedId) return null;

      const trimmed = staffId?.trim();
      const res = await api.patch(`/api/chatbot/staff/conversations/${selectedId}/assign`, {
        staffId: trimmed || null,
      });

      return res.data.data;
    },
    onSuccess: (data, staffId) => {
      toast.success(staffId ? 'Conversation assigned' : 'Conversation unassigned');
      setAssignStaffId('');

      qc.setQueryData(['chatbot-conversation-detail', selectedId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          conversation: {
            ...old.conversation,
            assignedStaffId: data?.assignedStaffId || null,
          },
        };
      });

      qc.setQueryData(['chatbot-conversations'], (old: any) => {
        if (!old?.docs) return old;
        return {
          ...old,
          docs: old.docs.map((c: any) =>
            c._id === selectedId
              ? {
                ...c,
                assignedStaffId: data?.assignedStaffId || null,
              }
              : c
          ),
        };
      });

      qc.invalidateQueries({ queryKey: ['chatbot-conversations'] });
      qc.invalidateQueries({ queryKey: ['chatbot-conversation-detail', selectedId] });
      qc.invalidateQueries({ queryKey: ['chatbot-stats'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Assignment failed'),
  });

  const generateLinkMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      const res = await api.post(`/api/reservations/${reservationId}/resend-chat-link`);
      return res.data.data;
    },
    onSuccess: async (data) => {
      if (data?.chatLink) {
        await navigator.clipboard.writeText(data.chatLink);
        toast.success(
          data.whatsappSent
            ? 'Chat link sent via WhatsApp & copied!'
            : 'Guest chat link copied to clipboard'
        );
      }
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Link generation failed'),
  });

  const handleSendReply = () => {
    const text = reply.trim();
    if (!text || !selectedId || sendReplyMutation.isPending) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: StaffMessage = {
      id: tempId,
      conversationId: selectedId,
      senderType: 'staff',
      senderName: 'Staff',
      text,
      messageType: 'text',
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    setReply('');
    setLocalMessages((prev) => [...prev, optimisticMessage]);
    sendReplyMutation.mutate({ text, tempId });
  };

  useEffect(() => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const socket = io(baseURL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('staff:join', { tenantId: 'current-tenant' });
    });

    socket.on('disconnect', () => setSocketConnected(false));

    socket.on('chat:new_message', (payload: any) => {
      qc.invalidateQueries({ queryKey: ['chatbot-conversations'] });
      qc.invalidateQueries({ queryKey: ['chatbot-stats'] });

      if (payload?.conversationId === selectedId) {
        setLocalMessages((prev) => {
          const exists = prev.some((m) => (m.id || m._id) === (payload.id || payload._id));
          if (exists) return prev;

          const withoutDuplicateTemp = prev.filter(
            (m) =>
              !(
                m.status === 'sending' &&
                m.senderType === 'staff' &&
                normalizeText(m.text) === normalizeText(payload.text)
              )
          );

          return [...withoutDuplicateTemp, payload];
        });

        qc.invalidateQueries({ queryKey: ['chatbot-conversation-detail', selectedId] });
      } else {
        toast.success('New guest message received');
      }
    });

    socket.on('chat:conversation_updated', (payload: any) => {
      qc.invalidateQueries({ queryKey: ['chatbot-conversations'] });
      qc.invalidateQueries({ queryKey: ['chatbot-stats'] });

      if (payload?.conversationId === selectedId) {
        qc.invalidateQueries({ queryKey: ['chatbot-conversation-detail', selectedId] });
      }
    });

    socket.on('chat:conversation_closed', (payload: any) => {
      qc.invalidateQueries({ queryKey: ['chatbot-conversations'] });
      qc.invalidateQueries({ queryKey: ['chatbot-stats'] });

      if (payload?.conversationId === selectedId) {
        qc.invalidateQueries({ queryKey: ['chatbot-conversation-detail', selectedId] });
        toast('Conversation closed by staff');
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [qc, selectedId]);

  useEffect(() => {
    if (!socketRef.current?.connected || !selectedId) return;
    socketRef.current.emit('chat:join-conversation', { conversationId: selectedId });
    markReadMutation.mutate(selectedId);
  }, [selectedId, socketConnected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, chatOpen, chatMinimized]);
  const visibleMessages = localMessages.filter((m) => {
    const hasText = !!String(m.text || '').trim();
    const hasImage = (m.messageType === 'image' || !!m.imageUrl || !!m.mediaUrl) && !!(m.imageUrl || m.mediaUrl);
    const hasAction = !!m.actionResult?.type;
    return hasText || hasImage || hasAction;
  });
  return (
    <DashboardLayout title="Guest Operations">
      <div className="mx-auto max-w-[1700px] space-y-5" style={{ color: TEXT }}>
        <div
          className="relative overflow-hidden rounded-[28px] p-6"
          style={{
            background:
              'linear-gradient(135deg, rgba(249,115,22,0.10) 0%, rgba(244,63,94,0.08) 55%, rgba(236,72,153,0.06) 100%)',
            border: '1.5px solid rgba(249,115,22,0.16)',
            boxShadow: '0 10px 32px rgba(249,115,22,0.10)',
          }}
        >
          <div
            className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full blur-3xl"
            style={{ background: 'rgba(249,115,22,0.18)' }}
          />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                  style={{
                    background: GRADIENT_PRIMARY,
                    boxShadow: '0 8px 24px rgba(249,115,22,0.28)',
                  }}
                >
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight" style={{ color: TEXT }}>
                    Staff Guest Operations Desk
                  </h1>
                  <p className="text-sm" style={{ color: TEXT_SUB }}>
                    Chat, room service, housekeeping, maintenance, checkout, extension and guest
                    records on one screen.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Pill
                  bg={socketConnected ? '#ECFDF5' : '#F9FAFB'}
                  color={socketConnected ? '#047857' : '#6B7280'}
                  border={socketConnected ? '#A7F3D0' : '#E5E7EB'}
                >
                  <CircleDot className="mr-1.5 h-3 w-3" />
                  {socketConnected ? 'Live sockets connected' : 'Socket reconnecting'}
                </Pill>
                <Pill bg="#FFF7ED" color="#9A3412" border="#FED7AA">
                  Indian hotel ops view
                </Pill>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  refetchConversations();
                  refetchDetail();
                  refetchStats();
                }}
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all"
                style={{
                  background: SURFACE,
                  color: TEXT_SUB,
                  border: `1.5px solid ${BORDER_MID}`,
                  boxShadow: '0 4px 14px rgba(249,115,22,0.08)',
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>

              <button
                onClick={() => {
                  setChatOpen(true);
                  setChatMinimized(false);
                }}
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-white"
                style={{
                  background: GRADIENT_PRIMARY,
                  boxShadow: '0 8px 22px rgba(249,115,22,0.30)',
                }}
              >
                <Bell className="h-4 w-4" />
                Open Chat Desk
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <StatCard icon={MessageSquare} label="Open chats" value={topStats.open} tint={MELON} bg="#FFF7ED" />
          <StatCard
            icon={Bell}
            label="Unread messages"
            value={topStats.unread}
            tint={CORAL}
            bg="#FFF1F2"
            highlight
          />
          <StatCard icon={Clock3} label="Pending staff" value={topStats.pending} tint={AMBER} bg="#FFFBEB" />
          <StatCard icon={Sparkles} label="Human handover" value={topStats.human} tint={SAGE} bg="#F0FDF4" />
          <StatCard icon={HandPlatter} label="Live services" value={topStats.liveServices} tint={TEAL} bg="#F0FDFA" />
          <StatCard
            icon={UtensilsCrossed}
            label="Room service in room"
            value={topStats.roomService}
            tint={INDIGO}
            bg="#EEF2FF"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside
            className="min-h-[78vh] overflow-hidden rounded-[28px]"
            style={{
              background: PANEL,
              border: `1.5px solid ${BORDER}`,
              boxShadow: '0 8px 28px rgba(249,115,22,0.07)',
            }}
          >
            <div className="border-b px-4 py-4" style={{ borderColor: BORDER }}>
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-2xl"
                  style={{ background: GRADIENT_SOFT, color: MELON }}
                >
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: TEXT }}>
                    Conversations
                  </p>
                  <p className="text-xs" style={{ color: TEXT_MUTED }}>
                    Room-wise live guest desk
                  </p>
                </div>
              </div>

              <div
                className="rounded-[24px] p-3"
                style={{
                  background: SURFACE,
                  border: `1.5px solid ${BORDER_MID}`,
                  boxShadow: '0 6px 18px rgba(249,115,22,0.08)',
                }}
              >
                <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5" style={{ background: PANEL }}>
                  <Search className="h-4 w-4 flex-shrink-0" style={{ color: MELON }} />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setGuestSearch(e.target.value);
                    }}
                    placeholder="Search room, guest, phone, room type..."
                    className="w-full bg-transparent text-sm outline-none"
                    style={{ color: TEXT }}
                  />
                  {search ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setGuestSearch('');
                      }}
                      className="rounded-full px-2 py-1 text-[11px] font-bold"
                      style={{ color: CORAL, background: '#FFF1F2' }}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {['204', 'deluxe', 'dirty', 'checkout', 'gold', 'housekeeping'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setSearch(chip);
                        setGuestSearch(chip);
                      }}
                      className="rounded-full px-3 py-1.5 text-[11px] font-bold"
                      style={{
                        background: '#FFF7ED',
                        color: '#9A3412',
                        border: '1px solid #FED7AA',
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {FILTERS.map((f) => {
                  const active = activeFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setActiveFilter(f.key)}
                      className="whitespace-nowrap rounded-full px-3 py-2 text-[11px] font-bold transition-all"
                      style={{
                        background: active ? GRADIENT_SOFT : SURFACE,
                        color: active ? CORAL : TEXT_SUB,
                        border: active ? '1.5px solid rgba(249,115,22,0.35)' : `1.5px solid ${BORDER}`,
                        boxShadow: active ? '0 4px 12px rgba(249,115,22,0.12)' : 'none',
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-h-[calc(78vh-155px)] space-y-3 overflow-y-auto p-2">
              {search.trim().length >= 2 ? (
                <div
                  className="rounded-[24px] p-4"
                  style={{
                    background: SURFACE,
                    border: `1.5px solid ${BORDER}`,
                    boxShadow: '0 6px 20px rgba(249,115,22,0.06)',
                  }}
                >
                  <div className="mb-3">
                    <p className="text-sm font-bold" style={{ color: TEXT }}>
                      Search matches
                    </p>
                    <p className="text-xs" style={{ color: TEXT_MUTED }}>
                      Rooms and guests matching “{search.trim()}”
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p
                        className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em]"
                        style={{ color: TEXT_MUTED }}
                      >
                        Matching rooms
                      </p>

                      {roomSearchResults.length ? (
                        <div className="space-y-2">
                          {roomSearchResults.slice(0, 3).map((r) => (
                            <button
                              key={r._id || r.id || r.roomNumber}
                              type="button"
                              onClick={() => {
                                setSearch(String(r.roomNumber));
                                const match = conversations.find(
                                  (c) => String(c.roomNumber).trim() === String(r.roomNumber).trim()
                                );
                                if (match) {
                                  setSelectedId(match._id);
                                  setChatOpen(true);
                                  setChatMinimized(false);
                                }
                              }}
                              className="w-full rounded-2xl p-3 text-left transition-all"
                              style={{ background: PANEL, border: `1px solid ${BORDER}` }}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-bold" style={{ color: TEXT }}>
                                    Room {r.roomNumber}
                                  </p>
                                  <p className="truncate text-xs" style={{ color: TEXT_SUB }}>
                                    {r.roomType || '--'} • Floor {r.floor || '--'}
                                  </p>
                                </div>

                                <Pill bg="#F0FDFA" color="#115E59" border="#99F6E4">
                                  {r.housekeepingStatus || r.status || r.occupancyStatus || '--'}
                                </Pill>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs" style={{ color: TEXT_MUTED }}>
                          No room matches.
                        </p>
                      )}
                    </div>

                    <div>
                      <p
                        className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em]"
                        style={{ color: TEXT_MUTED }}
                      >
                        Matching guests
                      </p>

                      {searchedGuests.length ? (
                        <div className="space-y-2">
                          {searchedGuests.slice(0, 3).map((g) => (
                            <div
                              key={g.guestKey}
                              className="rounded-2xl p-3"
                              style={{ background: PANEL, border: `1px solid ${BORDER}` }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold" style={{ color: TEXT }}>
                                    {g.displayName}
                                  </p>
                                  <p className="truncate text-xs" style={{ color: TEXT_SUB }}>
                                    {g.phoneText}
                                  </p>
                                  <p className="truncate text-xs" style={{ color: TEXT_MUTED }}>
                                    {g.emailText}
                                  </p>
                                </div>

                                {typeof g.loyalty === 'object' && g.loyalty?.tier ? (
                                  <div className="flex flex-col items-end gap-1">
                                    <Pill bg="#EEF2FF" color="#4338CA" border="#C7D2FE">
                                      {g.loyalty.tier}
                                    </Pill>
                                    {typeof g.loyalty.points === 'number' ? (
                                      <span className="text-[11px] font-semibold" style={{ color: TEXT_MUTED }}>
                                        {g.loyalty.points.toLocaleString('en-IN')} pts
                                      </span>
                                    ) : null}
                                  </div>
                                ) : typeof g.loyalty === 'string' ? (
                                  <Pill bg="#EEF2FF" color="#4338CA" border="#C7D2FE">
                                    {g.loyalty}
                                  </Pill>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : guestSearchLoad ? (
                        <div className="flex justify-center py-3">
                          <Spinner className="h-5 w-5" />
                        </div>
                      ) : (
                        <p className="text-xs" style={{ color: TEXT_MUTED }}>
                          No guest matches.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {conversationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : !filteredConversations.length ? (
                <div className="px-4 py-14 text-center">
                  <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl"
                    style={{ background: GRADIENT_SOFT, color: MELON }}
                  >
                    <Search className="h-6 w-6" />
                  </div>
                  <p className="font-semibold" style={{ color: TEXT }}>
                    No conversations found
                  </p>
                  <p className="mt-1 text-sm" style={{ color: TEXT_MUTED }}>
                    Try another filter or search term.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredConversations.map((c: any) => {
                    const selected = c._id === selectedId;
                    const guest = fullGuestName(c.guestId);
                    const unread = c.unreadCountStaff || 0;
                    const priority = PRIORITY_META[(c.priority || 'normal') as Priority];

                    return (
                      <button
                        key={c._id}
                        onClick={() => {
                          setSelectedId(c._id);
                          setChatOpen(true);
                          setChatMinimized(false);
                        }}
                        className="w-full rounded-[24px] p-3 text-left transition-all"
                        style={{
                          background: selected ? SURFACE : 'rgba(255,255,255,0.62)',
                          border: selected ? `1.5px solid ${BORDER_MID}` : '1.5px solid transparent',
                          boxShadow: selected ? '0 8px 24px rgba(249,115,22,0.10)' : 'none',
                        }}
                      >
                        <div className="mb-2 flex items-start gap-3">
                          <div
                            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
                            style={{ background: GRADIENT_PRIMARY }}
                          >
                            {c.roomNumber || guest.charAt(0)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-bold" style={{ color: TEXT }}>
                                Room {c.roomNumber || '--'}
                              </p>
                              {unread > 0 ? (
                                <span
                                  className="inline-flex min-w-[22px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                                  style={{ background: GRADIENT_PRIMARY }}
                                >
                                  {unread}
                                </span>
                              ) : null}
                            </div>
                            <p className="truncate text-xs" style={{ color: TEXT_SUB }}>
                              {guest}
                            </p>
                            <p className="mt-1 truncate text-[11px]" style={{ color: TEXT_MUTED }}>
                              {c.lastMessagePreview || 'No preview'}
                            </p>
                          </div>

                          <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: TEXT_MUTED }} />
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <Pill bg={priority.bg} color={priority.color} border={priority.border}>
                            {priority.label}
                          </Pill>

                          {c.humanHandoverRequired ? (
                            <Pill bg="#F0FDF4" color="#166534" border="#BBF7D0">
                              Handover
                            </Pill>
                          ) : null}

                          <Pill
                            bg={c.status === 'resolved' ? '#F0FDF4' : '#FFF7ED'}
                            color={c.status === 'resolved' ? '#166534' : '#9A3412'}
                            border={c.status === 'resolved' ? '#BBF7D0' : '#FED7AA'}
                          >
                            {String(c.status).replace('_', ' ')}
                          </Pill>
                        </div>

                        <div
                          className="mt-2 flex items-center justify-between text-[11px] font-medium"
                          style={{ color: TEXT_MUTED }}
                        >
                          <span>{c.assignedStaffId?.name || 'Unassigned'}</span>
                          <span>{fmtTime(c.lastMessageAt)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          <div className="space-y-4">
            {selectedConversation ? (
              <div
                className="rounded-[28px] p-5"
                style={{
                  background: SURFACE,
                  border: `1.5px solid ${BORDER}`,
                  boxShadow: '0 8px 28px rgba(249,115,22,0.07)',
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-[18px] text-base font-bold text-white"
                      style={{ background: GRADIENT_PRIMARY }}
                    >
                      {selectedConversation.roomNumber || fullGuestName(selectedGuest).charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-sm font-bold" style={{ color: TEXT }}>
                          Room {selectedConversation.roomNumber || '--'}
                        </h2>

                        <Pill
                          bg={selectedConversation.status === 'resolved' ? '#F0FDF4' : '#FFF7ED'}
                          color={selectedConversation.status === 'resolved' ? '#166534' : '#9A3412'}
                          border={selectedConversation.status === 'resolved' ? '#BBF7D0' : '#FED7AA'}
                        >
                          {selectedConversation.status.replace('_', ' ')}
                        </Pill>
                      </div>

                      <p className="truncate text-sm font-bold" style={{ color: TEXT_SUB }}>
                        {fullGuestName(selectedGuest)}
                      </p>

                      <p className="truncate text-[11px]" style={{ color: TEXT_MUTED }}>
                        Guest · {selectedConversation.assignedStaffId?.name || 'Unassigned'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setChatOpen(true);
                      setChatMinimized(false);
                    }}
                    className="rounded-2xl px-4 py-2.5 text-sm font-bold text-white"
                    style={{
                      background: GRADIENT_PRIMARY,
                      boxShadow: '0 8px 22px rgba(249,115,22,0.25)',
                    }}
                  >
                    Open Chat Window
                  </button>
                </div>
              </div>
            ) : null}

            <div
              className="overflow-hidden rounded-[28px]"
              style={{
                background: SURFACE,
                border: `1.5px solid ${BORDER}`,
                boxShadow: '0 8px 28px rgba(249,115,22,0.07)',
              }}
            >
              <div className="border-b px-4 py-4" style={{ borderColor: BORDER }}>
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-2xl"
                    style={{ background: GRADIENT_SOFT, color: MELON }}
                  >
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: TEXT }}>
                      Service Tracker
                    </p>
                    <p className="text-xs" style={{ color: TEXT_MUTED }}>
                      Orders, requests and live room ops
                    </p>
                  </div>
                </div>
              </div>

              <div className="max-h-[360px] space-y-3 overflow-y-auto p-4">
                {!selectedServices.length ? (
                  <div className="rounded-2xl border p-4 text-center" style={{ borderColor: BORDER, background: BG }}>
                    <p className="text-sm font-semibold" style={{ color: TEXT }}>
                      No tracked services yet
                    </p>
                    <p className="mt-1 text-xs" style={{ color: TEXT_MUTED }}>
                      Structured guest requests from chat will appear here.
                    </p>
                  </div>
                ) : (
                  selectedServices.map((item) => {
                    const meta = ACTION_META[item.type];
                    const st = STATUS_META[item.status] || STATUS_META.pending;
                    const Icon = meta.icon;

                    return (
                      <div
                        key={item.id}
                        className="rounded-[24px] p-3.5"
                        style={{
                          background: meta.bg,
                          border: `1.5px solid ${meta.border}`,
                          boxShadow: `0 6px 18px ${meta.color}12`,
                        }}
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <div
                              className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl"
                              style={{ background: SURFACE, color: meta.color }}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold" style={{ color: TEXT }}>
                                {meta.label}
                              </p>
                              <p className="text-xs" style={{ color: TEXT_SUB }}>
                                Room {item.roomNumber} • {item.guestName}
                              </p>
                            </div>
                          </div>

                          <Pill bg={st.bg} color={st.color} border={st.border}>
                            {st.label}
                          </Pill>
                        </div>

                        {item.summary ? (
                          <p className="text-xs leading-5" style={{ color: TEXT_SUB }}>
                            {item.summary}
                          </p>
                        ) : null}

                        <div
                          className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium"
                          style={{ color: TEXT_MUTED }}
                        >
                          <span>{fmtDateTime(item.createdAt)}</span>
                          <span>•</span>
                          <span>{item.assignee}</span>
                          {item.etaLabel ? (
                            <>
                              <span>•</span>
                              <span>{item.etaLabel}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div
              className="overflow-hidden rounded-[28px]"
              style={{
                background: SURFACE,
                border: `1.5px solid ${BORDER}`,
                boxShadow: '0 8px 28px rgba(249,115,22,0.07)',
              }}
            >
              <div className="border-b px-4 py-4" style={{ borderColor: BORDER }}>
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-2xl"
                    style={{ background: GRADIENT_SOFT, color: MELON }}
                  >
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: TEXT }}>
                      Guest Record
                    </p>
                    <p className="text-xs" style={{ color: TEXT_MUTED }}>
                      Quick context for staff action
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4">
                {!selectedConversation ? (
                  <p className="text-sm" style={{ color: TEXT_MUTED }}>
                    Select a room to view guest details.
                  </p>
                ) : (
                  <>
                    <div className="rounded-[24px] p-4" style={{ background: BG, border: `1.5px solid ${BORDER}` }}>
                      <div className="mb-3 flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-[20px] text-base font-bold text-white"
                          style={{ background: GRADIENT_PRIMARY }}
                        >
                          {selectedConversation.roomNumber || fullGuestName(selectedGuest).charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold" style={{ color: TEXT }}>
                            {fullGuestName(selectedGuest)}
                          </p>
                          <p className="text-xs" style={{ color: TEXT_SUB }}>
                            Room {selectedConversation.roomNumber || '--'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p style={{ color: TEXT_MUTED }}>Phone</p>
                          <p className="font-semibold" style={{ color: TEXT }}>
                            {Array.isArray(selectedGuest?.phone)
                              ? selectedGuest?.phone?.[0] || '--'
                              : selectedGuest?.phone || '--'}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: TEXT_MUTED }}>Loyalty</p>
                          <p className="font-semibold" style={{ color: TEXT }}>
                            {typeof selectedGuest?.loyalty === 'string'
                              ? selectedGuest.loyalty
                              : selectedGuest?.loyalty?.tier || 'Regular'}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: TEXT_MUTED }}>Conversation</p>
                          <p className="font-semibold capitalize" style={{ color: TEXT }}>
                            {selectedConversation.status.replace('_', ' ')}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: TEXT_MUTED }}>Assigned</p>
                          <p className="font-semibold" style={{ color: TEXT }}>
                            {selectedConversation.assignedStaffId?.name || 'Unassigned'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className="rounded-[24px] p-4"
                      style={{ background: SURFACE, border: `1.5px solid ${BORDER}` }}
                    >
                      <p
                        className="mb-3 text-xs font-bold uppercase tracking-[0.16em]"
                        style={{ color: TEXT_MUTED }}
                      >
                        Room details
                      </p>
                      <div className="space-y-2.5 text-sm">
                        <div className="flex items-center justify-between">
                          <span style={{ color: TEXT_MUTED }}>Room type</span>
                          <span className="font-semibold" style={{ color: TEXT }}>
                            {selectedRoom?.roomType || '--'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span style={{ color: TEXT_MUTED }}>Floor</span>
                          <span className="font-semibold" style={{ color: TEXT }}>
                            {selectedRoom?.floor || '--'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span style={{ color: TEXT_MUTED }}>Housekeeping</span>
                          <span className="font-semibold" style={{ color: TEXT }}>
                            {selectedRoom?.housekeepingStatus || '--'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span style={{ color: TEXT_MUTED }}>Occupancy</span>
                          <span className="font-semibold" style={{ color: TEXT }}>
                            {selectedRoom?.occupancyStatus || selectedRoom?.status || '--'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className="rounded-[24px] p-4"
                      style={{ background: SURFACE, border: `1.5px solid ${BORDER}` }}
                    >
                      <p
                        className="mb-3 text-xs font-bold uppercase tracking-[0.16em]"
                        style={{ color: TEXT_MUTED }}
                      >
                        Assignment
                      </p>

                      {selectedConversation.assignedStaffId ? (
                        <div
                          className="mb-3 flex items-center gap-2 rounded-2xl px-3 py-2"
                          style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0' }}
                        >
                          <div
                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ background: 'linear-gradient(135deg, #0D9488, #16A34A)' }}
                          >
                            {selectedConversation.assignedStaffId.name?.charAt(0) ?? 'S'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold" style={{ color: '#166534' }}>
                              {selectedConversation.assignedStaffId.name}
                            </p>
                            <p className="text-[10px]" style={{ color: '#16A34A' }}>
                              Currently assigned
                            </p>
                          </div>
                          <button
                            onClick={() => assignConversationMutation.mutate(null)}
                            className="flex-shrink-0 rounded-full p-1"
                            style={{ color: '#16A34A' }}
                            title="Unassign"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : null}

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <select
                            value={assignStaffId}
                            onChange={(e) => setAssignStaffId(e.target.value)}
                            className="w-full appearance-none rounded-2xl px-3 py-2 pr-8 text-xs outline-none"
                            style={{
                              background: BG,
                              color: assignStaffId ? TEXT : TEXT_MUTED,
                              border: `1.5px solid ${BORDER_MID}`,
                              cursor: 'pointer',
                            }}
                          >
                            <option value="">Select staff member...</option>
                            {staffList.map((s) => (
                              <option key={s._id} value={s._id}>
                                {s.name}
                                {s.department ? ` · ${s.department}` : ''}
                                {` (${s.role})`}
                              </option>
                            ))}
                          </select>

                          <div
                            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
                            style={{ color: TEXT_MUTED }}
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (!assignStaffId) return;
                            assignConversationMutation.mutate(assignStaffId);
                          }}
                          disabled={!assignStaffId || assignConversationMutation.isPending}
                          className="rounded-2xl px-3 py-2 text-xs font-bold transition-all disabled:opacity-40"
                          style={{
                            background: assignStaffId ? 'linear-gradient(135deg, #0D9488, #16A34A)' : '#F0FDFA',
                            color: assignStaffId ? '#fff' : '#115E59',
                            border: '1.5px solid #99F6E4',
                            boxShadow: assignStaffId ? '0 4px 12px rgba(13,148,136,0.25)' : 'none',
                          }}
                        >
                          {assignConversationMutation.isPending ? <Spinner className="h-3.5 w-3.5" /> : 'Assign'}
                        </button>
                      </div>
                    </div>

                    <div
                      className="rounded-[24px] p-4"
                      style={{ background: SURFACE, border: `1.5px solid ${BORDER}` }}
                    >
                      <p
                        className="mb-3 text-xs font-bold uppercase tracking-[0.16em]"
                        style={{ color: TEXT_MUTED }}
                      >
                        Quick actions
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            const phone = Array.isArray(selectedGuest?.phone)
                              ? selectedGuest?.phone?.[0]
                              : selectedGuest?.phone;
                            if (phone) window.location.href = `tel:${phone}`;
                          }}
                          className="rounded-2xl px-3 py-2.5 text-xs font-bold"
                          style={{ background: '#ECFDF5', color: '#047857', border: '1.5px solid #A7F3D0' }}
                        >
                          <Phone className="mr-1 inline h-3.5 w-3.5" />
                          Call guest
                        </button>

                        {getReservationId(selectedConversation.reservationId) ? (
                          <button
                            onClick={() => {
                              const reservationId = getReservationId(selectedConversation.reservationId);
                              if (reservationId) generateLinkMutation.mutate(reservationId);
                            }}
                            className="rounded-2xl px-3 py-2.5 text-xs font-bold"
                            style={{ background: '#FFF7ED', color: '#9A3412', border: '1.5px solid #FED7AA' }}
                          >
                            <LinkIcon className="mr-1 inline h-3.5 w-3.5" />
                            Chat link
                          </button>
                        ) : (
                          <button
                            disabled
                            className="rounded-2xl px-3 py-2.5 text-xs font-bold opacity-60"
                            style={{ background: '#FFF7ED', color: '#9A3412', border: '1.5px solid #FED7AA' }}
                          >
                            <LinkIcon className="mr-1 inline h-3.5 w-3.5" />
                            No link
                          </button>
                        )}

                        <button
                          onClick={() => updateStatusMutation.mutate('resolved')}
                          className="rounded-2xl px-3 py-2.5 text-xs font-bold"
                          style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1.5px solid #BFDBFE' }}
                        >
                          <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                          Resolve
                        </button>

                        <button
                          onClick={() => updateStatusMutation.mutate('closed')}
                          className="rounded-2xl px-3 py-2.5 text-xs font-bold"
                          style={{ background: '#FFF1F2', color: CORAL, border: '1.5px solid #FECDD3' }}
                        >
                          <XCircle className="mr-1 inline h-3.5 w-3.5" />
                          Close
                        </button>
                      </div>
                    </div>

                    <div
                      className="rounded-[24px] p-4"
                      style={{ background: SURFACE, border: `1.5px solid ${BORDER}` }}
                    >
                      <p
                        className="mb-3 text-xs font-bold uppercase tracking-[0.16em]"
                        style={{ color: TEXT_MUTED }}
                      >
                        Important records
                      </p>

                      <div className="space-y-2.5 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span style={{ color: TEXT_MUTED }}>Guest email</span>
                          <span className="max-w-[180px] truncate font-semibold text-right" style={{ color: TEXT }}>
                            {Array.isArray(selectedGuest?.email)
                              ? selectedGuest?.email?.[0] || '--'
                              : selectedGuest?.email || '--'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span style={{ color: TEXT_MUTED }}>Unread by guest</span>
                          <span className="font-semibold" style={{ color: TEXT }}>
                            {selectedConversation.unreadCountGuest || 0}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span style={{ color: TEXT_MUTED }}>Unread by staff</span>
                          <span className="font-semibold" style={{ color: TEXT }}>
                            {selectedConversation.unreadCountStaff || 0}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <span style={{ color: TEXT_MUTED }}>Reservation ID</span>
                          <span className="max-w-[180px] truncate font-semibold text-right" style={{ color: TEXT }}>
                            {getReservationId(selectedConversation.reservationId) || '--'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {!chatOpen && (
          <button
            onClick={() => {
              setChatOpen(true);
              setChatMinimized(false);
            }}
            className="fixed bottom-6 right-6 z-[80] flex h-16 w-16 items-center justify-center rounded-full text-white shadow-2xl transition-all hover:scale-105"
            style={{
              background: GRADIENT_PRIMARY,
              boxShadow: '0 18px 40px rgba(249,115,22,0.35)',
            }}
            title="Open guest chat"
          >
            <div className="relative">
              <MessageSquare className="h-7 w-7" />
              {topStats.unread > 0 ? (
                <span
                  className="absolute -right-2 -top-2 inline-flex min-w-[22px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                  style={{ background: '#DC2626' }}
                >
                  {topStats.unread}
                </span>
              ) : null}
            </div>
          </button>
        )}

        {chatOpen && (
          <div className="fixed inset-0 z-[90] pointer-events-none">
            <div
              className={cn(
                'absolute inset-0 transition-opacity duration-300',
                chatMinimized ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
              )}
              style={{ background: 'rgba(15,23,42,0.24)' }}
              onClick={() => setChatOpen(false)}
            />

            <div
              className={cn(
                'pointer-events-auto absolute overflow-hidden transition-all duration-300',
                chatMinimized
                  ? 'bottom-6 right-6 h-[72px] w-[360px] max-w-[calc(100vw-1.5rem)] rounded-[24px]'
                  : 'bottom-4 right-4 top-4 w-[430px] max-w-[calc(100vw-1rem)] rounded-[30px]'
              )}
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDFC 100%)',
                border: `1.5px solid ${BORDER}`,
                boxShadow: '0 20px 60px rgba(15,23,42,0.18)',
              }}
            >
              {!selectedConversation ? (
                <div className="flex h-full items-center justify-center p-6">
                  <div
                    className="w-full rounded-[24px] p-6"
                    style={{
                      background: SURFACE,
                      border: `1.5px solid ${BORDER}`,
                    }}
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl"
                        style={{ background: GRADIENT_SOFT, color: MELON }}
                      >
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-bold" style={{ color: TEXT }}>
                          Select a conversation
                        </p>
                        <p className="text-sm" style={{ color: TEXT_MUTED }}>
                          Choose any room from the left side.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setChatOpen(false)}
                      className="rounded-2xl px-4 py-2 text-sm font-bold"
                      style={{ background: '#FFF1F2', color: CORAL, border: '1px solid #FECDD3' }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col">
                  <div
                    className="flex items-center justify-between gap-3 border-b px-4 py-4"
                    style={{
                      borderColor: BORDER,
                      background: 'rgba(255,252,248,0.96)',
                      backdropFilter: 'blur(18px)',
                    }}
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[18px] text-sm font-bold text-white"
                        style={{
                          background: GRADIENT_PRIMARY,
                          boxShadow: '0 8px 20px rgba(249,115,22,0.24)',
                        }}
                      >
                        {selectedConversation.roomNumber || fullGuestName(selectedGuest).charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate text-sm font-bold" style={{ color: TEXT }}>
                            Room {selectedConversation.roomNumber || '--'}
                          </h2>

                          <Pill
                            bg={selectedConversation.status === 'resolved' ? '#F0FDF4' : '#FFF7ED'}
                            color={selectedConversation.status === 'resolved' ? '#166534' : '#9A3412'}
                            border={selectedConversation.status === 'resolved' ? '#BBF7D0' : '#FED7AA'}
                          >
                            {selectedConversation.status.replace('_', ' ')}
                          </Pill>
                        </div>

                        <p className="truncate text-[11px]" style={{ color: TEXT_MUTED }}>
                          {fullGuestName(selectedGuest)} · {selectedConversation.assignedStaffId?.name || 'Unassigned'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setChatMinimized((prev) => !prev)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{
                          background: '#FFF7ED',
                          color: '#9A3412',
                          border: '1px solid #FED7AA',
                        }}
                        title={chatMinimized ? 'Expand' : 'Minimize'}
                      >
                        <Minus className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => setChatOpen(false)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{
                          background: '#FFF1F2',
                          color: CORAL,
                          border: '1px solid #FECDD3',
                        }}
                        title="Close chat"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {chatMinimized ? (
                    <button
                      onClick={() => setChatMinimized(false)}
                      className="flex h-full w-full items-center justify-between px-4 text-left"
                      style={{ background: SURFACE }}
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-2xl text-white"
                          style={{ background: GRADIENT_PRIMARY }}
                        >
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold" style={{ color: TEXT }}>
                            Room {selectedConversation.roomNumber || '--'}
                          </p>
                          <p className="truncate text-[11px]" style={{ color: TEXT_MUTED }}>
                            {selectedConversation.lastMessagePreview || 'Tap to expand chat'}
                          </p>
                        </div>
                      </div>

                      {selectedConversation.unreadCountStaff ? (
                        <span
                          className="inline-flex min-w-[24px] items-center justify-center rounded-full px-2 py-1 text-[10px] font-bold text-white"
                          style={{ background: GRADIENT_PRIMARY }}
                        >
                          {selectedConversation.unreadCountStaff}
                        </span>
                      ) : null}
                    </button>
                  ) : (
                    <>
                      <div
                        className="space-y-4 px-4 py-4"
                        style={{
                          flex: '1 1 0',
                          minHeight: 0,
                          overflowY: 'auto',
                          background:
                            'radial-gradient(circle at top right, rgba(249,115,22,0.05), transparent 24%), linear-gradient(180deg, #FFFCFA 0%, #FFF8F3 100%)',
                        }}
                      >
                        {detailLoading ? (
                          <div className="flex items-center justify-center py-20">
                            <Spinner className="h-7 w-7 text-[#F97316]" />
                          </div>
                        ) : !localMessages.length ? (
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
                              Start the conversation with a quick reply below.
                            </p>
                          </div>
                        ) : (
                          visibleMessages.map((m, idx) => {
                            const isStaff = m.senderType === 'staff';
                            const isBot = m.senderType === 'bot';
                            const type = m.messageType || 'text';
                            const action = m.actionResult;
                            const actionMeta = action?.type ? ACTION_META[action.type] : null;

                            return (
                              <motion.div
                                key={m._id || m.id || idx}
                                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.18 }}
                                className={cn('flex w-full', isStaff ? 'justify-end' : 'justify-start')}
                              >
                                <div className={cn('flex max-w-[88%] flex-col', isStaff ? 'items-end' : 'items-start')}>
                                  {!isStaff ? (
                                    <div className="mb-1.5 ml-1 flex items-center gap-2">
                                      <span
                                        className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                        style={{
                                          background: isBot
                                            ? 'linear-gradient(135deg, #7C3AED, #4F46E5)'
                                            : GRADIENT_PRIMARY,
                                        }}
                                      >
                                        {isBot ? 'AI' : fullGuestName(selectedGuest).charAt(0)}
                                      </span>

                                      <span
                                        className="text-[11px] font-bold uppercase tracking-[0.14em]"
                                        style={{ color: isBot ? VIOLET : TEXT_MUTED }}
                                      >
                                        {isBot ? 'AI Concierge' : m.senderName || 'Guest'}
                                      </span>
                                    </div>
                                  ) : m.senderName ? (
                                    <div className="mb-1.5 mr-1 flex items-center gap-2">
                                      <span
                                        className="text-[11px] font-bold uppercase tracking-[0.14em]"
                                        style={{ color: TEXT_MUTED }}
                                      >
                                        {m.senderName}
                                      </span>
                                      <span
                                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                        style={{ background: 'linear-gradient(135deg, #0D9488, #16A34A)' }}
                                      >
                                        S
                                      </span>
                                    </div>
                                  ) : null}

                                  <div
                                    className="rounded-[22px] text-sm leading-relaxed"
                                    style={{
                                      background: isStaff
                                        ? 'linear-gradient(135deg, #0D9488 0%, #16A34A 100%)'
                                        : isBot
                                          ? 'linear-gradient(135deg, #7C3AED10, #4F46E510)'
                                          : 'linear-gradient(180deg, #FFFFFF 0%, #FFF9F4 100%)',
                                      color: isStaff ? '#fff' : TEXT,
                                      border: isStaff
                                        ? 'none'
                                        : isBot
                                          ? '1.5px solid #DDD6FE'
                                          : `1.5px solid ${BORDER}`,
                                      borderTopRightRadius: isStaff ? 6 : 22,
                                      borderTopLeftRadius: isStaff ? 22 : 6,
                                      boxShadow: isStaff
                                        ? '0 10px 28px rgba(13,148,136,0.22)'
                                        : '0 4px 18px rgba(0,0,0,0.05)',
                                      padding: action ? '0' : '12px 16px',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {type === 'image' && (m.imageUrl || m.mediaUrl) ? (
                                      <img
                                        src={m.thumbUrl || m.imageUrl || m.mediaUrl}
                                        alt={m.imageName || 'Guest upload'}
                                        className="max-h-[220px] w-full object-cover"
                                      />
                                    ) : null}

                                    {m.text && !action ? (
                                      <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</p>
                                    ) : null}

                                    {m.text && action ? (
                                      <div className="px-4 pb-2 pt-3">
                                        <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</p>
                                      </div>
                                    ) : null}

                                    {action && actionMeta ? (
                                      <div style={{ borderTop: m.text ? `1px solid ${actionMeta.border}` : 'none' }}>
                                        <StaffOrderCardBubble action={action} />
                                      </div>
                                    ) : null}
                                  </div>

                                  <div
                                    className={cn(
                                      'mt-1.5 px-1 text-[10px] font-medium',
                                      isStaff ? 'text-right' : 'text-left'
                                    )}
                                    style={{ color: TEXT_MUTED }}
                                  >
                                    {fmtDateTime(m.createdAt)}
                                    {isStaff ? (
                                      <span className="ml-1.5" style={{ color: '#16A34A' }}>
                                        ✓✓
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })
                        )}

                        <div ref={messagesEndRef} />
                      </div>

                      <div
                        className="border-t px-4 pb-4 pt-3"
                        style={{
                          borderColor: BORDER,
                          background: 'rgba(255,250,246,0.96)',
                          backdropFilter: 'blur(20px)',
                        }}
                      >
                        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                          {QUICK_REPLIES.map((q) => (
                            <button
                              key={q}
                              onClick={() => setReply(q)}
                              className="flex-shrink-0 rounded-full px-3 py-2 text-[11px] font-semibold"
                              style={{
                                background: reply === q ? GRADIENT_SOFT : SURFACE,
                                color: reply === q ? CORAL : TEXT_SUB,
                                border:
                                  reply === q
                                    ? '1.5px solid rgba(249,115,22,0.35)'
                                    : `1.5px solid ${BORDER_MID}`,
                                maxWidth: '220px',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {q}
                            </button>
                          ))}
                        </div>

                        <div
                          className="flex items-end gap-2 rounded-[26px] px-3 py-3"
                          style={{
                            background: SURFACE,
                            border: `1.5px solid ${BORDER_MID}`,
                            boxShadow: '0 4px 18px rgba(249,115,22,0.08)',
                          }}
                        >
                          <div
                            className="mb-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl text-xs font-bold text-white"
                            style={{ background: 'linear-gradient(135deg, #0D9488, #16A34A)' }}
                          >
                            S
                          </div>

                          <textarea
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            rows={1}
                            placeholder="Reply to guest..."
                            className="max-h-32 flex-1 resize-none bg-transparent py-2 text-sm outline-none"
                            style={{ color: TEXT, lineHeight: '1.5' }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendReply();
                              }
                            }}
                          />

                          {reply.trim() ? (
                            <button
                              type="button"
                              onClick={() => setReply('')}
                              className="mb-0.5 h-9 w-9 flex-shrink-0 rounded-2xl"
                              style={{ background: '#FFF1F2', color: CORAL }}
                              title="Clear reply"
                            >
                              <div className="flex h-full w-full items-center justify-center">
                                <XCircle className="h-4 w-4" />
                              </div>
                            </button>
                          ) : null}

                          <button
                            onClick={handleSendReply}
                            disabled={!reply.trim() || sendReplyMutation.isPending}
                            className="mb-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-white disabled:opacity-40"
                            style={{
                              background: GRADIENT_PRIMARY,
                              boxShadow: reply.trim() ? '0 8px 22px rgba(249,115,22,0.28)' : 'none',
                            }}
                          >
                            {sendReplyMutation.isPending ? (
                              <Spinner className="h-4 w-4" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        <p className="mt-2 text-center text-[11px]" style={{ color: TEXT_MUTED }}>
                          Enter to send · Shift+Enter for new line · Staff replies are visible to guest
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}