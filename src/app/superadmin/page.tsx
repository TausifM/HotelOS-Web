'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardContent, Button, Badge, Input, Table, Th, Td, Tr, PageLoader, StatCard } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Hotel, Users, TrendingUp, DollarSign, AlertTriangle, Zap, Search, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_BADGE: Record<string, any> = { trial: 'warning', active: 'success', past_due: 'danger', cancelled: 'default', suspended: 'danger' };

export default function SuperAdminPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['sa-stats'],
    queryFn: () => api.get('/api/superadmin/stats').then((r) => r.data.data),
    refetchInterval: 60_000,
  });

  const { data: hotelsData, isLoading } = useQuery({
    queryKey: ['sa-hotels', search, statusFilter],
    queryFn: () => api.get('/api/superadmin/hotels', { params: { search, status: statusFilter || undefined, limit: 50 } }).then((r) => r.data.data),
    placeholderData: (p) => p,
  });

  const { data: chart } = useQuery({
    queryKey: ['sa-chart'],
    queryFn: () => api.get('/api/superadmin/revenue-chart').then((r) => r.data.data),
  });

  const sendReminders = useMutation({
    mutationFn: () => api.post('/api/superadmin/send-trial-reminders'),
    onSuccess: (d) => toast.success(d.data.message),
    onError: () => toast.error('Failed'),
  });

  const impersonate = useMutation({
    mutationFn: (hotelId: string) => api.post(`/api/superadmin/impersonate/${hotelId}`),
    onSuccess: (d) => { const { accessToken, hotelName } = d.data.data; toast.success(`Impersonating ${hotelName}`); window.open(`${window.location.origin}/dashboard?token=${accessToken}`, '_blank'); },
  });

  const toggleSub = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/api/superadmin/hotels/${id}/subscription`, { status }),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['sa-hotels'] }); },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
          <div><p className="font-bold text-gray-900">HotelOS Admin Console</p><p className="text-xs text-gray-400">Platform Management</p></div>
        </div>
        <button onClick={() => { useAuthStore.getState().logout(); window.location.href = '/auth/login'; }} className="text-gray-400 hover:text-gray-700"><LogOut className="w-5 h-5" /></button>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Hotels"  value={stats?.totalHotels || 0}            icon={<Hotel className="w-5 h-5" />}      color="bg-blue-50   text-blue-700" />
          <StatCard label="Active Trials" value={stats?.activeTrials || 0}           icon={<Users className="w-5 h-5" />}      color="bg-amber-50  text-amber-700" />
          <StatCard label="Subscribed"    value={stats?.activeSubscriptions || 0}    icon={<TrendingUp className="w-5 h-5" />} color="bg-green-50  text-green-700" />
          <StatCard label="MRR"           value={formatCurrency(stats?.mrr || 0)}    icon={<DollarSign className="w-5 h-5" />} color="bg-purple-50 text-purple-700" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader><h3 className="font-semibold text-gray-900">Monthly Revenue</h3></CardHeader>
            <CardContent>
              {chart?.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="_id.month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="revenue" fill="#1D4ED8" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-44 flex items-center justify-center text-sm text-gray-400">No revenue data yet</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h3 className="font-semibold text-gray-900">Alerts</h3></CardHeader>
            <CardContent className="space-y-3">
              {stats?.trialExpiringSoon > 0 && (
                <div className="flex items-start gap-3 bg-amber-50 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">{stats.trialExpiringSoon} trials expiring soon</p>
                    <Button size="sm" variant="secondary" className="mt-2" onClick={() => sendReminders.mutate()} loading={sendReminders.isPending}>Send Reminders</Button>
                  </div>
                </div>
              )}
              {stats?.pastDue > 0 && (
                <div className="flex items-start gap-3 bg-red-50 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-900">{stats.pastDue} hotels with payment issues</p>
                </div>
              )}
              {stats?.newThisMonth > 0 && (
                <div className="flex items-start gap-3 bg-green-50 rounded-lg p-3">
                  <Zap className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium text-green-900">{stats.newThisMonth} new hotels this month</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">All Hotels</h3>
            <div className="flex gap-2">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none">
                <option value="">All Status</option>
                {['trial','active','past_due','cancelled','suspended'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <Input placeholder="Search hotels..." value={search} onChange={(e) => setSearch(e.target.value)} prefix={<Search className="w-4 h-4" />} className="w-56" />
            </div>
          </CardHeader>
          {isLoading ? <PageLoader /> : (
            <Table>
              <thead><tr><Th>Hotel</Th><Th>City</Th><Th>Rooms</Th><Th>Subscription</Th><Th>Joined</Th><Th>Actions</Th></tr></thead>
              <tbody>
                {hotelsData?.hotels?.map((h: any) => (
                  <Tr key={h._id}>
                    <Td>
                      <p className="font-medium text-gray-900 text-sm">{h.hotelName}</p>
                      <p className="text-xs text-gray-400">{h.email}</p>
                    </Td>
                    <Td className="text-sm">{h.address?.city}, {h.address?.state}</Td>
                    <Td className="text-sm">{h.totalRooms}</Td>
                    <Td>
                      <Badge variant={STATUS_BADGE[h.subscription?.status] || 'default'}>
                        {h.subscription?.status}
                        {h.subscription?.status === 'trial' && ` · ${Math.max(0, Math.ceil((new Date(h.subscription.trialEndsAt).getTime() - Date.now()) / 86400000))}d`}
                      </Badge>
                    </Td>
                    <Td className="text-xs text-gray-500">{formatDate(h.createdAt)}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <button onClick={() => impersonate.mutate(h._id)} className="text-xs text-brand-600 hover:underline font-medium">Login</button>
                        {h.subscription?.status === 'trial'  && <button onClick={() => toggleSub.mutate({ id: h._id, status: 'active'    })} className="text-xs text-green-600 hover:underline font-medium">Activate</button>}
                        {h.subscription?.status === 'active' && <button onClick={() => toggleSub.mutate({ id: h._id, status: 'suspended' })} className="text-xs text-red-600   hover:underline font-medium">Suspend</button>}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
