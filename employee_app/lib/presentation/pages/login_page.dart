import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/constants/string_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_typography.dart';
import '../../core/extensions/context_extensions.dart';
import '../blocs/auth/auth_bloc.dart';
import '../blocs/auth/auth_event.dart';
import '../blocs/auth/auth_state.dart';
import 'main_shell.dart';
import 'update_password_page.dart';
import 'face_capture_page.dart';

class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthAuthenticated) {
          if (state.user.isNewUser) {
            // New user flow: update password first
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => const UpdatePasswordPage()),
              (_) => false,
            );
          } else if (!state.user.faceRegistered) {
            // Face not registered: go to face capture
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
        } else if (state is AuthError) {
          context.showSnackBar(state.message, isError: true);
        }
      },
      child: const _LoginPageContent(),
    );
  }
}

class _LoginPageContent extends StatelessWidget {
  const _LoginPageContent();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: Stack(
        children: [
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: EdgeInsets.symmetric(horizontal: 24.w),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 88.w,
                      height: 88.w,
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
                        Icons.fingerprint,
                        size: 48.sp,
                        color: Colors.white,
                      ),
                    ),
                    SizedBox(height: 28.h),
                    Text(
                      Strings.appName,
                      style: AppTypography.h1.copyWith(
                        color: AppTheme.primaryColor,
                        letterSpacing: -0.5,
                      ),
                    ),
                    SizedBox(height: 8.h),
                    Text(
                      Strings.signInSubtitle,
                      style: AppTypography.bodyMedium.copyWith(
                        color: AppTheme.textTertiary,
                      ),
                    ),
                    SizedBox(height: 48.h),
                    const _LoginForm(),
                  ],
                ),
              ),
            ),
          ),
          // Full screen loading overlay
          BlocBuilder<AuthBloc, AuthState>(
            builder: (context, state) {
              if (state is AuthLoading) {
                return Container(
                  color: Colors.black.withValues(alpha: 0.6),
                  child: const Center(
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 3,
                    ),
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
    );
  }
}

class _LoginForm extends StatefulWidget {
  const _LoginForm();

  @override
  State<_LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<_LoginForm> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(
              labelText: Strings.email,
              prefixIcon: Icon(Icons.email_outlined),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) return Strings.emailRequired;
              if (!RegExp(r'^[\w\-.]+@([\w\-]+\.)+[\w\-]{2,4}$')
                  .hasMatch(value)) {
                return Strings.emailInvalid;
              }
              return null;
            },
          ),
          SizedBox(height: 16.h),
          TextFormField(
            controller: _passwordController,
            obscureText: _obscurePassword,
            textInputAction: TextInputAction.done,
            decoration: InputDecoration(
              labelText: Strings.password,
              prefixIcon: const Icon(Icons.lock_outline),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined,
                ),
                onPressed: () {
                  setState(() => _obscurePassword = !_obscurePassword);
                },
              ),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) return Strings.passwordRequired;
              if (value.length < 6) return Strings.passwordMinLength;
              return null;
            },
            onFieldSubmitted: (_) => _submit(),
          ),
          SizedBox(height: 32.h),
          ElevatedButton(
            onPressed: _submit,
            child: const Text(Strings.signIn),
          ),
        ],
      ),
    );
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    context.read<AuthBloc>().add(AuthLoginRequested(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        ));
  }
}
