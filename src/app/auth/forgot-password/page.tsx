'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Send, Sparkles, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Breadcrumb } from '@/components/components/ui/breadcrumb';

const MELON = '#F97316';
const CORAL = '#F43F5E';
const AMBER = '#F59E0B';
const VIOLET = '#7C3AED';

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const req = api.post('/api/auth/forgot-password', { email });
      await toast.promise(req, {
        loading: 'Sending reset link...',
        success: 'Reset link sent if the email exists.',
        error: 'Could not send reset link',
      });
      setSentTo(email);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        background:
          'radial-gradient(circle at top left, rgba(249,115,22,0.12), transparent 22%), radial-gradient(circle at top right, rgba(244,63,94,0.08), transparent 20%), radial-gradient(circle at bottom right, rgba(124,58,237,0.06), transparent 24%), #FFFBF7',
      }}
    > 

      <div className="w-full max-w-5xl grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-center">
        {/* Left panel */}
        <div className="hidden lg:block">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="rounded-[32px] p-8 xl:p-10 h-full"
            style={{
              background: 'linear-gradient(180deg, #FFFBF7 0%, #FFF5EC 58%, #FFFAF6 100%)',
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
                Secure Recovery
              </span>
            </div>

            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6"
              style={{
                background: `linear-gradient(135deg, ${MELON} 0%, ${CORAL} 100%)`,
                boxShadow: '0 16px 40px rgba(249,115,22,0.28)',
              }}
            >
              <Mail className="w-8 h-8 text-white" />
            </div>

            <h1
              className="text-4xl xl:text-5xl font-bold leading-tight"
              style={{
                color: TOKEN.text,
                fontFamily: 'var(--font-lora), Georgia, serif',
              }}
            >
              Recover access
              <br />
              to HotelOS.
            </h1>

            <p
              className="mt-5 text-[15px] leading-7 max-w-lg"
              style={{ color: TOKEN.textSub }}
            >
              Enter your work email and we’ll send a secure reset link so you can
              create a new password and get back to your hotel dashboard.
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mt-8">
              {[
                {
                  icon: <ShieldCheck className="w-4 h-4" />,
                  title: 'Secure token link',
                  desc: 'Each reset link is time-limited and single-purpose.',
                  bg: '#FFFBEB',
                  border: '#FDE68A',
                  color: AMBER,
                },
                {
                  icon: <Send className="w-4 h-4" />,
                  title: 'Fast email delivery',
                  desc: 'Send reset instructions instantly to staff accounts.',
                  bg: '#FFF1F2',
                  border: '#FECDD3',
                  color: CORAL,
                },
                {
                  icon: <Mail className="w-4 h-4" />,
                  title: 'Email-based recovery',
                  desc: 'Users recover access without admin intervention.',
                  bg: '#FFF7ED',
                  border: '#FED7AA',
                  color: MELON,
                },
                {
                  icon: <Sparkles className="w-4 h-4" />,
                  title: 'Smooth experience',
                  desc: 'Clean form, clear states, and fast feedback.',
                  bg: '#F5F3FF',
                  border: '#DDD6FE',
                  color: VIOLET,
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
                  <div className="flex items-center gap-2">
                    <span style={{ color: item.color }}>{item.icon}</span>
                    <p className="text-sm font-bold" style={{ color: item.color }}>
                      {item.title}
                    </p>
                  </div>
                  <p
                    className="text-xs leading-5 mt-2"
                    style={{ color: TOKEN.textMuted }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative mt-8">
              <div
                className="overflow-hidden rounded-[24px]"
                style={{
                  border: `1.5px solid ${TOKEN.border}`,
                  boxShadow: '0 16px 48px rgba(249,115,22,0.12), 0 6px 20px rgba(0,0,0,0.06)',
                }}
              >
                <img
                  src="https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1400"
                  alt="Luxury hotel exterior with pool"
                  className="w-full h-52 object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right card */}
        <div className="w-full max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
            className="rounded-[28px] p-6 sm:p-8"
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF9F4 100%)',
              border: `1.5px solid ${TOKEN.border}`,
              boxShadow: '0 24px 70px rgba(249,115,22,0.10)',
            }}
          >
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm font-medium mb-5 hover:underline"
              style={{ color: MELON }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>

            <AnimatePresence mode="wait">
              {!sentTo ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
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
                        Forgot Password
                      </span>
                    </div>

                    <h2
                      className="text-2xl font-bold"
                      style={{
                        color: TOKEN.text,
                        fontFamily: 'var(--font-lora), Georgia, serif',
                      }}
                    >
                      Reset your password
                    </h2>

                    <p className="text-sm mt-2" style={{ color: TOKEN.textMuted }}>
                      Enter your email to receive a reset link.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label
                        className="block text-sm font-medium"
                        style={{ color: TOKEN.textSub }}
                      >
                        Work email
                      </label>

                      <div className="relative">
                        <Mail
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                          style={{ color: TOKEN.textMuted }}
                        />
                        <input
                          type="email"
                          placeholder="you@hotel.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full rounded-2xl pl-11 pr-4 py-3 text-sm outline-none transition-all"
                          style={{
                            background: TOKEN.surface,
                            border: `1.5px solid ${TOKEN.borderMid}`,
                            color: TOKEN.text,
                            boxShadow: '0 2px 10px rgba(249,115,22,0.04)',
                          }}
                        />
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
                      {loading ? 'Sending...' : 'Send reset link'}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="text-center"
                >
                  <div
                    className="mx-auto w-16 h-16 rounded-3xl flex items-center justify-center mb-5"
                    style={{
                      background: `linear-gradient(135deg, ${MELON} 0%, ${CORAL} 100%)`,
                      boxShadow: '0 16px 40px rgba(249,115,22,0.24)',
                    }}
                  >
                    <Mail className="w-8 h-8 text-white" />
                  </div>

                  <h2
                    className="text-2xl font-bold"
                    style={{
                      color: TOKEN.text,
                      fontFamily: 'var(--font-lora), Georgia, serif',
                    }}
                  >
                    Check your email
                  </h2>

                  <p className="text-sm mt-3 leading-6" style={{ color: TOKEN.textMuted }}>
                    If an account exists for <span className="font-semibold">{sentTo}</span>,
                    we sent a password reset link.
                  </p>

                  <div
                    className="rounded-2xl p-4 mt-6 text-left"
                    style={{
                      background: '#FFF7ED',
                      border: '1.5px solid #FED7AA',
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: MELON }}>
                      Didn’t receive it?
                    </p>
                    <p className="text-xs leading-5 mt-1" style={{ color: TOKEN.textMuted }}>
                      Check spam, wait a minute, or try again with the correct work email.
                    </p>
                  </div>

                  <button
                    onClick={() => setSentTo('')}
                    className="mt-6 w-full rounded-2xl py-3 text-sm font-bold"
                    style={{
                      color: MELON,
                      background: TOKEN.melonPale,
                      border: `1.5px solid ${TOKEN.melonLight}`,
                    }}
                  >
                    Try another email
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}