import { FaTimes } from "react-icons/fa";
import { toTitleCase } from "../../../utils/common";

function RemarksModal({
  onClose,
  handelChange,
  remarks = "",
  handleSubmit,
  heading,
  btn = "Submit",
}) {
  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
      <div className="relative bg-white shadow-lg p-6 rounded w-full max-w-md">
        <button
          className="top-2 right-2 absolute text-gray-600 hover:text-red-600"
          onClick={onClose}
        >
          <FaTimes size={18} />
        </button>
        <h3 className="mb-4 font-semibold text-lg">
          {heading ? toTitleCase(heading) : "Enter Remarks"}
        </h3>
        <textarea
          value={remarks}
          onChange={handelChange}
          rows={4}
          className="mb-4 p-2 border rounded w-full"
          placeholder="Enter your remarks here..."
        />
        <div className="flex justify-end space-x-2">
          <button
            className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
            onClick={handleSubmit}
          >
            {btn}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RemarksModal;
