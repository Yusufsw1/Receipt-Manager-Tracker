import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function exportReceiptsToExcel(receipts: any[]) {
  // Format data untuk Excel
  const worksheetData = receipts.map((r) => ({
    ID: r.id,
    Merchant: r.merchant_name,
    Date: r.date,
    Amount: r.total_amount,
    Category: r.category,
    Created_At: r.created_at,
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Receipts");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

  saveAs(blob, "receipts.xlsx");
}
