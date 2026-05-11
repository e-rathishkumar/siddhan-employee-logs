import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class AppTypography {
  AppTypography._();

  // Headings
  static TextStyle get h1 => TextStyle(
        fontFamily: 'Inter',
        fontSize: 28.sp,
        fontWeight: FontWeight.w700,
        height: 1.3,
        letterSpacing: -0.5,
      );

  static TextStyle get h2 => TextStyle(
        fontFamily: 'Inter',
        fontSize: 24.sp,
        fontWeight: FontWeight.w700,
        height: 1.3,
        letterSpacing: -0.3,
      );

  static TextStyle get h3 => TextStyle(
        fontFamily: 'Inter',
        fontSize: 20.sp,
        fontWeight: FontWeight.w600,
        height: 1.4,
      );

  static TextStyle get h4 => TextStyle(
        fontFamily: 'Inter',
        fontSize: 18.sp,
        fontWeight: FontWeight.w600,
        height: 1.4,
      );

  // Body
  static TextStyle get bodyLarge => TextStyle(
        fontFamily: 'Inter',
        fontSize: 16.sp,
        fontWeight: FontWeight.w400,
        height: 1.5,
      );

  static TextStyle get bodyMedium => TextStyle(
        fontFamily: 'Inter',
        fontSize: 14.sp,
        fontWeight: FontWeight.w400,
        height: 1.5,
      );

  static TextStyle get bodySmall => TextStyle(
        fontFamily: 'Inter',
        fontSize: 12.sp,
        fontWeight: FontWeight.w400,
        height: 1.5,
      );

  // Labels
  static TextStyle get labelLarge => TextStyle(
        fontFamily: 'Inter',
        fontSize: 14.sp,
        fontWeight: FontWeight.w600,
        height: 1.4,
      );

  static TextStyle get labelMedium => TextStyle(
        fontFamily: 'Inter',
        fontSize: 12.sp,
        fontWeight: FontWeight.w500,
        height: 1.4,
      );

  static TextStyle get labelSmall => TextStyle(
        fontFamily: 'Inter',
        fontSize: 10.sp,
        fontWeight: FontWeight.w500,
        height: 1.4,
        letterSpacing: 0.5,
      );

  // Caption
  static TextStyle get caption => TextStyle(
        fontFamily: 'Inter',
        fontSize: 12.sp,
        fontWeight: FontWeight.w400,
        height: 1.4,
        color: const Color(0xFF6B7280),
      );

  // Button
  static TextStyle get button => TextStyle(
        fontFamily: 'Inter',
        fontSize: 16.sp,
        fontWeight: FontWeight.w600,
        height: 1.2,
      );

  static TextStyle get buttonSmall => TextStyle(
        fontFamily: 'Inter',
        fontSize: 14.sp,
        fontWeight: FontWeight.w600,
        height: 1.2,
      );
}
