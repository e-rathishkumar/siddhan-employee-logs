import 'package:equatable/equatable.dart';

abstract class AttendanceEvent extends Equatable {
  const AttendanceEvent();

  @override
  List<Object?> get props => [];
}

class AttendanceHistoryRequested extends AttendanceEvent {
  final String employeeId;
  final int page;

  const AttendanceHistoryRequested({
    required this.employeeId,
    this.page = 1,
  });

  @override
  List<Object?> get props => [employeeId, page];
}

class AttendanceTodayRequested extends AttendanceEvent {
  final String employeeId;

  const AttendanceTodayRequested({required this.employeeId});

  @override
  List<Object?> get props => [employeeId];
}

class AttendanceCheckInRequested extends AttendanceEvent {
  final String employeeId;

  const AttendanceCheckInRequested({required this.employeeId});

  @override
  List<Object?> get props => [employeeId];
}

class AttendanceCheckOutRequested extends AttendanceEvent {
  final String employeeId;

  const AttendanceCheckOutRequested({required this.employeeId});

  @override
  List<Object?> get props => [employeeId];
}

class AttendanceDashboardRequested extends AttendanceEvent {
  const AttendanceDashboardRequested();
}

class AttendanceResetRequested extends AttendanceEvent {
  const AttendanceResetRequested();
}

class AttendanceLiveUpdateReceived extends AttendanceEvent {
  final Map<String, dynamic> data;

  const AttendanceLiveUpdateReceived({required this.data});

  @override
  List<Object?> get props => [data];
}
