'use client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Star, Users, Gift } from 'lucide-react';

export default function LoyaltyDashboardPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['loyalty-members'],
    queryFn:  () => api.get('/api/guests', {
      params: { hasLoyalty: true, limit: 50, sortBy: 'loyalty.points', sortOrder: 'desc' }
    }).then(r => r.data.data?.docs || []),
  });

  const stats = {
    total:    data?.length || 0,
    gold:     data?.filter((g: any) => g.loyalty?.tier === 'gold' || g.loyalty?.tier === 'platinum').length || 0,
    points:   data?.reduce((s: number, g: any) => s + (g.loyalty?.points || 0), 0) || 0,
  };

  return (
    <DashboardLayout title="Loyalty">
      <div className="space-y-5 max-w-5xl">
        <h1 className="text-xl font-bold text-gray-900">Guest Loyalty Program</h1>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Members', value: stats.total,                        icon: Users,     color: 'bg-blue-50  text-blue-700'   },
            { label: 'Gold & Platinum',value: stats.gold,                        icon: Star,      color: 'bg-amber-50 text-amber-700'  },
            { label: 'Points in Circulation', value: stats.points.toLocaleString(), icon: Gift,  color: 'bg-purple-50 text-purple-700'},
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl p-4 border border-white/60`}>
              <s.icon className="w-5 h-5 mb-2 opacity-70" />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-medium mt-0.5 opacity-70">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Members</h3>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {(data || []).map((g: any) => (
                <div key={g._id}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/dashboard/guests/${g._id}`)}>
                  <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {g.firstName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{g.firstName} {g.lastName}</p>
                    <p className="text-xs text-gray-400">{g.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{(g.loyalty?.points || 0).toLocaleString()} pts</p>
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full capitalize',
                      g.loyalty?.tier === 'platinum' ? 'bg-purple-100 text-purple-700' :
                      g.loyalty?.tier === 'gold'     ? 'bg-amber-100  text-amber-700'  :
                      g.loyalty?.tier === 'silver'   ? 'bg-gray-100   text-gray-600'   :
                                                       'bg-orange-100 text-orange-700'
                    )}>
                      {g.loyalty?.tier || 'bronze'}
                    </span>
                  </div>
                  {g.loyalty?.membershipId && (
                    <button
                      onClick={e => { e.stopPropagation(); window.open(`/loyalty/${g.loyalty.membershipId}`, '_blank'); }}
                      className="text-xs text-brand-600 hover:underline font-medium flex-shrink-0">
                      PWA →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}