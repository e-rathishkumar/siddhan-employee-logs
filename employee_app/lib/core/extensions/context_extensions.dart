import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

extension ContextExtensions on BuildContext {
  // Theme
  ThemeData get theme => Theme.of(this);
  ColorScheme get colors => Theme.of(this).colorScheme;
  TextTheme get textTheme => Theme.of(this).textTheme;

  // MediaQuery
  Size get screenSize => MediaQuery.sizeOf(this);
  double get screenWidth => MediaQuery.sizeOf(this).width;
  double get screenHeight => MediaQuery.sizeOf(this).height;
  EdgeInsets get padding => MediaQuery.paddingOf(this);
  EdgeInsets get viewInsets => MediaQuery.viewInsetsOf(this);

  // Navigation
  NavigatorState get navigator => Navigator.of(this);
  void pop<T>([T? result]) => Navigator.of(this).pop(result);
  Future<T?> push<T>(Widget page) => Navigator.of(this).push<T>(
        MaterialPageRoute(builder: (_) => page),
      );
  Future<T?> pushReplacement<T>(Widget page) =>
      Navigator.of(this).pushReplacement<T, void>(
        MaterialPageRoute(builder: (_) => page),
      );
  Future<T?> pushAndRemoveAll<T>(Widget page) =>
      Navigator.of(this).pushAndRemoveUntil<T>(
        MaterialPageRoute(builder: (_) => page),
        (_) => false,
      );

  // Snackbar
  void showSnackBar(String message, {bool isError = false}) {
    ScaffoldMessenger.of(this).hideCurrentSnackBar();
    ScaffoldMessenger.of(this).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red.shade600 : Colors.green.shade600,
        behavior: SnackBarBehavior.floating,
        margin: EdgeInsets.all(16.w),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.r)),
      ),
    );
  }
}

extension SpacingExtension on num {
  SizedBox get verticalSpace => SizedBox(height: toDouble().h);
  SizedBox get horizontalSpace => SizedBox(width: toDouble().w);
}
