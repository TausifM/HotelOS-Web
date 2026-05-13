'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Star, Gift, Calendar, ChevronRight, Loader2,
  MessageSquare, BedDouble, Utensils, Wind, Wifi,
  Award, CheckCircle, Phone, Share2,
} from 'lucide-react';
import axios from 'axios';


function WAMsg(phone: string, msg: string) {
  const n = phone.replace(/\D/g,''); const num = n.startsWith('91') ? n : `91${n}`;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
}

const TIER_CONFIG = {
  bronze:   { label: 'Bronze',   color: 'from-amber-700   to-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50',   pointsNext: 1000  },
  silver:   { label: 'Silver',   color: 'from-gray-500    to-gray-400',    text: 'text-gray-600',    bg: 'bg-gray-100',   pointsNext: 5000  },
  gold:     { label: 'Gold',     color: 'from-yellow-600  to-yellow-400',  text: 'text-yellow-700',  bg: 'bg-yellow-50',  pointsNext: 15000 },
  platinum: { label: 'Platinum', color: 'from-purple-700  to-purple-500',  text: 'text-purple-700',  bg: 'bg-purple-50',  pointsNext: 99999 },
} as const;

const SERVICES = [
  { key: 'housekeeping',   label: 'Extra Towels',       icon: Wind,       msg: 'extra towels or cleaning'  },
  { key: 'room_service',   label: 'Room Service',       icon: Utensils,   msg: 'room service menu'          },
  { key: 'wifi',           label: 'WiFi Help',          icon: Wifi,       msg: 'wifi password'              },
  { key: 'late_checkout',  label: 'Late Checkout',      icon: Calendar,   msg: 'late checkout request'      },
  { key: 'custom',         label: 'Anything else',      icon: MessageSquare, msg: 'I need some help with' },
];

export default function LoyaltyPWAPage() {
  const { membershipId } = useParams<{ membershipId: string }>();
  const [activeTab,  setActiveTab]  = useState<'home'|'stays'|'rewards'|'requests'>('home');
  const [requested,  setRequested]  = useState<string[]>([]);
  const [shareMsg,   setShareMsg]   = useState(false);
const publicApi = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });
  const { data, isLoading, error } = useQuery({
    queryKey: ['loyalty-guest', membershipId],
    queryFn:  () => publicApi.get(`/api/loyalty/member/${membershipId}`).then(r => r.data.data),
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center p-8">
      <div>
        <Award className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <p className="text-xl font-bold text-gray-900 mb-2">Membership not found</p>
        <p className="text-gray-500 text-sm">Check your membership ID and try again</p>
      </div>
    </div>
  );

  const { guest, hotel, reservations = [], currentStay } = data;
  const tier      = (guest?.loyalty?.tier || 'bronze') as keyof typeof TIER_CONFIG;
  const tc        = TIER_CONFIG[tier];
  const points    = guest?.loyalty?.points || 0;
  const nextTier  = tier === 'platinum' ? null : tc.pointsNext;
  const progress  = nextTier ? Math.min((points / nextTier) * 100, 100) : 100;
  const phone     = guest?.whatsappNumber || guest?.phone || '';
  const hotelPhone = hotel?.phone || '';

  function handleService(service: typeof SERVICES[0]) {
    if (!hotelPhone) return;
    const msg = `Hi! I'm ${guest?.firstName} ${guest?.lastName} (Room: ${currentStay?.roomNumber || '—'}, Membership: ${membershipId}). I'd like to request ${service.msg}.`;
    WAMsg(hotelPhone, msg);
    setRequested(p => [...p, service.key]);
  }

  const referralMsg = `Stay at ${hotel?.hotelName} and earn loyalty points! Book at: ${window?.location?.origin}/${hotel?.slug}/book\nMy referral code: ${membershipId?.slice(-6).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">

      {/* Header card */}
      <div className={`bg-gradient-to-br ${tc.color} text-white p-6 pt-8 rounded-b-3xl shadow-lg`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/70 text-xs font-semibold tracking-widest uppercase mb-1">
              {hotel?.hotelName || 'HotelOS Loyalty'}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              {guest?.firstName} {guest?.lastName}
            </h1>
            <p className="text-white/70 text-xs mt-1 font-mono">ID: {membershipId?.toUpperCase()}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2 text-center">
            <p className="text-2xl font-black">{points.toLocaleString()}</p>
            <p className="text-[10px] text-white/80 font-semibold uppercase tracking-wider">Points</p>
          </div>
        </div>

        {/* Tier badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-white/25 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
            ⭐ {tc.label} Member
          </span>
          {guest?.isVip && (
            <span className="bg-yellow-400/30 text-yellow-100 text-xs font-bold px-2 py-1 rounded-full">VIP</span>
          )}
        </div>

        {/* Progress to next tier */}
        {nextTier && (
          <div>
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>{points.toLocaleString()} pts</span>
              <span>{nextTier.toLocaleString()} pts for {Object.keys(TIER_CONFIG)[Object.keys(TIER_CONFIG).indexOf(tier)+1]?.toUpperCase()}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
        {tier === 'platinum' && (
          <p className="text-white/80 text-xs font-semibold">👑 You've reached the highest tier!</p>
        )}

        {/* Points value */}
        <div className="mt-3 bg-white/15 rounded-xl px-3 py-2 text-xs text-white/80">
          💰 Your points are worth <strong className="text-white">₹{(points * 0.5).toLocaleString()}</strong> in discounts
        </div>
      </div>

      {/* Current stay */}
      {currentStay && (
        <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-xs font-bold text-green-800 uppercase tracking-wide">Currently Staying</p>
          </div>
          <div className="flex justify-between text-sm">
            <div>
              <p className="font-bold text-gray-900">Room {currentStay.roomNumber}</p>
              <p className="text-xs text-gray-500">Check-out: {formatDate(currentStay.checkOut)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Ref</p>
              <p className="font-mono text-xs text-gray-700">{currentStay.bookingRef}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex bg-white border-b border-gray-200 sticky top-0 z-10 mt-4">
        {[
          { id: 'home',     label: 'Home',     icon: Award    },
          { id: 'stays',    label: 'Stays',    icon: BedDouble },
          { id: 'rewards',  label: 'Rewards',  icon: Gift     },
          { id: 'requests', label: 'Services', icon: MessageSquare },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors
              ${activeTab === tab.id ? `${tc.text} border-b-2 border-current` : 'text-gray-400'}`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4 pb-20 space-y-4">

        {/* HOME */}
        {activeTab === 'home' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { l: 'Total Stays',  v: guest?.stayCount || 0 },
                { l: 'Total Nights', v: guest?.loyalty?.totalNights || 0 },
                { l: 'Total Spent',  v: formatCurrency(guest?.loyalty?.totalSpend || 0) },
              ].map(s => (
                <div key={s.l} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
                  <p className="text-lg font-black text-gray-900">{s.v}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{s.l}</p>
                </div>
              ))}
            </div>

            {/* Benefits for tier */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="font-bold text-gray-900 mb-3">Your {tc.label} Benefits</h3>
              <div className="space-y-2">
                {[
                  tier !== 'bronze' && { icon: '🕐', text: 'Early check-in when available'   },
                  tier !== 'bronze' && { icon: '🕙', text: 'Late checkout until 1 PM'        },
                  tier === 'gold' || tier === 'platinum' ? { icon: '⬆️', text: 'Room upgrade on availability'  } : null,
                  tier === 'platinum' ? { icon: '🎁', text: 'Welcome gift on arrival'         } : null,
                  tier === 'platinum' ? { icon: '🍳', text: 'Complimentary breakfast'         } : null,
                  { icon: '⭐', text: `Earn ${tier === 'platinum' ? '3x' : tier === 'gold' ? '2x' : '1x'} points on every stay` },
                  { icon: '💳', text: '₹0.50 discount per point redeemed' },
                ].filter(Boolean).map((b: any, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-base">{b.icon}</span>
                    <span className="text-gray-700">{b.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Referral */}
            <div className="bg-gradient-to-br from-brand-50 to-blue-50 border border-brand-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <Share2 className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm">Refer a friend</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Earn 500 bonus points when a friend books using your code</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-mono text-sm font-bold bg-white border border-brand-200 px-3 py-1 rounded-lg text-brand-700">
                      {membershipId?.slice(-6).toUpperCase()}
                    </span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(membershipId?.slice(-6).toUpperCase() || ''); setShareMsg(true); setTimeout(()=>setShareMsg(false),2000); }}
                      className="text-xs font-semibold text-brand-600 bg-brand-100 px-3 py-1 rounded-lg hover:bg-brand-200 transition-colors">
                      {shareMsg ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* STAYS */}
        {activeTab === 'stays' && (
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900">Stay History</h3>
            {!reservations.length ? (
              <div className="text-center py-10">
                <BedDouble className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="font-medium text-gray-500">No stays yet</p>
                <p className="text-sm text-gray-400 mt-1">Book your first stay to start earning points</p>
              </div>
            ) : reservations.map((r: any) => (
              <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Room {r.roomNumber}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(r.checkIn)} → {formatDate(r.checkOut)}</p>
                    <p className="text-xs font-mono text-gray-400 mt-0.5">{r.bookingRef}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(r.totalAmount)}</p>
                    <p className="text-[10px] text-gray-400">{r.nights} night{r.nights>1?'s':''}</p>
                    {r.status === 'checked_out' && (
                      <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                        +{Math.round(r.totalAmount / 100)} pts
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* REWARDS */}
        {activeTab === 'rewards' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="font-bold text-gray-900 mb-1">Redeem Points</h3>
              <p className="text-xs text-gray-400 mb-4">1 point = ₹0.50 discount on your next stay</p>
              <div className="text-center bg-gradient-to-br from-brand-50 to-blue-50 rounded-2xl p-5 border border-brand-200 mb-4">
                <p className="text-4xl font-black text-brand-700">{points.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">Available points</p>
                <p className="text-sm font-bold text-green-600 mt-1">= ₹{(points * 0.5).toLocaleString()} discount</p>
              </div>
              <button
                onClick={() => WAMsg(hotelPhone, `Hi! I'm ${guest?.firstName} (Membership: ${membershipId}). I'd like to redeem ${points} loyalty points for a discount on my next booking.`)}
                className="w-full py-3 rounded-xl font-semibold text-white bg-brand-700 hover:bg-brand-800 transition-colors flex items-center justify-center gap-2">
                <Gift className="w-4 h-4" />
                Redeem via WhatsApp
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-gray-700 text-sm">How to earn more points</h4>
              {[
                { icon: '🏨', action: 'Book a stay',          pts: '₹100 spent = 1 point' },
                { icon: '🍽️', action: 'Dining',              pts: '₹100 spent = 1 point' },
                { icon: '🧖', action: 'Spa services',         pts: '₹100 spent = 2 points' },
                { icon: '👥', action: 'Refer a friend',       pts: '500 bonus points'      },
                { icon: '⭐', action: 'Write a review',       pts: '100 bonus points'      },
                { icon: '🎂', action: 'Birthday stay',        pts: '2x points'             },
              ].map(e => (
                <div key={e.action} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                  <span className="text-xl">{e.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{e.action}</p>
                  </div>
                  <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full whitespace-nowrap">{e.pts}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SERVICES */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-900">Request Services</h3>
              <p className="text-xs text-gray-400 mt-1">Opens WhatsApp to contact the hotel directly</p>
            </div>

            {!currentStay && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-700 font-medium">
                ⚠️ Services are available during your stay only
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {SERVICES.map(service => {
                const done = requested.includes(service.key);
                return (
                  <button key={service.key}
                    onClick={() => handleService(service)}
                    disabled={!currentStay && service.key !== 'custom'}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all
                      ${done ? 'border-green-300 bg-green-50' : currentStay ? 'border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50 active:scale-95' : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'}`}>
                    {done ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <service.icon className="w-6 h-6 text-gray-600" />
                    )}
                    <span className="text-xs font-semibold text-gray-700">{service.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Contact Hotel</p>
                  <p className="text-xs text-gray-400">{hotelPhone}</p>
                </div>
              </div>
              <button
                onClick={() => WAMsg(hotelPhone, `Hi, I'm ${guest?.firstName} ${guest?.lastName} (Membership: ${membershipId}). `)}
                className="w-full py-2.5 rounded-xl font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Chat with Hotel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
