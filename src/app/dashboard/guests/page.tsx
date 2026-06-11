'use client';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Spinner } from '@/components/ui';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  Plus, Search, Star, ShieldCheck, Users, Phone,
  Calendar, ChevronLeft, ChevronRight, AlertCircle,
  UserPlus, Crown, ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────
interface LoyaltyInfo {
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  points?: number;
}

interface Guest {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isVip: boolean;
  stayCount: number;
  idVerified: boolean;
  lastStayAt?: string;
  loyalty?: LoyaltyInfo;
}

interface GuestsResponse {
  docs: Guest[];
  totalDocs: number;
  totalPages: number;
  vipCount?: number;
  platinumCount?: number;
}

// ── Tier config ───────────────────────────────────────────────────────────────
const TIER_META: Record<string, { emoji: string; bg: string; text: string }> = {
  bronze: { emoji: '🥉', bg: '#fff7ed', text: '#b45309' },
  silver: { emoji: '🥈', bg: '#f1f5f9', text: '#475569' },
  gold: { emoji: '🥇', bg: '#fffbeb', text: '#b45309' },
  platinum: { emoji: '💎', bg: '#f5f3ff', text: '#7c3aed' },
};

const TIER_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Bronze', value: 'bronze', emoji: '🥉' },
  { label: 'Silver', value: 'silver', emoji: '🥈' },
  { label: 'Gold', value: 'gold', emoji: '🥇' },
  { label: 'Platinum', value: 'platinum', emoji: '💎' },
];

// Deterministic gradient from first character
function avatarGrad(name = ''): string {
  const gradients = [
    'linear-gradient(135deg,#F97316,#F43F5E)',
    'linear-gradient(135deg,#8b5cf6,#6366f1)',
    'linear-gradient(135deg,#10b981,#059669)',
    'linear-gradient(135deg,#3b82f6,#2563eb)',
    'linear-gradient(135deg,#f59e0b,#d97706)',
  ];
  return gradients[(name.charCodeAt(0) ?? 0) % gradients.length];
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function GuestsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<GuestsResponse>({
    queryKey: ['guests', search, tier, page],
    queryFn: () =>
      api
        .get('/api/guests', {
          params: { search, tier: tier || undefined, page, limit: 25 },
        })
        .then(r => r.data.data),
    placeholderData: p => p,
  });

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['guests'] });
  };
  
  useEffect(() => {
    qc.invalidateQueries({ queryKey: ['guests'] });
  }, []);
  return (
    <DashboardLayout title="Guests">
      <div className="space-y-5 pb-10">

        {/* ── HERO HEADER ──────────────────────────────────────────────────── */}
        <div
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden px-5 py-6 sm:px-8 sm:py-8 text-white"
          style={{ background: 'linear-gradient(135deg,#F97316 0%,#F43F5E 100%)' }}
        >
          {/* Decorative blobs */}
          <div
            className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full opacity-20"
            style={{ background: 'rgba(255,255,255,0.3)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-6 left-20 h-24 w-24 rounded-full opacity-10"
            style={{ background: 'rgba(255,255,255,0.5)' }}
          />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            {/* Left: title block */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  <Users className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                  Guest Management
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                Guest Directory
              </h1>
              <p className="mt-1 text-sm opacity-80">
                {data?.totalDocs ?? 0} total guests · loyalty profiles & stay history
              </p>
            </div>

            {/* Right: stat chips + new guest CTA */}
            <div className="flex gap-3 flex-wrap sm:flex-nowrap items-center">
              {[
                { label: 'Total', value: data?.totalDocs ?? '—', icon: Users },
                { label: 'VIP', value: data?.vipCount ?? '—', icon: Star },
                { label: 'Platinum', value: data?.platinumCount ?? '—', icon: Crown },
              ].map(stat => (
                <div
                  key={stat.label}
                  className="flex items-center gap-2 rounded-2xl px-4 py-2.5 min-w-[100px]"
                  style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}
                >
                  <stat.icon className="h-4 w-4 opacity-80 flex-shrink-0" />
                  <div>
                    <p className="text-xs opacity-70 leading-none">{stat.label}</p>
                    <p className="text-sm font-bold mt-0.5">{stat.value}</p>
                  </div>
                </div>
              ))}

              <Link href="/dashboard/guests/new">
                <div
                  className="flex items-center gap-2 rounded-2xl px-4 py-2.5 cursor-pointer transition-all hover:opacity-90 active:scale-95"
                  style={{
                    background: 'rgba(255,255,255,0.25)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="text-sm font-bold whitespace-nowrap">New Guest</span>
                </div>
              </Link>

              <div
                onClick={refreshAll}
                className="flex items-center gap-2 rounded-2xl px-4 py-2.5 cursor-pointer transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm font-bold">Refresh</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── FILTERS + SEARCH ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Tier pills */}
          <div className="flex gap-2 flex-wrap">
            {TIER_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => { setTier(f.value); setPage(1); }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
                style={
                  tier === f.value
                    ? {
                      background: 'linear-gradient(135deg,#F97316,#F43F5E)',
                      color: '#fff',
                      boxShadow: '0 2px 8px rgba(249,115,22,0.35)',
                    }
                    : {
                      background: '#fff',
                      color: '#64748b',
                      border: '1px solid #e2e8f0',
                    }
                }
              >
                {'emoji' in f && <span>{f.emoji}</span>}
                {f.label}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="relative sm:ml-auto w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all placeholder:text-gray-400"
              placeholder="Search by name, phone, email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* ── MAIN TABLE CARD ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">

          {/* Column header — only shown when data exists */}
          {!isLoading && !!data?.docs?.length && (
            <div
              className="hidden md:grid px-5 py-3 border-b border-gray-100"
              style={{
                gridTemplateColumns: '2.5fr 1.4fr 1.6fr 0.7fr 1fr 1.1fr',
                background: '#f9fafb',
              }}
            >
              {['GUEST', 'PHONE', 'LOYALTY', 'STAYS', 'ID', 'LAST STAY'].map(h => (
                <p key={h} className="text-xs font-bold text-gray-400 tracking-wider">{h}</p>
              ))}
            </div>
          )}

          {/* ── Loading state ── */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Spinner />
              <p className="text-sm text-gray-400">Loading guest profiles...</p>
            </div>

            /* ── Empty state ── */
          ) : !data?.docs?.length ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div
                className="h-16 w-16 rounded-3xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}
              >
                <Users className="h-8 w-8 text-orange-400" />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-800">No guests found</p>
                <p className="text-sm text-gray-400 mt-1">
                  {search || tier
                    ? 'Try adjusting your search or filters'
                    : 'Add your first guest to get started'}
                </p>
              </div>
              <Link href="/dashboard/guests/new">
                <button
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}
                >
                  <Plus className="h-4 w-4" />
                  Add Guest
                </button>
              </Link>
            </div>

            /* ── Data rows ── */
          ) : (
            <div className="divide-y divide-gray-50">
              {data.docs.map((g: Guest) => {
                const tm = TIER_META[g.loyalty?.tier ?? ''];
                return (
                  <div
                    key={g._id}
                    onClick={() => router.push(`/dashboard/guests/${g._id}`)}
                    className="group grid grid-cols-1 md:grid-cols-[2.5fr_1.4fr_1.6fr_0.7fr_1fr_1.1fr] gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-orange-50/40 items-center"
                  >
                    {/* Guest name + avatar */}
                    <div className="flex items-center gap-3">
                      <div
                        className="relative w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ background: avatarGrad(g.firstName) }}
                      >
                        {g.firstName?.[0]?.toUpperCase()}
                        {g.isVip && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-400 flex items-center justify-center">
                            <Star className="h-2.5 w-2.5 text-white fill-white" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate flex items-center gap-1.5">
                          {g.firstName} {g.lastName}
                          {g.isVip && (
                            <span
                              className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: '#fffbeb', color: '#b45309' }}
                            >
                              VIP
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{g.email}</p>
                      </div>
                      {/* Mobile expand arrow */}
                      <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-orange-400 ml-auto md:hidden transition-colors flex-shrink-0" />
                    </div>

                    {/* Phone */}
                    <div className="hidden md:flex items-center gap-1.5 text-sm text-gray-700">
                      <Phone className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                      <span>{g.phone || '—'}</span>
                    </div>

                    {/* Loyalty */}
                    <div className="hidden md:block">
                      {g.loyalty?.tier && tm ? (
                        <div className="flex flex-col gap-0.5">
                          <span
                            className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full w-fit capitalize"
                            style={{ background: tm.bg, color: tm.text }}
                          >
                            {tm.emoji} {g.loyalty.tier}
                          </span>
                          <span className="text-xs text-gray-400 pl-1">
                            {(g.loyalty.points ?? 0).toLocaleString()} pts
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </div>

                    {/* Stays */}
                    <div className="hidden md:flex items-center justify-start">
                      <span className="text-sm font-bold text-gray-900">
                        {g.stayCount ?? 0}
                      </span>
                    </div>

                    {/* ID verification */}
                    <div className="hidden md:block">
                      {g.idVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-lg">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                          <AlertCircle className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                    </div>

                    {/* Last stay */}
                    <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500">
                      {g.lastStayAt ? (
                        <>
                          <Calendar className="h-3 w-3 text-gray-300 flex-shrink-0" />
                          {formatDate(g.lastStayAt)}
                        </>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Pagination ── */}
          {(data?.totalPages ?? 0) > 1 && (
            <div
              className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100"
              style={{ background: '#f9fafb' }}
            >
              <p className="text-xs text-gray-500">
                Page{' '}
                <span className="font-bold text-gray-700">{page}</span>
                {' '}of{' '}
                <span className="font-bold text-gray-700">{data!.totalPages}</span>
                {' '}·{' '}
                {data!.totalDocs} guests
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <button
                  disabled={page === data!.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}