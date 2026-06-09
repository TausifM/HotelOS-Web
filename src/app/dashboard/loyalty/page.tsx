'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Star, Users, Gift, Crown, ArrowUpRight, TrendingUp,
  Sparkles, ChevronRight, Loader2, Search, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';

/* ─── Tier config for light theme ─── */
const TIER_STYLES = {
  platinum: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200', icon: 'text-fuchsia-500', gradient: 'from-fuchsia-500 to-purple-600' },
  gold:     { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   icon: 'text-amber-500',   gradient: 'from-amber-400 to-orange-500' },
  silver:   { bg: 'bg-slate-100',  text: 'text-slate-700',   border: 'border-slate-200',   icon: 'text-slate-500',   gradient: 'from-slate-400 to-gray-500' },
  bronze:   { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  icon: 'text-orange-500',  gradient: 'from-orange-400 to-rose-400' },
} as const;

/* ─── Animation presets ─── */
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function LoyaltyDashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['loyalty-members'],
    queryFn: () => api.get('/api/guests', {
      params: { hasLoyalty: true, limit: 50, sortBy: 'loyalty.points', sortOrder: 'desc' }
    }).then((r) => r.data.data?.docs || []),
  });

  const members = data || [];

  /* ─── Derived stats ─── */
  const stats = useMemo(() => ({
    total: members.length,
    gold: members.filter((g: any) => g.loyalty?.tier === 'gold' || g.loyalty?.tier === 'platinum').length,
    points: members.reduce((s: number, g: any) => s + (g.loyalty?.points || 0), 0),
    avgPoints: members.length ? Math.round(members.reduce((s: number, g: any) => s + (g.loyalty?.points || 0), 0) / members.length) : 0,
  }), [members]);

  /* ─── Filtered members ─── */
  const filtered = useMemo(() => {
    return members.filter((g: any) => {
      const matchesSearch = !searchQuery || 
        `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.phone?.includes(searchQuery) ||
        g.loyalty?.membershipId?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = !tierFilter || g.loyalty?.tier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [members, searchQuery, tierFilter]);

  const tierCounts = useMemo(() => ({
    platinum: members.filter((g: any) => g.loyalty?.tier === 'platinum').length,
    gold: members.filter((g: any) => g.loyalty?.tier === 'gold').length,
    silver: members.filter((g: any) => g.loyalty?.tier === 'silver').length,
    bronze: members.filter((g: any) => g.loyalty?.tier === 'bronze' || !g.loyalty?.tier).length,
  }), [members]);

  return (
    <DashboardLayout title="Loyalty">
      <div className="space-y-6 max-w-5xl pb-10">
        
        {/* ═══════════════════════════════════════
            HERO HEADER — Orange to Pink Gradient
        ═══════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-3xl text-white p-8 shadow-xl shadow-orange-500/15"
         style={{ background: 'linear-gradient(135deg,#F97316 0%,#F43F5E 100%)' }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-20"
            style={{ background: 'rgba(255,255,255,0.3)' }} />
          <div className="pointer-events-none absolute -bottom-6 left-20 h-28 w-28 rounded-full opacity-10"
            style={{ background: 'rgba(255,255,255,0.5)' }} />
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-300/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-white/80" />
              <span className="text-sm font-semibold text-white/90 uppercase tracking-wider">Loyalty Program</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Guest Rewards Dashboard</h1>
            <p className="text-white/80 text-sm max-w-md">
              Manage memberships, track points circulation, and monitor tier distribution across your property.
            </p>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════
            BENTO STATS GRID
        ═══════════════════════════════════════ */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total Members', value: stats.total, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', desc: 'Active loyalty accounts' },
            { label: 'Gold & Platinum', value: stats.gold, icon: Crown, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', desc: 'Premium tier guests' },
            { label: 'Points Circulation', value: stats.points.toLocaleString(), icon: Gift, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100', desc: 'Total outstanding points' },
            { label: 'Avg. Points', value: stats.avgPoints.toLocaleString(), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', desc: 'Per member average' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={item}
              whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400 } }}
              className={`${stat.bg} ${stat.border} border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} border ${stat.border} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <ArrowUpRight className={`w-4 h-4 ${stat.color} opacity-50`} />
              </div>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              <p className="text-xs font-semibold text-gray-600 mt-0.5">{stat.label}</p>
              <p className="text-[10px] text-gray-400 mt-1">{stat.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ═══════════════════════════════════════
            TIER DISTRIBUTION + FILTERS
        ═══════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Tier Distribution</h3>
            <span className="text-xs text-gray-400 font-medium">{members.length} total members</span>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(TIER_STYLES) as Array<keyof typeof TIER_STYLES>).map((tier) => {
              const count = tierCounts[tier];
              const isActive = tierFilter === tier;
              const style = TIER_STYLES[tier];
              return (
                <button
                  key={tier}
                  onClick={() => setTierFilter(isActive ? null : tier)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border',
                    isActive
                      ? `bg-gradient-to-r ${style.gradient} text-white border-transparent shadow-md`
                      : `${style.bg} ${style.text} ${style.border} hover:shadow-sm`
                  )}
                >
                  <Crown className="w-3.5 h-3.5" />
                  {tier}
                  <span className={cn(
                    'ml-1 px-1.5 py-0.5 rounded-md text-[10px]',
                    isActive ? 'bg-white/20 text-white' : 'bg-white text-gray-600'
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════
            MEMBERS LIST
        ═══════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          {/* Toolbar */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search members by name, phone, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Filter className="w-3.5 h-3.5" />
              <span>{filtered.length} results</span>
              {tierFilter && (
                <button
                  onClick={() => setTierFilter(null)}
                  className="text-orange-600 hover:text-orange-700 font-medium ml-1"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="font-medium text-gray-500">No members found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              <AnimatePresence>
                {filtered.map((g: any, idx: number) => {
                  const tier = (g.loyalty?.tier || 'bronze') as keyof typeof TIER_STYLES;
                  const style = TIER_STYLES[tier];
                  const initials = `${g.firstName?.[0] || ''}${g.lastName?.[0] || ''}`.toUpperCase();

                  return (
                    <motion.div
                      key={g._id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ delay: idx * 0.03, duration: 0.25 }}
                      className="group flex items-center gap-4 px-5 py-4 hover:bg-orange-50/40 cursor-pointer transition-all"
                      onClick={() => router.push(`/dashboard/guests/${g._id}`)}
                    >
                      {/* Avatar */}
                      <div className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm',
                        style.bg, style.text
                      )}>
                        {initials || <Users className="w-5 h-5" />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {g.firstName} {g.lastName}
                          </p>
                          <span className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize',
                            style.bg, style.text, style.border
                          )}>
                            {tier}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{g.phone}</p>
                      </div>

                      {/* Points */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900 tabular-nums">
                          {(g.loyalty?.points || 0).toLocaleString()}
                          <span className="text-gray-400 font-normal text-xs ml-1">pts</span>
                        </p>
                        {g.loyalty?.membershipId && (
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                            {g.loyalty.membershipId.toUpperCase()}
                          </p>
                        )}
                      </div>

                      {/* PWA Link */}
                      {g.loyalty?.membershipId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/loyalty/${g.loyalty.membershipId}`, '_blank');
                          }}
                          className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors border border-orange-200"
                        >
                          PWA
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}