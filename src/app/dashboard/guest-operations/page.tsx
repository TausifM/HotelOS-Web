'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion} from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Bell,
  ChevronRight,
  Clock3,
  HandPlatter,
  House,
  IndianRupee,
  Loader2,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  UserRound,
  UtensilsCrossed,
  Wrench,
  ReceiptText,
  LogOut,
  CalendarClock,
  BadgeCheck,
  CircleDot,
  ClipboardList,
  ArrowUpRight,
} from 'lucide-react';
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
  priority: Priority;
  subject?: string;
  lastMessageAt?: string;
  unreadCountStaff?: number;
  humanHandoverRequired?: boolean;
  guestId?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    phone?: string | string[];
    email?: string | string[];
    loyalty?: string;
  };
  assignedStaffId?: {
    _id?: string;
    name?: string;
    role?: string;
  };
  reservationId?: string;
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
};

type ConversationDetail = {
  conversation: StaffConversationListItem & {
    guestId?: StaffConversationListItem['guestId'];
  };
  messages: StaffMessage[];
};

type StatsPayload = {
  open: number;
  pendingStaff: number;
  humanRequired: number;
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

const STATUS_META: Record<
  string,
  { label: string; bg: string; color: string; border: string }
> = {
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

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'restaurantorder', label: 'Room Service' },
  { key: 'housekeeping', label: 'Housekeeping' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'checkout', label: 'Checkout' },
  { key: 'stayextension', label: 'Extension' },
  { key: 'escalation', label: 'Escalation' },
];

const QUICK_REPLIES = [
  'Namaste sir/ma’am, we are checking this right away.',
  'Your request has been assigned and our team is on the way.',
  'Kitchen is preparing your order. ETA 20 minutes.',
  'Housekeeping will reach your room in 15 minutes.',
  'Engineer has been informed and will visit shortly.',
  'Front desk is reviewing your checkout / extension request.',
];

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

function fullGuestName(guest?: StaffConversationListItem['guestId']) {
  const name = [guest?.firstName, guest?.lastName].filter(Boolean).join(' ').trim();
  return name || 'Guest';
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
        priority: conversation.priority,
      };
    })
    .reverse();
}
function normalizeText(value: unknown) {
  return String(value ?? '').toLowerCase().trim();
}

function normalizeRoomNo(value: unknown) {
  return String(value ?? '').replace(/\s+/g, '').trim();
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

function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return <Loader2 className={cn(className, 'animate-spin')} />;
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
        boxShadow: highlight ? '0 12px 30px rgba(249,115,22,0.22)' : '0 4px 20px rgba(249,115,22,0.06)',
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
      <p className="mt-1 text-xs font-semibold" style={{ color: highlight ? 'rgba(255,255,255,0.84)' : TEXT_MUTED }}>
        {label}
      </p>
    </motion.div>
  );
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

export default function GuestOperationsPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [localMessages, setLocalMessages] = useState<StaffMessage[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [guestSearch, setGuestSearch] = useState('');

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery<StatsPayload>({
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

  useEffect(() => {
    if (!selectedId && conversations.length) {
      setSelectedId(conversations[0]._id);
    }
  }, [conversations, selectedId]);

  const { data: detailRes, isLoading: detailLoading, refetch: refetchDetail } = useQuery<ConversationDetail>({
    queryKey: ['chatbot-conversation-detail', selectedId],
    queryFn: () => api.get(`/api/chatbot/staff/conversations/${selectedId}`).then((r) => r.data.data),
    enabled: !!selectedId,
  });
const { data: rooms = [], isLoading: roomsLoading, refetch: refetchRooms } = useQuery<Room[]>({
  queryKey: ['rooms'],
  queryFn: () =>
    api.get('/api/rooms').then((r) => r.data.data?.docs || r.data.data || []),
  refetchInterval: 30_000,
});

const { data: guestResults = [], isLoading: guestSearchLoad } = useQuery<GuestSearchItem[]>({
  queryKey: ['guest-search-walkin', guestSearch],
  queryFn: () =>
    api
      .get('/api/guests', { params: { search: guestSearch, limit: 6 } })
      .then((r) => r.data.data?.docs || []),
  enabled: guestSearch.trim().length >= 2,
});

  useEffect(() => {
    if (detailRes?.messages) {
      setLocalMessages(detailRes.messages);
      setServiceItems(deriveServiceItems(detailRes.conversation, detailRes.messages));
    }
  }, [detailRes]);

  const sendReplyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId || !reply.trim()) return null;
      const res = await api.post(`/api/chatbot/staff/conversations/${selectedId}/reply`, {
        text: reply.trim(),
      });
      return res.data.data;
    },
    onSuccess: (msg) => {
      if (!msg) return;
      setReply('');
      setLocalMessages((prev) => [...prev, msg]);
      toast.success('Reply sent');
      qc.invalidateQueries({ queryKey: ['chatbot-conversations'] });
      qc.invalidateQueries({ queryKey: ['chatbot-stats'] });
      qc.invalidateQueries({ queryKey: ['chatbot-conversation-detail', selectedId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to send reply'),
  });

  const updateConversationMutation = useMutation({
    mutationFn: async (payload: Partial<StaffConversationListItem> & { _id: string }) => {
      const { _id, ...rest } = payload;
      const res = await api.patch(`/api/chatbot/staff/conversations/${_id}`, rest);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Conversation updated');
      qc.invalidateQueries({ queryKey: ['chatbot-conversations'] });
      qc.invalidateQueries({ queryKey: ['chatbot-conversation-detail', selectedId] });
      qc.invalidateQueries({ queryKey: ['chatbot-stats'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Update failed'),
  });

  const selectedConversation = detailRes?.conversation;
  const selectedGuest = selectedConversation?.guestId;
  const selectedServices = serviceItems;

const selectedRoom = useMemo(() => {
  if (!selectedConversation?.roomNumber || !rooms?.length) return null;

  const target = normalizeRoomNo(selectedConversation.roomNumber);

  return (
    rooms.find((r) => normalizeRoomNo(r.roomNumber) === target) || null
  );
}, [rooms, selectedConversation?.roomNumber]);

const searchedGuests = useMemo(() => {
  return guestResults.map((g) => {
    const loyaltyLabel =
      typeof g.loyalty === 'string'
        ? g.loyalty
        : g.loyalty?.tier || null;

    return {
      ...g,
      displayName: [g.firstName, g.lastName].filter(Boolean).join(' ').trim() || 'Guest',
      phoneText: Array.isArray(g.phone) ? g.phone[0] : g.phone || '--',
      emailText: Array.isArray(g.email) ? g.email[0] : g.email || '--',
      loyaltyLabel,
      guestKey: g._id || g.id || Math.random().toString(36).slice(2),
    };
  });
}, [guestResults]);

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
      const guestLoyalty = getLoyaltyText((guest as any)?.loyalty);

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

      if (
        activeFilter !== 'all' &&
        activeFilter !== 'unread'
      ) {
        const selectedMsgs = c._id === selectedId ? localMessages : [];
        const matchesAction =
          c._id === selectedId
            ? selectedMsgs.some((m) => m.actionResult?.type === activeFilter)
            : (c.tags || []).includes(activeFilter);

        if (!matchesAction) score = 0;
      }

      return { ...c, __score: score };
    })
    .filter((c) => c.__score > 0)
    .sort((a, b) => {
      if (b.__score !== a.__score) return b.__score - a.__score;
      return (
        new Date(b.lastMessageAt || 0).getTime() -
        new Date(a.lastMessageAt || 0).getTime()
      );
    });
}, [conversations, rooms, search, activeFilter, selectedId, localMessages]);
const roomSearchResults = useMemo(() => {
  const q = normalizeRoomNo(search);
  if (!q || !rooms?.length) return [];

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

const guestSearchResultsFromMain = useMemo(() => {
  const q = normalizeText(search);
  if (!q) return [];

  return conversations
    .map((c) => c.guestId)
    .filter(Boolean)
    .filter((g, i, arr) => {
      const id = (g as any)?._id || `${(g as any)?.firstName}-${(g as any)?.phone}`;
      return arr.findIndex((x) => ((x as any)?._id || `${(x as any)?.firstName}-${(x as any)?.phone}`) === id) === i;
    })
    .filter((g: any) => {
      const blob = [
        g?.firstName,
        g?.lastName,
        getGuestPhoneText(g?.phone),
        getGuestEmailText(g?.email),
        getLoyaltyText(g?.loyalty),
      ]
        .filter(Boolean)
        .map(normalizeText)
        .join(' | ');

      return blob.includes(q);
    })
    .slice(0, 6);
}, [conversations, search]);

  const topStats = {
    open: statsData?.open || 0,
    unread: statsData?.totalUnreadMessages || 0,
    pending: statsData?.pendingStaff || 0,
    human: statsData?.humanRequired || 0,
    liveServices: selectedServices.filter((s) => s.status !== 'resolved' && s.status !== 'delivered').length,
    roomService: selectedServices.filter((s) => s.type === 'restaurantorder').length,
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
      if (selectedId) socket.emit('chat:join-conversation', { conversationId: selectedId });
    });

    socket.on('disconnect', () => setSocketConnected(false));

    socket.on('chat:new-message', (payload: any) => {
      qc.invalidateQueries({ queryKey: ['chatbot-conversations'] });
      qc.invalidateQueries({ queryKey: ['chatbot-stats'] });

      if (payload?.conversationId === selectedId && payload?.message) {
        setLocalMessages((prev) => {
          const exists = prev.some((m) => (m._id || m.id) === (payload.message._id || payload.message.id));
          return exists ? prev : [...prev, payload.message];
        });

        if (payload.message?.actionResult) {
          setServiceItems((prev) => [
            deriveServiceItems(selectedConversation, [payload.message])[0],
            ...prev,
          ].filter(Boolean) as ServiceItem[]);
        }
      }

      if (payload?.roomNumber) {
        toast.success(`New guest message from Room ${payload.roomNumber}`);
      }
    });

    socket.on('action:status-changed', (payload: any) => {
      if (payload?.conversationId === selectedId) {
        setServiceItems((prev) =>
          prev.map((item) =>
            item.id === payload.actionId ? { ...item, status: payload.status } : item
          )
        );
      }
      qc.invalidateQueries({ queryKey: ['chatbot-conversations'] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [qc, selectedId, selectedConversation]);

  useEffect(() => {
    if (!socketRef.current?.connected || !selectedId) return;
    socketRef.current.emit('chat:join-conversation', { conversationId: selectedId });
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  return (
    <DashboardLayout title="Guest Operations">
      <div className="mx-auto max-w-[1700px] space-y-5" style={{ color: TEXT }}>
        <div
          className="relative overflow-hidden rounded-[28px] p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(249,115,22,0.10) 0%, rgba(244,63,94,0.08) 55%, rgba(236,72,153,0.06) 100%)',
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
                  style={{ background: GRADIENT_PRIMARY, boxShadow: '0 8px 24px rgba(249,115,22,0.28)' }}
                >
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight" style={{ color: TEXT }}>
                    Staff Guest Operations Desk
                  </h1>
                  <p className="text-sm" style={{ color: TEXT_SUB }}>
                    Chat, room service, housekeeping, maintenance, checkout, extension and guest records on one screen.
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
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-white"
                style={{ background: GRADIENT_PRIMARY, boxShadow: '0 8px 22px rgba(249,115,22,0.30)' }}
              >
                <Bell className="h-4 w-4" />
                Live Desk
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <StatCard icon={MessageSquare} label="Open chats" value={topStats.open} tint={MELON} bg="#FFF7ED" />
          <StatCard icon={Bell} label="Unread messages" value={topStats.unread} tint={CORAL} bg="#FFF1F2" highlight />
          <StatCard icon={Clock3} label="Pending staff" value={topStats.pending} tint={AMBER} bg="#FFFBEB" />
          <StatCard icon={Sparkles} label="Human handover" value={topStats.human} tint={SAGE} bg="#F0FDF4" />
          <StatCard icon={HandPlatter} label="Live services" value={topStats.liveServices} tint={TEAL} bg="#F0FDFA" />
          <StatCard icon={UtensilsCrossed} label="Room service in room" value={topStats.roomService} tint={INDIGO} bg="#EEF2FF" />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)_380px]">
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

          <div className="space-y-3">
  <div
    className="rounded-[24px] p-3"
    style={{
      background: SURFACE,
      border: `1.5px solid ${BORDER_MID}`,
      boxShadow: '0 6px 18px rgba(249,115,22,0.08)',
    }}
  >
    <div
      className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
      style={{ background: PANEL }}
    >
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
                        border: active ? `1.5px solid rgba(249,115,22,0.35)` : `1.5px solid ${BORDER}`,
                        boxShadow: active ? '0 4px 12px rgba(249,115,22,0.12)' : 'none',
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-h-[calc(78vh-155px)] overflow-y-auto p-2">
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
                    if (match) setSelectedId(match._id);
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
                  {filteredConversations.map((c) => {
                    const selected = c._id === selectedId;
                    const guest = fullGuestName(c.guestId);
                    const unread = c.unreadCountStaff || 0;
                    const p = PRIORITY_META[c.priority || 'normal'];

                    return (
                      <button
                        key={c._id}
                        onClick={() => setSelectedId(c._id)}
                        className="w-full rounded-[24px] p-3 text-left transition-all"
                        style={{
                          background: selected ? SURFACE : 'rgba(255,255,255,0.62)',
                          border: selected ? `1.5px solid ${BORDER_MID}` : `1.5px solid transparent`,
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
                              {unread > 0 && (
                                <span
                                  className="inline-flex min-w-[22px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                                  style={{ background: GRADIENT_PRIMARY }}
                                >
                                  {unread}
                                </span>
                              )}
                            </div>
                            <p className="truncate text-xs" style={{ color: TEXT_SUB }}>
                              {guest}
                            </p>
                          </div>

                          <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: TEXT_MUTED }} />
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <Pill bg={p.bg} color={p.color} border={p.border}>
                            {p.label}
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
                            {c.status.replace('_', ' ')}
                          </Pill>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[11px] font-medium" style={{ color: TEXT_MUTED }}>
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

          <section
            className="min-h-[78vh] overflow-hidden rounded-[30px]"
            style={{
              background: SURFACE,
              border: `1.5px solid ${BORDER}`,
              boxShadow: '0 8px 30px rgba(249,115,22,0.07)',
            }}
          >
            {!selectedConversation ? (
              <div className="flex h-full min-h-[78vh] items-center justify-center px-6 text-center">
                <div>
                  <div
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[28px]"
                    style={{ background: GRADIENT_SOFT, color: MELON }}
                  >
                    <MessageSquare className="h-7 w-7" />
                  </div>
                  <p className="text-lg font-bold" style={{ color: TEXT }}>
                    Select a conversation
                  </p>
                  <p className="mt-1 text-sm" style={{ color: TEXT_MUTED }}>
                    Choose a room from the left to start handling the guest request.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[78vh] flex-col">
                <div
                  className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4"
                  style={{
                    borderColor: BORDER,
                    background: 'linear-gradient(180deg, rgba(255,251,247,0.92), rgba(255,247,239,0.82))',
                    backdropFilter: 'blur(14px)',
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold" style={{ color: TEXT }}>
                        Room {selectedConversation.roomNumber || '--'}
                      </h2>
                      <Pill
                        bg={PRIORITY_META[selectedConversation.priority || 'normal'].bg}
                        color={PRIORITY_META[selectedConversation.priority || 'normal'].color}
                        border={PRIORITY_META[selectedConversation.priority || 'normal'].border}
                      >
                        {PRIORITY_META[selectedConversation.priority || 'normal'].label}
                      </Pill>
                      <Pill
                        bg={selectedConversation.status === 'resolved' ? '#F0FDF4' : '#FFF7ED'}
                        color={selectedConversation.status === 'resolved' ? '#166534' : '#9A3412'}
                        border={selectedConversation.status === 'resolved' ? '#BBF7D0' : '#FED7AA'}
                      >
                        {selectedConversation.status.replace('_', ' ')}
                      </Pill>
                    </div>
                    <p className="mt-1 text-sm" style={{ color: TEXT_SUB }}>
                      {fullGuestName(selectedGuest)} • {selectedConversation.assignedStaffId?.name || 'Unassigned'} • Last activity {fmtDateTime(selectedConversation.lastMessageAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        updateConversationMutation.mutate({
                          _id: selectedConversation._id,
                          priority:
                            selectedConversation.priority === 'urgent'
                              ? 'high'
                              : 'urgent',
                        })
                      }
                      className="rounded-2xl px-3.5 py-2 text-xs font-bold"
                      style={{
                        background: '#FFF1F2',
                        color: CORAL,
                        border: '1.5px solid #FECDD3',
                      }}
                    >
                      Mark urgent
                    </button>
                    <button
                      onClick={() =>
                        updateConversationMutation.mutate({
                          _id: selectedConversation._id,
                          status: 'resolved',
                        })
                      }
                      className="rounded-2xl px-3.5 py-2 text-xs font-bold"
                      style={{
                        background: '#F0FDF4',
                        color: '#166534',
                        border: '1.5px solid #BBF7D0',
                      }}
                    >
                      Resolve
                    </button>
                  </div>
                </div>

                <div
                  className="flex-1 overflow-y-auto px-5 py-5"
                  style={{ background: `radial-gradient(circle at top right, rgba(249,115,22,0.04), transparent 18%), ${BG}` }}
                >
                  {detailLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Spinner className="h-7 w-7" />
                    </div>
                  ) : !localMessages.length ? (
                    <div className="py-16 text-center">
                      <div
                        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[28px]"
                        style={{ background: GRADIENT_SOFT, color: MELON }}
                      >
                        <MessageSquare className="h-7 w-7" />
                      </div>
                      <p className="font-bold" style={{ color: TEXT }}>
                        No messages yet
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {localMessages.map((m, idx) => {
                        const mine = m.senderType === 'staff';
                        const type = m.messageType || 'text';
                        const action = m.actionResult;
                        const actionMeta = action?.type ? ACTION_META[action.type] : null;
                        const statusMeta = action?.status ? STATUS_META[action.status] : null;

                        return (
                          <motion.div
                            key={m._id || m.id || idx}
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                          >
                            <div className="max-w-[82%]">
                              {!mine && (
                                <div className="mb-1 ml-1 flex items-center gap-2">
                                  <span
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                    style={{ background: GRADIENT_PRIMARY }}
                                  >
                                    {fullGuestName(selectedGuest).charAt(0)}
                                  </span>
                                  <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: TEXT_MUTED }}>
                                    Guest
                                  </span>
                                </div>
                              )}

                              <div
                                className="rounded-[24px] px-4 py-3 text-sm leading-relaxed"
                                style={{
                                  background: mine ? GRADIENT_PRIMARY : 'linear-gradient(180deg, #FFFFFF 0%, #FFF9F4 100%)',
                                  color: mine ? '#fff' : TEXT,
                                  border: mine ? 'none' : `1.5px solid ${BORDER}`,
                                  borderTopRightRadius: mine ? 8 : 24,
                                  borderTopLeftRadius: mine ? 24 : 8,
                                  boxShadow: mine
                                    ? '0 10px 24px rgba(249,115,22,0.20)'
                                    : '0 4px 18px rgba(0,0,0,0.05)',
                                }}
                              >
                                {type === 'image' && (m.imageUrl || m.mediaUrl) ? (
                                  <img
                                    src={m.thumbUrl || m.imageUrl || m.mediaUrl}
                                    alt={m.imageName || 'Guest upload'}
                                    className="mb-3 max-h-[240px] w-full rounded-2xl object-cover"
                                  />
                                ) : null}

                                {m.text ? <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</div> : null}

                                {action && actionMeta ? (
                                  <div
                                    className="mt-3 overflow-hidden rounded-2xl"
                                    style={{
                                      background: '#FFFDFB',
                                      border: `1.5px solid ${actionMeta.border}`,
                                      boxShadow: `0 6px 20px ${actionMeta.color}18`,
                                    }}
                                  >
                                    <div
                                      className="flex items-center justify-between gap-3 px-4 py-2.5"
                                      style={{
                                        background: `${actionMeta.bg}`,
                                        borderBottom: `1px solid ${actionMeta.border}`,
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <actionMeta.icon className="h-4 w-4" style={{ color: actionMeta.color }} />
                                        <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: actionMeta.color }}>
                                          {actionMeta.label}
                                        </span>
                                      </div>
                                      {statusMeta ? (
                                        <Pill bg={statusMeta.bg} color={statusMeta.color} border={statusMeta.border}>
                                          {statusMeta.label}
                                        </Pill>
                                      ) : null}
                                    </div>

                                    <div className="space-y-2 px-4 py-3 text-xs" style={{ color: TEXT_SUB }}>
                                      {action.items?.length ? (
                                        <ul className="space-y-1">
                                          {action.items.map((item, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                              <span className="h-1.5 w-1.5 rounded-full" style={{ background: actionMeta.color }} />
                                              {item}
                                            </li>
                                          ))}
                                        </ul>
                                      ) : null}
                                      {action.summary ? <p>{action.summary}</p> : null}
                                      {action.issueTitle ? <p>{action.issueTitle}</p> : null}
                                      {action.total ? (
                                        <p className="flex items-center gap-1 font-bold" style={{ color: MELON }}>
                                          <IndianRupee className="h-3.5 w-3.5" />
                                          {action.total}
                                        </p>
                                      ) : null}
                                      {action.amount ? (
                                        <p className="flex items-center gap-1 font-bold" style={{ color: MELON }}>
                                          <IndianRupee className="h-3.5 w-3.5" />
                                          {action.amount}
                                        </p>
                                      ) : null}
                                      {action.newCheckout ? (
                                        <p>
                                          New checkout: <span className="font-semibold">{action.newCheckout}</span>
                                        </p>
                                      ) : null}
                                    </div>
                                  </div>
                                ) : null}
                              </div>

                              <div
                                className={cn(
                                  'mt-1 flex items-center gap-2 px-1 text-[10px] font-medium',
                                  mine ? 'justify-end' : 'justify-start'
                                )}
                                style={{ color: TEXT_MUTED }}
                              >
                                <span>{fmtDateTime(m.createdAt)}</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div
                  className="border-t px-4 py-4"
                  style={{
                    borderColor: BORDER,
                    background: 'rgba(255,251,247,0.95)',
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                    {QUICK_REPLIES.map((q) => (
                      <button
                        key={q}
                        onClick={() => setReply(q)}
                        className="whitespace-nowrap rounded-full px-3 py-2 text-[11px] font-semibold"
                        style={{
                          background: '#FFF7ED',
                          color: TEXT_SUB,
                          border: '1.5px solid #FED7AA',
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  <div
                    className="flex items-end gap-2 rounded-[28px] px-3 py-3"
                    style={{
                      background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF9F4 100%)',
                      border: `1.5px solid ${BORDER_MID}`,
                      boxShadow: '0 4px 16px rgba(249,115,22,0.08)',
                    }}
                  >
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={1}
                      placeholder="Reply to guest… use clear hotel-operational language"
                      className="max-h-28 flex-1 resize-none bg-transparent text-sm outline-none"
                      style={{ color: TEXT }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (reply.trim()) sendReplyMutation.mutate();
                        }
                      }}
                    />
                    <button
                      onClick={() => sendReplyMutation.mutate()}
                      disabled={!reply.trim() || sendReplyMutation.isPending}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        background: GRADIENT_PRIMARY,
                        boxShadow: '0 8px 20px rgba(249,115,22,0.24)',
                      }}
                    >
                      {sendReplyMutation.isPending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-4">
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

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium" style={{ color: TEXT_MUTED }}>
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

                        <div className="mt-3 flex flex-wrap gap-2">
                          {['pending', 'preparing', 'ready', 'delivered'].map((nextStatus) => (
                            <button
                              key={nextStatus}
                              onClick={() =>
                                setServiceItems((prev) =>
                                  prev.map((p) =>
                                    p.id === item.id ? { ...p, status: nextStatus as StatusBadge } : p
                                  )
                                )
                              }
                              className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
                              style={{
                                background: item.status === nextStatus ? GRADIENT_SOFT : SURFACE,
                                color: item.status === nextStatus ? CORAL : TEXT_SUB,
                                border:
                                  item.status === nextStatus
                                    ? '1.5px solid rgba(249,115,22,0.35)'
                                    : `1.5px solid ${meta.border}`,
                              }}
                            >
                              {nextStatus}
                            </button>
                          ))}
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
                            {selectedGuest?.loyalty || 'Regular'}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: TEXT_MUTED }}>Conversation</p>
                          <p className="font-semibold" style={{ color: TEXT }}>
                            {selectedConversation.status}
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

                    <div className="rounded-[24px] p-4" style={{ background: SURFACE, border: `1.5px solid ${BORDER}` }}>
                      <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: TEXT_MUTED }}>
                        Important records
                      </p>
                      <div className="space-y-2.5 text-sm">
                        <div className="flex items-center justify-between">
                          <span style={{ color: TEXT_MUTED }}>Current folio</span>
                          <span className="font-bold" style={{ color: MELON }}>
                            ₹8,750
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span style={{ color: TEXT_MUTED }}>Outstanding</span>
                          <span className="font-semibold" style={{ color: CORAL }}>
                            ₹500 pending
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span style={{ color: TEXT_MUTED }}>Late checkout</span>
                          <span className="font-semibold" style={{ color: TEXT }}>
                            Under review
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span style={{ color: TEXT_MUTED }}>Special note</span>
                          <span className="font-semibold" style={{ color: TEXT }}>
                            UPI preferred
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[24px] p-4" style={{ background: SURFACE, border: `1.5px solid ${BORDER}` }}>
                      <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: TEXT_MUTED }}>
                        Quick actions
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button className="rounded-2xl px-3 py-2.5 text-xs font-bold" style={{ background: '#ECFDF5', color: '#047857', border: '1.5px solid #A7F3D0' }}>
                          <Phone className="mr-1 inline h-3.5 w-3.5" />
                          Call guest
                        </button>
                        <button className="rounded-2xl px-3 py-2.5 text-xs font-bold" style={{ background: '#FFF7ED', color: '#9A3412', border: '1.5px solid #FED7AA' }}>
                          <ArrowUpRight className="mr-1 inline h-3.5 w-3.5" />
                          Open folio
                        </button>
                        <button className="rounded-2xl px-3 py-2.5 text-xs font-bold" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1.5px solid #BFDBFE' }}>
                          <BadgeCheck className="mr-1 inline h-3.5 w-3.5" />
                          Approve ext.
                        </button>
                        <button className="rounded-2xl px-3 py-2.5 text-xs font-bold" style={{ background: '#FFF1F2', color: CORAL, border: '1.5px solid #FECDD3' }}>
                          <AlertCircle className="mr-1 inline h-3.5 w-3.5" />
                          Escalate
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}