import 'dart:math';

import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';

import '../../domain/entities/geofence_zone.dart';
import '../../domain/repositories/geofence_repository.dart';
import '../datasources/remote/api_client.dart';
import '../models/geofence_models.dart';

class GeofenceRepositoryImpl implements GeofenceRepository {
  final ApiClient _apiClient;

  GeofenceRepositoryImpl({required ApiClient apiClient})
      : _apiClient = apiClient;

  @override
  Future<Either<String, List<GeofenceZone>>> getGeofences() async {
    try {
      final response = await _apiClient.getGeofences();
      final zones = response
          .map((json) =>
              GeofenceZoneModel.fromJson(json as Map<String, dynamic>))
          .toList();
      return Right(zones);
    } on DioException catch (e) {
      return Left(
          e.response?.data?['detail']?.toString() ?? 'Failed to load geofences');
    } catch (e) {
      return Left('Failed to load geofence zones');
    }
  }

  @override
  Future<Either<String, bool>> checkIfInsideGeofence({
    required double lat,
    required double lng,
  }) async {
    try {
      final geofencesResult = await getGeofences();

      return geofencesResult.fold(
        (error) => Left(error),
        (zones) {
          if (zones.isEmpty) {
            // No geofences configured - allow access
            return const Right(true);
          }

          for (final zone in zones) {
            if (!zone.isActive) continue;

            final distance = _calculateDistance(
              lat,
              lng,
              zone.centerLat,
              zone.centerLng,
            );

            if (distance <= zone.radiusMeters) {
              return const Right(true);
            }
          }

          return const Right(false);
        },
      );
    } catch (e) {
      return Left('Failed to verify geofence: ${e.toString()}');
    }
  }

  /// Haversine formula to calculate distance between two coordinates in meters
  double _calculateDistance(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    const earthRadius = 6371000.0; // meters
    final dLat = _degreesToRadians(lat2 - lat1);
    final dLon = _degreesToRadians(lon2 - lon1);

    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_degreesToRadians(lat1)) *
            cos(_degreesToRadians(lat2)) *
            sin(dLon / 2) *
            sin(dLon / 2);

    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return earthRadius * c;
  }

  double _degreesToRadians(double degrees) {
    return degrees * pi / 180;
  }
}
