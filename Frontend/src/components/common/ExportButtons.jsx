
import { exportPDF } from '../utils/exportPdf';
import { exportExcel } from '../utils/exportExcel';

const ExportButtons = ({ columns, data }) => {
  const handlePdfExport = () => {
    exportPDF(columns, data, 'My Data');
  };

  const handleExcelExport = () => {
    exportExcel(columns, data, 'My Data');
  };

  return (
    <div className="flex space-x-4">
      <button onClick={handlePdfExport} className="btn-custom">Export to PDF</button>
      <button onClick={handleExcelExport} className="btn-custom">Export to Excel</button>
    </div>
  );
};

export default ExportButtons;
