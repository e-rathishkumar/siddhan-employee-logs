import 'package:equatable/equatable.dart';

import 'employee.dart';

class AuthToken extends Equatable {
  final String accessToken;
  final String refreshToken;
  final Employee user;

  const AuthToken({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  @override
  List<Object?> get props => [accessToken, refreshToken];
}
