'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Phone, QrCode, ShieldAlert } from 'lucide-react';
import api from '@/lib/api';

type ScanResponse = {
  success: boolean;
  data?: {
    action: 'checkin' | 'checkout' | 'already_done';
    staff?: {
      id: string;
      name: string;
      phone: string;
    };
    message?: string;
  };
  message?: string;
};

export default function AttendanceScanClient({ token }: { token: string }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState('');

  const tokenExists = useMemo(() => Boolean(token), [token]);
  const normalizedPhone = useMemo(() => phone.replace(/\D/g, ''), [phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!tokenExists) {
      setError('Invalid QR link. Token missing.');
      return;
    }

    if (!normalizedPhone || normalizedPhone.length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }

    try {
      setLoading(true);

      const res = await api.post('/api/attendance/qr-scan', {
        token,
        phone: normalizedPhone,
      });

      setResult(res.data);
      setPhone('');
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Unable to mark attendance right now.'
      );
    } finally {
      setLoading(false);
    }
  };

  const card = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.35, ease: 'easeOut' },
    },
  };

  const float = {
    animate: {
      y: [0, -8, 0],
      transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' as const },
    },
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 px-4 py-8">
      <div className="mx-auto flex min-h-[85vh] max-w-md items-center justify-center">
        <motion.div
          variants={card}
          initial="hidden"
          animate="show"
          className="relative w-full overflow-hidden rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-2xl backdrop-blur-xl"
        >
          <motion.div
            {...float}
            className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-orange-200/40 blur-2xl"
          />
          <motion.div
            {...float}
            transition={{ delay: 0.6, duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-pink-200/40 blur-2xl"
          />

          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 text-white shadow-lg"
            >
              <QrCode className="h-8 w-8" />
            </motion.div>

            <h1 className="text-center text-2xl font-black tracking-tight text-gray-900">
              Staff Attendance
            </h1>
            <p className="mt-2 text-center text-sm text-gray-500">
              Scan successful. Enter your phone number to mark check-in or check-out.
            </p>

            <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-xs text-orange-700">
              {tokenExists ? 'QR token detected.' : 'QR token missing.'}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-gray-500">
                  Phone Number
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-200">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="Enter mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.01 }}
                disabled={loading || !tokenExists}
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-sm font-black text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {loading ? 'Marking Attendance...' : 'Mark Attendance'}
              </motion.button>
            </form>

            <AnimatePresence mode="wait">
              {error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-bold text-red-700">Attendance failed</p>
                      <p className="mt-1 text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {result?.success && result?.data ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold capitalize text-green-800">
                        {result.data.action === 'checkin'
                          ? 'Check-in marked'
                          : result.data.action === 'checkout'
                          ? 'Check-out marked'
                          : 'Attendance already completed'}
                      </p>

                      <p className="mt-1 text-sm text-green-700">
                        {result.data.staff?.name || 'Staff'}{' '}
                        {result.data.staff?.phone ? `(${result.data.staff.phone})` : ''}
                      </p>

                      {result.data.message ? (
                        <p className="mt-1 text-xs text-green-600">{result.data.message}</p>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </main>
  );
}