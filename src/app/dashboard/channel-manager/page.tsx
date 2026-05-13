'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Badge, Modal, Input, Spinner } from '@/components/ui';
import api from '@/lib/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import {
    Globe, RefreshCw, CheckCircle, XCircle, AlertTriangle,
    Link2, Link2Off, TrendingUp, Calendar, Zap, Settings,
    ArrowUpDown, Eye, EyeOff, Plus, Minus, BarChart3,
    Clock, ChevronRight, Radio, Wifi, WifiOff,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── OTA Channel configs ───────────────────────────────────────────────────────
const OTA_CHANNELS = [
    {
        id: 'makemytrip',
        name: 'MakeMyTrip',
        logo: '🟠',
        color: 'text-orange-600 bg-orange-50 border-orange-200',
        active: 'bg-orange-600',
        desc: "India's #1 OTA · 15% commission",
        commission: 15,
        apiDocs: 'https://partners.makemytrip.com',
    },
    {
        id: 'goibibo',
        name: 'Goibibo',
        logo: '🔵',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        active: 'bg-blue-600',
        desc: 'Part of MakeMyTrip Group · 15% commission',
        commission: 15,
        apiDocs: 'https://partners.goibibo.com',
    },
    {
        id: 'bookingcom',
        name: 'Booking.com',
        logo: '🔵',
        color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        active: 'bg-indigo-600',
        desc: 'Global OTA · 18% commission',
        commission: 18,
        apiDocs: 'https://partnerhelp.booking.com',
    },
    {
        id: 'expedia',
        name: 'Expedia',
        logo: '🟡',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        active: 'bg-yellow-500',
        desc: 'Global · 20% commission',
        commission: 20,
        apiDocs: 'https://expediapartnercentral.com',
    },
    {
        id: 'airbnb',
        name: 'Airbnb',
        logo: '🔴',
        color: 'text-rose-600 bg-rose-50 border-rose-200',
        active: 'bg-rose-500',
        desc: 'Homestay leader · 14% commission',
        commission: 14,
        apiDocs: 'https://airbnb.com/partners',
    },
    {
        id: 'agoda',
        name: 'Agoda',
        logo: '🟣',
        color: 'text-purple-600 bg-purple-50 border-purple-200',
        active: 'bg-purple-600',
        desc: 'Asia-focused · 16% commission',
        commission: 16,
        apiDocs: 'https://ycs.agoda.com',
    },
    {
        id: 'yatra',
        name: 'Yatra',
        logo: '🟢',
        color: 'text-green-600 bg-green-50 border-green-200',
        active: 'bg-green-600',
        desc: 'Indian OTA · 14% commission',
        commission: 14,
        apiDocs: 'https://yatra.com/partners',
    },
    {
        id: 'ixigo',
        name: 'ixigo',
        logo: '🔴',
        color: 'text-red-600 bg-red-50 border-red-200',
        active: 'bg-red-600',
        desc: 'Fast growing India OTA · 13% commission',
        commission: 13,
        apiDocs: 'https://hotels.ixigo.com/partners',
    },
];

// ── Room mapping modal ────────────────────────────────────────────────────────
function RoomMappingModal({ channel, rooms, mapping, open, onClose, onSave }: {
    channel: typeof OTA_CHANNELS[0];
    rooms: any[];
    mapping: Record<string, string>;
    open: boolean;
    onClose: () => void;
    onSave: (m: Record<string, string>) => void;
}) {
    const [local, setLocal] = useState<Record<string, string>>(mapping);

    return (
        <Modal open={open} onClose={onClose} title={`Room Mapping — ${channel.name}`} size="md">
            <div className="space-y-4">
                <p className="text-sm text-gray-500">
                    Map your hotel rooms to {channel.name} room type IDs.
                    These IDs come from your {channel.name} extranet.
                </p>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {rooms.map(room => (
                        <div key={room._id} className="flex items-center gap-3">
                            <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 w-24 flex-shrink-0 text-center">
                                Room {room.number}
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                            <input
                                type="text"
                                placeholder={`${channel.name} Room ID`}
                                value={local[room._id] || ''}
                                onChange={e => setLocal(p => ({ ...p, [room._id]: e.target.value }))}
                                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                    <Button className="flex-1" onClick={() => { onSave(local); onClose(); }}>Save Mapping</Button>
                </div>
            </div>
        </Modal>
    );
}

// ── Connect modal ─────────────────────────────────────────────────────────────
function ConnectModal({ channel, open, onClose, onConnected }: {
    channel: typeof OTA_CHANNELS[0] | null;
    open: boolean;
    onClose: () => void;
    onConnected: (channelId: string, creds: any) => void;
}) {
    const [apiKey, setApiKey] = useState('');
    const [hotelCode, setHotelCode] = useState('');
    const [loading, setLoading] = useState(false);

    if (!channel) return null;

    async function connect() {
        if (!apiKey || !hotelCode) { toast.error('Fill all fields'); return; }
        setLoading(true);
        try {
            await api.post('/api/channel-manager/connect', {
                channelId: channel?.id,
                credentials: { apiKey, hotelCode },
            });
            onConnected(channel!.id, { apiKey, hotelCode });
            onClose();
            setApiKey(''); setHotelCode('');
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Connection failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal open={open} onClose={onClose} title={`Connect ${channel.name}`} size="sm">
            <div className="space-y-4">
                <div className={cn('flex items-center gap-3 p-3 rounded-xl border', channel.color)}>
                    <span className="text-2xl">{channel.logo}</span>
                    <div>
                        <p className="font-semibold text-sm">{channel.name}</p>
                        <p className="text-xs opacity-70">{channel.desc}</p>
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 space-y-1">
                    <p className="font-semibold">How to get credentials:</p>
                    <p>1. Login to your {channel.name} extranet</p>
                    <p>2. Go to Settings → API Access</p>
                    <p>3. Copy your API Key and Hotel Code</p>
                    <a href={channel.apiDocs} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-amber-600 font-semibold hover:underline mt-1">
                        Open {channel.name} Extranet →
                    </a>
                </div>

                <Input label="API Key / Access Token *" type="password" value={apiKey}
                    onChange={e => setApiKey(e.target.value)} placeholder="Enter your API key" />
                <Input label="Hotel Code / Property ID *" value={hotelCode}
                    onChange={e => setHotelCode(e.target.value)} placeholder="e.g. HTL123456" />

                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                    <Button className="flex-1" loading={loading} onClick={connect}
                        icon={<Link2 className="w-4 h-4" />}>
                        Connect
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ChannelManagerPage() {
    const qc = useQueryClient();
    const [connectChannel, setConnectChannel] = useState<typeof OTA_CHANNELS[0] | null>(null);
    const [mappingChannel, setMappingChannel] = useState<typeof OTA_CHANNELS[0] | null>(null);
    const [syncing, setSyncing] = useState<string | null>(null);
    const [tab, setTab] = useState<'channels' | 'reservations' | 'rates' | 'analytics'>('channels');

    // ── Queries ────────────────────────────────────────────────────────────────
    const { data: channelStatus, refetch: refetchStatus } = useQuery({
        queryKey: ['cm-status'],
        queryFn: () => api.get('/api/channel-manager/status').then(r => r.data.data),
        refetchInterval: 120_000,
    });

    const { data: rooms } = useQuery({
        queryKey: ['rooms-list'],
        queryFn: () => api.get('/api/rooms').then(r => r.data.data || []),
    });

    const { data: cmReservations, isLoading: resLoad } = useQuery({
        queryKey: ['cm-reservations'],
        queryFn: () => api.get('/api/channel-manager/reservations').then(r => r.data.data || []),
        enabled: tab === 'reservations',
    });

    const { data: analytics } = useQuery({
        queryKey: ['cm-analytics'],
        queryFn: () => api.get('/api/channel-manager/analytics').then(r => r.data.data),
        enabled: tab === 'analytics',
    });

    // ── Mutations ──────────────────────────────────────────────────────────────
    const disconnectMut = useMutation({
        mutationFn: (channelId: string) => api.delete(`/api/channel-manager/${channelId}`),
        onSuccess: (_, id) => {
            toast.success('Channel disconnected');
            qc.invalidateQueries({ queryKey: ['cm-status'] });
        },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
    });

    const syncMut = useMutation({
        mutationFn: (channelId: string) => api.post(`/api/channel-manager/${channelId}/sync`),
        onSuccess: (_, id) => {
            toast.success('Sync complete!');
            setSyncing(null);
            qc.invalidateQueries({ queryKey: ['cm-status', 'cm-reservations'] });
        },
        onError: (e: any) => { toast.error(e.response?.data?.message || 'Sync failed'); setSyncing(null); },
    });

    const saveRateMut = useMutation({
        mutationFn: (d: any) => api.post('/api/channel-manager/push-rates', d),
        onSuccess: () => toast.success('Rates pushed to all connected channels!'),
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
    });

    const saveMappingMut = useMutation({
        mutationFn: ({ channelId, mapping }: { channelId: string; mapping: Record<string, string> }) =>
            api.post('/api/channel-manager/room-mapping', { channelId, mapping }),
        onSuccess: () => { toast.success('Room mapping saved!'); qc.invalidateQueries({ queryKey: ['cm-status'] }); },
    });

    // ── Stats ──────────────────────────────────────────────────────────────────
    const connectedChannels = OTA_CHANNELS.filter(ch => channelStatus?.[ch.id]?.connected);
    const totalOTARevenue = analytics?.totalRevenue || 0;
    const totalCommission = analytics?.totalCommission || 0;
    const directRevenue = analytics?.directRevenue || 0;

    return (
        <DashboardLayout title="Channel Manager">
            <div className="space-y-5 max-w-7xl">

                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Channel Manager</h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            Sync availability & rates with OTAs · {connectedChannels.length} channels connected
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => refetchStatus()}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm">
                            <RefreshCw className="w-3.5 h-3.5" /> Refresh
                        </button>
                        {connectedChannels.length > 0 && (
                            <Button onClick={() => { setSyncing('all'); syncMut.mutate('all'); }}
                                loading={syncing === 'all'}
                                icon={<Radio className="w-4 h-4" />}>
                                Sync All Channels
                            </Button>
                        )}
                    </div>
                </div>

                {/* Alert if no channels */}
                {connectedChannels.length === 0 && (
                    <div className="bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-200 rounded-2xl p-5 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
                            <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">Connect your first OTA channel</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Connect MakeMyTrip, Booking.com and others to automatically sync room availability
                                and rates. Stop managing multiple extranets manually.
                            </p>
                            <div className="flex gap-2 mt-3 flex-wrap">
                                {['makemytrip', 'bookingcom', 'goibibo'].map(id => {
                                    const ch = OTA_CHANNELS.find(c => c.id === id)!;
                                    return (
                                        <button key={id} onClick={() => setConnectChannel(ch)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:border-brand-400 hover:bg-brand-50 transition-colors">
                                            {ch.logo} Connect {ch.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats row — only show if connected */}
                {connectedChannels.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Connected Channels', value: connectedChannels.length, color: 'bg-green-50  text-green-700' },
                            { label: 'OTA Revenue (30d)', value: formatCurrency(totalOTARevenue), color: 'bg-blue-50   text-blue-700' },
                            { label: 'Commission Paid (30d)', value: formatCurrency(totalCommission), color: 'bg-red-50    text-red-700' },
                            { label: 'Direct vs OTA', value: `${analytics?.directPct || 0}% direct`, color: 'bg-amber-50  text-amber-700' },
                        ].map(s => (
                            <div key={s.label} className={`${s.color} rounded-2xl p-4 border border-white/60`}>
                                <p className="text-xl font-bold">{s.value}</p>
                                <p className="text-xs font-medium mt-1 opacity-70">{s.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 w-fit">
                    {[
                        { id: 'channels', label: 'Channels' },
                        { id: 'reservations', label: 'OTA Bookings' },
                        { id: 'rates', label: 'Rate Push' },
                        { id: 'analytics', label: 'Analytics' },
                    ].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id as any)}
                            className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all',
                                tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700')}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── CHANNELS TAB ─────────────────────────────────────────────────── */}
                {tab === 'channels' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {OTA_CHANNELS.map(channel => {
                            const status = channelStatus?.[channel.id];
                            const connected = status?.connected;
                            const lastSync = status?.lastSync;
                            const hasErrors = status?.errors > 0;

                            return (
                                <motion.div key={channel.id}
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    className={cn('bg-white rounded-2xl border-2 p-5 transition-all hover:shadow-md',
                                        connected ? 'border-green-200' : 'border-gray-200')}>

                                    {/* Channel header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{channel.logo}</span>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{channel.name}</p>
                                                <p className="text-[10px] text-gray-400">{channel.commission}% commission</p>
                                            </div>
                                        </div>
                                        {/* Connection status */}
                                        <div className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full',
                                            connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                                            {connected
                                                ? <><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live</>
                                                : <><span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Offline</>
                                            }
                                        </div>
                                    </div>

                                    {/* Connected info */}
                                    {connected && (
                                        <div className="space-y-1.5 mb-4">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">Last sync</span>
                                                <span className="font-medium text-gray-700">
                                                    {lastSync ? new Date(lastSync).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">Rooms mapped</span>
                                                <span className="font-medium text-gray-700">{status?.mappedRooms || 0}</span>
                                            </div>
                                            {hasErrors && (
                                                <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1">
                                                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                                    {status.errors} sync error{status.errors > 1 ? 's' : ''}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-400 mb-4">{channel.desc}</p>

                                    {/* Actions */}
                                    {connected ? (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <button onClick={() => { setSyncing(channel.id); syncMut.mutate(channel.id); }}
                                                    disabled={syncing === channel.id}
                                                    className="flex items-center justify-center gap-1 py-2 rounded-xl border border-green-200 bg-green-50 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50">
                                                    {syncing === channel.id ? <Spinner size="sm" /> : <RefreshCw className="w-3 h-3" />}
                                                    Sync
                                                </button>
                                                <button onClick={() => setMappingChannel(channel)}
                                                    className="flex items-center justify-center gap-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                                                    <ArrowUpDown className="w-3 h-3" /> Map Rooms
                                                </button>
                                            </div>
                                            <button onClick={() => { if (confirm(`Disconnect ${channel.name}?`)) disconnectMut.mutate(channel.id); }}
                                                className="w-full py-2 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-1">
                                                <Link2Off className="w-3 h-3" /> Disconnect
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setConnectChannel(channel)}
                                            className="w-full py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:-translate-y-0.5 hover:shadow-md flex items-center justify-center gap-2"
                                            style={{ background: `linear-gradient(135deg, #1B4FD8, #3B82F6)` }}>
                                            <Link2 className="w-4 h-4" /> Connect
                                        </button>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* ── OTA RESERVATIONS TAB ─────────────────────────────────────────── */}
                {tab === 'reservations' && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">OTA Reservations</h3>
                            <Button size="sm" variant="secondary" onClick={() => syncMut.mutate('all')}
                                loading={syncMut.isPending} icon={<RefreshCw className="w-3.5 h-3.5" />}>
                                Pull New Bookings
                            </Button>
                        </div>

                        {resLoad ? <div className="flex justify-center py-12"><Spinner /></div>
                            : !cmReservations?.length ? (
                                <div className="text-center py-14">
                                    <Globe className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                    <p className="font-medium text-gray-500">No OTA reservations yet</p>
                                    <p className="text-sm text-gray-400 mt-1">Connect channels and sync to pull bookings</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-100">
                                                {['Channel', 'Guest', 'Room', 'Check-in', 'Check-out', 'Amount', 'Commission', 'Status', 'Actions'].map(h => (
                                                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cmReservations.map((r: any, i: number) => {
                                                const ch = OTA_CHANNELS.find(c => c.id === r.channel);
                                                const comm = Math.round(r.totalAmount * ((ch?.commission || 15) / 100));
                                                return (
                                                    <tr key={r._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-base">{ch?.logo || '🌐'}</span>
                                                                <span className="text-xs font-semibold text-gray-700">{ch?.name || r.channel}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold text-gray-900">{r.guestName}</td>
                                                        <td className="px-4 py-3">
                                                            <span className="bg-gray-100 text-gray-700 font-bold text-xs px-2 py-0.5 rounded-lg">{r.roomNumber}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(r.checkIn)}</td>
                                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(r.checkOut)}</td>
                                                        <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(r.totalAmount)}</td>
                                                        <td className="px-4 py-3 text-red-600 font-medium text-xs">−{formatCurrency(comm)}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                                                                r.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                                    r.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                        'bg-amber-100 text-amber-700')}>
                                                                {r.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {!r.reservationId && r.status === 'confirmed' && (
                                                                <button className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded-lg hover:bg-brand-100 transition-colors">
                                                                    Import
                                                                </button>
                                                            )}
                                                            {r.reservationId && (
                                                                <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                                                                    <CheckCircle className="w-3 h-3" /> Imported
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                    </div>
                )}

                {/* ── RATE PUSH TAB ────────────────────────────────────────────────── */}
                {tab === 'rates' && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                            <h3 className="font-semibold text-gray-900 mb-1">Push Rates to OTAs</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Update room rates on all connected channels simultaneously. Rate parity ensures
                                your direct booking price is always competitive.
                            </p>

                            {rooms?.length > 0 ? (
                                <div className="space-y-3">
                                    {(rooms || []).slice(0, 8).map((room: any) => (
                                        <div key={room._id} className="flex items-center gap-4 bg-gray-50 rounded-xl px-4 py-3">
                                            <div className="w-12 text-center">
                                                <span className="font-black text-gray-900">{room.number}</span>
                                                <p className="text-[10px] text-gray-400 capitalize">{room.type}</p>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">Base Rate:</span>
                                                    <span className="font-semibold text-gray-900">{formatCurrency(room.baseRate)}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {connectedChannels.slice(0, 3).map(ch => (
                                                    <span key={ch.id} className="text-base" title={ch.name}>{ch.logo}</span>
                                                ))}
                                                {connectedChannels.length > 3 && (
                                                    <span className="text-xs text-gray-400">+{connectedChannels.length - 3}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <Button className="w-full mt-2"
                                        loading={saveRateMut.isPending}
                                        onClick={() => saveRateMut.mutate({ pushAll: true })}
                                        icon={<Zap className="w-4 h-4" />}>
                                        Push All Rates to {connectedChannels.length} Channel{connectedChannels.length !== 1 ? 's' : ''}
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 text-center py-8">No rooms configured yet</p>
                            )}
                        </div>

                        {/* Rate parity check */}
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
                            <div className="flex items-center gap-2 mb-3">
                                <BarChart3 className="w-5 h-5 text-blue-400" />
                                <h3 className="font-semibold">Rate Parity Recommendation</h3>
                            </div>
                            <p className="text-sm text-gray-400 mb-4">
                                Keep your direct booking rate 5-10% lower than OTAs. Guests who find you on OTAs
                                will prefer to book directly and save the commission.
                            </p>
                            <div className="grid grid-cols-3 gap-3 text-center">
                                {[
                                    { label: 'Your Direct Rate', value: '₹4,000', color: 'text-green-400' },
                                    { label: 'MakeMyTrip', value: '₹4,200', color: 'text-orange-400' },
                                    { label: 'Booking.com', value: '₹4,350', color: 'text-blue-400' },
                                ].map(r => (
                                    <div key={r.label} className="bg-white/10 rounded-xl p-3">
                                        <p className={cn('text-lg font-bold', r.color)}>{r.value}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{r.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── ANALYTICS TAB ────────────────────────────────────────────────── */}
                {tab === 'analytics' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                {
                                    label: 'Total OTA Revenue',
                                    value: formatCurrency(analytics?.totalRevenue || 0),
                                    icon: TrendingUp,
                                    color: 'bg-blue-50 text-blue-700'
                                },
                                {
                                    label: 'Commission Paid',
                                    value: formatCurrency(analytics?.totalCommission || 0),
                                    icon: BarChart3,
                                    color: 'bg-red-50 text-red-700'
                                },
                                {
                                    label: 'Net Revenue',
                                    value: formatCurrency(
                                        (analytics?.totalRevenue || 0) - (analytics?.totalCommission || 0)
                                    ),
                                    icon: Zap,
                                    color: 'bg-green-50 text-green-700'
                                },
                                {
                                    label: 'Direct Revenue',
                                    value: formatCurrency(analytics?.directRevenue || 0),
                                    icon: Globe,
                                    color: 'bg-purple-50 text-purple-700'
                                }
                            ].map(s => (
                                <div key={s.label} className={`${s.color} rounded-2xl p-5 border border-white/60`}>
                                    <s.icon className="w-5 h-5 mb-2 opacity-70" />
                                    <p className="text-2xl font-bold">{s.value}</p>
                                    <p className="text-xs font-medium mt-1 opacity-70">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Channel breakdown */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                            <h3 className="font-semibold text-gray-900 mb-4">Revenue by Channel</h3>
                            {connectedChannels.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-8">Connect channels to see analytics</p>
                            ) : (
                                <div className="space-y-3">
                                    {[
                                        { name: 'Direct Booking', value: directRevenue, pct: analytics?.directPct || 0, color: 'bg-brand-600' },
                                        ...connectedChannels.map(ch => ({
                                            name: ch.name,
                                            value: analytics?.byChannel?.[ch.id] || 0,
                                            pct: analytics?.byChannelPct?.[ch.id] || 0,
                                            color: 'bg-gray-400',
                                        })),
                                    ].map(row => (
                                        <div key={row.name}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-700 font-medium">{row.name}</span>
                                                <span className="font-bold text-gray-900">
                                                    {formatCurrency(row.value)} · {row.pct}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${row.pct}%` }}
                                                    transition={{ duration: 0.7 }}
                                                    className={cn('h-full rounded-full', row.color)} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <ConnectModal channel={connectChannel} open={!!connectChannel}
                onClose={() => setConnectChannel(null)}
                onConnected={() => { qc.invalidateQueries({ queryKey: ['cm-status'] }); }} />

            {mappingChannel && (
                <RoomMappingModal
                    channel={mappingChannel}
                    rooms={rooms || []}
                    mapping={channelStatus?.[mappingChannel.id]?.roomMapping || {}}
                    open={!!mappingChannel}
                    onClose={() => setMappingChannel(null)}
                    onSave={mapping => saveMappingMut.mutate({ channelId: mappingChannel.id, mapping })}
                />
            )}
        </DashboardLayout>
    );
}