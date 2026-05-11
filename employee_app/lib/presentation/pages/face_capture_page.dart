import 'dart:async';
import 'dart:io';
import 'dart:math' as math;
import 'dart:typed_data';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_typography.dart';
import '../../core/extensions/context_extensions.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../di.dart';
import '../blocs/auth/auth_bloc.dart';
import '../blocs/auth/auth_event.dart';
import 'main_shell.dart';

/// The 5 auto-capture steps for face registration.
enum _CaptureStep {
  front('front', 'Look Straight', Icons.face),
  left('left_45', 'Turn Left', Icons.arrow_back_rounded),
  right('right_45', 'Turn Right', Icons.arrow_forward_rounded),
  up('up', 'Look Up', Icons.arrow_upward_rounded),
  down('down', 'Look Down', Icons.arrow_downward_rounded);

  final String angleId;
  final String label;
  final IconData icon;
  const _CaptureStep(this.angleId, this.label, this.icon);
}

class FaceCapturePage extends StatefulWidget {
  const FaceCapturePage({super.key});

  @override
  State<FaceCapturePage> createState() => _FaceCapturePageState();
}

class _FaceCapturePageState extends State<FaceCapturePage>
    with TickerProviderStateMixin {
  CameraController? _cameraController;
  bool _isCameraReady = false;
  bool _isUploading = false;
  bool _isProcessing = false;

  int _currentStep = 0;
  final Map<String, Uint8List> _captures = {};

  late FaceDetector _faceDetector;
  bool _faceDetected = false;
  String _statusMessage = 'Initializing camera...';

  late AnimationController _pulseController;
  late AnimationController _successController;

  // Prevent rapid captures
  DateTime? _lastCaptureTime;
  static const _captureCooldown = Duration(seconds: 2);

  // Track consecutive correct-position detections before capturing
  int _correctPositionFrames = 0;
  static const _requiredFrames = 3;

  // Throttle face detection (one at a time)
  bool _isDetecting = false;

  static const _orientations = {
    DeviceOrientation.portraitUp: 0,
    DeviceOrientation.landscapeLeft: 90,
    DeviceOrientation.portraitDown: 180,
    DeviceOrientation.landscapeRight: 270,
  };

  @override
  void initState() {
    super.initState();
    _faceDetector = FaceDetector(
      options: FaceDetectorOptions(
        enableClassification: false,
        enableTracking: true,
        performanceMode: FaceDetectorMode.fast,
      ),
    );
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _successController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _initCamera();
  }

  @override
  void dispose() {
    _faceDetector.close();
    _pulseController.dispose();
    _successController.dispose();
    _cameraController?.dispose();
    super.dispose();
  }

  Future<void> _initCamera() async {
    try {
      final cameras = await availableCameras();
      final front = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );
      _cameraController = CameraController(
        front,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: Platform.isAndroid
            ? ImageFormatGroup.nv21
            : ImageFormatGroup.bgra8888,
      );
      await _cameraController!.initialize();
      if (mounted) {
        setState(() {
          _isCameraReady = true;
          _statusMessage = _CaptureStep.values[_currentStep].label;
        });
        _startFaceDetection();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _statusMessage = 'Camera error');
        context.showSnackBar('Camera error: $e', isError: true);
      }
    }
  }

  // ── Face Detection Stream ──────────────────────────────────────────────────

  void _startFaceDetection() {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }
    _cameraController!.startImageStream((CameraImage image) {
      if (_isDetecting || !mounted || _allCaptured || _isProcessing) return;
      _isDetecting = true;
      _processImage(image).whenComplete(() => _isDetecting = false);
    });
  }

  Future<void> _processImage(CameraImage image) async {
    final inputImage = _convertCameraImage(image);
    if (inputImage == null) return;

    try {
      final faces = await _faceDetector.processImage(inputImage);
      if (!mounted) return;

      if (faces.isEmpty) {
        _correctPositionFrames = 0;
        setState(() {
          _faceDetected = false;
          _statusMessage = 'Position your face in the circle';
        });
        return;
      }

      if (faces.length > 1) {
        _correctPositionFrames = 0;
        setState(() {
          _faceDetected = false;
          _statusMessage = 'Only one face allowed';
        });
        return;
      }

      final face = faces.first;
      final rotY = face.headEulerAngleY ?? 0;
      final rotX = face.headEulerAngleX ?? 0;

      setState(() => _faceDetected = true);

      // Check if face matches current step direction
      final step = _CaptureStep.values[_currentStep];
      final isCorrect = _isCorrectPosition(step, rotY, rotX);

      if (isCorrect) {
        _correctPositionFrames++;
        if (_correctPositionFrames >= _requiredFrames) {
          // Check cooldown
          if (_lastCaptureTime != null &&
              DateTime.now().difference(_lastCaptureTime!) < _captureCooldown) {
            return;
          }
          setState(() => _statusMessage = 'Hold still... capturing');
          await _autoCapture();
          _correctPositionFrames = 0;
        } else {
          setState(() => _statusMessage = 'Hold still...');
        }
      } else {
        _correctPositionFrames = 0;
        setState(() => _statusMessage = step.label);
      }
    } catch (_) {
      // Silently handle face detection errors
    }
  }

  bool _isCorrectPosition(_CaptureStep step, double rotY, double rotX) {
    switch (step) {
      case _CaptureStep.front:
        return rotY.abs() < 12 && rotX.abs() < 12;
      case _CaptureStep.left:
        return rotY > 20;
      case _CaptureStep.right:
        return rotY < -20;
      case _CaptureStep.up:
        return rotX < -7;  // Reduced from -10 for easier capture
      case _CaptureStep.down:
        return rotX > 7;   // Reduced from 10 for easier capture
    }
  }

  InputImage? _convertCameraImage(CameraImage image) {
    final camera = _cameraController?.description;
    if (camera == null) return null;

    final sensorOrientation = camera.sensorOrientation;
    InputImageRotation? rotation;

    if (Platform.isIOS) {
      rotation = InputImageRotationValue.fromRawValue(sensorOrientation);
    } else if (Platform.isAndroid) {
      final orientationVal =
          _orientations[_cameraController!.value.deviceOrientation];
      if (orientationVal == null) return null;
      int rotationCompensation;
      if (camera.lensDirection == CameraLensDirection.front) {
        rotationCompensation = (sensorOrientation + orientationVal) % 360;
      } else {
        rotationCompensation =
            (sensorOrientation - orientationVal + 360) % 360;
      }
      rotation = InputImageRotationValue.fromRawValue(rotationCompensation);
    }
    if (rotation == null) return null;

    final format = InputImageFormatValue.fromRawValue(image.format.raw);
    if (format == null) return null;

    if (image.planes.isEmpty) return null;
    final plane = image.planes.first;

    return InputImage.fromBytes(
      bytes: plane.bytes,
      metadata: InputImageMetadata(
        size: Size(image.width.toDouble(), image.height.toDouble()),
        rotation: rotation,
        format: format,
        bytesPerRow: plane.bytesPerRow,
      ),
    );
  }

  // ── Capture & Upload ───────────────────────────────────────────────────────

  Future<void> _autoCapture() async {
    if (!_isCameraReady || _cameraController == null || _isProcessing) return;
    final controller = _cameraController!;
    if (controller.value.isTakingPicture) return;

    setState(() => _isProcessing = true);
    _lastCaptureTime = DateTime.now();

    try {
      // Stop stream before taking picture
      await controller.stopImageStream();

      final file = await controller.takePicture();
      final bytes = await file.readAsBytes();
      if (!mounted) return;

      final step = _CaptureStep.values[_currentStep];
      setState(() {
        _captures[step.angleId] = bytes;
        _statusMessage = '${step.label} ✓';
      });

      // Play success flash
      _successController.forward(from: 0);
      await Future.delayed(const Duration(milliseconds: 800));
      if (!mounted) return;

      if (_currentStep < _CaptureStep.values.length - 1) {
        setState(() {
          _currentStep++;
          _statusMessage = _CaptureStep.values[_currentStep].label;
          _isProcessing = false;
        });
        // Restart detection for next step
        _startFaceDetection();
      } else {
        // All done – wait for user to tap Upload
        setState(() {
          _isProcessing = false;
          _statusMessage = 'All captures complete! Tap Upload.';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _statusMessage = 'Capture failed, retrying...';
          _isProcessing = false;
        });
        // Restart detection to retry
        _startFaceDetection();
      }
    }
  }

  bool get _allCaptured => _captures.length == _CaptureStep.values.length;

  Future<void> _uploadAll() async {
    if (!_allCaptured) return;
    setState(() {
      _isUploading = true;
      _statusMessage = 'Registering your face...';
    });

    final captures = _CaptureStep.values.map((step) {
      return {
        'bytes': _captures[step.angleId]!.toList(),
        'angle': step.angleId,
      };
    }).toList();

    final authRepo = sl<AuthRepository>();
    final result = await authRepo.register360Face(captures);

    if (!mounted) return;
    setState(() => _isUploading = false);

    result.fold(
      (error) {
        setState(() => _statusMessage = 'Registration failed');
        context.showSnackBar(error, isError: true);
        _resetCapture();
      },
      (data) {
        context.showSnackBar('Face registration complete!');
        context.read<AuthBloc>().add(const AuthProfileRefreshRequested());
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const MainShell()),
          (_) => false,
        );
      },
    );
  }

  void _resetCapture() {
    setState(() {
      _currentStep = 0;
      _captures.clear();
      _faceDetected = false;
      _statusMessage = _CaptureStep.values[0].label;
      _correctPositionFrames = 0;
    });
    _startFaceDetection();
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final circleSize = MediaQuery.of(context).size.width * 0.72;

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            SizedBox(height: 24.h),
            Text(
              'Face Registration',
              style: AppTypography.h1.copyWith(
                color: AppTheme.primaryColor,
                letterSpacing: -0.5,
              ),
            ),
            SizedBox(height: 8.h),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 300),
              style: AppTypography.bodyMedium.copyWith(
                color: _faceDetected
                    ? AppTheme.successColor
                    : AppTheme.textTertiary,
                fontWeight:
                    _faceDetected ? FontWeight.w600 : FontWeight.normal,
              ),
              child: Text(
                _statusMessage,
                textAlign: TextAlign.center,
              ),
            ),
            SizedBox(height: 24.h),

            // Round camera preview
            Expanded(
              child: Center(
                child: _isCameraReady && _cameraController != null
                    ? _buildRoundCameraPreview(circleSize)
                    : _buildLoadingIndicator(),
              ),
            ),
            SizedBox(height: 12.h),

            // Uploading indicator
            if (_isUploading)
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 24.w),
                child: Column(
                  children: [
                    LinearProgressIndicator(
                      backgroundColor: Colors.grey[200],
                      valueColor:
                          AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
                    ),
                    SizedBox(height: 8.h),
                    Text(
                      'Registering face data...',
                      style: AppTypography.bodySmall
                          .copyWith(color: AppTheme.textTertiary),
                    ),
                  ],
                ),
              ),

            // Retake button
            if (_captures.isNotEmpty && !_isUploading)
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 24.w),
                child: TextButton.icon(
                  onPressed: _isProcessing ? null : _resetCapture,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retake'),
                ),
              ),

            // Upload button (disabled until all captured)
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 8.h),
              child: SizedBox(
                width: double.infinity,
                height: 50.h,
                child: ElevatedButton(
                  onPressed: _allCaptured && !_isUploading && !_isProcessing
                      ? _uploadAll
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    disabledBackgroundColor: Colors.grey[300],
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12.r),
                    ),
                  ),
                  child: Text(
                    'Upload',
                    style: TextStyle(
                      fontSize: 16.sp,
                      fontWeight: FontWeight.w600,
                      color: _allCaptured && !_isUploading
                          ? Colors.white
                          : Colors.grey[500],
                    ),
                  ),
                ),
              ),
            ),

            SizedBox(height: 16.h),
          ],
        ),
      ),
    );
  }

  Widget _buildRoundCameraPreview(double size) {
    final targetProgress = _captures.length / _CaptureStep.values.length;
    final step = !_allCaptured ? _CaptureStep.values[_currentStep] : null;

    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0, end: targetProgress),
      duration: const Duration(milliseconds: 500),
      curve: Curves.easeInOut,
      builder: (context, progress, _) {
        return Stack(
          alignment: Alignment.center,
          children: [
            // Circular progress ring
            SizedBox(
              width: size + 24,
              height: size + 24,
              child: CustomPaint(
                painter: _CircularProgressPainter(
                  progress: progress,
                  progressColor: AppTheme.successColor,
                  trackColor: Colors.grey[300]!,
                  strokeWidth: 6,
                ),
              ),
            ),
            // Pulsing ring
            AnimatedBuilder(
              animation: _pulseController,
              builder: (context, child) {
                final scale = 1.0 + _pulseController.value * 0.02;
                return Transform.scale(
                  scale: scale,
                  child: Container(
                    width: size + 8,
                    height: size + 8,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: _faceDetected
                            ? AppTheme.successColor.withValues(alpha: 0.3)
                            : AppTheme.primaryColor.withValues(alpha: 0.2),
                        width: 2,
                      ),
                    ),
                  ),
                );
              },
            ),
            // Camera preview clipped to circle
            ClipOval(
              child: SizedBox(
                width: size,
                height: size,
                child: FittedBox(
                  fit: BoxFit.cover,
                  child: SizedBox(
                    width:
                        _cameraController!.value.previewSize?.height ?? size,
                    height:
                        _cameraController!.value.previewSize?.width ?? size,
                    child: CameraPreview(_cameraController!),
                  ),
                ),
              ),
            ),
            // Border ring
            Container(
              width: size,
              height: size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: _faceDetected
                      ? AppTheme.successColor
                      : AppTheme.primaryColor,
                  width: 3,
                ),
              ),
            ),
            // Current step badge at top of circle
            if (step != null && !_isProcessing)
              Positioned(
                top: 0,
                child: Container(
                  padding:
                      EdgeInsets.symmetric(horizontal: 14.w, vertical: 6.h),
                  decoration: BoxDecoration(
                    color: _faceDetected
                        ? AppTheme.successColor
                        : AppTheme.primaryColor,
                    borderRadius: BorderRadius.circular(16.r),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.2),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(step.icon, color: Colors.white, size: 16.sp),
                      SizedBox(width: 4.w),
                      Text(
                        step.label,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            // Progress percentage at bottom of circle
            Positioned(
              bottom: 0,
              child: Container(
                padding:
                    EdgeInsets.symmetric(horizontal: 14.w, vertical: 4.h),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.65),
                  borderRadius: BorderRadius.circular(12.r),
                ),
                child: Text(
                  '${(progress * 100).round()}%',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 13.sp,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            // Success flash overlay
            AnimatedBuilder(
              animation: _successController,
              builder: (context, child) {
                if (_successController.value == 0) {
                  return const SizedBox.shrink();
                }
                return Opacity(
                  opacity: (1 - _successController.value).clamp(0.0, 0.6),
                  child: Container(
                    width: size,
                    height: size,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.green,
                    ),
                  ),
                );
              },
            ),
            // Check mark on capture
            if (_isProcessing)
              Container(
                width: 64.w,
                height: 64.w,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.green.withValues(alpha: 0.85),
                ),
                child: Icon(Icons.check, color: Colors.white, size: 40.sp),
              ),
          ],
        );
      },
    );
  }

  Widget _buildLoadingIndicator() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const CircularProgressIndicator(),
        SizedBox(height: 16.h),
        Text(
          'Starting camera...',
          style:
              AppTypography.bodyMedium.copyWith(color: AppTheme.textTertiary),
        ),
      ],
    );
  }
}

/// Custom painter for drawing circular progress around the camera preview.
class _CircularProgressPainter extends CustomPainter {
  final double progress;
  final Color progressColor;
  final Color trackColor;
  final double strokeWidth;

  _CircularProgressPainter({
    required this.progress,
    required this.progressColor,
    required this.trackColor,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Draw track
    final trackPaint = Paint()
      ..color = trackColor
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(center, radius, trackPaint);

    // Draw progress arc
    if (progress > 0) {
      final progressPaint = Paint()
        ..color = progressColor
        ..strokeWidth = strokeWidth
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -math.pi / 2,
        2 * math.pi * progress,
        false,
        progressPaint,
      );
    }
  }

  @override
  bool shouldRepaint(_CircularProgressPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
