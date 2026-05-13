'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Input, Select, Spinner } from '@/components/ui';
import api from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import {
  UserPlus,
  BedDouble,
  CreditCard,
  CheckCircle,
  Search,
  Zap,
  Phone,
  ChevronRight,
  Banknote,
  QrCode,
  Smartphone,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Room {
  _id: string;
  number: string;
  type: string;
  bedType: string;
  baseRate: number;
  floor: number;
  view?: string;
  amenities: string[];
}

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'upi', label: 'UPI', icon: QrCode },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'razorpay', label: 'Online', icon: Smartphone },
];

const ID_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_licence', label: 'Driving Licence' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'other', label: 'Other' },
];

const GST_RATE = (rate: number) => (rate <= 1000 ? 0 : rate <= 7500 ? 0.12 : 0.18);

function SectionCard({
  title,
  stepNo,
  active,
  done,
  children,
}: {
  title: string;
  stepNo: number;
  active: boolean;
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-orange-100 bg-gradient-to-r from-orange-50 via-rose-50 to-pink-50 px-5 py-4">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
            done
              ? 'bg-emerald-500 text-white'
              : active
              ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
              : 'bg-orange-100 text-orange-700',
          )}
        >
          {done ? '✓' : stepNo}
        </div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function WalkInPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [nights, setNights] = useState(1);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [customRate, setCustomRate] = useState('');
  const [mealPlan, setMealPlan] = useState('room_only');
  const [payMode, setPayMode] = useState('cash');
  const [advancePaid, setAdvancePaid] = useState('');
  const [specialReq, setSpecialReq] = useState('');

  const [guestSearch, setGuestSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [newGuestMode, setNewGuestMode] = useState(false);
  const [guestForm, setGuestForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    idType: 'aadhaar',
    idNumber: '',
  });

  const [step, setStep] = useState<'room' | 'guest' | 'payment' | 'done'>('room');
  const [booking, setBooking] = useState<any>(null);

  const today = new Date().toISOString().split('T')[0];
  const checkOut = new Date(Date.now() + nights * 86400000).toISOString().split('T')[0];

  const { data: rooms, isLoading: roomsLoad } = useQuery<Room[]>({
    queryKey: ['walkin-rooms', nights, adults],
    queryFn: () =>
      api
        .get('/api/rooms/available', {
          params: { checkIn: today, checkOut, adults, status: 'VC' },
        })
        .then((r) => r.data.data.rooms || []),
  });

  const { data: guestResults, isLoading: guestSearchLoad } = useQuery({
    queryKey: ['guest-search-walkin', guestSearch],
    queryFn: () =>
      api
        .get('/api/guests', { params: { search: guestSearch, limit: 6 } })
        .then((r) => r.data.data?.docs || []),
    enabled: guestSearch.length >= 2,
  });

  const effectiveRate = customRate ? parseFloat(customRate) : selectedRoom?.baseRate || 0;
  const gstRate = GST_RATE(effectiveRate);
  const roomCharge = effectiveRate * nights;
  const taxAmount = Math.round(roomCharge * gstRate);
  const totalAmount = roomCharge + taxAmount;
  const balanceDue = totalAmount - (parseFloat(advancePaid) || 0);

  const walkInMut = useMutation({
    mutationFn: () =>
      api.post('/api/reservations/walkin', {
        roomId: selectedRoom!._id,
        roomNumber: selectedRoom!.number,
        checkIn: today,
        checkOut,
        nights,
        adults,
        children,
        mealPlan,
        ratePerNight: effectiveRate,
        source: 'walkin',
        paymentMode: payMode,
        advancePaid: parseFloat(advancePaid) || 0,
        specialRequests: specialReq,
        guestId: selectedGuest?._id || undefined,
        newGuest: !selectedGuest
          ? {
              firstName: guestForm.firstName,
              lastName: guestForm.lastName,
              phone: guestForm.phone,
              idType: guestForm.idType,
              idNumber: guestForm.idNumber,
              idVerified: true,
            }
          : undefined,
      }),
    onSuccess: (d) => {
      setBooking(d.data.data);
      setStep('done');
      qc.invalidateQueries({ queryKey: ['walkin-rooms'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Walk-in completed successfully');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Walk-in failed'),
  });

  const displayCheckIn = useMemo(
    () =>
      new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    [],
  );

  const displayCheckOut = useMemo(
    () =>
      new Date(Date.now() + nights * 86400000).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    [nights],
  );

  const canContinueGuest = !!selectedRoom;
  const canContinuePayment =
    !!selectedGuest ||
    (newGuestMode && !!guestForm.firstName && !!guestForm.phone && !!guestForm.idNumber);

  return (
    <DashboardLayout title="Walk-in">
      <div className="max-w-5xl space-y-5">
        <div className="rounded-3xl border border-orange-100 bg-gradient-to-r from-orange-50 via-rose-50 to-pink-50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 shadow-md">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Walk-in Check-in</h1>
              <p className="text-sm text-slate-500">
                Quick reservation + immediate check-in ·{' '}
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                })}
              </p>
            </div>
          </div>
        </div>

        {step !== 'done' && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <SectionCard title="Select Room & Duration" stepNo={1} active={step === 'room'} done={step !== 'room'}>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        label: 'Nights',
                        value: nights,
                        dec: () => setNights((n) => Math.max(1, n - 1)),
                        inc: () => setNights((n) => n + 1),
                      },
                      {
                        label: 'Adults',
                        value: adults,
                        dec: () => setAdults((n) => Math.max(1, n - 1)),
                        inc: () => setAdults((n) => n + 1),
                      },
                      {
                        label: 'Children',
                        value: children,
                        dec: () => setChildren((n) => Math.max(0, n - 1)),
                        inc: () => setChildren((n) => n + 1),
                      },
                    ].map((item) => (
                      <div key={item.label}>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {item.label}
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={item.dec}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-200 text-slate-600 transition hover:bg-orange-50"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-lg font-bold text-slate-900">{item.value}</span>
                          <button
                            onClick={item.inc}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-200 text-slate-600 transition hover:bg-orange-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {roomsLoad ? (
                    <div className="flex justify-center py-8">
                      <Spinner />
                    </div>
                  ) : !rooms?.length ? (
                    <div className="py-8 text-center text-slate-400">
                      <BedDouble className="mx-auto mb-2 h-10 w-10 text-slate-200" />
                      <p className="font-medium">No vacant rooms available</p>
                    </div>
                  ) : (
                    <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                      {rooms.map((room) => (
                        <button
                          key={room._id}
                          onClick={() => {
                            setSelectedRoom(room);
                            setCustomRate('');
                            if (step === 'room') setStep('guest');
                          }}
                          className={cn(
                            'rounded-2xl border-2 p-3 text-left transition-all hover:shadow-md',
                            selectedRoom?._id === room._id
                              ? 'border-pink-400 bg-gradient-to-br from-orange-50 to-pink-50'
                              : 'border-orange-100 bg-white hover:border-orange-300',
                          )}
                        >
                          <div className="mb-1 flex w-full items-center justify-between">
                            <span className="text-lg font-black text-slate-900">{room.number}</span>
                            {selectedRoom?._id === room._id && <CheckCircle className="h-4 w-4 text-pink-500" />}
                          </div>
                          <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium capitalize text-orange-700">
                            {room.type}
                          </span>
                          <span className="mt-1 block text-xs font-bold text-slate-700">
                            {formatCurrency(room.baseRate)}
                            <span className="font-normal text-slate-400">/night</span>
                          </span>
                          <span className="text-[10px] capitalize text-slate-400">
                            {room.bedType} · F{room.floor}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedRoom && (
                    <div className="grid grid-cols-2 gap-3 border-t border-orange-100 pt-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Custom Rate (₹) <span className="normal-case font-normal text-slate-400">optional</span>
                        </label>
                        <input
                          type="number"
                          value={customRate}
                          onChange={(e) => setCustomRate(e.target.value)}
                          placeholder={`Default: ₹${selectedRoom.baseRate}`}
                          className="w-full rounded-2xl border border-orange-200 px-3 py-2.5 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Meal Plan
                        </label>
                        <select
                          value={mealPlan}
                          onChange={(e) => setMealPlan(e.target.value)}
                          className="w-full rounded-2xl border border-orange-200 px-3 py-2.5 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                        >
                          <option value="room_only">Room Only</option>
                          <option value="cp">CP — Breakfast</option>
                          <option value="map">MAP — B+D</option>
                          <option value="ap">AP — All Meals</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {step === 'room' && (
                    <div className="flex justify-end">
                      <Button
                        onClick={() => {
                          if (!canContinueGuest) {
                            toast.error('Please select a room');
                            return;
                          }
                          setStep('guest');
                        }}
                        className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
                      >
                        Continue <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </SectionCard>

              {(step === 'guest' || step === 'payment') && (
                <SectionCard title="Guest Information" stepNo={2} active={step === 'guest'} done={step === 'payment'}>
                  <div className="space-y-4">
                    {!selectedGuest && !newGuestMode && (
                      <>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search existing guest by name or phone..."
                            value={guestSearch}
                            onChange={(e) => setGuestSearch(e.target.value)}
                            className="w-full rounded-2xl border border-orange-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                          />
                        </div>

                        {guestSearchLoad && (
                          <div className="flex justify-center py-2">
                            <Spinner size="sm" />
                          </div>
                        )}

                        {(guestResults || []).map((g: any) => (
                          <button
                            key={g._id}
                            onClick={() => {
                              setSelectedGuest(g);
                              setStep('payment');
                            }}
                            className="flex w-full items-center gap-3 rounded-2xl border border-orange-100 px-3 py-2.5 text-left transition-all hover:border-pink-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50"
                          >
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                              {g.firstName?.[0]}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-900">
                                {g.firstName} {g.lastName}
                              </p>
                              <p className="flex items-center gap-1 text-xs text-slate-400">
                                <Phone className="h-3 w-3" />
                                {g.phone}
                              </p>
                            </div>
                            {g.loyalty?.tier && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold capitalize text-amber-700">
                                {g.loyalty.tier}
                              </span>
                            )}
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                          </button>
                        ))}

                        <button
                          onClick={() => setNewGuestMode(true)}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-orange-200 py-3 text-sm font-semibold text-slate-500 transition-all hover:border-pink-400 hover:bg-pink-50 hover:text-pink-700"
                        >
                          <UserPlus className="h-4 w-4" /> New Guest
                        </button>
                      </>
                    )}

                    {selectedGuest && (
                      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-200 text-sm font-bold text-emerald-800">
                          {selectedGuest.firstName?.[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {selectedGuest.firstName} {selectedGuest.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{selectedGuest.phone}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedGuest(null);
                            setGuestSearch('');
                            setStep('guest');
                          }}
                          className="text-xs font-medium text-slate-400 hover:text-slate-600"
                        >
                          Change
                        </button>
                      </div>
                    )}

                    {newGuestMode && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="First Name *"
                            value={guestForm.firstName}
                            onChange={(e) => setGuestForm((p) => ({ ...p, firstName: e.target.value }))}
                          />
                          <Input
                            label="Last Name *"
                            value={guestForm.lastName}
                            onChange={(e) => setGuestForm((p) => ({ ...p, lastName: e.target.value }))}
                          />
                          <Input
                            label="Phone *"
                            value={guestForm.phone}
                            onChange={(e) => setGuestForm((p) => ({ ...p, phone: e.target.value }))}
                          />
                          <Select
                            label="ID Type"
                            value={guestForm.idType}
                            onChange={(e) => setGuestForm((p) => ({ ...p, idType: e.target.value }))}
                          >
                            {ID_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </Select>
                        </div>

                        <Input
                          label="ID Number *"
                          value={guestForm.idNumber}
                          onChange={(e) => setGuestForm((p) => ({ ...p, idNumber: e.target.value }))}
                          placeholder="Enter ID number"
                        />

                        <div className="flex gap-2">
                          <button
                            onClick={() => setNewGuestMode(false)}
                            className="text-xs text-slate-500 hover:text-slate-700"
                          >
                            ← Back to search
                          </button>
                          <Button
                            size="sm"
                            className="ml-auto bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
                            onClick={() => {
                              if (!guestForm.firstName || !guestForm.phone || !guestForm.idNumber) {
                                toast.error('Fill required fields');
                                return;
                              }
                              setStep('payment');
                            }}
                          >
                            Continue →
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {step === 'payment' && (
                <SectionCard title="Payment" stepNo={3} active>
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-2">
                      {PAYMENT_MODES.map((m) => (
                        <button
                          key={m.value}
                          onClick={() => setPayMode(m.value)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 rounded-2xl border-2 py-3 text-xs font-semibold transition-all',
                            payMode === m.value
                              ? 'border-pink-400 bg-gradient-to-br from-orange-50 to-pink-50 text-pink-700'
                              : 'border-orange-100 text-slate-600 hover:border-orange-300',
                          )}
                        >
                          <m.icon className="h-5 w-5" />
                          {m.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Advance Paid (₹)
                        </label>
                        <input
                          type="number"
                          value={advancePaid}
                          onChange={(e) => setAdvancePaid(e.target.value)}
                          placeholder="0"
                          max={totalAmount}
                          className="w-full rounded-2xl border border-orange-200 px-3 py-2.5 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Special Requests
                        </label>
                        <input
                          type="text"
                          value={specialReq}
                          onChange={(e) => setSpecialReq(e.target.value)}
                          placeholder="High floor, extra blanket..."
                          className="w-full rounded-2xl border border-orange-200 px-3 py-2.5 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                        />
                      </div>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
                      size="lg"
                      loading={walkInMut.isPending}
                      icon={<Zap className="h-4 w-4" />}
                      onClick={() => {
                        if (!selectedRoom) {
                          toast.error('Please select a room');
                          return;
                        }
                        if (!canContinuePayment) {
                          toast.error('Please complete guest details');
                          return;
                        }
                        walkInMut.mutate();
                      }}
                    >
                      Check In Now
                    </Button>
                  </div>
                </SectionCard>
              )}
            </div>

            <div className="space-y-4">
              <div className="sticky top-24 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-semibold text-slate-900">Booking Summary</h3>

                {selectedRoom ? (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-pink-100 bg-gradient-to-r from-orange-50 to-pink-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-pink-700">Room {selectedRoom.number}</span>
                        <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-semibold capitalize text-pink-700">
                          {selectedRoom.type}
                        </span>
                      </div>
                      <p className="mt-1 text-xs capitalize text-slate-500">
                        {selectedRoom.bedType} bed · Floor {selectedRoom.floor}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      {[
                        { l: 'Check-in', v: displayCheckIn },
                        { l: 'Check-out', v: displayCheckOut },
                        { l: 'Nights', v: nights },
                        { l: 'Guests', v: `${adults}A${children > 0 ? ` ${children}C` : ''}` },
                        { l: 'Meal Plan', v: mealPlan.replace('_', ' ') },
                        { l: 'Rate/night', v: formatCurrency(effectiveRate) },
                      ].map((r) => (
                        <div key={r.l} className="flex justify-between">
                          <span className="text-slate-400">{r.l}</span>
                          <span className="font-medium capitalize text-slate-900">{r.v}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5 border-t border-orange-100 pt-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Room ({nights}n)</span>
                        <span className="font-medium">{formatCurrency(roomCharge)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">GST ({(gstRate * 100).toFixed(0)}%)</span>
                        <span className="font-medium text-orange-700">{formatCurrency(taxAmount)}</span>
                      </div>
                      {parseFloat(advancePaid) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Advance</span>
                          <span className="font-medium text-emerald-600">
                            −{formatCurrency(parseFloat(advancePaid))}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-orange-100 pt-1 text-base font-bold">
                        <span className={balanceDue > 0 ? 'text-rose-700' : 'text-emerald-700'}>Balance Due</span>
                        <span className={balanceDue > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                          {formatCurrency(Math.max(0, balanceDue))}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <BedDouble className="mx-auto mb-2 h-10 w-10 text-slate-200" />
                    <p className="text-sm text-slate-400">Select a room to see summary</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'done' && booking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-lg space-y-5 py-8 text-center"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">Checked In! 🎉</h2>
              <p className="mt-1 text-slate-500">Walk-in completed successfully</p>
            </div>

            <div className="space-y-2.5 rounded-3xl border border-orange-100 bg-white p-5 text-left shadow-sm">
              {[
                { l: 'Booking Ref', v: booking.bookingRef, mono: true },
                { l: 'Room', v: booking.roomNumber },
                { l: 'Guest', v: booking.guestName },
                { l: 'Check-out', v: booking.checkOut },
                { l: 'Balance Due', v: formatCurrency(booking.balanceDue) },
              ].map((r) => (
                <div key={r.l} className="flex justify-between text-sm">
                  <span className="text-slate-400">{r.l}</span>
                  <span className={cn('font-semibold text-slate-900', r.mono && 'font-mono text-xs')}>{r.v}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => router.push(`/dashboard/billing?reservationId=${booking._id}`)}
              >
                Open Folio
              </Button>

              <Button
                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
                onClick={() => {
                  setStep('room');
                  setSelectedRoom(null);
                  setSelectedGuest(null);
                  setNewGuestMode(false);
                  setGuestSearch('');
                  setAdvancePaid('');
                  setCustomRate('');
                  setBooking(null);
                  setGuestForm({
                    firstName: '',
                    lastName: '',
                    phone: '',
                    idType: 'aadhaar',
                    idNumber: '',
                  });
                  setPayMode('cash');
                  setMealPlan('room_only');
                  setNights(1);
                  setAdults(1);
                  setChildren(0);
                  setSpecialReq('');
                }}
              >
                Next Walk-in
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}