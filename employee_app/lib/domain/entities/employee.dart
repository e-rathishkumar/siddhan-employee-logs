import 'package:equatable/equatable.dart';

class Employee extends Equatable {
  final String id;
  final String employeeId;
  final String name;
  final String email;
  final String? phone;
  final String department;
  final String designation;
  final String? gender;
  final DateTime joinedAt;
  final bool isActive;
  final bool faceRegistered;
  final String? profilePhotoUrl;
  final bool isNewUser;

  const Employee({
    required this.id,
    required this.employeeId,
    required this.name,
    required this.email,
    this.phone,
    required this.department,
    required this.designation,
    this.gender,
    required this.joinedAt,
    this.isActive = true,
    this.faceRegistered = false,
    this.profilePhotoUrl,
    this.isNewUser = false,
  });

  Employee copyWith({
    String? id,
    String? employeeId,
    String? name,
    String? email,
    String? phone,
    String? department,
    String? designation,
    String? gender,
    DateTime? joinedAt,
    bool? isActive,
    bool? faceRegistered,
    String? profilePhotoUrl,
    bool? isNewUser,
  }) {
    return Employee(
      id: id ?? this.id,
      employeeId: employeeId ?? this.employeeId,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      department: department ?? this.department,
      designation: designation ?? this.designation,
      gender: gender ?? this.gender,
      joinedAt: joinedAt ?? this.joinedAt,
      isActive: isActive ?? this.isActive,
      faceRegistered: faceRegistered ?? this.faceRegistered,
      profilePhotoUrl: profilePhotoUrl ?? this.profilePhotoUrl,
      isNewUser: isNewUser ?? this.isNewUser,
    );
  }

  @override
  List<Object?> get props => [id, employeeId, name, email];
}
