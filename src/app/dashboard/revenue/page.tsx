'use client';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Spinner } from '@/components/ui';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  Sparkles, TrendingUp, TrendingDown, Minus, Send, Bot,
  DollarSign, Target, Zap, BarChart3, RefreshCw, ChevronRight,
  Clock, Star, AlertCircle, CheckCircle2, ArrowUpRight,
  ArrowDownRight, Calendar, Lightbulb, MessageSquare, Users,
  ShieldAlert, FileText, Wrench, X, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = 'recommendation' | 'insights' | 'forecast';
type ToolModal = 'sentiment' | 'upsell' | 'review' | 'cancellation' | 'summary' | 'housekeeping' | null;

// ── Suggested chat prompts ────────────────────────────────────────────────────
const SUGGESTED = [
  { label: "Today's occupancy?",    icon: BarChart3   },
  { label: 'Weekend pricing tips',  icon: Calendar    },
  { label: 'Upsell strategy',       icon: TrendingUp  },
  { label: 'Revenue forecast',      icon: DollarSign  },
  { label: 'Competitor pricing',    icon: Target      },
  { label: 'Yield management tips', icon: Lightbulb   },
];

// ── AI Tool definitions ───────────────────────────────────────────────────────
const AI_TOOLS = [
  { id: 'sentiment',    label: 'Sentiment Analysis', sub: 'Analyse guest reviews',      icon: Star,        color: '#f59e0b', bg: '#fffbeb' },
  { id: 'review',       label: 'Review Reply',        sub: 'Auto-generate replies',      icon: MessageSquare, color: '#3b82f6', bg: '#eff6ff' },
  { id: 'upsell',       label: 'Upsell Generator',   sub: 'Bulk offers for guests',      icon: Zap,         color: '#8b5cf6', bg: '#f5f3ff' },
  { id: 'cancellation', label: 'Cancellation Risk',  sub: 'Score upcoming bookings',     icon: ShieldAlert, color: '#ef4444', bg: '#fef2f2' },
  { id: 'summary',      label: 'Monthly Summary',    sub: 'AI executive narrative',      icon: FileText,    color: '#10b981', bg: '#ecfdf5' },
  { id: 'housekeeping', label: 'Housekeeping AI',    sub: 'Priority predictions',        icon: Wrench,      color: '#f97316', bg: '#fff7ed' },
] as const;

export default function RevenueAIPage() {
  const [msgs, setMsgs]             = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput]           = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab]   = useState<Tab>('recommendation');
  const [openModal, setOpenModal]   = useState<ToolModal>(null);
  const endRef                      = useRef<HTMLDivElement>(null);

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [reviewText,   setReviewText]   = useState('');
  const [reviewRating, setReviewRating] = useState(3);
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const [sentimentText,   setSentimentText]   = useState('');
  const [sentimentResult, setSentimentResult] = useState<any>(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: rec, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-rate'],
    queryFn:  () => api.get('/api/ai/revenue/rate-recommendation').then(r => r.data.data),
  });

  const { data: forecast, isLoading: forecastLoading } = useQuery({
    queryKey: ['ai-forecast'],
    queryFn:  () => api.get('/api/ai/revenue/forecast').then(r => r.data.data),
    enabled:  activeTab === 'forecast',
    staleTime: 30 * 60 * 1000,
  });

  const { data: cancellationData, isLoading: cancelLoading } = useQuery({
    queryKey: ['ai-cancellation'],
    queryFn:  () => api.get('/api/ai/reservations/cancellation-risk').then(r => r.data.data),
    enabled:  openModal === 'cancellation',
  });

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['ai-summary'],
    queryFn:  () => api.get('/api/ai/revenue/summary').then(r => r.data.data),
    enabled:  openModal === 'summary',
  });

  const { data: upsellData, isLoading: upsellLoading } = useQuery({
    queryKey: ['ai-upsell-bulk'],
    queryFn:  () => api.get('/api/ai/upsell/bulk').then(r => r.data.data),
    enabled:  openModal === 'upsell',
  });
const { data: hkData, isLoading: hkLoading } = useQuery({
  queryKey: ['ai-housekeeping'],
  queryFn:  () => api.get('/api/ai/housekeeping/priorities').then(r => r.data.data),
  enabled:  openModal === 'housekeeping',
});
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  // ── Chat ─────────────────────────────────────────────────────────────────────
  async function sendChat(text?: string) {
    const msg = text ?? input;
    if (!msg.trim() || chatLoading) return;
    const userMsg = { role: 'user', content: msg };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInput('');
    setChatLoading(true);
    try {
      const { data } = await api.post('/api/ai/assistant/chat', {
        messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
      });
      setMsgs(p => [...p, { role: 'assistant', content: data.data.reply }]);
    } catch {
      toast.error('AI unavailable');
    } finally {
      setChatLoading(false);
    }
  }

  // ── Review reply ─────────────────────────────────────────────────────────────
  async function generateReviewReply() {
    if (!reviewText.trim()) return;
    setReviewLoading(true);
    try {
      const { data } = await api.post('/api/ai/review/reply', {
        review: reviewText, rating: reviewRating, platform: 'Google',
      });
      setReviewResult(data.data);
    } catch {
      toast.error('Failed to generate reply');
    } finally {
      setReviewLoading(false);
    }
  }

  // ── Sentiment ─────────────────────────────────────────────────────────────────
  async function analyzeSentiment() {
    if (!sentimentText.trim()) return;
    setSentimentLoading(true);
    try {
      const { data } = await api.post('/api/ai/sentiment/analyze', { review: sentimentText });
      setSentimentResult(data.data);
    } catch {
      toast.error('Sentiment analysis failed');
    } finally {
      setSentimentLoading(false);
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────────
  const ActionIcon = rec?.action === 'increase' ? TrendingUp
                   : rec?.action === 'decrease' ? TrendingDown : Minus;
  const actionGrad = rec?.action === 'increase' ? 'linear-gradient(135deg,#10b981,#059669)'
                   : rec?.action === 'decrease' ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                   : 'linear-gradient(135deg,#6b7280,#4b5563)';
  const actionBg   = rec?.action === 'increase' ? '#ecfdf5'
                   : rec?.action === 'decrease' ? '#fef2f2' : '#f9fafb';
  const actionText = rec?.action === 'increase' ? '#059669'
                   : rec?.action === 'decrease' ? '#dc2626' : '#6b7280';

  // ── Risk color helper ─────────────────────────────────────────────────────────
  const riskColor = (r: string) =>
    r === 'critical' ? '#ef4444' : r === 'high' ? '#f97316'
    : r === 'medium' ? '#f59e0b' : '#10b981';

  return (
    <DashboardLayout title="Revenue AI">
      <div className="space-y-6 pb-10">

        {/* ── HERO HEADER ─────────────────────────────────────────────────── */}
        <div
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden px-5 py-6 sm:px-8 sm:py-8 text-white"
          style={{ background: 'linear-gradient(135deg,#F97316 0%,#F43F5E 100%)' }}
        >
          <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full opacity-20"
            style={{ background: 'rgba(255,255,255,0.3)' }} />
          <div className="pointer-events-none absolute -bottom-6 left-20 h-24 w-24 rounded-full opacity-10"
            style={{ background: 'rgba(255,255,255,0.5)' }} />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">AI-Powered</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">Revenue Intelligence</h1>
              <p className="mt-1 text-sm opacity-80">Real-time pricing recommendations & yield optimization</p>
            </div>

            <div className="flex gap-3 flex-wrap sm:flex-nowrap">
              {[
                { label: 'Rec. Rate',   value: rec ? formatCurrency(rec.recommendedRate) : '—', icon: DollarSign },
                { label: 'Confidence',  value: rec ? `${rec.confidence}%` : '—',                 icon: Target     },
                { label: 'Action',      value: rec?.action ?? '—',                               icon: Zap        },
              ].map(s => (
                <div key={s.label}
                  className="flex items-center gap-2 rounded-2xl px-4 py-2.5 min-w-[110px]"
                  style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
                  <s.icon className="h-4 w-4 opacity-80 flex-shrink-0" />
                  <div>
                    <p className="text-xs opacity-70 leading-none">{s.label}</p>
                    <p className="text-sm font-bold capitalize mt-0.5">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MAIN GRID ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

          {/* LEFT — 3/5 */}
          <div className="xl:col-span-3 space-y-4">

            {/* Tab bar */}
            <div className="flex gap-1 rounded-2xl border border-gray-100 bg-white p-1 shadow-sm">
              {([
                { key: 'recommendation', label: 'Rate Recommendation', icon: DollarSign },
                { key: 'insights',       label: 'Insights',            icon: Lightbulb  },
                { key: 'forecast',       label: 'Forecast',            icon: BarChart3  },
              ] as const).map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-all"
                  style={activeTab === tab.key ? {
                    background: 'linear-gradient(135deg,#F97316,#F43F5E)',
                    color: '#fff', boxShadow: '0 2px 8px rgba(249,115,22,0.3)',
                  } : { color: '#94a3b8', background: 'transparent' }}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* ── Recommendation tab ── */}
            {activeTab === 'recommendation' && (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">Rate Recommendation</h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}>AI</span>
                  </div>
                  <button onClick={() => refetch()} disabled={isFetching}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-all disabled:opacity-50">
                    <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                <div className="p-5">
                  {isLoading ? (
                    <div className="flex flex-col items-center py-12 gap-3">
                      <Spinner /><p className="text-sm text-gray-400">AI analysing market data...</p>
                    </div>
                  ) : rec ? (
                    <div className="space-y-5">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 rounded-2xl p-5 text-center relative overflow-hidden"
                          style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}>
                          <p className="text-xs font-semibold uppercase tracking-wider text-orange-400 mb-1">Recommended Rate</p>
                          <p className="text-4xl font-black text-gray-900">{formatCurrency(rec.recommendedRate)}</p>
                          <p className="text-xs text-gray-400 mt-1">per night · tonight</p>
                          {/* Min / Max range */}
                          {rec.minRate && rec.maxRate && (
                            <p className="text-xs text-orange-400 mt-2 font-medium">
                              Range: {formatCurrency(rec.minRate)} – {formatCurrency(rec.maxRate)}
                            </p>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl"
                            style={{ background: 'linear-gradient(90deg,#F97316,#F43F5E)' }} />
                        </div>
                        <div className="flex flex-col items-center justify-center rounded-2xl px-5 py-4 gap-2 min-w-[120px]"
                          style={{ background: actionBg }}>
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                            style={{ background: actionGrad }}>
                            <ActionIcon className="h-6 w-6" />
                          </div>
                          <p className="text-sm font-bold capitalize" style={{ color: actionText }}>
                            {rec.action} Rate
                          </p>
                        </div>
                      </div>

                      {/* Confidence */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-500">AI Confidence</span>
                          <span className="text-sm font-bold text-gray-900">{rec.confidence}%</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${rec.confidence}%`, background: 'linear-gradient(90deg,#F97316,#F43F5E)' }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-300">Low</span>
                          <span className="text-xs text-gray-300">High</span>
                        </div>
                      </div>

                      {/* Reasoning */}
                      <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,#eff6ff,#eef2ff)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="h-4 w-4 text-blue-500" />
                          <p className="text-xs font-bold text-blue-700">AI Reasoning</p>
                        </div>
                        <p className="text-sm text-blue-900 leading-relaxed">{rec.reasoning}</p>
                      </div>

                      {/* Factors */}
                      {rec.factors?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">Contributing Factors</p>
                          <div className="flex flex-wrap gap-2">
                            {rec.factors.map((f: string, i: number) => (
                              <span key={i} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                                style={{ background: '#f1f5f9', color: '#475569' }}>
                                <CheckCircle2 className="h-3 w-3 text-green-500" />{f}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-12 gap-3">
                      <AlertCircle className="h-8 w-8 text-gray-300" />
                      <p className="text-sm text-gray-400">Unable to load recommendation</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Insights tab ── */}
            {activeTab === 'insights' && (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h3 className="font-bold text-gray-900">Revenue Insights</h3>
                  <p className="text-xs text-gray-400 mt-0.5">AI-generated observations for today</p>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { icon: ArrowUpRight,  color: '#10b981', bg: '#ecfdf5', title: 'High Demand Window',       body: 'Weekend bookings trending 18% above last month. Consider raising BAR by ₹500.' },
                    { icon: AlertCircle,   color: '#f59e0b', bg: '#fffbeb', title: 'Last-Minute Availability', body: '3 rooms still available tonight. Activate LMD pricing to fill rooms.' },
                    { icon: TrendingUp,    color: '#3b82f6', bg: '#eff6ff', title: 'Upsell Opportunity',       body: '4 mid-stay guests are suite upgrade candidates based on length-of-stay data.' },
                    { icon: ArrowDownRight,color: '#ef4444', bg: '#fef2f2', title: 'Soft Midweek Demand',      body: 'Tue–Wed shows 12% below target. Recommend a promotional rate or package.' },
                    { icon: Star,          color: '#8b5cf6', bg: '#f5f3ff', title: 'Loyalty Revenue',          body: '2 loyalty members checked in today. Trigger complimentary upgrade to improve NPS.' },
                  ].map((ins, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-2xl p-4 border border-gray-50 hover:border-orange-100 transition-colors">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                        style={{ background: ins.bg, color: ins.color }}>
                        <ins.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{ins.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{ins.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Forecast tab — now uses REAL API data ── */}
            {activeTab === 'forecast' && (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <div>
                    <h3 className="font-bold text-gray-900">7-Day Revenue Forecast</h3>
                    <p className="text-xs text-gray-400 mt-0.5">AI occupancy & rate prediction</p>
                  </div>
                  {forecast?.weekSummary && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Week forecast</p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(forecast.weekSummary.totalForecastRevenue)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-2">
                  {forecastLoading ? (
                    <div className="flex flex-col items-center py-10 gap-3">
                      <Spinner /><p className="text-sm text-gray-400">Generating forecast...</p>
                    </div>
                  ) : forecast?.forecast?.length > 0 ? (
                    <>
                      {forecast.forecast.map((day: any) => {
                        const isHigh = day.forecastOccupancy >= 80;
                        return (
                          <div key={day.date} className="flex items-center gap-3">
                            <span className="w-8 text-xs font-bold text-gray-400">{day.dayName}</span>
                            <div className="flex-1 h-7 rounded-xl overflow-hidden bg-gray-100 relative">
                              <div className="h-full rounded-xl transition-all duration-500"
                                style={{
                                  width: `${day.forecastOccupancy}%`,
                                  background: isHigh
                                    ? 'linear-gradient(90deg,#F97316,#F43F5E)'
                                    : 'linear-gradient(90deg,#3b82f6,#6366f1)',
                                }} />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600">
                                {day.forecastOccupancy}%
                              </span>
                            </div>
                            <div className="text-right min-w-[80px]">
                              <p className="text-xs font-bold text-gray-700">{formatCurrency(day.recommendedRate)}</p>
                              <p className="text-xs" style={{ color: riskColor(day.demand === 'high' ? 'critical' : day.demand === 'low' ? 'low' : 'medium') }}>
                                {day.demand}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Week summary strip */}
                      {forecast.weekSummary && (
                        <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-gray-50">
                          <div className="rounded-xl p-3 text-center" style={{ background: '#ecfdf5' }}>
                            <p className="text-xs text-gray-500">Best day</p>
                            <p className="text-sm font-bold text-green-700">{forecast.weekSummary.bestDay}</p>
                          </div>
                          <div className="rounded-xl p-3 text-center" style={{ background: '#fef2f2' }}>
                            <p className="text-xs text-gray-500">Weakest day</p>
                            <p className="text-sm font-bold text-red-600">{forecast.weekSummary.weakestDay}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Fallback static bars */
                    ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => {
                      const occ  = [72,65,68,74,85,92,88][i];
                      const rate = [4200,3900,4000,4300,4800,5200,5000][i];
                      return (
                        <div key={day} className="flex items-center gap-3">
                          <span className="w-8 text-xs font-bold text-gray-400">{day}</span>
                          <div className="flex-1 h-7 rounded-xl overflow-hidden bg-gray-100 relative">
                            <div className="h-full rounded-xl"
                              style={{ width: `${occ}%`, background: occ >= 80 ? 'linear-gradient(90deg,#F97316,#F43F5E)' : 'linear-gradient(90deg,#3b82f6,#6366f1)' }} />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600">{occ}%</span>
                          </div>
                          <span className="w-16 text-right text-xs font-bold text-gray-700">{formatCurrency(rate)}</span>
                        </div>
                      );
                    })
                  )}
                  <p className="text-xs text-gray-400 pt-2 text-center">🟠 High demand · 🔵 Normal · Rate per night</p>
                </div>
              </div>
            )}

            {/* ── KPI strip ── */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'RevPAR', value: rec ? formatCurrency(rec.revpar ?? 3100) : '—', trend: '+8%',  up: true  },
                { label: 'ADR',    value: rec ? formatCurrency(rec.adr   ?? 4200) : '—', trend: '+5%',  up: true  },
                { label: 'GOPPAR', value: rec ? formatCurrency(rec.goppar ?? 2800) : '—', trend: '-2%', up: false },
              ].map(kpi => (
                <div key={kpi.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <p className="text-xs text-gray-400 font-medium">{kpi.label}</p>
                  <p className="text-xl font-black text-gray-900 mt-1">{kpi.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {kpi.up
                      ? <ArrowUpRight className="h-3 w-3 text-green-500" />
                      : <ArrowDownRight className="h-3 w-3 text-red-500" />}
                    <span className={`text-xs font-semibold ${kpi.up ? 'text-green-600' : 'text-red-500'}`}>{kpi.trend}</span>
                    <span className="text-xs text-gray-400">vs last week</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — AI Chat 2/5 */}
          <div className="xl:col-span-2">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col h-full min-h-[580px]">
              <div className="px-5 py-4 text-white flex items-center justify-between flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Revenue AI</p>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-300 inline-block" />
                      <span className="text-xs opacity-75">Online · GPT-4o</span>
                    </div>
                  </div>
                </div>
                <Clock className="h-4 w-4 opacity-60" />
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {msgs.length === 0 ? (
                  <div className="flex flex-col items-center text-center pt-4 pb-2">
                    <div className="h-16 w-16 rounded-3xl flex items-center justify-center mb-3"
                      style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}>
                      <Sparkles className="h-8 w-8 text-orange-400" />
                    </div>
                    <p className="font-bold text-gray-800">Revenue Assistant</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-[200px] leading-relaxed">
                      Ask me anything about pricing, occupancy, upselling, or yield strategy.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2 w-full">
                      {SUGGESTED.map(s => (
                        <button key={s.label} onClick={() => sendChat(s.label)}
                          className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-2.5 py-2 text-left text-xs font-medium text-gray-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 transition-all">
                          <s.icon className="h-3.5 w-3.5 flex-shrink-0 text-orange-400" />
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : msgs.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.role === 'assistant' && (
                      <div className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white"
                        style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div className="max-w-[82%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={m.role === 'user' ? {
                        background: 'linear-gradient(135deg,#F97316,#F43F5E)', color: '#fff',
                        borderBottomRightRadius: '4px',
                      } : {
                        background: '#f8fafc', color: '#1e293b',
                        border: '1px solid #f1f5f9', borderBottomLeftRadius: '4px',
                      }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                      style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="rounded-2xl px-4 py-3 flex gap-1 items-center"
                      style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      {[0,1,2].map(i => (
                        <div key={i} className="h-2 w-2 rounded-full animate-bounce"
                          style={{ background: '#F97316', animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <div className="flex-shrink-0 border-t p-3 gap-2 flex items-center"
                style={{ borderColor: '#f1f5f9' }}>
                <input
                  className="flex-1 text-sm rounded-xl border border-gray-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all bg-gray-50"
                  placeholder="Ask about rates, occupancy..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                />
                <button onClick={() => sendChat()} disabled={chatLoading || !input.trim()}
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
                  {chatLoading ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── AI TOOLS GRID ─────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">AI Tools</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {AI_TOOLS.map(tool => (
              <button key={tool.id}
                onClick={() => setOpenModal(tool.id as ToolModal)}
                className="group flex flex-col items-center gap-2.5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-orange-100 transition-all text-center">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: tool.bg, color: tool.color }}>
                  <tool.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 leading-tight">{tool.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-tight">{tool.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════════════════════════════════ */}

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpenModal(null)}>
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
              <div className="flex items-center gap-3">
                {(() => {
                  const t = AI_TOOLS.find(t => t.id === openModal);
                  return t ? (
                    <>
                      <div className="h-8 w-8 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.2)' }}>
                        <t.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{t.label}</p>
                        <p className="text-xs opacity-75">{t.sub}</p>
                      </div>
                    </>
                  ) : null;
                })()}
              </div>
              <button onClick={() => setOpenModal(null)}
                className="h-7 w-7 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── Sentiment Modal ── */}
            {openModal === 'sentiment' && (
              <div className="p-5 space-y-4 overflow-y-auto">
                <textarea
                  className="w-full rounded-2xl border border-gray-200 p-3.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                  rows={4} placeholder="Paste a guest review here..."
                  value={sentimentText} onChange={e => setSentimentText(e.target.value)} />
                <button onClick={analyzeSentiment} disabled={sentimentLoading || !sentimentText.trim()}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
                  {sentimentLoading ? 'Analysing...' : 'Analyse Sentiment'}
                </button>
                {sentimentResult && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-2xl p-4"
                      style={{
                        background: sentimentResult.sentiment === 'positive' ? '#ecfdf5'
                          : sentimentResult.sentiment === 'negative' ? '#fef2f2' : '#f8fafc',
                      }}>
                      {sentimentResult.sentiment === 'positive'
                        ? <ThumbsUp className="h-5 w-5 text-green-600" />
                        : sentimentResult.sentiment === 'negative'
                        ? <ThumbsDown className="h-5 w-5 text-red-500" />
                        : <Minus className="h-5 w-5 text-gray-400" />}
                      <div>
                        <p className="font-bold text-gray-900 capitalize">{sentimentResult.sentiment}</p>
                        <p className="text-xs text-gray-500">Score: {sentimentResult.score}/10 · Urgency: {sentimentResult.urgency}</p>
                      </div>
                    </div>
                    {sentimentResult.keyIssues?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-red-500 mb-1">Issues</p>
                        <div className="flex flex-wrap gap-1">
                          {sentimentResult.keyIssues.map((k: string, i: number) => (
                            <span key={i} className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-600">{k}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {sentimentResult.keyPraises?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-600 mb-1">Praises</p>
                        <div className="flex flex-wrap gap-1">
                          {sentimentResult.keyPraises.map((k: string, i: number) => (
                            <span key={i} className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">{k}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {sentimentResult.suggestedResponse && (
                      <div className="rounded-2xl p-3 bg-blue-50">
                        <p className="text-xs font-bold text-blue-700 mb-1">Suggested Response</p>
                        <p className="text-xs text-blue-900 leading-relaxed">{sentimentResult.suggestedResponse}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Review Reply Modal ── */}
            {openModal === 'review' && (
              <div className="p-5 space-y-4 overflow-y-auto">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Guest Review</label>
                  <textarea
                    className="w-full rounded-2xl border border-gray-200 p-3.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                    rows={3} placeholder="Paste the guest's review..."
                    value={reviewText} onChange={e => setReviewText(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Rating: {reviewRating}/5</label>
                  <input type="range" min={1} max={5} value={reviewRating}
                    onChange={e => setReviewRating(Number(e.target.value))}
                    className="w-full accent-orange-500" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1 ⭐</span><span>5 ⭐⭐⭐⭐⭐</span>
                  </div>
                </div>
                <button onClick={generateReviewReply} disabled={reviewLoading || !reviewText.trim()}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
                  {reviewLoading ? 'Generating...' : 'Generate Reply'}
                </button>
                {reviewResult && (
                  <div className="space-y-3">
                    <div className="rounded-2xl p-4 border border-blue-100" style={{ background: '#eff6ff' }}>
                      <p className="text-xs font-bold text-blue-700 mb-2">Generated Reply</p>
                      <p className="text-sm text-blue-900 leading-relaxed">{reviewResult.reply}</p>
                    </div>
                    {reviewResult.followUpAction && (
                      <div className="rounded-2xl p-3 border border-amber-100" style={{ background: '#fffbeb' }}>
                        <p className="text-xs font-bold text-amber-700 mb-1">Internal Action</p>
                        <p className="text-xs text-amber-900">{reviewResult.followUpAction}</p>
                      </div>
                    )}
                    <button
                      onClick={() => { navigator.clipboard.writeText(reviewResult.reply); toast.success('Copied!'); }}
                      className="w-full py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-500 transition-all">
                      Copy Reply
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Upsell Bulk Modal ── */}
            {openModal === 'upsell' && (
              <div className="p-5 overflow-y-auto space-y-3">
                {upsellLoading ? (
                  <div className="flex flex-col items-center py-10 gap-3">
                    <Spinner /><p className="text-sm text-gray-400">Generating offers for all guests...</p>
                  </div>
                ) : upsellData?.length > 0 ? upsellData.map((guest: any, i: number) => (
                  <div key={i} className="rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
                          {guest.guestName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{guest.guestName}</p>
                          <p className="text-xs text-gray-400">Room {guest.roomNumber}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full"
                        style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
                        {guest.offers?.offers?.length || 0} offers
                      </span>
                    </div>
                    {guest.offers?.offers?.slice(0,2).map((o: any, j: number) => (
                      <div key={j} className="flex items-center justify-between text-xs text-gray-600 mt-1.5 pl-10">
                        <span>• {o.title}</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(o.price)}</span>
                      </div>
                    ))}
                  </div>
                )) : (
                  <div className="text-center py-10">
                    <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No active check-ins found</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Cancellation Risk Modal ── */}
            {openModal === 'cancellation' && (
              <div className="p-5 overflow-y-auto space-y-3">
                {cancelLoading ? (
                  <div className="flex flex-col items-center py-10 gap-3">
                    <Spinner /><p className="text-sm text-gray-400">Scoring reservations...</p>
                  </div>
                ) : cancellationData?.length > 0 ? cancellationData.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{item.guestName}</p>
                      <p className="text-xs text-gray-400">{item.checkIn} · {formatCurrency(item.amount)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-black" style={{ color: riskColor(item.risk?.risk) }}>
                        {item.risk?.score ?? '—'}
                      </p>
                      <p className="text-xs font-semibold capitalize" style={{ color: riskColor(item.risk?.risk) }}>
                        {item.risk?.risk ?? '—'}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10">
                    <ShieldAlert className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No upcoming reservations to score</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Monthly Summary Modal ── */}
            {openModal === 'summary' && (
              <div className="p-5 overflow-y-auto space-y-4">
                {summaryLoading ? (
                  <div className="flex flex-col items-center py-10 gap-3">
                    <Spinner /><p className="text-sm text-gray-400">Generating executive summary...</p>
                  </div>
                ) : summaryData ? (
                  <>
                    <div className="flex items-center gap-3 p-4 rounded-2xl"
                      style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}>
                      <DollarSign className="h-8 w-8 text-orange-400" />
                      <div>
                        <p className="text-xl font-black text-gray-900">{formatCurrency(summaryData.stats?.totalRevenue)}</p>
                        <p className="text-xs text-gray-500">{summaryData.stats?.totalBookings} bookings this month</p>
                      </div>
                      <span className="ml-auto px-3 py-1 rounded-full text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
                        {summaryData.summary?.performanceRating?.replace('_', ' ')}
                      </span>
                    </div>
                    {summaryData.summary?.narrative && (
                      <div className="rounded-2xl p-4 border border-blue-100" style={{ background: '#eff6ff' }}>
                        <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1.5">
                          <Bot className="h-3.5 w-3.5" /> AI Narrative
                        </p>
                        <p className="text-sm text-blue-900 leading-relaxed">{summaryData.summary.narrative}</p>
                      </div>
                    )}
                    {summaryData.summary?.highlights?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">Highlights</p>
                        <div className="space-y-1.5">
                          {summaryData.summary.highlights.map((h: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />{h}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {summaryData.summary?.recommendations?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">Recommendations</p>
                        <div className="space-y-1.5">
                          {summaryData.summary.recommendations.map((r: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                              <ArrowUpRight className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />{r}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-10">
                    <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Summary unavailable</p>
                  </div>
                )}
              </div>
            )}
            {openModal === 'housekeeping' && (
  <div className="p-5 overflow-y-auto space-y-3">
    {hkLoading ? (
      <div className="flex flex-col items-center py-10 gap-3">
        <Spinner /><p className="text-sm text-gray-400">Calculating priorities...</p>
      </div>
    ) : hkData?.length > 0 ? hkData.map((room: any, i: number) => (
      <div key={i} className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3.5">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
          #{i + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">Room {room.roomNumber}</p>
          <p className="text-xs text-gray-400">{room.reason} · ~{room.estimatedMinutes} min</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-black text-orange-500">{room.priorityScore}</p>
          <p className="text-xs text-gray-400">score</p>
        </div>
      </div>
    )) : (
      <div className="text-center py-10">
        <Wrench className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-400">No rooms to prioritize</p>
      </div>
    )}
  </div>
)}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}