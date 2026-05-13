'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Badge, Spinner } from '@/components/ui';
import { cn, LOYALTY_TIER_COLORS } from '@/lib/utils';
import { Star } from 'lucide-react';

export function ArrivalsTable() {
  const { data, isLoading } = useQuery({
    queryKey: ['arrivals-today'],
    queryFn: () => api.get('/api/reservations/arrivals-today').then((r) => r.data.data),
    refetchInterval: 60_000,
  });

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;
  if (!data?.length) return <div className="text-center py-8 text-sm text-gray-400">No arrivals today</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Guest</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Room</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r: any) => {
            const guest = r.guestId;
            const tier = guest?.loyalty?.tier;
            return (
              <tr key={r._id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                      {guest?.firstName?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-xs">
                        {guest?.firstName} {guest?.lastName}
                        {guest?.isVip && <Star className="inline w-3 h-3 ml-1 text-amber-500 fill-amber-500" />}
                      </p>
                      {tier && (
                        <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', LOYALTY_TIER_COLORS[tier])}>
                          {tier}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-700">{r.roomNumber}</td>
                <td className="px-4 py-2.5">
                  <Badge variant={r.status === 'checked_in' ? 'success' : 'info'}>
                    {r.status === 'checked_in' ? '✓ In' : 'Arriving'}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
