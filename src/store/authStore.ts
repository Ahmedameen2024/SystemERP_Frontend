import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/client';

export interface UserProfile {
  id: string;
  username: string;
  nameAr: string;
  nameEn: string;
  email: string;
  language: string;
  roleId: string;
  roleNameAr: string;
  roleNameEn: string;
  isSuperAdmin?: boolean;
  companyId: string;
  companyNameAr: string;
  branchId: string;
  permissions?: Array<{
    module_name: string;
    screen_name: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_approve: boolean;
    can_print: boolean;
    can_export: boolean;
  }>;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  reloadProfile: () => Promise<void>;
  hasPermission: (module: string, screen: string, action: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        const response = await api.post('/auth/login', { username, password });
        const { token, refreshToken, user } = response.data.data;
        localStorage.setItem('erp_token', token);
        localStorage.setItem('erp_refresh', refreshToken);

        // Fetch full profile with permissions
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const profileRes = await api.get('/auth/profile');

        const profileData = profileRes.data.data;
        set({
          token,
          user: {
            ...user,
            ...profileData,
            permissions: profileData.permissions,
          },
          isAuthenticated: true,
        });
      },

      reloadProfile: async () => {
        try {
          const profileRes = await api.get('/auth/profile');
          const profileData = profileRes.data.data;
          const { user } = get();
          if (user) {
            set({
              user: {
                ...user,
                ...profileData,
                permissions: profileData.permissions,
              },
            });
          }
        } catch (err) {
          console.error('Failed to reload user profile and permissions:', err);
        }
      },

      logout: () => {
        api.post('/auth/logout').catch(() => { });
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_refresh');
        set({ token: null, user: null, isAuthenticated: false });
      },

      hasPermission: (module: string, screen: string, action: string): boolean => {
        const { user } = get();
        if (!user) return false;

        // 1. Super Admin has unrestricted permissions everywhere
        if (
          user.isSuperAdmin ||
          user.roleNameAr === 'مدير النظام' ||
          user.roleNameEn === 'System Administrator' ||
          user.username === 'admin'
        ) {
          return true;
        }

        if (!user.permissions || !Array.isArray(user.permissions)) return false;

        const perm = user.permissions.find(
          (p) =>
            p.module_name.toLowerCase() === module.toLowerCase() &&
            p.screen_name.toLowerCase() === screen.toLowerCase()
        );

        if (!perm) return false;
        return !!perm[`can_${action}` as keyof typeof perm];
      },
    }),
    {
      name: 'erp_auth',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
