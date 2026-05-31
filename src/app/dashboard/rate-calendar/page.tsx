'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardContent, Button, Input, Spinner } from '@/components/ui';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calendar,
  X,
  Check,
  Zap,
  Hotel,
  BarChart3,
  BadgeIndianRupee,
  Wand2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isWeekend,
  isBefore,
  startOfDay,
  getDay,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import { useAuthStore } from '@/store/auth.store';

interface DayRate {
  date: string;
  baseRate: number;
  customRate?: number;
  aiRate?: number;
  aiAction?: 'increase' | 'decrease' | 'hold';
  occupancyPct?: number;
  reservations?: number;
}

interface Room {
  _id: string;
  number: string;
  type: string;
  baseRate: number;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const UI = {
  melon: '#F97316',
  coral: '#F43F5E',
  amber: '#F59E0B',
  teal: '#0D9488',
  violet: '#7C3AED',
  bg: '#FFFBF7',
  panel: '#FFF7EF',
  surface: '#FFFFFF',
  border: '#F0E4D8',
  borderMid: '#E5CDB8',
  text: '#1C0A02',
  textSub: '#6B4535',
  textMuted: '#A8836C',
  melonPale: '#FFF3E6',
  melonLight: '#FED7AA',
  coralPale: '#FFF1F2',
  coralLight: '#FECDD3',
  amberPale: '#FFFBEB',
  amberLight: '#FDE68A',
  tealPale: '#F0FDFA',
  tealLight: '#99F6E4',
};

function rateColor(customRate: number | undefined, baseRate: number, aiRate: number | undefined) {
  const effective = customRate ?? baseRate;

  if (customRate && !aiRate) return 'bg-[#FFF7ED] border-[#FED7AA]';
  if (!aiRate) return 'bg-white border-[#F0E4D8]';

  const diff = ((effective - aiRate) / aiRate) * 100;
  if (diff < -10) return 'bg-[#FFF1F2] border-[#FECDD3]';
  if (diff > 10) return 'bg-[#FFFBEB] border-[#FDE68A]';
  return 'bg-[#F0FDFA] border-[#99F6E4]';
}

function rateStatus(customRate: number | undefined, baseRate: number, aiRate: number | undefined) {
  const effective = customRate ?? baseRate;
  if (!aiRate) return null;

  const diff = ((effective - aiRate) / aiRate) * 100;
  if (diff < -10) return { icon: TrendingUp, label: 'Raise', color: 'text-[#E11D48]' };
  if (diff > 10) return { icon: TrendingDown, label: 'Lower', color: 'text-[#D97706]' };
  return { icon: Check, label: 'Optimal', color: 'text-[#0F766E]' };
}

function GlassStat({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-2xl px-4 py-3 min-w-[140px]"
      style={{
        background: highlight ? 'linear-gradient(135deg, rgba(249,115,22,0.10), rgba(244,63,94,0.06))' : UI.surface,
        border: `1.5px solid ${highlight ? UI.melonLight : UI.border}`,
        boxShadow: '0 8px 26px rgba(28,10,2,0.04)',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: highlight ? UI.melon : UI.textMuted }}>{icon}</span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: UI.textMuted }}>
          {label}
        </p>
      </div>
      <p className="text-sm font-bold" style={{ color: highlight ? UI.melon : UI.text }}>
        {value}
      </p>
    </div>
  );
}

function DayCell({
  date,
  dayData,
  isSelected,
  onSelect,
  onEdit,
  isPast,
  isToday,
}: {
  date: Date;
  dayData?: DayRate;
  isSelected: boolean;
  onSelect: (d: Date) => void;
  onEdit: (d: Date) => void;
  isPast: boolean;
  isToday: boolean;
}) {
  const weekend = isWeekend(date);
  const effectiveRate = dayData?.customRate ?? dayData?.baseRate ?? 0;
  const colorCls = dayData
    ? rateColor(dayData.customRate, dayData.baseRate, dayData.aiRate)
    : 'bg-white border-[#F0E4D8]';
  const status = dayData
    ? rateStatus(dayData.customRate, dayData.baseRate, dayData.aiRate)
    : null;

  return (
    <motion.div
      whileHover={!isPast ? { y: -2, scale: 1.015 } : undefined}
      whileTap={!isPast ? { scale: 0.985 } : undefined}
      onClick={() => !isPast && onSelect(date)}
      className={`relative min-h-[118px] rounded-2xl border p-3 text-left transition-all overflow-hidden cursor-pointer
      ${isPast ? 'opacity-45 cursor-default bg-[#FCFAF8] border-[#F3ECE5]' : colorCls}
      ${weekend && !isPast ? 'border-dashed' : ''}`}
      style={{
        boxShadow: isPast
          ? 'none'
          : isSelected
            ? `0 0 0 2px ${UI.melon}, 0 0 0 6px rgba(249,115,22,0.14), 0 8px 22px rgba(28,10,2,0.04)`
            : isToday
              ? `0 0 0 2px ${UI.amber}, 0 0 0 6px rgba(245,158,11,0.16), 0 8px 22px rgba(28,10,2,0.04)`
              : '0 8px 22px rgba(28,10,2,0.04)',
      }}
    >
      {!isPast && (dayData?.customRate || isSelected) && (
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{
            background: dayData?.customRate
              ? `linear-gradient(90deg, ${UI.melon}, ${UI.coral})`
              : `linear-gradient(90deg, ${UI.amber}, ${UI.melon})`,
          }}
        />
      )}

      {weekend && !isPast && (
        <span
          className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{
            background: UI.melonPale,
            color: UI.melon,
            border: `1px solid ${UI.melonLight}`,
          }}
        >
          Weekend
        </span>
      )}

      <div className="flex items-start justify-between pr-14">
        <div>
          <p
            className="text-[11px] font-bold"
            style={{
              color: isToday ? UI.amber : isPast ? '#B9A79A' : weekend ? UI.melon : UI.textSub,
            }}
          >
            {format(date, 'd')}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: UI.textMuted }}>
            {format(date, 'EEE')}
          </p>
        </div>

        {status && !isPast && (
          <div className={`rounded-full p-1 ${status.color}`} style={{ background: '#fff' }}>
            <status.icon className="w-3 h-3" />
          </div>
        )}
      </div>

      {effectiveRate > 0 && (
        <div className="mt-3">
          <p
            className="text-sm font-bold leading-none"
            style={{ color: dayData?.customRate ? UI.melon : UI.text }}
          >
            {formatCurrency(effectiveRate)}
          </p>

          {dayData?.aiRate && dayData.aiRate !== effectiveRate && (
            <p className="text-[10px] mt-1" style={{ color: UI.textMuted }}>
              AI: {formatCurrency(dayData.aiRate)}
            </p>
          )}
        </div>
      )}

      {dayData?.occupancyPct !== undefined && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-medium" style={{ color: UI.textMuted }}>
              Occ
            </span>
            <span className="text-[9px] font-bold" style={{ color: UI.textSub }}>
              {dayData.occupancyPct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-[#EFE4DA]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${dayData.occupancyPct}%`,
                background:
                  dayData.occupancyPct > 80
                    ? '#EF4444'
                    : dayData.occupancyPct > 50
                      ? UI.amber
                      : '#22C55E',
              }}
            />
          </div>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        {dayData?.customRate ? (
          <span
            className="inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold"
            style={{
              background: UI.melonPale,
              color: UI.melon,
              border: `1px solid ${UI.melonLight}`,
            }}
          >
            Custom
          </span>
        ) : (
          <span
            className="inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold"
            style={{
              background: '#F5F5F4',
              color: UI.textMuted,
              border: `1px solid ${UI.border}`,
            }}
          >
            Default
          </span>
        )}

        {!isPast && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(date);
            }}
            className="rounded-xl px-2.5 py-1 text-[10px] font-bold transition-all"
            style={{
              background: '#fff',
              color: UI.coral,
              border: `1px solid ${UI.coralLight}`,
              boxShadow: '0 4px 10px rgba(244,63,94,0.08)',
            }}
          >
            Edit
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function RateCalendarPage() {
  const qc = useQueryClient();
  const today = startOfDay(new Date());

  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [editModal, setEditModal] = useState<{ date: Date; currentRate: number } | null>(null);
  const [newRate, setNewRate] = useState('');
  const [bulkRate, setBulkRate] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRates, setAiRates] = useState<Record<string, DayRate>>({});
  const token = useAuthStore((s) => s.accessToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const monthKey = format(currentMonth, 'yyyy-MM');
  const roomRatesKey = ['room-rates', selectedRoom, monthKey] as const;

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await api.get('/api/rooms', {
        withCredentials: true,
        params: { t: Date.now() },
      });
      return (res.data?.data?.docs || res.data?.data || []).filter((rm: any) => rm.isActive);
    },
    enabled: isHydrated,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const { data: rateData = [], isLoading: ratesLoading, refetch: refetchRates } = useQuery({
    queryKey: ['room-rates', selectedRoom, monthKey],
    queryFn: async () => {
      const res = await api.get('/api/rooms/rates', {
        withCredentials: true,
        params: {
          roomId: selectedRoom,
          startDate: format(monthStart, 'yyyy-MM-dd'),
          endDate: format(monthEnd, 'yyyy-MM-dd'),
          t: Date.now(),
        },
      });
      return res.data?.data || [];
    },
    enabled: isHydrated && !!selectedRoom,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (!selectedRoom && rooms?.length) {
      setSelectedRoom(rooms[0]._id);
    }
  }, [rooms, selectedRoom]);


  const toDateKey = (value: string | Date) => {
    if (value instanceof Date) return format(value, 'yyyy-MM-dd');
    const parsed = value.includes('T') ? parseISO(value) : new Date(value);
    return format(parsed, 'yyyy-MM-dd');
  };
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const selectedRoomData = rooms?.find((r: any) => r._id === selectedRoom);

  const updateRateMutation = useMutation({
    mutationFn: (d: { roomId: string; date: string; rate: number; note?: string }) =>
      api.patch(`/api/rooms/rates/${d.roomId}/${d.date}`, {
        rate: d.rate,
        note: d.note,
      }),
    onSuccess: async (_, vars) => {
      const key = toDateKey(vars.date);

      qc.setQueryData(['room-rates', selectedRoom, monthKey], (old: DayRate[] = []) => {
        const exists = old.some((d) => toDateKey(d.date) === key);
        if (exists) {
          return old.map((d) =>
            toDateKey(d.date) === key
              ? {
                ...d,
                date: key,
                customRate: vars.rate,
                baseRate: d.baseRate ?? selectedRoomData?.baseRate ?? vars.rate,
              }
              : d
          );
        }

        return [
          ...old,
          {
            date: key,
            baseRate: selectedRoomData?.baseRate ?? vars.rate,
            customRate: vars.rate,
            occupancyPct: 0,
            reservations: 0,
          },
        ];
      });

      await qc.invalidateQueries({
        queryKey: ['room-rates', selectedRoom, monthKey],
        exact: true,
      });

      await refetchRates();

      toast.success('Rate updated');
      setEditModal(null);
      setNewRate('');
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: (d: { roomId: string; dates: string[]; rate: number }) =>
      api.post('/api/rooms/rates/bulk', d),

    onSuccess: (_, vars) => {
      const dateSet = new Set(vars.dates.map(toDateKey));

      qc.setQueryData(roomRatesKey, (old: DayRate[] = []) => {
        const next = [...old];

        dateSet.forEach((dateKey) => {
          const idx = next.findIndex((d) => toDateKey(d.date) === dateKey);

          if (idx >= 0) {
            next[idx] = {
              ...next[idx],
              date: dateKey,
              customRate: vars.rate,
              baseRate: next[idx].baseRate || selectedRoomData?.baseRate || vars.rate,
            };
          } else {
            next.push({
              date: dateKey,
              baseRate: selectedRoomData?.baseRate || vars.rate,
              customRate: vars.rate,
            });
          }
        });

        return next;
      });

      qc.invalidateQueries({ queryKey: roomRatesKey, exact: true });
      toast.success(`Rate updated for ${vars.dates.length} dates`);
      setSelectedDates([]);
      setBulkRate('');
    },

    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  async function loadAIRecommendations() {
    if (!selectedRoom) {
      toast.error('Select a room first');
      return;
    }
    setAiLoading(true);
    try {
      const { data } = await api.get('/api/ai/revenue/rate-calendar', {
        params: { roomId: selectedRoom, month: format(currentMonth, 'yyyy-MM') },
      });
      const map: Record<string, DayRate> = {};
      data.data?.forEach((d: any) => {
        map[d.date] = d;
      });
      setAiRates(map);
      toast.success('AI recommendations loaded');
    } catch {
      toast.error('AI recommendations unavailable');
    } finally {
      setAiLoading(false);
    }
  }

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDow = getDay(monthStart);

  function toggleDate(date: Date) {
    setSelectedDates((prev) =>
      prev.some((d) => isSameDay(d, date)) ? prev.filter((d) => !isSameDay(d, date)) : [...prev, date]
    );
  }

  function selectAllWeekends() {
    const weekends = days.filter((d) => isWeekend(d) && !isBefore(d, today));
    setSelectedDates(weekends);
  }

  function applyBulkRate() {
    if (!bulkRate || !selectedDates.length) {
      toast.error('Select dates and enter rate');
      return;
    }

    bulkUpdateMutation.mutate({
      roomId: selectedRoom,
      dates: selectedDates.map((d) => format(d, 'yyyy-MM-dd')),
      rate: parseFloat(bulkRate),
    });
  }

  function applyAISuggestion(date: string) {
    const suggestion = aiRates[date];
    if (!suggestion?.aiRate) return;
    updateRateMutation.mutate({ roomId: selectedRoom, date, rate: suggestion.aiRate });
  }

  async function applyAllAISuggestions() {
    const suggestions = Object.entries(aiRates).filter(([_, d]: [string, DayRate]) => d.aiAction !== 'hold');
    if (!suggestions.length) {
      toast('No AI changes suggested');
      return;
    }

    for (const [date, data] of suggestions) {
      if (data.aiRate) {
        await updateRateMutation.mutateAsync({ roomId: selectedRoom, date, rate: data.aiRate });
      }
    }

    toast.success(`Applied ${suggestions.length} AI recommendations`);
  }

  const aiChanges = Object.values(aiRates).filter((d) => d.aiAction !== 'hold').length;
  const rateMap = useMemo<Record<string, DayRate>>(() => {
    const map: Record<string, DayRate> = {};

    days.forEach((date) => {
      const key = format(date, 'yyyy-MM-dd');
      map[key] = {
        date: key,
        baseRate: selectedRoomData?.baseRate || 0,
      };
    });

    (rateData || []).forEach((d: DayRate) => {
      const key = toDateKey(d.date);
      map[key] = {
        ...map[key],
        ...d,
        date: key,
        baseRate: d.baseRate || map[key]?.baseRate || selectedRoomData?.baseRate || 0,
      };
    });

    Object.entries(aiRates).forEach(([date, data]) => {
      const key = toDateKey(date);
      map[key] = {
        ...map[key],
        aiRate: data.aiRate,
        aiAction: data.aiAction,
        occupancyPct: data.occupancyPct ?? map[key]?.occupancyPct,
        reservations: data.reservations ?? map[key]?.reservations,
      };
    });

    return map;
  }, [days, rateData, aiRates, selectedRoomData?.baseRate]);
  const customDays = days.filter((d) => {
    const key = format(d, 'yyyy-MM-dd');
    return !!rateMap[key]?.customRate;
  }).length;

  const avgRate = days.length
    ? Math.round(
      days.reduce((sum, d) => {
        const key = format(d, 'yyyy-MM-dd');
        const row = rateMap[key];
        return sum + (row?.customRate ?? row?.baseRate ?? 0);
      }, 0) / days.length
    )
    : selectedRoomData?.baseRate || 0;

  return (
    <DashboardLayout title="Rate Calendar">
      <div className="max-w-7xl mx-auto space-y-6" style={{ color: UI.text }}>
        <div
          className="rounded-[30px] p-6 md:p-7 overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, #FFF9F4 0%, #FFF4EC 52%, #FFF9F6 100%)',
            border: `1.5px solid ${UI.border}`,
            boxShadow: '0 20px 60px rgba(249,115,22,0.08)',
          }}
        >
          <div
            className="absolute -top-14 -right-12 w-48 h-48 rounded-full blur-3xl"
            style={{ background: 'rgba(249,115,22,0.10)' }}
          />
          <div
            className="absolute -bottom-12 left-10 w-44 h-44 rounded-full blur-3xl"
            style={{ background: 'rgba(244,63,94,0.08)' }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                style={{
                  background: UI.melonPale,
                  border: `1px solid ${UI.melonLight}`,
                  color: UI.melon,
                }}
              >
                <Wand2 className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
                  Smart pricing
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black tracking-tight">Rate Calendar</h1>
              <p className="text-sm mt-2 max-w-2xl" style={{ color: UI.textSub }}>
                Manage custom room pricing date by date, compare against AI recommendations,
                and push bulk rate updates with a cleaner visual calendar.
              </p>
            </div>

            <Button
              variant="secondary"
              icon={aiLoading ? <Spinner size="sm" /> : <Sparkles className="w-4 h-4" />}
              onClick={loadAIRecommendations}
              disabled={!selectedRoom || aiLoading}
              className="!rounded-2xl !border-0"
              style={{
                background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(244,63,94,0.08))',
                color: UI.melon,
                boxShadow: '0 10px 24px rgba(249,115,22,0.10)',
              }}
            >
              {aiLoading ? 'Loading AI...' : 'Load AI Recommendations'}
            </Button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative">
              <select
                value={selectedRoom}
                onChange={(e) => {
                  setSelectedRoom(e.target.value);
                  setAiRates({});
                  setSelectedDates([]);
                }}
                className="min-w-[290px] rounded-2xl px-4 py-3 text-sm font-medium outline-none"
                style={{
                  background: UI.surface,
                  color: UI.text,
                  border: `1.5px solid ${UI.borderMid}`,
                  boxShadow: '0 8px 24px rgba(28,10,2,0.04)',
                }}
              >
                <option value="">Select a room...</option>
                {rooms?.map((r: any) => (
                  <option key={r._id} value={r._id}>
                    Room {r.number} · {r.type} · {formatCurrency(r.baseRate)}/night
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={selectAllWeekends}
              className="rounded-2xl px-4 py-3 text-sm font-semibold transition-all"
              style={{
                background: UI.melonPale,
                color: UI.melon,
                border: `1px solid ${UI.melonLight}`,
              }}
            >
              Select All Weekends
            </button>
          </div>

          {selectedRoomData && (
            <div className="flex flex-wrap gap-3">
              <GlassStat label="Base Rate" value={formatCurrency(selectedRoomData.baseRate)} icon={<BadgeIndianRupee className="w-4 h-4" />} />
              <GlassStat label="Avg This Month" value={formatCurrency(avgRate)} icon={<BarChart3 className="w-4 h-4" />} />
              <GlassStat label="Custom Days" value={`${customDays} days`} icon={<Calendar className="w-4 h-4" />} />
              <GlassStat label="AI Changes" value={`${aiChanges} pending`} icon={<Sparkles className="w-4 h-4" />} highlight={aiChanges > 0} />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5">
          {[
            { label: 'Optimal', bg: '#ECFDF5', border: '#A7F3D0', color: '#047857' },
            { label: 'Underpriced', bg: '#FEF2F2', border: '#FECACA', color: '#DC2626' },
            { label: 'Overpriced', bg: '#EFF6FF', border: '#BFDBFE', color: '#2563EB' },
            { label: 'Custom Set', bg: '#FFF7ED', border: '#FED7AA', color: UI.melon },
            { label: 'Weekend', bg: '#FFF3E6', border: UI.melonLight, color: UI.textSub },
          ].map((item) => (
            <div
              key={item.label}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: item.bg, border: `1px solid ${item.border}`, color: item.color }}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
              {item.label}
            </div>
          ))}
        </div>
        <div
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDFB 100%)',
            border: `1.5px solid ${UI.border}`,
            boxShadow: '0 18px 50px rgba(28,10,2,0.05)',
            borderRadius: '28px',
          }}
        >
          <Card className="!rounded-[28px] overflow-hidden !bg-transparent !border-0 !shadow-none">
            <CardHeader className="!border-b-0 !pb-2">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all"
                    style={{ background: UI.melonPale, color: UI.melon, border: `1px solid ${UI.melonLight}` }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: UI.textMuted }}>
                      Viewing month
                    </p>
                    <h3 className="text-lg font-bold" style={{ color: UI.text }}>
                      {format(currentMonth, 'MMMM yyyy')}
                    </h3>
                  </div>

                  <button
                    onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all"
                    style={{ background: UI.melonPale, color: UI.melon, border: `1px solid ${UI.melonLight}` }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {selectedDates.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setSelectedDates([])}
                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold"
                    style={{ background: '#F5F5F4', color: UI.textSub, border: `1px solid ${UI.border}` }}
                  >
                    <X className="w-4 h-4" />
                    Clear Selection ({selectedDates.length})
                  </motion.button>
                )}
              </div>
            </CardHeader>

            {!selectedRoom ? (
              <CardContent>
                <div className="text-center py-20">
                  <div
                    className="w-20 h-20 rounded-[26px] mx-auto mb-4 flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(249,115,22,0.10), rgba(244,63,94,0.06))',
                      border: `1.5px solid ${UI.melonLight}`,
                    }}
                  >
                    <Hotel className="w-9 h-9" style={{ color: UI.melon }} />
                  </div>
                  <p className="text-base font-semibold" style={{ color: UI.textSub }}>
                    Select a room to view its pricing calendar
                  </p>
                  <p className="text-sm mt-1" style={{ color: UI.textMuted }}>
                    Each room keeps its own daily pricing history and AI recommendation layer.
                  </p>
                </div>
              </CardContent>
            ) : ratesLoading ? (
              <CardContent>
                <div className="flex justify-center py-16">
                  <Spinner size="lg" />
                </div>
              </CardContent>
            ) : (
              <div className="p-4 md:p-5">
                <div className="grid grid-cols-7 gap-2 mb-3">
                  {WEEKDAYS.map((d) => (
                    <div
                      key={d}
                      className="text-center text-[11px] font-bold py-2 rounded-xl"
                      style={{
                        color: d === 'Sat' || d === 'Sun' ? UI.melon : UI.textMuted,
                        background: d === 'Sat' || d === 'Sun' ? UI.melonPale : 'transparent',
                      }}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: firstDow }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {days.map((date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const dayData = rateMap[dateStr];
                    const isPast = isBefore(date, today);
                    const isToday = isSameDay(date, today);
                    const isSelected = selectedDates.some((d) => isSameDay(d, date));

                    return (
                      <DayCell
                        key={dateStr}
                        date={date}
                        dayData={dayData}
                        isSelected={isSelected}
                        onSelect={toggleDate}
                        onEdit={(d) => {
                          const dr = rateMap[format(d, 'yyyy-MM-dd')];
                          setEditModal({
                            date: d,
                            currentRate: dr?.customRate ?? dr?.baseRate ?? selectedRoomData?.baseRate ?? 0,
                          });
                          setNewRate(String(dr?.customRate ?? dr?.baseRate ?? selectedRoomData?.baseRate ?? ''));
                        }}
                        isPast={isPast}
                        isToday={isToday}
                      />
                    );
                  })}
                </div>

                <p className="text-xs text-center mt-4" style={{ color: UI.textMuted }}>
                  Single click to select dates · Double click to edit one day
                </p>
              </div>
            )}
          </Card>

        </div>


        <AnimatePresence>
          {aiChanges > 0 && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div
                style={{
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDFB 100%)',
                  border: `1.5px solid ${UI.border}`,
                  boxShadow: '0 18px 50px rgba(28,10,2,0.05)',
                  borderRadius: '28px',
                }}
              >
                <Card className="!rounded-[28px] overflow-hidden !bg-transparent !border-0 !shadow-none">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${UI.melon}, ${UI.coral})`,
                            color: '#fff',
                          }}
                        >
                          <Sparkles className="w-5 h-5" />
                        </div>

                        <div>
                          <h3 className="font-bold" style={{ color: UI.text }}>
                            AI Rate Recommendations
                          </h3>
                          <p className="text-sm" style={{ color: UI.textMuted }}>
                            {aiChanges} suggested adjustments for this month
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={applyAllAISuggestions}
                        loading={updateRateMutation.isPending}
                        icon={<Zap className="w-3.5 h-3.5" />}
                        className="!rounded-2xl"
                      >
                        Apply All
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                      {Object.entries(aiRates)
                        .filter(([_, d]) => d.aiAction !== 'hold' && d.aiRate)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([date, data]) => {
                          const current = rateMap[date]?.customRate ?? rateMap[date]?.baseRate ?? 0;
                          const diff = data.aiRate! - current;
                          const pct = current > 0 ? ((diff / current) * 100).toFixed(0) : '0';

                          return (
                            <div
                              key={date}
                              className="rounded-2xl p-4"
                              style={{
                                background: '#fff',
                                border: `1.5px solid ${UI.border}`,
                                boxShadow: '0 8px 24px rgba(28,10,2,0.04)',
                              }}
                            >
                              <p className="text-xs font-bold" style={{ color: UI.textSub }}>
                                {format(new Date(date), 'dd MMM, EEE')}
                              </p>

                              <div className="flex items-end gap-2 mt-2">
                                <span className="text-xs line-through" style={{ color: UI.textMuted }}>
                                  {formatCurrency(current)}
                                </span>
                                <span className="text-base font-bold" style={{ color: UI.melon }}>
                                  {formatCurrency(data.aiRate!)}
                                </span>
                                <span
                                  className="text-[11px] font-bold"
                                  style={{ color: diff > 0 ? '#16A34A' : '#DC2626' }}
                                >
                                  {diff > 0 ? '+' : ''}
                                  {pct}%
                                </span>
                              </div>

                              <button
                                onClick={() => applyAISuggestion(date)}
                                className="mt-3 text-xs font-bold"
                                style={{ color: UI.coral }}
                              >
                                Apply suggestion →
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedDates.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div
                style={{
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDFB 100%)',
                  border: `1.5px solid ${UI.border}`,
                  boxShadow: '0 18px 50px rgba(28,10,2,0.05)',
                  borderRadius: '28px',
                }}
              >
                <Card className="!rounded-[28px] overflow-hidden !bg-transparent !border-0 !shadow-none">
                  <CardContent className="py-5">
                    <div className="flex flex-col xl:flex-row xl:items-center gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ background: UI.melonPale, color: UI.melon, border: `1px solid ${UI.melonLight}` }}
                        >
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: UI.text }}>
                            {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''} selected
                          </p>
                          <p className="text-xs" style={{ color: UI.textMuted }}>
                            {selectedDates.map((d) => format(d, 'd MMM')).slice(0, 4).join(', ')}
                            {selectedDates.length > 4 ? ` +${selectedDates.length - 4} more` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-1 xl:max-w-xs">
                        <span className="text-sm font-semibold whitespace-nowrap" style={{ color: UI.textSub }}>
                          Set rate ₹
                        </span>
                        <input
                          type="number"
                          value={bulkRate}
                          onChange={(e) => setBulkRate(e.target.value)}
                          placeholder="4500"
                          className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none"
                          style={{
                            background: '#fff',
                            color: UI.text,
                            border: `1.5px solid ${UI.borderMid}`,
                          }}
                        />
                      </div>

                      {bulkRate && (
                        <div className="flex flex-wrap gap-2">
                          <span
                            className="px-3 py-2 rounded-xl text-xs font-bold"
                            style={{ background: '#FEF3C7', color: '#92400E' }}
                          >
                            GST: {parseFloat(bulkRate) <= 1000 ? '0%' : parseFloat(bulkRate) <= 7500 ? '12%' : '18%'}
                          </span>
                          <span
                            className="px-3 py-2 rounded-xl text-xs font-bold"
                            style={{ background: '#DBEAFE', color: '#1D4ED8' }}
                          >
                            Total:{' '}
                            {formatCurrency(
                              parseFloat(bulkRate) *
                              (parseFloat(bulkRate) <= 1000 ? 1 : parseFloat(bulkRate) <= 7500 ? 1.12 : 1.18)
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2 xl:ml-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDates([]);
                            setBulkRate('');
                          }}
                          className="!rounded-2xl"
                        >
                          Cancel
                        </Button>

                        <Button
                          size="sm"
                          loading={bulkUpdateMutation.isPending}
                          disabled={!bulkRate || parseFloat(bulkRate) <= 0}
                          onClick={applyBulkRate}
                          icon={<Check className="w-3.5 h-3.5" />}
                          className="!rounded-2xl"
                        >
                          Apply to {selectedDates.length}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                className="absolute inset-0 bg-black/45 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditModal(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                className="relative w-full max-w-md rounded-[30px] p-6 z-10"
                style={{
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF8F2 100%)',
                  border: `1.5px solid ${UI.border}`,
                  boxShadow: '0 28px 80px rgba(28,10,2,0.18)',
                }}
              >
                <div className="mb-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: UI.textMuted }}>
                    Edit day rate
                  </p>
                  <h3 className="text-lg font-bold mt-1" style={{ color: UI.text }}>
                    {format(editModal.date, 'EEEE, dd MMMM yyyy')}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: UI.textMuted }}>
                    Current rate: {formatCurrency(editModal.currentRate)}
                  </p>
                </div>

                <Input
                  label="New Rate (₹/night)"
                  type="number"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  placeholder="Enter rate"
                  autoFocus
                />

                {newRate && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span
                      className="px-3 py-2 rounded-xl text-xs font-bold"
                      style={{ background: '#FEF3C7', color: '#92400E' }}
                    >
                      GST: {parseFloat(newRate) <= 1000 ? '0%' : parseFloat(newRate) <= 7500 ? '12%' : '18%'}
                    </span>
                    <span
                      className="px-3 py-2 rounded-xl text-xs font-bold"
                      style={{ background: '#DBEAFE', color: '#1D4ED8' }}
                    >
                      Total:{' '}
                      {formatCurrency(
                        parseFloat(newRate) *
                        (parseFloat(newRate) <= 1000 ? 1 : parseFloat(newRate) <= 7500 ? 1.12 : 1.18)
                      )}
                    </span>
                  </div>
                )}

                {aiRates[format(editModal.date, 'yyyy-MM-dd')]?.aiRate && (
                  <button
                    onClick={() =>
                      setNewRate(String(aiRates[format(editModal.date, 'yyyy-MM-dd')].aiRate))
                    }
                    className="mt-4 w-full flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all"
                    style={{
                      background: 'linear-gradient(135deg, rgba(249,115,22,0.10), rgba(244,63,94,0.06))',
                      color: UI.melon,
                      border: `1px solid ${UI.melonLight}`,
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Use AI suggestion: {formatCurrency(aiRates[format(editModal.date, 'yyyy-MM-dd')].aiRate!)}
                  </button>
                )}

                <div className="flex gap-3 mt-5">
                  <Button
                    variant="outline"
                    className="flex-1 !rounded-2xl"
                    onClick={() => setEditModal(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 !rounded-2xl"
                    loading={updateRateMutation.isPending}
                    disabled={!newRate || parseFloat(newRate) <= 0}
                    onClick={() =>
                      updateRateMutation.mutate({
                        roomId: selectedRoom,
                        date: format(editModal.date, 'yyyy-MM-dd'),
                        rate: parseFloat(newRate),
                      })
                    }
                  >
                    Save Rate
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}