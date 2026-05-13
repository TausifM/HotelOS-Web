'use client';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useCallback } from 'react';
import api from '@/lib/api';

export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();

  const logout = useCallback(async () => {
    try { await api.post('/api/auth/logout'); } catch { /* ignore */ }
    store.logout();
    router.replace('/auth/login');
  }, [store, router]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!store.staff) return false;
    if (store.staff.role === 'owner' || store.staff.role === 'superadmin') return true;
    const perms = store.staff.permissions;
    if (perms.includes('*')) return true;
    const [resource] = permission.split('.');
    return perms.includes(permission) || perms.includes(`${resource}.*`);
  }, [store.staff]);

  const hasRole = useCallback((...roles: string[]): boolean => {
    return store.staff ? roles.includes(store.staff.role) : false;
  }, [store.staff]);

  return {
    staff: store.staff,
    tenant: store.tenant,
    isAuthenticated: store.isAuthenticated,
    isSuperAdmin: store.isSuperAdmin,
    accessToken: store.accessToken,
    logout,
    hasPermission,
    hasRole,
  };
}
