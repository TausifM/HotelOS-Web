import { MenuItem } from "@/app/data/menuPresets";
import { cn } from "@/lib/utils";
import { Clock, Plus, Minus } from "lucide-react";


interface Props {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export function MenuItemCard({ item, quantity, onAdd, onRemove }: Props) {
  const isSelected = quantity > 0;
  return (
    <button
      type="button"
      onClick={onAdd}
      className={cn(
        "group relative overflow-hidden rounded-2xl border-2 p-3 text-left transition-smooth animate-scale-in",
        isSelected
          ? "border-primary bg-gradient-to-br from-primary/10 to-accent/5 shadow-glow"
          : "border-border bg-card hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-card"
      )}
    >
      {isSelected && (
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground shadow-glow">
          ×{quantity}
        </div>
      )}

      <div className="flex items-start gap-2">
        {/* Veg/Non-veg dot */}
        <div className={cn(
          "mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm border-2",
          item.isVeg ? "border-emerald-600" : "border-red-600"
        )}>
          <div className={cn("h-1.5 w-1.5 rounded-full", item.isVeg ? "bg-emerald-600" : "bg-red-600")} />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-foreground">{item.name}</h4>
          {item.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.description}</p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <p className="text-base font-bold text-gradient">₹{item.price}</p>
            {item.preparationTime && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
                <Clock className="h-2.5 w-2.5" /> {item.preparationTime}m
              </span>
            )}
          </div>
        </div>
      </div>

      {isSelected && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-card/80 p-1 backdrop-blur">
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-foreground hover:bg-muted transition-smooth"
          >
            <Minus className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm font-bold">{quantity}</span>
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-warm text-white shadow-sm hover:opacity-90 transition-smooth"
          >
            <Plus className="h-3.5 w-3.5" />
          </span>
        </div>
      )}
    </button>
  );
}
