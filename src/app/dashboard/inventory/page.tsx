'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Input, Select, Modal, Spinner } from '@/components/ui';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Package,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  X,
  BarChart3,
  IndianRupee,
  Boxes,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────
interface InventoryItem {
  id?: string;
  _id: string;
  name: string;
  category:
  | 'linen'
  | 'toiletries'
  | 'minibar'
  | 'kitchen'
  | 'housekeeping'
  | 'maintenance'
  | 'stationery'
  | 'other';
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitCost: number;
  supplier?: string;
  lastRestocked?: string;
  isActive: boolean;
}

const CATEGORIES = [
  { value: 'linen', label: '🛏 Linen', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'toiletries', label: '🧴 Toiletries', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'minibar', label: '🍺 Minibar', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'kitchen', label: '🍳 Kitchen', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'housekeeping', label: '🧹 Housekeeping', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'maintenance', label: '🔧 Maintenance', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'stationery', label: '📝 Stationery', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  { value: 'other', label: '📦 Other', color: 'bg-gray-100 text-gray-600 border-gray-200' },
] as const;
const ITEM_OPTIONS = [
  'Bath Towel',
  'Hand Towel',
  'Bed Sheet',
  'Pillow Cover',
  'Blanket',
  'Soap',
  'Shampoo',
  'Conditioner',
  'Toothbrush Kit',
  'Water Bottle',
  'Soft Drink',
  'Tea Packet',
  'Coffee Sachet',
  'Cleaning Liquid',
  'Phenyl',
  'Mop Refill',
  'Dustbin Bag',
  'Light Bulb',
  'Extension Board',
  'Printer Paper',
  'Pen',
  'Other',
];
const EMPTY_FORM = {
  itemName: '',
  customItemName: '',
  category: 'linen' as const,
  unit: 'pieces',
  currentStock: 0,
  minStock: 5,
  maxStock: 100,
  unitCost: 0,
  supplier: '',
};
const UNITS = ['pieces', 'sets', 'boxes', 'kg', 'litres', 'bottles', 'packets', 'rolls', 'pairs', 'dozen'];

function stockStatus(item: InventoryItem) {
  if (item.currentStock <= 0) {
    return {
      label: 'Out of Stock',
      color: 'bg-rose-100 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      level: 0,
    };
  }
  if (item.currentStock <= item.minStock) {
    return {
      label: 'Low Stock',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      level: 1,
    };
  }
  if (item.currentStock >= item.maxStock * 0.9) {
    return {
      label: 'Well Stocked',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      level: 3,
    };
  }
  return {
    label: 'Normal',
    color: 'bg-sky-100 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
    level: 2,
  };
}

function formatMoney(v: number) {
  return `₹${Number(v || 0).toLocaleString('en-IN')}`;
}

function resetForm(setForm: any, setEditItem: any, setShowModal?: any) {
  setForm(EMPTY_FORM);
  setEditItem(null);
  if (setShowModal) setShowModal(false);
}

// ── UI Helpers ────────────────────────────────────────────────────────────────
function FancyStatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: any;
  tone: string;
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-3xl border p-4 shadow-sm', tone)}>
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/30 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] opacity-70">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
          {sub ? <p className="mt-1 text-xs opacity-75">{sub}</p> : null}
        </div>
        <div className="rounded-2xl bg-white/70 p-2.5 shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

// ── Adjust Stock Modal ────────────────────────────────────────────────────────
function AdjustModal({
  item,
  open,
  onClose,
  onSaved,
}: {
  item: InventoryItem;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<'add' | 'remove' | 'set'>('add');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const newQty =
    type === 'set'
      ? parseFloat(qty) || 0
      : type === 'add'
        ? item.currentStock + (parseFloat(qty) || 0)
        : item.currentStock - (parseFloat(qty) || 0);

  async function save() {
    if (!qty) {
      toast.error('Enter quantity');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/api/inventory/${item._id}/adjust`, {
        type,
        quantity: parseFloat(qty),
        reason,
      });
      toast.success('Stock updated!');
      onSaved();
      onClose();
      setQty('');
      setReason('');
      setType('add');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Adjust Stock — ${item.name}`} size="sm">
      <div className="space-y-4">
        <div className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-pink-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">Current Stock</span>
            <span className="text-xl font-black text-slate-900">
              {item.currentStock} {item.unit}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'add', label: '+ Add', cls: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
            { value: 'remove', label: '− Remove', cls: 'border-rose-300 bg-rose-50 text-rose-700' },
            { value: 'set', label: '= Set', cls: 'border-sky-300 bg-sky-50 text-sky-700' },
          ].map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value as any)}
              className={cn(
                'rounded-2xl border-2 py-2 text-xs font-black transition-all',
                type === t.value ? t.cls : 'border-slate-200 text-slate-500 hover:border-slate-300'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Input
          label={`Quantity (${item.unit})`}
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="0"
          min="0"
          autoFocus
        />

        {qty && (
          <div
            className={cn(
              'rounded-2xl border p-3 text-center text-sm font-bold',
              newQty <= 0
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : newQty <= item.minStock
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            )}
          >
            New stock: {Math.max(0, newQty)} {item.unit}
          </div>
        )}

        <Input
          label="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Restocked, issued to rooms, damaged, minibar refill..."
        />

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500 text-white"
            loading={loading}
            onClick={save}
          >
            Update Stock
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showLow, setShowLow] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);

  
const getItemId = (item: InventoryItem) => item.id || item._id || '';

const {
  data: items = [],
  isLoading,
  refetch,
} = useQuery({
  queryKey: ['inventory'],
  queryFn: async () => {
    const res = await api.get('/api/inventory');
    const raw = res?.data?.data;

    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.docs)) return raw.docs;
    if (Array.isArray(raw?.items)) return raw.items;

    return [];
  },
});
  const finalItemName =
    form.itemName === 'Other'
      ? form.customItemName.trim()
      : form.itemName.trim();
  const saveMut = useMutation({
    mutationFn: (d: any) =>
      editItem ? api.put(`/api/inventory/${editItem._id}`, d) : api.post('/api/inventory', d),
    onSuccess: () => {
      toast.success(editItem ? 'Item updated!' : 'Item added!');
      qc.invalidateQueries({ queryKey: ['inventory'] });
      resetForm(setForm, setEditItem, setShowModal);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/api/inventory/${id}`),
    onSuccess: () => {
      toast.success('Item removed');
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  function openCreate() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(item: InventoryItem) {
    const existsInList = ITEM_OPTIONS.includes(item.name);

    setEditItem(item);
    setForm({
      itemName: existsInList ? item.name : 'Other',
      customItemName: existsInList ? '' : item.name,
      category: item.category,
      unit: item.unit,
      currentStock: item.currentStock,
      minStock: item.minStock,
      maxStock: item.maxStock,
      unitCost: item.unitCost,
      supplier: item.supplier || '',
    });
    setShowModal(true);
  }

  function closeModal() {
    resetForm(setForm, setEditItem, setShowModal);
  }

  const all = items || [];

  const filtered = all.filter((item: any) => {
    if (showLow && item.currentStock > item.minStock) return false;
    if (catFilter && item.category !== catFilter) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const lowCount = all.filter((i: any) => i.currentStock <= i.minStock).length;
  const outCount = all.filter((i: any) => i.currentStock <= 0).length;
  const normalCount = all.filter((i: any) => i.currentStock > i.minStock).length;
  const totalValue = all.reduce((sum: number, i: any) => sum + i.currentStock * i.unitCost, 0);

  const catSummary = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        ...cat,
        count: all.filter((i: any) => i.category === cat.value).length,
        low: all.filter((i: any) => i.category === cat.value && i.currentStock <= i.minStock).length,
      })).filter((c) => c.count > 0),
    [all]
  );

  return (
    <DashboardLayout title="Inventory">
      <div className="max-w-7xl space-y-6 rounded-[32px] bg-gradient-to-br from-orange-50/70 via-white to-pink-50/60 p-1">
        {/* Hero */}
        <div
          className="rounded-[30px] p-6 md:p-7 overflow-hidden relative text-white"
          style={{ background: 'linear-gradient(135deg,#F97316 0%,#F43F5E 100%)' }}>

          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-20"
            style={{ background: 'rgba(255,255,255,0.3)' }} />
          <div className="pointer-events-none absolute -bottom-6 left-20 h-28 w-28 rounded-full opacity-10"
            style={{ background: 'rgba(255,255,255,0.5)' }} />          
            
            <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Hotel Store Control
              </div>
               <h1 className="text-2xl font-bold sm:text-3xl leading-tight">Inventory Management</h1>
              <p className="mt-1 text-sm text-white/85">
                {all.length} items · {lowCount} low stock · {outCount} out of stock · real-time stock actions
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>

              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-pink-700 shadow-sm transition hover:scale-[1.01] hover:bg-rose-50 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <FancyStatCard
            label="Total Items"
            value={all.length}
            sub="Inventory masters"
            icon={Boxes}
            tone="border-orange-200 bg-gradient-to-br from-orange-50 via-white to-pink-50 text-orange-900"
          />
          <FancyStatCard
            label="Low Stock"
            value={lowCount}
            sub="Needs restock soon"
            icon={AlertTriangle}
            tone="border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 text-amber-900"
          />
          <FancyStatCard
            label="Out of Stock"
            value={outCount}
            sub="Immediate action"
            icon={X}
            tone="border-rose-200 bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 text-rose-900"
          />
          <FancyStatCard
            label="Stock Value"
            value={formatMoney(totalValue)}
            sub={`${normalCount} items healthy`}
            icon={IndianRupee}
            tone="border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 via-pink-50 to-violet-50 text-fuchsia-900"
          />
        </div>

        {/* Alert banner */}
        {(lowCount > 0 || outCount > 0) && (
          <div className="flex items-center gap-3 rounded-3xl border border-rose-200 bg-gradient-to-r from-rose-50 via-orange-50 to-pink-50 p-4 shadow-sm">
            <div className="rounded-2xl bg-rose-100 p-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div className="flex-1">
              <p className="text-sm font-black text-rose-900">
                {outCount > 0 ? `${outCount} item${outCount > 1 ? 's' : ''} out of stock` : ''}
                {outCount > 0 && lowCount > 0 ? ' · ' : ''}
                {lowCount > 0 ? `${lowCount} item${lowCount > 1 ? 's' : ''} running low` : ''}
              </p>
              <p className="mt-0.5 text-xs text-rose-700">Restock before guest service or operations get affected.</p>
            </div>

            <button
              onClick={() => setShowLow(true)}
              className="rounded-xl bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-200"
            >
              View Low Items
            </button>
          </div>
        )}

        {/* Category summary */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCatFilter('')}
            className={cn(
              'rounded-2xl border px-3.5 py-2 text-xs font-bold shadow-sm transition-all',
              !catFilter
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-white bg-white text-slate-600 hover:border-orange-200 hover:text-orange-600'
            )}
          >
            All ({all.length})
          </button>

          {catSummary.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCatFilter(cat.value === catFilter ? '' : cat.value)}
              className={cn(
                'rounded-2xl border px-3.5 py-2 text-xs font-bold shadow-sm transition-all',
                catFilter === cat.value
                  ? `${cat.color} ring-2 ring-pink-200 ring-offset-1`
                  : 'border-white bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50'
              )}
            >
              <span>{cat.label}</span>
              <span className="ml-1 opacity-70">({cat.count})</span>
              {cat.low > 0 && (
                <span className="ml-2 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                  {cat.low}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-2xl border border-white bg-white px-3 py-2.5 shadow-sm">
            <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
            <input
              type="text"
              placeholder="Search inventory items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={() => setShowLow(!showLow)}
            className={cn(
              'inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition-all',
              showLow
                ? 'border-rose-300 bg-rose-50 text-rose-700'
                : 'border-white bg-white text-slate-600 shadow-sm hover:bg-orange-50'
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Low Stock Only
          </button>

          {(search || catFilter || showLow) && (
            <button
              onClick={() => {
                setSearch('');
                setCatFilter('');
                setShowLow(false);
              }}
              className="inline-flex items-center gap-1 px-2 text-xs font-bold text-rose-500"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}

          <span className="ml-auto text-xs font-medium text-slate-400">{filtered.length} items</span>
        </div>

        {/* Table / empty / loading */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : !filtered.length ? (
          <div className="rounded-[28px] border border-orange-100 bg-gradient-to-br from-white via-orange-50/40 to-pink-50/50 py-16 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-orange-100 text-orange-500">
              <Package className="h-7 w-7" />
            </div>
            <p className="font-black text-slate-700">{search || catFilter ? 'No items found' : 'No inventory items yet'}</p>
            <p className="mt-1 text-sm text-slate-400">
              {search || catFilter ? 'Try changing the filters or search text.' : 'Start by creating your first inventory item.'}
            </p>
            {!search && !catFilter && (
              <Button
                className="mt-4 bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500 text-white"
                onClick={openCreate}
                icon={<Plus className="h-4 w-4" />}
              >
                Add First Item
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-orange-100 bg-white/95 shadow-[0_10px_40px_rgba(244,114,182,0.12)] backdrop-blur">
            <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 via-rose-50 to-pink-50 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Stock Register</h3>
                  <p className="text-xs text-slate-500">Track item quantity, threshold, cost, and stock movement actions</p>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                  {filtered.length} visible items
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Item</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Category</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">Stock</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">Min / Max</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">Unit Cost</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((item: any, i: number) => {
                    const s = stockStatus(item);
                    const catCfg = CATEGORIES.find((c) => c.value === item.category);
                    const pct = item.maxStock > 0 ? Math.min((item.currentStock / item.maxStock) * 100, 100) : 0;

                    return (
                      <motion.tr
                        key={getItemId(item)}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.015 }}
                        className={cn(
                          'border-b border-slate-100 transition-all hover:bg-gradient-to-r hover:from-orange-50/60 hover:to-pink-50/40',
                          item.currentStock <= 0
                            ? 'bg-rose-50/40'
                            : item.currentStock <= item.minStock
                              ? 'bg-amber-50/40'
                              : ''
                        )}
                      >
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          {item.supplier ? (
                            <p className="max-w-[180px] truncate text-xs text-slate-400">{item.supplier}</p>
                          ) : (
                            <p className="text-xs text-slate-300">No supplier</p>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black',
                              catCfg?.color || 'border-gray-200 bg-gray-100 text-gray-600'
                            )}
                          >
                            {catCfg?.label || item.category}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="font-black text-slate-900">
                              {item.currentStock}{' '}
                              <span className="text-xs font-medium text-slate-400">{item.unit}</span>
                            </span>
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  pct <= 20
                                    ? 'bg-gradient-to-r from-rose-500 to-red-500'
                                    : pct <= 50
                                      ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                      : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400">{Math.round(pct)}% of max</span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center text-xs font-semibold text-slate-500">
                          {item.minStock} / {item.maxStock}
                        </td>

                        <td className="px-4 py-3 text-right font-bold text-slate-700">{formatMoney(item.unitCost)}</td>

                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black',
                              s.color
                            )}
                          >
                            <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', s.dot)} />
                            {s.label}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setAdjustItem(item)}
                              className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-orange-50 to-pink-50 px-2.5 py-1.5 text-xs font-bold text-pink-700 transition hover:from-orange-100 hover:to-pink-100"
                            >
                              <BarChart3 className="h-3 w-3" />
                              Adjust
                            </button>

                            <button
                              onClick={() => openEdit(item)}
                              className="rounded-xl p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Remove "${item.name}"?`)) {
                                  deleteMut.mutate(item._id);
                                }
                              }}
                              className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        <Modal open={showModal} onClose={closeModal} title={editItem ? `Edit — ${editItem.name}` : 'Add Inventory Item'} size="md">
          <div className="space-y-5">
            <div className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-pink-50 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Create or update hotel store items with category, unit, stock thresholds, and supplier detail.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Keep min and max values realistic for daily hotel operations and reorder planning.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-xl bg-orange-100 p-2 text-orange-600">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Item Details</h4>
                  <p className="text-xs text-slate-500">Basic inventory identity and measurement</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Item Name *
                    </label>
                    <select
                      value={form.itemName}
                      onChange={(e) =>
                        setForm((p: any) => ({
                          ...p,
                          itemName: e.target.value,
                          customItemName: e.target.value === 'Other' ? p.customItemName : '',
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
                    >
                      <option value="">Select item</option>
                      {ITEM_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.itemName === 'Other' && (
                    <Input
                      label="Custom Item Name *"
                      value={form.customItemName}
                      onChange={(e) =>
                        setForm((p: any) => ({ ...p, customItemName: e.target.value }))
                      }
                      placeholder="Type custom item name"
                      required
                    />
                  )}
                </div>

                <Select
                  label="Category"
                  value={form.category}
                  onChange={(e) => setForm((p: any) => ({ ...p, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Unit"
                  value={form.unit}
                  onChange={(e) => setForm((p: any) => ({ ...p, unit: e.target.value }))}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-xl bg-pink-100 p-2 text-pink-600">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Stock Rules</h4>
                  <p className="text-xs text-slate-500">Current quantity and threshold levels</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input
                  label="Current Stock"
                  type="number"
                  value={form.currentStock}
                  onChange={(e) => setForm((p: any) => ({ ...p, currentStock: parseFloat(e.target.value) || 0 }))}
                  min="0"
                />
                <Input
                  label="Unit Cost (₹)"
                  type="number"
                  value={form.unitCost}
                  onChange={(e) => setForm((p: any) => ({ ...p, unitCost: parseFloat(e.target.value) || 0 }))}
                  min="0"
                />
                <Input
                  label="Min Stock"
                  type="number"
                  value={form.minStock}
                  onChange={(e) => setForm((p: any) => ({ ...p, minStock: parseFloat(e.target.value) || 0 }))}
                  min="0"
                />
                <Input
                  label="Max Stock"
                  type="number"
                  value={form.maxStock}
                  onChange={(e) => setForm((p: any) => ({ ...p, maxStock: parseFloat(e.target.value) || 0 }))}
                  min="0"
                />
              </div>

              <div className="mt-3 rounded-2xl border border-fuchsia-100 bg-fuchsia-50 px-4 py-3 text-xs font-semibold text-fuchsia-700">
                Current stock health preview:{' '}
                {
                  stockStatus({
                    _id: 'preview',
                    isActive: true,
                    name:
                      form.itemName === 'Other'
                        ? form.customItemName || 'Preview'
                        : form.itemName || 'Preview',
                    category: form.category,
                    unit: form.unit,
                    currentStock: Number(form.currentStock) || 0,
                    minStock: Number(form.minStock) || 0,
                    maxStock: Number(form.maxStock) || 0,
                    unitCost: Number(form.unitCost) || 0,
                    supplier: form.supplier,
                  }).label
                }
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-xl bg-violet-100 p-2 text-violet-600">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Supplier</h4>
                  <p className="text-xs text-slate-500">Optional purchase source detail</p>
                </div>
              </div>

              <Input
                label="Supplier (optional)"
                value={form.supplier}
                onChange={(e) => setForm((p: any) => ({ ...p, supplier: e.target.value }))}
                placeholder="Supplier name or contact"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500 text-white"
                loading={saveMut.isPending}
                disabled={
                  !form.itemName ||
                  (form.itemName === 'Other' && !form.customItemName.trim())
                }
                onClick={() => {
                  const finalItemName =
                    form.itemName === 'Other'
                      ? form.customItemName.trim()
                      : form.itemName.trim();

                  saveMut.mutate({
                    category: form.category,
                    unit: form.unit,
                    currentStock: Number(form.currentStock) || 0,
                    minStock: Number(form.minStock) || 0,
                    maxStock: Number(form.maxStock) || 0,
                    unitCost: Number(form.unitCost) || 0,
                    supplier: form.supplier,
                    name: finalItemName,
                  });
                }}
              >
                {editItem ? 'Save Changes' : 'Add Item'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Adjust Modal */}
        {adjustItem && (
          <AdjustModal
            item={adjustItem}
            open={!!adjustItem}
            onClose={() => setAdjustItem(null)}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ['inventory'] });
              setAdjustItem(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}