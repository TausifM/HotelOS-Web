'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

let socket: Socket | null = null;

export function useSocket() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000', {
        auth: { token: accessToken },
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });
      socket.on('connect', () => console.log('[Socket] connected'));
      socket.on('disconnect', () => console.log('[Socket] disconnected'));
    }

    socketRef.current = socket;
  }, [isAuthenticated, accessToken]);

  return socketRef.current;
}

export function useSocketEvent<T = any>(event: string, handler: (data: T) => void) {
  const sock = useSocket();
  useEffect(() => {
    if (!sock) return;
    sock.on(event, handler);
    return () => { sock.off(event, handler); };
  }, [sock, event, handler]);
}
