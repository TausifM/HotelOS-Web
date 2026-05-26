'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

function getWsUrl() {
  return (process.env.NEXT_PUBLIC_WS_URL || 'https://aiatithi.onrender.com').replace(/\/$/, '');
}

// Module-level singleton
let socket: Socket | null = null;
let socketUrl = '';

export function useSocket(): Socket | null {
  const { accessToken, isAuthenticated } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [, forceUpdate] = useState(0); // triggers re-render on connect

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      // Clean up if user logs out
      if (socket) {
        socket.disconnect();
        socket = null;
        socketUrl = '';
        socketRef.current = null;
        forceUpdate(n => n + 1);
      }
      return;
    }

    const url = getWsUrl();

    // Destroy stale socket if URL changed
    if (socket && socketUrl !== url) {
      socket.disconnect();
      socket = null;
      socketUrl = '';
    }

    if (!socket) {
      socket = io(url, {
        auth: { token: accessToken },
        // polling first — lets handshake succeed on Render cold starts,
        // then upgrades to WebSocket automatically
        transports: ['polling', 'websocket'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1500,
        withCredentials: true,
      });

      socketUrl = url;

      socket.on('connect', () => {
        console.log('[Socket] connected', socket?.id);
        socketRef.current = socket;
        forceUpdate(n => n + 1); // notify consumers the socket is now live
      });

      socket.on('disconnect', (reason) => {
        console.log('[Socket] disconnected', reason);
        forceUpdate(n => n + 1);
      });

      socket.on('connect_error', (err) => {
        // Log full error — empty {} means err.message / err.type were undefined
        console.error('[Socket] connect_error:', err.message, err.cause ?? err);
      });
    } else {
      // Refresh token on existing socket
      (socket as any).auth = { token: accessToken };
      if (!socket.connected) socket.connect();
    }

    socketRef.current = socket;
  }, [isAuthenticated, accessToken]);

  // Cleanup on unmount (optional — singleton persists across pages by design)
  // Remove this block if you want the socket to stay alive across page navigations
  useEffect(() => {
    return () => {
      // Do NOT disconnect here — singleton must survive page changes
      // Only disconnect on logout (handled above in the auth effect)
    };
  }, []);

  return socketRef.current;
}

export function useSocketEvent<T = any>(
  event: string,
  callback: (data: T) => void
) {
  const callbackRef = useRef(callback);

  // Always keep the ref up to date without re-subscribing
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Wait until socket exists — retried when socket connects via forceUpdate above
    if (!socket) return;

    const handler = (data: T) => callbackRef.current(data);
    socket.on(event, handler);

    return () => {
      socket?.off(event, handler);
    };
  }, [event]); // re-subscribe only if event name changes
}