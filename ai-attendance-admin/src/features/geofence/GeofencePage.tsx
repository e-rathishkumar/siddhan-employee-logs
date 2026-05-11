import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, useMapEvents } from 'react-leaflet';
import { useGeofenceStore } from '../../stores/geofenceStore';
import { Button, Input, Modal, PageLoader, ErrorState, ConfirmDialog } from '../../shared/components';
import { useDisclosure } from '../../shared/hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { GeofenceZone } from '../../shared/types';
import 'leaflet/dist/leaflet.css';

const zoneSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  radius: z.coerce.number().min(50, 'Minimum 50m').max(5000, 'Maximum 5000m'),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

type ZoneFormData = z.infer<typeof zoneSchema>;

export function GeofencePage() {
  const { zones, loading, error, fetchZones, deleteZone } = useGeofenceStore();
  const { isOpen, open, close } = useDisclosure();
  const deleteDialog = useDisclosure();
  const [editingZone, setEditingZone] = useState<GeofenceZone | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const defaultCenter: [number, number] = [
    Number(import.meta.env.VITE_DEFAULT_CENTER_LAT) || 28.6139,
    Number(import.meta.env.VITE_DEFAULT_CENTER_LNG) || 77.2090,
  ];

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleCreate = () => {
    setEditingZone(null);
    setSelectedPoint(null);
    open();
  };

  const handleEdit = (zone: GeofenceZone) => {
    setEditingZone(zone);
    setSelectedPoint(zone.center);
    open();
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedPoint({ lat, lng });
  };

  if (loading && zones.length === 0) return <PageLoader />;
  if (error && zones.length === 0) return <ErrorState message={error} onRetry={fetchZones} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Geofence Zones</h1>
          <p className="text-sm text-gray-500 mt-1">Configure office locations and boundaries</p>
        </div>
        <Button onClick={handleCreate}>Add Zone</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: 500 }}>
          <MapContainer center={defaultCenter} zoom={12} className="h-full w-full">
            <TileLayer url={import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'} />
            <MapClickHandler onClick={handleMapClick} />
            {zones.map((zone) => (
              <Circle
                key={zone.id}
                center={[zone.center.lat, zone.center.lng]}
                radius={zone.radius}
                pathOptions={{
                  color: zone.isActive ? '#4f46e5' : '#9ca3af',
                  fillColor: zone.isActive ? '#4f46e5' : '#9ca3af',
                  fillOpacity: 0.2,
                }}
              />
            ))}
            {selectedPoint && (
              <Circle
                center={[selectedPoint.lat, selectedPoint.lng]}
                radius={200}
                pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.3, dashArray: '5 5' }}
              />
            )}
          </MapContainer>
        </div>

        {/* Zone List */}
        <div className="space-y-3">
          {zones.map((zone) => (
            <div key={zone.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{zone.name}</h4>
                <span className={`w-2 h-2 rounded-full ${zone.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
              </div>
              <p className="text-xs text-gray-500 mb-1">{zone.address}</p>
              <p className="text-xs text-gray-400">Radius: {zone.radius}m</p>
              <p className="text-xs text-gray-400">
                {zone.center.lat.toFixed(4)}, {zone.center.lng.toFixed(4)}
              </p>
              <div className="flex gap-2 mt-3">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(zone)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => { setDeletingId(zone.id); deleteDialog.open(); }}>Delete</Button>
              </div>
            </div>
          ))}
          {zones.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No zones configured</p>
          )}
        </div>
      </div>

      <GeofenceFormModal
        isOpen={isOpen}
        onClose={close}
        zone={editingZone}
        selectedPoint={selectedPoint}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={async () => {
          if (deletingId) {
            await deleteZone(deletingId);
            deleteDialog.close();
          }
        }}
        title="Delete Geofence Zone"
        message="This will permanently remove this zone. Employees using this zone for check-in will need to be reassigned."
        confirmLabel="Delete Zone"
        variant="danger"
        loading={loading}
      />
    </div>
  );
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function GeofenceFormModal({
  isOpen,
  onClose,
  zone,
  selectedPoint,
}: {
  isOpen: boolean;
  onClose: () => void;
  zone: GeofenceZone | null;
  selectedPoint: { lat: number; lng: number } | null;
}) {
  const { createZone, updateZone } = useGeofenceStore();
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<ZoneFormData>({
    resolver: zodResolver(zoneSchema) as never,
  });

  useEffect(() => {
    if (zone) {
      reset({ name: zone.name, address: zone.address, radius: zone.radius, lat: zone.center.lat, lng: zone.center.lng });
    } else {
      reset({ name: '', address: '', radius: 200, lat: selectedPoint?.lat || 0, lng: selectedPoint?.lng || 0 });
    }
  }, [zone, selectedPoint, reset]);

  useEffect(() => {
    if (selectedPoint) {
      setValue('lat', selectedPoint.lat);
      setValue('lng', selectedPoint.lng);
    }
  }, [selectedPoint, setValue]);

  const onSubmit = async (data: ZoneFormData) => {
    const payload = {
      name: data.name,
      address: data.address,
      radius: data.radius,
      center: { lat: data.lat, lng: data.lng },
      isActive: true,
    };
    try {
      if (zone) {
        await updateZone(zone.id, payload);
      } else {
        await createZone(payload);
      }
      onClose();
    } catch {
      // handled in store
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={zone ? 'Edit Zone' : 'Add Zone'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Zone Name" error={errors.name?.message} {...register('name')} />
        <Input label="Address" error={errors.address?.message} {...register('address')} />
        <Input label="Radius (meters)" type="number" error={errors.radius?.message} {...register('radius')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Latitude" type="number" step="any" error={errors.lat?.message} {...register('lat')} />
          <Input label="Longitude" type="number" step="any" error={errors.lng?.message} {...register('lng')} />
        </div>
        <p className="text-xs text-gray-500">Click on the map to select coordinates</p>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{zone ? 'Update' : 'Create'} Zone</Button>
        </div>
      </form>
    </Modal>
  );
}
