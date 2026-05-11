import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/theme/app_theme.dart';
import '../../core/theme/app_typography.dart';
import '../../core/extensions/context_extensions.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../di.dart';
import 'face_capture_page.dart';

class UpdatePasswordPage extends StatefulWidget {
  const UpdatePasswordPage({super.key});

  @override
  State<UpdatePasswordPage> createState() => _UpdatePasswordPageState();
}

class _UpdatePasswordPageState extends State<UpdatePasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final authRepo = sl<AuthRepository>();
    final result = await authRepo.updatePassword(
      newPassword: _newPasswordController.text,
      confirmPassword: _confirmPasswordController.text,
    );

    if (!mounted) return;
    setState(() => _isLoading = false);

    result.fold(
      (error) {
        context.showSnackBar(error, isError: true);
      },
      (data) {
        context.showSnackBar('Password updated successfully');
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const FaceCapturePage()),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(horizontal: 24.w),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80.w,
                  height: 80.w,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppTheme.primaryLight, AppTheme.primaryDark],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(24.r),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primaryColor.withValues(alpha: 0.3),
                        blurRadius: 24.r,
                        offset: Offset(0, 12.h),
                      ),
                    ],
                  ),
                  child: Icon(
                    Icons.lock_reset_rounded,
                    size: 40.sp,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 28.h),
                Text(
                  'Set New Password',
                  style: AppTypography.h1.copyWith(
                    color: AppTheme.primaryColor,
                    letterSpacing: -0.5,
                  ),
                ),
                SizedBox(height: 8.h),
                Text(
                  'Please set a new password for your account to continue',
                  style: AppTypography.bodyMedium.copyWith(
                    color: AppTheme.textTertiary,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 48.h),
                Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      TextFormField(
                        controller: _newPasswordController,
                        obscureText: _obscureNew,
                        textInputAction: TextInputAction.next,
                        decoration: InputDecoration(
                          labelText: 'New Password',
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscureNew
                                  ? Icons.visibility_off_outlined
                                  : Icons.visibility_outlined,
                            ),
                            onPressed: () =>
                                setState(() => _obscureNew = !_obscureNew),
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Password is required';
                          }
                          if (value.length < 8) {
                            return 'Password must be at least 8 characters';
                          }
                          return null;
                        },
                      ),
                      SizedBox(height: 16.h),
                      TextFormField(
                        controller: _confirmPasswordController,
                        obscureText: _obscureConfirm,
                        textInputAction: TextInputAction.done,
                        decoration: InputDecoration(
                          labelText: 'Confirm Password',
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscureConfirm
                                  ? Icons.visibility_off_outlined
                                  : Icons.visibility_outlined,
                            ),
                            onPressed: () => setState(
                                () => _obscureConfirm = !_obscureConfirm),
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please confirm your password';
                          }
                          if (value != _newPasswordController.text) {
                            return 'Passwords do not match';
                          }
                          return null;
                        },
                        onFieldSubmitted: (_) => _submit(),
                      ),
                      SizedBox(height: 32.h),
                      ElevatedButton(
                        onPressed: _isLoading ? null : _submit,
                        child: _isLoading
                            ? SizedBox(
                                height: 20.h,
                                width: 20.h,
                                child: const CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('Update Password'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
