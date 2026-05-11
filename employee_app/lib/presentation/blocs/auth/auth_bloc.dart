import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../domain/repositories/auth_repository.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _authRepository;

  AuthBloc({required AuthRepository authRepository})
      : _authRepository = authRepository,
        super(const AuthInitial()) {
    on<AuthCheckRequested>(_onCheckAuth);
    on<AuthLoginRequested>(_onLogin);
    on<AuthLogoutRequested>(_onLogout);
    on<AuthProfileRefreshRequested>(_onProfileRefresh);
  }

  Future<void> _onCheckAuth(
    AuthCheckRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    final isAuth = await _authRepository.isAuthenticated();
    if (!isAuth) {
      emit(const AuthUnauthenticated());
      return;
    }

    // Try to fetch fresh profile from API
    final profileResult = await _authRepository.getProfile();
    final user = profileResult.fold(
      (_) => null,
      (employee) => employee,
    );

    if (user != null) {
      emit(AuthAuthenticated(user: user));
    } else {
      // Fallback to cached data
      final cachedUser = await _authRepository.getCachedUser();
      if (cachedUser != null) {
        emit(AuthAuthenticated(user: cachedUser));
      } else {
        emit(const AuthUnauthenticated());
      }
    }
  }

  Future<void> _onLogin(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    final result = await _authRepository.login(
      email: event.email,
      password: event.password,
    );

    result.fold(
      (error) => emit(AuthError(message: error)),
      (authToken) => emit(AuthAuthenticated(user: authToken.user)),
    );
  }

  Future<void> _onLogout(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    await _authRepository.logout();
    emit(const AuthUnauthenticated());
  }

  Future<void> _onProfileRefresh(
    AuthProfileRefreshRequested event,
    Emitter<AuthState> emit,
  ) async {
    final profileResult = await _authRepository.getProfile();
    profileResult.fold(
      (_) {
        // Keep current state on failure
      },
      (employee) => emit(AuthAuthenticated(user: employee)),
    );
  }
}
