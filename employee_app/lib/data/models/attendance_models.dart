import '../../domain/entities/attendance_record.dart';

class AttendanceRecordModel extends AttendanceRecord {
  const AttendanceRecordModel({
    required super.id,
    required super.employeeId,
    required super.date,
    super.checkIn,
    super.checkOut,
    required super.verificationMethod,
    super.faceConfidence,
    super.lat,
    super.lng,
  });

  factory AttendanceRecordModel.fromJson(Map<String, dynamic> json) {
    return AttendanceRecordModel(
      id: json['id']?.toString() ?? '',
      employeeId: json['employee_id']?.toString() ?? '',
      date: json['date']?.toString() ?? '',
      checkIn: json['check_in'] != null
          ? DateTime.tryParse(json['check_in'].toString())
          : null,
      checkOut: json['check_out'] != null
          ? DateTime.tryParse(json['check_out'].toString())
          : null,
      verificationMethod: json['verification_method']?.toString() ?? 'manual',
      faceConfidence: (json['face_confidence'] as num?)?.toDouble(),
      lat: (json['lat'] as num?)?.toDouble(),
      lng: (json['lng'] as num?)?.toDouble(),
    );
  }
}
