import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geolocator/geolocator.dart';

import '../../../domain/repositories/geofence_repository.dart';
import 'geofence_event.dart';
import 'geofence_state.dart';

class GeofenceBloc extends Bloc<GeofenceEvent, GeofenceState> {
  final GeofenceRepository _geofenceRepository;

  GeofenceBloc({required GeofenceRepository geofenceRepository})
      : _geofenceRepository = geofenceRepository,
        super(const GeofenceInitial()) {
    on<GeofenceCheckRequested>(_onCheck);
  }

  Future<void> _onCheck(
    GeofenceCheckRequested event,
    Emitter<GeofenceState> emit,
  ) async {
    emit(const GeofenceChecking());

    // Check location permission
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        emit(const GeofencePermissionDenied());
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      emit(const GeofencePermissionDenied());
      return;
    }

    // Check if location services are enabled
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      emit(const GeofenceError(
          message: 'Location services are disabled. Please enable GPS.'));
      return;
    }

    try {
      // Get current position
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );

      // Check geofence
      final result = await _geofenceRepository.checkIfInsideGeofence(
        lat: position.latitude,
        lng: position.longitude,
      );

      result.fold(
        (error) => emit(GeofenceError(message: error)),
        (isInside) {
          if (isInside) {
            emit(const GeofenceInside());
          } else {
            emit(const GeofenceOutside(
              message:
                  'You are currently outside the designated office area. Please move within the office premises to access the application.',
            ));
          }
        },
      );
    } catch (e) {
      emit(GeofenceError(message: 'Failed to get location: ${e.toString()}'));
    }
  }
}
