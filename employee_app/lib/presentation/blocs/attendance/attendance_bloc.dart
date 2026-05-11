import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geolocator/geolocator.dart';

import '../../../domain/entities/attendance_record.dart';
import '../../../domain/repositories/attendance_repository.dart';
import 'attendance_event.dart';
import 'attendance_state.dart';

class AttendanceBloc extends Bloc<AttendanceEvent, AttendanceState> {
  final AttendanceRepository _attendanceRepository;

  AttendanceBloc({required AttendanceRepository attendanceRepository})
      : _attendanceRepository = attendanceRepository,
        super(const AttendanceInitial()) {
    on<AttendanceHistoryRequested>(_onHistoryRequested);
    on<AttendanceTodayRequested>(_onTodayRequested);
    on<AttendanceCheckInRequested>(_onCheckIn);
    on<AttendanceCheckOutRequested>(_onCheckOut);
    on<AttendanceDashboardRequested>(_onDashboardRequested);
    on<AttendanceResetRequested>(_onReset);
    on<AttendanceLiveUpdateReceived>(_onLiveUpdate);
  }

  Future<void> _onHistoryRequested(
    AttendanceHistoryRequested event,
    Emitter<AttendanceState> emit,
  ) async {
    emit(const AttendanceLoading());

    final result = await _attendanceRepository.getHistory(
      employeeId: event.employeeId,
      page: event.page,
    );

    result.fold(
      (error) => emit(AttendanceError(message: error)),
      (records) => emit(AttendanceLoaded(
        records: records,
        todayRecord: state is AttendanceLoaded
            ? (state as AttendanceLoaded).todayRecord
            : null,
      )),
    );
  }

  Future<void> _onTodayRequested(
    AttendanceTodayRequested event,
    Emitter<AttendanceState> emit,
  ) async {
    final currentRecords =
        state is AttendanceLoaded ? (state as AttendanceLoaded).records : <AttendanceRecord>[];
    final currentDashboard =
        state is AttendanceLoaded ? (state as AttendanceLoaded).dashboardData : null;

    final result = await _attendanceRepository.getTodayLog(event.employeeId);

    result.fold(
      (error) => emit(AttendanceError(message: error)),
      (record) => emit(AttendanceLoaded(
        records: currentRecords,
        todayRecord: record,
        dashboardData: currentDashboard,
      )),
    );
  }

  Future<void> _onCheckIn(
    AttendanceCheckInRequested event,
    Emitter<AttendanceState> emit,
  ) async {
    final currentState = state;
    if (currentState is AttendanceLoaded) {
      emit(AttendanceActionLoading(previousState: currentState));
    }

    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );

      final result = await _attendanceRepository.checkIn(
        employeeId: event.employeeId,
        lat: position.latitude,
        lng: position.longitude,
      );

      result.fold(
        (error) => emit(AttendanceError(message: error)),
        (record) {
          final records = currentState is AttendanceLoaded
              ? currentState.records
              : <AttendanceRecord>[];
          emit(AttendanceLoaded(
            records: List.from(records),
            todayRecord: record,
          ));
        },
      );
    } catch (e) {
      emit(AttendanceError(message: 'Check-in failed: ${e.toString()}'));
    }
  }

  Future<void> _onCheckOut(
    AttendanceCheckOutRequested event,
    Emitter<AttendanceState> emit,
  ) async {
    final currentState = state;
    if (currentState is AttendanceLoaded) {
      emit(AttendanceActionLoading(previousState: currentState));
    }

    try {
      // Check-out does NOT require geofence verification
      final result = await _attendanceRepository.checkOut(
        employeeId: event.employeeId,
      );

      result.fold(
        (error) => emit(AttendanceError(message: error)),
        (record) {
          final records = currentState is AttendanceLoaded
              ? currentState.records
              : <AttendanceRecord>[];
          emit(AttendanceLoaded(
            records: List.from(records),
            todayRecord: record,
          ));
        },
      );
    } catch (e) {
      emit(AttendanceError(message: 'Check-out failed: ${e.toString()}'));
    }
  }

  Future<void> _onDashboardRequested(
    AttendanceDashboardRequested event,
    Emitter<AttendanceState> emit,
  ) async {
    final result = await _attendanceRepository.getDashboard();
    result.fold(
      (_) {}, // Silently ignore dashboard errors
      (data) {
        if (state is AttendanceLoaded) {
          emit((state as AttendanceLoaded).copyWith(dashboardData: data));
        } else {
          emit(AttendanceLoaded(
            records: const [],
            dashboardData: data,
          ));
        }
      },
    );
  }

  void _onReset(
    AttendanceResetRequested event,
    Emitter<AttendanceState> emit,
  ) {
    emit(const AttendanceInitial());
  }

  /// When a WebSocket live update arrives, re-fetch today log AND dashboard data.
  Future<void> _onLiveUpdate(
    AttendanceLiveUpdateReceived event,
    Emitter<AttendanceState> emit,
  ) async {
    // Re-fetch dashboard (uses JWT, no employee_id needed)
    final dashResult = await _attendanceRepository.getDashboard();

    final currentRecords =
        state is AttendanceLoaded ? (state as AttendanceLoaded).records : <AttendanceRecord>[];

    AttendanceRecord? todayRecord =
        state is AttendanceLoaded ? (state as AttendanceLoaded).todayRecord : null;
    Map<String, dynamic>? dashboardData =
        state is AttendanceLoaded ? (state as AttendanceLoaded).dashboardData : null;

    dashResult.fold((_) {}, (data) {
      dashboardData = data;
    });

    emit(AttendanceLoaded(
      records: currentRecords,
      todayRecord: todayRecord,
      dashboardData: dashboardData,
    ));
  }
}
