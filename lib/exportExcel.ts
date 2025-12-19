import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Gunakan interface yang konsisten dengan data Supabase kamu
interface ExportReceipt {
  id: string;
  merchant_name: string | null;
  date: string | null;
  total_amount: number | null;
  category: string | null;
  created_at: string | null;
}

export function exportReceiptsToExcel(receipts: ExportReceipt[]) {
  // 1. Format data agar rapi di Excel
  const worksheetData = receipts.map((r) => ({
    "Transaction ID": r.id,
    "Nama Merchant": r.merchant_name || "Tanpa Nama",
    "Tanggal Nota": r.date || "-",
    "Total Biaya (IDR)": r.total_amount || 0,
    Kategori: r.category || "Uncategorized",
    "Waktu Input": r.created_at ? new Date(r.created_at).toLocaleString("id-ID") : "-",
  }));

  // 2. Buat Worksheet
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  // 3. Atur Lebar Kolom (Optional tapi sangat membantu user)
  const columnWidths = [
    { wch: 36 }, // ID
    { wch: 20 }, // Merchant
    { wch: 15 }, // Date
    { wch: 15 }, // Amount
    { wch: 15 }, // Category
    { wch: 20 }, // Created_At
  ];
  worksheet["!cols"] = columnWidths;

  // 4. Buat Workbook dan simpan
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pengeluaran");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

  saveAs(blob, `Laporan_Keuangan_${new Date().toISOString().split("T")[0]}.xlsx`);
}
