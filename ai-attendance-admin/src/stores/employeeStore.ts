import { create } from 'zustand';
import type { Employee, PaginatedResponse } from '../shared/types';
import apiClient from '../shared/api/client';

interface BackendEmployee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  gender: string;
  joinedAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapEmployee(e: BackendEmployee): Employee {
  return {
    id: e.id,
    employeeId: e.employeeId,
    name: e.name,
    email: e.email,
    phone: e.phone || '',
    department: e.department,
    departmentId: '',
    designation: e.designation,
    gender: e.gender || '',
    joinedAt: e.joinedAt,
    status: e.isActive ? 'active' : 'inactive',
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

interface EmployeeState {
  employees: Employee[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  fetchEmployees: (page?: number, search?: string) => Promise<void>;
  createEmployee: (data: Partial<Employee>) => Promise<void>;
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
  deactivateEmployee: (id: string) => Promise<void>;
  activateEmployee: (id: string) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],
  total: 0,
  page: 1,
  pageSize: 10,
  loading: false,
  error: null,

  fetchEmployees: async (page = 1, search = '') => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.get<PaginatedResponse<BackendEmployee>>(
        '/employees',
        { params: { page, pageSize: get().pageSize, search } }
      );
      set({ employees: data.data.map(mapEmployee), total: data.total, page: data.page });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch employees' });
    } finally {
      set({ loading: false });
    }
  },

  createEmployee: async (data) => {
    set({ loading: true, error: null });
    try {
      const payload = { ...data, joinedAt: new Date().toISOString() };
      await apiClient.post('/employees', payload);
      await get().fetchEmployees(get().page);
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to create employee' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateEmployee: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const { password, employeeId, ...updateData } = data as any;
      await apiClient.put(`/employees/${id}`, updateData);
      await get().fetchEmployees(get().page);
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to update employee' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deactivateEmployee: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/employees/${id}`);
      await get().fetchEmployees(get().page);
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to deactivate employee' });
    } finally {
      set({ loading: false });
    }
  },

  activateEmployee: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.patch(`/employees/${id}/activate`);
      await get().fetchEmployees(get().page);
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to activate employee' });
    } finally {
      set({ loading: false });
    }
  },

  deleteEmployee: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/employees/${id}/permanent`);
      await get().fetchEmployees(get().page);
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to delete employee' });
    } finally {
      set({ loading: false });
    }
  },
}));
