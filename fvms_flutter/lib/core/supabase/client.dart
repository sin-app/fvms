import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseConfig {
  static String get url =>
      dotenv.env['SUPABASE_URL'] ?? const String.fromEnvironment('SUPABASE_URL');
  static String get anonKey =>
      dotenv.env['SUPABASE_ANON_KEY'] ??
      const String.fromEnvironment('SUPABASE_ANON_KEY');
}

Future<void> initSupabase() async {
  await dotenv.load(fileName: '.env');
  await Supabase.initialize(
    url: SupabaseConfig.url,
    anonKey: SupabaseConfig.anonKey,
  );
}

SupabaseClient get supabase => Supabase.instance.client;

/// Mirror getAuthContext + qcKabupatenScope
enum UserRole { admin, qc, produksi }

class AuthContext {
  final String userId;
  final UserRole role;
  final List<String> assignedKabupatenIds;
  AuthContext({
    required this.userId,
    required this.role,
    this.assignedKabupatenIds = const [],
  });
}

Future<AuthContext?> getAuthContext() async {
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
