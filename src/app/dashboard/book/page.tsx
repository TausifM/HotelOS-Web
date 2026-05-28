'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { formatCurrency } from '@/lib/utils';
import {
    Calendar, ChevronRight, Star, Wifi, Wind,
    Tv, Coffee, CheckCircle, ArrowLeft, Shield,
    Phone, Mail, User, CreditCard, Loader2, BedDouble,
} from 'lucide-react';
import Script from 'next/script';

const publicApi = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

// ── Types ─────────────────────────────────────────────────────────────────────
interface Hotel { hotelName: string; address: any; phone: string; email: string; logo?: string; brandColor: string; checkInTime: string; checkOutTime: string; starRating: number; }
interface Room { _id: string; number: string; type: string; bedType: string; maxAdults: number; maxChildren: number; baseRate: number; view?: string; amenities: string[]; description?: string; squareFeet?: number; images?: string[]; }

const AMENITY_ICONS: Record<string, any> = { 'WiFi': Wifi, 'AC': Wind, 'TV': Tv, 'Mini-bar': Coffee };

function openWhatsApp(phone: string, message: string) {
    const n = phone.replace(/\D/g, ''); const num = n.startsWith('91') ? n : `91${n}`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
}

function formatNights(ci: string, co: string) {
    return Math.ceil((new Date(co).getTime() - new Date(ci).getTime()) / 86400000);
}

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ n }: { n: number }) {
    return <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-4 h-4 ${i < n ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />)}</div>;
}

// ── Step indicator ────────────────────────────────────────────────────────────
function Steps({ current }: { current: number }) {
    const steps = ['Dates', 'Room', 'Details', 'Payment'];
    return (
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
            {steps.map((s, i) => {
                const idx = i + 1;
                return (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all
              ${idx < current ? 'bg-green-100 text-green-700' : idx === current ? 'bg-brand-700 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                ${idx < current ? 'bg-green-500 text-white' : idx === current ? 'bg-white text-brand-700' : 'bg-gray-200 text-gray-500'}`}>
                                {idx < current ? '✓' : idx}
                            </div>
                            {s}
                        </div>
                        {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300" />}
                    </div>
                );
            })}
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BookingEnginePage() {
    const { hotelSlug } = useParams<{ hotelSlug: string }>();
    const [step, setStep] = useState(1);
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [mealPlan, setMealPlan] = useState('room_only');
    const [specialReq, setSpecialReq] = useState('');
    const [guestForm, setGuestForm] = useState({ firstName: '', lastName: '', phone: '', email: '', nationality: 'Indian' });
    const [bookingRef, setBookingRef] = useState('');
    const [paymentLoading, setPaymentLoading] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const nights = checkIn && checkOut ? formatNights(checkIn, checkOut) : 0;
    const gst = selectedRoom ? selectedRoom.baseRate <= 1000 ? 0 : selectedRoom.baseRate <= 7500 ? 0.12 : 0.18 : 0;
    const roomTotal = selectedRoom ? selectedRoom.baseRate * nights : 0;
    const taxTotal = Math.round(roomTotal * gst);
    const grandTotal = roomTotal + taxTotal;

    // ── Queries ────────────────────────────────────────────────────────────────
    const { data: hotel, isLoading: hotelLoad, error: hotelError } = useQuery<Hotel>({
        queryKey: ['public-hotel', hotelSlug],
        queryFn: () => publicApi.get(`/api/booking/${hotelSlug}`).then(r => r.data.data),
    });

    const { data: availableRooms, isLoading: roomsLoad } = useQuery<Room[]>({
        queryKey: ['public-rooms', hotelSlug, checkIn, checkOut, adults],
        queryFn: () => publicApi.get(`/api/booking/${hotelSlug}/rooms`, {
            params: { checkIn, checkOut, adults }
        }).then(r => r.data.data),
        enabled: !!(checkIn && checkOut && nights > 0),
    });

    // ── Create booking ─────────────────────────────────────────────────────────
    const createBooking = useMutation({
        mutationFn: async () => {
            const { data } = await publicApi.post(`/api/booking/${hotelSlug}/reserve`, {
                checkIn, checkOut, adults, children, mealPlan, specialRequests: specialReq,
                roomId: selectedRoom?._id,
                guest: guestForm,
            });
            return data.data;
        },
        onSuccess: async (booking) => {
            setBookingRef(booking.bookingRef);
            // Initiate Razorpay
            if (booking.razorpayOrderId) {
                await initiatePayment(booking);
            } else {
                // Free/advance-free booking
                setStep(5);
                sendWhatsAppConfirmation(booking);
            }
        },
        onError: (e: any) => {
            alert(e.response?.data?.message || 'Booking failed. Please try again.');
        },
    });

    async function initiatePayment(booking: any) {
        setPaymentLoading(true);
        try {
            const options = {
                key: booking.razorpayKeyId,
                amount: booking.amount,
                currency: 'INR',
                name: hotel?.hotelName,
                description: `Booking ${booking.bookingRef}`,
                order_id: booking.razorpayOrderId,
                prefill: {
                    name: `${guestForm.firstName} ${guestForm.lastName}`,
                    email: guestForm.email,
                    contact: guestForm.phone,
                },
                theme: { color: hotel?.brandColor || '#1D4ED8' },
                handler: async (response: any) => {
                    // Verify payment
                    await publicApi.post(`/api/booking/${hotelSlug}/verify-payment`, {
                        bookingId: booking._id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        razorpayOrderId: response.razorpay_order_id,
                        razorpaySignature: response.razorpay_signature,
                    });
                    setStep(5);
                    sendWhatsAppConfirmation(booking);
                },
                modal: { ondismiss: () => setPaymentLoading(false) },
            };
            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch {
            alert('Payment initialization failed');
        } finally {
            setPaymentLoading(false);
        }
    }

    function sendWhatsAppConfirmation(booking: any) {
        if (!guestForm.phone) return;
        openWhatsApp(guestForm.phone,
            `✅ *Booking Confirmed — ${hotel?.hotelName}*\n\n` +
            `Hello ${guestForm.firstName}!\n\n` +
            `📋 *Your Booking Details:*\n` +
            `• Ref: *${booking.bookingRef}*\n` +
            `• Room: ${selectedRoom?.number} (${selectedRoom?.type})\n` +
            `• Check-in: ${checkIn} at ${hotel?.checkInTime}\n` +
            `• Check-out: ${checkOut} at ${hotel?.checkOutTime}\n` +
            `• Nights: ${nights}\n` +
            `• Guests: ${adults} adult${adults > 1 ? 's' : ''}${children > 0 ? `, ${children} children` : ''}\n` +
            `• Total: ₹${grandTotal.toLocaleString('en-IN')}\n\n` +
            `We look forward to hosting you! 🏨\n\n` +
            `_${hotel?.hotelName} · ${hotel?.phone}_`
        );
    }

    const gF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setGuestForm(p => ({ ...p, [k]: e.target.value }));

    if (hotelLoad) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
    );

    if (hotelError || !hotel) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center p-8">
            <div>
                <p className="text-2xl font-bold text-gray-900 mb-2">Hotel not found</p>
                <p className="text-gray-500">Check the URL and try again</p>
            </div>
        </div>
    );

    return (
        <>
            {/* Razorpay script */}
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="afterInteractive"
            />

            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
                {/* Hotel Header */}
                <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                    <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
                        {hotel.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={hotel.logo} alt={hotel.hotelName} className="h-10 w-10 rounded-xl object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-lg"
                                style={{ backgroundColor: hotel.brandColor || '#1D4ED8' }}>
                                {hotel.hotelName[0]}
                            </div>
                        )}
                        <div className="flex-1">
                            <h1 className="font-bold text-gray-900 text-base leading-tight">{hotel.hotelName}</h1>
                            <div className="flex items-center gap-2">
                                <Stars n={hotel.starRating || 3} />
                                <span className="text-xs text-gray-400">{hotel.address?.city}</span>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
                            <span>Check-in: {hotel.checkInTime}</span>
                            <span>·</span>
                            <span>Check-out: {hotel.checkOutTime}</span>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 py-8">
                    {step < 5 && <Steps current={step} />}

                    {/* ── Step 1: Dates ────────────────────────────────────────────── */}
                    {step === 1 && (
                        <div className="max-w-lg mx-auto">
                            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Plan your stay</h2>
                            <p className="text-gray-500 text-center mb-8 text-sm">Best rates — no OTA commission</p>

                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Check-in</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type="date" value={checkIn} min={today}
                                                onChange={e => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(''); }}
                                                className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Check-out</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type="date" value={checkOut} min={checkIn || today}
                                                onChange={e => setCheckOut(e.target.value)}
                                                className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                </div>

                                {nights > 0 && (
                                    <div className="bg-blue-50 rounded-xl px-4 py-2.5 text-center text-sm text-blue-700 font-semibold">
                                        {nights} night{nights > 1 ? 's' : ''}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Adults</label>
                                        <select value={adults} onChange={e => setAdults(parseInt(e.target.value))}
                                            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Children</label>
                                        <select value={children} onChange={e => setChildren(parseInt(e.target.value))}
                                            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Child' : 'Children'}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { if (!checkIn || !checkOut || nights < 1) { alert('Please select valid dates'); return; } setStep(2); }}
                                    className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                                    style={{ backgroundColor: hotel.brandColor || '#1D4ED8' }}>
                                    Search Available Rooms →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Room Selection ───────────────────────────────────── */}
                    {step === 2 && (
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                                <div className="bg-gray-100 rounded-xl px-4 py-2 text-sm text-gray-700 font-medium">
                                    📅 {checkIn} → {checkOut} · {nights}n · {adults} adult{adults > 1 ? 's' : ''}
                                </div>
                            </div>

                            {roomsLoad ? (
                                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
                            ) : !availableRooms?.length ? (
                                <div className="text-center py-16">
                                    <BedDouble className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                    <p className="font-semibold text-gray-700 text-lg">No rooms available</p>
                                    <p className="text-gray-500 text-sm mt-1">Try different dates</p>
                                    <button onClick={() => setStep(1)} className="mt-4 text-blue-600 hover:underline text-sm font-medium">← Change dates</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500 font-medium">{availableRooms.length} room{availableRooms.length > 1 ? 's' : ''} available</p>
                                    {availableRooms.map(room => {
                                        const roomGst = room.baseRate <= 1000 ? 0 : room.baseRate <= 7500 ? 0.12 : 0.18;
                                        const totalNet = room.baseRate * nights;
                                        const totalGst = Math.round(totalNet * roomGst);
                                        return (
                                            <div key={room._id}
                                                className={`bg-white rounded-2xl border-2 p-5 transition-all cursor-pointer hover:shadow-lg
                          ${selectedRoom?._id === room._id ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}`}
                                                onClick={() => setSelectedRoom(room)}>
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-bold text-gray-900">Room {room.number}</h3>
                                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize font-medium">{room.type}</span>
                                                            {room.view && <span className="text-xs text-gray-400 capitalize">{room.view} view</span>}
                                                        </div>
                                                        <p className="text-sm text-gray-500 capitalize mb-2">{room.bedType} bed · {room.maxAdults} adults max{room.squareFeet ? ` · ${room.squareFeet} sq ft` : ''}</p>
                                                        {room.description && <p className="text-xs text-gray-500 mb-2">{room.description}</p>}
                                                        <div className="flex flex-wrap gap-1">
                                                            {room.amenities.slice(0, 6).map(a => {
                                                                const Icon = AMENITY_ICONS[a];
                                                                return (
                                                                    <span key={a} className="flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                                                        {Icon && <Icon className="w-2.5 h-2.5" />} {a}
                                                                    </span>
                                                                );
                                                            })}
                                                            {room.amenities.length > 6 && <span className="text-[10px] text-gray-400">+{room.amenities.length - 6} more</span>}
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-2xl font-black text-gray-900">{formatCurrency(room.baseRate)}</p>
                                                        <p className="text-xs text-gray-400">per night</p>
                                                        <p className="text-sm font-bold text-gray-700 mt-1">
                                                            {formatCurrency(totalNet + totalGst)} total
                                                        </p>
                                                        <p className="text-[10px] text-gray-400">incl. {roomGst * 100}% GST</p>
                                                    </div>
                                                </div>
                                                {selectedRoom?._id === room._id && (
                                                    <div className="mt-3 pt-3 border-t border-blue-100 flex items-center gap-2 text-blue-600 text-sm font-medium">
                                                        <CheckCircle className="w-4 h-4" /> Selected
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    <div className="space-y-3 mt-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meal Plan</label>
                                            <select value={mealPlan} onChange={e => setMealPlan(e.target.value)}
                                                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <option value="room_only">Room Only</option>
                                                <option value="cp">CP — Breakfast included</option>
                                                <option value="map">MAP — Breakfast + Dinner</option>
                                                <option value="ap">AP — All Meals</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Special Requests (optional)</label>
                                            <textarea value={specialReq} onChange={e => setSpecialReq(e.target.value)} rows={2}
                                                placeholder="Early check-in, high floor, dietary preferences..."
                                                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { if (!selectedRoom) { alert('Please select a room'); return; } setStep(3); }}
                                        disabled={!selectedRoom}
                                        className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 hover:shadow-lg"
                                        style={{ backgroundColor: hotel.brandColor || '#1D4ED8' }}>
                                        Continue with {selectedRoom ? `Room ${selectedRoom.number}` : 'selected room'} →
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Step 3: Guest Details ────────────────────────────────────── */}
                    {step === 3 && (
                        <div className="max-w-lg mx-auto">
                            <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
                                <ArrowLeft className="w-4 h-4" /> Back to rooms
                            </button>

                            <h2 className="text-xl font-bold text-gray-900 mb-6">Your Details</h2>

                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { k: 'firstName', l: 'First Name *', t: 'text', p: 'Raj' },
                                        { k: 'lastName', l: 'Last Name *', t: 'text', p: 'Sharma' },
                                    ].map(f => (
                                        <div key={f.k}>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.l}</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input type={f.t} value={(guestForm as any)[f.k]} onChange={gF(f.k)} placeholder={f.p} required
                                                    className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                            </div>
                                        </div>
                                    ))}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone / WhatsApp *</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type="tel" value={guestForm.phone} onChange={gF('phone')} placeholder="+91 98765 43210" required
                                                className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type="email" value={guestForm.email} onChange={gF('email')} placeholder="you@email.com"
                                                className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { if (!guestForm.firstName || !guestForm.lastName || !guestForm.phone) { alert('Name and phone are required'); return; } setStep(4); }}
                                    className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                                    style={{ backgroundColor: hotel.brandColor || '#1D4ED8' }}>
                                    Review Booking →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 4: Review + Payment ─────────────────────────────────── */}
                    {step === 4 && selectedRoom && (
                        <div className="max-w-lg mx-auto">
                            <button onClick={() => setStep(3)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>

                            <h2 className="text-xl font-bold text-gray-900 mb-6">Review Your Booking</h2>

                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4 mb-4">
                                {/* Summary */}
                                <div className="space-y-2.5">
                                    {[
                                        { l: 'Hotel', v: hotel.hotelName },
                                        { l: 'Room', v: `${selectedRoom.number} · ${selectedRoom.type} · ${selectedRoom.bedType} bed` },
                                        { l: 'Check-in', v: `${checkIn} after ${hotel.checkInTime}` },
                                        { l: 'Check-out', v: `${checkOut} before ${hotel.checkOutTime}` },
                                        { l: 'Nights', v: String(nights) },
                                        { l: 'Guests', v: `${adults} adult${adults > 1 ? 's' : ''}${children > 0 ? `, ${children} children` : ''}` },
                                        { l: 'Meal Plan', v: mealPlan.replace('_', ' ') },
                                        { l: 'Name', v: `${guestForm.firstName} ${guestForm.lastName}` },
                                        { l: 'Phone', v: guestForm.phone },
                                    ].map(r => (
                                        <div key={r.l} className="flex justify-between text-sm">
                                            <span className="text-gray-400">{r.l}</span>
                                            <span className="font-medium text-gray-900 capitalize text-right max-w-[60%]">{r.v}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-gray-100 pt-3 space-y-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Room ({nights} nights × {formatCurrency(selectedRoom.baseRate)})</span>
                                        <span className="font-medium">{formatCurrency(roomTotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">GST ({gst * 100}%)</span>
                                        <span className="font-medium text-yellow-700">{formatCurrency(taxTotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-bold pt-1 border-t border-gray-200">
                                        <span>Total</span>
                                        <span style={{ color: hotel.brandColor || '#1D4ED8' }}>{formatCurrency(grandTotal)}</span>
                                    </div>
                                </div>

                                {specialReq && (
                                    <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                                        <strong>Special Request:</strong> {specialReq}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                                <Shield className="w-4 h-4" />
                                Secure payment · 256-bit SSL · Powered by Razorpay
                            </div>

                            <button
                                onClick={() => createBooking.mutate()}
                                disabled={createBooking.isPending || paymentLoading}
                                className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
                                style={{ backgroundColor: hotel.brandColor || '#1D4ED8' }}>
                                {createBooking.isPending || paymentLoading ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                                ) : (
                                    <><CreditCard className="w-5 h-5" /> Pay {formatCurrency(grandTotal)} & Confirm</>
                                )}
                            </button>

                            <p className="text-xs text-center text-gray-400 mt-3">
                                By booking you agree to the hotel's cancellation policy.
                                A WhatsApp confirmation will be sent to {guestForm.phone}.
                            </p>
                        </div>
                    )}

                    {/* ── Step 5: Confirmation ─────────────────────────────────────── */}
                    {step === 5 && (
                        <div className="max-w-lg mx-auto text-center py-8 space-y-6">
                            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Booking Confirmed! 🎉</h2>
                                <p className="text-gray-500 mt-2">Check your WhatsApp for full details</p>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-left space-y-2.5">
                                {[
                                    { l: 'Booking Ref', v: bookingRef, mono: true },
                                    { l: 'Hotel', v: hotel.hotelName },
                                    { l: 'Room', v: selectedRoom ? `${selectedRoom.number} · ${selectedRoom.type}` : '' },
                                    { l: 'Check-in', v: `${checkIn} · ${hotel.checkInTime}` },
                                    { l: 'Check-out', v: `${checkOut} · ${hotel.checkOutTime}` },
                                    { l: 'Total Paid', v: formatCurrency(grandTotal) },
                                ].map(r => (
                                    <div key={r.l} className="flex justify-between text-sm">
                                        <span className="text-gray-400">{r.l}</span>
                                        <span className={`font-semibold text-gray-900 ${r.mono ? 'font-mono' : ''}`}>{r.v}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800 text-left">
                                <p className="font-semibold mb-1">📱 WhatsApp confirmation sent!</p>
                                <p className="text-xs text-green-700">A detailed confirmation with check-in instructions has been sent to {guestForm.phone}.</p>
                            </div>

                            <button
                                onClick={() => openWhatsApp(guestForm.phone, `Hi, I have a booking at ${hotel.hotelName} — Ref: ${bookingRef}`)}
                                className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                Chat with Hotel on WhatsApp
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
