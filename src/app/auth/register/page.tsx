'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  Zap,
  MessageSquare,
  Globe,
  FileText,
  Star,
  LayoutGrid,
  CheckCircle2,
  ArrowRight,
  Shield,
  Sparkles,
  Loader2,
  Hotel,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  BedDouble,
  Building2,
  EyeOff,
  Eye,
  ArrowLeft,
} from 'lucide-react';

const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const MELON = '#F97316';
const CORAL = '#F43F5E';
const AMBER = '#F59E0B';
const TEAL = '#0D9488';
const VIOLET = '#7C3AED';

const TOKEN = {
  bg: '#FFFBF7',
  panel: '#FFF7EF',
  surface: '#FFFFFF',
  border: '#F0E4D8',
  borderMid: '#E5CDB8',
  text: '#1C0A02',
  textSub: '#6B4535',
  textMuted: '#A8836C',
  melonPale: '#FFF3E6',
  melonLight: '#FED7AA',
};

const benefits = [
  {
    icon: <Zap className="w-4 h-4" />,
    title: 'AI Revenue Intelligence',
    desc: 'Auto-adjust pricing for weekends, events, and demand spikes to improve RevPAR.',
    bg: '#FFFBEB',
    border: '#FDE68A',
    color: AMBER,
  },
  {
    icon: <MessageSquare className="w-4 h-4" />,
    title: 'WhatsApp Guest Comms',
    desc: 'Send check-in links, reminders, service updates, and upsell offers automatically.',
    bg: '#F0FDFA',
    border: '#99F6E4',
    color: TEAL,
  },
  {
    icon: <Globe className="w-4 h-4" />,
    title: 'Channel Manager',
    desc: 'Keep inventory, rates, and availability synced across OTAs in real time.',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    color: '#2563EB',
  },
  {
    icon: <FileText className="w-4 h-4" />,
    title: 'GST & Billing',
    desc: 'Generate invoice-ready exports and keep finance ops cleaner for your team.',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    color: VIOLET,
  },
  {
    icon: <Star className="w-4 h-4" />,
    title: 'Guest Experience Layer',
    desc: 'Concierge, loyalty, requests, and messaging from one connected guest flow.',
    bg: '#FFF1F2',
    border: '#FECDD3',
    color: CORAL,
  },
  {
    icon: <LayoutGrid className="w-4 h-4" />,
    title: 'Hotel Operations Hub',
    desc: 'Run rooms, tasks, events, staff, and service workflows from one system.',
    bg: '#FFF7ED',
    border: '#FED7AA',
    color: MELON,
  },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-sm font-semibold mb-1.5"
      style={{ color: TOKEN.textSub }}
    >
      {children}
    </label>
  );
}

function InputWrap({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all"
      style={{
        background: TOKEN.surface,
        border: `1.5px solid ${TOKEN.borderMid}`,
        boxShadow: '0 2px 10px rgba(249,115,22,0.04)',
      }}
    >
      <div style={{ color: TOKEN.textMuted }}>{icon}</div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    hotelName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
    gstin: '',
    totalRooms: '',
    category: 'standard',
  });

  const f =
    (k: keyof typeof form) =>
      (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
      ) =>
        setForm((p) => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const res = await api.post(
        '/api/auth/register',
        form,
        { withCredentials: true }
      );

      setSuccess(true);

      toast.success(
        res?.data?.message || 'Registration successful. Your free trial has started.'
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-10"
        style={{
          background:
            'radial-gradient(circle at top left, rgba(249,115,22,0.10), transparent 24%), radial-gradient(circle at top right, rgba(244,63,94,0.08), transparent 20%), #FFFBF7',
        }}
      >
        <div
          className="w-full max-w-md rounded-[32px] p-8 text-center"
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF9F4 100%)',
            border: `1.5px solid ${TOKEN.border}`,
            boxShadow: '0 24px 70px rgba(249,115,22,0.10)',
          }}
        >
          <div
            className="w-20 h-20 rounded-[28px] mx-auto mb-6 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.14), rgba(16,185,129,0.08))',
              border: '1.5px solid rgba(16,185,129,0.18)',
            }}
          >
            <CheckCircle2 className="w-11 h-11 text-emerald-500" />
          </div>

          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{
              background: TOKEN.melonPale,
              border: `1.5px solid ${TOKEN.melonLight}`,
              color: MELON,
            }}
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
              Trial activated
            </span>
          </div>

          <h2
            className="text-3xl font-bold mb-2"
            style={{
              color: TOKEN.text,
              fontFamily: 'var(--font-lora), Georgia, serif',
            }}
          >
            Welcome aboard
          </h2>

          <p
            className="text-sm leading-6 mb-8"
            style={{ color: TOKEN.textMuted }}
          >
            Your 120-day free trial has started. Check your email for the next
            steps and sign in when you are ready.
          </p>

          <button
            onClick={() => router.push('/auth/login')}
            className="w-full rounded-2xl py-3.5 text-sm font-bold text-white transition-all"
            style={{
              background: `linear-gradient(135deg, ${MELON} 0%, ${CORAL} 100%)`,
              boxShadow: '0 12px 28px rgba(249,115,22,0.28)',
            }}
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen lg:grid lg:grid-cols-[1.02fr_0.98fr]"
      style={{ background: TOKEN.bg }}
    >
      <aside
        className="relative overflow-hidden px-6 py-10 sm:px-8 lg:px-14 xl:px-16 lg:min-h-screen"
        style={{
          background: 'linear-gradient(180deg, #FFFBF7 0%, #FFF5EC 55%, #FFFAF6 100%)',
          borderRight: `1.5px solid ${TOKEN.border}`,
        }}
      >
        <div
          className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-[110px]"
          style={{ background: 'rgba(249,115,22,0.12)' }}
        />
        <div
          className="absolute right-0 top-24 w-72 h-72 rounded-full blur-[110px]"
          style={{ background: 'rgba(244,63,94,0.08)' }}
        />

        <div className="relative z-10 max-w-xl">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
            style={{
              background: TOKEN.melonPale,
              border: `1.5px solid ${TOKEN.melonLight}`,
              color: MELON,
            }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full animate-pulse"
              style={{ background: TEAL }}
            />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
              Hotels platform
            </span>
          </div>

          <div className="flex items-center gap-3 mb-7">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${MELON} 0%, ${CORAL} 100%)`,
                boxShadow: '0 16px 40px rgba(249,115,22,0.28)',
              }}
            >
              <Zap className="w-7 h-7 text-white" />
            </div>

            <div>
              <div
                className="text-[28px] font-black leading-none"
                style={{ color: TOKEN.text }}
              >
                HotelOS
              </div>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.18em] mt-1"
                style={{ color: TOKEN.textMuted }}
              >
                Hotel operating system
              </p>
            </div>
          </div>

          <h1
            className="text-4xl sm:text-5xl xl:text-6xl font-bold leading-[1.04] tracking-tight"
            style={{
              color: TOKEN.text,
              fontFamily: 'var(--font-lora), Georgia, serif',
            }}
          >
            Run your hotel
            <br />
            with a more
            <br />
            beautiful backbone.
          </h1>

          <p
            className="mt-5 text-[15px] sm:text-base leading-7 max-w-lg"
            style={{ color: TOKEN.textSub }}
          >
            HotelOS helps Indian hotels manage guest journeys, pricing, service,
            billing, and operations from one premium workflow.
          </p>

          <div
            className="rounded-[28px] p-5 mt-8"
            style={{
              background: 'linear-gradient(135deg, rgba(249,115,22,0.09) 0%, rgba(244,63,94,0.05) 100%)',
              border: `1.5px solid ${TOKEN.melonLight}`,
            }}
          >
            <p
              className="text-sm font-semibold leading-7"
              style={{ color: TOKEN.textSub }}
            >
              Launch faster with a 4-month free trial, no complicated setup, and
              a team-friendly experience for front desk, operations, and owners.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mt-8">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-2xl p-4 transition-all hover:-translate-y-[1px]"
                style={{
                  background: benefit.bg,
                  border: `1.5px solid ${benefit.border}`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    background: '#fff',
                    color: benefit.color,
                    boxShadow: '0 4px 12px rgba(28,10,2,0.05)',
                  }}
                >
                  {benefit.icon}
                </div>
                <h4
                  className="text-sm font-bold mb-1.5"
                  style={{ color: benefit.color }}
                >
                  {benefit.title}
                </h4>
                <p
                  className="text-[12px] leading-5"
                  style={{ color: TOKEN.textMuted }}
                >
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10 xl:px-16">
        <div className="w-full max-w-xl">
          <div
            className="rounded-[32px] p-6 sm:p-8"
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF9F4 100%)',
              border: `1.5px solid ${TOKEN.border}`,
              boxShadow: '0 24px 70px rgba(249,115,22,0.10)',
            }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium mb-5 hover:underline"
              style={{ color: MELON }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="mb-8">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                style={{
                  background: TOKEN.melonPale,
                  border: `1.5px solid ${TOKEN.melonLight}`,
                  color: MELON,
                }}
              >
                <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
                  Start free trial
                </span>
              </div>

              <h2
                className="text-3xl sm:text-4xl font-bold tracking-tight"
                style={{
                  color: TOKEN.text,
                  fontFamily: 'var(--font-lora), Georgia, serif',
                }}
              >
                Create your hotel workspace
              </h2>

              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    background: '#FFF7ED',
                    color: MELON,
                    border: '1px solid #FED7AA',
                  }}
                >
                  4 Months Free
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: TOKEN.borderMid }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: TOKEN.textMuted }}
                >
                  Built for Indian hotels
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Hotel Name</FieldLabel>
                  <InputWrap icon={<Hotel className="w-4 h-4" />}>
                    <input
                      type="text"
                      value={form.hotelName}
                      onChange={f('hotelName')}
                      placeholder="Grand Resort"
                      required
                      className="w-full bg-transparent outline-none text-sm"
                      style={{ color: TOKEN.text }}
                    />
                  </InputWrap>
                </div>

                <div>
                  <FieldLabel>Owner Name</FieldLabel>
                  <InputWrap icon={<User className="w-4 h-4" />}>
                    <input
                      type="text"
                      value={form.ownerName}
                      onChange={f('ownerName')}
                      placeholder="Raj Sharma"
                      required
                      className="w-full bg-transparent outline-none text-sm"
                      style={{ color: TOKEN.text }}
                    />
                  </InputWrap>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Email Address</FieldLabel>
                  <InputWrap icon={<Mail className="w-4 h-4" />}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={f('email')}
                      placeholder="you@hotel.com"
                      required
                      className="w-full bg-transparent outline-none text-sm"
                      style={{ color: TOKEN.text }}
                    />
                  </InputWrap>
                </div>

                <div>
                  <FieldLabel>Phone Number</FieldLabel>
                  <InputWrap icon={<Phone className="w-4 h-4" />}>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                        }))
                      }
                      placeholder="9876543210"
                      maxLength={10}
                      required
                      style={{ color: TOKEN.text }}
                    />
                  </InputWrap>
                </div>
              </div>

              <div>
                <FieldLabel>Secure Password</FieldLabel>
                <InputWrap icon={<Lock className="w-4 h-4" />}>
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={f('password')}
                      placeholder="Minimum 8 characters"
                      required
                      className="w-full bg-transparent outline-none text-sm"
                      style={{ color: TOKEN.text }}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all"
                      style={{
                        color: TOKEN.textMuted,
                        background: showPassword ? TOKEN.melonPale : 'transparent',
                        border: showPassword ? `1px solid ${TOKEN.melonLight}` : '1px solid transparent',
                      }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </InputWrap>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>City</FieldLabel>
                  <InputWrap icon={<MapPin className="w-4 h-4" />}>
                    <input
                      type="text"
                      value={form.city}
                      onChange={f('city')}
                      placeholder="Mumbai"
                      required
                      className="w-full bg-transparent outline-none text-sm"
                      style={{ color: TOKEN.text }}
                    />
                  </InputWrap>
                </div>

                <div>
                  <FieldLabel>State</FieldLabel>
                  <InputWrap icon={<Building2 className="w-4 h-4" />}>
                    <select
                      value={form.state}
                      onChange={f('state')}
                      className="w-full bg-transparent outline-none text-sm"
                      style={{ color: TOKEN.text }}
                    >
                      {STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </InputWrap>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Total Rooms</FieldLabel>
                  <InputWrap icon={<BedDouble className="w-4 h-4" />}>
                    <input
                      type="number"
                      value={form.totalRooms}
                      onChange={f('totalRooms')}
                      placeholder="50"
                      required
                      className="w-full bg-transparent outline-none text-sm"
                      style={{ color: TOKEN.text }}
                    />
                  </InputWrap>
                </div>

                <div>
                  <FieldLabel>Category</FieldLabel>
                  <InputWrap icon={<Building2 className="w-4 h-4" />}>
                    <select
                      value={form.category}
                      onChange={f('category')}
                      className="w-full bg-transparent outline-none text-sm capitalize"
                      style={{ color: TOKEN.text }}
                    >
                      {['budget', 'standard', 'deluxe', 'luxury', 'boutique', 'resort', 'hostel'].map((c) => (
                        <option key={c} value={c} className="capitalize">
                          {c}
                        </option>
                      ))}
                    </select>
                  </InputWrap>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Pincode <span style={{ color: TOKEN.textMuted }}>(optional)</span></FieldLabel>
                  <InputWrap icon={<MapPin className="w-4 h-4" />}>
                    <input
                      type="text"
                      value={form.pincode}
                      onChange={f('pincode')}
                      placeholder="440001"
                      className="w-full bg-transparent outline-none text-sm"
                      style={{ color: TOKEN.text }}
                    />
                  </InputWrap>
                </div>

                <div>
                  <FieldLabel>GSTIN <span style={{ color: TOKEN.textMuted }}>(optional)</span></FieldLabel>
                  <InputWrap icon={<FileText className="w-4 h-4" />}>
                    <input
                      type="text"
                      value={form.gstin}
                      onChange={f('gstin')}
                      placeholder="27ABCDE1234F1Z5"
                      className="w-full bg-transparent outline-none text-sm"
                      style={{ color: TOKEN.text }}
                    />
                  </InputWrap>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl py-4 text-sm font-bold text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(135deg, ${MELON} 0%, ${CORAL} 100%)`,
                    boxShadow: '0 12px 28px rgba(249,115,22,0.28)',
                  }}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Workspace...
                      </>
                    ) : (
                      <>
                        Start Free Trial
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </span>
                </button>

                <div className="mt-6 flex flex-col items-center gap-5">
                  <div className="flex flex-wrap items-center justify-center gap-5">
                    <div
                      className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]"
                      style={{ color: TOKEN.textMuted }}
                    >
                      <Shield className="w-4 h-4" />
                      SSL Secure
                    </div>
                    <div
                      className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]"
                      style={{ color: TOKEN.textMuted }}
                    >
                      <Sparkles className="w-4 h-4" />
                      Instant Setup
                    </div>
                  </div>

                  <p
                    className="text-sm font-medium text-center"
                    style={{ color: TOKEN.textMuted }}
                  >
                    Already registered?{' '}
                    <Link
                      href="/auth/login"
                      className="font-semibold hover:underline"
                      style={{ color: MELON }}
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}