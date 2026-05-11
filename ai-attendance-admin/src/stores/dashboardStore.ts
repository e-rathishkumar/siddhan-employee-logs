import { create } from 'zustand';
import apiClient from '../shared/api/client';

interface DashboardSummary {
  totalEmployees: number;
  checkedInToday: number;
  checkedOutToday: number;
  stillInside: number;
  recentLogs: {
    id: string;
    employeeName: string;
    employeeCode: string;
    checkIn: string | null;
    checkOut: string | null;
    method: string;
  }[];
}

interface DashboardState {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  fetchSummary: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  loading: false,
  error: null,

  fetchSummary: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.get<DashboardSummary>('/dashboard/summary');
      set({ summary: data });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch dashboard data' });
    } finally {
      set({ loading: false });
    }
  },
}));
