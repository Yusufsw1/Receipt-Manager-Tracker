import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Definisikan interface jika belum ada
interface ReceiptExportData {
  merchant_name: string | null;
  date: string | null;
  total_amount: number | null;
  category: string | null;
}

export function exportReceiptsToPDF(receipts: ReceiptExportData[]) {
  const doc = new jsPDF();

  // Judul Laporan
  doc.setFontSize(18);
  doc.text("Laporan Riwayat Struk", 14, 20);

  // Tambah metadata (opsional)
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Dicetak pada: ${new Date().toLocaleDateString("id-ID")}`, 14, 28);

  // Transformasi data untuk tabel
  const tableData = receipts.map((r) => [r.merchant_name || "-", r.date || "-", r.total_amount ? `Rp ${r.total_amount.toLocaleString("id-ID")}` : "Rp 0", r.category || "-"]);

  autoTable(doc, {
    head: [["Merchant", "Tanggal", "Total Harga", "Kategori"]],
    body: tableData,
    startY: 35,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 }, // Warna biru profesional
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`Laporan_Struk_${Date.now()}.pdf`);
}
