import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:camera/camera.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'kiosk_screen.dart';
import 'login_screen.dart';

late List<CameraDescription> cameras;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);

  SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);

  cameras = await availableCameras();

  // Check login state
  final prefs = await SharedPreferences.getInstance();
  final isLoggedIn = prefs.getBool('kiosk_logged_in') ?? false;

  runApp(KioskApp(isLoggedIn: isLoggedIn));
}

class KioskApp extends StatelessWidget {
  final bool isLoggedIn;
  const KioskApp({super.key, required this.isLoggedIn});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(375, 812),
      minTextAdapt: true,
      builder: (context, child) {
        return MaterialApp(
          title: 'Siddhan Logs Kiosk',
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF4F46E5),
              surface: Color(0xFF1E1E2E),
            ),
            useMaterial3: true,
          ),
          home: isLoggedIn ? const KioskScreen() : const LoginScreen(),
        );
      },
    );
  }
}
