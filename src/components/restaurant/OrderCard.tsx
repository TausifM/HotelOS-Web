import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Clock, MapPin, ChefHat, CheckCircle2, Package, X } from "lucide-react";

export interface Order {
  _id: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderType: 'room_service' | 'dine_in';
  roomNumber?: string;
  tableNumber?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  createdAt: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; ring: string; label: string }> = {
  pending:    { bg: 'bg-amber-500/10',  text: 'text-amber-700 dark:text-amber-400',  ring: 'ring-amber-500/30',  label: 'Pending' },
  preparing:  { bg: 'bg-blue-500/10',   text: 'text-blue-700 dark:text-blue-400',    ring: 'ring-blue-500/30',   label: 'Preparing' },
  ready:      { bg: 'bg-violet-500/10', text: 'text-violet-700 dark:text-violet-400',ring: 'ring-violet-500/30', label: 'Ready' },
  delivered:  { bg: 'bg-emerald-500/10',text: 'text-emerald-700 dark:text-emerald-400',ring: 'ring-emerald-500/30',label: 'Delivered' },
  cancelled:  { bg: 'bg-red-500/10',    text: 'text-red-700 dark:text-red-400',      ring: 'ring-red-500/30',    label: 'Cancelled' },
};

interface Props {
  order: Order;
  onUpdateStatus: (id: string, status: Order['status']) => void;
  delay?: number;
}

export function OrderCard({ order, onUpdateStatus, delay = 0 }: Props) {
  const style = STATUS_STYLES[order.status];

  return (
    <div
      className="group relative overflow-hidden rounded-3xl bg-card p-5 shadow-card transition-smooth hover:shadow-elegant hover:-translate-y-0.5 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Status accent bar */}
      <div className={cn("absolute left-0 top-0 h-full w-1.5", style.bg.replace('/10', ''))} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset", style.bg, style.text, style.ring)}>
            <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", style.text.includes('amber') ? 'bg-amber-500' : style.text.includes('blue') ? 'bg-blue-500' : style.text.includes('violet') ? 'bg-violet-500' : 'bg-emerald-500')} />
            {style.label}
          </span>
          <Badge variant="success" className="rounded-full text-xs capitalize">
            {order.orderType.replace('_', ' ')}
          </Badge>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {order.roomNumber ? `Room ${order.roomNumber}` : `Table ${order.tableNumber}`}
          </span>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gradient">₹{order.total}</p>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-secondary px-1.5 text-xs font-bold text-secondary-foreground">
              {item.quantity}
            </span>
            <span className="text-foreground">{item.name}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {order.status === 'pending' && (
          <Button size="sm" onClick={() => onUpdateStatus(order._id, 'preparing')} className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <ChefHat className="h-3.5 w-3.5" /> Start Preparing
          </Button>
        )}
        {order.status === 'preparing' && (
          <Button size="sm" onClick={() => onUpdateStatus(order._id, 'ready')} className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white shadow-sm">
            <Package className="h-3.5 w-3.5" /> Mark Ready
          </Button>
        )}
        {order.status === 'ready' && (
          <Button size="sm" onClick={() => onUpdateStatus(order._id, 'delivered')} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5" /> Mark Delivered
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => onUpdateStatus(order._id, 'cancelled')} className="gap-1.5 text-muted-foreground hover:text-destructive">
          <X className="h-3.5 w-3.5" /> Cancel
        </Button>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
