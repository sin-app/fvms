/**
 * Ekstraksi varietas dari document_no berformat multi-segmen, mis.:
 *   "KJM/JMP-18/AMP-V/2026/133" -> "JMP-18"
 * Varietas selalu berada pada segmen kedua.
 */
export function getVarietasFromDocumentNo(
  documentNo: string | null | undefined,
): string | null {
  if (!documentNo) return null;
  const parts = documentNo.split("/");
  if (parts.length < 2) return null;
  const segmen = parts[1]?.trim() ?? "";
  return segmen || null;
}
