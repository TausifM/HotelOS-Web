'use client';

import { useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export default function AuthHydrator() {
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const setCheckingAuth = useAuthStore((s) => s.setCheckingAuth);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        await useAuthStore.persist.rehydrate();

        const res = await api.get('/api/auth/me', {
          withCredentials: true,
        });

        if (!mounted) return;

        const data = res.data?.data;

        if (data?.staff) {
          setSession({
            staff: data.staff,
            tenant: data.tenant ?? null,
          });
        } else {
          clearSession();
        }
      } catch {
        if (mounted) clearSession();
      } finally {
        if (mounted) {
          setHydrated();
          setCheckingAuth(false);
        }
      }
    };

    boot();

    return () => {
      mounted = false;
    };
  }, [setHydrated, setCheckingAuth, setSession, clearSession]);

  return null;
}