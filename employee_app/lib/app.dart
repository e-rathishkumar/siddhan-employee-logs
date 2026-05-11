import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'core/theme/app_theme.dart';
import 'di.dart';
import 'presentation/blocs/attendance/attendance_bloc.dart';
import 'presentation/blocs/auth/auth_bloc.dart';
import 'presentation/blocs/auth/auth_event.dart';
import 'presentation/blocs/geofence/geofence_bloc.dart';
import 'presentation/pages/splash_page.dart';

class EmployeeApp extends StatelessWidget {
  const EmployeeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(375, 812),
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, child) {
        return MultiBlocProvider(
          providers: [
            BlocProvider<AuthBloc>(
              create: (_) => sl<AuthBloc>()..add(const AuthCheckRequested()),
            ),
            BlocProvider<GeofenceBloc>(
              create: (_) => sl<GeofenceBloc>(),
            ),
            BlocProvider<AttendanceBloc>(
              create: (_) => sl<AttendanceBloc>(),
            ),
          ],
          child: MaterialApp(
            title: 'Siddhan Logs',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            locale: const Locale('en'),
            supportedLocales: const [Locale('en')],
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            home: const SplashPage(),
          ),
        );
      },
    );
  }
}
