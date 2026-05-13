'use client';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useSocketEvent } from '@/hooks/useSocket';
import {
  Sparkles, User, Clock, CheckCircle, ChevronDown, ChevronUp,
  AlertTriangle, Pause, SkipForward, Play, Eye,
  RefreshCw, Users, Zap, BarChart3, BedDouble, Loader2,
  MessageSquare, X, Building2, CalendarDays, Plus, Pencil, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PreviousOpsTasks } from '@/components/ui/PreviousOpsTasks';

// ── Constants ──────────────────────────────────────────────────────────────────
const COLS = [
  { key: 'pending', label: 'Pending', dot: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb' },
  { key: 'in_progress', label: 'In Progress', dot: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'done', label: 'Done', dot: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { key: 'inspected', label: 'Inspected ✓', dot: '#10b981', bg: '#ecfdf5', border: '#6ee7b7' },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  urgent: { label: 'Urgent', color: '#991b1b', bg: '#fef2f2', dot: '#ef4444' },
  high: { label: 'High', color: '#92400e', bg: '#fffbeb', dot: '#f59e0b' },
  normal: { label: 'Normal', color: '#1e40af', bg: '#eff6ff', dot: '#3b82f6' },
  low: { label: 'Low', color: '#374151', bg: '#f3f4f6', dot: '#9ca3af' },
};

const TASK_LABELS: Record<string, string> = {
  checkout_clean: '🛏️ Checkout Clean',
  stayover_clean: '🧹 Stayover Clean',
  turndown: '🌙 Turndown',
  deep_clean: '✨ Deep Clean',
  inspection: '🔍 Inspection',
  maintenance: '🔧 Maintenance',
  guest_request: '💬 Guest Request',
  lost_found: '📦 Lost & Found',
};

const STATUS_ACTIONS: Record<string, { status: string; label: string; icon: any; color: string; bg: string; border: string }[]> = {
  pending: [
    { status: 'in_progress', label: 'Start', icon: Play, color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
    { status: 'skipped', label: 'Skip/DND', icon: SkipForward, color: '#374151', bg: '#f3f4f6', border: '#e5e7eb' },
  ],
  in_progress: [
    { status: 'done', label: 'Mark Done', icon: CheckCircle, color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
    { status: 'paused', label: 'Pause/DND', icon: Pause, color: '#7c2d12', bg: '#fff7ed', border: '#fed7aa' },
  ],
  done: [
    { status: 'inspected', label: 'Inspected ✓', icon: Eye, color: '#065f46', bg: '#ecfdf5', border: '#6ee7b7' },
  ],
};
const STATUS_META: Record<
  string,
  {
    bg: string;
    color: string;
  }
> = {
  pending: {
    bg: "#FEF3C7",
    color: "#92400E",
  },

  assigned: {
    bg: "#DBEAFE",
    color: "#1D4ED8",
  },

  in_progress: {
    bg: "#FED7AA",
    color: "#C2410C",
  },

  completed: {
    bg: "#DCFCE7",
    color: "#15803D",
  },

  inspected: {
    bg: "#E0E7FF",
    color: "#4338CA",
  },

  skipped: {
    bg: "#F3F4F6",
    color: "#4B5563",
  },

  cancelled: {
    bg: "#FEE2E2",
    color: "#B91C1C",
  },
};
function TaskCard({
  task,
  onSelect,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  task: any;
  onSelect: (t: any) => void;
  onStatusChange: (
    id: string,
    status: string
  ) => void;
  onEdit: (t: any) => void;
  onDelete: (t: any) => void;
}) {

  const [expanded, setExpanded] =
    useState(false);

  const p =
    PRIORITY_CONFIG[
      task.priority
    ] || PRIORITY_CONFIG.normal;

  const actions =
    STATUS_ACTIONS[
      task.status
    ] || [];

  return (
    <div
      className="
        bg-white
        rounded-2xl
        overflow-hidden
        transition-all
        duration-200
        hover:shadow-md
      "
      style={{
        border: `1.5px solid ${p.dot}33`,
        boxShadow:
          "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >

      {/* Priority bar */}
      <div
        className="h-1"
        style={{
          background: p.dot,
        }}
      />

      <div className="p-3">

        {/* Header */}
        <div className="flex items-start justify-between gap-2">

          <div className="min-w-0">

            {/* Room */}
            <div className="flex items-center gap-1.5">
              <span className="text-base">
                🏨
              </span>

              <h3 className="font-bold text-sm text-gray-900">
                Room {task.roomNumber}
              </h3>

              {task.roomId?.floor && (
                <span
                  className="
                    text-[10px]
                    font-semibold
                    px-1.5
                    py-0.5
                    rounded-full
                    bg-gray-100
                    text-gray-600
                  "
                >
                  Floor{" "}
                  {task.roomId.floor}
                </span>
              )}
            </div>

            {/* Task type */}
            <div className="mt-1 flex items-center gap-1.5">

              <span className="text-[11px] font-semibold text-gray-700">
                {
                  TASK_LABELS[
                    task.taskType
                  ]
                }
              </span>

              {task.roomId?.type && (
                <span
                  className="
                    text-[10px]
                    px-1.5
                    py-0.5
                    rounded-full
                    bg-blue-50
                    text-blue-600
                    font-semibold
                  "
                >
                  {
                    task.roomId.type
                  }
                </span>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1">

            {/* Priority */}
            <span
              className="
                text-[9px]
                font-bold
                px-1.5
                py-0.5
                rounded-full
                uppercase
              "
              style={{
                background: p.bg,
                color: p.color,
              }}
            >
              {p.label}
            </span>

            {/* Expand */}
            <button
              onClick={() =>
                setExpanded(
                  (v) => !v
                )
              }
              className="
                p-1
                rounded-lg
                text-gray-400
                hover:text-gray-600
                hover:bg-gray-50
              "
            >
              {expanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* Guest request */}
        {task.guestRequest && (
          <div
            className="
              mt-3
              rounded-xl
              border
              border-blue-100
              bg-blue-50
              p-2.5
            "
          >
            <div className="flex items-start gap-2">

              <MessageSquare
                className="
                  w-3.5
                  h-3.5
                  text-blue-500
                  mt-0.5
                  flex-shrink-0
                "
              />

              <p
                className="
                  text-[11px]
                  text-blue-700
                  leading-relaxed
                "
              >
                {
                  task.guestRequest
                }
              </p>
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="mt-3 flex flex-wrap items-center gap-2">

          {/* Time */}
          {task.estimatedMinutes && (
            <span
              className="
                flex
                items-center
                gap-1
                text-[10px]
                text-gray-500
                bg-gray-50
                px-2
                py-1
                rounded-full
              "
            >
              <Clock className="w-3 h-3" />

              ~
              {
                task.estimatedMinutes
              }
              m
            </span>
          )}

          {/* Status */}
          <span
            className="
              text-[10px]
              font-bold
              px-2
              py-1
              rounded-full
              capitalize
            "
            style={{
              background:
                STATUS_META[
                  task.status
                ]?.bg ||
                "#f3f4f6",

              color:
                STATUS_META[
                  task.status
                ]?.color ||
                "#374151",
            }}
          >
            {task.status.replace(
              "_",
              " "
            )}
          </span>

          {/* Room status */}
          {task.roomId?.status && (
            <span
              className="
                text-[10px]
                font-bold
                px-2
                py-1
                rounded-full
                bg-purple-50
                text-purple-700
              "
            >
              Room:
              {" "}
              {
                task.roomId.status
              }
            </span>
          )}
        </div>

        {/* Assigned staff */}
        <div className="mt-3">

          {task.assignedTo ? (
            <div className="flex items-center gap-2">

              <div
                className="
                  w-6
                  h-6
                  rounded-full
                  flex
                  items-center
                  justify-center
                  text-white
                  text-[10px]
                  font-bold
                "
                style={{
                  background:
                    "linear-gradient(135deg,#F97316,#F43F5E)",
                }}
              >
                {
                  task.assignedTo
                    ?.name?.[0]
                }
              </div>

              <span className="text-[11px] font-medium text-gray-600">
                {
                  task.assignedTo
                    ?.name
                }
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">

              <User className="w-3.5 h-3.5" />

              <span className="text-[11px] italic">
                Unassigned
              </span>
            </div>
          )}
        </div>

        {/* Quick actions */}
        {actions.length > 0 && (
          <div className="mt-3 flex gap-1.5">

            {actions.map(
              (action: any) => (
                <button
                  key={
                    action.status
                  }
                  onClick={(e) => {
                    e.stopPropagation();

                    onStatusChange(
                      task._id,
                      action.status
                    );
                  }}
                  className="
                    flex
                    items-center
                    justify-center
                    gap-1
                    flex-1
                    px-2
                    py-1.5
                    rounded-xl
                    text-[11px]
                    font-bold
                    border
                    transition-all
                    hover:brightness-95
                  "
                  style={{
                    background:
                      action.bg,
                    color:
                      action.color,
                    borderColor:
                      action.border,
                  }}
                >
                  <action.icon className="w-3 h-3" />

                  {
                    action.label
                  }
                </button>
              )
            )}
          </div>
        )}

        {/* Expanded details */}
        {expanded && (
          <div
            className="
              mt-3
              rounded-xl
              border
              p-3
              space-y-2
              bg-gray-50
            "
          >

            {/* Notes */}
            {task.notes && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">
                  Notes
                </p>

                <p className="text-[11px] text-gray-600 whitespace-pre-line">
                  {task.notes}
                </p>
              </div>
            )}

            {/* Issues */}
            {task.issues?.length >
              0 && (
              <div>

                <p className="text-[10px] font-bold uppercase tracking-wide text-red-400 mb-1">
                  Issues
                </p>

                <div className="space-y-1">
                  {task.issues.map(
                    (
                      issue: string,
                      idx: number
                    ) => (
                      <div
                        key={idx}
                        className="
                          flex
                          items-start
                          gap-1.5
                          text-[11px]
                          text-red-600
                        "
                      >
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />

                        {issue}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Created */}
            <div className="pt-1 border-t border-gray-200">

              <p className="text-[10px] text-gray-400">
                Created:
                {" "}
                {new Date(
                  task.createdAt
                ).toLocaleString()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">

              <button
                onClick={() =>
                  onSelect(task)
                }
                className="
                  flex-1
                  rounded-xl
                  bg-orange-500
                  px-3
                  py-2
                  text-[11px]
                  font-bold
                  text-white
                  hover:bg-orange-600
                "
              >
                View Details
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();

                  onEdit(task);
                }}
                className="
                  rounded-xl
                  border
                  border-orange-200
                  bg-orange-50
                  px-3
                  py-2
                  text-[11px]
                  font-bold
                  text-orange-600
                  hover:bg-orange-100
                "
              >
                Edit
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();

                  onDelete(task);
                }}
                className="
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  px-3
                  py-2
                  text-[11px]
                  font-bold
                  text-red-600
                  hover:bg-red-100
                "
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Task Detail Modal ──────────────────────────────────────────────────────────
function TaskModal({ task, onClose, onStatusChange, isPending }: {
  task: any; onClose: () => void;
  onStatusChange: (id: string, status: string, extras?: any) => void;
  isPending: boolean;
}) {
  const [notes, setNotes] = useState(task.notes || '');
  const [issues, setIssues] = useState('');
  const [actualMin, setActualMin] = useState('');
  const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.normal;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-5 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20"
            style={{ background: 'rgba(255,255,255,0.4)' }} />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-75 mb-1">
                {TASK_LABELS[task.taskType] || task.taskType}
              </p>
              <h2 className="text-2xl font-black">Room {task.roomNumber}</h2>
              {task.floor && <p className="text-xs opacity-75 mt-0.5">Floor {task.floor}</p>}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Priority', value: <span className="font-bold" style={{ color: p.color }}>{p.label}</span> },
              { label: 'Status', value: <span className="capitalize font-medium">{task.status?.replace('_', ' ')}</span> },
              { label: 'Assigned', value: task.assignedTo?.name || <span className="text-gray-400 italic">Unassigned</span> },
              { label: 'Est. Time', value: task.estimatedMinutes ? `${task.estimatedMinutes} min` : '—' },
              { label: 'Started', value: task.startedAt ? formatDate(new Date(task.startedAt), 'HH:mm') : '—' },
              { label: 'Completed', value: task.completedAt ? formatDate(new Date(task.completedAt), 'HH:mm') : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-3" style={{ background: '#f8fafc' }}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                <div className="text-sm text-gray-900">{value}</div>
              </div>
            ))}
          </div>

          {/* Guest request */}
          {task.guestRequest && (
            <div className="rounded-xl p-3 border" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-1">
                <MessageSquare className="w-3 h-3 inline mr-1" />Guest Request
              </p>
              <p className="text-sm text-blue-800 italic">"{task.guestRequest}"</p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add cleaning notes, special instructions..."
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          {/* Issues */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
              Issues Found <span className="text-gray-300 font-normal">(optional)</span>
            </label>
            <input
              value={issues}
              onChange={e => setIssues(e.target.value)}
              placeholder="e.g. AC not working, broken fixture..."
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Actual time */}
          {task.status === 'in_progress' && (
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Actual Time (min)</label>
              <input
                type="number"
                value={actualMin}
                onChange={e => setActualMin(e.target.value)}
                placeholder={`Estimated: ${task.estimatedMinutes} min`}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          )}

          {/* Status actions */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Update Status</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { status: 'in_progress', label: 'Start Cleaning', icon: Play, color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
                { status: 'done', label: 'Mark Done', icon: CheckCircle, color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
                { status: 'inspected', label: 'Inspected ✓', icon: Eye, color: '#065f46', bg: '#ecfdf5', border: '#6ee7b7' },
                { status: 'paused', label: 'Pause / DND', icon: Pause, color: '#7c2d12', bg: '#fff7ed', border: '#fed7aa' },
                { status: 'skipped', label: 'Skip', icon: SkipForward, color: '#374151', bg: '#f3f4f6', border: '#e5e7eb' },
              ].map(action => (
                <button
                  key={action.status}
                  disabled={task.status === action.status || isPending}
                  onClick={() => onStatusChange(task._id, action.status, {
                    notes, issues: issues ? [issues] : undefined,
                    actualMinutes: actualMin ? parseInt(actualMin) : undefined,
                  })}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-all hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={task.status === action.status
                    ? { background: action.bg, color: action.color, borderColor: action.border, outline: `2px solid ${action.color}`, outlineOffset: '2px' }
                    : { background: action.bg, color: action.color, borderColor: action.border }}
                >
                  {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <action.icon className="w-3 h-3" />}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Staff Board Tab ────────────────────────────────────────────────────────────
function StaffBoard({ data }: { data: any[] }) {
  if (!data?.length) return (
    <div className="text-center py-12 text-gray-400 text-sm">No housekeeping staff active today</div>
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((s: any) => {
        const pct = s.total > 0 ? Math.round(s.completed / s.total * 100) : 0;
        return (
          <div key={s.staff?._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50"
              style={{ background: '#fafafa' }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-base flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
                {s.staff?.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{s.staff?.name}</p>
                <p className="text-[11px] text-gray-400">{s.staff?.shift || 'Morning'} shift</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-black" style={{ color: pct === 100 ? '#10b981' : '#F97316' }}>{pct}%</p>
                <p className="text-[10px] text-gray-400">{s.completed}/{s.total}</p>
              </div>
            </div>
            <div className="px-4 py-3 space-y-2">
              {/* Progress bar */}
              <div className="h-2 rounded-full overflow-hidden bg-gray-100">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : 'linear-gradient(90deg,#F97316,#F43F5E)' }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>🕐 {s.pending} pending</span>
                <span>⚡ {s.inProgress} active</span>
                <span>✅ {s.completed} done</span>
              </div>
              {s.avgTime > 0 && (
                <p className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Avg {Math.round(s.avgTime)} min/room
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
function TaskFormModal({
  open,
  onClose,
  initial,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  initial?: any;
  onSubmit: (payload: any) => void;
  isPending: boolean;
}) {
  const isEdit = !!initial;

  const [form, setForm] = useState({
    roomNumber: '',
    floor: '',
    taskType: 'checkout_clean',
    priority: 'normal',
    status: 'pending',
    estimatedMinutes: '',
    guestRequest: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    assignedTo: '',
    linkedReservationId: '',
  });

  useState(() => form);

  useRef(false);
  const { data: staffList = [], isLoading: staffLoading } = useQuery({
    queryKey: ['staff-select'],
    queryFn: () => api.get('/api/staff').then((r) => r.data.data?.docs || r.data.data || []),
  });

  const housekeepingStaff = staffList.filter((s: any) =>
    ['housekeeping', 'manager'].includes(s.role) && s.isActive !== false
  );
  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get('/api/rooms').then((r) => r.data.data?.docs || r.data.data || []),
  });
  useEffect(() => {
    if (!open) return;

    setForm({
      roomNumber: initial?.roomNumber ? String(initial.roomNumber) : '',
      floor: initial?.floor ? String(initial.floor) : '',
      taskType: initial?.taskType || 'checkout_clean',
      priority: initial?.priority || 'normal',
      status: initial?.status || 'pending',
      estimatedMinutes: initial?.estimatedMinutes ? String(initial.estimatedMinutes) : '',
      guestRequest: initial?.guestRequest || '',
      notes: initial?.notes || '',
      date: initial?.date?.slice?.(0, 10) || new Date().toISOString().split('T')[0],
      assignedTo: initial?.assignedTo?._id || initial?.assignedTo?.id || initial?.assignedTo || '',
      linkedReservationId: initial?.linkedReservationId || '',
    });
  }, [open, initial]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 py-5 text-white"
          style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">
                Housekeeping
              </p>
              <h2 className="text-2xl font-black">
                {isEdit ? 'Edit Task' : 'Add Task'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: 'rgba(255,255,255,0.18)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              roomNumber: form.roomNumber.trim(),
              floor: form.floor ? Number(form.floor) : undefined,
              taskType: form.taskType,
              priority: form.priority,
              status: form.status,
              estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : undefined,
              guestRequest: form.guestRequest.trim() || undefined,
              notes: form.notes.trim() || undefined,
              date: form.date,
              assignedTo: form.assignedTo || undefined,
              linkedReservationId: form.linkedReservationId || undefined,
            });
          }}
          className="p-5 space-y-4 max-h-[75vh] overflow-y-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Room Number
              </label>
              <select
                value={form.roomNumber}
                onChange={(e) => setForm((p) => ({ ...p, roomNumber: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-white"
                disabled={roomsLoading}
              >
                <option value="">{roomsLoading ? 'Loading rooms...' : 'Select room'}</option>
                {rooms.map((room: any) => {
                  const roomId = room._id || room.id;
                  return (
                    <option key={roomId} value={roomId}>
                      Room {room.number} {room.floor ? `• Floor ${room.floor}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Floor
              </label>
              <input
                type="number"
                value={form.floor}
                onChange={(e) => setForm((p) => ({ ...p, floor: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="1"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Task Type
              </label>
              <select
                value={form.taskType}
                onChange={(e) => setForm((p) => ({ ...p, taskType: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {Object.entries(TASK_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {Object.keys(PRIORITY_CONFIG).map((key) => (
                  <option key={key} value={key}>
                    {PRIORITY_CONFIG[key].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="inspected">Inspected</option>
                <option value="paused">Paused</option>
                <option value="skipped">Skipped</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Estimated Minutes
              </label>
              <input
                type="number"
                value={form.estimatedMinutes}
                onChange={(e) => setForm((p) => ({ ...p, estimatedMinutes: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="25"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Assigned Staff
              </label>

              <select
                value={form.assignedTo}
                onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                disabled={staffLoading}
              >
                <option value="">
                  {staffLoading ? 'Loading staff...' : 'Unassigned'}
                </option>

                {housekeepingStaff.map((s: any) => {
                  const staffId = s.id || s._id;
                  return (
                    <option key={staffId} value={staffId}>
                      {s.name} {s.shift ? `• ${s.shift}` : ''} {s.employeeId ? `• ${s.employeeId}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              Guest Request
            </label>
            <input
              value={form.guestRequest}
              onChange={(e) => setForm((p) => ({ ...p, guestRequest: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Extra towel, urgent clean..."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              Notes
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              placeholder="Special instructions..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function DeleteTaskModal({
  task,
  onClose,
  onConfirm,
  isPending,
}: {
  task: any;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  if (!task) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 text-white" style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black">Delete Task</h3>
            <button onClick={onClose} className="rounded-xl p-2" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Delete housekeeping task for <span className="font-bold">Room {task.roomNumber}</span>?
          </p>
          <p className="text-xs text-gray-400">
            This action cannot be undone.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// ── Main Page ──────────────────────────────────────────────────────────────────
export default function HousekeepingPage() {
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [selected, setSelected] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [tab, setTab] = useState<'board' | 'staff'>('board');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterFloor, setFilterFloor] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deletingTask, setDeletingTask] = useState<any>(null);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['housekeeping', today],
    queryFn: () => api.get('/api/housekeeping', { params: { date: today } }).then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const { data: staffBoard } = useQuery({
    queryKey: ['housekeeping-staff'],
    queryFn: () => api.get('/api/housekeeping/staff-board').then(r => r.data.data),
    enabled: tab === 'staff',
    refetchInterval: 30_000,
  });

  useSocketEvent('housekeeping:updated', () => qc.invalidateQueries({ queryKey: ['housekeeping', today] }));
  useSocketEvent('housekeeping:new', () => qc.invalidateQueries({ queryKey: ['housekeeping', today] }));

  const updateStatus = useMutation({
    mutationFn: ({ id, status, extras }: { id: string; status: string; extras?: any }) =>
      api.patch(`/api/housekeeping/${id}/status`, { status, ...extras }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['housekeeping', today] });
      setSelected(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  async function loadAIPriorities() {
    setAiLoading(true);
    try {
      await api.get('/api/ai/housekeeping/priorities');
      toast.success('AI priorities updated!');
      qc.invalidateQueries({ queryKey: ['housekeeping', today] });
    } catch { toast.error('AI unavailable'); }
    finally { setAiLoading(false); }
  }

  async function autoAssign() {
    setAutoAssigning(true);
    try {
      const res = await api.post('/api/housekeeping/auto-assign');
      toast.success(res.data.message || 'Tasks auto-assigned');
      qc.invalidateQueries({ queryKey: ['housekeeping', today] });
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setAutoAssigning(false); }
  }
const createTask = useMutation({
  mutationFn: (payload: any) => {
    const finalPayload = {
      ...payload,
      roomId: payload.roomId || payload.roomNumber,
    };

    delete finalPayload.roomNumber;

    return api.post('/api/housekeeping', finalPayload);
  },
  onSuccess: () => {
    toast.success('Task created');
    qc.invalidateQueries({ queryKey: ['housekeeping', today] });
    setCreateOpen(false);
  },
  onError: (e: any) =>
    toast.error(e.response?.data?.message || 'Failed to create task'),
});

const editTask = useMutation({
  mutationFn: ({ id, payload }: { id: string; payload: any }) => {
    const finalPayload = {
      ...payload,
      roomId: payload.roomId || payload.roomNumber,
    };

    delete finalPayload.roomNumber;

    return api.put(`/api/housekeeping/${id}`, finalPayload);
  },
  onSuccess: () => {
    toast.success('Task updated');
    qc.invalidateQueries({ queryKey: ['housekeeping', today] });
    setEditingTask(null);
    setSelected(null);
  },
  onError: (e: any) =>
    toast.error(e.response?.data?.message || 'Failed to update task'),
});

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/housekeeping/${id}`),
    onSuccess: () => {
      toast.success('Task deleted');
      qc.invalidateQueries({ queryKey: ['housekeeping', today] });
      setDeletingTask(null);
      setSelected(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to delete task'),
  });
  const tasks = data?.docs || [];
  const summary = data?.summary || {};

  // Filter
  const filtered = tasks.filter((t: any) => {
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterFloor && String(t.floor) !== filterFloor) return false;
    return true;
  });

  const byStatus: Record<string, any[]> = {};
  COLS.forEach(c => { byStatus[c.key] = filtered.filter((t: any) => t.status === c.key); });
const { data: hkRes, isLoading: hkLoading } = useQuery({
  queryKey: ['housekeeping-history'],
  queryFn: () => api.get('/api/housekeeping/history').then((r) => r.data.data),
});

const { data: mtRes, isLoading: mtLoading } = useQuery({
  queryKey: ['maintenance-history'],
  queryFn: () => api.get('/api/housekeeping/maintenance/history').then((r) => r.data.data),
});


  return (
    <DashboardLayout title="Housekeeping">
      <div className="space-y-5 pb-16">

        {/* ── Hero Header ────────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl px-6 py-6 text-white sm:rounded-3xl sm:px-8 sm:py-7"
          style={{ background: 'linear-gradient(135deg,#F97316 0%,#F43F5E 100%)' }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-20"
            style={{ background: 'rgba(255,255,255,0.3)' }} />
          <div className="pointer-events-none absolute -bottom-8 left-24 h-32 w-32 rounded-full opacity-10"
            style={{ background: 'rgba(255,255,255,0.5)' }} />

          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <BedDouble className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Hotel Operations</span>
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl leading-tight">Housekeeping Board</h1>
              <p className="mt-1 text-sm opacity-80 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                {formatDate(new Date(), 'EEEE, dd MMM yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => refetch()}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={autoAssign} disabled={autoAssigning}
                className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                {autoAssigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                Auto-Assign
              </button>
              <button onClick={loadAIPriorities} disabled={aiLoading}
                className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                style={{ background: 'rgba(255,255,255,0.95)', color: '#F97316', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
                {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" /> : <Sparkles className="w-3.5 h-3.5 text-orange-500" />}
                AI Priorities
              </button>
              <button
                onClick={() => setCreateOpen(true)}
                className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all hover:opacity-90"
                style={{ background: 'rgba(255,255,255,0.95)', color: '#F97316', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Task
              </button>
            </div>
          </div>

          {/* Summary chips */}
          <div className="relative mt-5 flex flex-wrap gap-2">
            {[
              { label: 'Pending', value: summary.pending || 0, icon: '⏳' },
              { label: 'In Progress', value: summary.inProgress || 0, icon: '🧹' },
              { label: 'Done', value: summary.done || 0, icon: '✅' },
              { label: 'Inspected', value: summary.inspected || 0, icon: '🔍' },
              { label: 'Skipped', value: summary.skipped || 0, icon: '⏭️' },
            ].map(s => (
              <div key={s.label}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
                style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
                <span>{s.icon}</span>
                <span className="font-black">{s.value}</span>
                <span className="text-xs opacity-75">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {[
            { id: 'board', label: 'Task Board', icon: BarChart3 },
            { id: 'staff', label: 'Staff Board', icon: Users },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id as any)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={tab === id
                ? { background: '#fff', color: '#111', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                : { color: '#9ca3af' }}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Filters ────────────────────────────────────────────────────────── */}
        {tab === 'board' && (
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex gap-1.5">
              {['', 'urgent', 'high', 'normal', 'low'].map(p => {
                const cfg = PRIORITY_CONFIG[p];
                return (
                  <button key={p} onClick={() => setFilterPriority(p)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
                    style={filterPriority === p
                      ? { background: 'linear-gradient(135deg,#F97316,#F43F5E)', color: '#fff', borderColor: 'transparent' }
                      : { background: '#fff', borderColor: '#e5e7eb', color: '#6b7280' }}>
                    {p ? (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg?.dot }} />
                        {cfg?.label}
                      </span>
                    ) : 'All Priority'}
                  </button>
                );
              })}
            </div>
            <select
              value={filterFloor}
              onChange={e => setFilterFloor(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">All Floors</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(f => (
                <option key={f} value={f}>Floor {f}</option>
              ))}
            </select>
            {(filterPriority || filterFloor) && (
              <button
                onClick={() => { setFilterPriority(''); setFilterFloor(''); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-all">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        )}

        {/* ── Content ────────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}>
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
            <p className="text-sm text-gray-400">Loading housekeeping board...</p>
          </div>
        ) : tab === 'staff' ? (
          <StaffBoard data={staffBoard || []} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLS.map(col => (
              <div key={col.key}>
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.dot }} />
                  <h3 className="font-bold text-sm text-gray-800">{col.label}</h3>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full ml-auto"
                    style={{ background: col.bg, color: col.dot, border: `1px solid ${col.border}` }}
                  >
                    {byStatus[col.key]?.length || 0}
                  </span>
                </div>

                {/* Tasks */}
                <div
                  className="rounded-2xl p-2 space-y-2 min-h-[200px]"
                  style={{ background: col.bg, border: `1.5px solid ${col.border}` }}
                >
                  {byStatus[col.key]?.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <p className="text-xs text-gray-400">No tasks</p>
                    </div>
                  )}
                  {byStatus[col.key]?.map((task: any) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onSelect={setSelected}
                      onEdit={setEditingTask}
                      onDelete={setDeletingTask}
                      onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Task Detail Modal ───────────────────────────────────────────────── */}
      {selected && (
        <TaskModal
          task={selected}
          onClose={() => setSelected(null)}
          onStatusChange={(id, status, extras) => updateStatus.mutate({ id, status, extras })}
          isPending={updateStatus.isPending}
        />
      )}
      <TaskFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(payload) => createTask.mutate(payload)}
        isPending={createTask.isPending}
      />

      <TaskFormModal
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
        initial={editingTask}
        onSubmit={(payload) => editTask.mutate({ id: editingTask._id, payload })}
        isPending={editTask.isPending}
      />

      {deletingTask && (
        <DeleteTaskModal
          task={deletingTask}
          onClose={() => setDeletingTask(null)}
          onConfirm={() => deleteTaskMutation.mutate(deletingTask._id)}
          isPending={deleteTaskMutation.isPending}
        />
      )}
  <PreviousOpsTasks
  housekeepingTasks={hkRes?.docs ?? hkRes ?? []}
  maintenanceTasks={mtRes?.docs ?? mtRes ?? []}
  loading={hkLoading || mtLoading}
/>
    </DashboardLayout>
  );
}