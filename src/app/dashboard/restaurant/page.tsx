"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, Accordion, Badge, AccordionContent, AccordionItem, AccordionTrigger, DialogHeader, Input, DialogContent, DialogTitle, Tabs, TabsList, TabsTrigger, Switch } from "@/components/ui";
import { toast } from "react-hot-toast";
import {
  Plus, UtensilsCrossed, Pencil, Trash2, ChefHat, Clock,
  CheckCircle2, Package, ShoppingBag, Sparkles, Bell, Search, BedDouble, Utensils,
  X, ChevronDown, RefreshCw,
  Receipt,
  FileText,
  Download,
} from "lucide-react";
import { StatCard } from "@/components/restaurant/StatCard";
import { OrderCard, type Order } from "@/components/restaurant/OrderCard";
import { MenuItemCard } from "@/components/restaurant/MenuCard";
import { CATEGORY_META, getItemSuggestions, PRESET_ITEMS, type MenuItem } from "@/app/data/menuPresets";
import { cn } from "@/lib/utils";
import { Button, VisuallyHidden } from "@/components/ui";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import api from "@/lib/api";
const allPresetItems = Object.values(PRESET_ITEMS).flat();
/* ─── EMPTY ITEM TEMPLATE ─────────────────────────────────────────────────── */
const EMPTY_ITEM: MenuItem = {
  id: '',
  name: '',
  price: 0,
  category: 'main',
  description: '',
  isAvailable: true,
  isVeg: true,
  preparationTime: 15,
  // ── new fields ──
  isPopular: false,
  isChefSpecial: false,
  spiceLevel: undefined,
  serves: '',
  calories: undefined,
  rating: undefined,
};

/* ─── API HELPERS ─────────────────────────────────────────────────────────── */
const fetchOrders = async (filters?: { status?: string; date?: string }) => {
  const res = await api.get("/api/restaurant/orders", { params: filters });
  return res.data.data as Order[];
};

const fetchMenu = async () => {
  const res = await api.get("/api/restaurant/menu");
  return (res.data.data?.items ?? []) as MenuItem[];
};

export default function Index() {
  const qc = useQueryClient();

  /* ─── Queries ──────────────────────────────────────────────────────────── */
  const {
    data: orders = [],
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["restaurant-orders"],
    queryFn: () => fetchOrders(),
    refetchInterval: 20_000, // auto-poll every 20s for live kitchen updates
  });

  const {
    data: menuItems = [],
    isLoading: menuLoading,
  } = useQuery({
    queryKey: ["restaurant-menu"],
    queryFn: fetchMenu,
    staleTime: 60_000,
  });

  /* ─── Mutations ────────────────────────────────────────────────────────── */
  const placeOrderMutation = useMutation({
    mutationFn: (payload: {
      items: { name: string; price: number; quantity: number }[];
      orderType: "room_service" | "dine_in";
      roomNumber?: string;
      tableNumber?: string;
      total: number;
      reservationId?: string;
      guestId?: string;
    }) => api.post("/api/restaurant/orders", payload),
    onSuccess: () => {
      toast.success("Order placed successfully! 🎉");
      qc.invalidateQueries({ queryKey: ["restaurant-orders"] });
      setShowOrderModal(false);
      setSelectedItems([]);
      setRoomNumber("");
      setTableNumber("");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to place order"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Order["status"] }) =>
      api.patch(`/api/restaurant/orders/${id}/status`, { status }),
    onSuccess: (_, { status }) => {
      toast.success(`Order marked as ${status}`);
      qc.invalidateQueries({ queryKey: ["restaurant-orders"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to update status"),
  });

  const saveMenuMutation = useMutation({
    mutationFn: (items: MenuItem[]) =>
      api.put("/api/restaurant/menu", { items }),
    onSuccess: () => {
      toast.success("Menu saved");
      qc.invalidateQueries({ queryKey: ["restaurant-menu"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to save menu"),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) =>
      api.delete(`/api/restaurant/menu/items/${itemId}`),
    onSuccess: () => {
      toast.success("Item removed");
      qc.invalidateQueries({ queryKey: ["restaurant-menu"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to delete item"),
  });

  /* ─── Local UI state (no data here) ───────────────────────────────────── */
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showMenuEditor, setShowMenuEditor] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [orderType, setOrderType] = useState<"room_service" | "dine_in">("room_service");
  const [roomNumber, setRoomNumber] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [menuEditorCategory, setMenuEditorCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<
    Array<{ name: string; price: number; quantity: number }>
  >([]);
  const [formData, setFormData] = useState<MenuItem>(EMPTY_ITEM);
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<{
    calories: number[];
    descriptions: string[];
  } | null>(null);
  const [showGSTSettings, setShowGSTSettings] = useState(false);

  const [gstForm, setGstForm] = useState({
    taxPct: 5,
    taxMode: 'cgst_sgst' as 'cgst_sgst' | 'igst',
    hsnCode: '996331',
    footerNote: '',
  });
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [guestLoading, setGuestLoading] = useState(false);
  async function downloadInvoice(orderId: string) {
    setDownloadingInvoice(true);
    try {
      const res = await api.get(`/api/restaurant/orders/${orderId}/invoice`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `RST-INV-${orderId.slice(-6).toUpperCase()}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Invoice downloaded! 🧾");
    } catch {
      toast.error("Failed to generate invoice");
    } finally {
      setDownloadingInvoice(false);
    }
  }
  const { data: invoiceSettings } = useQuery({
    queryKey: ["invoice-settings"],
    queryFn: async () => {
      const res = await api.get(
        "/api/restaurant/invoice-settings"
      );

      return res.data.data;
    },
  });

  useEffect(() => {
    if (!invoiceSettings) return;

    setGstForm({
      taxPct: invoiceSettings.taxPct ?? 5,
      taxMode:
        invoiceSettings.taxMode ??
        "cgst_sgst",
      hsnCode:
        invoiceSettings.hsnCode ??
        "996331",
      footerNote:
        invoiceSettings.footerNote ?? "",
    });
  }, [invoiceSettings]);

  // Save mutation
  const saveGSTMutation = useMutation({
    mutationFn: (payload: typeof gstForm) =>
      api.patch('/api/restaurant/invoice-settings', payload),
    onSuccess: () => {
      toast.success('GST settings saved ✅');
      qc.invalidateQueries({ queryKey: ['invoice-settings'] });
      setShowGSTSettings(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to save'),
  });
  /* ─── Derived ──────────────────────────────────────────────────────────── */
  const availableMenu = useMemo(() => menuItems.filter((i) => i.isAvailable), [menuItems]);

  const orderCategories = useMemo(
    () => ["all", ...Array.from(new Set(availableMenu.map((i) => i.category)))],
    [availableMenu]
  );

  const editorCategories = useMemo(
    () => ["all", ...Array.from(new Set(menuItems.map((i) => i.category)))],
    [menuItems]
  );
  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get('/api/rooms').then((r) => r.data.data?.docs || r.data.data || []),
  });
  const filteredMenu = useMemo(() => {
    let list = availableMenu;
    if (activeCategory !== "all") list = list.filter((i) => i.category === activeCategory);
    if (search.trim()) list = list.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [availableMenu, activeCategory, search]);

  const total = selectedItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const pending = orders.filter((o) => ["pending", "preparing", "ready"].includes(o.status));
  const completed = orders.filter((o) => ["delivered", "cancelled"].includes(o.status));
  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredItems = useMemo(() => {
    return allPresetItems.filter((item) =>
      item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);
  /* ─── Helper ───────────────────────────────────────────────────────────── */
  function getCategoryMeta(cat: string) {
    return CATEGORY_META[cat] ?? { emoji: "🍽", label: cat };
  }

  /* ─── Form helpers ─────────────────────────────────────────────────────── */
  function openAddItem() {
    setFormData(EMPTY_ITEM);
    setShowAddItem(true);
  }

  function openEditItem(item: MenuItem) {
    setFormData({ ...item });
    setEditingItem(item);
  }

  function closeItemDialog() {
    setShowAddItem(false);
    setEditingItem(null);
    setFormData(EMPTY_ITEM);
    setSuggestions(null); // ← add this line
  }

  function patchForm(patch: Partial<MenuItem>) {
    setFormData((prev) => ({ ...prev, ...patch }));
  }

  /* ─── Order handlers ───────────────────────────────────────────────────── */
  function addItem(item: { name: string; price: number }) {
    setSelectedItems((prev) => {
      const ex = prev.find((i) => i.name === item.name);
      if (ex) return prev.map((i) => i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function removeItem(name: string) {
    setSelectedItems((prev) => {
      const ex = prev.find((i) => i.name === name);
      if (ex && ex.quantity > 1) return prev.map((i) => i.name === name ? { ...i, quantity: i.quantity - 1 } : i);
      return prev.filter((i) => i.name !== name);
    });
  }

  function placeOrder() {
  if (!selectedItems.length) return;

  if (orderType === "room_service" && !roomNumber) {
    toast.error("Please select a room");
    return;
  }

  if (orderType === "dine_in" && !tableNumber.trim()) {
    toast.error("Please enter a table number");
    return;
  }

  placeOrderMutation.mutate({
    items: selectedItems,
    orderType,
    roomNumber: orderType === "room_service" ? roomNumber : undefined,
    tableNumber: orderType === "dine_in" ? tableNumber.trim() : undefined,
    total,
    reservationId: selectedReservation?._id || selectedReservation?.id,
    guestId: selectedGuest?._id || selectedGuest?.id,
  });
}

  function updateStatus(id: string, status: Order["status"]) {
    updateStatusMutation.mutate({ id, status });
  }

  /* ─── Menu handlers ────────────────────────────────────────────────────── */
  // Toggle availability: optimistic local + full PUT to backend
  function toggleAvailability(id: string) {
    const updated = menuItems.map((i) =>
      i.id === id ? { ...i, isAvailable: !i.isAvailable } : i
    );
    // Optimistic via React Query cache
    qc.setQueryData(["restaurant-menu"], updated);
    saveMenuMutation.mutate(updated);
  }

  function deleteMenuItem(id: string) {
    // Use the dedicated DELETE endpoint (single item)
    deleteItemMutation.mutate(id);
  }

  function saveEditItem() {
    if (!editingItem) return;
    const updated = menuItems.map((i) =>
      i.id === editingItem.id ? { ...formData, id: editingItem.id } : i
    );
    saveMenuMutation.mutate(updated, {
      onSuccess: () => {
        closeItemDialog();
        toast.success("Item updated");
      },
    });
  }
  const loadGuestByRoom = async (room: any) => {
    if (!room) {
      setSelectedGuest(null);
      setSelectedReservation(null);
      return;
    }

    setGuestLoading(true);

    try {
      const roomId = room._id || room.id;
      const roomNo = String(room.number || '');

      const res = await api.get('/api/reservations', {
        params: {
          status: 'checked_in',
          roomId,
          roomNumber: roomNo,
          limit: 20,
        },
      });

      const rows = res.data?.data?.docs || res.data?.data || [];

      const booking = rows.find((item: any) => {
        const itemRoomId =
          item.roomId?._id || item.roomId || item.assignedRoomId || item.room?._id;
        const itemRoomNo =
          String(item.roomNumber || item.roomNo || item.room?.number || '');

        return String(itemRoomId) === String(roomId) || itemRoomNo === roomNo;
      });

      if (booking) {
        setSelectedGuest(booking.guestId || booking.guest || null);
        setSelectedReservation(booking);
      } else {
        setSelectedGuest(null);
        setSelectedReservation(null);
        toast.error('No checked-in guest found for this room');
      }
    } catch (e: any) {
      setSelectedGuest(null);
      setSelectedReservation(null);
      toast.error(e?.response?.data?.message || 'Failed to load guest');
    } finally {
      setGuestLoading(false);
    }
  };
  function addNewItem() {
    if (!formData.name.trim() || !formData.price) {
      toast.error("Name and price required");
      return;
    }

    const item: MenuItem = {
      ...formData,
      id: crypto.randomUUID(),
      price: Number(formData.price),
    };

    saveMenuMutation.mutate(
      [item, ...menuItems],
      {
        onSuccess: () => {
          closeItemDialog();
          toast.success(`${item.name} added to menu`);
        },
      }
    );
  }

  /* ─── Stats ────────────────────────────────────────────────────────────── */
  const stats = [
    { label: "Pending", value: orders.filter((o) => o.status === "pending").length, icon: Bell, gradient: "bg-gradient-to-br from-amber-400 to-orange-500" },
    { label: "Preparing", value: orders.filter((o) => o.status === "preparing").length, icon: ChefHat, gradient: "bg-gradient-to-br from-blue-500 to-indigo-600" },
    { label: "Ready", value: orders.filter((o) => o.status === "ready").length, icon: Package, gradient: "bg-gradient-to-br from-violet-500 to-fuchsia-600" },
    { label: "Delivered", value: orders.filter((o) => o.status === "delivered").length, icon: CheckCircle2, gradient: "bg-gradient-to-br from-emerald-500 to-teal-600" },
  ];

  /* ─── Loading skeleton ─────────────────────────────────────────────────── */
  if (ordersLoading || menuLoading) {
    return (
      <DashboardLayout title="Restaurant">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Restaurant & Room Service">
      <div className="relative min-h-screen bg-background bg-mesh">
        {/* Decorative orbs */}
        <div className="pointer-events-none fixed -left-32 top-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-float" />
        <div className="pointer-events-none fixed right-0 top-1/3 h-96 w-96 rounded-full bg-accent/15 blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* HEADER */}
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-warm shadow-glow">
                <UtensilsCrossed className="h-7 w-7 text-white" strokeWidth={2.2} />
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Restaurant <span className="text-gradient">& Room Service</span>
                </h1>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {pending.length} active orders · live kitchen view
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setShowMenuEditor(true)} className="gap-2 rounded-full border-2 hover:border-primary hover:text-primary transition-smooth">
                <Pencil className="h-4 w-4" /> Edit Menu
              </Button>
              <Button onClick={() => setShowOrderModal(true)} className="gap-2 rounded-full bg-gradient-warm text-primary-foreground shadow-elegant hover:shadow-glow transition-smooth border-0">
                <Plus className="h-4 w-4" /> New Order
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowGSTSettings(true)}
                className="gap-2 rounded-full border-2 hover:border-primary hover:text-primary transition-smooth"
              >
                <Receipt className="h-4 w-4" /> GST Settings
              </Button>
            </div>
          </header>

          {/* STATS */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s, i) => <StatCard key={s.label} {...s} delay={i * 80} />)}
          </section>

          {/* ACTIVE ORDERS */}
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold tracking-tight">Active Orders</h2>
              <Badge className="rounded-full bg-gradient-warm text-primary-foreground border-0 shadow-sm">
                {pending.length} live
              </Badge>
            </div>
            {pending.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-border bg-card/50 p-16 text-center animate-fade-in">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-warm/10">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </div>
                <p className="mt-4 text-lg font-semibold">No active orders</p>
                <p className="mt-1 text-sm text-muted-foreground">New orders will appear here in real-time.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pending.map((o, i) => <OrderCard key={o._id} order={o} onUpdateStatus={updateStatus} delay={i * 60} />)}
              </div>
            )}
          </section>

          {/* COMPLETED */}
          {completed.length > 0 && (
            <section className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  Completed Today
                </h2>
                <Badge className="rounded-full">{completed.length}</Badge>
              </div>

              <div className="overflow-hidden rounded-3xl bg-card shadow-card">
                <div className="w-full overflow-x-auto">
                  <table className="min-w-[760px] w-full text-sm">
                    <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-foreground">
                      <tr>
                        <th className="px-5 py-3 text-left whitespace-nowrap">Items</th>
                        <th className="px-5 py-3 text-left whitespace-nowrap">Type</th>
                        <th className="px-5 py-3 text-left whitespace-nowrap">Location</th>
                        <th className="px-5 py-3 text-right whitespace-nowrap">Amount</th>
                        <th className="px-5 py-3 text-left whitespace-nowrap">Status</th>
                        <th className="px-5 py-3 text-right whitespace-nowrap">Invoice</th>
                      </tr>
                    </thead>

                    <tbody>
                      {completed.slice(0, 10).map((o) => (
                        <tr
                          key={o._id}
                          className="border-t border-border transition-smooth hover:bg-secondary/30"
                        >
                          <td className="px-5 py-3 whitespace-nowrap">
                            {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                          </td>
                          <td className="px-5 py-3 capitalize whitespace-nowrap">
                            {o.orderType.replace("_", " ")}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            {o.roomNumber || o.tableNumber || "—"}
                          </td>
                          <td className="px-5 py-3 text-right font-semibold whitespace-nowrap">
                            ₹{o.total}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <Badge
                              variant={o.status === "delivered" ? "success" : "warning"}
                              className="rounded-full capitalize"
                            >
                              {o.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-right whitespace-nowrap">
                            {o.status === "delivered" && (
                              <button
                                onClick={() => setInvoiceOrder(o)}
                                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                                style={{
                                  background: "linear-gradient(135deg,#F97316,#F43F5E)",
                                  color: "#fff",
                                }}
                              >
                                <FileText className="h-3 w-3" />
                                Invoice
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </main>

        {/* ─── NEW ORDER MODAL ──────────────────────────────────────────────────── */}
        <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
          <DialogContent className="w-[calc(100vw-16px)] max-w-2xl h-[92vh] max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl p-0 border-0 overflow-hidden shadow-2xl" aria-describedby={undefined}>

            {/* ── HEADER ── */}
            <div
              className="flex-shrink-0 px-5 py-4 sm:px-6 sm:py-5 text-white"
              style={{ background: "linear-gradient(135deg, #F97316 0%, #F43F5E 100%)" }}
            >
              {/* Hidden title for accessibility */}
              <DialogTitle asChild>
                <VisuallyHidden>Create New Order</VisuallyHidden>
              </DialogTitle>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                    🛒 New Order
                  </h2>
                  <p className="text-xs sm:text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>
                    Select items and send to kitchen
                  </p>
                </div>
                {/* Live total pill */}
                {total > 0 && (
                  <div className="flex-shrink-0 rounded-full px-3 py-1 text-sm font-bold"
                    style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
                    ₹{total}
                  </div>
                )}
              </div>

              {/* Order type toggle — inside header for compact layout */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {([
                  { value: 'room_service' as const, icon: BedDouble, label: 'Room Service' },
                  { value: 'dine_in' as const, icon: Utensils, label: 'Dine In' },
                ]).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setOrderType(opt.value)}
                    className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all"
                    style={{
                      background: orderType === opt.value
                        ? "rgba(255,255,255,0.95)"
                        : "rgba(255,255,255,0.15)",
                      color: orderType === opt.value ? "#ea580c" : "rgba(255,255,255,0.9)",
                      border: orderType === opt.value
                        ? "2px solid rgba(255,255,255,0.9)"
                        : "2px solid rgba(255,255,255,0.25)",
                    }}
                  >
                    <opt.icon style={{ width: 15, height: 15 }} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── BODY ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="px-4 sm:px-6 pt-4 pb-2 space-y-4">

                {/* Room / Table input */}
                <div className="space-y-2">
                  {orderType === 'room_service' ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <BedDouble className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                        <select
                          value={selectedRoomId}
                          onChange={async (e) => {
                            const roomId = e.target.value;
                            setSelectedRoomId(roomId);

                            const room = rooms.find((r: any) => (r._id || r.id) === roomId);
                            const roomNo = String(room?.number || "");

                            setSelectedRoomNumber(roomNo);
                            setRoomNumber(roomNo);

                            setSelectedGuest(null);
                            setSelectedReservation(null);

                            if (room) {
                              await loadGuestByRoom(room);
                            }
                          }}
                          disabled={roomsLoading}

                          className="
                            h-11 w-full appearance-none rounded-xl border border-input bg-background
                            pl-10 pr-10 text-sm text-foreground shadow-sm outline-none transition-all
                            focus:border-transparent focus:ring-2 focus:ring-orange-400
                            disabled:cursor-not-allowed disabled:opacity-60
                          "
                        >
                          <option value="">
                            {roomsLoading ? 'Loading rooms...' : 'Select room'}
                          </option>

                          {rooms.map((room: any) => {
                            const roomId = room._id || room.id;
                            return (
                              <option key={roomId} value={roomId}>
                                Room {room.number} {room.floor ? `• Floor ${room.floor}` : ''}
                              </option>
                            );
                          })}
                        </select>

                        <svg
                          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>

                      {guestLoading ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                          <p className="text-xs text-muted-foreground">Loading guest...</p>
                        </div>
                      ) : selectedGuest ? (
                        <div className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {selectedGuest.firstName} {selectedGuest.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {selectedGuest.phone || 'No phone'}
                            {selectedReservation?.bookingRef
                              ? ` • ${selectedReservation.bookingRef}`
                              : ''}
                          </p>
                        </div>
                      ) : roomNumber ? (
                        <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2">
                          <p className="text-xs text-red-600">No active guest mapped to this room.</p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="relative">
                      <Utensils className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        placeholder="Enter table number (e.g. T3)"
                        className="h-11 rounded-xl pl-10 text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Search */}
                <div className="relative flex items-center">
                  {/* Search icon — left */}
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />

                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search menu items..."
                    className="w-full h-10 pl-9 pr-9 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                  />

                  {/* Clear button — right */}
                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 hover:text-gray-700 transition-colors z-10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  ) : (
                    // Microphone or filter hint icon on the right when empty (optional UX touch)
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none z-10">
                      <Search className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>

                {/* Categories — horizontal scroll */}
                <div className="relative">
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {orderCategories.map(cat => {
                      const meta = getCategoryMeta(cat);
                      const active = activeCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setActiveCategory(cat)}
                          className="flex-shrink-0 whitespace-nowrap px-3 py-1.5 text-xs rounded-full font-semibold transition-all"
                          style={{
                            background: active
                              ? "linear-gradient(135deg,#F97316,#F43F5E)"
                              : "#f1f5f9",
                            color: active ? "#fff" : "#64748b",
                            border: active ? "none" : "1.5px solid #e2e8f0",
                            transform: active ? "scale(1.05)" : "scale(1)",
                          }}
                        >
                          {meta.emoji} {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Menu grid — its own scroll container so footer stays fixed */}
              <div className="px-4 sm:px-6 pb-2">
                {filteredMenu.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-3xl mb-2">🔍</p>

                    <p className="font-semibold text-sm text-foreground">
                      No items found
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                      Try a different category or search term
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {filteredMenu.map((item, index) => {
                      const inOrder = selectedItems.find(
                        (i) => i.name === item.name
                      );

                      return (
                        <MenuItemCard
                          key={`${item.id || "item"}-${item.name}-${index}`}
                          item={item}
                          quantity={inOrder?.quantity ?? 0}
                          onAdd={() => addItem(item)}
                          onRemove={() => removeItem(item.name)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>


              {selectedItems.length > 0 && (
                <div className="sticky z-30 bottom-0 mx-4 sm:mx-6 mb-3">
                  <Accordion
                    type="single"
                    collapsible
                    defaultValue="summary"
                    className="rounded-2xl border border-orange-100 shadow-lg overflow-hidden"
                    style={{ background: "linear-gradient(135deg,#fff7ed,#fff1f2)" }}
                  >
                    <AccordionItem value="summary" className="border-0">

                      {/* ── Trigger ── */}
                      <AccordionTrigger
                        className="
                        group w-full flex items-center justify-between
                        px-3 sm:px-4 py-3
                        hover:bg-orange-50/50 hover:no-underline transition-colors
                        data-[state=open]:border-b data-[state=open]:border-orange-100
                        [&>svg]:hidden
                      "
                      >
                        {/* Left — icon + label + count badge */}
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-orange-500 flex-shrink-0" />
                          <span className="text-sm font-bold text-orange-700">
                            Order Summary
                          </span>
                          <span
                            className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-bold text-white"
                            style={{ background: "linear-gradient(135deg,#F97316,#F43F5E)" }}
                          >
                            {selectedItems.reduce((s, i) => s + i.quantity, 0)}
                          </span>
                        </div>

                        {/* Right — total + custom chevron */}
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-orange-600">₹{total}</span>
                          <span
                            className="flex items-center justify-center h-6 w-6 rounded-full"
                            style={{ background: "rgba(249,115,22,0.12)" }}
                          >
                            <ChevronDown
                              className="h-3.5 w-3.5 text-orange-500 transition-transform duration-300 group-data-[state=open]:rotate-180"
                            />
                          </span>
                        </div>
                      </AccordionTrigger>

                      {/* ── Content ── */}
                      <AccordionContent className="pb-0">
                        <div className="px-3 sm:px-4 pb-3 pt-0 space-y-1">

                          {/* Clear all */}
                          <div className="flex justify-end pb-1">
                            <button
                              type="button"
                              onClick={() => setSelectedItems([])}
                              className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
                            >
                              Clear all
                            </button>
                          </div>

                          {/* Item rows */}
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                            {selectedItems.map(item => (
                              <div
                                key={item.name}
                                className="flex items-center justify-between gap-2 text-xs sm:text-sm"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {/* Qty stepper */}
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => removeItem(item.name)}
                                      className="h-5 w-5 rounded-full flex items-center justify-center text-orange-600 font-bold text-xs hover:bg-orange-200 transition-colors"
                                      style={{ background: "rgba(249,115,22,0.12)" }}
                                    >
                                      −
                                    </button>
                                    <span className="w-5 text-center font-bold text-xs text-gray-800">
                                      {item.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => addItem(item)}
                                      className="h-5 w-5 rounded-full flex items-center justify-center text-orange-600 font-bold text-xs hover:bg-orange-200 transition-colors"
                                      style={{ background: "rgba(249,115,22,0.12)" }}
                                    >
                                      +
                                    </button>
                                  </div>
                                  <span className="truncate text-gray-700">{item.name}</span>
                                </div>
                                <span className="flex-shrink-0 font-semibold text-gray-800">
                                  ₹{item.price * item.quantity}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Total row */}
                          <div className="pt-2 mt-1 border-t border-orange-100 flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {orderType === 'room_service'
                                ? `🛏 Room ${roomNumber || '—'}`
                                : `🍽 Table ${tableNumber || '—'}`}
                            </span>
                            <span className="text-sm font-bold text-orange-600">₹{total}</span>
                          </div>
                        </div>
                      </AccordionContent>

                    </AccordionItem>
                  </Accordion>
                </div>
              )}
            </div>

            {/* ── FOOTER ── */}
            <div
              className="flex-shrink-0 border-t px-4 sm:px-6 py-3 sm:py-4"
              style={{ borderColor: "#f1f5f9", background: "#ffffff" }}
            >
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
                  style={{ border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={placeOrder}
                  disabled={
                    placeOrderMutation.isPending ||
                    !selectedItems.length ||
                    (orderType === "room_service" ? !roomNumber : !tableNumber.trim())
                  }
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg,#F97316,#F43F5E)",
                    boxShadow: selectedItems.length ? "0 4px 14px rgba(249,115,22,0.4)" : "none",
                  }}
                >
                  {selectedItems.length
                    ? `Place Order · ₹${total}`
                    : 'Select items to order'}
                </button>
              </div>
            </div>

          </DialogContent>
        </Dialog>

        {/* ─── MENU EDITOR ──────────────────────────────────────────────────────── */}
        <Dialog open={showMenuEditor} onOpenChange={setShowMenuEditor}>
          <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border-0 p-0" aria-describedby={undefined}>

            {/* Header */}
            <div className="sticky top-0 z-10 p-6 text-white"
              style={{ background: "linear-gradient(135deg, #F97316 0%, #F43F5E 100%)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle asChild>
                    <VisuallyHidden>Menu Editor</VisuallyHidden>
                  </DialogTitle>
                  <h2 className="text-2xl font-bold text-white">Menu Editor</h2>
                  <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.8)" }}>
                    {menuItems.length} items · {availableMenu.length} available
                  </p>
                </div>
                {/* ✅ Inline styles guarantee visibility regardless of Tailwind config */}
                <button
                  onClick={openAddItem}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#ffffff",
                    color: "#ea580c",
                    fontWeight: 700,
                    fontSize: "14px",
                    padding: "8px 18px",
                    borderRadius: "999px",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                >
                  <Plus style={{ width: 16, height: 16, strokeWidth: 2.5 }} />
                  Add Item
                </button>
              </div>
            </div>

            <div className="space-y-3 p-6">
              {/* Category tabs */}
              <Tabs value={menuEditorCategory} onValueChange={setMenuEditorCategory}>
                <TabsList className="flex w-full flex-wrap h-auto gap-1 bg-secondary/50 p-1 rounded-2xl">
                  {editorCategories.map(cat => (
                    <TabsTrigger
                      key={cat}
                      value={cat}
                      className="rounded-full text-xs capitalize data-[state=active]:text-white data-[state=active]:shadow-sm"
                      style={menuEditorCategory === cat
                        ? { background: "linear-gradient(135deg,#F97316,#F43F5E)", color: "#fff" }
                        : {}}
                    >
                      {getCategoryMeta(cat).emoji} {cat}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* Menu items list */}
              <div className="space-y-2">
                {(menuEditorCategory === 'all'
                  ? menuItems
                  : menuItems.filter(i => i.category === menuEditorCategory)
                ).map((item, index) => (
                  <div
                    key={`${item.id}-${item.name}-${index}`}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border bg-card p-3 transition-all",
                      "hover:border-primary/40 hover:shadow-sm",
                      item.isAvailable ? "border-border" : "border-border/50 opacity-60"
                    )}
                  >
                    {/* Veg / Non-veg indicator */}
                    <div
                      className="flex-shrink-0 flex h-4 w-4 items-center justify-center rounded-sm border-2"
                      style={{ borderColor: item.isVeg ? "#16a34a" : "#dc2626" }}
                    >
                      <div
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: item.isVeg ? "#16a34a" : "#dc2626" }}
                      />
                    </div>

                    {/* Item info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                        <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                          {item.category}
                        </span>
                        {item.preparationTime && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />{item.preparationTime}m
                          </span>
                        )}
                        {item.isPopular && (
                          <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                            🔥 Best seller
                          </span>
                        )}
                        {item.isChefSpecial && (
                          <span className="inline-flex items-center rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-bold text-pink-600">
                            👨‍🍳 Chef's pick
                          </span>
                        )}
                        {item.spiceLevel && (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600 capitalize">
                            🌶 {item.spiceLevel}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.description}</p>
                      )}
                    </div>

                    {/* Price */}
                    <p className="flex-shrink-0 text-sm font-bold" style={{ color: "#ea580c" }}>
                      ₹{item.price}
                    </p>

                    {/* Availability toggle */}
                    <Switch
                      className="data-[state=checked]:bg-primary"
                      checked={item.isAvailable}
                      onCheckedChange={() => toggleAvailability(item.id)}
                    />

                    {/* ✅ Edit button — fully visible with inline styles */}
                    <button
                      onClick={() => openEditItem(item)}
                      title="Edit item"
                      style={{
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "1.5px solid #e2e8f0",
                        background: "#f8fafc",
                        color: "#3b82f6",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = "#eff6ff";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#3b82f6";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0";
                      }}
                    >
                      <Pencil style={{ width: 14, height: 14, strokeWidth: 2 }} />
                    </button>

                    {/* ✅ Delete button — fully visible with inline styles */}
                    <button
                      onClick={() => { if (confirm(`Remove "${item.name}"?`)) deleteMenuItem(item.id); }}
                      title="Delete item"
                      style={{
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "1.5px solid #e2e8f0",
                        background: "#f8fafc",
                        color: "#ef4444",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#ef4444";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0";
                      }}
                    >
                      <Trash2 style={{ width: 14, height: 14, strokeWidth: 2 }} />
                    </button>
                  </div>
                ))}

                {/* Empty state */}
                {(menuEditorCategory === 'all' ? menuItems : menuItems.filter(i => i.category === menuEditorCategory)).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-4xl mb-3">🍽</p>
                    <p className="font-semibold text-foreground">No items in this category</p>
                    <p className="text-sm text-muted-foreground mt-1">Click "Add Item" to get started</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 rounded-b-3xl border-t border-border bg-background/95 px-6 py-4 backdrop-blur flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowMenuEditor(false)} className="rounded-full">
                Close
              </Button>
              <Button
                onClick={() => { toast.success('Menu saved!'); setShowMenuEditor(false); }}
                className="rounded-full text-white border-0"
                style={{ background: "linear-gradient(135deg,#F97316,#F43F5E)" }}
              >
                Save Menu
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showAddItem || !!editingItem}
          onOpenChange={(open) => {
            if (!open) closeItemDialog();
          }}
        >
          <DialogContent
            className="w-[calc(100vw-24px)] max-w-lg rounded-3xl border-0 p-0 overflow-hidden"
            aria-describedby={undefined}
          >
            {/* Header */}
            <DialogHeader
              className="p-5 text-white space-y-1"
              style={{
                background:
                  "linear-gradient(135deg, #F97316 0%, #F43F5E 100%)",
              }}
            >
              <DialogTitle className="text-lg font-bold text-white leading-tight">
                {editingItem
                  ? `✏️ Edit — ${editingItem.name}`
                  : "➕ Add Menu Item"}
              </DialogTitle>

              <p
                className="text-xs"
                style={{
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                {editingItem
                  ? "Update the item details below"
                  : "Fill in the details for the new item"}
              </p>
            </DialogHeader>

            {/* Body */}
            <div className="overflow-y-auto max-h-[65vh] p-4 sm:p-6 space-y-4">

              {/* Item Name */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Item Name *
                </label>

                {!customMode ? (
                  <div
                    className="relative"
                    ref={dropdownRef}
                  >
                    {/* Trigger */}
                    <div
                      onClick={() => setOpen((v) => !v)}
                      className="flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-input bg-background px-3 text-sm"
                    >
                      <span
                        className={
                          formData.name
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {formData.name ||
                          "Search or select item..."}
                      </span>

                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Dropdown */}
                    {open && (
                      <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-input bg-white shadow-lg">

                        {/* Search */}
                        <div className="border-b border-input px-3 py-2">
                          <input
                            autoFocus
                            value={searchQuery}
                            onChange={(e) =>
                              setSearchQuery(e.target.value)
                            }
                            placeholder="Search item..."
                            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                          />
                        </div>

                        {/* List */}
                        <div className="max-h-52 overflow-y-auto">
                          {filteredItems.length > 0 ? (
                            filteredItems.map(
                              (item, index) => (
                                <div
                                  key={`${item.name}-${index}`}
                                  onClick={() => {
                                    patchForm({
                                      name: item.name,
                                      price: item.price,
                                      category: item.category,
                                      isVeg: item.isVeg,
                                    });
                                    const sugg = getItemSuggestions(item.name);
                                    setSuggestions(sugg);
                                    if (sugg) {
                                      patchForm({ calories: sugg.calories[0], description: sugg.descriptions[0] });
                                    }
                                    setOpen(false);
                                    setSearchQuery('');
                                  }}
                                  className="flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm hover:bg-orange-50 transition-colors"
                                >
                                  <span className="flex items-center gap-2">
                                    <span>
                                      {item.isVeg
                                        ? "🟢"
                                        : "🔴"}
                                    </span>

                                    <span>
                                      {item.name}
                                    </span>
                                  </span>

                                  <span className="text-xs text-muted-foreground">
                                    ₹{item.price}
                                  </span>
                                </div>
                              )
                            )
                          ) : (
                            <div className="flex flex-col items-center gap-2 py-4 text-center">
                              <p className="text-xs text-muted-foreground">
                                No item found
                              </p>

                              {searchQuery && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    patchForm({
                                      name: searchQuery,
                                    });

                                    setCustomMode(true);
                                    setOpen(false);
                                    setSearchQuery("");
                                  }}
                                  className="rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition-all"
                                >
                                  ✏️ Add "
                                  {searchQuery}"
                                  as custom item
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Other Option */}
                        <div className="border-t border-input">
                          <div
                            onClick={() => {
                              patchForm({ name: searchQuery });
                              setCustomMode(true);
                              setOpen(false);
                              setSearchQuery("");
                            }}
                            className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-50 transition-colors"
                          >
                            <Plus className="h-4 w-4" />

                            Other — type custom name
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Custom Input */
                  <div className="flex items-center gap-2">

                    <div className="relative flex-1">
                      <Input
                        autoFocus
                        value={formData.name || ""}
                        onChange={(e) =>
                          patchForm({
                            name: e.target.value,
                          })
                        }
                        placeholder="Type custom item name..."
                        className="h-11 rounded-xl pr-16 text-sm border-orange-300 focus-visible:ring-orange-400"
                      />

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-500">
                        custom
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCustomMode(false);
                        patchForm({ name: '' }); // ← remove itemId: undefined
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-input text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {customMode && formData.name && (
                  <p className="mt-1.5 text-xs font-medium text-orange-500">
                    ✏️ Custom item — not from master menu
                  </p>
                )}
              </div>

              {/* Price + Prep Time */}
              <div className="grid grid-cols-2 gap-3">

                {/* Price */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Price (₹) *
                  </label>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-orange-500">
                      ₹
                    </span>

                    <Input
                      type="number"
                      min={0}
                      value={formData.price || ""}
                      onChange={(e) =>
                        patchForm({
                          price:
                            parseFloat(
                              e.target.value
                            ) || 0,
                        })
                      }
                      placeholder="0"
                      className="h-11 rounded-xl pl-7 text-sm"
                    />
                  </div>
                </div>

                {/* Prep Time */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Prep Time
                  </label>

                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      value={
                        formData.preparationTime || ""
                      }
                      onChange={(e) =>
                        patchForm({
                          preparationTime:
                            parseInt(
                              e.target.value
                            ) || 0,
                        })
                      }
                      placeholder="15"
                      className="h-11 rounded-xl pr-10 text-sm"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      min
                    </span>
                  </div>
                </div>
              </div>

              {/* Veg / Non Veg */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Type
                </label>

                <div className="grid grid-cols-2 gap-2">

                  {/* Veg */}
                  <button
                    type="button"
                    onClick={() =>
                      patchForm({ isVeg: true })
                    }
                    className="rounded-xl py-2.5 text-sm font-semibold transition-all"
                    style={{
                      border: `2px solid ${formData.isVeg
                        ? "#16a34a"
                        : "#e2e8f0"
                        }`,
                      background: formData.isVeg
                        ? "#f0fdf4"
                        : "transparent",
                      color: formData.isVeg
                        ? "#15803d"
                        : "#94a3b8",
                    }}
                  >
                    🟢 Veg
                  </button>

                  {/* Non Veg */}
                  <button
                    type="button"
                    onClick={() =>
                      patchForm({ isVeg: false })
                    }
                    className="rounded-xl py-2.5 text-sm font-semibold transition-all"
                    style={{
                      border: `2px solid ${!formData.isVeg
                        ? "#dc2626"
                        : "#e2e8f0"
                        }`,
                      background: !formData.isVeg
                        ? "#fef2f2"
                        : "transparent",
                      color: !formData.isVeg
                        ? "#b91c1c"
                        : "#94a3b8",
                    }}
                  >
                    🔴 Non-Veg
                  </button>
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Category
                </label>

                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(CATEGORY_META)
                    .filter((c) => c !== "all")
                    .map((cat) => {
                      const meta = CATEGORY_META[cat];

                      const active =
                        formData.category === cat;

                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() =>
                            patchForm({
                              category: cat,
                            })
                          }
                          className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                          style={{
                            background: active
                              ? "linear-gradient(135deg,#F97316,#F43F5E)"
                              : "#f1f5f9",
                            color: active
                              ? "#fff"
                              : "#64748b",
                            border: active
                              ? "none"
                              : "1.5px solid #e2e8f0",
                          }}
                        >
                          {meta.emoji} {meta.label}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Description */}
              {/* ── Auto Suggestions (shown when known item selected) ── */}
              {suggestions && !customMode && (
                <div className="space-y-3 rounded-2xl border border-orange-100 bg-orange-50/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">
                    ✨ Smart suggestions for "{formData.name}"
                  </p>

                  {/* Description options */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Pick a description</p>
                    {suggestions.descriptions.map((desc, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => patchForm({ description: desc })}
                        className={cn(
                          'w-full rounded-xl border px-3 py-2.5 text-left text-xs leading-relaxed transition-all',
                          formData.description === desc
                            ? 'border-orange-400 bg-white font-medium text-foreground shadow-sm'
                            : 'border-border bg-white/60 text-muted-foreground hover:border-orange-200 hover:bg-white'
                        )}
                      >
                        <span className="mr-1.5 font-bold text-orange-400">{i + 1}.</span>
                        {desc}
                      </button>
                    ))}
                  </div>

                  {/* Calorie options */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Calories (kcal)</p>
                    <div className="flex gap-2">
                      {suggestions.calories.map((cal, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => patchForm({ calories: cal })}
                          className={cn(
                            'flex-1 rounded-xl border py-2 text-center text-xs font-semibold transition-all',
                            formData.calories === cal
                              ? 'border-orange-400 bg-orange-50 text-orange-700 shadow-sm'
                              : 'border-border bg-white text-muted-foreground hover:border-orange-200'
                          )}
                        >
                          <div className="text-sm font-bold">{cal}</div>
                          <div className="mt-0.5 text-[10px] font-normal">
                            {(['Light', 'Standard', 'Rich'] as const)[i]}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Description — manual input */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                  {suggestions && !customMode && (
                    <span className="ml-2 normal-case font-normal text-orange-500">
                      or type your own below
                    </span>
                  )}
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) => patchForm({ description: e.target.value })}
                  placeholder="e.g. Rich creamy tomato gravy"
                  className="h-11 rounded-xl text-sm"
                />
              </div>
              {/* Spice Level */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Spice Level <span className="ml-1 normal-case font-normal text-muted-foreground/60">optional</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['mild', 'medium', 'hot'] as const).map((level) => {
                    const config = { mild: { label: 'Mild 🌿', color: '#16a34a', bg: '#f0fdf4' }, medium: { label: 'Medium 🌶', color: '#d97706', bg: '#fffbeb' }, hot: { label: 'Hot 🔥', color: '#dc2626', bg: '#fef2f2' } };
                    const active = formData.spiceLevel === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => patchForm({ spiceLevel: active ? undefined : level })}
                        className="rounded-xl py-2.5 text-sm font-semibold transition-all"
                        style={{
                          border: `2px solid ${active ? config[level].color : '#e2e8f0'}`,
                          background: active ? config[level].bg : 'transparent',
                          color: active ? config[level].color : '#94a3b8',
                        }}
                      >
                        {config[level].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Serves + Calories */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Serves <span className="ml-1 normal-case font-normal text-muted-foreground/60">optional</span>
                  </label>
                  <Input
                    value={formData.serves ?? ''}
                    onChange={(e) => patchForm({ serves: e.target.value })}
                    placeholder="e.g. 1–2 persons"
                    className="h-11 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Calories <span className="ml-1 normal-case font-normal text-muted-foreground/60">kcal</span>
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.calories ?? ''}
                    onChange={(e) => patchForm({ calories: parseInt(e.target.value) || undefined })}
                    placeholder="e.g. 450"
                    className="h-11 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Popular + Chef Special toggles */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'isPopular' as const, label: 'Best Seller', desc: 'Show trending badge', icon: '🔥' },
                  { key: 'isChefSpecial' as const, label: "Chef's Pick", desc: 'Show chef special badge', icon: '👨‍🍳' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => patchForm({ [opt.key]: !formData[opt.key] })}
                    className="flex items-center justify-between rounded-2xl p-3 text-left transition-all"
                    style={{
                      background: formData[opt.key] ? '#fff7ed' : '#f8fafc',
                      border: `1.5px solid ${formData[opt.key] ? '#fed7aa' : '#e2e8f0'}`,
                    }}
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{opt.icon} {opt.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                    <Switch
                      checked={!!formData[opt.key]}
                      onCheckedChange={(v) => patchForm({ [opt.key]: v })}
                      className="data-[state=checked]:bg-primary"
                    />
                  </button>
                ))}
              </div>
              {/* Available */}
              <div
                className="flex items-center justify-between rounded-2xl p-3"
                style={{
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                }}
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Available on menu
                  </p>

                  <p className="text-xs text-muted-foreground mt-0.5">
                    Guests can order this item
                  </p>
                </div>

                <Switch
                  checked={formData.isAvailable}
                  onCheckedChange={(v) =>
                    patchForm({
                      isAvailable: v,
                    })
                  }
                />
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-3 px-4 py-4 sm:px-6"
              style={{
                borderTop: "1px solid #f1f5f9",
                background: "#ffffff",
              }}
            >
              <button
                type="button"
                onClick={closeItemDialog}
                className="rounded-full px-5 py-2.5 text-sm font-semibold transition-all"
                style={{
                  border: "1.5px solid #e2e8f0",
                  background: "#fff",
                  color: "#64748b",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  editingItem
                    ? saveEditItem
                    : addNewItem
                }
                className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition-all"
                style={{
                  background:
                    "linear-gradient(135deg,#F97316,#F43F5E)",
                  boxShadow:
                    "0 4px 14px rgba(249,115,22,0.4)",
                  border: "none",
                }}
              >
                {editingItem
                  ? "💾 Save Changes"
                  : "✅ Add to Menu"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={showGSTSettings} onOpenChange={setShowGSTSettings}>
          <DialogContent
            className="w-[calc(100vw-24px)] max-w-md rounded-3xl border-0 p-0 overflow-hidden"
            aria-describedby={undefined}
          >
            {/* Header */}
            <DialogHeader
              className="p-5 text-white space-y-1"
              style={{ background: "linear-gradient(135deg, #F97316 0%, #F43F5E 100%)" }}
            >
              <DialogTitle className="text-lg font-bold text-white">
                🧾 Invoice & GST Settings
              </DialogTitle>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>
                Applied to all restaurant invoices
              </p>
            </DialogHeader>

            <div className="p-5 space-y-5">

              {/* Tax % */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  GST Rate (%)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[0, 5, 12, 18, 28].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setGstForm(f => ({ ...f, taxPct: rate }))}
                      className="rounded-full px-4 py-2 text-sm font-bold transition-all"
                      style={{
                        background: gstForm.taxPct === rate
                          ? "linear-gradient(135deg,#F97316,#F43F5E)"
                          : "#f1f5f9",
                        color: gstForm.taxPct === rate ? "#fff" : "#64748b",
                        border: gstForm.taxPct === rate ? "none" : "1.5px solid #e2e8f0",
                      }}
                    >
                      {rate}%
                    </button>
                  ))}

                  {/* Custom rate input */}
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={28}
                      value={![0, 5, 12, 18, 28].includes(gstForm.taxPct) ? gstForm.taxPct : ""}
                      onChange={(e) =>
                        setGstForm(f => ({ ...f, taxPct: parseFloat(e.target.value) || 0 }))
                      }
                      placeholder="Custom"
                      className="h-9 w-24 rounded-full text-sm text-center"
                      style={{
                        border: ![0, 5, 12, 18, 28].includes(gstForm.taxPct)
                          ? "2px solid #F97316"
                          : "1.5px solid #e2e8f0",
                      }}
                    />
                  </div>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  🍽 Restaurant food services: <strong>5%</strong> &nbsp;|&nbsp;
                  AC restaurant: <strong>5%</strong> &nbsp;|&nbsp;
                  Liquor: <strong>18%</strong>
                </p>
              </div>

              {/* Tax Mode */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tax Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'cgst_sgst', label: 'CGST + SGST', desc: 'Intra-state (same state)' },
                    { value: 'igst', label: 'IGST', desc: 'Inter-state (different state)' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGstForm(f => ({ ...f, taxMode: opt.value }))}
                      className="rounded-xl p-3 text-left transition-all"
                      style={{
                        border: `2px solid ${gstForm.taxMode === opt.value ? "#F97316" : "#e2e8f0"}`,
                        background: gstForm.taxMode === opt.value ? "#fff7ed" : "#fff",
                      }}
                    >
                      <p className="text-sm font-bold" style={{
                        color: gstForm.taxMode === opt.value ? "#ea580c" : "#374151"
                      }}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Live split preview */}
                <div
                  className="mt-2 flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium"
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                >
                  <span className="text-muted-foreground">On ₹100 bill:</span>
                  {gstForm.taxMode === 'cgst_sgst' ? (
                    <span>
                      CGST <strong>{(gstForm.taxPct / 2).toFixed(1)}%</strong>
                      {" + "}
                      SGST <strong>{(gstForm.taxPct / 2).toFixed(1)}%</strong>
                      {" = "}
                      <strong className="text-orange-600">₹{gstForm.taxPct.toFixed(2)}</strong>
                    </span>
                  ) : (
                    <span>
                      IGST <strong>{gstForm.taxPct}%</strong>
                      {" = "}
                      <strong className="text-orange-600">₹{gstForm.taxPct.toFixed(2)}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* HSN Code */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  HSN / SAC Code
                </label>
                <Input
                  value={gstForm.hsnCode}
                  onChange={(e) => setGstForm(f => ({ ...f, hsnCode: e.target.value }))}
                  placeholder="996331"
                  className="h-11 rounded-xl text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Default <strong>996331</strong> = Restaurant & food service (SAC)
                </p>
              </div>

              {/* Footer note */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Invoice Footer Note
                  <span className="ml-1 normal-case font-normal text-muted-foreground/60">(optional)</span>
                </label>
                <Input
                  value={gstForm.footerNote}
                  onChange={(e) => setGstForm(f => ({ ...f, footerNote: e.target.value }))}
                  placeholder="e.g. Thank you for dining with us!"
                  className="h-11 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-3 px-5 py-4"
              style={{ borderTop: "1px solid #f1f5f9" }}
            >
              <button
                type="button"
                onClick={() => setShowGSTSettings(false)}
                className="rounded-full px-5 py-2.5 text-sm font-semibold"
                style={{ border: "1.5px solid #e2e8f0", color: "#64748b" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveGSTMutation.mutate(gstForm)}
                disabled={saveGSTMutation.isPending}
                className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg,#F97316,#F43F5E)",
                  boxShadow: "0 4px 14px rgba(249,115,22,0.4)",
                }}
              >
                {saveGSTMutation.isPending ? "Saving..." : "💾 Save Settings"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={!!invoiceOrder} onOpenChange={(open) => { if (!open) setInvoiceOrder(null); }}>
          <DialogContent
            className="w-[calc(100vw-24px)] max-w-md rounded-3xl border-0 p-0 overflow-hidden"
            aria-describedby={undefined}
          >
            {/* ── Header ── */}
            <DialogHeader
              className="p-5 text-white"
              style={{ background: "linear-gradient(135deg, #F97316 0%, #F43F5E 100%)" }}
            >
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Restaurant Invoice
              </DialogTitle>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.75)" }}>
                Order #{invoiceOrder?._id.slice(-6).toUpperCase()}
              </p>
            </DialogHeader>

            {/* ── Body ── */}
            {invoiceOrder && (
              <div className="p-5 space-y-4">

                {/* Order type + location badge */}
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                    style={{
                      background: invoiceOrder.orderType === "room_service" ? "#eff6ff" : "#f0fdf4",
                      color: invoiceOrder.orderType === "room_service" ? "#1d4ed8" : "#15803d",
                    }}
                  >
                    {invoiceOrder.orderType === "room_service" ? "🛏" : "🍽"}&nbsp;
                    {invoiceOrder.orderType === "room_service"
                      ? `Room Service — Room ${invoiceOrder.roomNumber ?? "—"}`
                      : `Dine In — Table ${invoiceOrder.tableNumber ?? "—"}`}
                  </span>
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ background: "#f0fdf4", color: "#15803d" }}
                  >
                    ✅ Delivered
                  </span>
                </div>

                {/* Order date/time */}
                <div
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs"
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                >
                  <span className="text-muted-foreground font-medium">Ordered</span>
                  <span className="font-semibold text-foreground">
                    {new Date(invoiceOrder.createdAt).toLocaleString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Items list */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Items Ordered
                  </p>
                  <div
                    className="overflow-hidden rounded-2xl"
                    style={{ border: "1px solid #f1f5f9" }}
                  >
                    {invoiceOrder.items.map((item, i) => (
                      <div
                        key={`${item.name}-${i}`}
                        className="flex items-center justify-between px-3 py-2.5 text-sm"
                        style={{
                          background: i % 2 === 0 ? "#fff7ed" : "#fff",
                          borderBottom: i < invoiceOrder.items.length - 1 ? "1px solid #f1f5f9" : "none",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white flex-shrink-0"
                            style={{ background: "linear-gradient(135deg,#F97316,#F43F5E)" }}
                          >
                            {item.quantity}
                          </span>
                          <span className="font-medium text-foreground">{item.name}</span>
                        </div>
                        <span className="font-semibold text-orange-600">
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Amount summary */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: "1px solid #f1f5f9" }}
                >
                  {/* Subtotal */}
                  <div className="flex justify-between px-4 py-2.5 text-sm"
                    style={{ background: "#f8fafc" }}>
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      ₹{invoiceOrder.items
                        .reduce((s, i) => s + i.price * i.quantity, 0)
                        .toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* GST line — fetched from invoiceSettings query */}
                  <div className="flex justify-between px-4 py-2.5 text-sm"
                    style={{ background: "#fff" }}>
                    <span className="text-muted-foreground">
                      GST ({invoiceSettings?.taxPct ?? 5}%)
                      {invoiceSettings?.taxMode === "igst"
                        ? " — IGST"
                        : " — CGST + SGST"}
                    </span>
                    <span className="font-medium">
                      ₹{(
                        invoiceOrder.items.reduce((s, i) => s + i.price * i.quantity, 0) *
                        ((invoiceSettings?.taxPct ?? 5) / 100)
                      ).toFixed(2)}
                    </span>
                  </div>

                  {/* Total */}
                  <div
                    className="flex justify-between px-4 py-3 text-sm font-bold"
                    style={{ background: "#fff7ed", borderTop: "1.5px solid #fed7aa" }}
                  >
                    <span style={{ color: "#9a3412" }}>Total</span>
                    <span style={{ color: "#ea580c", fontSize: "16px" }}>
                      ₹{(
                        invoiceOrder.items.reduce((s, i) => s + i.price * i.quantity, 0) *
                        (1 + (invoiceSettings?.taxPct ?? 5) / 100)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* HSN + footer note info */}
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>HSN: <strong>{invoiceSettings?.hsnCode ?? "996331"}</strong></span>
                  <span>·</span>
                  <span>Paid ✅</span>
                  <span>·</span>
                  <span>Balance: ₹0</span>
                </div>
              </div>
            )}

            {/* ── Footer ── */}
            <div
              className="flex items-center justify-end gap-3 px-5 py-4"
              style={{ borderTop: "1px solid #f1f5f9" }}
            >
              <button
                type="button"
                onClick={() => setInvoiceOrder(null)}
                className="rounded-full px-5 py-2.5 text-sm font-semibold transition-all"
                style={{ border: "1.5px solid #e2e8f0", color: "#64748b" }}
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => invoiceOrder && downloadInvoice(invoiceOrder._id)}
                disabled={downloadingInvoice}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg,#F97316,#F43F5E)",
                  boxShadow: "0 4px 14px rgba(249,115,22,0.4)",
                }}
              >
                {downloadingInvoice ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {downloadingInvoice ? "Generating PDF..." : "Download PDF"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}