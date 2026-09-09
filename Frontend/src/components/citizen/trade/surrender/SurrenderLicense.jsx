import { useNavigate } from "react-router-dom";
import TradeLicensePreview from "./TradeLicensePreview";
import {
  firmDetails,
  formData,
  natureOfBuisness,
  tableHeaders,
  tableRows,
} from "./data";

export default function SurrenderLicense() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-2 text-gray-700 text-lg">
      <TradeLicensePreview
        formData={formData}
        firmDetails={firmDetails}
        ownerHeaders={tableHeaders}
        ownerRows={tableRows}
      />

      <div className="flex flex-col gap-2 w-[-moz-available] text-gray-700 text-lg">
        <h2 className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-400 shadow-md p-3 rounded-md font-bold text-white text-lg uppercase tracking-wide">
          Nature of Business
        </h2>
        <div className="p-2 border border-slate-400 rounded-md leading-5">
          {natureOfBuisness}
        </div>
      </div>

      <div className="flex justify-center items-center">
        <button
          className="bg-blue-500 px-4 py-1 rounded-md text-white"
          onClick={() =>
            navigate("/citizen/trade/surrender-license/doc-upload")
          }
        >
          Submit Application
        </button>
      </div>
    </div>
  );
}
