import 'package:flutter_test/flutter_test.dart';
import 'package:fvms_flutter/core/constants/status.dart';

void main() {
  test('status transitions pending', () {
    expect(canTransition(VisitStatus.pending, VisitStatus.inProgress), isTrue);
    expect(canTransition(VisitStatus.pending, VisitStatus.completed), isTrue);
    expect(canTransition(VisitStatus.gagalTotal, VisitStatus.pending), isFalse);
  });

  test('gagal_total terminal', () {
    expect(statusTransitions[VisitStatus.gagalTotal], isEmpty);
  });
}
