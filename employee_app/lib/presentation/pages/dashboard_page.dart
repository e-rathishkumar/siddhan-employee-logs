import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/constants/string_constants.dart';
import '../../core/constants/api_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_typography.dart';
import '../../core/extensions/context_extensions.dart';
import '../../domain/entities/employee.dart';
import '../blocs/auth/auth_bloc.dart';
import '../blocs/auth/auth_state.dart';
import '../blocs/attendance/attendance_bloc.dart';
import '../blocs/attendance/attendance_event.dart';
import '../blocs/attendance/attendance_state.dart';

class DashboardPage extends StatefulWidget {
  final VoidCallback? onNavigateToProfile;

  const DashboardPage({super.key, this.onNavigateToProfile});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> with WidgetsBindingObserver {
  bool _hasLoadedOnce = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Try loading immediately, and also schedule a post-frame retry
    _loadData();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_hasLoadedOnce) _loadData();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadData();
    }
  }

  void _loadData() {
    final authState = context.read<AuthBloc>().state;
    if (authState is AuthAuthenticated) {
      _hasLoadedOnce = true;
      context.read<AttendanceBloc>().add(
            AttendanceTodayRequested(employeeId: authState.user.id),
          );
      context.read<AttendanceBloc>().add(
            AttendanceDashboardRequested(),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthBloc>().state;
    final user = authState is AuthAuthenticated ? authState.user : null;

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SafeArea(
        child: MultiBlocListener(
          listeners: [
            BlocListener<AttendanceBloc, AttendanceState>(
              listener: (context, state) {
                if (state is AttendanceError) {
                  context.showSnackBar(state.message, isError: true);
                }
              },
            ),
            BlocListener<AuthBloc, AuthState>(
              listener: (context, state) {
                if (state is AuthAuthenticated && !_hasLoadedOnce) {
                  _loadData();
                }
              },
            ),
          ],
          child: RefreshIndicator(
            onRefresh: () async => _loadData(),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: EdgeInsets.all(20.w),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  BlocBuilder<AttendanceBloc, AttendanceState>(
                    buildWhen: (prev, curr) =>
                        (curr is AttendanceLoaded) || (prev is AttendanceLoaded),
                    builder: (context, _) => _buildGreeting(user),
                  ),
                  SizedBox(height: 24.h),
                  _buildTodayCard(context, user?.id ?? ''),
                  SizedBox(height: 24.h),
                  _buildMonthlySummary(context),
                  SizedBox(height: 24.h),
                  _buildRecentActivity(context),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGreeting(Employee? user) {
    final name = user?.name ?? '';
    final hour = DateTime.now().hour;
    String greeting;
    if (hour < 12) {
      greeting = 'Good Morning';
    } else if (hour < 17) {
      greeting = 'Good Afternoon';
    } else {
      greeting = 'Good Evening';
    }

    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                greeting,
                style: AppTypography.bodyMedium.copyWith(
                  color: AppTheme.textTertiary,
                ),
              ),
              SizedBox(height: 4.h),
              Text(
                name,
                style: AppTypography.h2.copyWith(color: AppTheme.textPrimary),
              ),
            ],
          ),
        ),
        GestureDetector(
          onTap: () {
            _navigateToProfileTab(context);
          },
          child: Container(
            width: 48.w,
            height: 48.w,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16.r),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primaryColor.withValues(alpha: 0.2),
                  blurRadius: 8.r,
                  offset: Offset(0, 2.h),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16.r),
              child: _buildProfileImage(user, name),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProfileImage(Employee? user, String name) {
    // Check dashboard data for profile_photo_url first
    final attState = context.read<AttendanceBloc>().state;
    String? photoUrl = user?.profilePhotoUrl;
    if (attState is AttendanceLoaded && attState.dashboardData != null) {
      final dashPhotoUrl = attState.dashboardData?['profile_photo_url']?.toString();
      if (dashPhotoUrl != null && dashPhotoUrl.isNotEmpty) {
        photoUrl = dashPhotoUrl;
      }
    }

    if (photoUrl != null && photoUrl.isNotEmpty) {
      return Image.network(
        '${ApiConstants.baseUrl.replaceAll('/api/v1', '')}$photoUrl',
        width: 48.w,
        height: 48.w,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _buildAvatarFallback(name),
      );
    }
    return _buildAvatarFallback(name);
  }

  void _navigateToProfileTab(BuildContext context) {
    widget.onNavigateToProfile?.call();
  }

  Widget _buildAvatarFallback(String name) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.primaryLight, AppTheme.primaryDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : '?',
          style: AppTypography.h3.copyWith(color: Colors.white),
        ),
      ),
    );
  }

  Widget _buildTodayCard(BuildContext context, String employeeId) {
    return BlocBuilder<AttendanceBloc, AttendanceState>(
      builder: (context, state) {
        final today = state is AttendanceLoaded ? state.todayRecord : null;
        final isCheckedIn = today?.isCheckedIn ?? false;
        final isCheckedOut = today?.isCheckedOut ?? false;
        final isActionLoading = state is AttendanceActionLoading;

        return Container(
          width: double.infinity,
          padding: EdgeInsets.all(20.w),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: isCheckedIn
                  ? [AppTheme.successColor, AppTheme.successColor.withValues(alpha: 0.8)]
                  : [AppTheme.primaryColor, AppTheme.primaryDark],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20.r),
            boxShadow: [
              BoxShadow(
                color: (isCheckedIn ? AppTheme.successColor : AppTheme.primaryColor)
                    .withValues(alpha: 0.3),
                blurRadius: 16.r,
                offset: Offset(0, 8.h),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    Strings.todayStatus,
                    style: AppTypography.labelLarge.copyWith(color: Colors.white70),
                  ),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 4.h),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20.r),
                    ),
                    child: Text(
                      isCheckedIn
                          ? (isCheckedOut ? Strings.checkedOut : Strings.checkedIn)
                          : Strings.notCheckedIn,
                      style: AppTypography.labelSmall.copyWith(color: Colors.white),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 16.h),
              Row(
                children: [
                  Icon(Icons.login_rounded, color: Colors.white70, size: 18.sp),
                  SizedBox(width: 8.w),
                  Text(
                    '${Strings.checkIn}: ${today?.checkIn != null ? _formatTime(today!.checkIn!) : '--:--'}',
                    style: AppTypography.bodyMedium.copyWith(color: Colors.white),
                  ),
                ],
              ),
              SizedBox(height: 8.h),
              Row(
                children: [
                  Icon(Icons.logout_rounded, color: Colors.white70, size: 18.sp),
                  SizedBox(width: 8.w),
                  Text(
                    '${Strings.checkOut}: ${today?.checkOut != null ? _formatTime(today!.checkOut!) : '--:--'}',
                    style: AppTypography.bodyMedium.copyWith(color: Colors.white),
                  ),
                ],
              ),
              SizedBox(height: 8.h),
              Row(
                children: [
                  Icon(Icons.timer_outlined, color: Colors.white70, size: 18.sp),
                  SizedBox(width: 8.w),
                  Text(
                    '${Strings.workingHours}: ${today?.workDuration != null ? _formatDuration(today!.workDuration!) : '--:--'}',
                    style: AppTypography.bodyMedium.copyWith(color: Colors.white),
                  ),
                ],
              ),
              SizedBox(height: 20.h),
              SizedBox(
                width: double.infinity,
                height: 48.h,
                child: isCheckedOut
                    ? Container(
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12.r),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.4)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.check_circle_outline, color: Colors.white, size: 20.sp),
                            SizedBox(width: 8.w),
                            Text(
                              Strings.workDone,
                              style: AppTypography.button.copyWith(color: Colors.white),
                            ),
                          ],
                        ),
                      )
                    : ElevatedButton(
                        onPressed: isActionLoading
                            ? null
                            : () {
                                if (!isCheckedIn) {
                                  context.read<AttendanceBloc>().add(
                                        AttendanceCheckInRequested(employeeId: employeeId),
                                      );
                                } else {
                                  context.read<AttendanceBloc>().add(
                                        AttendanceCheckOutRequested(employeeId: employeeId),
                                      );
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor:
                              isCheckedIn ? AppTheme.successColor : AppTheme.primaryColor,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12.r),
                          ),
                        ),
                        child: isActionLoading
                            ? SizedBox(
                                height: 20.h,
                                width: 20.h,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: isCheckedIn
                                      ? AppTheme.successColor
                                      : AppTheme.primaryColor,
                                ),
                              )
                            : Text(
                                isCheckedIn ? Strings.checkOut : Strings.checkIn,
                                style: AppTypography.button,
                              ),
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMonthlySummary(BuildContext context) {
    return BlocBuilder<AttendanceBloc, AttendanceState>(
      builder: (context, state) {
        final dashboard = state is AttendanceLoaded ? state.dashboardData : null;
        final presentDays = dashboard?['present_days']?.toString() ?? '0';
        final absentDays = dashboard?['absent_days']?.toString() ?? '0';
        final lateDays = dashboard?['late_days']?.toString() ?? '0';
        final presentDates = List<String>.from(dashboard?['present_dates'] ?? []);
        final absentDates = List<String>.from(dashboard?['absent_dates'] ?? []);
        final lateDates = List<String>.from(dashboard?['late_dates'] ?? []);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              Strings.thisMonth,
              style: AppTypography.h4.copyWith(color: AppTheme.textPrimary),
            ),
            SizedBox(height: 12.h),
            Row(
              children: [
                _buildStatCard(Strings.present, presentDays, AppTheme.successColor, presentDates, context),
                SizedBox(width: 12.w),
                _buildStatCard(Strings.absent, absentDays, AppTheme.errorColor, absentDates, context),
                SizedBox(width: 12.w),
                _buildStatCard(Strings.late, lateDays, AppTheme.warningColor, lateDates, context),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildStatCard(String label, String value, Color color, List<String> dates, BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: dates.isNotEmpty
            ? () => Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => _AttendanceDatesPage(label: label, dates: dates, color: color),
                ))
            : null,
        child: Container(
          padding: EdgeInsets.symmetric(vertical: 18.h, horizontal: 12.w),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16.r),
            border: Border.all(color: AppTheme.dividerColor),
            boxShadow: [
              BoxShadow(
                color: color.withValues(alpha: 0.06),
                blurRadius: 12.r,
                offset: Offset(0, 4.h),
              ),
            ],
          ),
          child: Column(
            children: [
              Container(
                width: 36.w,
                height: 36.w,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10.r),
                ),
                child: Center(
                  child: Text(
                    value,
                    style: AppTypography.h3.copyWith(color: color),
                  ),
                ),
              ),
              SizedBox(height: 8.h),
              Text(
                label,
                style: AppTypography.caption.copyWith(
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRecentActivity(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Activity Log',
              style: AppTypography.h4.copyWith(color: AppTheme.textPrimary),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const _KioskLogTimePage()),
                );
              },
              child: const Text(Strings.viewAll),
            ),
          ],
        ),
        SizedBox(height: 8.h),
        Container(
          padding: EdgeInsets.all(16.w),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12.r),
            border: Border.all(color: AppTheme.dividerColor),
          ),
          child: BlocBuilder<AttendanceBloc, AttendanceState>(
            builder: (context, state) {
              final dashboard = state is AttendanceLoaded ? state.dashboardData : null;
              final recentActivity = dashboard?['recent_activity'] as List<dynamic>? ?? [];

              if (recentActivity.isEmpty) {
                return Padding(
                  padding: EdgeInsets.symmetric(vertical: 16.h),
                  child: Center(
                    child: Text(
                      'No activity entries found',
                      style: AppTypography.bodyMedium.copyWith(color: AppTheme.textTertiary),
                    ),
                  ),
                );
              }

              final displayItems = recentActivity.take(3).toList();
              return Column(
                children: displayItems.map((item) {
                  final map = item as Map<String, dynamic>;
                  final detectedAt = map['detected_at']?.toString();
                  final action = map['action']?.toString() ?? '';
                  final source = map['source']?.toString() ?? 'kiosk';
                  
                  IconData actionIcon;
                  Color actionColor;
                  String actionLabel;
                  
                  if (action == 'check_in') {
                    actionIcon = Icons.login_rounded;
                    actionColor = AppTheme.successColor;
                    actionLabel = 'Checked In';
                  } else if (action == 'check_out') {
                    actionIcon = Icons.logout_rounded;
                    actionColor = AppTheme.errorColor;
                    actionLabel = 'Checked Out';
                  } else if (action == 'continue') {
                    actionIcon = Icons.arrow_forward_rounded;
                    actionColor = AppTheme.primaryColor;
                    actionLabel = 'Continued';
                  } else {
                    actionIcon = Icons.face_rounded;
                    actionColor = AppTheme.primaryColor;
                    actionLabel = 'Face Detected';
                  }
                  
                  return Padding(
                    padding: EdgeInsets.symmetric(vertical: 8.h),
                    child: Row(
                      children: [
                        Container(
                          width: 36.w,
                          height: 36.w,
                          decoration: BoxDecoration(
                            color: actionColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10.r),
                          ),
                          child: Icon(
                            actionIcon,
                            color: actionColor,
                            size: 18.sp,
                          ),
                        ),
                        SizedBox(width: 12.w),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                actionLabel,
                                style: AppTypography.labelMedium,
                              ),
                              Text(
                                source == 'kiosk' ? 'Kiosk' : 'App',
                                style: AppTypography.caption.copyWith(
                                  color: AppTheme.textTertiary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (detectedAt != null)
                          Text(
                            _formatTimeString(detectedAt),
                            style: AppTypography.bodySmall.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                      ],
                    ),
                  );
                }).toList(),
              );
            },
          ),
        ),
      ],
    );
  }

  String _formatTime(DateTime time) {
    final local = time.toLocal();
    final h = local.hour.toString().padLeft(2, '0');
    final m = local.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  String _formatTimeString(String isoTime) {
    try {
      final dt = DateTime.parse(isoTime).toLocal();
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return isoTime;
    }
  }

  String _formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes % 60;
    return '${hours}h ${minutes}m';
  }
}

/// Attendance dates detail page — shown when tapping present/absent/late cards
class _AttendanceDatesPage extends StatelessWidget {
  final String label;
  final List<String> dates;
  final Color color;

  const _AttendanceDatesPage({
    required this.label,
    required this.dates,
    required this.color,
  });

  String _formatDate(String iso) {
    try {
      final d = DateTime.parse(iso);
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      final dow = days[d.weekday - 1];
      return '$dow, ${d.day} ${months[d.month - 1]} ${d.year}';
    } catch (_) {
      return iso;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text('$label Days', style: AppTypography.h4),
        backgroundColor: AppTheme.backgroundColor,
        elevation: 0,
        foregroundColor: AppTheme.textPrimary,
      ),
      body: dates.isEmpty
          ? Center(
              child: Text('No $label days this month',
                  style: AppTypography.bodyMedium.copyWith(color: AppTheme.textSecondary)),
            )
          : ListView.separated(
              padding: EdgeInsets.all(20.w),
              itemCount: dates.length,
              separatorBuilder: (_, __) => SizedBox(height: 8.h),
              itemBuilder: (context, index) {
                final dateStr = dates[index];
                return Container(
                  padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 14.h),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12.r),
                    border: Border.all(color: AppTheme.dividerColor),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40.w,
                        height: 40.w,
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10.r),
                        ),
                        child: Icon(
                          label == 'Present'
                              ? Icons.event_available_rounded
                              : label == 'Absent'
                                  ? Icons.event_busy_rounded
                                  : Icons.watch_later_rounded,
                          color: color,
                          size: 20.sp,
                        ),
                      ),
                      SizedBox(width: 12.w),
                      Text(
                        _formatDate(dateStr),
                        style: AppTypography.bodyMedium.copyWith(color: AppTheme.textPrimary),
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}

/// Kiosk Log Time full-page view
class _KioskLogTimePage extends StatelessWidget {
  const _KioskLogTimePage();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(title: const Text('Activity Log')),
      body: BlocBuilder<AttendanceBloc, AttendanceState>(
        builder: (context, state) {
          final dashboard = state is AttendanceLoaded ? state.dashboardData : null;
          final recentActivity = dashboard?['recent_activity'] as List<dynamic>? ?? [];

          if (recentActivity.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.history_rounded, size: 64.sp, color: AppTheme.textTertiary),
                  SizedBox(height: 12.h),
                  Text('No activity entries found',
                      style: AppTypography.bodyMedium.copyWith(color: AppTheme.textSecondary)),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: EdgeInsets.all(16.w),
            itemCount: recentActivity.length,
            separatorBuilder: (_, __) => SizedBox(height: 8.h),
            itemBuilder: (context, index) {
              final item = recentActivity[index] as Map<String, dynamic>;
              final detectedAt = item['detected_at']?.toString();
              final action = item['action']?.toString() ?? '';
              final confidence = (item['confidence'] as num?)?.toDouble();
              final source = item['source']?.toString() ?? 'kiosk';

              IconData actionIcon;
              Color actionColor;
              String actionLabel;
              String subtitle;

              if (action == 'check_in') {
                actionIcon = Icons.login_rounded;
                actionColor = AppTheme.successColor;
                actionLabel = 'Checked In';
                subtitle = source == 'kiosk'
                    ? 'Kiosk${confidence != null ? ' (${(confidence * 100).toStringAsFixed(0)}%)' : ''}'
                    : 'App Check-in';
              } else if (action == 'check_out') {
                actionIcon = Icons.logout_rounded;
                actionColor = AppTheme.errorColor;
                actionLabel = 'Checked Out';
                subtitle = source == 'kiosk' ? 'Kiosk' : 'App Check-out';
              } else if (action == 'continue') {
                actionIcon = Icons.arrow_forward_rounded;
                actionColor = AppTheme.primaryColor;
                actionLabel = 'Continued Working';
                subtitle = 'Kiosk';
              } else {
                actionIcon = Icons.face_rounded;
                actionColor = AppTheme.primaryColor;
                actionLabel = 'Face Detected';
                subtitle = 'Kiosk${confidence != null ? ' (${(confidence * 100).toStringAsFixed(0)}%)' : ''}';
              }

              return Container(
                padding: EdgeInsets.all(16.w),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12.r),
                  border: Border.all(color: AppTheme.dividerColor),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40.w,
                      height: 40.w,
                      decoration: BoxDecoration(
                        color: actionColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12.r),
                      ),
                      child: Icon(
                        actionIcon,
                        color: actionColor,
                        size: 20.sp,
                      ),
                    ),
                    SizedBox(width: 12.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            actionLabel,
                            style: AppTypography.labelLarge,
                          ),
                          SizedBox(height: 4.h),
                          Text(
                            subtitle,
                            style: AppTypography.caption.copyWith(
                              color: AppTheme.textTertiary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (detectedAt != null)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            _formatTimeStr(detectedAt),
                            style: AppTypography.bodyMedium.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            _formatDateStr(detectedAt),
                            style: AppTypography.caption.copyWith(
                              color: AppTheme.textTertiary,
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }

  String _formatTimeStr(String isoTime) {
    try {
      final dt = DateTime.parse(isoTime).toLocal();
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return isoTime;
    }
  }

  String _formatDateStr(String isoTime) {
    try {
      final dt = DateTime.parse(isoTime).toLocal();
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return '${dt.day} ${months[dt.month - 1]}';
    } catch (_) {
      return '';
    }
  }
}
