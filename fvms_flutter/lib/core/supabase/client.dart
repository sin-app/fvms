import 'dart:async';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseConfig {
  // dart-define (CI release) has priority, then .env (local dev), then empty
  static const _envUrl = String.fromEnvironment('SUPABASE_URL');
  static const _envAnon = String.fromEnvironment('SUPABASE_ANON_KEY');
  static String get url => _envUrl.isNotEmpty ? _envUrl : (dotenv.env['SUPABASE_URL'] ?? '');
  static String get anonKey => _envAnon.isNotEmpty ? _envAnon : (dotenv.env['SUPABASE_ANON_KEY'] ?? '');
  static bool get isConfigured => url.isNotEmpty && anonKey.isNotEmpty;
}

bool _supabaseInitialized = false;
bool get isSupabaseInitialized => _supabaseInitialized;

Future<void> initSupabase() async {
  try {
    await dotenv.load();
  } catch (_) {}
  if (!SupabaseConfig.isConfigured) {
    throw Exception('Supabase belum dikonfigurasi: isi .env atau --dart-define SUPABASE_URL/ANON_KEY');
  }
  await Supabase.initialize(
    url: SupabaseConfig.url,
    anonKey: SupabaseConfig.anonKey,
  );
  _supabaseInitialized = true;
}

SupabaseClient get supabase {
  if (!_supabaseInitialized) {
    throw Exception(
      SupabaseConfig.isConfigured
          ? 'Supabase belum di-init: panggil initSupabase() dulu'
          : 'Supabase belum dikonfigurasi: SUPABASE_URL/ANON_KEY kosong (isi .env atau --dart-define)',
    );
  }
  return Supabase.instance.client;
}

/// Mirror getAuthContext + qcKabupatenScope
enum UserRole { admin, qc, produksi }

class AuthContext {
  AuthContext({
    required this.userId,
    required this.role,
    this.assignedKabupatenIds = const [],
  });
  final String userId;
  final UserRole role;
  final List<String> assignedKabupatenIds;
}

Future<AuthContext?> getAuthContext() async {
  if (!isSupabaseInitialized) return null;
  try {
    final user = supabase.auth.currentUser;
    if (user == null) return null;
    final row = await supabase
        .from('users')
        .select('id, role, assigned_kabupaten_ids')
        .eq('id', user.id)
        .maybeSingle()
        .timeout(const Duration(seconds: 8));
    if (row == null) return null;
    final roleStr = row['role'] as String;
    final role = switch (roleStr) {
      'admin' => UserRole.admin,
      'qc' => UserRole.qc,
      _ => UserRole.produksi,
    };
    final kabIds = (row['assigned_kabupaten_ids'] as List?)?.cast<String>() ?? [];
    return AuthContext(userId: user.id, role: role, assignedKabupatenIds: kabIds);
  } catch (e) {
    final m = e.toString();
    if (m.contains('LateInitializationError') || m.contains('has not been initialized') || m.contains('not been initialized')) return null;
    if (m.contains('TimeoutException') || e is TimeoutException) rethrow;
    // Other errors: return null so caller can handle gracefully, not crash
    return null;
  }
}

List<String>? qcKabupatenScope(AuthContext ctx) {
  if (ctx.role != UserRole.qc) return null;
  return ctx.assignedKabupatenIds;
}

bool isPrivileged(AuthContext ctx) =>
    ctx.role == UserRole.admin || ctx.role == UserRole.qc;
