import 'package:intl/intl.dart';

/// Mirror src/lib/utils/date.ts

String todayString() {
  final now = DateTime.now();
  return DateFormat('yyyy-MM-dd').format(now);
}

String dateString(DateTime d) {
  return DateFormat('yyyy-MM-dd').format(d);
}

String formatDisplayDate(String iso) {
  try {
    final d = DateTime.parse(iso);
    return DateFormat('dd MMM yyyy', 'id_ID').format(d);
  } catch (_) {
    return iso;
  }
}

String formatDateTime(String iso) {
  try {
    final d = DateTime.parse(iso);
    return DateFormat('dd MMM yyyy HH:mm', 'id_ID').format(d);
  } catch (_) {
    return iso;
  }
}
