import { create } from 'zustand';
import type { GeofenceZone } from '../shared/types';
import apiClient from '../shared/api/client';

// Backend response shape (after camelCase transformation by interceptor)
interface GeofenceBackend {
  id: string;
  name: string;
  address: string | null;
  centerLat?: number;
  centerLng?: number;
  radiusMeters?: number;
  // Mock data uses these fields directly
  center?: { lat: number; lng: number };
  radius?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function fromBackend(g: GeofenceBackend): GeofenceZone {
  // Handle both real backend format (centerLat/centerLng) and mock format (center object)
  const lat = g.centerLat ?? g.center?.lat ?? 0;
  const lng = g.centerLng ?? g.center?.lng ?? 0;
  const radius = g.radiusMeters ?? g.radius ?? 200;
  return {
    id: g.id,
    name: g.name,
    address: g.address || '',
    center: { lat, lng },
    radius,
    isActive: g.isActive,
  };
}

function toBackend(data: Partial<GeofenceZone> & { center?: { lat: number; lng: number }; radius?: number; isActive?: boolean }) {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.address !== undefined) payload.address = data.address;
  if (data.center) {
    payload.centerLat = data.center.lat;
    payload.centerLng = data.center.lng;
  }
  if (data.radius !== undefined) payload.radiusMeters = data.radius;
  return payload;
}

interface GeofenceState {
  zones: GeofenceZone[];
  loading: boolean;
  error: string | null;
  fetchZones: () => Promise<void>;
  createZone: (data: Omit<GeofenceZone, 'id'>) => Promise<void>;
  updateZone: (id: string, data: Partial<GeofenceZone>) => Promise<void>;
  deleteZone: (id: string) => Promise<void>;
}

export const useGeofenceStore = create<GeofenceState>((set, get) => ({
  zones: [],
  loading: false,
  error: null,

  fetchZones: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.get<GeofenceBackend[]>('/geofences');
      set({ zones: Array.isArray(data) ? data.map(fromBackend) : [] });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch geofence zones' });
    } finally {
      set({ loading: false });
    }
  },

  createZone: async (zoneData) => {
    set({ loading: true, error: null });
    try {
      await apiClient.post('/geofences', toBackend(zoneData));
      await get().fetchZones();
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to create zone' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateZone: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await apiClient.put(`/geofences/${id}`, toBackend(data));
      await get().fetchZones();
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to update zone' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteZone: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/geofences/${id}`);
      await get().fetchZones();
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to delete zone' });
    } finally {
      set({ loading: false });
    }
  },
}));
