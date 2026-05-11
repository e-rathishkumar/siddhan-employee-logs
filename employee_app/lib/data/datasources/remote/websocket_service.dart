import 'dart:async';
import 'dart:convert';
import 'dart:developer';

import 'package:web_socket_channel/web_socket_channel.dart';

import '../../../core/constants/api_constants.dart';

/// Service that manages a WebSocket connection to the backend
/// and exposes a stream of attendance update events.
class WebSocketService {
  WebSocketChannel? _channel;
  Timer? _pingTimer;
  Timer? _reconnectTimer;
  String? _token;
  bool _disposed = false;

  // Must be recreatable — a closed StreamController cannot be reused
  StreamController<Map<String, dynamic>> _controller =
      StreamController<Map<String, dynamic>>.broadcast();

  /// Stream of JSON events from the backend.
  Stream<Map<String, dynamic>> get events => _controller.stream;

  /// Whether the WebSocket is currently connected.
  bool get isConnected => _channel != null && !_disposed;

  /// Connect to WebSocket using the employee's JWT token.
  void connect(String token) {
    _token = token;
    _disposed = false;
    // Recreate controller if previously closed (e.g., after logout + re-login)
    if (_controller.isClosed) {
      _controller = StreamController<Map<String, dynamic>>.broadcast();
    }
    _doConnect();
  }

  Future<void> _doConnect() async {
    if (_disposed || _token == null) return;

    // Close previous channel cleanly
    try {
      _pingTimer?.cancel();
      await _channel?.sink.close();
    } catch (_) {}
    _channel = null;

    try {
      final uri = Uri.parse('${ApiConstants.wsUrl}/ws/$_token');
      log('WS connecting to: $uri');

      _channel = WebSocketChannel.connect(uri);

      // v3 REQUIREMENT: await ready to ensure the TCP+WS handshake completes.
      // Without this, connection errors are silently lost.
      await _channel!.ready;
      log('WS connected successfully');

      _channel!.stream.listen(
        (message) {
          try {
            final data = jsonDecode(message as String) as Map<String, dynamic>;
            log('WS received: $data');
            if (!_controller.isClosed) {
              _controller.add(data);
            }
          } catch (e) {
            log('WS parse error: $e');
          }
        },
        onDone: () {
          log('WS disconnected — scheduling reconnect');
          _scheduleReconnect();
        },
        onError: (error) {
          log('WS stream error: $error');
          _scheduleReconnect();
        },
      );

      // Send ping every 30s to keep connection alive
      _pingTimer?.cancel();
      _pingTimer = Timer.periodic(const Duration(seconds: 30), (_) {
        try {
          _channel?.sink.add('ping');
        } catch (_) {}
      });
    } catch (e) {
      log('WS connect failed: $e');
      _scheduleReconnect();
    }
  }

  void _scheduleReconnect() {
    if (_disposed) return;
    _pingTimer?.cancel();
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 5), () => _doConnect());
  }

  /// Disconnect and clean up.
  void dispose() {
    _disposed = true;
    _pingTimer?.cancel();
    _reconnectTimer?.cancel();
    try {
      _channel?.sink.close();
    } catch (_) {}
    if (!_controller.isClosed) {
      _controller.close();
    }
  }
}
