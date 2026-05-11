import { create } from 'zustand';
import type { User, Role, PaginatedResponse } from '../shared/types';
import apiClient from '../shared/api/client';

interface BackendUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  roleId?: string;
  role?: { name: string; id: string; description?: string; permissions?: string[] } | string;
  isActive?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

function mapUser(u: BackendUser): User {
  const roleName = typeof u.role === 'object' && u.role ? u.role.name : (u.role || 'viewer');
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    role: roleName as User['role'],
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
  };
}

interface UserManagementState {
  users: User[];
  roles: Role[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  fetchUsers: (page?: number, search?: string) => Promise<void>;
  createUser: (data: { email: string; name: string; password: string; role: string }) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deactivateUser: (id: string) => Promise<void>;
  activateUser: (id: string) => Promise<void>;
  resetPassword: (id: string) => Promise<void>;
  fetchRoles: () => Promise<void>;
  createRole: (data: Partial<Role>) => Promise<void>;
  updateRole: (id: string, data: Partial<Role>) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  activateRole: (id: string) => Promise<void>;
  deactivateRole: (id: string) => Promise<void>;
}

export const useUserManagementStore = create<UserManagementState>((set, get) => ({
  users: [],
  roles: [],
  total: 0,
  page: 1,
  pageSize: 10,
  loading: false,
  error: null,

  fetchUsers: async (page = 1, search = '') => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.get<PaginatedResponse<BackendUser>>(
        '/users',
        { params: { page, pageSize: get().pageSize, search } }
      );
      set({ users: data.data.map(mapUser), total: data.total, page: data.page });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch users' });
    } finally {
      set({ loading: false });
    }
  },

  createUser: async (data) => {
    set({ loading: true, error: null });
    try {
      const roles = get().roles;
      const matchedRole = roles.find((r) => r.name === data.role);
      const payload: Record<string, unknown> = {
        email: data.email,
        name: data.name,
        password: data.password,
      };
      if (matchedRole) {
        payload.roleId = matchedRole.id;
      }
      await apiClient.post('/users', payload);
      await get().fetchUsers(get().page);
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to create user' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateUser: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const payload: Record<string, unknown> = { ...data };
      if (data.role) {
        const roles = get().roles;
        const matchedRole = roles.find((r) => r.name === data.role);
        if (matchedRole) {
          payload.roleId = matchedRole.id;
        }
        delete payload.role;
      }
      await apiClient.patch(`/users/${id}`, payload);
      await get().fetchUsers(get().page);
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to update user' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deactivateUser: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.patch(`/users/${id}/deactivate`);
      await get().fetchUsers(get().page);
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to deactivate user' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  activateUser: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.patch(`/users/${id}/activate`);
      await get().fetchUsers(get().page);
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to activate user' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  resetPassword: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.post(`/users/${id}/reset-password`);
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to reset password' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchRoles: async () => {
    try {
      const { data } = await apiClient.get<Role[]>('/roles');
      set({ roles: data });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch roles' });
    }
  },

  createRole: async (data) => {
    set({ loading: true, error: null });
    try {
      await apiClient.post('/roles', data);
      await get().fetchRoles();
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to create role' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateRole: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await apiClient.put(`/roles/${id}`, data);
      await get().fetchRoles();
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to update role' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteRole: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/roles/${id}`);
      await get().fetchRoles();
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to delete role' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  activateRole: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.patch(`/roles/${id}/activate`);
      await get().fetchRoles();
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to activate role' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deactivateRole: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.patch(`/roles/${id}/deactivate`);
      await get().fetchRoles();
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to deactivate role' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
