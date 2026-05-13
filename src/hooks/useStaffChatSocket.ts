'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

type StaffChatPayload = {
  conversationId?: string;
  preview?: string;
  roomNumber?: string;
  senderType?: 'guest' | 'bot' | 'staff' | 'system';
  text?: string;
  [k: string]: any;
};

export function useStaffChatSocket({
  tenantId,
  token,
  onNewMessage,
}: {
  tenantId?: string;
  token?: string;
  onNewMessage: (data: StaffChatPayload) => void;
}) {
  const handlerRef = useRef(onNewMessage);
  handlerRef.current = onNewMessage;

  useEffect(() => {
    if (!tenantId || !token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;

    const socket: Socket = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('[STAFF socket] connected', socket.id);
    });

    socket.on('connect_error', (e) => {
      console.error('[STAFF socket] connect_error', e.message);
    });

    socket.on('chat:new_guest_message', (data) => {
      console.log('[STAFF socket] chat:new_guest_message', data);
      handlerRef.current(data);
    });

    socket.onAny((event, ...args) => {
      console.log('[STAFF socket] event', event, args);
    });

    return () => {
      socket.disconnect();
    };
  }, [tenantId, token]);
}