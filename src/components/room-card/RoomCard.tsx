'use client';
import { useState } from 'react';
import {
  Edit2, Trash2, Building2, BedDouble, Eye, Maximize2,
  Users, Baby, Cigarette, Accessibility, CheckCircle,
  ChevronDown, Wifi, Wind, Tv, Coffee, Car, Dumbbell,
  Waves, IndianRupee,
} from 'lucide-react';

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string; dot: string;
}> = {
  VC:  { label: 'Vacant Clean',   color: '#065f46', bg: '#ecfdf5', border: '#6ee7b7', dot: '#10b981' },
  VD:  { label: 'Vacant Dirty',   color: '#92400e', bg: '#fffbeb', border: '#fcd34d', dot: '#f59e0b' },
  OC:  { label: 'Occupied Clean', color: '#1e3a8a', bg: '#eff6ff', border: '#93c5fd', dot: '#3b82f6' },
  OD:  { label: 'Occupied Dirty', color: '#4c1d95', bg: '#f5f3ff', border: '#c4b5fd', dot: '#8b5cf6' },
  OOO: { label: 'Out of Order',   color: '#991b1b', bg: '#fef2f2', border: '#fca5a5', dot: '#ef4444' },
  OOS: { label: 'Out of Service', color: '#374151', bg: '#f9fafb', border: '#d1d5db', dot: '#9ca3af' },
  DND: { label: 'Do Not Disturb', color: '#7c2d12', bg: '#fff7ed', border: '#fdba74', dot: '#f97316' },
  INS: { label: 'Inspection',     color: '#164e63', bg: '#ecfeff', border: '#67e8f9', dot: '#06b6d4' },
};

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  standard:  { label: 'Standard',  color: '#374151', bg: '#f3f4f6' },
  deluxe:    { label: 'Deluxe',    color: '#1d4ed8', bg: '#dbeafe' },
  executive: { label: 'Executive', color: '#6d28d9', bg: '#ede9fe' },
  suite:     { label: 'Suite',     color: '#b45309', bg: '#fef3c7' },
  villa:     { label: 'Villa',     color: '#065f46', bg: '#d1fae5' },
};

const AMENITY_ICONS: Record<string, { icon: any; color: string }> = {
  'WiFi':     { icon: Wifi,     color: '#3b82f6' },
  'AC':       { icon: Wind,     color: '#06b6d4' },
  'TV':       { icon: Tv,       color: '#8b5cf6' },
  'Mini-bar': { icon: Coffee,   color: '#f59e0b' },
  'Parking':  { icon: Car,      color: '#64748b' },
  'Gym':      { icon: Dumbbell, color: '#ef4444' },
  'Pool':     { icon: Waves,    color: '#0ea5e9' },
};

// ── Inline Status Accordion ────────────────────────────────────────────────────
function StatusAccordion({ room, onChange }: {
  room: { _id: string; status: string };
  onChange: (id: string, status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const s = STATUS_CONFIG[room.status] || STATUS_CONFIG.VC;

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ border: `1.5px solid ${open ? s.border : s.border}` }}
    >
      {/* Trigger row */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold transition-all"
        style={{ background: s.bg, color: s.color }}
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: s.dot }}
        />
        <span className="flex-1 text-left">{s.label}</span>
        <ChevronDown
          className="w-3.5 h-3.5 opacity-60 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Accordion body — expands inline, no overflow, no portal */}
      {open && (
        <div
          className="border-t"
          style={{ borderColor: s.border, background: '#fafafa' }}
        >
          <div className="px-2 py-1.5">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-1">
              Change Status
            </p>
          </div>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const isActive = key === room.status;
            return (
              <button
                key={key}
                type="button"
                onClick={() => { onChange(room._id, key); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-all"
                style={isActive
                  ? { background: cfg.bg }
                  : { background: 'transparent' }
                }
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = '#f1f5f9';
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: cfg.dot }}
                />
                <span
                  className="font-mono text-[9px] font-bold text-gray-400 flex-shrink-0"
                  style={{ width: '22px' }}
                >
                  {key}
                </span>
                <span className="font-semibold flex-1" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
                {isActive && (
                  <CheckCircle
                    className="w-3 h-3 flex-shrink-0"
                    style={{ color: cfg.dot }}
                  />
                )}
              </button>
            );
          })}
          <div className="pb-1" />
        </div>
      )}
    </div>
  );
}

// ── Room Card ──────────────────────────────────────────────────────────────────
export function RoomCard({ room, onEdit, onDelete, onStatusChange, selected, onSelect }: {
  room: any;
  onEdit:         (r: any) => void;
  onDelete:       (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  selected:       boolean;
  onSelect:       (id: string) => void;
}) {
  const s = STATUS_CONFIG[room.status] || STATUS_CONFIG.VC;
  const t = TYPE_CONFIG[room.type]     || TYPE_CONFIG.standard;

  const namedAmenities = room.amenities?.filter((a: string) => AMENITY_ICONS[a]) || [];
  const otherAmenities = room.amenities?.filter((a: string) => !AMENITY_ICONS[a]) || [];

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-visible transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
      style={{
        border: `2px solid ${selected ? '#F97316' : s.border}`,
        boxShadow: selected
          ? '0 0 0 3px rgba(249,115,22,0.15), 0 4px 16px rgba(0,0,0,0.06)'
          : '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      {/* Status accent bar */}
      <div
        className="h-1.5 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${s.dot}, ${s.border})` }}
      />

      {/* Bulk select */}
      <div className="absolute -top-2 -left-2 z-20">
        <div
          className={`w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
            selected ? 'opacity-100' : 'border-gray-200 opacity-0 group-hover:opacity-100'
          }`}
          style={selected
            ? { background: 'linear-gradient(135deg,#F97316,#F43F5E)', borderColor: 'transparent' }
            : {}}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(room._id)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer rounded-full"
          />
          {selected && <CheckCircle className="w-3 h-3 text-white" />}
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute -top-2 -right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(room); }}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-md"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(room._id); }}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all shadow-md"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="p-4">
        {/* Room number + rate */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900 tracking-tight leading-none">
                {room.number}
              </span>
              {!room.isActive && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 uppercase">
                  Inactive
                </span>
              )}
            </div>
            <span
              className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide mt-1"
              style={{ background: t.bg, color: t.color }}
            >
              {t.label}
            </span>
          </div>

          <div className="flex flex-col items-end flex-shrink-0 ml-2">
            <div
              className="flex items-center gap-0.5 rounded-xl px-2.5 py-1.5"
              style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}
            >
              <IndianRupee className="w-3 h-3 text-orange-500" />
              <span className="text-sm font-black text-orange-600 leading-none">
                {room.baseRate?.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[9px] text-gray-400 mt-0.5">/night</span>
          </div>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {[
            { icon: Building2, label: `Fl.${room.floor}` },
            { icon: BedDouble, label: room.bedType, capitalize: true },
            room.view && room.view !== 'no view' && { icon: Eye, label: room.view, capitalize: true },
            room.squareFeet && { icon: Maximize2, label: `${room.squareFeet}ft²` },
          ].filter(Boolean).map((item: any, i) => (
            <span
              key={i}
              className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg"
              style={{ background: '#f8fafc', color: '#475569' }}
            >
              <item.icon className="w-3 h-3" />
              <span className={item.capitalize ? 'capitalize' : ''}>{item.label}</span>
            </span>
          ))}
        </div>

        {/* Capacity */}
        <div className="flex items-center gap-2 mb-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {room.maxAdults} adults
          </span>
          <span className="w-0.5 h-3 bg-gray-200 rounded-full" />
          <span className="flex items-center gap-1">
            <Baby className="w-3 h-3" /> {room.maxChildren} children
          </span>
          {room.smoking && (
            <span className="ml-auto" title="Smoking room">
              <Cigarette className="w-3.5 h-3.5 text-gray-400" />
            </span>
          )}
          {room.accessibility && (
            <span title="Accessible room">
              <Accessibility className="w-3.5 h-3.5 text-blue-500" />
            </span>
          )}
        </div>

        {/* ✅ Accordion — inline, no portal, no scroll blocking */}
        <div className="mb-3">
          <StatusAccordion room={room} onChange={onStatusChange} />
        </div>

        {/* Amenities */}
        {room.amenities?.length > 0 && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-gray-50">
            {namedAmenities.slice(0, 4).map((a: string) => {
              const cfg = AMENITY_ICONS[a];
              return (
                <span
                  key={a}
                  title={a}
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cfg.color}18` }}
                >
                  <cfg.icon className="w-3 h-3" style={{ color: cfg.color }} />
                </span>
              );
            })}
            {otherAmenities.slice(0, 2).map((a: string) => (
              <span
                key={a}
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                style={{ background: '#f1f5f9', color: '#64748b' }}
              >
                {a}
              </span>
            ))}
            {room.amenities.length > 6 && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-md ml-auto"
                style={{ background: '#f1f5f9', color: '#94a3b8' }}
              >
                +{room.amenities.length - 6}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}