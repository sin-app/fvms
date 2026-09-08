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
}

SupabaseClient get supabase {
  try {
    return Supabase.instance.client;
  } catch (e) {
    if (e.toString().contains('LateInitializationError')) {
      throw Exception(
        SupabaseConfig.isConfigured
            ? 'Supabase belum di-init: panggil initSupabase() dulu'
            : 'Supabase belum dikonfigurasi: SUPABASE_URL/ANON_KEY kosong (isi .env atau --dart-define)',
      );
    }
    rethrow;
  }
}

bool get isSupabaseInitialized {
  try {
    // ignore: unnecessary_statements
    Supabase.instance.client;
    return true;
  } catch (_) {
    return false;
  }
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
  final user = supabase.auth.currentUser;
  if (user == null) return null;
  final row = await supabase
      .from('users')
      .select('id, role, assigned_kabupaten_ids')
      .eq('id', user.id)
      .maybeSingle();
  if (row == null) return null;
  final roleStr = row['role'] as String;
  final role = switch (roleStr) {
    'admin' => UserRole.admin,
    'qc' => UserRole.qc,
    _ => UserRole.produksi,
  };
  final kabIds = (row['assigned_kabupaten_ids'] as List?)?.cast<String>() ?? [];
  return AuthContext(userId: user.id, role: role, assignedKabupatenIds: kabIds);
}

List<String>? qcKabupatenScope(AuthContext ctx) {
  if (ctx.role != UserRole.qc) return null;
  return ctx.assignedKabupatenIds;
}

bool isPrivileged(AuthContext ctx) =>
    ctx.role == UserRole.admin || ctx.role == UserRole.qc;
