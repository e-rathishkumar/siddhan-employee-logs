import 'package:dartz/dartz.dart';

import '../entities/geofence_zone.dart';

abstract class GeofenceRepository {
  Future<Either<String, List<GeofenceZone>>> getGeofences();
  Future<Either<String, bool>> checkIfInsideGeofence({
    required double lat,
    required double lng,
  });
}
