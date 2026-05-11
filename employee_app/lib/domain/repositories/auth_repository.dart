import 'package:dartz/dartz.dart';

import '../entities/auth_token.dart';
import '../entities/employee.dart';

abstract class AuthRepository {
  Future<Either<String, AuthToken>> login({
    required String email,
    required String password,
  });
  Future<Either<String, AuthToken>> refreshToken(String refreshToken);
  Future<void> logout();
  Future<bool> isAuthenticated();
  Future<Employee?> getCachedUser();
  Future<String?> getAccessToken();
  Future<Either<String, Employee>> getProfile();
  Future<Either<String, Map<String, dynamic>>> updatePassword({
    required String newPassword,
    required String confirmPassword,
  });
  Future<Either<String, Map<String, dynamic>>> validateFace(List<int> imageBytes);
  Future<Either<String, Map<String, dynamic>>> registerSelfFace(List<int> imageBytes);
  Future<Either<String, Map<String, dynamic>>> register360Face(List<Map<String, dynamic>> captures);
}
