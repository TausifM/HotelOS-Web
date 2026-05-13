'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatCurrency, formatNights } from '@/lib/utils';
import {
  Search, User, BedDouble, Calendar, ChevronRight, Plus,
  ArrowLeft, CheckCircle, Loader2, Phone, Mail,
  Sparkles, Star, Utensils, Globe, CreditCard,
  Users, Baby, ChevronLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Guest {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  loyalty?: { tier: string; points: number };
}

interface Room {
  _id: string;
  number: string;
  type: string;
  floor: number;
  view?: string;
  bedType: string;
  baseRate: number;
  maxAdults: number;
  status: string;
}

function openWhatsApp(phone: string, message: string) {
  const cleaned = phone.replace(/\D/g, '');
  const number = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
}

const inputBase =
  'w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all border-gray-200 bg-white text-gray-900 placeholder:text-gray-400';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  subtitle,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div
        className="flex items-center gap-3 border-b border-gray-50 px-5 py-4"
        style={{ background: '#fafafa' }}
      >
        {icon}
        <div>
          <p className="text-sm font-bold text-gray-900">{title}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        {badge && <div className="ml-auto">{badge}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const TIER_STYLES: Record<string, string> = {
  bronze: 'bg-amber-100 text-amber-800',
  silver: 'bg-gray-100 text-gray-700',
  gold: 'bg-yellow-100 text-yellow-800',
  platinum: 'bg-indigo-100 text-indigo-800',
};

const ROOM_GRADIENTS: Record<string, string> = {
  standard: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)',
  deluxe: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
  executive: 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
  suite: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
  villa: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
};

const ROOM_TEXT: Record<string, string> = {
  standard: 'text-gray-700',
  deluxe: 'text-blue-700',
  executive: 'text-purple-700',
  suite: 'text-amber-700',
  villa: 'text-green-700',
};

function Steps({ current }: { current: number }) {
  const steps = [
    { label: 'Guest' },
    { label: 'Room & Dates' },
    { label: 'Confirm' },
  ];

  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;

        return (
          <div key={s.label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all"
                style={
                  done
                    ? { background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff' }
                    : active
                      ? { background: 'linear-gradient(135deg,#F97316,#F43F5E)', color: '#fff' }
                      : { background: '#f1f5f9', color: '#94a3b8' }
                }
              >
                {done ? <CheckCircle className="h-3.5 w-3.5" /> : n}
              </div>
              <span
                className="hidden text-xs font-semibold sm:inline"
                style={{ color: active ? '#111' : done ? '#10b981' : '#94a3b8' }}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="h-px w-6 sm:w-10"
                style={{ background: done ? '#10b981' : '#e2e8f0' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function NewReservationPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [guestSearch, setGuestSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showNewGuest, setShowNewGuest] = useState(false);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState('1');
  const [children, setChildren] = useState('0');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [ratePlan, setRatePlan] = useState('BAR');
  const [ratePerNight, setRatePerNight] = useState('');
  const [source, setSource] = useState('direct');
  const [mealPlan, setMealPlan] = useState('room_only');
  const [specialRequests, setSpecialRequests] = useState('');
  const [advancePaid, setAdvancePaid] = useState('0');

  const [newGuest, setNewGuest] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });

  const nights = checkIn && checkOut ? formatNights(checkIn, checkOut) : 0;
  const rate = parseFloat(ratePerNight) || 0;
  const total = rate * nights;
  const gstPercent = rate <= 1000 ? 0 : rate <= 7500 ? 12 : 18;
  const gst = Math.round((total * gstPercent) / 100);
  const grandTotal = total + gst;

  const { data: guestResults } = useQuery({
    queryKey: ['guest-search', guestSearch],
    queryFn: () =>
      api
        .get('/api/guests', { params: { search: guestSearch, limit: 8 } })
        .then((r) => r.data.data.docs),
    enabled: guestSearch.length >= 2,
  });

  const { data: availableRooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['available-rooms', checkIn, checkOut, adults],
    queryFn: () =>
      api
        .get('/api/rooms/available', {        // ← correct route
          params: { checkIn, checkOut, adults },  // ← pass adults for maxAdults filter
        })
        .then((r) => r.data.data.rooms),      // ← backend returns { data: { rooms, meta } }
    enabled: !!(checkIn && checkOut && nights > 0),
    staleTime: 0,   // ← never cache room availability
    gcTime: 0,
  });

  useEffect(() => {
    if (selectedRoom) setRatePerNight(String(selectedRoom.baseRate));
  }, [selectedRoom]);

  const createGuest = useMutation({
    mutationFn: (d: any) => api.post('/api/guests', d),
    onSuccess: (res) => {
      setSelectedGuest(res.data.data);
      setShowNewGuest(false);
      setStep(2);
      toast.success('Guest created!');
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || 'Failed to create guest'),
  });

  const createReservation = useMutation({
    mutationFn: (d: any) => api.post('/api/reservations', d),
    onSuccess: (res) => {
      const booking = res.data.data;
      toast.success(`Reservation ${booking.bookingRef} created!`);

      if (selectedGuest?.phone) {
        const message =
          `✅ *Booking Confirmed!*

Hello ${selectedGuest.firstName},

Your reservation is confirmed at *The Grand Mumbai*.

📋 *Booking Details:*
- Reference: ${booking.bookingRef}
- Room: ${booking.roomNumber}
- Check-in: ${checkIn}
- Check-out: ${checkOut}
- Nights: ${nights}
- Guests: ${adults} adult${parseInt(adults) > 1 ? 's' : ''}${parseInt(children) > 0 ? `, ${children} child` : ''}
- Meal Plan: ${mealPlan.replace('_', ' ')}
- Total Amount: ${formatCurrency(grandTotal)}

We look forward to hosting you! 🏨

_For any assistance, reply to this message._`;

        openWhatsApp(selectedGuest.phone, message);
      }

      router.push(`/dashboard/reservations/${booking._id}`);
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || 'Failed to create reservation'),
  });

  function handleConfirm() {
    if (!selectedGuest || !selectedRoom || !checkIn || !checkOut || nights < 1) {
      toast.error('Please fill all required fields');
      return;
    }

    createReservation.mutate({
      guestId: selectedGuest._id,
      roomId: selectedRoom._id,
      checkIn,
      checkOut,
      adults: parseInt(adults),
      children: parseInt(children),
      ratePlan,
      ratePerNight: rate,
      source,
      mealPlan,
      specialRequests: specialRequests || undefined,
      advancePaid: parseFloat(advancePaid) || 0,
    });
  }

  const Header = ({ subtitle }: { subtitle: string }) => (
    <div
      className="relative overflow-hidden rounded-2xl px-5 py-6 text-white sm:rounded-3xl sm:px-8 sm:py-7"
      style={{ background: 'linear-gradient(135deg,#F97316 0%,#F43F5E 100%)' }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-20"
        style={{ background: 'rgba(255,255,255,0.3)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-4 left-16 h-20 w-20 rounded-full opacity-10"
        style={{ background: 'rgba(255,255,255,0.5)' }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <Calendar className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">
              Reservation Flow
            </span>
          </div>
          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
            New Reservation
          </h1>
          <p className="mt-1 text-sm opacity-80">{subtitle}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <Steps current={step} />
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout title="New Reservation">
      <div className="max-w-3xl space-y-5 pb-10">
        <Header
          subtitle={
            step === 1
              ? 'Search an existing guest or create a quick walk-in profile'
              : step === 2
                ? 'Choose stay dates, occupancy, and an available room'
                : 'Review pricing and confirm the booking'
          }
        />

        {step === 1 && (
          <SectionCard
            icon={
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}
              >
                <User className="h-4 w-4 text-orange-500" />
              </div>
            }
            title={showNewGuest ? 'Create New Guest' : 'Select Guest'}
            subtitle={
              showNewGuest
                ? 'Quick create a guest and continue reservation'
                : 'Search by name, phone, or email'
            }
            badge={
              !showNewGuest ? (
                <div
                  className="rounded-full px-2.5 py-1 text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', color: '#7c3aed' }}
                >
                  Front Desk
                </div>
              ) : undefined
            }
          >
            {!showNewGuest ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    className={`${inputBase} pl-10`}
                    placeholder="Type at least 2 characters..."
                    value={guestSearch}
                    onChange={(e) => setGuestSearch(e.target.value)}
                  />
                </div>

                {guestResults?.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-gray-100">
                    {guestResults.map((g: Guest) => (
                      <button
                        key={g._id}
                        onClick={() => {
                          setSelectedGuest(g);
                          setStep(2);
                        }}
                        className="group flex w-full items-center gap-3 border-b border-gray-50 px-4 py-3 text-left transition-all last:border-0 hover:bg-orange-50/60"
                      >
                        <div
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}
                        >
                          {g.firstName[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900">
                            {g.firstName} {g.lastName}
                          </p>
                          <p className="truncate text-xs text-gray-400">
                            {g.phone}
                            {g.email ? ` · ${g.email}` : ''}
                          </p>
                        </div>
                        {g.loyalty?.tier && (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${TIER_STYLES[g.loyalty.tier] || 'bg-gray-100 text-gray-600'}`}
                          >
                            {g.loyalty.tier}
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                )}

                {guestSearch.length >= 2 && guestResults?.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center">
                    <User className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">No guests found</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      Try another search or create a new guest
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setShowNewGuest(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{
                    background: 'linear-gradient(135deg,#F97316,#F43F5E)',
                    boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
                  }}
                >
                  <Plus className="h-4 w-4" /> Create New Guest
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="First Name" required>
                    <input
                      className={inputBase}
                      value={newGuest.firstName}
                      onChange={(e) =>
                        setNewGuest((p) => ({ ...p, firstName: e.target.value }))
                      }
                      placeholder="First name"
                    />
                  </Field>

                  <Field label="Last Name" required>
                    <input
                      className={inputBase}
                      value={newGuest.lastName}
                      onChange={(e) =>
                        setNewGuest((p) => ({ ...p, lastName: e.target.value }))
                      }
                      placeholder="Last name"
                    />
                  </Field>

                  <Field label="Phone" required>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        className={`${inputBase} pl-10`}
                        value={newGuest.phone}
                        onChange={(e) =>
                          setNewGuest((p) => ({ ...p, phone: e.target.value }))
                        }
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </Field>

                  <Field label="Email">
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        className={`${inputBase} pl-10`}
                        value={newGuest.email}
                        onChange={(e) =>
                          setNewGuest((p) => ({ ...p, email: e.target.value }))
                        }
                        placeholder="guest@example.com"
                      />
                    </div>
                  </Field>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNewGuest(false)}
                    className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => createGuest.mutate(newGuest)}
                    disabled={
                      createGuest.isPending ||
                      !newGuest.firstName ||
                      !newGuest.lastName ||
                      !newGuest.phone
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                    style={{
                      background: 'linear-gradient(135deg,#F97316,#F43F5E)',
                      boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
                    }}
                  >
                    {createGuest.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" /> Create & Continue
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </SectionCard>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div
              className="flex items-center gap-3 rounded-2xl border px-4 py-3.5"
              style={{ background: '#ecfdf5', borderColor: '#bbf7d0' }}
            >
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}
              >
                {selectedGuest?.firstName[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-green-900">
                  {selectedGuest?.firstName} {selectedGuest?.lastName}
                </p>
                <p className="text-xs text-green-600">{selectedGuest?.phone}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedGuest(null);
                  setStep(1);
                }}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-green-700 transition-all hover:bg-green-100"
              >
                Change
              </button>
            </div>

            <SectionCard
              icon={
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)' }}
                >
                  <Calendar className="h-4 w-4 text-blue-500" />
                </div>
              }
              title="Dates & Details"
              badge={
                nights > 0 ? (
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}
                  >
                    {nights} night{nights > 1 ? 's' : ''}
                  </span>
                ) : undefined
              }
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Check-in Date" required>
                    <input
                      type="date"
                      className={inputBase}
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </Field>

                  <Field label="Check-out Date" required>
                    <input
                      type="date"
                      className={inputBase}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn || new Date().toISOString().split('T')[0]}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Field label="Adults">
                    <div className="relative">
                      <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <select
                        className={`${inputBase} appearance-none pl-9`}
                        value={adults}
                        onChange={(e) => setAdults(e.target.value)}
                      >
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>
                            {n} Adult{n > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Field>

                  <Field label="Children">
                    <div className="relative">
                      <Baby className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <select
                        className={`${inputBase} appearance-none pl-9`}
                        value={children}
                        onChange={(e) => setChildren(e.target.value)}
                      >
                        {[0, 1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? 'Child' : 'Children'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Field>

                  <Field label="Source">
                    <div className="relative">
                      <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <select
                        className={`${inputBase} appearance-none pl-9`}
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                      >
                        {[
                          'direct',
                          'walk_in',
                          'phone',
                          'booking_com',
                          'expedia',
                          'mmt',
                          'goibibo',
                          'airbnb',
                          'agoda',
                          'yatra',
                          'corporate',
                        ].map((s) => (
                          <option key={s} value={s}>
                            {s.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Field>

                  <Field label="Meal Plan">
                    <div className="relative">
                      <Utensils className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <select
                        className={`${inputBase} appearance-none pl-9`}
                        value={mealPlan}
                        onChange={(e) => setMealPlan(e.target.value)}
                      >
                        <option value="room_only">Room Only</option>
                        <option value="cp">CP (Breakfast)</option>
                        <option value="map">MAP (Breakfast + Dinner)</option>
                        <option value="ap">AP (All Meals)</option>
                      </select>
                    </div>
                  </Field>
                </div>

                <Field label="Special Requests">
                  <input
                    className={inputBase}
                    placeholder="Early check-in, extra pillows, ground floor..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                  />
                </Field>
              </div>
            </SectionCard>

            {checkIn && checkOut && nights > 0 && (
              <SectionCard
                icon={
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)' }}
                  >
                    <BedDouble className="h-4 w-4 text-violet-600" />
                  </div>
                }
                title="Select Room"
                subtitle={
                  roomsLoading
                    ? 'Checking availability...'
                    : availableRooms?.length
                      ? `${availableRooms.length} room${availableRooms.length !== 1 ? 's' : ''} available for these dates`
                      : 'No rooms available'
                }
              >
                {roomsLoading ? (
                  <div className="flex flex-col items-center gap-3 py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
                    <p className="text-sm text-gray-400">Loading available rooms...</p>
                  </div>
                ) : !availableRooms?.length ? (
                  <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center">
                    <BedDouble className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">
                      No rooms available for these dates
                    </p>
                    <p className="mt-1 text-xs text-gray-400">Try another room type or date</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {availableRooms.map((room: Room) => {
                      const selected = selectedRoom?._id === room._id;

                      return (
                        <button
                          key={room._id}
                          onClick={() => setSelectedRoom(room)}
                          className="relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all"
                          style={{
                            borderColor: selected ? '#F97316' : '#e5e7eb',
                            background: selected
                              ? 'linear-gradient(135deg,#fff7ed,#fff1f2)'
                              : ROOM_GRADIENTS[room.type] || '#f9fafb',
                            boxShadow: selected
                              ? '0 4px 16px rgba(249,115,22,0.2)'
                              : 'none',
                          }}
                        >
                          {selected && (
                            <div
                              className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full"
                              style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}
                            >
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                          )}

                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-lg font-bold text-gray-900">
                              Room {room.number}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${ROOM_TEXT[room.type] || 'text-gray-600'}`}
                              style={{ background: 'rgba(255,255,255,0.7)' }}
                            >
                              {room.type}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500">
                            Floor {room.floor} · {room.bedType} bed
                            {room.view ? ` · ${room.view} view` : ''}
                          </p>

                          <p
                            className="mt-2 text-base font-bold"
                            style={{ color: selected ? '#F97316' : '#374151' }}
                          >
                            {formatCurrency(room.baseRate)}
                            <span className="text-xs font-normal text-gray-400">/night</span>
                          </p>

                          {nights > 0 && (
                            <p className="mt-0.5 text-xs text-gray-400">
                              {formatCurrency(room.baseRate * nights)} for {nights} nights
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>

              <button
                onClick={() => setStep(3)}
                disabled={!selectedRoom || nights < 1}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg,#F97316,#F43F5E)',
                  boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
                }}
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && selectedGuest && selectedRoom && (
          <div className="space-y-5">
            <SectionCard
              icon={
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)' }}
                >
                  <Sparkles className="h-4 w-4 text-violet-600" />
                </div>
              }
              title="Confirm Reservation"
            >
              <div className="space-y-4">
                <div className="space-y-2 rounded-xl bg-gray-50 p-4">
                  {[
                    ['Guest', `${selectedGuest.firstName} ${selectedGuest.lastName}`],
                    ['Room', `${selectedRoom.number} (${selectedRoom.type})`],
                    ['Check-in', checkIn],
                    ['Check-out', checkOut],
                    ['Nights', String(nights)],
                    [
                      'Guests',
                      `${adults} adults${parseInt(children) > 0 ? `, ${children} children` : ''}`,
                    ],
                    ['Source', source.replace('_', ' ')],
                    ['Meal Plan', mealPlan.replace('_', ' ')],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium capitalize text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Rate Plan">
                    <select
                      className={`${inputBase} appearance-none`}
                      value={ratePlan}
                      onChange={(e) => setRatePlan(e.target.value)}
                    >
                      <option value="BAR">BAR (Best Available)</option>
                      <option value="BB">BB (Bed & Breakfast)</option>
                      <option value="CP">CP (Continental Plan)</option>
                      <option value="NR">NR (Non-Refundable)</option>
                      <option value="CORP">Corporate Rate</option>
                    </select>
                  </Field>

                  <Field label="Rate per Night (₹)">
                    <input
                      type="number"
                      className={inputBase}
                      value={ratePerNight}
                      onChange={(e) => setRatePerNight(e.target.value)}
                      min="0"
                    />
                  </Field>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-100">
                  {[
                    {
                      label: `Room charges (${nights} nights × ${formatCurrency(rate)})`,
                      value: formatCurrency(total),
                    },
                    {
                      label: `GST (${gstPercent}%)`,
                      value: formatCurrency(gst),
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between border-b border-gray-100 px-4 py-2 text-sm last:border-0"
                    >
                      <span className="text-gray-500">{row.label}</span>
                      <span className="font-medium text-gray-900">{row.value}</span>
                    </div>
                  ))}

                  <div
                    className="flex justify-between px-4 py-3 text-sm font-bold"
                    style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}
                  >
                    <span className="text-gray-900">Grand Total</span>
                    <span className="text-base" style={{ color: '#F97316' }}>
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                </div>

                <Field label="Advance Payment Received (₹)">
                  <input
                    type="number"
                    className={inputBase}
                    min="0"
                    max={grandTotal}
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(e.target.value)}
                    placeholder="0"
                  />
                </Field>

                {parseFloat(advancePaid) > 0 && (
                  <div
                    className="flex justify-between rounded-xl px-4 py-3 text-sm"
                    style={{ background: '#ecfdf5', border: '1px solid #bbf7d0' }}
                  >
                    <span className="text-green-700">Balance Due</span>
                    <span className="font-bold text-green-800">
                      {formatCurrency(grandTotal - parseFloat(advancePaid))}
                    </span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>

                  <button
                    onClick={handleConfirm}
                    disabled={createReservation.isPending || !rate || nights < 1}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
                    style={{
                      background: 'linear-gradient(135deg,#F97316,#F43F5E)',
                      boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
                    }}
                  >
                    {createReservation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" /> Confirm Reservation
                      </>
                    )}
                  </button>
                </div>
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}