'use client';

import CheckoutOverdueCard from '@/components/guest-chat/CheckoutOverdueCard';
import { MenuItemCard } from '@/components/restaurant/MenuCard';
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type MessageRole = 'guest' | 'bot' | 'staff';
type MessageType = 'text' | 'image' | 'actionresult';
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

interface ApiMessage {
  _id?: string;
  id?: string;
  senderType: MessageRole;
  text?: string;
  messageType?: MessageType;
  mediaUrl?: string;
  imageUrl?: string;
  thumbUrl?: string;
  imageName?: string;
  createdAt?: string;
  senderName?: string;
  status?: MessageStatus;
  action?: MessageAction;   // ← ADD THIS
}

// ── Add this new interface above Message ──
interface MessageAction {
  type: string;
  title?: string;
  options?: Array<{
    label: string;
    url: string;
    style: string;
    tooltip?: string;
  }>;
  minutesLate?: number;
  roomNumber?: string;
  hours?: number;
  note?: string;
}

interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
  type: MessageType;
  imageUrl?: string;
  thumbUrl?: string;
  imageName?: string;
  status?: MessageStatus;
  senderName?: string;
  orderCard?: {
    name: string;
    price: number;
    qty: number;
    note?: string;
    imageUrl?: string;
    category?: string;
    isVeg?: boolean;
    description?: string;
    prepTime?: string;
  };
  action?: MessageAction;   // ← ADD THIS
}

interface MenuItem {
  _id?: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string;
  isVeg?: boolean;
  prepTime?: string;
  rating?: number;
  tags?: string[];
  isPopular?: boolean;
  isChefSpecial?: boolean;
  isAvailable?: boolean;
  calories?: number;
  serves?: string;
  spiceLevel?: 'mild' | 'medium' | 'hot';
}

interface GuestAccessResponseData {
  conversation?: {
    _id?: string;
    id?: string;
    roomNumber?: string;
  };
  conversationId?: string;
  messages?: ApiMessage[];
  guest?: {
    firstName?: string;
    lastName?: string;
    name?: string;
  };
  tenant?: {
    hotelName?: string;
  };
  reservation?: {
    roomNumber?: string;
    hotelName?: string;
  };
  hotelName?: string;
  roomNumber?: string;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'];

const theme = {
  bg: 'linear-gradient(135deg, #fff4ec 0%, #ffe8ef 55%, #fff6e9 100%)',
  panel: 'rgba(255,255,255,0.82)',
  panelStrong: '#ffffff',
  text: '#261815',
  muted: '#7a5a53',
  faint: '#b58c84',
  border: '#f0c8bf',
  orange: '#ff7a45',
  orangeDark: '#ea5d28',
  pink: '#e84d8a',
  red: '#d94b4b',
  success: '#1f7a5a',
  shadow: '0 20px 60px rgba(225, 117, 92, 0.18)',
  bubble: 'linear-gradient(135deg, #ff824d 0%, #ea4f89 100%)',
  chip: 'linear-gradient(135deg, #fff0ea 0%, #ffe8f4 100%)',
  hero: 'linear-gradient(135deg,#F97316 0%,#F43F5E 100%)'
};

const QUICK_ACTIONS = [
  { label: 'Housekeeping', text: 'Need housekeeping' },
  { label: 'Water', text: 'Send water bottles' },
  { label: 'Towels', text: 'Need fresh towels' },
  { label: 'Cleaning', text: 'Room cleaning please' },
  { label: 'Late checkout', text: 'Late checkout request' },
  { label: 'Restaurant menu', text: 'Need restaurant menu' },
];

const HOTEL_SERVICES = [
  { title: 'Dining', subtitle: 'Browse restaurant menu' },
  { title: 'Housekeeping', subtitle: 'Cleaning, towels, toiletries' },
  { title: 'Checkout', subtitle: 'Request late checkout or bill' },
  { title: 'Amenities', subtitle: 'Wi-Fi, gym, pool, spa info' },
];

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function toMessage(m: ApiMessage): Message {
  return {
    id: m._id ?? m.id ?? genId(),  // ← add m._id here
    role: m.senderType,
    text: m.text ?? '',
    timestamp: new Date(m.createdAt ?? Date.now()),
    type: m.messageType ?? (m.imageUrl || m.mediaUrl ? 'image' : 'text'),
    imageUrl: m.imageUrl ?? m.mediaUrl,
    thumbUrl: m.thumbUrl,
    imageName: m.imageName,
    senderName: m.senderName,
    status: m.status ?? 'read',
    action: m.action,
  };
}

// ── FIX #2: apiFetch with guaranteed Content-Type + better error body ─────────
async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL is not configured');

  // Ensure path starts with /
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const isFormData = init?.body instanceof FormData;

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
    cache: 'no-store',
  });

  // FIX #3: Always parse the body, even on error status
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `Request failed with ${res.status}`);
  return json as T;
}

function useGuestAccess(token: string) {
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState('');
  const [conversationId, setConversationId] = useState('');
  const [hotelName, setHotelName] = useState('Hotel');
  const [roomNumber, setRoomNumber] = useState('');
  const [guestName, setGuestName] = useState('Guest');
  const [messages, setMessages] = useState<Message[]>([]);

  const load = useCallback(async () => {
    if (!token) {
      setExpired(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const json = await apiFetch<{ success: boolean; data: GuestAccessResponseData }>(
        '/api/chatbot/guest/access',
        {
          method: 'POST',
          body: JSON.stringify({ token }),
        }
      );

      const data = json?.data || {};
      const conversation = data.conversation || {};

      setConversationId(data.conversationId || conversation._id || conversation.id || '');
      setHotelName(data.hotelName || data.tenant?.hotelName || data.reservation?.hotelName || 'Hotel');
      setRoomNumber(data.roomNumber || data.reservation?.roomNumber || conversation.roomNumber || '');
      setGuestName(
        data.guest?.name ||
          [data.guest?.firstName, data.guest?.lastName].filter(Boolean).join(' ') ||
          'Guest'
      );
      setMessages(Array.isArray(data.messages) ? data.messages.map(toMessage) : []);
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (/expired|invalid|401/i.test(msg)) {
        setExpired(true);
      } else {
        setError(msg || 'Unable to load guest chat');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    loading,
    expired,
    error,
    conversationId,
    hotelName,
    roomNumber,
    guestName,
    messages,
    setMessages,
    reloadAccess: load,
  };
}

// ─── REPLACE entire useGuestPolling ──────────────────────────────────────────
function useGuestPolling(
  token: string,
  conversationId: string | undefined,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  initialMessages: Message[]
) {
  const lastSeenRef = useRef<string | undefined>(undefined);
  const seededRef = useRef(false);

  useEffect(() => {
    // Seed once when initial messages are available
    if (!seededRef.current && initialMessages.length > 0) {
      const latest = [...initialMessages].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      )[0];
      lastSeenRef.current = latest.timestamp.toISOString();
      seededRef.current = true;
    }
  }, [initialMessages]);

  useEffect(() => {
    if (!token || !conversationId) return;

    let mounted = true;

    const poll = async () => {
      if (!mounted) return;
      try {
        if (typeof document !== 'undefined' && document.hidden) return; // pause when tab inactive

        const qs = lastSeenRef.current
          ? `?token=${encodeURIComponent(token)}&since=${encodeURIComponent(lastSeenRef.current)}`
          : `?token=${encodeURIComponent(token)}`;

        const res = await apiFetch<{ success: boolean; data: { messages: ApiMessage[] } }>(
          `/api/chatbot/guest/messages${qs}`
        );

        const incoming = (res?.data?.messages ?? []).map(toMessage);
        if (!incoming.length) return;

        // Update lastSeen to latest timestamp
        const latest = [...incoming].sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        )[0];
        lastSeenRef.current = latest.timestamp.toISOString();

        setMessages((prev) => {
          // Deduplicate by id
          const existingIds = new Set(prev.map((m) => m.id));

          // Deduplicate by content signature — catches tempId vs real _id mismatch
          // Groups messages into 5-second buckets to match optimistic entries
          const existingSigs = new Set(
            prev.map(
              (m) =>
                `${m.role}||${m.text.trim()}||${Math.floor(m.timestamp.getTime() / 5000)}`
            )
          );

          const toAdd = incoming.filter((item) => {
            // Already exists by real ID
            if (existingIds.has(item.id)) return false;

            // Matches an optimistic message (same role + text + ~same time)
            const sig = `${item.role}||${item.text.trim()}||${Math.floor(
              item.timestamp.getTime() / 5000
            )}`;
            if (existingSigs.has(sig)) {
              // Silently upgrade the optimistic entry's id to the real id
              // (do this outside filter via a separate pass below)
              return false;
            }

            return true;
          });

          // Upgrade any matched optimistic entries to their real server IDs
          const upgraded = prev.map((m) => {
            if (m.status !== 'sending' && m.status !== 'delivered') return m;
            const match = incoming.find(
              (item) =>
                `${item.role}||${item.text.trim()}||${Math.floor(item.timestamp.getTime() / 5000)}` ===
                `${m.role}||${m.text.trim()}||${Math.floor(m.timestamp.getTime() / 5000)}`
            );
            if (match && m.id !== match.id) {
              return { ...m, id: match.id, status: 'delivered' as const };
            }
            return m;
          });

          return toAdd.length ? [...upgraded, ...toAdd] : upgraded;
        });
      } catch {
        // silent
      }
    };

    // run once immediately, then poll regularly
    poll();
    const interval = setInterval(poll, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [token, conversationId, setMessages]);
}

function useGuestMenu(token: string) {
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchMenu = useCallback(async () => {
    if (!token) return;
    setMenuLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; data: { items: MenuItem[] } }>(
        `/api/chatbot/guest/menu?token=${encodeURIComponent(token)}`
      );
      setMenuItems(res?.data?.items || []);
      setMenuOpen(true);
    } finally {
      setMenuLoading(false);
    }
  }, [token]);

  return { menuLoading, menuItems, menuOpen, setMenuOpen, fetchMenu };
}

function Header({
  hotelName,
  guestName,
  roomNumber,
}: {
  hotelName: string;
  guestName: string;
  roomNumber: string;
}) {
  return (
    <div
      className="border-b p-5 md:p-6"
      style={{
        borderColor: 'rgba(255,255,255,0.2)',
        background: theme.hero,
        color: '#fff',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
            Guest concierge
          </p>
          <h1 className="mt-1 text-2xl font-semibold">{hotelName}</h1>
          <p className="mt-1 text-sm text-white/80">
            {guestName}{roomNumber ? ` · Room ${roomNumber}` : ''}
          </p>
        </div>

        <div className="rounded-full bg-white/18 px-3 py-1.5 text-xs font-medium backdrop-blur">
          24×7 assistance
        </div>
      </div>
    </div>
  );
}

function ServiceCards({
  onOpenMenu,
  onPick,
}: {
  onOpenMenu: () => void;
  onPick: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {HOTEL_SERVICES.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => (item.title === 'Dining' ? onOpenMenu() : onPick(item.title))}
            className="rounded-3xl border p-4 text-left transition hover:-translate-y-0.5"
            style={{
              background: 'rgba(255,255,255,0.88)',
              borderColor: theme.border,
              boxShadow: '0 8px 24px rgba(255, 122, 69, 0.08)',
            }}
          >
            <div className="text-sm font-semibold" style={{ color: theme.text }}>
              {item.title}
            </div>
            <div className="mt-1 text-xs leading-5" style={{ color: theme.muted }}>
              {item.subtitle}
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onPick(item.text)}
            className="rounded-full px-4 py-2.5 text-sm font-medium transition hover:scale-[1.02]"
            style={{
              background: theme.chip,
              color: theme.text,
              border: '1px solid #ffd3c8',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MenuSheet({
  open,
  onClose,
  loading,
  items,
  onOrderItem,
}: {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  items: MenuItem[];
  onOrderItem: (item: MenuItem, qty?: number, note?: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [vegOnly, setVegOnly] = useState(false);
  const [quickOnly, setQuickOnly] = useState(false);
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  if (!open) return null;

  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category || 'Other')))];

  const filtered = items.filter((item) => {
    const matchesQuery =
      !query ||
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase()) ||
      item.category?.toLowerCase().includes(query.toLowerCase());

    const matchesCategory = activeCategory === 'All' || (item.category || 'Other') === activeCategory;
    const matchesVeg = !vegOnly || !!item.isVeg;
    const matchesQuick =
      !quickOnly ||
      (item.prepTime ? parseInt(item.prepTime.replace(/\D/g, ''), 10) <= 20 : false);

    return matchesQuery && matchesCategory && matchesVeg && matchesQuick;
  });

  const grouped = filtered.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const key = item.category || 'Other';
    acc[key] ||= [];
    acc[key].push(item);
    return acc;
  }, {});

  const totalItems = Object.values(qtyMap).reduce((a, b) => a + b, 0);
  const totalAmount = filtered.reduce((sum, item) => {
    const key = item._id || item.name;
    return sum + (qtyMap[key] || 0) * Number(item.price || 0);
  }, 0);

  const setQty = (key: string, next: number) => {
    setQtyMap((prev) => ({
      ...prev,
      [key]: Math.max(0, next),
    }));
  };

  return (
    <div className="absolute inset-0 z-30 flex items-end bg-black/40 p-0 md:items-center md:justify-center md:p-6">
      <div
        className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[32px] border md:h-[88vh] md:rounded-[32px]"
        style={{
          background: 'rgba(255,250,248,0.94)',
          borderColor: 'rgba(255,255,255,0.4)',
          boxShadow: '0 24px 80px rgba(120, 45, 30, 0.18)',
          backdropFilter: 'blur(24px)',
        }}
      >
        <div
          className="border-b px-5 py-4 md:px-6"
          style={{
            borderColor: theme.border,
            background: 'linear-gradient(135deg, rgba(255,139,94,0.96), rgba(236,91,148,0.92))',
            color: '#fff',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                In-room dining
              </p>
              <h3 className="mt-1 text-xl font-semibold">Restaurant menu</h3>
              <p className="mt-1 text-sm text-white/80">
                Curated for your stay · Freshly prepared and delivered to your room
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur"
              type="button"
            >
              Close
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1 rounded-2xl bg-white/14 px-4 py-3 backdrop-blur">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search dishes, drinks, desserts..."
                className="w-full bg-transparent text-sm text-white placeholder:text-white/70 outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setVegOnly((v) => !v)}
                className={cx(
                  'rounded-full px-3 py-2 text-xs font-semibold transition',
                  vegOnly && 'ring-2 ring-white/60'
                )}
                style={{ background: vegOnly ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.12)' }}
              >
                Veg only
              </button>

              <button
                type="button"
                onClick={() => setQuickOnly((v) => !v)}
                className={cx(
                  'rounded-full px-3 py-2 text-xs font-semibold transition',
                  quickOnly && 'ring-2 ring-white/60'
                )}
                style={{ background: quickOnly ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.12)' }}
              >
                Under 20 min
              </button>
            </div>
          </div>
        </div>

        <div className="border-b px-4 py-3 md:px-6" style={{ borderColor: '#f3d8d1', background: 'rgba(255,255,255,0.7)' }}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium"
                style={{
                  background: activeCategory === cat ? theme.bubble : '#fff',
                  color: activeCategory === cat ? '#fff' : theme.text,
                  border: activeCategory === cat ? 'none' : `1px solid ${theme.border}`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
          {loading ? (
            <div className="py-16 text-center text-sm" style={{ color: theme.muted }}>
              Loading menu...
            </div>
          ) : !filtered.length ? (
            <div className="py-16 text-center">
              <div className="mx-auto max-w-md rounded-[28px] border bg-white p-6" style={{ borderColor: theme.border }}>
                <h4 className="text-lg font-semibold" style={{ color: theme.text }}>
                  No dishes match your filters
                </h4>
                <p className="mt-2 text-sm" style={{ color: theme.muted }}>
                  Try another category or remove a filter to see more items.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([category, list]) => (
                <section key={category}>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: theme.faint }}>
                        {category}
                      </h4>
                      <p className="mt-1 text-xs" style={{ color: theme.muted }}>
                        {list.length} item{list.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {list.map((item, idx) => {
                      const key = item._id || `${category}-${idx}-${item.name}`;
                      const qty = qtyMap[key] || 0;

                      return (
                        <MenuItemCard
                          key={key}
                          item={item as any}
                          quantity={qty}
                          onAdd={() => setQty(key, qty + 1)}
                          onRemove={() => setQty(key, Math.max(0, qty - 1))}
                        />
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="border-t px-4 py-3 md:px-6" style={{ borderColor: theme.border, background: 'rgba(255,255,255,0.85)' }}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: theme.text }}>
                {totalItems} item{totalItems !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs" style={{ color: theme.muted }}>
                Estimated subtotal ₹{totalAmount.toLocaleString('en-IN')}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm font-medium"
              style={{ background: theme.chip, color: theme.text }}
            >
              Continue chatting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function OrderCardBubble({ order }: { order: NonNullable<Message['orderCard']> }) {
  return (
    <div
      className="overflow-hidden rounded-[24px] border"
      style={{
        background: '#fff',
        borderColor: '#f0c8bf',
        boxShadow: '0 8px 28px rgba(243,129,96,0.14)',
        maxWidth: 280,
      }}
    >
      {/* Image */}
      {order.imageUrl ? (
        <div className="aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-orange-50 to-rose-50">
          <img
            src={order.imageUrl}
            alt={order.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div
          className="flex aspect-[16/9] w-full items-center justify-center text-3xl"
          style={{ background: 'linear-gradient(135deg,#fff4ec,#ffe8f4)' }}
        >
          🍽️
        </div>
      )}

      <div className="p-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" style={{ color: '#261815' }}>
              {order.name}
            </p>
            {order.description ? (
              <p className="mt-0.5 line-clamp-2 text-xs leading-4" style={{ color: '#7a5a53' }}>
                {order.description}
              </p>
            ) : null}
          </div>

          {order.isVeg !== undefined ? (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{
                background: order.isVeg ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                color: order.isVeg ? '#15803d' : '#b91c1c',
              }}
            >
              {order.isVeg ? 'VEG' : 'NON-VEG'}
            </span>
          ) : null}
        </div>

        {/* Meta chips */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {order.category ? (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
              style={{ background: '#fff0ea', color: '#ea5d28', border: '1px solid #ffd3c8' }}
            >
              {order.category}
            </span>
          ) : null}
          {order.prepTime ? (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: '#f8f8f8', color: '#7a5a53', border: '1px solid #f0c8bf' }}
            >
              ⏱ {order.prepTime}
            </span>
          ) : null}
        </div>

        {/* Divider */}
        <div className="my-2.5 h-px" style={{ background: '#f0c8bf' }} />

        {/* Price + qty row */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-base font-bold" style={{ color: '#ea5d28' }}>
              ₹{(order.price * order.qty).toLocaleString('en-IN')}
            </span>
            {order.qty > 1 ? (
              <span className="ml-1 text-xs" style={{ color: '#b58c84' }}>
                ({order.qty} × ₹{order.price.toLocaleString('en-IN')})
              </span>
            ) : null}
          </div>

          <span
            className="rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#ff824d,#ea4f89)' }}
          >
            Ordered ✓
          </span>
        </div>

        {/* Note */}
        {order.note ? (
          <p className="mt-2 rounded-xl px-2.5 py-1.5 text-xs" style={{ background: '#fff8f4', color: '#7a5a53', border: '1px solid #f0c8bf' }}>
            📝 {order.note}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onRetry,
}: {
  message: Message;
  onRetry: (id: string) => void;
}) {
  const guest = message.role === 'guest';

  return (
    <div className={cx('flex w-full', guest ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[82%]">
        {!guest && message.senderName ? (
          <p
            className="mb-1 px-1 text-[11px] font-medium uppercase tracking-[0.14em]"
            style={{ color: theme.faint }}
          >
            {message.senderName}
          </p>
        ) : null}

        <div
          className={
            message.orderCard
              ? 'overflow-hidden rounded-[24px] shadow-sm'
              : 'rounded-[24px] px-4 py-3 text-sm leading-6 shadow-sm'
          }
          style={
            message.orderCard
              ? { background: 'transparent' }
              : guest
                ? { background: theme.bubble, color: '#fff', borderBottomRightRadius: 8 }
                : {
                  background: 'rgba(255,255,255,0.92)',
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  borderBottomLeftRadius: 8,
                }
          }
        >
          {/* Image */}
          {message.type === 'image' && message.imageUrl ? (
            <img
              src={message.thumbUrl || message.imageUrl}
              alt={message.imageName || 'Shared image'}
              className="max-h-56 w-auto rounded-xl object-cover"
            />
          ) : null}

          {/* Order card OR plain text — never both */}
          {message.orderCard ? (
            <OrderCardBubble order={message.orderCard} />
          ) : message.text ? (
            <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {message.text}
            </p>
          ) : null}
        </div>

        {/* Checkout overdue action card — rendered outside the bubble */}
        {message.action?.type === 'checkout_overdue' && (
          <CheckoutOverdueCard action={message.action as any} />
        )}

        {/* Timestamp + status */}
        <div
          className={cx(
            'mt-1 flex items-center gap-2 px-1 text-[11px]',
            guest ? 'justify-end' : 'justify-start'
          )}
          style={{ color: theme.faint }}
        >
          <span>{formatTime(message.timestamp)}</span>
          {guest ? <span>{message.status || 'sent'}</span> : null}
          {message.status === 'failed' ? (
            <button
              type="button"
              onClick={() => onRetry(message.id)}
              className="underline"
              style={{ color: theme.red }}
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Composer({
  value,
  setValue,
  onSend,
  sending,
  pendingImage,
  setPendingImage,
  onUploadImage,
}: {
  value: string;
  setValue: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  pendingImage: File | null;
  setPendingImage: (v: File | null) => void;
  onUploadImage: (file: File) => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const canSend = (!!value.trim() || !!pendingImage) && !sending;

  return (
    <div className="border-t p-4" style={{ borderColor: theme.border, background: 'rgba(255,255,255,0.76)' }}>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (!ALLOWED_TYPES.includes(file.type)) return alert('Only image files are allowed');
          if (file.size > MAX_SIZE) return alert('Image must be under 5 MB');
          setPendingImage(file);
          e.currentTarget.value = '';
        }}
      />

      {pendingImage ? (
        <div className="mb-3 flex items-center justify-between rounded-3xl border p-3" style={{ borderColor: theme.border, background: '#fff' }}>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium" style={{ color: theme.text }}>
              {pendingImage.name}
            </p>
            <p className="text-xs" style={{ color: theme.muted }}>
              {(pendingImage.size / 1024).toFixed(0)} KB
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPendingImage(null)}
              className="rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: theme.border }}
            >
              Remove
            </button>
            <button
              type="button"
              onClick={() => pendingImage && onUploadImage(pendingImage)}
              className="rounded-xl px-3 py-2 text-sm font-medium text-white"
              style={{ background: theme.bubble }}
            >
              Send image
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex items-end gap-2 rounded-[28px] border p-2 shadow-sm" style={{ borderColor: '#efc4b7', background: '#fff' }}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="h-11 w-11 rounded-2xl text-lg text-white"
          style={{ background: theme.bubble }}
        >
          +
        </button>

        <textarea
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type your request..."
          className="min-h-[44px] max-h-28 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
          style={{ color: theme.text }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />

        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className="h-11 rounded-2xl px-5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: theme.bubble }}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

function LinkExpired() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ background: theme.bg }}>
      <div className="w-full max-w-md rounded-[32px] border p-8 text-center" style={{ background: '#fff', borderColor: theme.border }}>
        <h1 className="text-xl font-semibold" style={{ color: theme.text }}>
          This guest link has expired
        </h1>
        <p className="mt-3 text-sm" style={{ color: theme.muted }}>
          Please contact reception or request a new guest chat link.
        </p>
      </div>
    </div>
  );
}

export default function GuestChatPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const {
    loading,
    expired,
    conversationId,
    hotelName,
    roomNumber,
    guestName,
    messages,
    setMessages,
  } = useGuestAccess(token);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { menuLoading, menuItems, menuOpen, setMenuOpen, fetchMenu } = useGuestMenu(token);

  // In GuestChatPage:
  useGuestPolling(token, conversationId, setMessages, messages);

  // ── Auto checkout overdue alert ────────────────────────────────────────────
  useEffect(() => {
    if (!token || !conversationId) return;

    const checkOverdue = async () => {
      try {
        // Ask backend: is this reservation overdue?
        const res = await apiFetch<{ success: boolean; data: { isOverdue: boolean; minutesLate: number; roomNumber: string } }>(
          `/api/chatbot/guest/status?token=${encodeURIComponent(token)}`
        );
        const { isOverdue, minutesLate, roomNumber: room } = res?.data ?? {};
        if (!isOverdue) return;

        // Idempotency — one alert per day per token
        const alertKey = `overdue_sent_${token}_${new Date().toDateString()}`;
        if (sessionStorage.getItem(alertKey)) return;
        sessionStorage.setItem(alertKey, '1');

        // 1. Send WhatsApp via notification API
        await apiFetch(`/api/chatbot/guest/notify-overdue`, {
          method: 'POST',
          body: JSON.stringify({ token }),
        });

        // 2. Post bot message into this conversation
        await apiFetch(`/api/chatbot/guest/message`, {
          method: 'POST',
          body: JSON.stringify({
            token,
            text:
              `⏰ *Checkout Overdue — Room ${room}*\n\n` +
              `Your checkout was due at *11:00 AM* and you are now ` +
              `*${minutesLate >= 60 ? `${Math.floor(minutesLate / 60)}h ${minutesLate % 60}m` : `${minutesLate}m`} overdue*.\n\n` +
              `Please visit the front desk or use the options below. 🙏`,
            trigger: 'checkout_overdue',
          }),
        });
      } catch (e) {
        console.warn('Overdue check failed', e);
      }
    };

    checkOverdue(); // run immediately on load
    const interval = setInterval(checkOverdue, 30 * 60 * 1000); // then every 30 min
    return () => clearInterval(interval);
  }, [token, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const groupedMessages = useMemo(() => {
    const groups: Array<{ label: string; items: Message[] }> = [];
    for (const msg of messages) {
      const label = msg.timestamp.toDateString();
      const last = groups[groups.length - 1];
      if (last?.label === label) last.items.push(msg);
      else groups.push({ label, items: [msg] });
    }
    return groups;
  }, [messages]);
  // ─── REPLACE sendText ─────────────────────────────────────────────────────────
  const sendText = useCallback(async (prefilled?: string) => {
    const text = prefilled ?? input.trim();
    if (!text || sending) return;
    const tempId = genId();
    setSending(true);
    setInput('');
    setMessages(prev => [
      ...prev,
      { id: tempId, role: 'guest', text, timestamp: new Date(), type: 'text', status: 'sending' },
    ]);
    try {
      const res = await apiFetch<any>('/api/chatbot/guest/message', {
        method: 'POST',
        body: JSON.stringify({ token, text }),
      });
      // FIX: _id first (MongoDB), then id, then fallback
      const savedId = res?.data?.message?._id ?? res?.data?.message?.id ?? tempId;
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== tempId);
        const alreadyExists = withoutTemp.some(m => m.id === savedId);
        if (alreadyExists) return withoutTemp.map(m => m.id === savedId ? { ...m, status: 'delivered' as const } : m);
        return prev.map(m => m.id === tempId ? { ...m, id: savedId, status: 'delivered' as const } : m);
      });
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' as const } : m));
    } finally {
      setSending(false);
    }
  }, [input, sending, token, setMessages]);

  const retryMessage = useCallback((id: string) => {
    const failed = messages.find((m) => m.id === id);
    if (!failed?.text) return;
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setInput(failed.text);
  }, [messages, setMessages]);

  const uploadImage = useCallback(async (file: File) => {
    if (sending) return;
    const tempId = genId();
    const preview = URL.createObjectURL(file);
    setSending(true);
    setPendingImage(null);
    setMessages(prev => [
      ...prev,
      { id: tempId, role: 'guest', text: '', timestamp: new Date(), type: 'image', imageUrl: preview, imageName: file.name, status: 'sending' },
    ]);
    try {
      const form = new FormData();
      form.append('image', file);
      form.append('token', token);
      const uploadRes = await fetch(`${API_URL}/api/chatbot/upload-image`, {
        method: 'POST',
        body: form,
      });
      const uploadJson = await uploadRes.json().catch(() => null);
      if (!uploadRes.ok || !uploadJson?.success) throw new Error(uploadJson?.message ?? 'Image upload failed');
      const { url, thumbUrl } = uploadJson.data;
      // FIX: use apiFetch correctly + _id first
      const saveRes = await apiFetch<any>('/api/chatbot/guest/message', {
        method: 'POST',
        body: JSON.stringify({ token, messageType: 'image', imageUrl: url, thumbUrl, imageName: file.name, text: 'image' }),
      });
      const savedId = saveRes?.data?.message?._id ?? saveRes?.data?.message?.id ?? tempId;
      setMessages(prev => prev.map(m => m.id === tempId
        ? { ...m, id: savedId, imageUrl: url, thumbUrl, status: 'delivered' as const }
        : m
      ));
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' as const } : m));
    } finally {
      URL.revokeObjectURL(preview);
      setSending(false);
    }
  }, [sending, token, setMessages]);

  const handleMenuOrder = useCallback(async (item: MenuItem, qty = 1, note = '') => {
    setMenuOpen(false);
    const tempId = genId();
    const noteText = note.trim() ? ` Note: ${note.trim()}.` : '';
    const text = `I would like to order ${qty}× ${item.name} for ₹${item.price * qty}.${noteText}`;
    setSending(true);
    setMessages(prev => [
      ...prev,
      {
        id: tempId, role: 'guest', text, timestamp: new Date(), type: 'text', status: 'sending',
        orderCard: {
          name: item.name, price: item.price, qty, note: note.trim() || undefined,
          imageUrl: item.imageUrl, category: item.category, isVeg: item.isVeg,
          description: item.description, prepTime: item.prepTime
        },
      },
    ]);
    try {
      // FIX: correct apiFetch call + _id first
      const res = await apiFetch<any>('/api/chatbot/guest/message', {
        method: 'POST',
        body: JSON.stringify({ token, text }),
      });
      const savedId = res?.data?.message?._id ?? res?.data?.message?.id ?? tempId;
      setMessages(prev => prev.map(m => m.id === tempId
        ? { ...m, id: savedId, status: 'delivered' as const }
        : m
      ));
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' as const } : m));
    } finally {
      setSending(false);
    }
  }, [setMenuOpen, token, setMessages, setSending]);

  if (expired) return <LinkExpired />;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: theme.bg }}>
        <div className="rounded-3xl border px-6 py-5 text-sm" style={{ background: '#fff', borderColor: theme.border, color: theme.muted }}>
          Loading guest concierge...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen md:h-screen" style={{ background: theme.bg }}>
      <div className="mx-auto flex h-screen max-w-6xl p-3 md:p-5">
        <section
          className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-[34px] border"
          style={{
            background: theme.panel,
            borderColor: 'rgba(255,255,255,0.45)',
            boxShadow: theme.shadow,
            backdropFilter: 'blur(18px)',
          }}
        >
          <Header hotelName={hotelName} guestName={guestName} roomNumber={roomNumber} />

          <div className="border-b px-4 py-4 md:px-6" style={{ borderColor: '#f3d8d1', background: 'rgba(255,248,245,0.72)' }}>
            <ServiceCards
              onOpenMenu={fetchMenu}
              onPick={(value) => setInput(value)}
            />
          </div>

          <section className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
            <div className="space-y-6">
              {groupedMessages.map((group) => (
                <div key={group.label}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-px flex-1" style={{ background: '#edd4cc' }} />
                    <span className="text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: theme.faint }}>
                      {group.label}
                    </span>
                    <div className="h-px flex-1" style={{ background: '#edd4cc' }} />
                  </div>

                  <div className="space-y-4">
                    {group.items.map((message) => (
                      <MessageBubble key={message.id} message={message} onRetry={retryMessage} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div ref={bottomRef} />
          </section>

          <Composer
            value={input}
            setValue={setInput}
            onSend={() => sendText()}
            sending={sending}
            pendingImage={pendingImage}
            setPendingImage={setPendingImage}
            onUploadImage={uploadImage}
          />

          <MenuSheet
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            loading={menuLoading}
            items={menuItems}
            onOrderItem={handleMenuOrder}
          />
        </section>
      </div>
    </main>
  );
}