'use client';

import { useEffect, useState } from 'react';
import {
  Menu,
  Wifi,
  WifiOff,
  Bell,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useUIStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { cn } from '@/lib/utils';
import { useLang } from '@/hooks/useLanguage';
import Link from 'next/link';

function LanguageToggle() {
  const { lang, setLang } = useLang();

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white"
      type="button"
    >
      <span className="text-base">{lang === 'en' ? '🇮🇳' : '🇬🇧'}</span>
      <span>{lang === 'en' ? 'हिंदी' : 'English'}</span>
    </button>
  );
}
type Notification = {
  roomNumber?: string | number;
  text?: string;
  // add other fields your socket payload includes
  [key: string]: any;
};
type HeaderProps = {
  title?: string;
  unreadNotifications?: number;
    notifications?: Notification[];
  onClearNotifications?: () => void;
};

export function Header({
  title,
  unreadNotifications = 0,
}: HeaderProps) {
  const { setSidebarOpen } = useUIStore();
  const { tenant, staff } = useAuth();
  const socket = useSocket();

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    setConnected(socket.connected);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/55">
      <div className="flex h-16 items-center gap-3 px-3 sm:h-20 sm:px-5">
        <button
          onClick={() => setSidebarOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-slate-600 shadow-sm transition-all hover:bg-white hover:text-slate-900 lg:hidden"
          type="button"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          {title && (
            <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-lg">
              {title}
            </h1>
          )}
          <div className="mt-0.5 hidden items-center gap-2 sm:flex">
            <span className="text-xs text-slate-500">
              Welcome back{staff?.name ? `, ${staff.name}` : ''}
            </span>
            {tenant?.hotelName && (
              <>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600">
                  <Sparkles className="h-3.5 w-3.5" />
                  {tenant.hotelName}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex-1" />

        <div
          className={cn(
            'hidden items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold shadow-sm sm:inline-flex',
            connected
              ? 'border-emerald-200 bg-emerald-50/90 text-emerald-700'
              : 'border-slate-200 bg-slate-50/90 text-slate-500'
          )}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={cn(
                'absolute inline-flex h-full w-full rounded-full opacity-75',
                connected ? 'animate-ping bg-emerald-400' : 'bg-slate-300'
              )}
            />
            <span
              className={cn(
                'relative inline-flex h-2.5 w-2.5 rounded-full',
                connected ? 'bg-emerald-500' : 'bg-slate-400'
              )}
            />
          </span>
          {connected ? (
            <Wifi className="h-3.5 w-3.5" />
          ) : (
            <WifiOff className="h-3.5 w-3.5" />
          )}
          <span>{connected ? 'Live' : 'Offline'}</span>
        </div>

        {tenant?.subscription.status === 'trial' && (
          <span className="hidden items-center rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 shadow-sm sm:inline-flex">
            Trial · {tenant.trialDaysLeft}d left
          </span>
        )}

        <LanguageToggle />
        <Link href="/dashboard/notifications">
        <button
          type="button"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-slate-600 shadow-sm transition-all hover:bg-white hover:text-slate-900"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-1.5 text-[10px] font-bold text-white shadow-md">
              {unreadNotifications > 99 ? '99+' : unreadNotifications}
            </span>
          )}
        </button>
        </Link>
        

        <button
          type="button"
          className="hidden items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-2 py-2 shadow-sm transition-all hover:bg-white sm:inline-flex"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-sm font-bold text-white">
            {staff?.name?.charAt(0)?.toUpperCase() || 'H'}
          </div>
          <div className="text-left leading-tight">
            <p className="max-w-[120px] truncate text-sm font-semibold text-slate-900">
              {staff?.name || 'Hotel Staff'}
            </p>
            <p className="text-xs capitalize text-slate-500">
              {staff?.role?.replace('_', ' ') || 'Staff'}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    </header>
  );
}