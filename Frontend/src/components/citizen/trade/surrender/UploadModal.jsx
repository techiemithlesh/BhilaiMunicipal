import { useState } from "react";

export default function UploadModal({ doc, onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [selectedOption, setSelectedOption] = useState("");

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white shadow-lg p-6 rounded-xl w-[500px] max-w-[90%]">
        <div className="mb-5">
          <h2 className="mb-1 font-semibold text-gray-800 text-xl">
            Upload Receipt
          </h2>
          <p className="text-gray-500 text-sm">
            Please upload a PDF file and select the appropriate description.
          </p>
        </div>

        <div className="space-y-4">
          {/* Label + Select Dropdown */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              {doc?.label} <span className="text-red-500">(pdf only)*</span>
            </label>
            <select
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
            >
              <option value="">Select</option>
              {doc?.options?.map((option, idx) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* File Input */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Upload File
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="block hover:file:bg-blue-100 file:bg-blue-50 file:mr-4 file:px-4 file:py-2 file:border-0 file:rounded-md w-full file:font-semibold text-gray-700 file:text-blue-700 text-sm file:text-sm"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => onUpload(file, selectedOption)}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-5 py-2 rounded-md font-medium text-white text-sm disabled:cursor-not-allowed"
            disabled={!file || !selectedOption}
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}
