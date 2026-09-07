/// Mirror src/features/panen/services/panen-logic.ts

class PanenStatus {
  final String label;
  final String? date;
  PanenStatus(this.label, [this.date]);
}

PanenStatus getPanenStatus({
  String? tglPanen,
  String? realPanen,
  String? rencanaPanen,
  String? tglTanam,
  String? cgr,
}) {
  if (tglPanen != null && tglPanen.isNotEmpty) {
    return PanenStatus('Panen', tglPanen);
  }
  if (realPanen != null && realPanen.isNotEmpty) {
    return PanenStatus('Panen', realPanen);
  }
  if (rencanaPanen != null && rencanaPanen.isNotEmpty) {
    final rencana = DateTime.tryParse(rencanaPanen);
    if (rencana != null && DateTime.now().isAfter(rencana)) {
      return PanenStatus('Jatuh Tempo', rencanaPanen);
    }
    return PanenStatus('Renc: $rencanaPanen', rencanaPanen);
  }
  return PanenStatus('—');
}

String? getVarietasFromDocumentNo(String? doc) {
  if (doc == null || doc.isEmpty) return null;
  final parts = doc.split('/');
  if (parts.length >= 2) return parts[1].trim();
  return null;
}

/// Mirror deriveScheduleStatus
String? deriveScheduleStatus({
  double? realTanamHa,
  double? gagalTanam,
  double? sisaDiLahanHa,
  bool? hasActivity,
}) {
  if (sisaDiLahanHa == 0 && (gagalTanam == null || gagalTanam == 0)) {
    return 'completed';
  }
  if (sisaDiLahanHa == 0 &&
      gagalTanam != null &&
      gagalTanam > 0 &&
      realTanamHa != null &&
      (realTanamHa - gagalTanam) == 0) {
    return 'gagal_total';
  }
  if (sisaDiLahanHa != null &&
      sisaDiLahanHa > 0 &&
      gagalTanam != null &&
      gagalTanam > 0 &&
      realTanamHa != null &&
      (realTanamHa - gagalTanam) == sisaDiLahanHa) {
    return 'gagal_partial';
  }
  if (sisaDiLahanHa == null &&
      realTanamHa != null &&
      gagalTanam != null &&
      gagalTanam > 0 &&
      realTanamHa <= gagalTanam) {
    return 'gagal_total';
  }
  if (hasActivity == true) return 'in_progress';
  if (hasActivity == false) return 'pending';
  return null;
}
