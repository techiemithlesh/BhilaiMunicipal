// utils/exportUtils.js
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Exports multiple sheets to Excel file.
 * @param {string} filename - File name without extension
 * @param {Array} sheets - Array of sheets: { title, columns, data }
 */
export const exportToExcel = (filename, sheets = []) => {
  const wb = XLSX.utils.book_new();

  sheets.forEach(({ title, columns, data }) => {
    const headers = columns.map(col => col.label);
    const rows = data.map(row => columns.map(col => row[col.key]));
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const safeTitle = title.replace(/[:\\/?*\[\]]/g, " ");
    XLSX.utils.book_append_sheet(wb, ws, safeTitle);
  });

  XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * Exports a DOM element to PDF using jsPDF + html2canvas
 * @param {React.RefObject} ref - A React ref to the DOM element
 * @param {string} filename - Output file name
 */
export const exportToPdf = async (ref, filename = "download") => {
  if (!ref?.current) return;

  try {
    const canvas = await html2canvas(ref.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error("PDF export error:", error);
  }
};
