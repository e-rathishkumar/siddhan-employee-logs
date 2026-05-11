import '../../domain/entities/employee.dart';
import '../../domain/entities/auth_token.dart';

class AuthTokenModel extends AuthToken {
  const AuthTokenModel({
    required super.accessToken,
    required super.refreshToken,
    required super.user,
  });

  factory AuthTokenModel.fromJson(Map<String, dynamic> json) {
    final userJson = json['user'] as Map<String, dynamic>;
    return AuthTokenModel(
      accessToken: json['access_token'] as String,
      refreshToken: json['refresh_token'] as String,
      user: EmployeeModel.fromJson(userJson),
    );
  }
}

class EmployeeModel extends Employee {
  const EmployeeModel({
    required super.id,
    required super.employeeId,
    required super.name,
    required super.email,
    super.phone,
    required super.department,
    required super.designation,
    super.gender,
    required super.joinedAt,
    super.isActive,
    super.faceRegistered,
    super.profilePhotoUrl,
    super.isNewUser,
  });

  factory EmployeeModel.fromJson(Map<String, dynamic> json) {
    // Extract primary face photo URL
    String? photoUrl;
    if (json['face_photos'] is List && (json['face_photos'] as List).isNotEmpty) {
      final photos = json['face_photos'] as List;
      final primary = photos.firstWhere(
        (p) => p['is_primary'] == true,
        orElse: () => photos.first,
      );
      photoUrl = primary['url']?.toString();
    } else if (json['profile_photo_url'] != null) {
      photoUrl = json['profile_photo_url']?.toString();
    }

    return EmployeeModel(
      id: json['id']?.toString() ?? '',
      employeeId: json['employee_id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString(),
      department: json['department']?.toString() ?? '',
      designation: json['designation']?.toString() ?? '',
      gender: json['gender']?.toString(),
      joinedAt: json['joined_at'] != null
          ? DateTime.tryParse(json['joined_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      isActive: json['is_active'] as bool? ?? true,
      faceRegistered: json['face_registered'] as bool? ?? false,
      profilePhotoUrl: photoUrl,
      isNewUser: json['is_new_user'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employee_id': employeeId,
      'name': name,
      'email': email,
      'phone': phone,
      'department': department,
      'designation': designation,
      'gender': gender,
      'joined_at': joinedAt.toIso8601String(),
      'is_active': isActive,
      'face_registered': faceRegistered,
      'profile_photo_url': profilePhotoUrl,
      'is_new_user': isNewUser,
    };
  }
}
