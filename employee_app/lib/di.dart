import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/constants/api_constants.dart';
import 'data/datasources/local/local_storage.dart';
import 'data/datasources/remote/api_client.dart';
import 'data/datasources/remote/websocket_service.dart';
import 'data/repositories/attendance_repository_impl.dart';
import 'data/repositories/auth_repository_impl.dart';
import 'data/repositories/geofence_repository_impl.dart';
import 'domain/repositories/attendance_repository.dart';
import 'domain/repositories/auth_repository.dart';
import 'domain/repositories/geofence_repository.dart';
import 'presentation/blocs/attendance/attendance_bloc.dart';
import 'presentation/blocs/auth/auth_bloc.dart';
import 'presentation/blocs/geofence/geofence_bloc.dart';

final sl = GetIt.instance;

Future<void> setupDependencies() async {
  // External
  final prefs = await SharedPreferences.getInstance();
  sl.registerSingleton<SharedPreferences>(prefs);
  sl.registerLazySingleton<FlutterSecureStorage>(
      () => const FlutterSecureStorage());
  sl.registerLazySingleton<Connectivity>(() => Connectivity());

  // Local Storage
  sl.registerLazySingleton<LocalStorage>(() => LocalStorage(
        secureStorage: sl<FlutterSecureStorage>(),
        prefs: sl<SharedPreferences>(),
      ));

  // Network
  sl.registerLazySingleton<Dio>(() {
    final dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: ApiConstants.connectTimeout,
      receiveTimeout: ApiConstants.receiveTimeout,
      sendTimeout: ApiConstants.sendTimeout,
      headers: {'Content-Type': 'application/json'},
    ));

    // Auth interceptor
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await sl<LocalStorage>().getAccessToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final refreshToken = await sl<LocalStorage>().getRefreshToken();
          if (refreshToken != null) {
            try {
              final response = await Dio().post(
                '${ApiConstants.baseUrl}${ApiConstants.refreshToken}',
                data: {'refresh_token': refreshToken},
              );
              final newToken = response.data['access_token'] as String;
              await sl<LocalStorage>().saveAccessToken(newToken);

              error.requestOptions.headers['Authorization'] =
                  'Bearer $newToken';
              final retryResponse = await dio.fetch(error.requestOptions);
              handler.resolve(retryResponse);
              return;
            } catch (_) {
              await sl<LocalStorage>().clearAll();
            }
          }
        }
        handler.next(error);
      },
    ));

    dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      error: true,
    ));

    return dio;
  });

  sl.registerLazySingleton<ApiClient>(() => ApiClient(sl<Dio>()));

  // Repositories
  sl.registerLazySingleton<AuthRepository>(() => AuthRepositoryImpl(
        apiClient: sl<ApiClient>(),
        localStorage: sl<LocalStorage>(),
      ));

  sl.registerLazySingleton<AttendanceRepository>(
      () => AttendanceRepositoryImpl(apiClient: sl<ApiClient>()));

  // WebSocket
  sl.registerLazySingleton<WebSocketService>(() => WebSocketService());

  sl.registerLazySingleton<GeofenceRepository>(
      () => GeofenceRepositoryImpl(apiClient: sl<ApiClient>()));

  // BLoCs
  sl.registerFactory<AuthBloc>(
      () => AuthBloc(authRepository: sl<AuthRepository>()));

  sl.registerFactory<AttendanceBloc>(
      () => AttendanceBloc(attendanceRepository: sl<AttendanceRepository>()));

  sl.registerFactory<GeofenceBloc>(
      () => GeofenceBloc(geofenceRepository: sl<GeofenceRepository>()));
}
