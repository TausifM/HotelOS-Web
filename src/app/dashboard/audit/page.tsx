'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Spinner } from '@/components/ui';
import api from '@/lib/api';
import { formatDateTime, cn } from '@/lib/utils';
import { Shield, Search, Filter, ChevronDown, ChevronUp, X, Calendar } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  CREATE:  'bg-green-100 text-green-700',
  UPDATE:  'bg-blue-100 text-blue-700',
  DELETE:  'bg-red-100 text-red-700',
  LOGIN:   'bg-purple-100 text-purple-700',
  LOGOUT:  'bg-gray-100 text-gray-600',
  CHECKIN: 'bg-teal-100 text-teal-700',
  CHECKOUT:'bg-orange-100 text-orange-700',
  PAYMENT: 'bg-amber-100 text-amber-700',
};

const ENTITY_LABELS: Record<string, string> = {
  reservation: 'Reservation', guest: 'Guest', room: 'Room',
  folio: 'Folio', payment: 'Payment', staff: 'Staff', rate: 'Rate',
};

export default function AuditLogPage() {
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [entity,     setEntity]     = useState('');
  const [action,     setAction]     = useState('');
  const [startDate,  setStartDate]  = useState('');
  const [endDate,    setEndDate]    = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const LIMIT = 30;

  const { data, isLoading } = useQuery({
    queryKey: ['audit', page, entity, action, startDate, endDate],
    queryFn:  () => api.get('/api/audit', {
      params: { page, limit: LIMIT, entity: entity || undefined, action: action || undefined, startDate: startDate || undefined, endDate: endDate || undefined }
    }).then(r => r.data.data),
    refetchInterval: 60_000,
  });

  const logs  = data?.docs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  const filtered = search
    ? logs.filter((l: any) =>
        l.staffName?.toLowerCase().includes(search.toLowerCase()) ||
        l.action?.toLowerCase().includes(search.toLowerCase()) ||
        l.entity?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  return (
    <DashboardLayout title="Audit Log">
      <div className="space-y-5 max-w-6xl">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Audit Log</h1>
            <p className="text-sm text-gray-400 mt-0.5">Complete activity trail · {total.toLocaleString()} records</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm flex-1 min-w-48">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input type="text" placeholder="Search staff, action, entity..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="text-sm flex-1 focus:outline-none bg-transparent" />
          </div>
          <select value={entity} onChange={e => { setEntity(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white shadow-sm focus:outline-none">
            <option value="">All Entities</option>
            {Object.entries(ENTITY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white shadow-sm focus:outline-none">
            <option value="">All Actions</option>
            {['CREATE','UPDATE','DELETE','LOGIN','CHECKIN','CHECKOUT','PAYMENT'].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="text-sm focus:outline-none bg-transparent w-32" />
            <span className="text-gray-300 text-xs">–</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="text-sm focus:outline-none bg-transparent w-32" />
          </div>
          {(entity || action || startDate || endDate) && (
            <button onClick={() => { setEntity(''); setAction(''); setStartDate(''); setEndDate(''); setPage(1); }}
              className="flex items-center gap-1 text-xs text-red-500 font-medium px-2">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Log table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          : !filtered.length ? (
            <div className="text-center py-14">
              <Shield className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="font-medium text-gray-500">No audit records found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((log: any, i: number) => {
                const expanded  = expandedId === log._id;
                const actionCls = ACTION_COLORS[log.action?.toUpperCase()] || 'bg-gray-100 text-gray-600';
                const hasChanges = log.before || log.after;

                return (
                  <motion.div key={log._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.01, 0.2) }}>
                    <button className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                      onClick={() => hasChanges && setExpandedId(expanded ? null : log._id)}>

                      {/* Staff avatar */}
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {log.staffName?.[0] || '?'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm">{log.staffName || 'System'}</span>
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', actionCls)}>
                            {log.action}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            {ENTITY_LABELS[log.entity] || log.entity}
                            {log.entityRef && <span className="font-mono text-gray-400 ml-1">#{log.entityRef}</span>}
                          </span>
                        </div>
                        {log.description && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{log.description}</p>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400">{formatDateTime(log.createdAt)}</p>
                        {log.ip && <p className="text-[10px] text-gray-300 font-mono">{log.ip}</p>}
                      </div>

                      {hasChanges && (
                        <div className="flex-shrink-0">
                          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      )}
                    </button>

                    {/* Changes diff */}
                    {expanded && hasChanges && (
                      <div className="px-5 pb-4 pt-1">
                        <div className="grid grid-cols-2 gap-3">
                          {log.before && (
                            <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                              <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-2">Before</p>
                              <pre className="text-xs text-red-800 overflow-auto max-h-32 whitespace-pre-wrap">
                                {JSON.stringify(log.before, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.after && (
                            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                              <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide mb-2">After</p>
                              <pre className="text-xs text-green-800 overflow-auto max-h-32 whitespace-pre-wrap">
                                {JSON.stringify(log.after, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50">
                ← Prev
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
