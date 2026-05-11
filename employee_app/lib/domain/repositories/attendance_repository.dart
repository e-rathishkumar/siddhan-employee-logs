import 'package:dartz/dartz.dart';

import '../entities/attendance_record.dart';

abstract class AttendanceRepository {
  Future<Either<String, List<AttendanceRecord>>> getHistory({
    required String employeeId,
    int page,
    int pageSize,
    String? startDate,
    String? endDate,
  });
  Future<Either<String, AttendanceRecord?>> getTodayLog(String employeeId);
  Future<Either<String, AttendanceRecord>> checkIn({
    required String employeeId,
    required double lat,
    required double lng,
  });
  Future<Either<String, AttendanceRecord>> checkOut({
    required String employeeId,
  });
  Future<Either<String, Map<String, dynamic>>> getDashboard();
}
