import 'package:equatable/equatable.dart';

import '../../../domain/entities/attendance_record.dart';

abstract class AttendanceState extends Equatable {
  const AttendanceState();

  @override
  List<Object?> get props => [];
}

class AttendanceInitial extends AttendanceState {
  const AttendanceInitial();
}

class AttendanceLoading extends AttendanceState {
  const AttendanceLoading();
}

class AttendanceLoaded extends AttendanceState {
  final List<AttendanceRecord> records;
  final AttendanceRecord? todayRecord;
  final bool hasMore;
  final Map<String, dynamic>? dashboardData;

  const AttendanceLoaded({
    required this.records,
    this.todayRecord,
    this.hasMore = false,
    this.dashboardData,
  });

  @override
  List<Object?> get props => [records, todayRecord, hasMore, dashboardData];

  AttendanceLoaded copyWith({
    List<AttendanceRecord>? records,
    AttendanceRecord? todayRecord,
    bool? hasMore,
    Map<String, dynamic>? dashboardData,
  }) {
    return AttendanceLoaded(
      records: records ?? this.records,
      todayRecord: todayRecord ?? this.todayRecord,
      hasMore: hasMore ?? this.hasMore,
      dashboardData: dashboardData ?? this.dashboardData,
    );
  }
}

class AttendanceActionLoading extends AttendanceState {
  final AttendanceLoaded previousState;

  const AttendanceActionLoading({required this.previousState});

  @override
  List<Object?> get props => [previousState];
}

class AttendanceError extends AttendanceState {
  final String message;

  const AttendanceError({required this.message});

  @override
  List<Object?> get props => [message];
}
