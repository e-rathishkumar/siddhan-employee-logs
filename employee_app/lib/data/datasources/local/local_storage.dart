import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/constants/app_constants.dart';

class LocalStorage {
  final FlutterSecureStorage _secureStorage;
  final SharedPreferences _prefs;

  LocalStorage({
    required FlutterSecureStorage secureStorage,
    required SharedPreferences prefs,
  })  : _secureStorage = secureStorage,
        _prefs = prefs;

  // Secure token storage
  Future<void> saveAccessToken(String token) async {
    await _secureStorage.write(key: AppConstants.accessTokenKey, value: token);
  }

  Future<String?> getAccessToken() async {
    return await _secureStorage.read(key: AppConstants.accessTokenKey);
  }

  Future<void> saveRefreshToken(String token) async {
    await _secureStorage.write(key: AppConstants.refreshTokenKey, value: token);
  }

  Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: AppConstants.refreshTokenKey);
  }

  Future<void> clearTokens() async {
    await _secureStorage.delete(key: AppConstants.accessTokenKey);
    await _secureStorage.delete(key: AppConstants.refreshTokenKey);
  }

  // Username (from JWT decode)
  Future<void> saveUsername(String username) async {
    await _prefs.setString('username', username);
  }

  String? getUsername() {
    return _prefs.getString('username');
  }

  Future<void> clearUsername() async {
    await _prefs.remove('username');
  }

  // User data
  Future<void> saveUserData(Map<String, dynamic> userData) async {
    await _prefs.setString(AppConstants.userDataKey, jsonEncode(userData));
  }

  Map<String, dynamic>? getUserData() {
    final data = _prefs.getString(AppConstants.userDataKey);
    if (data == null) return null;
    return jsonDecode(data) as Map<String, dynamic>;
  }

  Future<void> clearUserData() async {
    await _prefs.remove(AppConstants.userDataKey);
  }

  // Locale
  Future<void> saveLocale(String locale) async {
    await _prefs.setString(AppConstants.localeKey, locale);
  }

  String getLocale() {
    return _prefs.getString(AppConstants.localeKey) ?? 'en';
  }

  // Clear all
  Future<void> clearAll() async {
    await clearTokens();
    await clearUserData();
    await clearUsername();
  }
}
