'use client';

import { useMemo, useState } from 'react';
import {
  History,
  Wrench,
  Mic,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Filter,
  Brush,
} from 'lucide-react';

type OpsTask = {
  _id: string;
  type: 'housekeeping' | 'maintenance';
  roomNumber?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  source?: 'voice' | 'manual' | 'auto';
  createdAt?: string;
  updatedAt?: string;
  assignedToName?: string;
};

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

function getTypeIcon(type: OpsTask['type']) {
  return type === 'housekeeping' ? Brush : Wrench;
}

function getPriorityClass(priority?: string) {
  switch (priority) {
    case 'urgent':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    case 'high':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'normal':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600';
  }
}

function getStatusClass(status?: string) {
  switch (status) {
    case 'done':
    case 'completed':
    case 'resolved':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'in_progress':
      return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'pending':
      return 'text-slate-700 bg-slate-50 border-slate-200';
    case 'skipped':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    default:
      return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

function getSourceIcon(source?: string) {
  if (source === 'voice') return Mic;
  return ClipboardList;
}

function formatTaskTime(date?: string) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface PreviousOpsTasksProps {
  housekeepingTasks?: any[];
  maintenanceTasks?: any[];
  loading?: boolean;
}

export function PreviousOpsTasks({
  housekeepingTasks = [],
  maintenanceTasks = [],
  loading = false,
}: PreviousOpsTasksProps) {
  const [typeFilter, setTypeFilter] = useState<'all' | 'housekeeping' | 'maintenance'>('all');

  const tasks: OpsTask[] = useMemo(() => {
  const hkSource = Array.isArray(housekeepingTasks)
    ? housekeepingTasks
    : Array.isArray((housekeepingTasks as any)?.docs)
    ? (housekeepingTasks as any).docs
    : Array.isArray((housekeepingTasks as any)?.data)
    ? (housekeepingTasks as any).data
    : [];

  const mtSource = Array.isArray(maintenanceTasks)
    ? maintenanceTasks
    : Array.isArray((maintenanceTasks as any)?.docs)
    ? (maintenanceTasks as any).docs
    : Array.isArray((maintenanceTasks as any)?.data)
    ? (maintenanceTasks as any).data
    : [];

  const hk: OpsTask[] = hkSource.map((task: any) => ({
    _id: String(task._id),
    type: 'housekeeping',
    roomNumber: task.roomNumber,
    title: task.guestRequest || task.taskType || 'Housekeeping task',
    description: task.notes || task.guestRequest || '',
    status: task.status || 'pending',
    priority: task.priority || 'normal',
    source: task.source || 'manual',
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    assignedToName: task.assignedTo?.name || task.assignedToName,
  }));

  const mt: OpsTask[] = mtSource.map((task: any) => ({
    _id: String(task._id),
    type: 'maintenance',
    roomNumber: task.roomNumber,
    title: task.title || 'Maintenance task',
    description: task.description || '',
    status: task.status || 'pending',
    priority: task.priority || 'normal',
    source: task.source || 'manual',
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    assignedToName: task.assignedTo?.name || task.assignedToName,
  }));

  return [...hk, ...mt].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}, [housekeepingTasks, maintenanceTasks]);
  const filteredTasks = useMemo(() => {
    if (typeFilter === 'all') return tasks;
    return tasks.filter((task) => task.type === typeFilter);
  }, [tasks, typeFilter]);

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      housekeeping: tasks.filter((t) => t.type === 'housekeeping').length,
      maintenance: tasks.filter((t) => t.type === 'maintenance').length,
      completed: tasks.filter((t) =>
        ['done', 'completed', 'resolved'].includes(String(t.status))
      ).length,
    };
  }, [tasks]);

  return (
    <section className="mt-8 rounded-[32px] border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur md:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
            <History className="h-3.5 w-3.5" />
            Operations History
          </div>
          <h3 className="mt-3 text-2xl font-black text-slate-900">
            Previous Housekeeping & Maintenance Tasks
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Unified history of operational work created manually, by voice, or by automation.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Total</p>
            <p className="mt-1 text-xl font-black text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Completed</p>
            <p className="mt-1 text-xl font-black text-slate-900">{stats.completed}</p>
          </div>
          <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Housekeeping</p>
            <p className="mt-1 text-xl font-black text-slate-900">{stats.housekeeping}</p>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Maintenance</p>
            <p className="mt-1 text-xl font-black text-slate-900">{stats.maintenance}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
          <Filter className="h-3.5 w-3.5" />
          Filter
        </div>

        {(['all', 'housekeeping', 'maintenance'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTypeFilter(value)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-bold transition',
              typeFilter === value
                ? 'border-orange-200 bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            )}
          >
            {value === 'all'
              ? 'All Tasks'
              : value === 'housekeeping'
              ? 'Housekeeping'
              : 'Maintenance'}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm font-medium text-slate-500">
            Loading previous tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <Clock3 className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-3 text-sm font-bold text-slate-800">No previous tasks found</p>
            <p className="mt-1 text-xs text-slate-500">
              Completed and past operational tasks will appear here.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const TypeIcon = getTypeIcon(task.type);
            const SourceIcon = getSourceIcon(task.source);

            return (
              <div
                key={task._id}
                className="rounded-[24px] border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-4 shadow-sm transition hover:border-slate-300"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
                        <TypeIcon className="h-4 w-4" />
                      </div>

                      <p className="text-base font-black text-slate-900">{task.title}</p>

                      {task.roomNumber ? (
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                          Room {task.roomNumber}
                        </span>
                      ) : null}

                      <span
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
                          getPriorityClass(task.priority)
                        )}
                      >
                        {task.priority || 'normal'}
                      </span>

                      <span
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
                          getStatusClass(task.status)
                        )}
                      >
                        {task.status || 'pending'}
                      </span>
                    </div>

                    {task.description ? (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                        {task.description}
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <SourceIcon className="h-3.5 w-3.5" />
                        {task.source || 'manual'}
                      </span>

                      <span>Created {formatTaskTime(task.createdAt)}</span>

                      {task.assignedToName ? <span>Assigned to {task.assignedToName}</span> : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {['done', 'completed', 'resolved'].includes(String(task.status)) ? (
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Closed
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Open
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}