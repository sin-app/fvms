import 'package:fvms_flutter/core/supabase/client.dart';

dynamic applyScope(dynamic query, AuthContext? ctx) {
  if (ctx == null) return query;
  if (ctx.role == UserRole.produksi) return query.eq('user_id', ctx.userId);
  if (ctx.role == UserRole.qc) {
    final scope = qcKabupatenScope(ctx);
    if (scope != null) {
      if (scope.isEmpty) return query.eq('kabupaten_id', '__none__');
      return query.inFilter('kabupaten_id', scope);
    }
  }
  return query;
}

String sanitizeVarietas(String input) {
  return input.replaceAll(RegExp('[%_]'), '');
}

String sanitizeError(Object err) {
  final m = err.toString();
  if (m.contains('TimeoutException')) return 'Koneksi timeout. Coba lagi.';
  if (m.contains('LateInitializationError') || m.contains('has not been initialized') || m.contains('not been initialized')) {
    return 'Supabase belum siap. Restart aplikasi.';
  }
  if (m.contains('SocketException') || m.contains('Connection refused')) {
    return 'Tidak ada koneksi internet.';
  }
  if (m.contains('Permission denied') || m.contains('403') || m.contains('401')) {
    return 'Tidak memiliki akses.';
  }
  return 'Terjadi kesalahan. Coba lagi.';
}
