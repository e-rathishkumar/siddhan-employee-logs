import 'package:equatable/equatable.dart';

class AttendanceRecord extends Equatable {
  final String id;
  final String employeeId;
  final String date;
  final DateTime? checkIn;
  final DateTime? checkOut;
  final String verificationMethod;
  final double? faceConfidence;
  final double? lat;
  final double? lng;

  const AttendanceRecord({
    required this.id,
    required this.employeeId,
    required this.date,
    this.checkIn,
    this.checkOut,
    required this.verificationMethod,
    this.faceConfidence,
    this.lat,
    this.lng,
  });

  bool get isCheckedIn => checkIn != null;
  bool get isCheckedOut => checkOut != null;

  Duration? get workDuration {
    if (checkIn == null || checkOut == null) return null;
    return checkOut!.difference(checkIn!);
  }

  @override
  List<Object?> get props => [id, employeeId, date, checkIn, checkOut, verificationMethod];
}
