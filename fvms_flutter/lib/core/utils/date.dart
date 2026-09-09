import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';

/// Mirror src/lib/utils/date.ts

String todayString() {
  try {
    final now = DateTime.now();
    return DateFormat('yyyy-MM-dd').format(now);
  } catch (_) {
    final now = DateTime.now();
    return '${now.year.toString().padLeft(4, '0')}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
  }
}

String dateString(DateTime d) {
  try {
    return DateFormat('yyyy-MM-dd').format(d);
  } catch (_) {
    return '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }
}

String formatDisplayDate(String iso) {
  try {
    final d = DateTime.parse(iso);
    try {
      return DateFormat('dd MMM yyyy', 'id_ID').format(d);
    } catch (_) {
      // Fallback if id_ID not initialized (APK cold start race)
      try {
        // Attempt lazy init without await (best-effort) then fallback to en
        initializeDateFormatting('id_ID');
      } catch (_) {}
      try {
        return DateFormat('dd MMM yyyy', 'id_ID').format(d);
      } catch (_) {
        return DateFormat('dd MMM yyyy').format(d);
      }
    }
  } catch (_) {
    return iso;
  }
}

String formatDateTime(String iso) {
  try {
    final d = DateTime.parse(iso);
    try {
      return DateFormat('dd MMM yyyy HH:mm', 'id_ID').format(d);
    } catch (_) {
      try {
        initializeDateFormatting('id_ID');
      } catch (_) {}
      try {
        return DateFormat('dd MMM yyyy HH:mm', 'id_ID').format(d);
      } catch (_) {
        return DateFormat('dd MMM yyyy HH:mm').format(d);
      }
    }
  } catch (_) {
    return iso;
  }
}
