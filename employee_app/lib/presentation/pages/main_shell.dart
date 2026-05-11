import 'dart:async';
import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';

import '../../data/datasources/remote/websocket_service.dart';
import '../../data/datasources/local/local_storage.dart';
import '../blocs/attendance/attendance_bloc.dart';
import '../blocs/attendance/attendance_event.dart';
import '../blocs/auth/auth_bloc.dart';
import '../blocs/auth/auth_event.dart';
import '../blocs/auth/auth_state.dart';
import '../blocs/geofence/geofence_bloc.dart';
import '../blocs/geofence/geofence_event.dart';
import 'dashboard_page.dart';
import 'login_page.dart';
import 'profile_page.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> with WidgetsBindingObserver {
  Timer? _geofenceTimer;
  StreamSubscription? _wsSubscription;
  String? _connectedToken;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _checkGeofence();
    _refreshProfile();
    _tryConnectWebSocket();
    _geofenceTimer = Timer.periodic(
      const Duration(minutes: 15),
      (_) => _checkGeofence(),
    );
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Reconnect WebSocket and refresh data when app comes to foreground
      _reconnectWebSocket();
      _refreshDashboard();
    }
  }

  /// Try connecting WebSocket. If auth is ready, connects immediately.
  /// Otherwise, will be retried when AuthBloc emits AuthAuthenticated.
  Future<void> _tryConnectWebSocket() async {
    final localStorage = GetIt.instance<LocalStorage>();
    final token = await localStorage.getAccessToken();
    if (token != null && token.isNotEmpty) {
      _connectWebSocket(token);
    }
  }

  /// Force reconnect WebSocket (e.g. after token refresh or app resume).
  Future<void> _reconnectWebSocket() async {
    final localStorage = GetIt.instance<LocalStorage>();
    final token = await localStorage.getAccessToken();
    if (token != null && token.isNotEmpty && token != _connectedToken) {
      // Token changed — reconnect with new token
      _connectWebSocket(token);
    } else if (token != null && token.isNotEmpty) {
      // Same token — check if WS is still alive, reconnect if needed
      final wsService = GetIt.instance<WebSocketService>();
      if (!wsService.isConnected) {
        _connectWebSocket(token);
      }
    }
  }

  void _connectWebSocket(String token) {
    _connectedToken = token;
    final wsService = GetIt.instance<WebSocketService>();
    wsService.connect(token);
    _wsSubscription?.cancel();
    _wsSubscription = wsService.events.listen((event) {
      if (!mounted) return;
      final eventType = event['event'] as String?;
      log('WS event received in MainShell: $eventType');
      if (eventType == 'attendance_update' || eventType == 'dashboard_update') {
        _refreshDashboard();
      }
    });
  }

  void _checkGeofence() {
    context.read<GeofenceBloc>().add(const GeofenceCheckRequested());
  }

  void _refreshProfile() {
    context.read<AuthBloc>().add(const AuthProfileRefreshRequested());
  }

  Future<void> _navigateToProfile() async {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const ProfilePage()),
    );
    // Refresh dashboard data when returning from profile
    if (mounted) {
      _refreshDashboard();
    }
  }

  void _refreshDashboard() {
    final authState = context.read<AuthBloc>().state;
    if (authState is AuthAuthenticated) {
      context.read<AttendanceBloc>().add(
            AttendanceTodayRequested(employeeId: authState.user.id),
          );
      context.read<AttendanceBloc>().add(
            AttendanceDashboardRequested(),
          );
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _geofenceTimer?.cancel();
    _wsSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthUnauthenticated) {
          // Disconnect WebSocket on logout
          _connectedToken = null;
          _wsSubscription?.cancel();
          GetIt.instance<WebSocketService>().dispose();
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (_) => const LoginPage()),
            (_) => false,
          );
        } else if (state is AuthAuthenticated) {
          // Auth just resolved — connect/reconnect WebSocket
          _reconnectWebSocket();
          // Also refresh dashboard data now that we have the user
          _refreshDashboard();
        }
      },
      child: Scaffold(
        body: DashboardPage(onNavigateToProfile: _navigateToProfile),
      ),
    );
  }
}
