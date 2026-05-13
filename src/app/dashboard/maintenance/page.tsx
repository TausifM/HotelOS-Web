'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Card,
  Button,
  Table,
  Th,
  Td,
  Tr,
  Badge,
  Modal,
  Input,
  Select,
  Textarea,
  PageLoader,
  EmptyState,
} from '@/components/ui';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  Plus,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Search,
  Filter,
  UserCog,
  CalendarClock,
  IndianRupee,
  MessageSquareText,
  Building2,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

const P_COLORS: Record<string, any> = {
  critical: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'default',
};

const S_COLORS: Record<string, any> = {
  open: 'danger',
  assigned: 'warning',
  in_progress: 'info',
  pending_parts: 'warning',
  resolved: 'success',
  closed: 'default',
};

const STATUS_OPTIONS = [
  'open',
  'assigned',
  'in_progress',
  'pending_parts',
  'resolved',
  'closed',
] as const;

const PRIORITY_OPTIONS = ['critical', 'high', 'medium', 'low'] as const;

const CATEGORY_OPTIONS = [
  'electrical',
  'plumbing',
  'ac',
  'furniture',
  'structural',
  'iT',
  'other',
] as const;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function toInputDateTime(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function niceText(value?: string) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string | number;
  hint: string;
  icon: any;
  tone: string;
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-3xl border p-5 shadow-sm', tone)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-80">{title}</p>
          <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
          <p className="mt-1 text-xs opacity-80">{hint}</p>
        </div>
        <div className="rounded-2xl bg-white/70 p-3 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: any;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-2xl bg-gradient-to-br from-orange-500 via-pink-500 to-fuchsia-500 p-2.5 text-white shadow-md">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h3 className="text-sm font-black text-slate-900">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
      </div>
    </div>
  );
}

type CreateForm = {
  area: string;
  roomId: string;
  reservationId: string;
  category: string;
  title: string;
  description: string;
  priority: string;
};

type EditForm = {
  status: string;
  assignedTo: string;
  priority: string;
  estimatedCost: string;
  actualCost: string;
  vendor: string;
  scheduledFor: string;
  notes: string;
};

export default function MaintenancePage() {
  const qc = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: '',
  });

  const [createForm, setCreateForm] = useState<CreateForm>({
    area: '',
    roomId: '',
    reservationId: '',
    category: 'plumbing',
    title: '',
    description: '',
    priority: 'medium',
  });

  const [editForm, setEditForm] = useState<EditForm>({
    status: 'open',
    assignedTo: '',
    priority: 'medium',
    estimatedCost: '',
    actualCost: '',
    vendor: '',
    scheduledFor: '',
    notes: '',
  });

  const createField =
    (k: keyof CreateForm) =>
      (e: any) =>
        setCreateForm((p) => ({ ...p, [k]: e.target.value }));

  const editField =
    (k: keyof EditForm) =>
      (e: any) =>
        setEditForm((p) => ({ ...p, [k]: e.target.value }));
  const { data: roomsRaw = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['maintenance-create-rooms'],
    enabled: showCreate,
    queryFn: async () => {
      const res = await api.get('/api/rooms', { params: { limit: 300 } });
      return res.data.data?.docs || res.data.data || [];
    },
  });

  const { data: reservationsRaw = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ['maintenance-create-reservations'],
    enabled: showCreate,
    queryFn: async () => {
      const res = await api.get('/api/reservations', {
        params: { limit: 200, status: 'checked_in' }, // adjust if needed
      });
      return res.data.data?.docs || res.data.data || [];
    },
  });

  const rooms = useMemo(
    () =>
      (roomsRaw || []).map((r: any) => ({
        id: r._id || r.id,
        roomNumber: r.roomNumber || r.number || r.name || 'Unknown Room',
        roomType: r.roomType || r.type || '',
        status: r.status || '',
        label: `${r.roomNumber || r.number || r.name || 'Room'}${r.roomType ? ` · ${r.roomType}` : ''}${r.status ? ` · ${r.status}` : ''}`,
      })),
    [roomsRaw]
  );

  const reservations = useMemo(
    () =>
      (reservationsRaw || []).map((r: any) => ({
        id: r._id || r.id,
        guestName: r.guestName || r.primaryGuestName || 'Guest',
        roomId:
          typeof r.roomId === 'object'
            ? r.roomId?._id || r.roomId?.id
            : r.roomId || '',
        roomNumber:
          typeof r.roomId === 'object'
            ? r.roomId?.roomNumber || r.roomId?.number || ''
            : r.roomNumber || '',
        checkIn: r.checkIn || r.checkInDate,
        checkOut: r.checkOut || r.checkOutDate,
        label: `${r.guestName || r.primaryGuestName || 'Guest'}${(typeof r.roomId === 'object' ? r.roomId?.roomNumber : r.roomNumber) ? ` · Room ${typeof r.roomId === 'object' ? r.roomId?.roomNumber : r.roomNumber}` : ''}`,
      })),
    [reservationsRaw]
  );
  const { data, isLoading } = useQuery({
    queryKey: ['maintenance', filters.status, filters.priority, filters.category],
    queryFn: async () => {
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.category) params.category = filters.category;
      const res = await api.get('/api/maintenance', { params });
      return res.data.data || [];
    },
  });

  const { data: staffOptions = [] } = useQuery({
    queryKey: ['maintenance-staff-assignable'],
    queryFn: async () => {
      const res = await api.get('/api/staff', {
        params: { isActive: true, limit: 200 },
      });
      return res.data.data?.docs || res.data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/api/maintenance', payload),
    onSuccess: () => {
      toast.success('Ticket created');
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      setShowCreate(false);
      setCreateForm({
        area: '',
        roomId: '',
        reservationId: '',
        category: 'plumbing',
        title: '',
        description: '',
        priority: 'medium',
      });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      api.patch(`/api/maintenance/${id}`, payload),
    onSuccess: () => {
      toast.success('Ticket updated');
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      setSelectedTicket(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  useEffect(() => {
    if (!selectedTicket) return;
    setEditForm({
      status: selectedTicket.status || 'open',
      assignedTo:
        typeof selectedTicket.assignedTo === 'object'
          ? selectedTicket.assignedTo?._id || ''
          : selectedTicket.assignedTo || '',
      priority: selectedTicket.priority || 'medium',
      estimatedCost:
        selectedTicket.estimatedCost !== undefined && selectedTicket.estimatedCost !== null
          ? String(selectedTicket.estimatedCost)
          : '',
      actualCost:
        selectedTicket.actualCost !== undefined && selectedTicket.actualCost !== null
          ? String(selectedTicket.actualCost)
          : '',
      vendor: selectedTicket.vendor || '',
      scheduledFor: toInputDateTime(selectedTicket.scheduledFor),
      notes: selectedTicket.notes || '',
    });
  }, [selectedTicket]);

  const searched = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    if (!term) return data || [];
    return (data || []).filter((t: any) => {
      const fields = [
        t.area,
        t.title,
        t.description,
        t.category,
        t.priority,
        t.status,
        t.vendor,
        t.reportedBy?.name,
        t.assignedTo?.name,
        t.reservationId?.guestName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return fields.includes(term);
    });
  }, [data, filters.search]);
  function handleRoomSelect(roomId: string) {
    const room = rooms.find((r: any) => r.id === roomId);

    setCreateForm((prev) => ({
      ...prev,
      roomId,
      area: room ? `Room ${room.roomNumber}` : prev.area,
    }));
  }

  function handleReservationSelect(reservationId: string) {
    const reservation = reservations.find((r: any) => r.id === reservationId);

    setCreateForm((prev) => ({
      ...prev,
      reservationId,
      roomId: reservation?.roomId || prev.roomId || '',
      area:
        reservation?.roomNumber
          ? `Room ${reservation.roomNumber}`
          : prev.area,
    }));
  }
  function resetCreateForm() {
    setCreateForm({
      area: '',
      roomId: '',
      reservationId: '',
      category: 'plumbing',
      title: '',
      description: '',
      priority: 'medium',
    });
  }

  function closeCreateModal() {
    resetCreateForm();
    setShowCreate(false);
  }
  const openTickets = searched.filter((t: any) => !['resolved', 'closed'].includes(t.status));
  const doneTickets = searched.filter((t: any) => ['resolved', 'closed'].includes(t.status));

  const stats = useMemo(() => {
    const all = data || [];
    return {
      total: all.length,
      open: all.filter((t: any) => !['resolved', 'closed'].includes(t.status)).length,
      critical: all.filter((t: any) => t.priority === 'critical' && !['resolved', 'closed'].includes(t.status)).length,
      scheduled: all.filter((t: any) => !!t.scheduledFor && !['resolved', 'closed'].includes(t.status)).length,
      resolved: all.filter((t: any) => ['resolved', 'closed'].includes(t.status)).length,
    };
  }, [data]);

  const criticalOpen = openTickets.filter((t: any) => t.priority === 'critical');
  const upcoming = openTickets.filter((t: any) => !!t.scheduledFor).slice(0, 5);

  function submitCreate(e: any) {
    e.preventDefault();
    createMutation.mutate({
      area: createForm.area,
      roomId: createForm.roomId || undefined,
      reservationId: createForm.reservationId || undefined,
      category: createForm.category,
      title: createForm.title,
      description: createForm.description,
      priority: createForm.priority,
    });
  }

  function submitUpdate(e: any) {
    e.preventDefault();
    if (!selectedTicket?._id) return;

    updateMutation.mutate({
      id: selectedTicket._id,
      payload: {
        status: editForm.status,
        assignedTo: editForm.assignedTo || undefined,
        priority: editForm.priority,
        estimatedCost: editForm.estimatedCost ? Number(editForm.estimatedCost) : undefined,
        actualCost: editForm.actualCost ? Number(editForm.actualCost) : undefined,
        vendor: editForm.vendor || undefined,
        scheduledFor: editForm.scheduledFor || undefined,
        notes: editForm.notes || undefined,
      },
    });
  }

  return (
    <DashboardLayout title="Maintenance">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[30px] border border-orange-200/60 bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500 text-white shadow-[0_25px_80px_-32px_rgba(236,72,153,0.55)]">
          <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-6 md:px-8">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Smart Maintenance Desk
              </div>
              <h1 className="text-2xl font-black tracking-tight md:text-3xl">Maintenance Management</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/85">
                Track repairs, assign technicians, link guest-raised requests, schedule work, and close tickets with full visibility.
              </p>
            </div>

            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setShowCreate(true)}
              className="rounded-2xl bg-white px-4 py-2.5 font-semibold text-slate-900 shadow-md hover:bg-orange-50"
            >
              New Ticket
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard
            title="Open"
            value={stats.open}
            hint="Active maintenance work"
            icon={Wrench}
            tone="border-orange-200 bg-gradient-to-br from-orange-50 to-white text-orange-700"
          />
          <StatCard
            title="Critical"
            value={stats.critical}
            hint="Immediate attention"
            icon={AlertTriangle}
            tone="border-rose-200 bg-gradient-to-br from-rose-50 to-white text-rose-700"
          />
          <StatCard
            title="Scheduled"
            value={stats.scheduled}
            hint="Work planned ahead"
            icon={CalendarClock}
            tone="border-violet-200 bg-gradient-to-br from-violet-50 to-white text-violet-700"
          />
          <StatCard
            title="Resolved"
            value={stats.resolved}
            hint="Closed or fixed"
            icon={CheckCircle2}
            tone="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white text-emerald-700"
          />
          <StatCard
            title="Total"
            value={stats.total}
            hint="All tickets"
            icon={Building2}
            tone="border-slate-200 bg-gradient-to-br from-slate-50 to-white text-slate-700"
          />
        </div>

        <Card className="overflow-hidden rounded-[28px] border border-orange-100 bg-white/95 shadow-[0_18px_50px_-26px_rgba(249,115,22,0.25)]">
          <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 via-pink-50 to-white px-5 py-4">
            <SectionTitle
              icon={Filter}
              title="Filters and Search"
              subtitle="Narrow the list by status, priority, category, or any visible ticket text."
            />
          </div>

          <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
            <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                placeholder="Search area, issue, guest, vendor, assignee..."
                value={filters.search}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              />
            </div>

            <Select
              label="Status"
              value={filters.status}
              onChange={(e: any) => setFilters((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {niceText(s)}
                </option>
              ))}
            </Select>

            <Select
              label="Priority"
              value={filters.priority}
              onChange={(e: any) => setFilters((p) => ({ ...p, priority: e.target.value }))}
            >
              <option value="">All Priorities</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {niceText(p)}
                </option>
              ))}
            </Select>

            <Select
              label="Category"
              value={filters.category}
              onChange={(e: any) => setFilters((p) => ({ ...p, category: e.target.value }))}
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {niceText(c)}
                </option>
              ))}
            </Select>

            <div className="flex items-end">
              <Button
                variant="outline"
                type="button"
                className="w-full rounded-2xl"
                onClick={() =>
                  setFilters({
                    status: '',
                    priority: '',
                    category: '',
                    search: '',
                  })
                }
              >
                Reset
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <Card className="overflow-hidden rounded-[28px] border border-orange-100 bg-white/95 shadow-[0_18px_50px_-26px_rgba(249,115,22,0.18)]">
            <div className="flex items-center justify-between border-b border-orange-100 bg-gradient-to-r from-orange-50 via-white to-pink-50 px-5 py-4">
              <SectionTitle
                icon={Wrench}
                title="Open Tickets"
                subtitle={`${openTickets.length} active issues`}
              />
            </div>

            {isLoading ? (
              <PageLoader />
            ) : !openTickets.length ? (
              <EmptyState
                title="No open tickets"
                description="Everything looks good right now. Create a ticket when a new issue is reported."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Th>Area</Th>
                      <Th>Issue</Th>
                      <Th>Priority</Th>
                      <Th>Status</Th>
                      <Th>Assignee</Th>
                      <Th>Schedule</Th>
                      <Th>Reported</Th>
                      <Th>Action</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {openTickets.map((t: any) => (
                      <Tr key={t._id}>
                        <Td>
                          <div className="min-w-[130px]">
                            <p className="text-sm font-bold text-slate-900">{t.area}</p>
                            {t.reservationId?.guestName ? (
                              <p className="mt-1 text-[11px] text-pink-600">
                                Guest: {t.reservationId.guestName}
                              </p>
                            ) : null}
                          </div>
                        </Td>

                        <Td>
                          <div className="min-w-[220px]">
                            <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                            <p className="mt-1 line-clamp-2 max-w-xs text-xs text-slate-500">
                              {t.description}
                            </p>
                            <div className="mt-2">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-600">
                                {t.category}
                              </span>
                            </div>
                          </div>
                        </Td>

                        <Td>
                          <Badge variant={P_COLORS[t.priority] || 'default'}>
                            {niceText(t.priority)}
                          </Badge>
                        </Td>

                        <Td>
                          <Badge variant={S_COLORS[t.status] || 'default'}>
                            {niceText(t.status)}
                          </Badge>
                        </Td>

                        <Td>
                          <div className="min-w-[120px] text-xs text-slate-600">
                            {t.assignedTo?.name || 'Unassigned'}
                          </div>
                        </Td>

                        <Td>
                          <div className="min-w-[110px] text-xs text-slate-500">
                            {t.scheduledFor ? formatDate(t.scheduledFor) : 'Not scheduled'}
                          </div>
                        </Td>

                        <Td>
                          <div className="min-w-[110px] text-xs text-slate-500">
                            <p>{formatDate(t.createdAt)}</p>
                            {t.reportedBy?.name ? <p className="mt-1 text-[11px]">by {t.reportedBy.name}</p> : null}
                          </div>
                        </Td>

                        <Td>
                          <div className="flex items-center gap-2">
                            <select
                              className="rounded-xl border border-orange-100 bg-white px-2.5 py-2 text-xs text-slate-700 outline-none"
                              value={t.status}
                              onChange={(e) =>
                                updateMutation.mutate({
                                  id: t._id,
                                  payload: { status: e.target.value },
                                })
                              }
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {niceText(s)}
                                </option>
                              ))}
                            </select>

                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => setSelectedTicket(t)}
                            >
                              Manage
                            </Button>
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <Card className="overflow-hidden rounded-[28px] border border-rose-100 bg-white/95 shadow-[0_18px_50px_-26px_rgba(236,72,153,0.18)]">
              <div className="border-b border-rose-100 bg-gradient-to-r from-rose-50 via-pink-50 to-white px-5 py-4">
                <SectionTitle
                  icon={AlertTriangle}
                  title="Critical Queue"
                  subtitle="High-priority issues that may need immediate action"
                />
              </div>

              <div className="space-y-3 p-5">
                {!criticalOpen.length ? (
                  <p className="text-sm text-slate-500">No critical open tickets.</p>
                ) : (
                  criticalOpen.slice(0, 5).map((t: any) => (
                    <button
                      key={t._id}
                      type="button"
                      onClick={() => setSelectedTicket(t)}
                      className="w-full rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 to-white p-4 text-left transition hover:border-rose-200 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{t.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{t.area}</p>
                        </div>
                        <Badge variant="danger">Critical</Badge>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>

            <Card className="overflow-hidden rounded-[28px] border border-violet-100 bg-white/95 shadow-[0_18px_50px_-26px_rgba(139,92,246,0.18)]">
              <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-white px-5 py-4">
                <SectionTitle
                  icon={CalendarClock}
                  title="Upcoming Scheduled Work"
                  subtitle="Tickets with planned repair time"
                />
              </div>

              <div className="space-y-3 p-5">
                {!upcoming.length ? (
                  <p className="text-sm text-slate-500">No scheduled maintenance right now.</p>
                ) : (
                  upcoming.map((t: any) => (
                    <button
                      key={t._id}
                      type="button"
                      onClick={() => setSelectedTicket(t)}
                      className="w-full rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-white p-4 text-left transition hover:border-violet-200 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{t.title}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {t.area} · {formatDate(t.scheduledFor)}
                          </p>
                        </div>
                        <Clock3 className="mt-0.5 h-4 w-4 text-violet-500" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>

        <Card className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white/95 shadow-[0_18px_50px_-26px_rgba(16,185,129,0.16)]">
          <div className="flex items-center justify-between border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-green-50 px-5 py-4">
            <SectionTitle
              icon={CheckCircle2}
              title="Resolved and Closed"
              subtitle={`${doneTickets.length} completed tickets`}
            />
          </div>

          {!doneTickets.length ? (
            <EmptyState
              title="No resolved tickets yet"
              description="Completed maintenance tickets will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <Th>Area</Th>
                    <Th>Title</Th>
                    <Th>Category</Th>
                    <Th>Status</Th>
                    <Th>Actual Cost</Th>
                    <Th>Resolved</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {doneTickets.slice(0, 12).map((t: any) => (
                    <Tr key={t._id}>
                      <Td className="text-sm font-medium">{t.area}</Td>
                      <Td className="text-sm text-slate-800">{t.title}</Td>
                      <Td>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-600">
                          {t.category}
                        </span>
                      </Td>
                      <Td>
                        <Badge variant={S_COLORS[t.status] || 'default'}>
                          {niceText(t.status)}
                        </Badge>
                      </Td>
                      <Td className="text-sm text-slate-700">
                        {t.actualCost ? `₹${Number(t.actualCost).toLocaleString('en-IN')}` : '—'}
                      </Td>
                      <Td className="text-xs text-slate-500">
                        {t.resolvedAt ? formatDate(t.resolvedAt) : '—'}
                      </Td>
                      <Td>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => setSelectedTicket(t)}
                        >
                          View
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Maintenance Ticket">
        <form className="space-y-5" onSubmit={submitCreate}>
          <div className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-pink-50 p-4">
            <p className="text-sm font-semibold text-slate-800">
              Capture area, category, priority, linked room or guest reservation, and a clear issue summary.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Selecting a reservation auto-fills reservation ID and room details.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label="Select Room"
              value={createForm.roomId}
              onChange={(e: any) => handleRoomSelect(e.target.value)}
              disabled={roomsLoading}
            >
              <option value="">
                {roomsLoading ? 'Loading rooms...' : 'Choose a room (optional)'}
              </option>
              {rooms.map((room: any) => (
                <option key={room.id} value={room.id}>
                  {room.label}
                </option>
              ))}
            </Select>

            <Select
              label="Guest Reservation"
              value={createForm.reservationId}
              onChange={(e: any) => handleReservationSelect(e.target.value)}
              disabled={reservationsLoading}
            >
              <option value="">
                {reservationsLoading ? 'Loading reservations...' : 'Choose reservation (optional)'}
              </option>
              {reservations.map((reservation: any) => (
                <option key={reservation.id} value={reservation.id}>
                  {reservation.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Area / Room"
              placeholder="Room 201, Pool pump room, Kitchen prep zone"
              value={createForm.area}
              onChange={createField('area')}
              required
            />

            <Input
              label="Reservation ID"
              value={createForm.reservationId}
              onChange={createField('reservationId')}
              placeholder="Auto-filled when reservation is selected"
            />
          </div>

          <Input
            label="Room ID"
            value={createForm.roomId}
            onChange={createField('roomId')}
            placeholder="Auto-filled when room/reservation is selected"
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select label="Category" value={createForm.category} onChange={createField('category')}>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {niceText(c)}
                </option>
              ))}
            </Select>

            <Select label="Priority" value={createForm.priority} onChange={createField('priority')}>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {niceText(p)}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Title"
            placeholder="AC not cooling in Room 201"
            value={createForm.title}
            onChange={createField('title')}
            required
          />

          <Textarea
            label="Description"
            rows={4}
            placeholder="Detailed issue description, symptoms, urgency, guest impact, or any temporary workaround."
            value={createForm.description}
            onChange={createField('description')}
            required
          />

          {(createForm.roomId || createForm.reservationId) && (
            <div className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50 px-4 py-3 text-xs text-fuchsia-700">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>
                  <span className="font-semibold text-fuchsia-800">Linked Room ID:</span>{' '}
                  {createForm.roomId || '—'}
                </div>
                <div>
                  <span className="font-semibold text-fuchsia-800">Linked Reservation ID:</span>{' '}
                  {createForm.reservationId || '—'}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={closeCreateModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending}
              className="bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500 text-white"
            >
              Create Ticket
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket ? `Manage Ticket · ${selectedTicket.title}` : 'Manage Ticket'}
      >
        {selectedTicket ? (
          <form className="space-y-5" onSubmit={submitUpdate}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Location</p>
                <p className="mt-2 text-sm font-bold text-slate-900">{selectedTicket.area}</p>
                <p className="mt-1 text-xs text-slate-500">{selectedTicket.category}</p>
              </div>

              <div className="rounded-2xl border border-pink-100 bg-gradient-to-r from-pink-50 to-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Guest / Reported By</p>
                <p className="mt-2 text-sm font-bold text-slate-900">
                  {selectedTicket.reservationId?.guestName || 'No linked guest'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Reported by {selectedTicket.reportedBy?.name || 'Unknown'}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">{selectedTicket.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{selectedTicket.description}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Select label="Status" value={editForm.status} onChange={editField('status')}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {niceText(s)}
                  </option>
                ))}
              </Select>

              <Select label="Priority" value={editForm.priority} onChange={editField('priority')}>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {niceText(p)}
                  </option>
                ))}
              </Select>

              <Select label="Assign To" value={editForm.assignedTo} onChange={editField('assignedTo')}>
                <option value="">Unassigned</option>
                {staffOptions.map((s: any) => (
                  <option key={s._id || s.id} value={s._id || s.id}>
                    {s.name} {s.role ? `· ${niceText(s.role)}` : ''}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label="Vendor"
                placeholder="Vendor or technician name"
                value={editForm.vendor}
                onChange={editField('vendor')}
              />
              <Input
                label="Estimated Cost"
                type="number"
                placeholder="0"
                value={editForm.estimatedCost}
                onChange={editField('estimatedCost')}
              />
              <Input
                label="Actual Cost"
                type="number"
                placeholder="0"
                value={editForm.actualCost}
                onChange={editField('actualCost')}
              />
            </div>

            <Input
              label="Scheduled For"
              type="datetime-local"
              value={editForm.scheduledFor}
              onChange={editField('scheduledFor')}
            />

            <Textarea
              label="Internal Notes"
              rows={4}
              placeholder="Repair notes, parts needed, vendor comments, follow-up remarks..."
              value={editForm.notes}
              onChange={editField('notes')}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-amber-700">
                  <IndianRupee className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-wide">Estimated</p>
                </div>
                <p className="mt-2 text-sm font-black text-slate-900">
                  {editForm.estimatedCost ? `₹${Number(editForm.estimatedCost).toLocaleString('en-IN')}` : '—'}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-wide">Actual</p>
                </div>
                <p className="mt-2 text-sm font-black text-slate-900">
                  {editForm.actualCost ? `₹${Number(editForm.actualCost).toLocaleString('en-IN')}` : '—'}
                </p>
              </div>

              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <div className="flex items-center gap-2 text-violet-700">
                  <MessageSquareText className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-wide">Assignee</p>
                </div>
                <p className="mt-2 text-sm font-black text-slate-900">
                  {staffOptions.find((s: any) => (s._id || s.id) === editForm.assignedTo)?.name || 'Unassigned'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setSelectedTicket(null)}>
                Close
              </Button>
              <Button
                type="submit"
                loading={updateMutation.isPending}
                className="bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500 text-white"
              >
                Save Changes
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </DashboardLayout>
  );
}