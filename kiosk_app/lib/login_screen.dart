import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'kiosk_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      setState(() => _errorMessage = 'Please enter email and password');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final dio = Dio(BaseOptions(
        baseUrl: kApiBaseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
      ));

      final response = await dio.post('/api/v1/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool('kiosk_logged_in', true);
        await prefs.setString('kiosk_token', response.data['access_token'] ?? '');

        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const KioskScreen()),
          );
        }
      }
    } on DioException catch (e) {
      final detail = e.response?.data is Map
          ? e.response?.data['detail']?.toString()
          : null;
      setState(() => _errorMessage = detail ?? 'Login failed. Check your credentials.');
    } catch (e) {
      setState(() => _errorMessage = 'Connection error. Please try again.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F1A),
      body: Center(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(horizontal: 40.w),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo / Title
              Container(
                width: 80.r,
                height: 80.r,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                  ),
                  borderRadius: BorderRadius.circular(20.r),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF4F46E5).withValues(alpha: 0.4),
                      blurRadius: 24,
                      spreadRadius: 4,
                    ),
                  ],
                ),
                child: Icon(Icons.fingerprint, size: 44.sp, color: Colors.white),
              ),
              SizedBox(height: 32.h),
              Text(
                'Siddhan Logs Kiosk',
                style: GoogleFonts.poppins(
                  fontSize: 28.sp,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              SizedBox(height: 8.h),
              Text(
                'Sign in to start the kiosk',
                style: GoogleFonts.poppins(
                  fontSize: 14.sp,
                  color: Colors.white54,
                ),
              ),
              SizedBox(height: 48.h),

              // Email field
              TextField(
                controller: _emailController,
                style: GoogleFonts.poppins(color: Colors.white, fontSize: 14.sp),
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  labelText: 'Email',
                  labelStyle: GoogleFonts.poppins(color: Colors.white38),
                  prefixIcon: const Icon(Icons.email_outlined, color: Colors.white38),
                  filled: true,
                  fillColor: Colors.white.withValues(alpha: 0.06),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                    borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                    borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                    borderSide: const BorderSide(color: Color(0xFF4F46E5), width: 2),
                  ),
                ),
              ),
              SizedBox(height: 16.h),

              // Password field
              TextField(
                controller: _passwordController,
                style: GoogleFonts.poppins(color: Colors.white, fontSize: 14.sp),
                obscureText: _obscurePassword,
                onSubmitted: (_) => _login(),
                decoration: InputDecoration(
                  labelText: 'Password',
                  labelStyle: GoogleFonts.poppins(color: Colors.white38),
                  prefixIcon: const Icon(Icons.lock_outlined, color: Colors.white38),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? Icons.visibility_off : Icons.visibility,
                      color: Colors.white38,
                    ),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                  filled: true,
                  fillColor: Colors.white.withValues(alpha: 0.06),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                    borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                    borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                    borderSide: const BorderSide(color: Color(0xFF4F46E5), width: 2),
                  ),
                ),
              ),
              SizedBox(height: 12.h),

              // Error message
              if (_errorMessage != null)
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 8.h),
                  decoration: BoxDecoration(
                    color: Colors.red.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8.r),
                    border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error_outline, color: Colors.red, size: 16.sp),
                      SizedBox(width: 8.w),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: GoogleFonts.poppins(color: Colors.red, fontSize: 12.sp),
                        ),
                      ),
                    ],
                  ),
                ),
              SizedBox(height: 24.h),

              // Login button
              SizedBox(
                width: double.infinity,
                height: 50.h,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _login,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4F46E5),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12.r),
                    ),
                    elevation: 4,
                  ),
                  child: _isLoading
                      ? SizedBox(
                          width: 22.r,
                          height: 22.r,
                          child: const CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2.5,
                          ),
                        )
                      : Text(
                          'Sign In',
                          style: GoogleFonts.poppins(
                            fontSize: 16.sp,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
