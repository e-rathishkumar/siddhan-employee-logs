import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';

import '../../domain/entities/attendance_record.dart';
import '../../domain/repositories/attendance_repository.dart';
import '../datasources/remote/api_client.dart';
import '../models/attendance_models.dart';

class AttendanceRepositoryImpl implements AttendanceRepository {
  final ApiClient _apiClient;

  AttendanceRepositoryImpl({required ApiClient apiClient})
      : _apiClient = apiClient;

  @override
  Future<Either<String, List<AttendanceRecord>>> getHistory({
    required String employeeId,
    int page = 1,
    int pageSize = 20,
    String? startDate,
    String? endDate,
  }) async {
    try {
      final response = await _apiClient.getLogHistory(
        employeeId: employeeId,
        page: page,
        pageSize: pageSize,
        startDate: startDate,
        endDate: endDate,
      );

      final List<dynamic> data = response['data'] as List<dynamic>? ?? [];
      final records = data
          .map((json) =>
              AttendanceRecordModel.fromJson(json as Map<String, dynamic>))
          .toList();

      return Right(records);
    } on DioException catch (e) {
      return Left(
          e.response?.data?['detail']?.toString() ?? 'Failed to load history');
    } catch (e) {
      return Left('Failed to load log history');
    }
  }

  @override
  Future<Either<String, AttendanceRecord?>> getTodayLog(
      String employeeId) async {
    try {
      final response = await _apiClient.getTodayLog(employeeId);
      if (response == null) return const Right(null);
      return Right(AttendanceRecordModel.fromJson(response));
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return const Right(null);
      return Left(e.response?.data?['detail']?.toString() ??
          'Failed to load today\'s log');
    } catch (e) {
      return const Right(null);
    }
  }

  @override
  Future<Either<String, AttendanceRecord>> checkIn({
    required String employeeId,
    required double lat,
    required double lng,
  }) async {
    try {
      final response = await _apiClient.checkIn(
        employeeId: employeeId,
        lat: lat,
        lng: lng,
      );
      return Right(AttendanceRecordModel.fromJson(response));
    } on DioException catch (e) {
      return Left(
          e.response?.data?['detail']?.toString() ?? 'Check-in failed');
    } catch (e) {
      return Left('Check-in failed: ${e.toString()}');
    }
  }

  @override
  Future<Either<String, AttendanceRecord>> checkOut({
    required String employeeId,
  }) async {
    try {
      final response = await _apiClient.checkOut(employeeId: employeeId);
      return Right(AttendanceRecordModel.fromJson(response));
    } on DioException catch (e) {
      return Left(
          e.response?.data?['detail']?.toString() ?? 'Check-out failed');
    } catch (e) {
      return Left('Check-out failed: ${e.toString()}');
    }
  }

  @override
  Future<Either<String, Map<String, dynamic>>> getDashboard() async {
    try {
      final response = await _apiClient.getEmployeeDashboard();
      return Right(response);
    } on DioException catch (e) {
      return Left(
          e.response?.data?['detail']?.toString() ?? 'Failed to load dashboard');
    } catch (e) {
      return Left('Failed to load dashboard');
    }
  }
}
