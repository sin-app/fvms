/// Mirror src/features/panen/services/panen-logic.ts
library;

class PanenStatus {
  PanenStatus(this.label, [this.date]);
  final String label;
  final String? date;
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

String computePanenStatusString({
  String? tglPanen,
  String? realPanen,
  String? rencanaPanen,
}) {
  final ps = getPanenStatus(tglPanen: tglPanen, realPanen: realPanen, rencanaPanen: rencanaPanen);
  if (ps.date != null) return '${ps.label} ${ps.date}';
  return ps.label;
}

String? getVarietasFromDocumentNo(String? doc) {
  if (doc == null || doc.isEmpty) return null;
  final parts = doc.split('/');
  if (parts.length >= 2) return parts[1].trim();
  return null;
}
