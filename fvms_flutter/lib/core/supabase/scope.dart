import 'package:fvms_flutter/core/supabase/client.dart';

dynamic applyScope(dynamic query, AuthContext? ctx) {
  if (ctx == null) return query;
  if (ctx.role == UserRole.produksi) return query.eq('user_id', ctx.userId);
  if (ctx.role == UserRole.qc) {
    final scope = qcKabupatenScope(ctx);
    if (scope != null) {
      if (scope.isEmpty) return query.eq('kabupaten_id', '__none__');
      return query.filter('kabupaten_id', 'in', '(${scope.map((e) => '"$e"').join(',')})');
    }
  }
  return query;
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
  return 'Terjadi kesalahan. Coba lagi.';
}
