'use client';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn, ROOM_STATUS_COLORS, ROOM_STATUS_LABELS } from '@/lib/utils';

export function OccupancyGauge({ value }: { value: number }) {
  const data = [{ value }, { value: 100 - value }];
  const color = value >= 80 ? '#16a34a' : value >= 50 ? '#1D4ED8' : '#f59e0b';
  return (
    <div className="relative flex justify-center">
      <ResponsiveContainer width={160} height={100}>
        <PieChart>
          <Pie data={data} cx="50%" cy="80%" startAngle={180} endAngle={0} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
            <Cell fill={color} />
            <Cell fill="#F3F4F6" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
        <p className="text-2xl font-bold" style={{ color }}>{value}%</p>
      </div>
    </div>
  );
}

export function RoomStatusGrid() {
  const { data } = useQuery({
    queryKey: ['rooms', 'floor-plan'],
    queryFn: () => api.get('/api/rooms/floor-plan').then((r) => r.data.data),
    refetchInterval: 30_000,
  });

  if (!data) return <div className="h-32 animate-pulse bg-gray-100 rounded-lg" />;

  const rooms = Object.values(data.floors as Record<string, any[]>).flat();

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {rooms.slice(0, 40).map((room: any) => (
          <div
            key={room._id}
            className={cn('w-10 h-10 rounded-lg border text-[10px] font-semibold flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform', ROOM_STATUS_COLORS[room.status] || 'bg-gray-100 text-gray-600')}
            title={`${room.number} — ${ROOM_STATUS_LABELS[room.status]}`}
          >
            {room.number}
          </div>
        ))}
        {rooms.length > 40 && (
          <div className="w-10 h-10 rounded-lg border bg-gray-100 text-[10px] font-semibold flex items-center justify-center text-gray-500">
            +{rooms.length - 40}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {(['VC', 'VD', 'OC', 'OD', 'OOO'] as const).map((s) => (
          <div key={s} className={cn('flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full', ROOM_STATUS_COLORS[s])}>
            <span>{s}</span>
            <span className="opacity-70">{ROOM_STATUS_LABELS[s]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
