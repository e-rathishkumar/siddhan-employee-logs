# Kiosk App — AI-Powered Face Attendance Verification

A Flutter tablet application for office entrance face-based attendance verification using Clean Architecture.

## Project Structure

```
kiosk_app/
├── lib/
│   ├── main.dart                    # Entry point
│   └── src/
│       ├── di.dart                  # Dependency injection (GetIt)
│       ├── app.dart                 # MaterialApp configuration
│       ├── domain/                  # DOMAIN LAYER (pure Dart)
│       │   ├── entities/            # Employee, AttendanceResult, GpsLocation, AttendanceRecord, SyncStatus
│       │   ├── repositories/        # Abstract interfaces (AttendanceRepository, SyncRepository)
│       │   └── usecases/            # VerifyFaceAttendance, SyncPendingRecords
│       ├── data/                    # DATA LAYER (implements domain)
│       │   ├── api/                 # ApiClient (Dio), ApiConstants
│       │   ├── models/              # JSON DTOs with toEntity() converters
│       │   ├── repositories/        # AttendanceRepositoryImpl, SyncRepositoryImpl
│       │   ├── local/               # HiveStore (offline queue), SecureStorage (JWT)
│       │   └── interceptors/        # AuthInterceptor, ConnectivityInterceptor
│       └── presentation/            # PRESENTATION LAYER (BLoC + UI)
│           ├── bloc/                # AttendanceBloc (events, states)
│           ├── pages/               # KioskPage (full-screen camera UI)
│           └── widgets/             # CameraPreview, ResultOverlay, OfflineIndicator
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

- Camera integration with live preview and face positioning guide
- On-device face detection (pre-processing only — validates face presence)
- GPS capture alongside face image
- Backend API verification (all decisions from server)
- Real-time result display (approved/denied with employee name)
- Offline queue with auto-sync on reconnection
- Full-screen kiosk mode (landscape, immersive)

## Prerequisites

- Flutter SDK >= 3.4.0
- Dart SDK >= 3.4.0
- Physical device with camera
- Backend API running

## Setup & Run

```bash
# 1. Install dependencies
cd kiosk_app
flutter pub get

# 2. Generate JSON serialization code
dart run build_runner build --delete-conflicting-outputs

# 3. Configure API endpoint
#    Edit: lib/src/data/api/api_constants.dart
#    Set baseUrl to your backend

# 4. Run on tablet
flutter run -d <device-id>
```

### Environment Flavors

```bash
flutter run --dart-define=ENV=dev
flutter run --dart-define=ENV=staging
flutter run --dart-define=ENV=prod
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
| Data | Repository, API, Hive tests | flutter_test + mocktail |
| Presentation | BLoC tests, widget tests | bloc_test + mocktail |

## Security

- JWT stored in `flutter_secure_storage`
- Auth interceptor handles token refresh on 401
- All attendance decisions from backend only
- Face detection is preprocessing only

## Offline Support

- Hive-based offline queue for failed requests
- Connectivity listener triggers automatic sync
- Backend is source of truth for conflict resolution
