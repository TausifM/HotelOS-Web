import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface TenantInfo {
  id: string;
  hotelName: string;
  slug: string;
  logo?: string;
  brandColor: string;
  subscription: {
    status: string;
    trialEndsAt: string;
    planName: string;
  };
  features: Record<string, boolean>;
  trialDaysLeft: number;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  staff: StaffUser | null;
  tenant: TenantInfo | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isHydrated: boolean;
  isCheckingAuth: boolean;

  setHydrated: () => void;
  setCheckingAuth: (v: boolean) => void;

  setSession: (data: {
    staff: StaffUser;
    tenant?: TenantInfo | null;
    accessToken?: string | null;
    refreshToken?: string | null;
  }) => void;

  login: (data: {
    accessToken?: string | null;
    refreshToken?: string | null;
    staff: StaffUser;
    tenant?: TenantInfo | null;
  }) => void;

  clearSession: () => void;
  logout: () => void;
  updateToken: (token: string | null) => void;
  updateTenant: (tenant: Partial<TenantInfo>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      staff: null,
      tenant: null,
      isAuthenticated: false,
      isSuperAdmin: false,
      isHydrated: false,
      isCheckingAuth: true,

      setHydrated: () => set({ isHydrated: true }),
      setCheckingAuth: (v) => set({ isCheckingAuth: v }),

      setSession: ({ staff, tenant, accessToken = null, refreshToken = null }) =>
        set({
          accessToken,
          refreshToken,
          staff,
          tenant: tenant ?? null,
          isAuthenticated: true,
          isSuperAdmin: staff.role === 'superadmin',
        }),

      login: ({ accessToken = null, refreshToken = null, staff, tenant }) =>
        set({
          accessToken,
          refreshToken,
          staff,
          tenant: tenant ?? null,
          isAuthenticated: true,
          isSuperAdmin: staff.role === 'superadmin',
        }),

      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: null,
          staff: null,
          tenant: null,
          isAuthenticated: false,
          isSuperAdmin: false,
        }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          staff: null,
          tenant: null,
          isAuthenticated: false,
          isSuperAdmin: false,
        }),

      updateToken: (accessToken) => set({ accessToken }),

      updateTenant: (updates) =>
        set((s) => ({
          tenant: s.tenant ? { ...s.tenant, ...updates } : null,
        })),
    }),
    {
      name: 'stayos-auth',
      skipHydration: true,
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        staff: s.staff,
        tenant: s.tenant,
        isAuthenticated: s.isAuthenticated,
        isSuperAdmin: s.isSuperAdmin,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),
}));