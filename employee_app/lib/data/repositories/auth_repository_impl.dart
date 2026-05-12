import 'dart:convert';

import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';

import '../../domain/entities/auth_token.dart';
import '../../domain/entities/employee.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/local/local_storage.dart';
import '../datasources/remote/api_client.dart';
import '../models/auth_models.dart';

class AuthRepositoryImpl implements AuthRepository {
  final ApiClient _apiClient;
  final LocalStorage _localStorage;

  AuthRepositoryImpl({
    required ApiClient apiClient,
    required LocalStorage localStorage,
  })  : _apiClient = apiClient,
        _localStorage = localStorage;

  /// Decode JWT payload to extract username
  String? _decodeJwtUsername(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;
      final payload = parts[1];
      // Add padding if needed
      final normalized = base64Url.normalize(payload);
      final decoded = utf8.decode(base64Url.decode(normalized));
      final map = jsonDecode(decoded) as Map<String, dynamic>;
      return map['name'] as String? ?? map['email'] as String?;
    } catch (_) {
      return null;
    }
  }

  @override
  Future<Either<String, AuthToken>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _apiClient.login(email: email, password: password);
      final authToken = AuthTokenModel.fromJson(response);

      await _localStorage.saveAccessToken(authToken.accessToken);
      await _localStorage.saveRefreshToken(authToken.refreshToken);

      // Decode JWT and store username
      final username = _decodeJwtUsername(authToken.accessToken);
      if (username != null) {
        await _localStorage.saveUsername(username);
      }

      await _localStorage.saveUserData(
        EmployeeModel(
          id: authToken.user.id,
          employeeId: authToken.user.employeeId,
          name: authToken.user.name,
          email: authToken.user.email,
          phone: authToken.user.phone,
          department: authToken.user.department,
          designation: authToken.user.designation,
          gender: authToken.user.gender,
          joinedAt: authToken.user.joinedAt,
          isActive: authToken.user.isActive,
          faceRegistered: authToken.user.faceRegistered,
        ).toJson(),
      );

      return Right(authToken);
    } on DioException catch (e) {
      final data = e.response?.data;
      String message = 'Login failed';
      if (data is Map<String, dynamic>) {
        message = data['detail']?.toString() ?? message;
      } else if (data is String && data.isNotEmpty) {
        message = data;
      }
      if (e.response?.statusCode == 401) {
        return Left(message.isNotEmpty ? message : 'Invalid email or password');
      }
      return Left(message);
    } catch (e) {
      return Left('Login failed: ${e.toString()}');
    }
  }

  @override
  Future<Either<String, AuthToken>> refreshToken(String refreshTokenStr) async {
    try {
      final response = await _apiClient.refreshToken(refreshTokenStr);
      final authToken = AuthTokenModel.fromJson(response);

      await _localStorage.saveAccessToken(authToken.accessToken);
      await _localStorage.saveRefreshToken(authToken.refreshToken);

      return Right(authToken);
    } catch (e) {
      return const Left('Session expired');
    }
  }

  @override
  Future<void> logout() async {
    await _localStorage.clearAll();
  }

  @override
  Future<bool> isAuthenticated() async {
    final token = await _localStorage.getAccessToken();
    return token != null && token.isNotEmpty;
  }

  @override
  Future<Employee?> getCachedUser() async {
    final userData = _localStorage.getUserData();
    if (userData == null) return null;
    return EmployeeModel.fromJson(userData);
  }

  @override
  Future<String?> getAccessToken() async {
    return await _localStorage.getAccessToken();
  }

  @override
  Future<Either<String, Employee>> getProfile() async {
    try {
      final response = await _apiClient.getProfile();
      final employee = EmployeeModel.fromJson(response);

      // Update cached user data
      await _localStorage.saveUserData(employee.toJson());

      return Right(employee);
    } on DioException catch (e) {
      final data = e.response?.data;
      return Left(data is Map ? data['detail']?.toString() ?? 'Failed to load profile' : 'Failed to load profile');
    } catch (e) {
      return Left('Failed to load profile');
    }
  }

  @override
  Future<Either<String, Map<String, dynamic>>> updatePassword({
    required String newPassword,
    required String confirmPassword,
  }) async {
    try {
      final response = await _apiClient.updatePassword(
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      );

      // Save the new tokens
      if (response['access_token'] != null) {
        await _localStorage.saveAccessToken(response['access_token'] as String);
      }
      if (response['refresh_token'] != null) {
        await _localStorage.saveRefreshToken(response['refresh_token'] as String);
      }

      // Update cached user data to reflect is_new_user = false
      final userData = _localStorage.getUserData();
      if (userData != null) {
        userData['is_new_user'] = false;
        await _localStorage.saveUserData(userData);
      }

      return Right(response);
    } on DioException catch (e) {
      final data = e.response?.data;
      return Left(data is Map ? data['detail']?.toString() ?? 'Failed to update password' : 'Failed to update password');
    } catch (e) {
      return Left('Failed to update password: ${e.toString()}');
    }
  }

  @override
  Future<Either<String, Map<String, dynamic>>> validateFace(List<int> imageBytes) async {
    try {
      final response = await _apiClient.validateFace(imageBytes, 'face_capture.jpg');
      return Right(response);
    } on DioException catch (e) {
      final data = e.response?.data;
      return Left(data is Map ? data['detail']?.toString() ?? 'Face validation failed' : 'Face validation failed');
    } catch (e) {
      return Left('Face validation failed: ${e.toString()}');
    }
  }

  @override
  Future<Either<String, Map<String, dynamic>>> registerSelfFace(List<int> imageBytes) async {
    try {
      final response = await _apiClient.registerSelfFace(imageBytes, 'face_photo.jpg');
      return Right(response);
    } on DioException catch (e) {
      final data = e.response?.data;
      return Left(data is Map ? data['detail']?.toString() ?? 'Face registration failed' : 'Face registration failed');
    } catch (e) {
      return Left('Face registration failed: ${e.toString()}');
    }
  }

  @override
  Future<Either<String, Map<String, dynamic>>> register360Face(
    List<Map<String, dynamic>> captures,
  ) async {
    try {
      final response = await _apiClient.register360Face(captures);
      return Right(response);
    } on DioException catch (e) {
      final data = e.response?.data;
      final detail = data is Map ? data['detail']?.toString() : null;
      return Left(detail ?? '360° face registration failed (${e.response?.statusCode ?? 'no response'})');
    } catch (e) {
      return Left('360° face registration failed: ${e.toString()}');
    }
  }
}
