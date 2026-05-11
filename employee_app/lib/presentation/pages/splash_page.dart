import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/constants/string_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_typography.dart';
import '../../data/datasources/local/local_storage.dart';
import '../../di.dart';
import 'login_page.dart';
import 'main_shell.dart';
import 'update_password_page.dart';
import 'face_capture_page.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  @override
  void initState() {
    super.initState();
    _checkAuthAndNavigate();
  }

  Future<void> _checkAuthAndNavigate() async {
    // Wait for 3 seconds
    await Future.delayed(const Duration(seconds: 3));
    if (!mounted) return;

    final localStorage = sl<LocalStorage>();
    final username = localStorage.getUsername();

    if (username != null && username.isNotEmpty) {
      // Check if user is new or face not registered
      final userData = localStorage.getUserData();
      final isNewUser = userData?['is_new_user'] as bool? ?? false;
      final faceRegistered = userData?['face_registered'] as bool? ?? false;

      if (isNewUser) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const UpdatePasswordPage()),
          (_) => false,
        );
      } else if (!faceRegistered) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const FaceCapturePage()),
          (_) => false,
        );
      } else {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const MainShell()),
          (_) => false,
        );
      }
    } else {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginPage()),
        (_) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [AppTheme.primaryColor, AppTheme.primaryDark],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 110.w,
                height: 110.w,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(28.r),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.15),
                      blurRadius: 30.r,
                      offset: Offset(0, 12.h),
                    ),
                  ],
                ),
                child: Icon(
                  Icons.fingerprint,
                  size: 60.sp,
                  color: AppTheme.primaryColor,
                ),
              ),
              SizedBox(height: 28.h),
              Text(
                Strings.appName,
                style: AppTypography.h1.copyWith(
                  color: Colors.white,
                  letterSpacing: 1.5,
                  fontSize: 28.sp,
                ),
              ),
              SizedBox(height: 8.h),
              Text(
                'AI-Powered Attendance',
                style: AppTypography.bodyMedium.copyWith(
                  color: Colors.white.withValues(alpha: 0.6),
                  letterSpacing: 0.5,
                ),
              ),
              SizedBox(height: 48.h),
              SizedBox(
                width: 28.w,
                height: 28.w,
                child: const CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
