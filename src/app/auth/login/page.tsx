'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

const MELON = '#F97316';
const CORAL = '#F43F5E';
const AMBER = '#F59E0B';

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

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

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
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        background:
          'radial-gradient(circle at top left, rgba(249,115,22,0.10), transparent 24%), radial-gradient(circle at top right, rgba(244,63,94,0.08), transparent 20%), #FFFBF7',
      }}
    >
      <div className="w-full max-w-6xl grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-center">
        <div className="hidden lg:block">
          <div
            className="rounded-[32px] p-8 xl:p-10 h-full"
            style={{
              background: 'linear-gradient(180deg, #FFFBF7 0%, #FFF5EC 55%, #FFFAF6 100%)',
              border: `1.5px solid ${TOKEN.border}`,
              boxShadow: '0 20px 60px rgba(249,115,22,0.08)',
            }}
          >
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
                style={{ background: AMBER }}
              />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
                HotelOS Platform
              </span>
            </div>

            <div className="max-w-xl">
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6"
                style={{
                  background: `linear-gradient(135deg, ${MELON} 0%, ${CORAL} 100%)`,
                  boxShadow: '0 16px 40px rgba(249,115,22,0.28)',
                }}
              >
                <Zap className="w-8 h-8 text-white" />
              </div>

              <h1
                className="text-4xl xl:text-5xl font-bold leading-tight"
                style={{
                  color: TOKEN.text,
                  fontFamily: 'var(--font-lora), Georgia, serif',
                }}
              >
                Hospitality operations,
                <br />
                beautifully organized.
              </h1>

              <p
                className="mt-5 text-[15px] leading-7 max-w-lg"
                style={{ color: TOKEN.textSub }}
              >
                Manage staff, rooms, guests, housekeeping, maintenance, billing,
                and concierge workflows from one elegant workspace.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 mt-8">
                {[
                  {
                    title: 'AI ID Scan Check-In',
                    desc: 'Guests can scan an ID and auto-fill details instantly instead of typing manually.',
                    bg: '#FFFBEB',
                    border: '#FDE68A',
                    color: AMBER,
                  },
                  {
                    title: 'Voice Task Commands',
                    desc: 'Create housekeeping and maintenance tasks using simple voice commands for faster staff action.',
                    bg: '#FFF1F2',
                    border: '#FECDD3',
                    color: CORAL,
                  },
                  {
                    title: 'Dynamic Hotel Data',
                    desc: 'Room price, folio totals, Wi-Fi, and stay details should come from APIs, never hardcoded values.',
                    bg: '#FFF7ED',
                    border: '#FED7AA',
                    color: MELON,
                  },
                  {
                    title: 'Live Staff Workflows',
                    desc: 'Real-time concierge updates, status events, quick replies, and guest request handling in one place.',
                    bg: '#F5F3FF',
                    border: '#DDD6FE',
                    color: '#7C3AED',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl p-4"
                    style={{
                      background: item.bg,
                      border: `1.5px solid ${item.border}`,
                    }}
                  >
                    <p
                      className="text-sm font-bold"
                      style={{ color: item.color }}
                    >
                      {item.title}
                    </p>
                    <p
                      className="text-xs leading-5 mt-1.5"
                      style={{ color: TOKEN.textMuted }}
                    >
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-6 lg:hidden">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{
                background: `linear-gradient(135deg, ${MELON} 0%, ${CORAL} 100%)`,
                boxShadow: '0 12px 30px rgba(249,115,22,0.25)',
              }}
            >
              <Zap className="w-7 h-7 text-white" />
            </div>

            <h1
              className="text-2xl font-bold"
              style={{
                color: TOKEN.text,
                fontFamily: 'var(--font-lora), Georgia, serif',
              }}
            >
              HotelOS
            </h1>
            <p className="mt-1 text-sm" style={{ color: TOKEN.textMuted }}>
              Hotel Management Platform
            </p>
          </div>

          <div
            className="rounded-[28px] p-6 sm:p-8"
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF9F4 100%)',
              border: `1.5px solid ${TOKEN.border}`,
              boxShadow: '0 24px 70px rgba(249,115,22,0.10)',
            }}
          >
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
                style={{
                  color: TOKEN.text,
                  fontFamily: 'var(--font-lora), Georgia, serif',
                }}
              >
                Sign in to HotelOS
              </h2>
              <p className="text-sm mt-2" style={{ color: TOKEN.textMuted }}>
                Use your work email and password to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  className="block text-sm font-medium"
                  style={{ color: TOKEN.textSub }}
                >
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
                    e.currentTarget.style.boxShadow =
                      '0 0 0 4px rgba(249,115,22,0.10)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = TOKEN.borderMid;
                    e.currentTarget.style.boxShadow =
                      '0 2px 10px rgba(249,115,22,0.04)';
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="block text-sm font-medium"
                    style={{ color: TOKEN.textSub }}
                  >
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
                      e.currentTarget.style.boxShadow =
                        '0 0 0 4px rgba(249,115,22,0.10)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = TOKEN.borderMid;
                      e.currentTarget.style.boxShadow =
                        '0 2px 10px rgba(249,115,22,0.04)';
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: TOKEN.textMuted }}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

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