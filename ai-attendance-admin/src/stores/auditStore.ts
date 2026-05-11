import { create } from 'zustand';
import type { AuditLog, PaginatedResponse } from '../shared/types';
import apiClient from '../shared/api/client';

interface BackendAuditLog {
  id: string;
  userId: string | null;
  userName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  changes: Record<string, unknown> | null;
  createdAt: string;
}

function fromBackend(log: BackendAuditLog): AuditLog {
  return {
    id: log.id,
    actorId: log.userId || '',
    actorName: log.userName,
    action: log.action,
    entity: log.entityType,
    entityId: log.entityId || undefined,
    metadata: log.changes || undefined,
    ipAddress: log.ipAddress || '',
    timestamp: log.createdAt,
  };
}

interface AuditState {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  fetchLogs: (page?: number, filters?: { action?: string; entity?: string; actorId?: string; from?: string; to?: string }) => Promise<void>;
}

export const useAuditStore = create<AuditState>((set, get) => ({
  logs: [],
  total: 0,
  page: 1,
  pageSize: 20,
  loading: false,
  error: null,

  fetchLogs: async (page = 1, filters = {}) => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.get<PaginatedResponse<BackendAuditLog>>(
        '/audit/logs',
        { params: { page, pageSize: get().pageSize, ...filters } }
      );
      set({ logs: data.data.map(fromBackend), total: data.total, page: data.page });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch audit logs' });
    } finally {
      set({ loading: false });
    }
  },
}));
