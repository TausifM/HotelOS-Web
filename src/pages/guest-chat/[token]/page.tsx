'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type MessageRole = 'guest' | 'bot' | 'staff';
type MessageType = 'text' | 'image' | 'actionresult';
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

type ActionType =
  | 'restaurantorder'
  | 'housekeeping'
  | 'maintenance'
  | 'folio'
  | 'checkout'
  | 'stayextension'
  | 'escalation';

type StatusBadge = 'pending' | 'preparing' | 'ready' | 'delivered';

interface ActionResult {
  type: ActionType;
  items?: string[];
  summary?: string;
  issueTitle?: string;
  total?: number;
  newCheckout?: string;
  amount?: number;
  paymentLink?: string;
  status?: StatusBadge;
}

interface ApiMessage {
  _id?: string;
  id?: string;
  senderType: MessageRole;
  text?: string;
  messageType?: MessageType;
  actionResult?: ActionResult;
  mediaUrl?: string;
  imageUrl?: string;
  thumbUrl?: string;
  imageName?: string;
  createdAt?: string;
  senderName?: string;
  status?: MessageStatus;
}

interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
  type: MessageType;
  actionResult?: ActionResult;
  imageUrl?: string;
  thumbUrl?: string;
  imageName?: string;
  status?: MessageStatus;
  senderName?: string;
}

interface GuestProfile {
  firstName?: string;
  lastName?: string;
  name?: string;
}

interface ConversationData {
  _id?: string;
  id?: string;
  roomNumber?: string;
  tenantId?: string;
  subject?: string;
}

interface GuestAccessResponseData {
  conversation?: ConversationData;
  conversationId?: string;
  messages?: ApiMessage[];
  guest?: GuestProfile;
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

interface MenuItem {
  name: string;
  price: number;
  category: string;
  description?: string;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
const SOCKET_URL = (process.env.NEXT_PUBLIC_SOCKET_URL || API_URL).replace(/\/$/, '');
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'];

const palette = {
  bg: '#f6f2ec',
  surface: '#ffffff',
  surfaceSoft: '#fbf8f4',
  border: '#e7ded3',
  text: '#1f1b16',
  muted: '#6f675f',
  faint: '#9f968d',
  primary: '#8b5e3c',
  primaryDark: '#6f492d',
  success: '#1f7a5a',
  warning: '#9b6b12',
  danger: '#b14444',
};

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
    id: m._id || m.id || genId(),
    role: m.senderType,
    text: m.text || '',
    timestamp: new Date(m.createdAt || Date.now()),
    type: m.messageType || (m.imageUrl || m.mediaUrl ? 'image' : 'text'),
    actionResult: m.actionResult,
    imageUrl: m.imageUrl || m.mediaUrl,
    thumbUrl: m.thumbUrl,
    imageName: m.imageName,
    senderName: m.senderName,
    status: m.status || 'read',
  };
}

async function apiFetch<T = any>(path: string, init?: RequestInit) {
  if (!API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured');
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.message || `Request failed with ${res.status}`);
  }

  return json as T;
}

function useGuestAccess(token: string) {
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [conversationId, setConversationId] = useState<string>('');
  const [hotelName, setHotelName] = useState<string>('Hotel');
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);

  const load = useCallback(async () => {
    if (!token) {
      setExpired(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

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

      const resolvedConversationId =
        data.conversationId || conversation._id || conversation.id || '';

      const resolvedHotelName =
        data.hotelName ||
        data.tenant?.hotelName ||
        data.reservation?.hotelName ||
        'Hotel';

      const resolvedRoomNumber =
        data.roomNumber ||
        data.reservation?.roomNumber ||
        conversation.roomNumber ||
        '';

      const resolvedGuestName =
        data.guest?.name ||
        [data.guest?.firstName, data.guest?.lastName].filter(Boolean).join(' ') ||
        'Guest';

      setConversationId(resolvedConversationId);
      setHotelName(resolvedHotelName);
      setRoomNumber(resolvedRoomNumber);
      setGuestName(resolvedGuestName);
      setMessages(Array.isArray(data.messages) ? data.messages.map(toMessage) : []);
    } catch (err: any) {
      const message = String(err?.message || '');
      if (/expired|invalid|401/i.test(message)) {
        setExpired(true);
      } else {
        setError(message || 'Failed to load guest chat');
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
    setError,
    conversationId,
    hotelName,
    roomNumber,
    guestName,
    messages,
    setMessages,
    reload: load,
  };
}

function useGuestSocket({
  token,
  conversationId,
  onMessage,
  onTyping,
  onAck,
  onError,
}: {
  token: string;
  conversationId: string;
  onMessage: (payload: any) => void;
  onTyping: (payload: any) => void;
  onAck: (payload: any) => void;
  onError: (payload: any) => void;
}) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token || !conversationId || !SOCKET_URL) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('guest:join', { token, conversationId });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', () => {
      setConnected(false);
    });

    socket.on('chat:new-message', onMessage);
    socket.on('chat:typing', onTyping);
    socket.on('chat:ack', onAck);
    socket.on('chat:error', onError);

    return () => {
      socket.off('chat:new-message', onMessage);
      socket.off('chat:typing', onTyping);
      socket.off('chat:ack', onAck);
      socket.off('chat:error', onError);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, conversationId, onMessage, onTyping, onAck, onError]);

  return { connected, socketRef };
}

function useGuestPolling({
  enabled,
  token,
  conversationId,
  setMessages,
}: {
  enabled: boolean;
  token: string;
  conversationId: string;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}) {
  const lastSeenRef = useRef<string>('');

  useEffect(() => {
    if (!enabled || !token || !conversationId) return;

    const interval = setInterval(async () => {
      try {
        const qs = lastSeenRef.current
          ? `?token=${encodeURIComponent(token)}&since=${encodeURIComponent(lastSeenRef.current)}`
          : `?token=${encodeURIComponent(token)}`;

        const res = await apiFetch<{ success: boolean; data: { messages: ApiMessage[] } }>(
          `/api/chatbot/guest/messages${qs}`
        );

        const incoming = (res?.data?.messages || []).map(toMessage);

        if (incoming.length) {
          lastSeenRef.current = incoming[incoming.length - 1].timestamp.toISOString();
          setMessages((prev) => {
            const existing = new Set(prev.map((m) => m.id));
            const merged = [...prev];
            for (const item of incoming) {
              if (!existing.has(item.id)) merged.push(item);
            }
            return merged;
          });
        }
      } catch {
        // silent fallback
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [enabled, token, conversationId, setMessages]);
}

function useMenu(token: string) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<MenuItem[]>([]);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; data: { items: MenuItem[] } }>(
        `/api/chatbot/menu?token=${encodeURIComponent(token)}`
      );
      const next = res?.data?.items || [];
      setItems(next);
      return next;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return { items, loading, fetchMenu };
}

function Header({
  hotelName,
  guestName,
  roomNumber,
  connected,
}: {
  hotelName: string;
  guestName: string;
  roomNumber: string;
  connected: boolean;
}) {
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between border-b px-4 py-4 md:px-6"
      style={{ background: 'rgba(246,242,236,0.92)', borderColor: palette.border, backdropFilter: 'blur(10px)' }}
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: palette.faint }}>
          Guest concierge
        </p>
        <h1 className="truncate text-lg font-semibold" style={{ color: palette.text }}>
          {hotelName}
        </h1>
        <p className="truncate text-sm" style={{ color: palette.muted }}>
          {guestName}{roomNumber ? ` · Room ${roomNumber}` : ''}
        </p>
      </div>

      <div
        className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
        style={{
          borderColor: connected ? '#b6dfd0' : palette.border,
          background: connected ? '#eefaf4' : palette.surface,
          color: connected ? palette.success : palette.muted,
        }}
      >
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: connected ? palette.success : '#b7b0a7' }}
        />
        {connected ? 'Live' : 'Polling'}
      </div>
    </header>
  );
}

function EmptyState({ hotelName }: { hotelName: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border text-xl font-semibold"
        style={{ background: palette.surface, borderColor: palette.border, color: palette.primary }}
      >
        {hotelName.charAt(0).toUpperCase()}
      </div>
      <h2 className="text-lg font-semibold" style={{ color: palette.text }}>
        Welcome to {hotelName}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6" style={{ color: palette.muted }}>
        Ask for room service, housekeeping, maintenance, billing, checkout, or any stay assistance.
      </p>
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
      <div className="max-w-[80%]">
        {!guest && message.senderName ? (
          <p className="mb-1 px-1 text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: palette.faint }}>
            {message.senderName}
          </p>
        ) : null}

        <div
          className="rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm"
          style={
            guest
              ? {
                  background: palette.primary,
                  color: '#fff',
                  borderBottomRightRadius: 8,
                }
              : {
                  background: palette.surface,
                  color: palette.text,
                  border: `1px solid ${palette.border}`,
                  borderBottomLeftRadius: 8,
                }
          }
        >
          {message.type === 'image' && message.imageUrl ? (
            <img
              src={message.thumbUrl || message.imageUrl}
              alt={message.imageName || 'Shared image'}
              className="max-h-56 w-auto rounded-xl object-cover"
            />
          ) : null}

          {message.text ? <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.text}</p> : null}

          {message.actionResult ? (
            <div
              className="mt-3 rounded-xl border px-3 py-2 text-xs"
              style={{
                borderColor: guest ? 'rgba(255,255,255,0.2)' : palette.border,
                background: guest ? 'rgba(255,255,255,0.08)' : palette.surfaceSoft,
              }}
            >
              <span className="font-semibold">{message.actionResult.type}</span>
              {message.actionResult.summary ? ` · ${message.actionResult.summary}` : ''}
              {typeof message.actionResult.total === 'number'
                ? ` · ₹${message.actionResult.total.toLocaleString('en-IN')}`
                : ''}
            </div>
          ) : null}
        </div>

        <div className={cx('mt-1 flex items-center gap-2 px-1 text-[11px]', guest ? 'justify-end' : 'justify-start')} style={{ color: palette.faint }}>
          <span>{formatTime(message.timestamp)}</span>
          {guest ? <span>{message.status || 'sent'}</span> : null}
          {message.status === 'failed' ? (
            <button
              onClick={() => onRetry(message.id)}
              className="font-medium underline"
              style={{ color: palette.danger }}
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
    <footer className="border-t p-3 md:p-4" style={{ borderColor: palette.border, background: palette.surfaceSoft }}>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          if (!ALLOWED_TYPES.includes(file.type)) {
            alert('Only JPEG, PNG, WebP, GIF and HEIC images are allowed');
            return;
          }

          if (file.size > MAX_SIZE) {
            alert('Image must be under 5 MB');
            return;
          }

          setPendingImage(file);
          e.currentTarget.value = '';
        }}
      />

      {pendingImage ? (
        <div
          className="mb-3 flex items-center justify-between rounded-2xl border px-3 py-3"
          style={{ borderColor: palette.border, background: palette.surface }}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium" style={{ color: palette.text }}>
              {pendingImage.name}
            </p>
            <p className="text-xs" style={{ color: palette.muted }}>
              {(pendingImage.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPendingImage(null)}
              className="rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: palette.border, color: palette.muted }}
            >
              Remove
            </button>
            <button
              onClick={() => pendingImage && onUploadImage(pendingImage)}
              className="rounded-xl px-3 py-2 text-sm font-medium text-white"
              style={{ background: palette.primary }}
            >
              Send image
            </button>
          </div>
        </div>
      ) : null}

      <div
        className="flex items-end gap-2 rounded-[22px] border bg-white p-2"
        style={{ borderColor: palette.border }}
      >
        <button
          onClick={() => fileRef.current?.click()}
          className="h-10 w-10 rounded-xl border text-sm"
          style={{ borderColor: palette.border, color: palette.muted }}
          type="button"
        >
          +
        </button>

        <textarea
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Message the hotel"
          className="max-h-28 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
          style={{ color: palette.text }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />

        <button
          onClick={onSend}
          disabled={!canSend}
          className="h-10 rounded-xl px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: palette.primary }}
          type="button"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>

      <p className="mt-2 text-center text-[11px]" style={{ color: palette.faint }}>
        Press Enter to send · Shift+Enter for new line
      </p>
    </footer>
  );
}

function LinkExpired() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ background: palette.bg }}>
      <div className="w-full max-w-md rounded-3xl border p-8 text-center shadow-sm" style={{ borderColor: palette.border, background: palette.surface }}>
        <h1 className="text-xl font-semibold" style={{ color: palette.text }}>
          This guest link has expired
        </h1>
        <p className="mt-3 text-sm leading-6" style={{ color: palette.muted }}>
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
  const { token } = React.use(params);
  const {
    loading,
    expired,
    error,
    setError,
    conversationId,
    hotelName,
    roomNumber,
    guestName,
    messages,
    setMessages,
  } = useGuestAccess(token);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);

  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const optimisticMap = useRef<Record<string, string>>({});

  const onSocketMessage = useCallback((raw: any) => {
    const incoming = toMessage({
      _id: raw?._id || raw?.id,
      id: raw?.id,
      senderType: raw?.senderType || raw?.role || 'staff',
      text: raw?.text,
      messageType: raw?.messageType || raw?.type,
      actionResult: raw?.actionResult,
      imageUrl: raw?.imageUrl || raw?.mediaUrl,
      thumbUrl: raw?.thumbUrl,
      imageName: raw?.imageName,
      createdAt: raw?.createdAt,
      senderName: raw?.senderName,
      status: raw?.status || 'delivered',
    });

    setMessages((prev) => {
      const exists = prev.some((m) => m.id === incoming.id);
      if (exists) return prev;
      return [...prev, incoming];
    });

    setIsTyping(false);
  }, [setMessages]);

  const onSocketTyping = useCallback(() => {
    setIsTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setIsTyping(false), 2500);
  }, []);

  const onSocketAck = useCallback((payload: any) => {
    const tempId = payload?.tempId;
    const messageId = payload?.messageId;

    if (!tempId) return;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === tempId
          ? { ...m, id: messageId || m.id, status: 'delivered' }
          : m
      )
    );

    setSending(false);
  }, []);

  const onSocketError = useCallback((payload: any) => {
    setError(payload?.message || 'Socket error');
    setSending(false);
  }, [setError]);

  const { connected, socketRef } = useGuestSocket({
    token,
    conversationId,
    onMessage: onSocketMessage,
    onTyping: onSocketTyping,
    onAck: onSocketAck,
    onError: onSocketError,
  });

  useGuestPolling({
    enabled: !!conversationId && !connected,
    token,
    conversationId,
    setMessages,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const groupedMessages = useMemo(() => {
    const groups: Array<{ label: string; items: Message[] }> = [];
    for (const msg of messages) {
      const label = msg.timestamp.toDateString();
      const last = groups[groups.length - 1];
      if (last?.label === label) {
        last.items.push(msg);
      } else {
        groups.push({ label, items: [msg] });
      }
    }
    return groups;
  }, [messages]);

  const sendText = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    const tempId = genId();
    setSending(true);
    setInput('');

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        role: 'guest',
        text,
        timestamp: new Date(),
        type: 'text',
        status: 'sending',
      },
    ]);

    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit('guest:message', {
          tempId,
          token,
          conversationId,
          text,
        });

        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId && m.status === 'sending'
                ? { ...m, status: 'failed' }
                : m
            )
          );
          setSending(false);
        }, 5000);

        return;
      }

      const res = await apiFetch<any>('/api/chatbot/guest/message', {
        method: 'POST',
        body: JSON.stringify({ token, text }),
      });

      const savedId = res?.data?._id || res?.data?.id || tempId;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, id: savedId, status: 'delivered' } : m
        )
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m))
      );
      setError(err?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [input, sending, token, conversationId, setMessages, setError, socketRef]);

  const retryMessage = useCallback((id: string) => {
    const failed = messages.find((m) => m.id === id);
    if (!failed?.text) return;

    setMessages((prev) => prev.filter((m) => m.id !== id));
    setInput(failed.text);
  }, [messages]);

  const uploadImage = useCallback(async (file: File) => {
    if (sending) return;

    const tempId = genId();
    const preview = URL.createObjectURL(file);

    setSending(true);
    setPendingImage(null);

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        role: 'guest',
        text: '',
        timestamp: new Date(),
        type: 'image',
        imageUrl: preview,
        imageName: file.name,
        status: 'sending',
      },
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

      if (!uploadRes.ok || !uploadJson?.success) {
        throw new Error(uploadJson?.message || 'Image upload failed');
      }

      const { url, thumbUrl } = uploadJson.data || {};

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, imageUrl: url, thumbUrl, status: 'delivered' }
            : m
        )
      );

      if (socketRef.current?.connected) {
        socketRef.current.emit('guest:message', {
          tempId,
          token,
          conversationId,
          text: '[image]',
          imageUrl: url,
          thumbUrl,
          messageType: 'image',
        });
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m))
      );
      setError(err?.message || 'Failed to upload image');
    } finally {
      URL.revokeObjectURL(preview);
      setSending(false);
    }
  }, [conversationId, sending, setError, setMessages, socketRef, token]);

  if (expired) return <LinkExpired />;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: palette.bg }}>
        <div className="rounded-3xl border px-6 py-5 text-sm" style={{ borderColor: palette.border, background: palette.surface, color: palette.muted }}>
          Loading guest concierge...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen md:h-screen" style={{ background: palette.bg }}>
      <div className="mx-auto flex h-screen max-w-6xl overflow-hidden md:border-x" style={{ borderColor: palette.border }}>
        <section className="flex min-w-0 flex-1 flex-col">
          <Header
            hotelName={hotelName}
            guestName={guestName}
            roomNumber={roomNumber}
            connected={connected}
          />

          {error ? (
            <div className="border-b px-4 py-3 text-sm" style={{ borderColor: '#f3caca', background: '#fff1f1', color: palette.danger }}>
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-3 underline"
              >
                Dismiss
              </button>
            </div>
          ) : null}

          <section className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6" style={{ background: palette.bg }}>
            {messages.length === 0 ? <EmptyState hotelName={hotelName} /> : null}

            <div className="space-y-6">
              {groupedMessages.map((group) => (
                <div key={group.label}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-px flex-1" style={{ background: palette.border }} />
                    <span className="text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: palette.faint }}>
                      {group.label}
                    </span>
                    <div className="h-px flex-1" style={{ background: palette.border }} />
                  </div>

                  <div className="space-y-4">
                    {group.items.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        onRetry={retryMessage}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {isTyping ? (
              <div className="mt-4 text-sm" style={{ color: palette.muted }}>
                Hotel team is typing...
              </div>
            ) : null}

            <div ref={bottomRef} />
          </section>

          <Composer
            value={input}
            setValue={setInput}
            onSend={sendText}
            sending={sending}
            pendingImage={pendingImage}
            setPendingImage={setPendingImage}
            onUploadImage={uploadImage}
          />
        </section>
      </div>
    </main>
  );
}