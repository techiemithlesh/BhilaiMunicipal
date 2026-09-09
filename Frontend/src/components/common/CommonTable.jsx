import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function CommonTable({
  data = [],
  headers = [],
  renderRow,
  footerRow=null,  
  footerData=[],
  title = "List",
  actionButton,
  itemsPerPage = 10,
  totalPages = 1,
  currentPage = 1,
  totalItem = 1,
  fetchAllData = () => [],
  setPageNo = () => {},
  setItemsPerPage = () => {},
  isSearchInput = true,
  search = "",
  setSearch = () => {},
  onSearch = () => {},
  filterComponent = null,
  links = null,
}) {
  const [searchInput, setSearchInput] = useState(search);
  const [filteredData, setFilteredData] = useState(data);
  const [isExcelExporting, setIsExcelExporting] = useState(false);
  const [isPDFExporting, setIsPDFExporting] = useState(false);

  useEffect(() => {
    const keyword = searchInput.toLowerCase();
    const filtered = data.filter((item) =>
      Object.values(item).some(
        (value) =>
          typeof value === "string" && value.toLowerCase().includes(keyword)
      )
    );
    setFilteredData(filtered);
  }, [searchInput, data]);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setPageNo(page);
    }
  };

  const handleSearchClick = () => {
    setSearch(searchInput);
    setPageNo(1);
    onSearch(); // trigger server-side fetch
  };

  const renderPaginationButtons = () => {
    const pages = [];
    const visiblePages = 3;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > visiblePages) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - visiblePages + 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages.map((page, idx) =>
      page === "..." ? (
        <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-500">
          ...
        </span>
      ) : (
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`px-2 py-1 rounded ${
            currentPage === page ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          {page}
        </button>
      )
    );
  };

  const exportToExcel = async () => {
    setIsExcelExporting(true);
    try {
      const allData = fetchAllData ? await fetchAllData() : data;

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
      const allData = fetchAllData ? await fetchAllData() : data;
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
    <div className="bg-white shadow-md p-4 border rounded-xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-xl">{title}</h2>
        {actionButton}
      </div>

      {filterComponent && <div className="mb-4">{filterComponent}</div>}

      {/* Search & Export */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 bg-green-500 px-3 py-1 rounded text-white"
            onClick={exportToExcel}
            disabled={isExcelExporting}
          >
            {isExcelExporting && (
              <span className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin"></span>
            )}
            Excel
          </button>

          <button
            className="flex items-center gap-2 bg-red-500 px-3 py-1 rounded text-white"
            onClick={exportToPDF}
            disabled={isPDFExporting}
          >
            {isPDFExporting && (
              <span className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin"></span>
            )}
            PDF
          </button>
        </div>

        <div className="flex justify-end items-center gap-2 ml-auto w-full md:w-1/3">
          {isSearchInput && (
            <input
              type="text"
              placeholder="Search..."
              className="px-2 py-1 border rounded w-full"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          )}
          <button
            onClick={handleSearchClick}
            className="bg-blue-500 px-3 py-1 rounded text-white whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </div>

      {/* Items per page and pagination links */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4 text-sm gap-2 md:gap-0">
          
          {/* Left side — items per page */}
          <div className="flex items-center space-x-2 flex-wrap">
            <span>Show</span>
            <select
              className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={itemsPerPage === totalItem ? "-1" : itemsPerPage}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = value === "-1" ? totalItem : Number(value);
                setItemsPerPage(numValue);
                setPageNo(1);
              }}
            >
              {[10, 25, 50, 100, 500, 1000].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
              <option value="-1">All</option>
            </select>
            <span>items per page</span>
          </div>

          {/* Right side — pagination links */}
          {links && (
            <div
              className="flex justify-end items-center gap-2 ml-auto w-full md:w-auto 
                        overflow-x-auto md:overflow-visible whitespace-nowrap scrollbar-hide px-1"
            >
              {links}
            </div>
          )}
        </div>


      {/* Table */}
      <div className="relative max-h-[500px]  mt-4 border rounded overflow-x-auto overflow-y-auto scrollbar-hide">
        <table className="bg-white min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              {headers.map((header, i) => (
                <th key={i} className="px-3 py-2 bg-gray-100 border sticky top-0">
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item, index) =>
                renderRow(item, index, currentPage, itemsPerPage)
              )
            ) : (
              <tr>
                <td
                  colSpan={headers.length}
                  className="py-4 border text-gray-500 text-center"
                >
                  No records found.
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

      {/* Pagination */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4 text-sm gap-2 md:gap-0">
        
        {/* Left side: Page info */}
        <span className="text-gray-600 whitespace-nowrap">
          Page <span className="font-semibold">{currentPage}</span> of{" "}
          <span className="font-semibold">{totalPages}</span>
        </span>

        {/* Right side: Pagination controls */}
        <div
          className="flex items-center gap-1 overflow-x-auto md:overflow-visible whitespace-nowrap 
                    scrollbar-hide px-1 w-full md:w-auto max-w-full"
        >
          {/* Prev button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex-shrink-0 bg-gray-200 hover:bg-gray-300 
                      disabled:opacity-50 disabled:cursor-not-allowed 
                      px-3 py-1 rounded-md transition-colors duration-150"
          >
            Prev
          </button>

          {/* Dynamic pagination numbers */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {renderPaginationButtons()}
          </div>

          {/* Next button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex-shrink-0 bg-gray-200 hover:bg-gray-300 
                      disabled:opacity-50 disabled:cursor-not-allowed 
                      px-3 py-1 rounded-md transition-colors duration-150"
          >
            Next
          </button>
        </div>
      </div>


    </div>
  );
}
