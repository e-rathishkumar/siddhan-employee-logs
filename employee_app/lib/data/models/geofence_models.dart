import '../../domain/entities/geofence_zone.dart';

class GeofenceZoneModel extends GeofenceZone {
  const GeofenceZoneModel({
    required super.id,
    required super.name,
    super.address,
    required super.centerLat,
    required super.centerLng,
    required super.radiusMeters,
    super.isActive,
  });

  factory GeofenceZoneModel.fromJson(Map<String, dynamic> json) {
    return GeofenceZoneModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      address: json['address']?.toString(),
      centerLat: (json['center_lat'] as num?)?.toDouble() ?? 0.0,
      centerLng: (json['center_lng'] as num?)?.toDouble() ?? 0.0,
      radiusMeters: (json['radius_meters'] as num?)?.toDouble() ?? 200.0,
      isActive: json['is_active'] as bool? ?? true,
    );
  }
}
