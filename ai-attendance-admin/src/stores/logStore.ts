import { create } from 'zustand';
import apiClient from '../shared/api/client';

interface CheckLog {
  id: string;
  employeeId: string;
  employeeName: string | null;
  employeeCode: string | null;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  verificationMethod: string;
  faceConfidence: number | null;
  lat: number | null;
  lng: number | null;
  createdAt: string;
}

interface LogFilters {
  date?: string;
  employeeId?: string;
}

interface LogState {
  logs: CheckLog[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  filters: LogFilters;
  setFilters: (filters: LogFilters) => void;
  fetchLogs: (page?: number) => Promise<void>;
  exportData: () => Promise<Blob>;
}

export const useLogStore = create<LogState>((set, get) => ({
  logs: [],
  total: 0,
  page: 1,
  pageSize: 20,
  loading: false,
  error: null,
  filters: {},

  setFilters: (filters) => set({ filters }),

  fetchLogs: async (page = 1) => {
    set({ loading: true, error: null });
    try {
      const { filters, pageSize } = get();
      const { data } = await apiClient.get('/logs', {
        params: { page, pageSize, ...filters },
      });
      set({ logs: data.data, total: data.total, page: data.page });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch logs' });
    } finally {
      set({ loading: false });
    }
  },

  exportData: async () => {
    const { filters } = get();
    const response = await apiClient.get('/logs/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
}));
