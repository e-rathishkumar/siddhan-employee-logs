import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/constants/string_constants.dart';
import '../../core/constants/api_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_typography.dart';
import '../../core/constants/app_constants.dart';
import '../blocs/auth/auth_bloc.dart';
import '../blocs/auth/auth_event.dart';
import '../blocs/auth/auth_state.dart';
import '../blocs/attendance/attendance_bloc.dart';
import '../blocs/attendance/attendance_state.dart';
import 'face_capture_page.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  String? _buildImageUrl(String? photoUrl) {
    if (photoUrl == null || photoUrl.isEmpty) return null;
    return '${ApiConstants.baseUrl.replaceAll('/api/v1', '')}$photoUrl';
  }

  String _formatGender(String? gender) {
    if (gender == null || gender.isEmpty) return '-';
    switch (gender.toLowerCase()) {
      case 'male':
        return 'Male';
      case 'female':
        return 'Female';
      case 'other':
        return 'Other';
      default:
        return gender;
    }
  }

  void _openImagePopup(BuildContext context, String? imageUrl, String fallbackInitial) {
    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        barrierDismissible: true,
        barrierColor: Colors.black87,
        pageBuilder: (ctx, animation, _) {
          return GestureDetector(
            onTap: () => Navigator.of(ctx).pop(),
            child: Scaffold(
              backgroundColor: Colors.transparent,
              body: Center(
                child: Hero(
                  tag: 'profile_photo',
                  child: ClipOval(
                    child: Container(
                      width: 280.r,
                      height: 280.r,
                      color: Colors.grey[900],
                      child: imageUrl != null
                          ? Image.network(
                              imageUrl,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Center(
                                child: Text(
                                  fallbackInitial,
                                  style: TextStyle(
                                    fontSize: 80.sp,
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    decoration: TextDecoration.none,
                                  ),
                                ),
                              ),
                            )
                          : Center(
                              child: Text(
                                fallbackInitial,
                                style: TextStyle(
                                  fontSize: 80.sp,
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  decoration: TextDecoration.none,
                                ),
                              ),
                            ),
                    ),
                  ),
                ),
              ),
            ),
          );
        },
        transitionsBuilder: (ctx, animation, _, child) {
          return FadeTransition(opacity: animation, child: child);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthBloc>().state;
    final user = authState is AuthAuthenticated ? authState.user : null;
    // Fall back to dashboard data photo URL (same source as dashboard page)
    String? rawPhotoUrl = user?.profilePhotoUrl;
    final attState = context.read<AttendanceBloc>().state;
    if ((rawPhotoUrl == null || rawPhotoUrl.isEmpty) &&
        attState is AttendanceLoaded &&
        attState.dashboardData != null) {
      final dashPhotoUrl = attState.dashboardData?['profile_photo_url']?.toString();
      if (dashPhotoUrl != null && dashPhotoUrl.isNotEmpty) {
        rawPhotoUrl = dashPhotoUrl;
      }
    }
    final imageUrl = _buildImageUrl(rawPhotoUrl);
    final fallbackInitial = user?.name.isNotEmpty == true ? user!.name[0].toUpperCase() : '?';

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(20.w),
          child: Column(
            children: [
              // Profile Header with gradient
              Container(
                width: double.infinity,
                padding: EdgeInsets.all(28.w),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppTheme.primaryColor, AppTheme.primaryDark],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20.r),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primaryColor.withValues(alpha: 0.3),
                      blurRadius: 20.r,
                      offset: Offset(0, 8.h),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Stack(
                      children: [
                        GestureDetector(
                          onTap: () => _openImagePopup(context, imageUrl, fallbackInitial),
                          child: Container(
                            padding: EdgeInsets.all(3.w),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white.withValues(alpha: 0.3), width: 2),
                            ),
                            child: Hero(
                              tag: 'profile_photo',
                              child: ClipOval(
                                child: Container(
                                  width: 80.r,
                                  height: 80.r,
                                  color: Colors.white.withValues(alpha: 0.2),
                                  child: imageUrl != null
                                      ? Image.network(
                                          imageUrl,
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, __, ___) => Center(
                                            child: Text(
                                              fallbackInitial,
                                              style: AppTypography.h1.copyWith(
                                                color: Colors.white,
                                                decoration: TextDecoration.none,
                                              ),
                                            ),
                                          ),
                                        )
                                      : Center(
                                          child: Text(
                                            fallbackInitial,
                                            style: AppTypography.h1.copyWith(
                                              color: Colors.white,
                                              decoration: TextDecoration.none,
                                            ),
                                          ),
                                        ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: GestureDetector(
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => const FaceCapturePage()),
                              );
                            },
                            child: Container(
                              width: 28.r,
                              height: 28.r,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.2),
                                    blurRadius: 4.r,
                                  ),
                                ],
                              ),
                              child: Icon(
                                Icons.edit,
                                size: 14.sp,
                                color: AppTheme.primaryColor,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 14.h),
                    Text(
                      user?.name ?? '',
                      style: AppTypography.h3.copyWith(
                        color: Colors.white,
                      ),
                    ),
                    SizedBox(height: 4.h),
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 4.h),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20.r),
                      ),
                      child: Text(
                        user?.designation ?? '',
                        style: AppTypography.labelSmall.copyWith(
                          color: Colors.white.withValues(alpha: 0.9),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 20.h),

              // Info Cards
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16.r),
                  border: Border.all(color: AppTheme.dividerColor),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 8.r,
                      offset: Offset(0, 2.h),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 8.h),
                      child: Text(
                        'Personal Information',
                        style: AppTypography.labelSmall.copyWith(
                          color: AppTheme.textTertiary,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    _buildInfoTile(
                      Icons.badge_outlined,
                      Strings.employeeId,
                      user?.employeeId ?? '',
                    ),
                    _divider(),
                    _buildInfoTile(
                      Icons.email_outlined,
                      Strings.email,
                      user?.email ?? '',
                    ),
                    _divider(),
                    _buildInfoTile(
                      Icons.phone_outlined,
                      Strings.phone,
                      user?.phone ?? '-',
                    ),
                    _divider(),
                    _buildInfoTile(
                      Icons.work_outline,
                      Strings.designation,
                      user?.designation ?? '',
                    ),
                    _divider(),
                    _buildInfoTile(
                      Icons.person_outline,
                      'Gender',
                      _formatGender(user?.gender),
                    ),
                    _divider(),
                    _buildInfoTile(
                      Icons.calendar_month_outlined,
                      Strings.joiningDate,
                      user != null
                          ? '${user.joinedAt.day}/${user.joinedAt.month}/${user.joinedAt.year}'
                          : '',
                    ),
                  ],
                ),
              ),
              SizedBox(height: 16.h),

              // Settings
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16.r),
                  border: Border.all(color: AppTheme.dividerColor),
                ),
                child: Column(
                  children: [
                    _buildActionTile(
                      Icons.language_outlined,
                      Strings.changeLanguage,
                      () => _showLanguageDialog(context),
                    ),
                    _divider(),
                    _buildActionTile(
                      Icons.info_outline,
                      Strings.aboutApp,
                      () => _showAboutDialog(context),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 16.h),

              // Logout
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    // context.read<AttendanceBloc>().add(const AttendanceResetRequested());
                    // context.read<LeaveBloc>().add(const LeaveResetRequested());
                    context.read<AuthBloc>().add(const AuthLogoutRequested());
                  },
                  icon: const Icon(Icons.logout, color: AppTheme.errorColor),
                  label: Text(
                    Strings.logout,
                    style: const TextStyle(color: AppTheme.errorColor),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppTheme.errorColor),
                  ),
                ),
              ),
              SizedBox(height: 32.h),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoTile(IconData icon, String label, String value) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 14.h),
      child: Row(
        children: [
          Container(
            width: 36.w,
            height: 36.w,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10.r),
            ),
            child: Icon(icon, size: 18.sp, color: AppTheme.primaryColor),
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: AppTypography.caption.copyWith(
                  fontSize: 11.sp,
                  color: AppTheme.textTertiary,
                )),
                SizedBox(height: 2.h),
                Text(value,
                    style: AppTypography.bodyMedium
                        .copyWith(color: AppTheme.textPrimary, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionTile(IconData icon, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 14.h),
        child: Row(
          children: [
            Icon(icon, size: 20.sp, color: AppTheme.textSecondary),
            SizedBox(width: 12.w),
            Expanded(
              child: Text(label, style: AppTypography.bodyMedium),
            ),
            Icon(Icons.chevron_right, size: 20.sp, color: AppTheme.textTertiary),
          ],
        ),
      ),
    );
  }

  Widget _divider() {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 16.w),
      child: const Divider(height: 1),
    );
  }

  void _showLanguageDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text(Strings.changeLanguage),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text(Strings.english),
              leading: const Text('🇬🇧', style: TextStyle(fontSize: 24)),
              onTap: () => Navigator.pop(ctx),
            ),
            ListTile(
              title: const Text(Strings.tamil),
              leading: const Text('🇮🇳', style: TextStyle(fontSize: 24)),
              onTap: () => Navigator.pop(ctx),
            ),
            ListTile(
              title: const Text(Strings.hindi),
              leading: const Text('🇮🇳', style: TextStyle(fontSize: 24)),
              onTap: () => Navigator.pop(ctx),
            ),
          ],
        ),
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text(Strings.aboutApp),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(Strings.appName,
                style: AppTypography.labelLarge),
            SizedBox(height: 8.h),
            Text('${Strings.version}: ${AppConstants.appVersion}',
                style: AppTypography.bodyMedium),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text(Strings.ok),
          ),
        ],
      ),
    );
  }
}
