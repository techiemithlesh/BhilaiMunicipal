import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useState, useMemo } from "react";

const DataTableFullData = ({
  color,
  note,
  title,
  data = [],
  headers = [],
  renderRow,
  footerRow=null,
  footerData=[],
  summaryData=null,
  startingPage = 1,
  startingItemsPerPage = 5,
  showingItem = [10, 25, 50,-1],
  isExport=false,
}) => {
  // Component state for pagination
  const [currentPage, setCurrentPage] = useState(startingPage);
  const [itemsPerPage, setItemsPerPage] = useState(startingItemsPerPage);
  const [isExcelExporting, setIsExcelExporting] = useState(false);
  const [isPDFExporting, setIsPDFExporting] = useState(false);

  const totalDataCount = data.length;
  const totalPages = Math.ceil(totalDataCount / itemsPerPage);

  // Memoized calculations for performance
  const startIndex = useMemo(
    () => (currentPage - 1) * (itemsPerPage !=-1 ? itemsPerPage : totalDataCount ),
    [currentPage, itemsPerPage]
  );
  const endIndex = useMemo(
    () => startIndex + (itemsPerPage !=-1 ? itemsPerPage : totalDataCount ),
    [startIndex, itemsPerPage]
  );
  const paginatedData = useMemo(
    () => data.slice(startIndex, endIndex),
    [data, startIndex, endIndex]
  );

  // Memoized pagination buttons logic
  const pagesToDisplay = useMemo(() => {
    const pageNumbers = [];
    const maxButtons = 5;
    const halfButtons = Math.floor(maxButtons / 2);
    let startPage = Math.max(1, currentPage - halfButtons);
    let endPage = Math.min(totalPages, currentPage + halfButtons);

    if (currentPage < halfButtons + 1) {
      endPage = Math.min(totalPages, maxButtons);
    }
    if (currentPage > totalPages - halfButtons) {
      startPage = Math.max(1, totalPages - maxButtons + 1);
    }

    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) pageNumbers.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pageNumbers.push("...");
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  }, [currentPage, totalPages]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = Number(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };


  const exportToExcel = async () => {
      setIsExcelExporting(true);
      try {
        const allData = data;
  
        const worksheetData = [
          headers.map((h) => h.label),
          ...allData.map((item, idx) =>
            headers.map((h) => (h.key === "serial" ? idx + 1 : item[h.key] ?? ""))
          ),
        ];
  
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        // FIX: Check if footerData exists and has content
        if (footerData && footerData.length > 0) {
          // 1. Normalize footerData to be a 2D array (array of rows)
          const footerRows = Array.isArray(footerData[0]) ? footerData : [footerData];
          
          const startRow = worksheetData.length; 
          const merges = [];
          
          // Process each row in the footer (usually just one)
          footerRows.forEach((row, rowIndex) => {
            const footerRowValues = [];
            let currentCol = 0;

            row.forEach((cell) => {
              footerRowValues.push(cell.content ?? "");
              
              const span = cell.colSpan || 1; // Default to 1 if no colSpan provided

              if (span > 1) {
                merges.push({
                  s: { r: startRow + rowIndex, c: currentCol }, 
                  e: { r: startRow + rowIndex, c: currentCol + span - 1 }
                });
                // Fill empty slots for merged cells
                for (let i = 1; i < span; i++) {
                  footerRowValues.push("");
                }
              }
              currentCol += span; // Increment by the span amount
            });

            // Add this specific footer row to the sheet
            XLSX.utils.sheet_add_aoa(worksheet, [footerRowValues], { origin: -1 });
          });

          // Apply merges to the worksheet
          worksheet["!merges"] = merges;
        }
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        XLSX.writeFile(workbook, `${title.replace(/\s+/g, "_")}.xlsx`);
      } catch (error) {
        console.error("Excel export failed:", error);
      } finally {
        setIsExcelExporting(false);
      }
    };
  
  const exportToPDF = async () => {
    setIsPDFExporting(true);
    try {
      const allData = data;
      const doc = new jsPDF();
      doc.text(title, 14, 10);
      let finalFoot = undefined;
    
      if (footerData && footerData.length > 0) {
        // If footerData is [ {content...} ], wrap it to become [ [ {content...} ] ]
        // If it's already [ [ {content...} ] ], leave it as is.
        finalFoot = Array.isArray(footerData[0]) ? footerData : [footerData];
      }
      autoTable(doc, {
        startY: 20,
        head: [headers.map((h) => h.label)],
        body: allData.map((item, idx) =>
          headers.map((h) => (h.key === "serial" ? idx + 1 : item[h.key] ?? ""))
        ),
        foot: finalFoot,
        styles: { fontSize: 8 },
      });
      doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
    } finally {
      setIsPDFExporting(false);
    }
  };


  return (
    <div className="bg-white shadow border border-blue-800 rounded-lg">
      {/* CORRECTED: Title and Note are outside the scrollable container */}
      {title && (
        <div
          style={{ backgroundColor: color || "#1e3a8a" }}
          className={`px-4 py-2 rounded-t-md font-bold text-white`}
        >
          {title}
        </div>
      )}
      {note && (
        <div
          className="bg-blue-50 mb-4 p-3 border-blue-500 border-l-4 rounded text-gray-700 text-sm"
          dangerouslySetInnerHTML={{ __html: note }}
        />
      )}

      <div className="flex md:flex-row flex-col justify-between items-center mt-4 px-4">
        <div className="flex items-center gap-2 mb-2 md:mb-0">
          <label htmlFor="items-per-page" className="text-gray-700 text-sm">
            Show
          </label>
          <select
            id="items-per-page"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="px-2 py-1 border rounded-md text-sm"
          >
            {showingItem.map((num) => (
              <option key={num} value={num}>
                {num!=-1 ? num : "All"}
              </option>
            ))}
          </select>
        </div>
        {/* Right side: Export Buttons (UPDATED) */}
        {isExport &&(
          <div className="flex gap-3">
            <button
              onClick={exportToPDF}
              disabled={isPDFExporting}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-4 py-1 rounded-md text-sm transition duration-150 ease-in-out"
            >
              {isPDFExporting && (
                <span className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin"></span>
              )}
              Export to PDF
            </button>
            <button
              onClick={exportToExcel}
              disabled={isExcelExporting}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-4 py-1 rounded-md text-sm transition duration-150 ease-in-out"
            >
              {isExcelExporting && (
                <span className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin"></span>
              )}
              Export to Excel
            </button>
          </div>
        )}       

      </div>

      {summaryData &&(
        <div className="bg-gray-200 shadow-lg rounded-md mt-3 py-3 px-3 w-auto">
          {summaryData} 
        </div>
      )}

      {/* CRITICAL CORRECTION: The overflow-x-auto class is now on a separate div wrapping only the table */}
      <div className="mt-2 overflow-x-auto">
        <table className="border rounded min-w-full overflow-hidden text-sm text-left">
          <thead className="top-0 z-10 sticky bg-gray-100">
            <tr>
              {headers.map((header, i) => (
                <th key={i} className="top-0 sticky px-3 py-2 border">
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item, index) =>
                renderRow(item, startIndex + index)
              )
            ) : (
              <tr>
                <td
                  colSpan={headers.length}
                  className="p-4 text-gray-500 text-center"
                >
                  No Data found.
                </td>
              </tr>
            )}
          </tbody>
          {footerRow && (
            <tfoot className="sticky bottom-0">
              {footerRow}
            </tfoot>
          )}
        </table>
      </div>

      <hr />

      <div className="flex md:flex-row flex-col justify-between items-center p-4">
        <div className="flex items-center gap-2 mb-2 md:mb-0">
          <span className="ml-4 text-gray-700 text-sm">
            Showing {startIndex + 1} to {endIndex} of {totalDataCount} entries
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 px-3 py-1 border border-gray-300 rounded text-sm"
          >
            Previous
          </button>
          {pagesToDisplay.map((page, index) => {
            if (page === "...") {
              return (
                <span key={`ellipsis-${index}`} className="px-3 py-1 text-sm">
                  ...
                </span>
              );
            }
            return (
              <button
                key={`page-${page}`}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded text-sm ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 border border-gray-300"
                }`}
              >
                {page}
              </button>
            );
          })}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 px-3 py-1 border border-gray-300 rounded text-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTableFullData;
