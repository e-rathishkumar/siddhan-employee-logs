class AppConstants {
  AppConstants._();

  static const String appName = 'AttendAI';
  static const String appVersion = '1.0.0';

  // Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userDataKey = 'user_data';
  static const String localeKey = 'locale';
  static const String onboardingKey = 'onboarding_complete';
  static const String fcmTokenKey = 'fcm_token';

  // Geofence
  static const double defaultGeofenceRadius = 200.0; // meters

  // Animation Durations
  static const Duration splashDuration = Duration(seconds: 2);
  static const Duration animationFast = Duration(milliseconds: 200);
  static const Duration animationNormal = Duration(milliseconds: 300);
  static const Duration animationSlow = Duration(milliseconds: 500);

  // Pagination
  static const int defaultPageSize = 20;
}
