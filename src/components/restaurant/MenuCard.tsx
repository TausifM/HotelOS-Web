'use client';

import { MenuItem } from '@/app/data/menuPresets';
import { cn } from '@/lib/utils';
import { Clock, Plus, Minus, Star, Flame, Users, ChefHat, TrendingUp } from 'lucide-react';

interface Props {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

const SPICE_CONFIG = {
  mild:   { label: 'Mild',   color: '#16a34a', bg: '#f0fdf4', dots: 1 },
  medium: { label: 'Medium', color: '#d97706', bg: '#fffbeb', dots: 2 },
  hot:    { label: 'Hot',    color: '#dc2626', bg: '#fef2f2', dots: 3 },
} as const;

export function MenuItemCard({ item, quantity, onAdd, onRemove }: Props) {
  const isSelected = quantity > 0;
  const spice = item.spiceLevel ? SPICE_CONFIG[item.spiceLevel] : null;

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-200 animate-scale-in',
        isSelected
          ? 'border-primary bg-gradient-to-br from-primary/10 to-accent/5 shadow-glow'
          : 'border-border bg-card hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-card'
      )}
    >
      {/* ── Image area ──────────────────────────────────── */}
      {item.imageUrl ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-orange-50 to-rose-50">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Qty badge top-right */}
          {isSelected && (
            <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-glow">
              ×{quantity}
            </div>
          )}

          {/* Badges top-left */}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {item.isPopular && (
              <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-orange-600 shadow-sm backdrop-blur">
                <TrendingUp className="h-2.5 w-2.5" /> Best seller
              </span>
            )}
            {item.isChefSpecial && (
              <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-pink-600 shadow-sm backdrop-blur">
                <ChefHat className="h-2.5 w-2.5" /> Chef's pick
              </span>
            )}
          </div>

          {/* Veg/non-veg pill bottom-left */}
          <div className="absolute bottom-2 left-2">
            <div
              className="flex h-5 w-5 items-center justify-center rounded-sm border-2 bg-white/90 shadow-sm"
              style={{ borderColor: item.isVeg ? '#16a34a' : '#dc2626' }}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ background: item.isVeg ? '#16a34a' : '#dc2626' }}
              />
            </div>
          </div>
        </div>
      ) : (
        /* No image — compact header row */
        <div className="flex items-start justify-between gap-2 px-3 pt-3">
          <div
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-sm border-2"
            style={{ borderColor: item.isVeg ? '#16a34a' : '#dc2626' }}
          >
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: item.isVeg ? '#16a34a' : '#dc2626' }}
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {item.isPopular && (
              <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                <TrendingUp className="h-2.5 w-2.5" /> Best seller
              </span>
            )}
            {item.isChefSpecial && (
              <span className="flex items-center gap-1 rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-bold text-pink-600">
                <ChefHat className="h-2.5 w-2.5" /> Chef's pick
              </span>
            )}
          </div>

          {isSelected && (
            <div className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground shadow-glow">
              ×{quantity}
            </div>
          )}
        </div>
      )}

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Name + description */}
        <div>
          <h4 className="truncate text-sm font-semibold text-foreground">{item.name}</h4>
          {item.description && (
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          )}
        </div>

        {/* Meta chips row */}
        <div className="flex flex-wrap items-center gap-1.5">
          {item.preparationTime && (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Clock className="h-2.5 w-2.5" />
              {item.preparationTime}m
            </span>
          )}

          {typeof item.rating === 'number' && (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              {item.rating.toFixed(1)}
            </span>
          )}

          {item.serves && (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Users className="h-2.5 w-2.5" />
              {item.serves}
            </span>
          )}

          {spice && (
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: spice.bg, color: spice.color }}
            >
              <Flame className="h-2.5 w-2.5" />
              {spice.label}
            </span>
          )}

          {item.calories && (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {item.calories} kcal
            </span>
          )}
        </div>

        {/* Price + stepper */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <p className="text-base font-bold text-gradient">₹{item.price}</p>

          {isSelected ? (
            <div className="flex items-center gap-1 rounded-xl bg-card/80 p-1 shadow-sm backdrop-blur">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-foreground transition-smooth hover:bg-muted"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[1.5rem] text-center text-sm font-bold">{quantity}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onAdd(); }}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-warm text-white shadow-sm transition-smooth hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-warm text-white shadow-sm transition-smooth hover:opacity-90 hover:shadow-glow"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}