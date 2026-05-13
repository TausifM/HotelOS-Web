// ═══════════════════════════════════════════════════════════════════════
// FILE 1: web/src/app/dine/[roomToken]/page.tsx
// Public in-room dining page — guest scans QR on door
// ═══════════════════════════════════════════════════════════════════════
'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, ShoppingCart, Plus, Minus, CheckCircle, Utensils, X } from 'lucide-react';

const publicApi = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

interface MenuItem { _id: string; name: string; price: number; category: string; isVeg: boolean; description?: string; preparationTime?: number; isAvailable: boolean; }

function VegDot({ isVeg }: { isVeg: boolean }) {
  return (
    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
    </div>
  );
}

export default function InRoomDiningPage() {
  const { roomToken } = useParams<{ roomToken: string }>();
  const [cart,     setCart]     = useState<Record<string, number>>({});
  const [notes,    setNotes]    = useState('');
  const [step,     setStep]     = useState<'menu'|'confirm'|'done'>('menu');
  const [activeCategory, setActiveCategory] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['room-dining', roomToken],
    queryFn:  () => publicApi.get(`/api/restaurant/room-menu/${roomToken}`).then(r => r.data.data),
  });

  const orderMut = useMutation({
    mutationFn: () => publicApi.post(`/api/restaurant/room-order/${roomToken}`, {
      items: Object.entries(cart).map(([id, qty]) => ({ menuItemId: id, quantity: qty })),
      notes,
    }),
    onSuccess: () => setStep('done'),
    onError:   (e: any) => alert(e.response?.data?.message || 'Order failed. Please try again.'),
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <div>
        <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Menu unavailable</h2>
        <p className="text-gray-500 text-sm">This QR code has expired. Please contact reception.</p>
      </div>
    </div>
  );

  const { hotel, room, menuItems } = data;
  const brandColor = hotel?.brandColor || '#EA580C';

  const categories = ['all', ...Array.from(new Set((menuItems || []).map((i: MenuItem) => i.category)))] as string[];
  const filtered   = (menuItems || []).filter((i: MenuItem) =>
    i.isAvailable && (!activeCategory || activeCategory === 'all' || i.category === activeCategory)
  );

  const cartItems  = Object.entries(cart).filter(([, q]) => q > 0);
  const cartTotal  = cartItems.reduce((sum, [id, qty]) => {
    const item = menuItems?.find((i: MenuItem) => i._id === id);
    return sum + (item?.price || 0) * qty;
  }, 0);
  const cartCount  = cartItems.reduce((s, [, q]) => s + q, 0);

  function addToCart(id: string) { setCart(p => ({ ...p, [id]: (p[id] || 0) + 1 })); }
  function removeFromCart(id: string) { setCart(p => { const n = { ...p }; if (n[id] > 1) n[id]--; else delete n[id]; return n; }); }

  if (step === 'done') return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Order Placed! 🍽️</h2>
        <p className="text-gray-500 text-sm">Your order will be delivered to <strong>Room {room?.number}</strong> in {data.estimatedTime || 20}-{(data.estimatedTime || 20) + 10} minutes.</p>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-left space-y-2">
          {cartItems.map(([id, qty]) => {
            const item = menuItems?.find((i: MenuItem) => i._id === id);
            return (
              <div key={id} className="flex justify-between text-sm">
                <span className="text-gray-700">{qty}× {item?.name}</span>
                <span className="font-medium">₹{((item?.price || 0) * qty).toLocaleString()}</span>
              </div>
            );
          })}
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold">
            <span>Total</span><span>₹{cartTotal.toLocaleString()}</span>
          </div>
        </div>
        <p className="text-xs text-gray-400">Amount will be added to your room bill.</p>
        <button onClick={() => { setCart({}); setStep('menu'); setNotes(''); }}
          className="text-sm font-semibold text-gray-600 hover:text-gray-900">
          Order more →
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: brandColor }}>
            {hotel?.hotelName?.[0]}
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">{hotel?.hotelName}</p>
            <p className="text-xs text-gray-400">Room {room?.number} · In-room Dining</p>
          </div>
          {cartCount > 0 && (
            <button onClick={() => setStep('confirm')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-white text-xs font-bold"
              style={{ backgroundColor: brandColor }}>
              <ShoppingCart className="w-4 h-4" />
              {cartCount} · ₹{cartTotal.toLocaleString()}
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex gap-1 px-4 pb-3 overflow-x-auto">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat === 'all' ? '' : cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors flex-shrink-0
                ${(!activeCategory && cat === 'all') || activeCategory === cat
                  ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              style={((!activeCategory && cat === 'all') || activeCategory === cat) ? { backgroundColor: brandColor } : {}}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu items */}
      <div className="p-4 pb-32 space-y-3">
        {filtered.map((item: MenuItem) => (
          <div key={item._id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start gap-3">
            <VegDot isVeg={item.isVeg} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
              {item.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-gray-900">₹{item.price}</span>
                {item.preparationTime && (
                  <span className="text-[10px] text-gray-400">{item.preparationTime} min</span>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              {cart[item._id] ? (
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-2 py-1">
                  <button onClick={() => removeFromCart(item._id)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-200 font-bold text-gray-700">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-bold text-sm w-5 text-center">{cart[item._id]}</span>
                  <button onClick={() => addToCart(item._id)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-white font-bold"
                    style={{ backgroundColor: brandColor }}>
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button onClick={() => addToCart(item._id)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: brandColor }}>
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Confirm bottom sheet */}
      {step === 'confirm' && cartCount > 0 && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setStep('menu')} />
          <div className="relative w-full bg-white rounded-t-3xl p-5 max-w-md mx-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Your Order</h3>
              <button onClick={() => setStep('menu')}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cartItems.map(([id, qty]) => {
                const item = menuItems?.find((i: MenuItem) => i._id === id);
                return (
                  <div key={id} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <VegDot isVeg={item?.isVeg || true} />
                      <span className="text-sm text-gray-900">{item?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeFromCart(id)} className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                      <span className="font-bold text-sm w-5 text-center">{qty}</span>
                      <button onClick={() => addToCart(id)} className="w-6 h-6 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: brandColor }}><Plus className="w-3 h-3" /></button>
                    </div>
                    <span className="font-semibold text-sm w-16 text-right">₹{((item?.price||0)*qty).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Special instructions... (no onion, extra spicy, etc.)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none resize-none" />
            <div className="flex justify-between font-bold text-lg border-t border-gray-100 pt-3">
              <span>Total</span><span>₹{cartTotal.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-400 text-center">Will be charged to Room {room?.number} folio</p>
            <button onClick={() => orderMut.mutate()}
              disabled={orderMut.isPending}
              className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: brandColor }}>
              {orderMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Utensils className="w-5 h-5" /> Place Order</>}
            </button>
          </div>
        </div>
      )}

      {/* Bottom cart bar */}
      {step === 'menu' && cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 max-w-md mx-auto">
          <button onClick={() => setStep('confirm')}
            className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-between px-5 shadow-lg"
            style={{ backgroundColor: brandColor }}>
            <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm">{cartCount} items</span>
            <span>View Order</span>
            <span>₹{cartTotal.toLocaleString()}</span>
          </button>
        </div>
      )}
    </div>
  );
}