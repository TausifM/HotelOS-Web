'use client';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Plus, BedDouble, Grid3X3, List, Search, Edit2, Trash2,
  Wifi, Wind, Tv, Coffee, Car, Dumbbell, Waves,
  ChevronDown, CheckCircle, Sparkles, X, RefreshCw,
  Loader2, Users, Baby, Maximize2, Eye, Cigarette,
  Accessibility, TrendingUp, Building2, Filter, IndianRupee,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { RoomCard } from '@/components/room-card/RoomCard';
import { createPortal } from 'react-dom';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Room {
  _id: string;
  number: string;
  type: 'standard' | 'deluxe' | 'executive' | 'suite' | 'villa';
  category: string;
  floor: number;
  view?: string;
  bedType: string;
  maxAdults: number;
  maxChildren: number;
  baseRate: number;
  status: 'VC' | 'VD' | 'OC' | 'OD' | 'OOO' | 'OOS' | 'DND' | 'INS';
  smoking: boolean;
  accessibility: boolean;
  amenities: string[];
  description?: string;
  squareFeet?: number;
  isActive: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string; dot: string;
}> = {
  VC: { label: 'Vacant Clean', color: '#065f46', bg: '#ecfdf5', border: '#6ee7b7', dot: '#10b981' },
  VD: { label: 'Vacant Dirty', color: '#92400e', bg: '#fffbeb', border: '#fcd34d', dot: '#f59e0b' },
  OC: { label: 'Occupied Clean', color: '#1e3a8a', bg: '#eff6ff', border: '#93c5fd', dot: '#3b82f6' },
  OD: { label: 'Occupied Dirty', color: '#4c1d95', bg: '#f5f3ff', border: '#c4b5fd', dot: '#8b5cf6' },
  OOO: { label: 'Out of Order', color: '#991b1b', bg: '#fef2f2', border: '#fca5a5', dot: '#ef4444' },
  OOS: { label: 'Out of Service', color: '#374151', bg: '#f9fafb', border: '#d1d5db', dot: '#9ca3af' },
  DND: { label: 'Do Not Disturb', color: '#7c2d12', bg: '#fff7ed', border: '#fdba74', dot: '#f97316' },
  INS: { label: 'Inspection', color: '#164e63', bg: '#ecfeff', border: '#67e8f9', dot: '#06b6d4' },
};

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; grad: string }> = {
  standard: { label: 'Standard', color: '#374151', bg: '#f3f4f6', grad: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)' },
  deluxe: { label: 'Deluxe', color: '#1d4ed8', bg: '#dbeafe', grad: 'linear-gradient(135deg,#eff6ff,#dbeafe)' },
  executive: { label: 'Executive', color: '#6d28d9', bg: '#ede9fe', grad: 'linear-gradient(135deg,#f5f3ff,#ede9fe)' },
  suite: { label: 'Suite', color: '#b45309', bg: '#fef3c7', grad: 'linear-gradient(135deg,#fffbeb,#fef3c7)' },
  villa: { label: 'Villa', color: '#065f46', bg: '#d1fae5', grad: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' },
};

const AMENITY_OPTIONS = [
  { key: 'AC', label: 'Air Conditioning', icon: Wind },
  { key: 'WiFi', label: 'WiFi', icon: Wifi },
  { key: 'TV', label: 'Smart TV', icon: Tv },
  { key: 'Mini-bar', label: 'Mini Bar', icon: Coffee },
  { key: 'Parking', label: 'Parking', icon: Car },
  { key: 'Gym', label: 'Gym Access', icon: Dumbbell },
  { key: 'Pool', label: 'Pool Access', icon: Waves },
  { key: 'Hot Water', label: 'Hot Water', icon: null },
  { key: 'Bathtub', label: 'Bathtub', icon: null },
  { key: 'Safe', label: 'In-room Safe', icon: null },
  { key: 'Balcony', label: 'Balcony', icon: null },
  { key: 'Jacuzzi', label: 'Jacuzzi', icon: null },
  { key: 'Lounge Access', label: 'Lounge Access', icon: null },
  { key: 'Butler Service', label: 'Butler', icon: null },
];

const BED_TYPES = ['single', 'twin', 'double', 'queen', 'king', 'super-king'];
const VIEWS = ['garden', 'pool', 'sea', 'city', 'mountain', 'courtyard', 'no view'];
const FLOOR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const EMPTY_FORM = {
  number: '', type: 'standard' as const, category: 'standard',
  floor: 1, view: 'garden', bedType: 'double',
  maxAdults: 2, maxChildren: 1, baseRate: 3500,
  status: 'VC' as const, smoking: false, accessibility: false,
  amenities: ['AC', 'WiFi', 'TV'] as string[],
  description: '', squareFeet: 300, isActive: true,
};

const inp = 'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400';

// ── Helpers ────────────────────────────────────────────────────────────────────
function statusDot(cfg: typeof STATUS_CONFIG[string]) { return cfg.dot; }

function GstBadge({ rate }: { rate: number }) {
  const pct = rate <= 1000 ? 0 : rate <= 7500 ? 12 : 18;
  const total = rate * (1 + pct / 100);
  if (!rate) return null;
  return (
    <div className="flex gap-2 mt-2">
      <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: '#fefce8', color: '#854d0e' }}>
        GST {pct}%
      </span>
      <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
        With GST {formatCurrency(Math.round(total))}
      </span>
    </div>
  );
}

// ── Status Dropdown ────────────────────────────────────────────────────────────
function StatusDropdown({ room, onChange }: {
  room: { _id: string; status: string };
  onChange: (id: string, status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const s = STATUS_CONFIG[room.status] || STATUS_CONFIG.VC;

  // Close when clicking outside this component
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold transition-all hover:brightness-95"
        style={{ background: s.bg, color: s.color, border: `1.5px solid ${s.border}` }}
      >
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.dot }} />
        <span className="flex-1 text-left">{s.label}</span>
        <ChevronDown
          className="w-3 h-3 opacity-60 transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Dropdown panel — positioned absolutely, opens UPWARD if near bottom */}
      {open && (
        // In StatusDropdown — the panel div:
        <div
          className="absolute left-0 right-0 z-50 bg-white rounded-2xl overflow-hidden"
          style={{
            bottom: '110%',
            border: '1px solid #f1f5f9',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.08)',
          }}
          onMouseDown={e => e.stopPropagation()}
        >
          {/* Sticky header */}
          <div className="px-3 py-2 border-b border-gray-50 bg-white">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Change Status</p>
          </div>

          {/* Scrollable options list */}
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => { onChange(room._id, key); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-left transition-colors"
                style={key === room.status ? { background: cfg.bg } : {}}
                onMouseEnter={e => { if (key !== room.status) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (key !== room.status) (e.currentTarget as HTMLElement).style.background = ''; }}
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                <span className="font-mono text-[9px] font-bold text-gray-400 w-7 flex-shrink-0">{key}</span>
                <span className="font-semibold flex-1" style={{ color: cfg.color }}>{cfg.label}</span>
                {key === room.status && (
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cfg.dot }} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Room Form (inside modal) ───────────────────────────────────────────────────
function RoomForm({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p: any) => ({ ...p, [k]: e.target.value }));
  const fNum = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p: any) => ({ ...p, [k]: parseFloat(e.target.value) || 0 }));

  function toggleAmenity(key: string) {
    setForm((p: any) => ({
      ...p,
      amenities: p.amenities.includes(key)
        ? p.amenities.filter((a: string) => a !== key)
        : [...p.amenities, key],
    }));
  }

  const sections = [
    { label: 'Basic Info', icon: <BedDouble className="w-4 h-4 text-orange-500" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Basic */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}>
            <BedDouble className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-sm font-bold text-gray-900">Basic Info</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: 'Room Number *', key: 'number', placeholder: '101' },
          ].map(({ label, key, placeholder }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
              <input className={inp} value={form[key]} onChange={f(key)} placeholder={placeholder} required />
            </div>
          ))}
          {[
            { label: 'Floor *', key: 'floor', options: FLOOR_OPTIONS.map(n => ({ value: n, label: `Floor ${n}` })) },
            { label: 'Room Type *', key: 'type', options: Object.entries(TYPE_CONFIG).map(([k, v]) => ({ value: k, label: v.label })) },
            { label: 'Bed Type *', key: 'bedType', options: BED_TYPES.map(b => ({ value: b, label: b.charAt(0).toUpperCase() + b.slice(1) })) },
            { label: 'View', key: 'view', options: VIEWS.map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) })) },
            { label: 'Status', key: 'status', options: Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: `${k} — ${v.label}` })) },
          ].map(({ label, key, options }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
              <select className={inp} value={form[key]}
                onChange={key === 'floor' ? (e) => setForm((p: any) => ({ ...p, floor: parseInt(e.target.value) })) : f(key)}>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)' }}>
            <IndianRupee className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-sm font-bold text-gray-900">Capacity & Pricing</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Base Rate (₹/night)', key: 'baseRate' },
            { label: 'Max Adults', key: 'maxAdults' },
            { label: 'Max Children', key: 'maxChildren' },
            { label: 'Size (sq ft)', key: 'squareFeet' },
          ].map(({ label, key }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
              <input type="number" className={inp} value={form[key]} onChange={fNum(key)} min="0" />
            </div>
          ))}
        </div>
        <GstBadge rate={form.baseRate} />
      </div>

      {/* Amenities */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)' }}>
              <Sparkles className="w-4 h-4 text-violet-600" />
            </div>
            <p className="text-sm font-bold text-gray-900">Amenities</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: '#fff7ed', color: '#c2410c' }}>
            {form.amenities.length} selected
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AMENITY_OPTIONS.map(({ key, label }) => {
            const selected = form.amenities.includes(key);
            return (
              <button key={key} type="button" onClick={() => toggleAmenity(key)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all"
                style={selected
                  ? { borderColor: '#F97316', background: '#fff7ed', color: '#c2410c' }
                  : { borderColor: '#e5e7eb', background: '#f9fafb', color: '#4b5563' }}>
                <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all border"
                  style={selected
                    ? { background: 'linear-gradient(135deg,#F97316,#F43F5E)', borderColor: '#F97316' }
                    : { background: '#fff', borderColor: '#d1d5db' }}>
                  {selected && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)' }}>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-sm font-bold text-gray-900">Description</p>
        </div>
        <textarea
          rows={2}
          className={inp}
          value={form.description}
          onChange={f('description')}
          placeholder="Brief description for booking engine and invoices..."
        />
      </div>

      {/* Flags */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Room Flags</p>
        <div className="flex flex-wrap gap-3">
          {[
            { key: 'isActive', label: 'Active / Bookable', desc: 'Appears in availability' },
            { key: 'smoking', label: 'Smoking Allowed', desc: 'Designated smoking room' },
            { key: 'accessibility', label: 'Accessible Room', desc: 'Wheelchair/disability' },
          ].map(flag => (
            <label key={flag.key}
              className="flex items-center gap-3 cursor-pointer select-none rounded-xl px-4 py-3 flex-1 min-w-44 border border-gray-100 transition-all"
              style={{ background: form[flag.key] ? '#fff7ed' : '#f9fafb' }}>
              <div className="relative flex-shrink-0 w-10 h-5">
                <input type="checkbox" className="sr-only"
                  checked={!!form[flag.key]}
                  onChange={e => setForm((p: any) => ({ ...p, [flag.key]: e.target.checked }))} />
                <div className="w-10 h-5 rounded-full transition-all"
                  style={{ background: form[flag.key] ? 'linear-gradient(135deg,#F97316,#F43F5E)' : '#d1d5db' }} />
                <div className="absolute top-0.5 h-4 w-4 bg-white rounded-full shadow transition-all"
                  style={{ left: form[flag.key] ? '22px' : '2px' }} />
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: form[flag.key] ? '#c2410c' : '#374151' }}>{flag.label}</p>
                <p className="text-[10px] text-gray-400">{flag.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function RoomsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'floor'>('grid');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFloor, setFilterFloor] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [showBulkRate, setShowBulkRate] = useState(false);
  const [bulkRate, setBulkRate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: rooms, isLoading, refetch } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: () => api.get('/api/rooms').then(r => r.data.data?.docs || r.data.data || []),
    refetchInterval: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/api/rooms', d),
    onSuccess: () => { toast.success('Room created!'); qc.invalidateQueries({ queryKey: ['rooms']  });  qc.invalidateQueries({ queryKey: ['room-rates'] }); closeModal(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => api.put(`/api/rooms/${editingRoom?._id}`, d),
    onSuccess: () => { toast.success('Room updated!'); qc.invalidateQueries({ queryKey: ['rooms'] }); qc.invalidateQueries({ queryKey: ['room-rates'] }); closeModal(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/rooms/${id}`),
    onSuccess: () => { toast.success('Room deleted'); qc.invalidateQueries({ queryKey: ['rooms'] }); qc.invalidateQueries({ queryKey: ['room-rates'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/rooms/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const bulkRateMutation = useMutation({
    mutationFn: ({ ids, rate }: { ids: string[]; rate: number }) =>
      Promise.all(ids.map(id => api.put(`/api/rooms/${id}`, { baseRate: rate }))),
    onSuccess: () => {
      toast.success(`Rate updated for ${bulkSelected.length} rooms`);
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['room-rates'] });
      qc.invalidateQueries({ queryKey: ["housekeeping"]});
      setBulkSelected([]); setShowBulkRate(false); setBulkRate('');
    },
    onError: () => toast.error('Bulk update failed'),
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  function closeModal() { setShowModal(false); setEditingRoom(null); setForm(EMPTY_FORM); }
  function openCreate() { setEditingRoom(null); setForm(EMPTY_FORM); setShowModal(true); }
  function openEdit(room: Room) { setEditingRoom(room); setForm({ ...room }); setShowModal(true); }

  function handleDelete(id: string) {
    if (!confirm('Delete this room? This cannot be undone.')) return;
    deleteMutation.mutate(id);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      floor: parseInt(form.floor),
      maxAdults: parseInt(form.maxAdults),
      maxChildren: parseInt(form.maxChildren),
      baseRate: parseFloat(form.baseRate),
      squareFeet: parseFloat(form.squareFeet),
    };
    editingRoom ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total: rooms?.length || 0,
    occupied: rooms?.filter(r => ['OC', 'OD'].includes(r.status)).length || 0,
    vacant: rooms?.filter(r => ['VC', 'VD'].includes(r.status)).length || 0,
    dirty: rooms?.filter(r => ['VD', 'OD'].includes(r.status)).length || 0,
    ooo: rooms?.filter(r => ['OOO', 'OOS'].includes(r.status)).length || 0,
    occupancyPct: rooms?.length
      ? Math.round((rooms.filter(r => ['OC', 'OD'].includes(r.status)).length / rooms.length) * 100)
      : 0,
    avgRate: rooms?.length
      ? Math.round(rooms.reduce((s, r) => s + r.baseRate, 0) / rooms.length)
      : 0,
  };

  // ── Filtered ───────────────────────────────────────────────────────────────
  const filtered = (rooms || []).filter(r => {
    const q = search.toLowerCase();
    if (search && !r.number.includes(search) && !r.type.includes(q) && !(r.view || '').toLowerCase().includes(q)) return false;
    if (filterType && r.type !== filterType) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterFloor && String(r.floor) !== filterFloor) return false;
    return true;
  });

  const byFloor: Record<number, Room[]> = {};
  (rooms || []).forEach(r => { if (!byFloor[r.floor]) byFloor[r.floor] = []; byFloor[r.floor].push(r); });

  const hasFilters = !!(search || filterType || filterStatus || filterFloor);

  return (
    <DashboardLayout title="Rooms">
      <div className="space-y-5 max-w-7xl h-full mx-auto">

        {/* ── Hero Header ────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl px-6 py-6 text-white sm:rounded-3xl sm:px-8 sm:py-7"
          style={{ background: 'linear-gradient(135deg,#F97316 0%,#F43F5E 100%)' }}>
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-20"
            style={{ background: 'rgba(255,255,255,0.3)' }} />
          <div className="pointer-events-none absolute -bottom-6 left-20 h-28 w-28 rounded-full opacity-10"
            style={{ background: 'rgba(255,255,255,0.5)' }} />

          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <BedDouble className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Hotel Management</span>
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl leading-tight">Room Management</h1>
              <p className="mt-1 text-sm opacity-80">{stats.total} rooms · {stats.occupancyPct}% occupied tonight</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {bulkSelected.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
                  style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                  <span className="font-bold">{bulkSelected.length} selected</span>
                  <button onClick={() => setShowBulkRate(true)}
                    className="font-semibold text-xs underline underline-offset-2">
                    Update Rate
                  </button>
                  <button onClick={() => setBulkSelected([])}><X className="w-3.5 h-3.5" /></button>
                </div>
              )}
              <button onClick={() => refetch()}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button onClick={openCreate}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'rgba(255,255,255,0.95)', color: '#F97316', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
                <Plus className="h-4 w-4" /> Add Room
              </button>
            </div>
          </div>

          {/* Stat chips in header */}
          <div className="relative mt-5 flex flex-wrap gap-2">
            {[
              { label: 'Occupied', value: stats.occupied, icon: '🛏️' },
              { label: 'Vacant', value: stats.vacant, icon: '✅' },
              { label: 'Needs Cleaning', value: stats.dirty, icon: '🧹' },
              { label: 'OOO/OOS', value: stats.ooo, icon: '🚫' },
              { label: 'Avg Rate', value: formatCurrency(stats.avgRate), icon: '💰' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
                style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
                <span>{s.icon}</span>
                <span className="font-black">{s.value}</span>
                <span className="text-xs opacity-75">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Filters ────────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm flex-1 min-w-52">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input type="text" placeholder="Search room, type, view..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="text-sm flex-1 focus:outline-none bg-transparent" />
            {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
          </div>

          {/* Status quick-filter pills */}
          <div className="flex gap-1.5 flex-wrap">
            {[
              { value: '', label: 'All' },
              ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: k })),
            ].map(f => (
              <button key={f.value} onClick={() => setFilterStatus(f.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
                style={filterStatus === f.value
                  ? { background: 'linear-gradient(135deg,#F97316,#F43F5E)', color: '#fff', borderColor: 'transparent' }
                  : { background: '#fff', borderColor: '#e5e7eb', color: '#6b7280' }}>
                {f.value && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                  style={{ background: STATUS_CONFIG[f.value]?.dot || '#ccc' }} />}
                {f.label}
              </button>
            ))}
          </div>

          {/* More filters */}
          <button onClick={() => setShowFilters(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-all"
            style={showFilters ? { borderColor: '#F97316', color: '#F97316' } : {}}>
            <Filter className="w-3.5 h-3.5" /> More
            {(filterType || filterFloor) && (
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            )}
          </button>

          {/* View toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 ml-auto">
            {[
              { id: 'grid', Icon: Grid3X3, label: 'Grid' },
              { id: 'list', Icon: List, label: 'List' },
              { id: 'floor', Icon: Building2, label: 'Floor Plan' },
            ].map(({ id, Icon, label }) => (
              <button key={id} onClick={() => setViewMode(id as any)} title={label}
                className="p-2 rounded-lg transition-all"
                style={viewMode === id
                  ? { background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', color: '#111' }
                  : { color: '#9ca3af' }}>
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Extended filters panel */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            {[
              {
                label: 'Floor', value: filterFloor, onChange: setFilterFloor,
                options: [{ value: '', label: 'All Floors' }, ...FLOOR_OPTIONS.map(f => ({ value: String(f), label: `Floor ${f}` }))]
              },
              {
                label: 'Type', value: filterType, onChange: setFilterType,
                options: [{ value: '', label: 'All Types' }, ...Object.entries(TYPE_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))]
              },
            ].map(({ label, value, onChange, options }) => (
              <div key={label} className="flex flex-col gap-1.5 min-w-36">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
                <select value={value} onChange={e => onChange(e.target.value)}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                  {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
            {hasFilters && (
              <div className="flex items-end">
                <button
                  onClick={() => { setSearch(''); setFilterType(''); setFilterStatus(''); setFilterFloor(''); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 transition-all">
                  <X className="w-3.5 h-3.5" /> Clear All
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Content ─────────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}>
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
              <p className="text-sm text-gray-400">Loading rooms...</p>
            </div>
          </div>
        ) : !filtered.length ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}>
              <BedDouble className="w-8 h-8 text-orange-300" />
            </div>
            <p className="font-bold text-gray-700">No rooms found</p>
            <p className="text-sm text-gray-400 mt-1">
              {rooms?.length ? 'Try adjusting your filters' : 'Add your first room to get started'}
            </p>
            {!rooms?.length && (
              <button onClick={openCreate}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)', boxShadow: '0 4px 14px rgba(249,115,22,0.35)' }}>
                <Plus className="w-4 h-4" /> Add First Room
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filtered.map(room => (
                  <RoomCard key={room._id} room={room}
                    onEdit={openEdit} onDelete={handleDelete}
                    onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
                    selected={bulkSelected.includes(room._id)}
                    onSelect={id => setBulkSelected(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id])}
                  />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ background: '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                        <th className="px-4 py-3 text-left">
                          <input type="checkbox" className="w-4 h-4 accent-orange-500"
                            checked={bulkSelected.length === filtered.length && filtered.length > 0}
                            onChange={() => setBulkSelected(bulkSelected.length === filtered.length ? [] : filtered.map(r => r._id))} />
                        </th>
                        {['Room', 'Type', 'Floor', 'Bed', 'Capacity', 'Rate', 'Status', 'Amenities', 'Flags', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((room, i) => {
                        const s = STATUS_CONFIG[room.status] || STATUS_CONFIG.VC;
                        const t = TYPE_CONFIG[room.type] || TYPE_CONFIG.standard;
                        return (
                          <tr key={room._id}
                            className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors"
                            style={i % 2 === 0 ? {} : { background: '#fafafa' }}>
                            <td className="px-4 py-3">
                              <input type="checkbox" className="w-4 h-4 accent-orange-500"
                                checked={bulkSelected.includes(room._id)}
                                onChange={() => setBulkSelected(p => p.includes(room._id) ? p.filter(i => i !== room._id) : [...p, room._id])} />
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xl font-black text-gray-900">{room.number}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                                style={{ background: t.bg, color: t.color }}>{t.label}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{room.floor}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 capitalize">{room.bedType}</td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{room.maxAdults}</span>
                              <span className="flex items-center gap-1"><Baby className="w-3 h-3" />{room.maxChildren}</span>
                            </td>
                            <td className="px-4 py-3 font-bold text-gray-900 text-sm">{formatCurrency(room.baseRate)}</td>
                            <td className="px-4 py-3 min-w-40">
                              <StatusDropdown room={room} onChange={(id, status) => statusMutation.mutate({ id, status })} />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {room.amenities.slice(0, 3).map(a => (
                                  <span key={a} className="text-[10px] px-1.5 py-0.5 rounded"
                                    style={{ background: '#f1f5f9', color: '#475569' }}>{a}</span>
                                ))}
                                {room.amenities.length > 3 && (
                                  <span className="text-[10px] text-gray-400">+{room.amenities.length - 3}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                {!room.isActive && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">Inactive</span>}
                                {room.smoking && <span title="Smoking"><Cigarette className="w-3.5 h-3.5 text-gray-400" /></span>}
                                {room.accessibility && <span title="Accessible"><Accessibility className="w-3.5 h-3.5 text-blue-500" /></span>}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <button onClick={() => openEdit(room)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDelete(room._id)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Floor Plan View */}
            {viewMode === 'floor' && (
              <div className="space-y-6">
                {Object.entries(byFloor).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([floor, floorRooms]) => {
                  const floorOccupied = floorRooms.filter(r => ['OC', 'OD'].includes(r.status)).length;
                  return (
                    <div key={floor} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50"
                        style={{ background: '#fafafa' }}>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white font-black text-sm"
                          style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
                          {floor}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Floor {floor}</p>
                          <p className="text-xs text-gray-400">{floorRooms.length} rooms · {floorOccupied} occupied</p>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full overflow-hidden bg-gray-100">
                            <div className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.round(floorOccupied / floorRooms.length * 100)}%`,
                                background: 'linear-gradient(90deg,#F97316,#F43F5E)',
                              }} />
                          </div>
                          <span className="text-xs font-bold text-gray-500">
                            {Math.round(floorOccupied / floorRooms.length * 100)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 p-5">
                        {floorRooms.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })).map(room => {
                          const s = STATUS_CONFIG[room.status] || STATUS_CONFIG.VC;
                          return (
                            <button key={room._id} onClick={() => openEdit(room)}
                              className="relative flex flex-col items-center justify-center w-16 h-16 rounded-xl border-2 font-bold text-sm transition-all hover:scale-110 hover:shadow-lg"
                              style={{ background: s.bg, color: s.color, borderColor: s.border }}
                              title={`Room ${room.number} — ${s.label}`}>
                              <span className="text-base font-black leading-none">{room.number}</span>
                              <span className="text-[8px] font-semibold opacity-70 capitalize mt-0.5">
                                {room.type.slice(0, 3)}
                              </span>
                              <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm"
                                style={{ background: s.dot }} />
                              {room.status === 'DND' && (
                                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-black tracking-tight"
                                  style={{ color: s.color }}>DND</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Legend */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Status Legend</p>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-sm" style={{ background: cfg.dot }} />
                        <span className="font-mono font-bold text-gray-600">{key}</span>
                        <span className="text-gray-400">{cfg.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Add / Edit Modal ──────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 text-white"
              style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold">{editingRoom ? `Edit Room ${editingRoom.number}` : 'Add New Room'}</p>
                  <p className="text-xs opacity-75">{editingRoom ? 'Update room details' : 'Fill in the room configuration'}</p>
                </div>
              </div>
              <button onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.2)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <RoomForm form={form} setForm={setForm} />
              </div>
              <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                <button type="button" onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-all">
                  Cancel
                </button>
                <button type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)', boxShadow: '0 4px 14px rgba(249,115,22,0.35)' }}>
                  {(createMutation.isPending || updateMutation.isPending)
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    : <><CheckCircle className="w-4 h-4" /> {editingRoom ? 'Save Changes' : 'Create Room'}</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Bulk Rate Modal ───────────────────────────────────────────────────── */}
      {showBulkRate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 text-white"
              style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-sm">Bulk Rate Update</p>
                  <p className="text-xs opacity-75">{bulkSelected.length} rooms selected</p>
                </div>
              </div>
              <button onClick={() => setShowBulkRate(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl"
                style={{ background: 'rgba(255,255,255,0.2)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl p-3.5 text-sm" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                <p className="font-semibold text-orange-900 mb-1">Updating rooms:</p>
                <p className="text-xs text-orange-700 font-mono">
                  {bulkSelected.map(id => rooms?.find(r => r._id === id)?.number).filter(Boolean).join(', ')}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">New Base Rate (₹/night)</label>
                <input type="number" value={bulkRate} onChange={e => setBulkRate(e.target.value)}
                  className={inp} placeholder="e.g. 4500" min="0" autoFocus />
              </div>
              {bulkRate && <GstBadge rate={parseFloat(bulkRate)} />}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowBulkRate(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button
                  onClick={() => bulkRateMutation.mutate({ ids: bulkSelected, rate: parseFloat(bulkRate) })}
                  disabled={bulkRateMutation.isPending || !bulkRate || parseFloat(bulkRate) <= 0}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)', boxShadow: '0 4px 14px rgba(249,115,22,0.3)' }}>
                  {bulkRateMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
                    : <>Update {bulkSelected.length} Rooms</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}