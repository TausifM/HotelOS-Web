'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Spinner } from '@/components/ui';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  Sparkles,
  Star,
  AlertTriangle,
  Mic,
  MicOff,
  Moon,
  TrendingUp,
  Copy,
  CheckCircle,
  QrCode,
  MessageSquare,
  Bot,
  Zap,
  RefreshCw,
  Wand2,
  ChevronRight,
  ShieldAlert,
  Download,
  ExternalLink,
  Activity,
  Clock3,
  BadgeCheck,
  Brain,
} from 'lucide-react';
import toast from 'react-hot-toast';

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/70 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-white"
      type="button"
    >
      {copied ? (
        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-pink-600" />
      )}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function RiskBadge({ level }: { level: string }) {
  const cls =
    level === 'high'
      ? 'bg-rose-100 text-rose-700 border-rose-200'
      : level === 'medium'
        ? 'bg-amber-100 text-amber-700 border-amber-200'
        : 'bg-emerald-100 text-emerald-700 border-emerald-200';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
        cls
      )}
    >
      {level}
    </span>
  );
}

function FeatureShell({
  icon: Icon,
  title,
  subtitle,
  badge,
  gradient,
  children,
}: {
  icon: any;
  title: string;
  subtitle: string;
  badge?: string;
  gradient: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[30px] border border-white/70 bg-white/85 shadow-[0_24px_80px_-40px_rgba(255,115,85,0.35)] backdrop-blur">
      <div className={cn('relative border-b border-white/40 px-5 py-5 md:px-6', gradient)}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white/20 p-3 text-white shadow-lg backdrop-blur">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{title}</h3>
              <p className="mt-1 max-w-2xl text-sm text-white/85">{subtitle}</p>
            </div>
          </div>
          {badge ? (
            <div className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white/90">
              {badge}
            </div>
          ) : null}
        </div>
      </div>
      <div className="bg-gradient-to-b from-orange-50/50 via-white to-pink-50/40 p-5 md:p-6">
        {children}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: any;
  tone: string;
}) {
  return (
    <div className={cn('rounded-3xl border p-4 shadow-sm', tone)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
        </div>
        <div className="rounded-2xl bg-white/80 p-3">
          <Icon className="h-5 w-5 text-slate-700" />
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
      {children}
    </label>
  );
}

export default function AIFeaturesPage() {
  const [activeTab, setActiveTab] = useState('review');

  const [review, setReview] = useState('');
  const [rating, setRating] = useState(3);
  const [platform, setPlatform] = useState('Google');
  const [reviewResponse, setReviewResponse] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const [transcript, setTranscript] = useState('');
  const [voiceResult, setVoiceResult] = useState<any>(null);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [voiceDebug, setVoiceDebug] = useState('Idle');
  const [voiceLang, setVoiceLang] = useState("hi-IN"); // Hindi default

  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [auditResult, setAuditResult] = useState<any>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const [qrReservationId, setQrReservationId] = useState('');
  const [qrData, setQrData] = useState<any>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const {
    data: complaints,
    isLoading: complaintsLoading,
    refetch: refetchComplaints,
  } = useQuery({
    queryKey: ['ai-complaints'],
    queryFn: () => api.get('/api/ai-features/predict/complaints').then((r) => r.data.data),
    enabled: activeTab === 'complaints',
  });

  const complaintStats = useMemo(() => {
    const list = complaints || [];
    return {
      total: list.length,
      high: list.filter((c: any) => c.riskLevel === 'high').length,
      medium: list.filter((c: any) => c.riskLevel === 'medium').length,
      low: list.filter((c: any) => c.riskLevel === 'low').length,
    };
  }, [complaints]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported = !!(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );

    setVoiceSupported(supported);
    setVoiceDebug(
      supported
        ? 'SpeechRecognition available'
        : 'SpeechRecognition not supported in this browser'
    );
  }, []);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.();
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      } catch (err) {
        console.error('Voice cleanup error', err);
      }
    };
  }, []);

  async function generateReviewResponse() {
    if (!review.trim()) {
      toast.error('Paste a guest review first');
      return;
    }

    setReviewLoading(true);
    try {
      const { data } = await api.post('/api/ai-features/review/generate-response', {
        review,
        rating,
        platform,
      });
      setReviewResponse(data.data.response);
      toast.success('Response generated');
    } catch {
      toast.error('Failed to generate response');
    } finally {
      setReviewLoading(false);
    }
  }

  async function ensureMicrophoneAccess() {
    try {
      setVoiceDebug('Requesting microphone permission...');

      if (!navigator.mediaDevices?.getUserMedia) {
        setVoiceDebug('getUserMedia not supported');
        throw new Error('Microphone API not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      setMicPermission('granted');
      setVoiceDebug('Microphone permission granted');
      return true;
    } catch (error: any) {
      console.error('Microphone access error:', error);
      setMicPermission('denied');

      if (error?.name === 'NotAllowedError') {
        setVoiceDebug('Permission denied by user/browser');
        toast.error('Microphone permission denied. Please allow microphone access.');
      } else if (error?.name === 'NotFoundError') {
        setVoiceDebug('No microphone device found');
        toast.error('No microphone found on this device.');
      } else if (error?.name === 'NotReadableError') {
        setVoiceDebug('Microphone is busy in another app/tab');
        toast.error('Microphone is being used by another app.');
      } else if (
        typeof window !== 'undefined' &&
        window.location.protocol !== 'https:' &&
        window.location.hostname !== 'localhost'
      ) {
        setVoiceDebug('Insecure origin');
        toast.error('Microphone works only on HTTPS or localhost.');
      } else {
        setVoiceDebug(`Microphone error: ${error?.name || 'Unknown error'}`);
        toast.error('Could not access microphone.');
      }

      return false;
    }
  }

  async function startRecording() {
    try {
      setVoiceDebug("Starting voice recognition...");

      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setVoiceSupported(false);
        toast.error("Voice recognition is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicPermission("granted");

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch { }
        recognitionRef.current = null;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = voiceLang; // "hi-IN" or "mr-IN"
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        setVoiceDebug(`Listening in ${voiceLang}...`);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          finalTranscript += event.results[i][0].transcript + " ";
        }
        setTranscript(finalTranscript.trim());
      };
recognition.onerror = (event: any) => {
  const error = event?.error || "unknown";

  setIsRecording(false);

  console.log("VOICE ERROR:", error);

  setVoiceDebug(`Voice error: ${error}`);

  toast.error(`Voice error: ${error}`);
};

      recognition.onend = () => {
        setIsRecording(false);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };

      recognition.start();
    } catch (error) {
      console.error(error);
      setIsRecording(false);
      toast.error("Failed to start voice recognition.");
    }
  }

  function stopRecording() {
    try {
      setVoiceDebug('Stopping recognition...');
      recognitionRef.current?.stop();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      setIsRecording(false);
      toast.success('Recording stopped');
    } catch (error) {
      console.error('stopRecording error:', error);
      setVoiceDebug('Stop failed');
      toast.error('Failed to stop recording.');
    }
  }

async function processVoiceTask() {
  if (!transcript.trim()) {
    toast.error('Record or type a voice command first');
    return;
  }

  setVoiceLoading(true);
  setVoiceResult(null);

  try {
    const currentTranscript = transcript.trim();

    const { data } = await api.post('/api/ai-features/voice/transcribe-task', {
      transcript: currentTranscript,
    });

    setVoiceResult(data.data);

    if (data.data.taskCreated) {
      toast.success(`Task created: ${data.data.description}`);
      setTranscript('');
    } else {
      toast.success('Command processed');
    }
  } catch {
    toast.error('Failed to process command');
  } finally {
    setVoiceLoading(false);
  }
}

  async function runNightAudit() {
    setAuditLoading(true);
    try {
      const { data } = await api.post('/api/ai-features/night-audit');
      setAuditResult(data.data);
      toast.success(`Night audit complete — ${data.data.roomChargesPosted} room charges posted`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Audit failed');
    } finally {
      setAuditLoading(false);
    }
  }

  async function generateQR() {
    if (!qrReservationId.trim()) {
      toast.error('Enter a reservation ID');
      return;
    }

    setQrLoading(true);
    try {
      const { data } = await api.post(`/api/self-checkin/generate-link/${qrReservationId}`);
      setQrData(data.data);
      toast.success('Check-in QR generated');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setQrLoading(false);
    }
  }

  const TABS = [
    { id: 'review', label: 'Review AI', icon: Star, note: 'Replies in seconds' },
    { id: 'complaints', label: 'Complaint Alert', icon: AlertTriangle, note: 'Risk radar' },
    { id: 'voice', label: 'Voice to Task', icon: Mic, note: 'Speech workflow' },
    { id: 'audit', label: 'Night Audit', icon: Moon, note: 'Daily close' },
    { id: 'checkin', label: 'Self Check-in QR', icon: QrCode, note: 'Guest self-service' },
  ];

  return (
    <DashboardLayout title="AI Features">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,141,77,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(255,78,145,0.18),_transparent_30%),linear-gradient(180deg,#fff8f3_0%,#fffdfb_50%,#fff6fb_100%)] px-4 py-6 md:px-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="overflow-hidden rounded-[34px] border border-orange-200/70 bg-gradient-to-r from-orange-400 via-pink-500 to-fuchsia-500 p-[1px] shadow-[0_30px_120px_-30px_rgba(255,115,85,0.45)]">
            <div className="relative rounded-[33px] bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500 px-6 py-7 text-white md:px-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.10),transparent_28%)]" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-white/95 backdrop-blur-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    Premium AI Control Center
                  </div>
                  <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                    AI Features
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                    Run guest-facing and staff-facing AI tools from one premium console — review replies,
                    proactive complaint prediction, voice commands, night audit, and self check-in QR.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-3xl border border-white/15 bg-white/12 p-4 backdrop-blur">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/75">Modules</p>
                    <p className="mt-2 text-2xl font-black">5</p>
                  </div>
                  <div className="rounded-3xl border border-white/15 bg-white/12 p-4 backdrop-blur">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/75">AI Ops</p>
                    <p className="mt-2 text-2xl font-black">Live</p>
                  </div>
                  <div className="rounded-3xl border border-white/15 bg-white/12 p-4 backdrop-blur">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/75">Voice</p>
                    <p className="mt-2 text-2xl font-black">Ready</p>
                  </div>
                  <div className="rounded-3xl border border-white/15 bg-white/12 p-4 backdrop-blur">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/75">QR</p>
                    <p className="mt-2 text-2xl font-black">Enabled</p>
                  </div>
                </div>
              </div>

              <div className="relative mt-7 flex flex-wrap gap-3">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'group inline-flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition',
                        activeTab === tab.id
                          ? 'border-white/30 bg-white text-slate-900 shadow-lg'
                          : 'border-white/15 bg-white/10 text-white hover:bg-white/16'
                      )}
                    >
                      <div
                        className={cn(
                          'rounded-xl p-2 transition',
                          activeTab === tab.id ? 'bg-orange-100 text-orange-600' : 'bg-white/10 text-white'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black">{tab.label}</p>
                        <p
                          className={cn(
                            'text-xs',
                            activeTab === tab.id ? 'text-slate-500' : 'text-white/75'
                          )}
                        >
                          {tab.note}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {activeTab === 'review' && (
            <FeatureShell
              icon={Star}
              title="AI Review Response Generator"
              subtitle="Paste any review from Google, TripAdvisor, Booking.com, or OTA platforms and get a polished professional response instantly."
              badge="Guest Reputation"
              gradient="bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500"
            >
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <SectionLabel>Platform</SectionLabel>
                      <select
                        className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-0 transition focus:border-orange-300"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                      >
                        {['Google', 'TripAdvisor', 'Booking.com', 'Expedia', 'MakeMyTrip', 'Agoda'].map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <SectionLabel>Rating</SectionLabel>
                      <select
                        className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-0 transition focus:border-orange-300"
                        value={rating}
                        onChange={(e) => setRating(parseInt(e.target.value))}
                      >
                        {[5, 4, 3, 2, 1].map((r) => (
                          <option key={r} value={r}>
                            {r} ★
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <SectionLabel>Guest Review</SectionLabel>
                    <textarea
                      rows={6}
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="Paste the guest review here..."
                      className="w-full rounded-[24px] border border-orange-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-pink-300"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      'Excellent staff and smooth stay.',
                      'Room was clean but breakfast was average.',
                      'Check-in was delayed and AC was not cooling.',
                    ].map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => setReview(sample)}
                        className="rounded-full border border-pink-200 bg-pink-50 px-3 py-2 text-xs font-bold text-pink-700 transition hover:bg-pink-100"
                      >
                        Use sample
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={generateReviewResponse}
                    loading={reviewLoading}
                    icon={<Wand2 className="h-4 w-4" />}
                  >
                    Generate Response
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[26px] border border-orange-100 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">Generated Response</p>
                        <p className="text-xs text-slate-500">Ready to copy, edit, and publish</p>
                      </div>
                      {reviewResponse ? <CopyButton text={reviewResponse} /> : null}
                    </div>

                    {reviewResponse ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="whitespace-pre-wrap text-sm leading-6 text-emerald-900">
                          {reviewResponse}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 p-6 text-center">
                        <MessageSquare className="mx-auto h-8 w-8 text-orange-400" />
                        <p className="mt-3 text-sm font-bold text-slate-700">No response generated yet</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Pick a platform, rating, paste the review, and generate your reply.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <StatTile label="Platform" value={platform} icon={Star} tone="border-orange-100 bg-orange-50/80" />
                    <StatTile label="Rating" value={`${rating}/5`} icon={TrendingUp} tone="border-pink-100 bg-pink-50/80" />
                  </div>
                </div>
              </div>
            </FeatureShell>
          )}

          {activeTab === 'complaints' && (
            <FeatureShell
              icon={AlertTriangle}
              title="Guest Complaint Predictor"
              subtitle="AI analyses current guest signals and flags who may need preventive action before a complaint is raised."
              badge="Preventive Intelligence"
              gradient="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-400"
            >
              <div className="mb-5 grid gap-3 md:grid-cols-4">
                <StatTile label="Total Risks" value={complaintStats.total} icon={ShieldAlert} tone="border-orange-100 bg-orange-50/80" />
                <StatTile label="High" value={complaintStats.high} icon={AlertTriangle} tone="border-rose-100 bg-rose-50/80" />
                <StatTile label="Medium" value={complaintStats.medium} icon={Activity} tone="border-amber-100 bg-amber-50/80" />
                <StatTile label="Low" value={complaintStats.low} icon={BadgeCheck} tone="border-emerald-100 bg-emerald-50/80" />
              </div>

              <div className="mb-5 flex justify-end">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => refetchComplaints()}
                  loading={complaintsLoading}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Predictions
                </Button>
              </div>

              {complaintsLoading ? (
                <div className="flex justify-center py-16">
                  <Spinner />
                </div>
              ) : !complaints?.length ? (
                <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-10 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
                  <p className="mt-3 text-lg font-black text-emerald-900">All clear</p>
                  <p className="mt-1 text-sm text-emerald-700">
                    No complaint risks detected for current guests.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {complaints.map((c: any, i: number) => (
                    <div
                      key={i}
                      className={cn(
                        'rounded-[26px] border p-5 shadow-sm',
                        c.riskLevel === 'high'
                          ? 'border-rose-200 bg-rose-50'
                          : c.riskLevel === 'medium'
                            ? 'border-amber-200 bg-amber-50'
                            : 'border-emerald-200 bg-emerald-50'
                      )}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-black text-slate-900">{c.guestName}</p>
                            <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold text-slate-600">
                              Room {c.roomNumber}
                            </span>
                            <RiskBadge level={c.riskLevel} />
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl bg-white/70 p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Predicted issue</p>
                              <p className="mt-2 text-sm font-medium text-slate-800">{c.predictedIssue}</p>
                            </div>
                            <div className="rounded-2xl bg-white/70 p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Preventive action</p>
                              <p className="mt-2 text-sm font-medium text-slate-800">{c.preventiveAction}</p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white/80 px-4 py-3 text-right">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Urgency</p>
                          <p className="mt-2 text-sm font-black capitalize text-slate-900">{c.urgency}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FeatureShell>
          )}

          {activeTab === 'voice' && (
            <FeatureShell
              icon={Mic}
              title="Voice to Task"
              subtitle="Let staff speak naturally and convert spoken requests into structured tasks for operations."
              badge="Speech Workflow"
              gradient="bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500"
            >
              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-5">
                  <div className="rounded-[28px] border border-sky-100 bg-white p-6 text-center shadow-sm">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={cn(
                        'mx-auto flex h-28 w-28 items-center justify-center rounded-full shadow-[0_20px_60px_-20px_rgba(59,130,246,0.45)] transition',
                        isRecording
                          ? 'scale-110 bg-gradient-to-br from-rose-500 to-red-500 animate-pulse'
                          : 'bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500'
                      )}
                    >
                      {isRecording ? (
                        <MicOff className="h-10 w-10 text-white" />
                      ) : (
                        <Mic className="h-10 w-10 text-white" />
                      )}
                    </button>
                    <p className="mt-4 text-sm font-bold text-slate-800">
                      {isRecording ? 'Recording... tap to stop' : 'Tap to speak'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Use Chrome or Edge on HTTPS or localhost with microphone permission enabled
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Voice status
                    </p>
                    <div className="mb-4">
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        Voice Language
                      </label>
                      <select
                        value={voiceLang}
                        onChange={(e) => setVoiceLang(e.target.value)}
                        className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                      >
                        <option value="hi-IN">Hindi</option>
                        <option value="mr-IN">Marathi</option>
                      </select>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Browser support</span>
                        <span className={cn('font-bold', voiceSupported ? 'text-emerald-600' : 'text-rose-600')}>
                          {voiceSupported ? 'Supported' : 'Not supported'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Microphone permission</span>
                        <span
                          className={cn(
                            'font-bold',
                            micPermission === 'granted'
                              ? 'text-emerald-600'
                              : micPermission === 'denied'
                                ? 'text-rose-600'
                                : 'text-amber-600'
                          )}
                        >
                          {micPermission}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Environment</span>
                        <span
                          className={cn(
                            'font-bold',
                            typeof window !== 'undefined' &&
                              (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          )}
                        >
                          {typeof window !== 'undefined' &&
                            (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
                            ? 'Secure'
                            : 'Insecure'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-indigo-200 bg-indigo-50 p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">
                      Voice Debug
                    </p>
                    <p className="break-words text-sm font-medium text-indigo-900">{voiceDebug}</p>
                  </div>

                  <div>
                    <SectionLabel>Manual Command</SectionLabel>
                    <textarea
                      rows={4}
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      placeholder="Room 201 needs extra towels, AC not working in 304..."
                      className="w-full rounded-[24px] border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-300"
                    />
                  </div>

                  <Button
                    onClick={processVoiceTask}
                    loading={voiceLoading}
                    disabled={!transcript.trim()}
                    className="w-full"
                    icon={<Zap className="h-4 w-4" />}
                  >
                    Process Command
                  </Button>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Try examples
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Room 201 needs extra towels',
                        'AC not working in room 304',
                        'Send flowers to suite 501',
                        'Guest in 102 complained about noise',
                      ].map((ex) => (
                        <button
                          key={ex}
                          onClick={() => setTranscript(ex)}
                          className="rounded-full border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-50"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-indigo-500" />
                    <p className="text-sm font-black text-slate-900">AI Interpretation</p>
                  </div>

                  {!voiceResult ? (
                    <div className="rounded-[24px] border border-dashed border-indigo-200 bg-indigo-50/50 p-10 text-center">
                      <Bot className="mx-auto h-10 w-10 text-indigo-400" />
                      <p className="mt-3 text-sm font-bold text-slate-800">No voice result yet</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Record or type a command to see parsed task details.
                      </p>
                    </div>
                  ) : voiceResult.understood ? (
                    <div
                      className={cn(
                        'space-y-4 rounded-[24px] border p-4',
                        voiceResult.taskCreated
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-sky-200 bg-sky-50'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {voiceResult.taskCreated ? (
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <Bot className="h-5 w-5 text-sky-600" />
                        )}
                        <p className="font-black text-slate-900">
                          {voiceResult.taskCreated ? 'Task created successfully' : 'Command understood'}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <StatTile label="Task Type" value={voiceResult.taskType || '—'} icon={Zap} tone="border-white/70 bg-white/70" />
                        <StatTile label="Room" value={voiceResult.roomNumber || '—'} icon={ChevronRight} tone="border-white/70 bg-white/70" />
                        <StatTile label="Priority" value={voiceResult.priority || '—'} icon={AlertTriangle} tone="border-white/70 bg-white/70" />
                        <StatTile label="Department" value={voiceResult.department || '—'} icon={BadgeCheck} tone="border-white/70 bg-white/70" />
                      </div>

                      <div className="rounded-2xl bg-white/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Description</p>
                        <p className="mt-2 text-sm text-slate-800">{voiceResult.description}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <p className="font-bold text-amber-900">Clarification needed</p>
                      </div>
                      <p className="mt-2 text-sm text-amber-800">
                        {voiceResult.clarificationNeeded || 'Could not understand'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </FeatureShell>
          )}

          {activeTab === 'audit' && (
            <FeatureShell
              icon={Moon}
              title="Night Audit"
              subtitle="Run the end-of-day close to post room charges, mark no-shows, and generate daily financial metrics."
              badge="Daily Close"
              gradient="bg-gradient-to-r from-slate-700 via-indigo-700 to-fuchsia-700"
            >
              <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-4">
                  <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5">
                    <p className="text-sm font-black text-amber-900">This will run</p>
                    <div className="mt-4 space-y-3 text-sm text-amber-800">
                      <div className="flex gap-3"><CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> Post room charges to checked-in folios</div>
                      <div className="flex gap-3"><CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> Mark overdue confirmed bookings as no-show</div>
                      <div className="flex gap-3"><CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> Generate occupancy and revenue summary</div>
                      <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" /> Run only once after midnight</div>
                    </div>
                  </div>

                  <Button
                    onClick={runNightAudit}
                    loading={auditLoading}
                    className="w-full"
                    icon={<Moon className="h-4 w-4" />}
                  >
                    Run Night Audit for Today
                  </Button>
                </div>

                <div>
                  {!auditResult ? (
                    <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                      <Clock3 className="mx-auto h-10 w-10 text-slate-400" />
                      <p className="mt-3 text-sm font-bold text-slate-800">No audit run yet</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Run the night audit to view occupancy, revenue, ADR, RevPAR, and posting totals.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-lg font-black text-slate-900">Audit Report</p>
                            <p className="text-sm text-slate-500">{auditResult.date}</p>
                          </div>
                          <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                            Completed
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <StatTile label="Occupancy" value={`${auditResult.occupancy?.pct || 0}%`} icon={TrendingUp} tone="border-white bg-white" />
                          <StatTile label="Revenue" value={formatCurrency(auditResult.revenue || 0)} icon={Sparkles} tone="border-white bg-white" />
                          <StatTile label="ADR" value={formatCurrency(auditResult.adr || 0)} icon={Activity} tone="border-white bg-white" />
                          <StatTile label="RevPAR" value={formatCurrency(auditResult.revpar || 0)} icon={BadgeCheck} tone="border-white bg-white" />
                          <StatTile label="Charges Posted" value={auditResult.roomChargesPosted} icon={CheckCircle} tone="border-white bg-white" />
                          <StatTile label="No-Shows" value={auditResult.noShowsMarked} icon={AlertTriangle} tone="border-white bg-white" />
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Audit metadata</p>
                        <p className="mt-2 text-sm text-slate-700">
                          Audited by <span className="font-bold">{auditResult.auditedBy}</span> at{' '}
                          <span className="font-bold">
                            {new Date(auditResult.auditedAt).toLocaleTimeString('en-IN')}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </FeatureShell>
          )}

          {activeTab === 'checkin' && (
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <FeatureShell
                icon={QrCode}
                title="Self Check-in QR Generator"
                subtitle="Generate a reservation-specific QR so guests can upload ID and complete self check-in before arriving."
                badge="Guest Self-Service"
                gradient="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"
              >
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={qrReservationId}
                      onChange={(e) => setQrReservationId(e.target.value)}
                      placeholder="Paste reservation ID..."
                      className="flex-1 rounded-2xl border border-emerald-100 bg-white px-4 py-3 font-mono text-sm text-slate-700 outline-none transition focus:border-emerald-300"
                    />
                    <Button onClick={generateQR} loading={qrLoading} icon={<QrCode className="h-4 w-4" />}>
                      Generate
                    </Button>
                  </div>

                  {qrData ? (
                    <div className="rounded-[28px] border border-emerald-100 bg-white p-5 text-center shadow-sm">
                      <div className="inline-block rounded-[28px] border-2 border-slate-200 bg-white p-5">
                        <img src={qrData.qrDataUrl} alt="Check-in QR" className="mx-auto h-52 w-52" />
                      </div>

                      <div className="mt-5 rounded-2xl bg-slate-50 px-3 py-3 text-left">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Check-in link</p>
                        <div className="mt-2 flex items-center gap-2">
                          <p className="flex-1 truncate font-mono text-xs text-slate-700">{qrData.checkInUrl}</p>
                          <CopyButton text={qrData.checkInUrl} />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <button
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = qrData.qrDataUrl;
                            a.download = 'checkin-qr.png';
                            a.click();
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Download className="h-4 w-4" />
                          Download QR
                        </button>

                        <button
                          onClick={() => {
                            const phone = qrData.guest?.phone || '';
                            const cleaned = phone.replace(/\D/g, '');
                            const number = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
                            const msg = `🏨 Complete your check-in online before arriving!\n\nScan QR or click: ${qrData.checkInUrl}\n\nUpload your ID and fill details — takes 2 minutes. Just collect the key when you arrive!`;
                            window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-600"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Send via WhatsApp
                        </button>
                      </div>

                      <p className="mt-4 text-xs font-medium text-slate-500">Link expires in 48 hours</p>
                    </div>
                  ) : (
                    <div className="rounded-[28px] border border-dashed border-emerald-200 bg-emerald-50/50 p-10 text-center">
                      <QrCode className="mx-auto h-10 w-10 text-emerald-400" />
                      <p className="mt-3 text-sm font-bold text-slate-800">No QR generated yet</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Enter a reservation ID to generate guest check-in access.
                      </p>
                    </div>
                  )}
                </div>
              </FeatureShell>

              <FeatureShell
                icon={BadgeCheck}
                title="Lobby QR Code"
                subtitle="Permanent hotel QR for reception or lobby display so walk-in or arriving guests can self-register."
                badge="Print & Display"
                gradient="bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500"
              >
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-orange-100 bg-white p-5">
                    <p className="text-sm text-slate-600">
                      Print this QR and place it at reception. Guests can scan and submit their pre-check-in details on their own phone.
                    </p>
                  </div>

                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL}/api/self-checkin/hotel-qr/${typeof window !== 'undefined' ? localStorage.getItem('stayos-tenant-id') || '' : ''
                      }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 px-4 py-3 text-sm font-bold text-white transition hover:brightness-105"
                  >
                    <QrCode className="h-4 w-4" />
                    Download Lobby QR
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </FeatureShell>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}