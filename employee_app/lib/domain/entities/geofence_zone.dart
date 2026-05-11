import 'package:equatable/equatable.dart';

class GeofenceZone extends Equatable {
  final String id;
  final String name;
  final String? address;
  final double centerLat;
  final double centerLng;
  final double radiusMeters;
  final bool isActive;

  const GeofenceZone({
    required this.id,
    required this.name,
    this.address,
    required this.centerLat,
    required this.centerLng,
    required this.radiusMeters,
    this.isActive = true,
  });

  @override
  List<Object?> get props => [id, name, centerLat, centerLng, radiusMeters];
}
