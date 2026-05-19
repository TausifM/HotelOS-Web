'use client';

import { useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';

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
  const socket = useSocket();
  const handlerRef = useRef(onNewMessage);
  handlerRef.current = onNewMessage;

  useEffect(() => {
    if (!socket || !tenantId || !token) return;

    const handleGuestMessage = (data: StaffChatPayload) => {
      handlerRef.current(data);
    };

    socket.on('chat:new_guest_message', handleGuestMessage);

    return () => {
      socket.off('chat:new_guest_message', handleGuestMessage);
    };
  }, [socket, tenantId, token]);
}