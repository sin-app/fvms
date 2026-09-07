import 'package:flutter_test/flutter_test.dart';
import 'package:fvms_flutter/core/constants/status.dart';

void main() {
  group('Panen & Status', () {
    test('status label', () {
      expect(VisitStatus.pending.label, 'Pending');
      expect(VisitStatus.completed.label, 'Completed');
    });
  });
}
