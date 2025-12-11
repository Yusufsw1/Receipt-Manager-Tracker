import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportReceiptsToPDF(receipts: any[]) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Receipts Report", 14, 20);

  const tableData = receipts.map((r) => [r.merchant_name, r.date, "Rp " + r.total_amount?.toLocaleString(), r.category]);

  autoTable(doc, {
    head: [["Merchant", "Date", "Amount", "Category"]],
    body: tableData,
    startY: 30,
  });

  doc.save("receipts.pdf");
}
