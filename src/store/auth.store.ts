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
  login: (data: { accessToken: string; refreshToken?: string; staff: StaffUser; tenant?: TenantInfo }) => void;
  logout: () => void;
  updateToken: (token: string) => void;
  updateTenant: (tenant: Partial<TenantInfo>) => void;
  isHydrated: boolean; // ✅ NEW
  setHydrated: () => void; // ✅ NEW
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

      // ✅ NEW
      isHydrated: false,
      setHydrated: () => set({ isHydrated: true }),

      login: ({ accessToken, refreshToken, staff, tenant }) =>
        set({
          accessToken,
          refreshToken: refreshToken ?? null,
          staff,
          tenant: tenant ?? null,
          isAuthenticated: true,
          isSuperAdmin: staff.role === 'superadmin',
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

      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        staff: s.staff,
        tenant: s.tenant,
      }),

      // ✅ THIS IS THE KEY FIX
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
