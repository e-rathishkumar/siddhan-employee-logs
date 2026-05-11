import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class AppTheme {
  AppTheme._();

  // Brand Colors - Modern Indigo theme
  static const Color primaryColor = Color(0xFF4F46E5);
  static const Color primaryLight = Color(0xFF818CF8);
  static const Color primaryDark = Color(0xFF3730A3);

  static const Color secondaryColor = Color(0xFF6366F1);
  static const Color accentColor = Color(0xFF8B5CF6);

  // Status Colors
  static const Color successColor = Color(0xFF10B981);
  static const Color errorColor = Color(0xFFEF4444);
  static const Color warningColor = Color(0xFFF59E0B);
  static const Color infoColor = Color(0xFF3B82F6);

  // Neutral Colors
  static const Color backgroundColor = Color(0xFFF9FAFB);
  static const Color surfaceColor = Color(0xFFFFFFFF);
  static const Color cardColor = Color(0xFFFFFFFF);
  static const Color dividerColor = Color(0xFFE5E7EB);
  static const Color borderColor = Color(0xFFD1D5DB);

  // Text Colors
  static const Color textPrimary = Color(0xFF111827);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textTertiary = Color(0xFF9CA3AF);
  static const Color textOnPrimary = Color(0xFFFFFFFF);

  // Shadows
  static List<BoxShadow> get cardShadow => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          blurRadius: 8.r,
          offset: Offset(0, 2.h),
        ),
      ];

  static List<BoxShadow> get elevatedShadow => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.08),
          blurRadius: 16.r,
          offset: Offset(0, 4.h),
        ),
      ];

  // Border Radius
  static BorderRadius get radiusSm => BorderRadius.circular(8.r);
  static BorderRadius get radiusMd => BorderRadius.circular(12.r);
  static BorderRadius get radiusLg => BorderRadius.circular(16.r);
  static BorderRadius get radiusXl => BorderRadius.circular(24.r);
  static BorderRadius get radiusFull => BorderRadius.circular(100.r);

  // Theme Data
  static ThemeData get lightTheme => ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        primaryColor: primaryColor,
        scaffoldBackgroundColor: backgroundColor,
        colorScheme: const ColorScheme.light(
          primary: primaryColor,
          onPrimary: textOnPrimary,
          secondary: secondaryColor,
          surface: surfaceColor,
          error: errorColor,
        ),
        fontFamily: 'Inter',
        appBarTheme: AppBarTheme(
          backgroundColor: surfaceColor,
          foregroundColor: textPrimary,
          elevation: 0,
          centerTitle: true,
          titleTextStyle: TextStyle(
            fontFamily: 'Inter',
            fontSize: 18.sp,
            fontWeight: FontWeight.w600,
            color: textPrimary,
          ),
        ),
        cardTheme: CardThemeData(
          color: cardColor,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: radiusMd,
            side: const BorderSide(color: dividerColor, width: 1),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: primaryColor,
            foregroundColor: textOnPrimary,
            minimumSize: Size(double.infinity, 52.h),
            shape: RoundedRectangleBorder(borderRadius: radiusMd),
            textStyle: TextStyle(
              fontFamily: 'Inter',
              fontSize: 16.sp,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: primaryColor,
            minimumSize: Size(double.infinity, 52.h),
            shape: RoundedRectangleBorder(borderRadius: radiusMd),
            side: const BorderSide(color: primaryColor),
            textStyle: TextStyle(
              fontFamily: 'Inter',
              fontSize: 16.sp,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: surfaceColor,
          contentPadding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 16.h),
          border: OutlineInputBorder(
            borderRadius: radiusMd,
            borderSide: const BorderSide(color: borderColor),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: radiusMd,
            borderSide: const BorderSide(color: borderColor),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: radiusMd,
            borderSide: const BorderSide(color: primaryColor, width: 2),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: radiusMd,
            borderSide: const BorderSide(color: errorColor),
          ),
          labelStyle: TextStyle(
            fontFamily: 'Inter',
            fontSize: 14.sp,
            color: textSecondary,
          ),
          hintStyle: TextStyle(
            fontFamily: 'Inter',
            fontSize: 14.sp,
            color: textTertiary,
          ),
        ),
        bottomNavigationBarTheme: BottomNavigationBarThemeData(
          backgroundColor: surfaceColor,
          selectedItemColor: primaryColor,
          unselectedItemColor: textTertiary,
          type: BottomNavigationBarType.fixed,
          elevation: 8,
          selectedLabelStyle: TextStyle(
            fontFamily: 'Inter',
            fontSize: 12.sp,
            fontWeight: FontWeight.w600,
          ),
          unselectedLabelStyle: TextStyle(
            fontFamily: 'Inter',
            fontSize: 12.sp,
          ),
        ),
        dividerTheme: const DividerThemeData(
          color: dividerColor,
          thickness: 1,
        ),
      );
}
