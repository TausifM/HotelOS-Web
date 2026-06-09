'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Star, Gift, Calendar, ChevronRight, Loader2,
  MessageSquare, BedDouble, Utensils, Wind, Wifi,
  Award, CheckCircle, Phone, Share2, Sparkles,
  TrendingUp, Zap, Crown, ArrowUpRight, Copy,
  Diamond, Clock, MapPin, Shield
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── WhatsApp helper ─── */
function WAMsg(phone: string, msg: string) {
  const n = phone.replace(/\D/g, '');
  const num = n.startsWith('91') ? n : `91${n}`;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
}

/* ─── Tier config with modern gradients ─── */
const TIER_CONFIG = {
  bronze: {
    label: 'Bronze',
    gradient: 'from-orange-600 via-amber-500 to-yellow-500',
    glow: 'shadow-orange-500/20',
    text: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    pointsNext: 1000,
  },
  silver: {
    label: 'Silver',
    gradient: 'from-slate-400 via-gray-300 to-zinc-400',
    glow: 'shadow-slate-400/20',
    text: 'text-slate-300',
    bg: 'bg-slate-500/10',
    border: 'border-slate-400/20',
    pointsNext: 5000,
  },
  gold: {
    label: 'Gold',
    gradient: 'from-yellow-500 via-amber-400 to-orange-400',
    glow: 'shadow-yellow-500/20',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    pointsNext: 15000,
  },
  platinum: {
    label: 'Platinum',
    gradient: 'from-indigo-500 via-violet-500 to-fuchsia-500',
    glow: 'shadow-violet-500/30',
    text: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    pointsNext: 99999,
  },
} as const;

const SERVICES = [
  { key: 'housekeeping', label: 'Housekeeping', icon: Sparkles, msg: 'extra towels or cleaning' },
  { key: 'room_service', label: 'Room Service', icon: Utensils, msg: 'room service menu' },
  { key: 'wifi', label: 'WiFi Help', icon: Wifi, msg: 'wifi password' },
  { key: 'late_checkout', label: 'Late Checkout', icon: Clock, msg: 'late checkout request' },
  { key: 'custom', label: 'Custom Request', icon: MessageSquare, msg: 'I need some help with' },
];

/* ─── Animation variants ─── */
const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

/* ─── Skeleton loader ─── */
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-3xl bg-white/5 p-4 border border-white/5">
      <div className="h-4 bg-white/10 rounded-lg w-3/4 mb-3" />
      <div className="h-3 bg-white/10 rounded-lg w-1/2" />
    </div>
  );
}

export default function LoyaltyDashboardPage() {
  const { membershipId } = useParams<{ membershipId: string }>();
  const [activeTab, setActiveTab] = useState<'home' | 'stays' | 'rewards' | 'requests'>('home');
  const [requested, setRequested] = useState<string[]>([]);
  const [shareMsg, setShareMsg] = useState(false);

  const publicApi = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

  const { data, isLoading, error } = useQuery({
    queryKey: ['loyalty-guest', membershipId],
    queryFn: () => publicApi.get(`/api/loyalty/member/${membershipId}`).then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-6">
          <div className="h-48 bg-white/5 rounded-3xl animate-pulse border border-white/5" />
          <div className="h-24 bg-white/5 rounded-3xl animate-pulse border border-white/5" />
          <div className="h-32 bg-white/5 rounded-3xl animate-pulse border border-white/5" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/10">
            <Award className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2 tracking-tight">Membership not found</h2>
          <p className="text-slate-400 text-sm">Check your membership ID and try again</p>
        </motion.div>
      </div>
    );
  }

  const { guest, hotel, reservations = [], currentStay } = data;
  const tier = (guest?.loyalty?.tier || 'bronze') as keyof typeof TIER_CONFIG;
  const tc = TIER_CONFIG[tier];
  const points = guest?.loyalty?.points || 0;
  const nextTier = tier === 'platinum' ? null : tc.pointsNext;
  const progress = nextTier ? Math.min((points / nextTier) * 100, 100) : 100;
  const phone = guest?.whatsappNumber || guest?.phone || '';
  const hotelPhone = hotel?.phone || '';

  function handleService(service: (typeof SERVICES)[0]) {
    if (!hotelPhone) return;
    const msg = `Hi! I'm ${guest?.firstName} ${guest?.lastName} (Room: ${currentStay?.roomNumber || '—'}, Membership: ${membershipId}). I'd like to request ${service.msg}.`;
    WAMsg(hotelPhone, msg);
    setRequested((p) => [...p, service.key]);
  }

  const referralCode = membershipId?.slice(-6).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* ─── Ambient background effects ─── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-md mx-auto pb-32">
        {/* ═══════════════════════════════════════
            HERO HEADER
        ═══════════════════════════════════════ */}
        <div className="relative px-6 pt-8 pb-8">
          <div className={`absolute inset-0 bg-gradient-to-br ${tc.gradient} opacity-10 rounded-b-[2.5rem]`} />
          <div className="absolute inset-0 backdrop-blur-3xl rounded-b-[2.5rem] bg-slate-950/40" />

          <div className="relative">
            {/* Top row */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-slate-400 text-xs font-semibold tracking-widest uppercase mb-1">
                  {hotel?.hotelName || 'HotelOS Loyalty'}
                </p>
                <h1 className="text-3xl font-bold tracking-tight">
                  {guest?.firstName} <span className="text-slate-400">{guest?.lastName}</span>
                </h1>
                <p className="text-slate-500 text-xs mt-1 font-mono tracking-wide">ID: {membershipId?.toUpperCase()}</p>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`bg-gradient-to-br ${tc.gradient} ${tc.glow} shadow-lg rounded-2xl px-5 py-3 text-center`}
              >
                <p className="text-2xl font-black text-white">{points.toLocaleString()}</p>
                <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Points</p>
              </motion.div>
            </div>

            {/* Tier badge */}
            <div className="flex items-center gap-3 mb-5">
              <span className={`bg-gradient-to-r ${tc.gradient} text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide shadow-lg ${tc.glow}`}>
                <Crown className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                {tc.label} Member
              </span>
              {guest?.isVip && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1.5 rounded-full">
                  VIP
                </span>
              )}
            </div>

            {/* Progress bar */}
            {nextTier ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>{points.toLocaleString()} pts</span>
                  <span className="text-slate-300">
                    {nextTier.toLocaleString()} pts for {Object.keys(TIER_CONFIG)[Object.keys(TIER_CONFIG).indexOf(tier) + 1]?.toUpperCase()}
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className={`h-full bg-gradient-to-r ${tc.gradient} rounded-full`}
                  />
                </div>
              </div>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-violet-300/80 text-xs font-semibold flex items-center gap-2"
              >
                <Diamond className="w-4 h-4" /> You've reached the highest tier!
              </motion.p>
            )}

            {/* Points value pill */}
            <div className="mt-4 inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-300">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Worth <strong className="text-white">₹{(points * 0.5).toLocaleString()}</strong> in rewards
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            CURRENT STAY CARD
        ═══════════════════════════════════════ */}
        <AnimatePresence>
          {currentStay && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="mx-6 mb-6 relative group"
            >
              <div className="absolute inset-0 bg-emerald-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl rounded-3xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Currently Staying</p>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-2xl font-bold text-white">Room {currentStay.roomNumber}</p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Until {formatDate(currentStay.checkOut)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Booking Ref</p>
                    <p className="font-mono text-xs text-slate-300">{currentStay.bookingRef}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════
            TAB CONTENT
        ═══════════════════════════════════════ */}
        <div className="px-6">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div key="home" {...fadeIn} className="space-y-5">
                {/* Bento Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="col-span-2 grid grid-cols-3 gap-3"
                  >
                    {[
                      { label: 'Stays', value: guest?.stayCount || 0, icon: BedDouble },
                      { label: 'Nights', value: guest?.loyalty?.totalNights || 0, icon: Moon },
                      { label: 'Spent', value: formatCurrency(guest?.loyalty?.totalSpend || 0), icon: TrendingUp },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        variants={fadeIn}
                        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition-colors"
                      >
                        <stat.icon className="w-4 h-4 text-slate-400 mx-auto mb-2" />
                        <p className="text-lg font-black text-white">{stat.value}</p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                {/* Benefits */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    Your {tc.label} Benefits
                  </h3>
                  <div className="space-y-3">
                    {[
                      tier !== 'bronze' && { icon: Clock, text: 'Early check-in when available', color: 'text-blue-400' },
                      tier !== 'bronze' && { icon: Clock, text: 'Late checkout until 1 PM', color: 'text-blue-400' },
                      (tier === 'gold' || tier === 'platinum') && { icon: ArrowUpRight, text: 'Room upgrade on availability', color: 'text-amber-400' },
                      tier === 'platinum' && { icon: Gift, text: 'Welcome gift on arrival', color: 'text-violet-400' },
                      tier === 'platinum' && { icon: Utensils, text: 'Complimentary breakfast', color: 'text-emerald-400' },
                      { icon: Zap, text: `Earn ${tier === 'platinum' ? '3x' : tier === 'gold' ? '2x' : '1x'} points per stay`, color: 'text-yellow-400' },
                      { icon: Shield, text: '₹0.50 discount per point redeemed', color: 'text-emerald-400' },
                    ]
                      .filter(Boolean)
                      .map((b: any, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${b.color}`}>
                            <b.icon className="w-4 h-4" />
                          </div>
                          <span className="text-slate-300">{b.text}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Referral */}
                <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 p-5">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
                  <div className="relative flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <Share2 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-sm">Refer a Friend</h3>
                      <p className="text-xs text-slate-400 mt-1">Earn 500 bonus points per successful referral</p>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 font-mono text-sm font-bold text-indigo-300 tracking-wider">
                          {referralCode}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(referralCode || '');
                            setShareMsg(true);
                            setTimeout(() => setShareMsg(false), 2000);
                          }}
                          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/20 px-4 py-2 rounded-xl hover:bg-indigo-500/30 transition-all active:scale-95"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {shareMsg ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'stays' && (
              <motion.div key="stays" {...fadeIn} className="space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-slate-400" />
                  Stay History
                </h3>
                {!reservations.length ? (
                  <div className="text-center py-16 bg-white/5 rounded-3xl border border-white/10">
                    <BedDouble className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="font-medium text-slate-300">No stays yet</p>
                    <p className="text-sm text-slate-500 mt-1">Book your first stay to start earning</p>
                  </div>
                ) : (
                  reservations.map((r: any, idx: number) => (
                    <motion.div
                      key={r._id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all hover:border-white/20"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-white text-sm flex items-center gap-2">
                            Room {r.roomNumber}
                            {r.status === 'checked_out' && (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                                +{Math.round(r.totalAmount / 100)} pts
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDate(r.checkIn)} → {formatDate(r.checkOut)}
                          </p>
                          <p className="text-[10px] font-mono text-slate-600 mt-1">{r.bookingRef}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">{formatCurrency(r.totalAmount)}</p>
                          <p className="text-[10px] text-slate-500">{r.nights} night{r.nights > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'rewards' && (
              <motion.div key="rewards" {...fadeIn} className="space-y-5">
                {/* Redeem Card */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                  <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-violet-400" />
                    Redeem Points
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">1 point = ₹0.50 instant discount</p>

                  <div className="text-center bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-2xl p-6 border border-indigo-500/20 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/20 rounded-full blur-2xl" />
                    <p className="text-5xl font-black text-white tracking-tight">{points.toLocaleString()}</p>
                    <p className="text-sm text-slate-400 mt-1">Available points</p>
                    <p className="text-sm font-bold text-emerald-400 mt-1">= ₹{(points * 0.5).toLocaleString()}</p>
                  </div>

                  <button
                    onClick={() =>
                      WAMsg(
                        hotelPhone,
                        `Hi! I'm ${guest?.firstName} (Membership: ${membershipId}). I'd like to redeem ${points} loyalty points for a discount on my next booking.`
                      )
                    }
                    className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <Gift className="w-4 h-4" />
                    Redeem via WhatsApp
                  </button>
                </div>

                {/* Earn More */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-300 text-sm">Ways to Earn</h4>
                  {[
                    { icon: '🏨', action: 'Book a stay', pts: '₹100 = 1 pt' },
                    { icon: '🍽️', action: 'Dining', pts: '₹100 = 1 pt' },
                    { icon: '🧖', action: 'Spa services', pts: '₹100 = 2 pts' },
                    { icon: '👥', action: 'Refer a friend', pts: '+500 pts' },
                    { icon: '⭐', action: 'Write a review', pts: '+100 pts' },
                    { icon: '🎂', action: 'Birthday stay', pts: '2x multiplier' },
                  ].map((e, i) => (
                    <motion.div
                      key={e.action}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-colors"
                    >
                      <span className="text-xl">{e.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{e.action}</p>
                      </div>
                      <span className="text-xs font-bold text-indigo-300 bg-indigo-500/15 px-2.5 py-1 rounded-full whitespace-nowrap">
                        {e.pts}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'requests' && (
              <motion.div key="requests" {...fadeIn} className="space-y-5">
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    Request Services
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Opens WhatsApp to contact hotel directly</p>
                </div>

                {!currentStay && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-300 font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Services are available during your stay only
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {SERVICES.map((service) => {
                    const done = requested.includes(service.key);
                    return (
                      <motion.button
                        key={service.key}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleService(service)}
                        disabled={!currentStay && service.key !== 'custom'}
                        className={`flex flex-col items-center gap-2.5 p-5 rounded-2xl border text-center transition-all
                          ${done
                            ? 'border-emerald-500/30 bg-emerald-500/10'
                            : currentStay
                              ? 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                              : 'border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed'
                          }`}
                      >
                        {done ? (
                          <CheckCircle className="w-7 h-7 text-emerald-400" />
                        ) : (
                          <service.icon className="w-7 h-7 text-slate-400" />
                        )}
                        <span className={`text-xs font-semibold ${done ? 'text-emerald-300' : 'text-slate-300'}`}>
                          {done ? 'Requested' : service.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Contact Hotel */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">Contact Hotel</p>
                      <p className="text-xs text-slate-500">{hotelPhone || 'Not available'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      WAMsg(hotelPhone, `Hi, I'm ${guest?.firstName} ${guest?.lastName} (Membership: ${membershipId}). `)
                    }
                    disabled={!hotelPhone}
                    className="w-full py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Chat on WhatsApp
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          FLOATING BOTTOM NAV (iOS style)
      ═══════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center justify-around shadow-2xl shadow-black/50">
            {[
              { id: 'home', label: 'Home', icon: Award },
              { id: 'stays', label: 'Stays', icon: BedDouble },
              { id: 'rewards', label: 'Rewards', icon: Gift },
              { id: 'requests', label: 'Services', icon: MessageSquare },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-300 ${
                    isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className={`absolute inset-0 bg-gradient-to-r ${tc.gradient} opacity-20 rounded-xl`}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <tab.icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-white' : ''}`} />
                  <span className="text-[10px] font-semibold relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Moon icon for stats */
function Moon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}