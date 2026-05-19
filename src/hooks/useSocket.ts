'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

let socket: Socket | null = null;

export function useSocket() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const socketRef = useRef<Socket | null>(socket);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const url = process.env.NEXT_PUBLIC_WS_URL || 'http://127.0.0.1:5000';

    if (!socket) {
      socket = io(url, {
        auth: { token: accessToken },
        transports: ['polling', 'websocket'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1500,
        withCredentials: true,
      });

      socket.on('connect', () => {
        console.log('[Socket] connected', socket?.id);
      });

      socket.on('disconnect', (reason) => {
        console.log('[Socket] disconnected', reason);
      });

      socket.on('connect_error', (err) => {
        console.error('[Socket] connect_error', err?.message || err);
      });
    } else {
      socket.auth = { token: accessToken };
      if (!socket.connected) socket.connect();
    }

    socketRef.current = socket;
  }, [isAuthenticated, accessToken]);

  return socketRef.current;
}

export function useSocketEvent<T = any>(
  event: string,
  handler: (data: T) => void,
) {
  const socket = useSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket) return;

    const listener = (data: T) => handlerRef.current(data);
    socket.on(event, listener);

    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}