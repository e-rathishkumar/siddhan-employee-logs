import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';

import '../../../core/constants/api_constants.dart';

class ApiClient {
  final Dio _dio;

  ApiClient(this._dio);

  // Auth
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post(
      ApiConstants.login,
      data: {'email': email, 'password': password},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> refreshToken(String refreshToken) async {
    final response = await _dio.post(
      ApiConstants.refreshToken,
      data: {'refresh_token': refreshToken},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updatePassword({
    required String newPassword,
    required String confirmPassword,
  }) async {
    final response = await _dio.post(
      ApiConstants.updatePassword,
      data: {
        'new_password': newPassword,
        'confirm_password': confirmPassword,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  // Employee Profile
  Future<Map<String, dynamic>> getProfile() async {
    final response = await _dio.get(ApiConstants.profile);
    return response.data as Map<String, dynamic>;
  }

  // Face validation & registration
  Future<Map<String, dynamic>> validateFace(List<int> imageBytes, String filename) async {
    final formData = FormData.fromMap({
      'file': MultipartFile.fromBytes(
        imageBytes,
        filename: filename,
        contentType: MediaType('image', 'jpeg'),
      ),
    });
    final response = await _dio.post(
      ApiConstants.faceValidate,
      data: formData,
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> registerSelfFace(List<int> imageBytes, String filename) async {
    final formData = FormData.fromMap({
      'file': MultipartFile.fromBytes(
        imageBytes,
        filename: filename,
        contentType: MediaType('image', 'jpeg'),
      ),
    });
    final response = await _dio.post(
      ApiConstants.faceRegisterSelf,
      data: formData,
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> register360Face(
    List<Map<String, dynamic>> captures,
  ) async {
    final files = <MultipartFile>[];
    final angles = <String>[];

    for (final capture in captures) {
      final bytes = capture['bytes'] as List<int>;
      final angle = capture['angle'] as String;
      files.add(MultipartFile.fromBytes(
        bytes,
        filename: '$angle.jpg',
        contentType: MediaType('image', 'jpeg'),
      ));
      angles.add(angle);
    }

    final formData = FormData.fromMap({
      'files': files,
      'angles': angles.join(','),
    });
    final response = await _dio.post(
      ApiConstants.faceRegister360,
      data: formData,
    );
    return response.data as Map<String, dynamic>;
  }

  // Employee Dashboard
  Future<Map<String, dynamic>> getEmployeeDashboard() async {
    final response = await _dio.get('/dashboard/employee-summary');
    return response.data as Map<String, dynamic>;
  }

  // Logs (Check-in / Check-out)
  Future<Map<String, dynamic>> getLogHistory({
    required String employeeId,
    int page = 1,
    int pageSize = 20,
    String? startDate,
    String? endDate,
  }) async {
    final params = <String, dynamic>{
      'employeeId': employeeId,
      'page': page,
      'pageSize': pageSize,
    };
    if (startDate != null) params['start_date'] = startDate;
    if (endDate != null) params['end_date'] = endDate;

    final response = await _dio.get(
      ApiConstants.logs,
      queryParameters: params,
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>?> getTodayLog(String employeeId) async {
    try {
      final response = await _dio.get(
        ApiConstants.todayLog,
        queryParameters: {'employee_id': employeeId},
      );
      if (response.data == null || response.data == '') return null;
      return response.data as Map<String, dynamic>?;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      rethrow;
    }
  }

  Future<Map<String, dynamic>> checkIn({
    required String employeeId,
    required double lat,
    required double lng,
  }) async {
    final response = await _dio.post(
      ApiConstants.checkIn,
      data: {
        'lat': lat,
        'lng': lng,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> checkOut({
    required String employeeId,
  }) async {
    final response = await _dio.post(ApiConstants.checkOut);
    return response.data as Map<String, dynamic>;
  }

  // Geofence
  Future<List<dynamic>> getGeofences() async {
    final response = await _dio.get(ApiConstants.geofences);
    if (response.data is List) {
      return response.data as List<dynamic>;
    }
    return [];
  }

  Future<Map<String, dynamic>> checkGeofence({
    required double lat,
    required double lng,
  }) async {
    final response = await _dio.post(
      ApiConstants.geofenceCheck,
      data: {'lat': lat, 'lng': lng},
    );
    return response.data as Map<String, dynamic>;
  }
}
