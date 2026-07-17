import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Column {
  header: string;
  dataKey: string;
}

export function exportPdf(
  title: string,
  columns: Column[],
  rows: Record<string, string>[],
  filename: string,
) {
  const doc = new jsPDF("landscape", "mm", "a4");

  doc.setFontSize(14);
  doc.text(title, 14, 20);

  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString("id-ID")}`, 14, 26);

  autoTable(doc, {
    startY: 30,
    columns: columns.map((c) => ({ header: c.header, dataKey: c.dataKey })),
    body: rows,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [0, 0, 0] },
    margin: { top: 30 },
  });

  doc.save(filename);
}
