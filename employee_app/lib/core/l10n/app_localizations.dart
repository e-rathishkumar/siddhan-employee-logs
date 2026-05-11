import 'package:flutter/material.dart';

import 'translations/en.dart';
import 'translations/ta.dart';
import 'translations/hi.dart';

class AppLocalizations {
  final Locale locale;
  late final Map<String, String> _localizedStrings;

  AppLocalizations(this.locale) {
    switch (locale.languageCode) {
      case 'ta':
        _localizedStrings = tamilTranslations;
        break;
      case 'hi':
        _localizedStrings = hindiTranslations;
        break;
      default:
        _localizedStrings = englishTranslations;
    }
  }

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  String translate(String key) {
    return _localizedStrings[key] ?? key;
  }

  // Common
  String get appName => translate('app_name');
  String get ok => translate('ok');
  String get cancel => translate('cancel');
  String get save => translate('save');
  String get delete => translate('delete');
  String get edit => translate('edit');
  String get loading => translate('loading');
  String get retry => translate('retry');
  String get error => translate('error');
  String get success => translate('success');
  String get noData => translate('no_data');
  String get somethingWentWrong => translate('something_went_wrong');

  // Auth
  String get login => translate('login');
  String get logout => translate('logout');
  String get email => translate('email');
  String get password => translate('password');
  String get signIn => translate('sign_in');
  String get signInSubtitle => translate('sign_in_subtitle');
  String get emailRequired => translate('email_required');
  String get emailInvalid => translate('email_invalid');
  String get passwordRequired => translate('password_required');
  String get passwordMinLength => translate('password_min_length');
  String get invalidCredentials => translate('invalid_credentials');
  String get sessionExpired => translate('session_expired');

  // Navigation
  String get dashboard => translate('dashboard');
  String get attendance => translate('attendance');
  String get leaves => translate('leaves');
  String get profile => translate('profile');

  // Dashboard
  String get welcomeBack => translate('welcome_back');
  String get todayStatus => translate('today_status');
  String get checkIn => translate('check_in');
  String get checkOut => translate('check_out');
  String get checkedIn => translate('checked_in');
  String get checkedOut => translate('checked_out');
  String get notCheckedIn => translate('not_checked_in');
  String get workingHours => translate('working_hours');
  String get thisMonth => translate('this_month');
  String get present => translate('present');
  String get absent => translate('absent');
  String get late => translate('late');
  String get halfDay => translate('half_day');
  String get onLeave => translate('on_leave');
  String get recentActivity => translate('recent_activity');
  String get viewAll => translate('view_all');

  // Attendance
  String get attendanceHistory => translate('attendance_history');
  String get date => translate('date');
  String get status => translate('status');
  String get checkInTime => translate('check_in_time');
  String get checkOutTime => translate('check_out_time');
  String get duration => translate('duration');
  String get verificationMethod => translate('verification_method');
  String get noAttendanceRecords => translate('no_attendance_records');

  // Leaves
  String get leaveRequests => translate('leave_requests');
  String get applyLeave => translate('apply_leave');
  String get leaveType => translate('leave_type');
  String get startDate => translate('start_date');
  String get endDate => translate('end_date');
  String get reason => translate('reason');
  String get pending => translate('pending');
  String get approved => translate('approved');
  String get rejected => translate('rejected');
  String get leaveBalance => translate('leave_balance');
  String get daysRemaining => translate('days_remaining');
  String get noLeaveRequests => translate('no_leave_requests');
  String get leaveApplied => translate('leave_applied');
  String get selectLeaveType => translate('select_leave_type');
  String get reasonRequired => translate('reason_required');

  // Profile
  String get myProfile => translate('my_profile');
  String get employeeId => translate('employee_id');
  String get department => translate('department');
  String get designation => translate('designation');
  String get phone => translate('phone');
  String get shift => translate('shift');
  String get joiningDate => translate('joining_date');
  String get language => translate('language');
  String get changeLanguage => translate('change_language');
  String get english => translate('english');
  String get tamil => translate('tamil');
  String get hindi => translate('hindi');
  String get aboutApp => translate('about_app');
  String get version => translate('version');

  // Geofence
  String get accessDenied => translate('access_denied');
  String get outsideGeofence => translate('outside_geofence');
  String get outsideGeofenceMessage => translate('outside_geofence_message');
  String get locationPermissionRequired => translate('location_permission_required');
  String get locationPermissionMessage => translate('location_permission_message');
  String get enableLocation => translate('enable_location');
  String get checkingLocation => translate('checking_location');

  // Splash
  String get initializingApp => translate('initializing_app');
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['en', 'ta', 'hi'].contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(covariant LocalizationsDelegate<AppLocalizations> old) =>
      false;
}
