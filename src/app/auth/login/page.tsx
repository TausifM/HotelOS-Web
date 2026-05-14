'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, Eye, EyeOff, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

const MELON = '#F97316';
const CORAL = '#F43F5E';
const AMBER = '#F59E0B';

const TOKEN = {
  bg: '#FFFBF7',
  surface: '#FFFFFF',
  border: '#F0E4D8',
  borderMid: '#E5CDB8',
  text: '#1C0A02',
  textSub: '#6B4535',
  textMuted: '#A8836C',
  melonPale: '#FFF3E6',
  melonLight: '#FED7AA',
};

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const f =
    (k: keyof typeof form) =>
      (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((p) => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', {
        email: form.email,
        password: form.password,
      });
      login({
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        staff: data.data.staff,
        tenant: data.data.tenant,
      });
      toast.success(`Welcome back, ${data.data.staff.name}!`);
      router.replace('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Full viewport, centered, no scroll */
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8"
      style={{
        background:
          'radial-gradient(circle at top left, rgba(249,115,22,0.10), transparent 24%), radial-gradient(circle at top right, rgba(244,63,94,0.08), transparent 20%), #FFFBF7',
      }}
    >
      <div className="w-full max-w-5xl grid lg:grid-cols-[1fr_420px] gap-6 items-stretch">

        {/* ── LEFT PANEL ── fills same height as right form */}
        <div className="hidden lg:flex flex-col">
          <div
            className="flex flex-col flex-1 rounded-[28px] overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #FFFBF7 0%, #FFF5EC 60%, #FFFAF6 100%)',
              border: `1.5px solid ${TOKEN.border}`,
              boxShadow: '0 20px 60px rgba(249,115,22,0.08)',
            }}
          >
            {/* Top content — padded */}
            <div className="p-7 xl:p-8 flex flex-col flex-1">

              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 self-start"
                style={{
                  background: TOKEN.melonPale,
                  border: `1.5px solid ${TOKEN.melonLight}`,
                  color: MELON,
                }}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full animate-pulse"
                  style={{ background: AMBER }}
                />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
                  HotelOS Platform
                </span>
              </div>

              {/* Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background: `linear-gradient(135deg, ${MELON} 0%, ${CORAL} 100%)`,
                  boxShadow: '0 12px 32px rgba(249,115,22,0.28)',
                }}
              >
                <Zap className="w-7 h-7 text-white" />
              </div>

              {/* Heading */}
              <h1
                className="text-3xl xl:text-4xl font-bold leading-tight"
                style={{
                  color: TOKEN.text,
                  fontFamily: 'var(--font-lora), Georgia, serif',
                }}
              >
                Less admin,<br />more five‑star.
              </h1>

              <p
                className="mt-3 text-sm leading-6"
                style={{ color: TOKEN.textSub }}
              >
                Manage staff, rooms, guests, housekeeping, billing, and
                concierge workflows from one elegant workspace.
              </p>

              {/* Feature cards — 2x2 grid */}
              <div className="grid grid-cols-2 gap-2.5 mt-5">
                {[
                  { title: 'AI ID Scan Check-In', desc: 'Auto-fill guest details by scanning any government ID.', bg: '#FFFBEB', border: '#FDE68A', color: AMBER },
                  { title: 'Voice Task Commands', desc: 'Create housekeeping tasks using simple voice commands.', bg: '#FFF1F2', border: '#FECDD3', color: CORAL },
                  { title: 'Dynamic Hotel Data', desc: 'Room rates, folios & Wi-Fi pulled live from your APIs.', bg: '#FFF7ED', border: '#FED7AA', color: MELON },
                  { title: 'Live Staff Workflows', desc: 'Real-time concierge updates and guest request handling.', bg: '#F5F3FF', border: '#DDD6FE', color: '#7C3AED' },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl p-3"
                    style={{ background: item.bg, border: `1.5px solid ${item.border}` }}
                  >
                    <p className="text-xs font-bold leading-4" style={{ color: item.color }}>
                      {item.title}
                    </p>
                    <p className="text-[11px] leading-4 mt-1" style={{ color: TOKEN.textMuted }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hotel image — flush at the bottom of the panel */}
            <div className="relative mt-auto">
              <img
                src="https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1400"
                alt="Luxury hotel with pool"
                className="w-full object-cover"
                style={{ height: '200px' }}
                loading="lazy"
              />
              {/* Top fade so image blends into card */}
              <div
                className="absolute top-0 left-0 right-0 h-10"
                style={{
                  background: 'linear-gradient(to bottom, #FFF5EC, transparent)',
                }}
              />
              {/* Trust badge over image */}
              <div
                className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl px-3.5 py-2"
                style={{
                  background: 'rgba(255,255,255,0.86)',
                  border: `1px solid ${TOKEN.border}`,
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div>
                  <p className="text-xs font-bold" style={{ color: TOKEN.text }}>
                    Trusted by 12,000+ hotels
                  </p>
                  <p className="text-[10px]" style={{ color: TOKEN.textMuted }}>
                    across India
                  </p>
                </div>
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    background: TOKEN.melonPale,
                    color: MELON,
                    border: `1px solid ${TOKEN.melonLight}`,
                  }}
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: MELON }}
                  />
                  Live
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: LOGIN FORM ── */}
        <div className="flex flex-col justify-center w-full">

          {/* Mobile logo */}
          <div className="text-center mb-5 lg:hidden">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3"
              style={{
                background: `linear-gradient(135deg, ${MELON} 0%, ${CORAL} 100%)`,
                boxShadow: '0 10px 24px rgba(249,115,22,0.25)',
              }}
            >
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold" style={{ color: TOKEN.text, fontFamily: 'var(--font-lora), Georgia, serif' }}>
              HotelOS
            </h1>
          </div>

          <div
            className="rounded-[28px] p-6 sm:p-8"
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
            {/* Header */}
            <div className="mb-6">

              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                style={{
                  background: TOKEN.melonPale,
                  border: `1.5px solid ${TOKEN.melonLight}`,
                  color: MELON,
                }}
              >
                <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
                  Welcome Back
                </span>
              </div>

              <h2
                className="text-2xl font-bold"
                style={{ color: TOKEN.text, fontFamily: 'var(--font-lora), Georgia, serif' }}
              >
                Sign in to HotelOS
              </h2>
              <p className="text-sm mt-1.5" style={{ color: TOKEN.textMuted }}>
                Use your work email and password to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: TOKEN.textSub }}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@hotel.com"
                  value={form.email}
                  onChange={f('email')}
                  required
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    background: TOKEN.surface,
                    border: `1.5px solid ${TOKEN.borderMid}`,
                    color: TOKEN.text,
                    boxShadow: '0 2px 10px rgba(249,115,22,0.04)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = TOKEN.melonLight;
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(249,115,22,0.10)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = TOKEN.borderMid;
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(249,115,22,0.04)';
                  }}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium" style={{ color: TOKEN.textSub }}>
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-medium underline-offset-2 hover:underline"
                    style={{ color: MELON }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={f('password')}
                    required
                    className="w-full rounded-2xl px-4 py-3 pr-11 text-sm outline-none transition-all"
                    style={{
                      background: TOKEN.surface,
                      border: `1.5px solid ${TOKEN.borderMid}`,
                      color: TOKEN.text,
                      boxShadow: '0 2px 10px rgba(249,115,22,0.04)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = TOKEN.melonLight;
                      e.currentTarget.style.boxShadow = '0 0 0 4px rgba(249,115,22,0.10)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = TOKEN.borderMid;
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(249,115,22,0.04)';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: TOKEN.textMuted }}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl py-3.5 text-sm font-bold text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${MELON} 0%, ${CORAL} 100%)`,
                  boxShadow: '0 12px 28px rgba(249,115,22,0.28)',
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div
              className="mt-6 pt-5 text-center"
              style={{ borderTop: `1px solid ${TOKEN.border}` }}
            >
              <p className="text-sm" style={{ color: TOKEN.textMuted }}>
                New hotel?{' '}
                <Link
                  href="/auth/register"
                  className="font-semibold hover:underline"
                  style={{ color: MELON }}
                >
                  Start free 4-month trial
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}