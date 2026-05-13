'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useStaffChatSocket } from '@/hooks/useStaffChatSocket';
import toast from 'react-hot-toast';

type DashboardLayoutProps = {
  children: React.ReactNode;
  title?: string;
  styles?: React.CSSProperties;
};

export function DashboardLayout({
  children,
  title,
  styles,
}: DashboardLayoutProps) {
  const { isAuthenticated, isHydrated, accessToken, tenant } = useAuthStore();
  const tenantId = tenant?.id;
  const token = accessToken ?? undefined;

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      window.location.href = '/auth/login';
    }
  }, [isAuthenticated, isHydrated]);

  useStaffChatSocket({
    tenantId,
    token,
    onNewMessage: (data) => {
      setNotifications((prev) => [data, ...prev].slice(0, 20));
      setUnread((prev) => prev + 1);

      toast.custom(() => (
        <div className="rounded-xl border bg-white p-3 shadow-lg">
          <p className="font-semibold">New guest message</p>
          <p className="text-sm text-slate-600">
            {data.roomNumber ? `Room ${data.roomNumber}: ` : ''}
            {data.preview || data.text || 'New message'}
          </p>
        </div>
      ));
    },
  });

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading HotelOS...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="relative flex min-h-screen bg-[#fcf7f4] text-slate-900">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-orange-200/20 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-pink-200/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-rose-100/20 blur-3xl" />
      </div>

      <Sidebar />

      <div
        className="relative flex min-w-0 flex-1 flex-col lg:ml-72"
        style={styles}
      >
        <Header
          title={title}
          unreadNotifications={unread}
          notifications={notifications}
          onClearNotifications={() => setUnread(0)}
        />
        <main className="flex-1 overflow-y-auto px-2 py-2 sm:px-4 sm:py-4">
          {children}
        </main>
      </div>
    </div>
  );
}