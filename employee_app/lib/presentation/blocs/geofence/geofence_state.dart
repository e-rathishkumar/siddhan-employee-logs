import 'package:equatable/equatable.dart';

abstract class GeofenceState extends Equatable {
  const GeofenceState();

  @override
  List<Object?> get props => [];
}

class GeofenceInitial extends GeofenceState {
  const GeofenceInitial();
}

class GeofenceChecking extends GeofenceState {
  const GeofenceChecking();
}

class GeofenceInside extends GeofenceState {
  const GeofenceInside();
}

class GeofenceOutside extends GeofenceState {
  final String message;

  const GeofenceOutside({required this.message});

  @override
  List<Object?> get props => [message];
}

class GeofenceError extends GeofenceState {
  final String message;

  const GeofenceError({required this.message});

  @override
  List<Object?> get props => [message];
}

class GeofencePermissionDenied extends GeofenceState {
  const GeofencePermissionDenied();
}
