# Employee App — AI-Powered Attendance System

A Flutter mobile application for employees to track attendance, enable GPS tracking, and receive push notifications. Built with Clean Architecture.

## Project Structure

```
employee_app/
├── lib/
│   ├── main.dart                    # Entry point (Firebase, Hive, DI init)
│   └── src/
│       ├── di.dart                  # Dependency injection (GetIt)
│       ├── app.dart                 # MaterialApp with auth-gated routing
│       ├── domain/                  # DOMAIN LAYER (pure Dart)
│       │   ├── entities/            # Employee, AttendanceRecord, GpsLocation, SyncStatus
│       │   ├── repositories/        # Abstract interfaces (Attendance, Auth, Location, Sync)
│       │   └── usecases/            # GetAttendanceHistory, Login, Logout, StartLocationTracking, SyncPendingRecords
│       ├── data/                    # DATA LAYER (implements domain)
│       │   ├── api/                 # ApiClient (Dio), ApiConstants
│       │   ├── models/              # JSON DTOs (AttendanceRecordModel, LoginResponseModel)
│       │   ├── repositories/        # All repository implementations
│       │   ├── local/               # HiveStore (cache + queue), SecureStorage (JWT)
│       │   └── interceptors/        # AuthInterceptor, ConnectivityInterceptor
│       └── presentation/            # PRESENTATION LAYER (BLoC + UI)
│           ├── bloc/                # AuthBloc, HistoryBloc, TrackingBloc
│           ├── pages/               # LoginPage, HomePage, HistoryPage, TrackingPage, ProfilePage
│           ├── widgets/             # AttendanceCard, OfflineBanner
│           └── services/            # NotificationService (FCM)
├── test/
│   ├── domain/                      # Use case unit tests
│   ├── data/                        # Repository & storage tests
│   └── presentation/                # BLoC & widget tests
└── pubspec.yaml
```

## Architecture

**Clean Architecture** with strict layer separation:

| Layer | Directory | Rule |
|-------|-----------|------|
| Domain | `lib/src/domain/` | Pure Dart. Imports nothing from data or presentation. |
| Data | `lib/src/data/` | Imports from domain only. Implements repository interfaces. |
| Presentation | `lib/src/presentation/` | Imports from domain. Accesses data via DI. |

**State Management:** BLoC (flutter_bloc)

## Features

- Login/authentication with JWT (secure storage)
- Attendance history with pull-to-refresh and offline cache
- Background GPS tracking with periodic sync to backend
- Push notifications via Firebase Cloud Messaging
- Offline-first: cached data available when disconnected
- Bottom navigation (History, Tracking, Profile)

## Prerequisites

- Flutter SDK >= 3.4.0
- Dart SDK >= 3.4.0
- Firebase project configured
- Backend API running

## Setup & Run

```bash
# 1. Install dependencies
cd employee_app
flutter pub get

# 2. Generate JSON serialization code
dart run build_runner build --delete-conflicting-outputs

# 3. Configure API endpoint
#    Edit: lib/src/data/api/api_constants.dart
#    Set baseUrl to your backend

# 4. Firebase setup
#    - Create Firebase project
#    - Android: download google-services.json → android/app/
#    - iOS: download GoogleService-Info.plist → ios/Runner/
#    - Enable Cloud Messaging

# 5. Run
flutter run
```

### Environment Flavors

```bash
flutter run --dart-define=ENV=dev
flutter run --dart-define=ENV=staging
flutter run --dart-define=ENV=prod
```

### Platform Configuration

**Android** (`android/app/src/main/AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION"/>
<uses-permission android:name="android.permission.INTERNET"/>
```

**iOS** (`ios/Runner/Info.plist`):
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Location is needed for attendance tracking</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Background location is needed for attendance tracking</string>
<key>UIBackgroundModes</key>
<array>
    <string>location</string>
    <string>remote-notification</string>
</array>
```

## Testing

```bash
# Run all tests
flutter test

# Run by layer
flutter test test/domain/
flutter test test/data/
flutter test test/presentation/

# Run with coverage report
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html
```

### Test Coverage Target: 80%+

| Layer | Tests | Framework |
|-------|-------|-----------|
| Domain | Use case unit tests | flutter_test + mocktail |
| Data | Repository, API, storage tests | flutter_test + mocktail |
| Presentation | BLoC tests, widget tests | bloc_test + mocktail |

## Backend Integration

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | JWT authentication |
| `/auth/refresh` | POST | Token refresh |
| `/attendance/history` | GET | Attendance records |
| `/tracking/location` | POST | GPS location sync |

## Security

- JWT stored in `flutter_secure_storage`
- Auth interceptor handles token refresh on 401
- All attendance decisions from backend only
- Certificate pinning recommended via Dio interceptor

## Offline Support

- Hive caches attendance history and queues GPS data
- Connectivity listener triggers automatic sync on reconnection
- Backend is source of truth for conflict resolution
- Attendance history viewable offline from cache

## Push Notifications

Firebase Cloud Messaging:
- Attendance status updates (approved/denied)
- Topic-based subscription per employee
- Foreground, background, and terminated state handling
