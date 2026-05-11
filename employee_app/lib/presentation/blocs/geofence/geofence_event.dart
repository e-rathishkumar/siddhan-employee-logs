import 'package:equatable/equatable.dart';

abstract class GeofenceEvent extends Equatable {
  const GeofenceEvent();

  @override
  List<Object?> get props => [];
}

class GeofenceCheckRequested extends GeofenceEvent {
  const GeofenceCheckRequested();
}
