import { FaTimes } from "react-icons/fa";
import { modalVariants } from "../../utils/motionVariable";
import { motion } from "framer-motion";
import { Select, SelectItem } from "@nextui-org/react";
import FileUpload from "./FileUpload";

const RenderSubDoc = ({
  doc,
  ownerName,
  docCode,
  docName,
  setDocName,
  document,
  setDocument,
  handleSubmit,
  setIsSubModal,
}) => {
  if (!doc) return null;

  const options =
    doc?.list?.map((item) => ({
      value: item.docName,
      label: item.docName,
    })) || [];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={modalVariants}
      className="flex flex-col bg-white shadow-lg p-6 rounded-lg w-full max-w-[800px] max-h-[80vh]"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-blue-900 text-xl">
          {docCode}
          {ownerName && (
            <span className="text-blue-300 text-sm"> ({ownerName})</span>
          )}
        </h2>

        <button onClick={() => setIsSubModal(false)}>
          <FaTimes size={20} className="text-gray-600 hover:text-red-600" />
        </button>
      </div>

      <Select
        label="Select Document"
        selectedKeys={docName ? [docName] : []}
        onSelectionChange={(keys) =>
          setDocName(Array.from(keys)[0] || "")
        }
        className="mb-4"
      >
        {options.map((opt) => (
          <SelectItem key={opt.value}>{opt.label}</SelectItem>
        ))}
      </Select>

      <FileUpload
        files={document}
        setFiles={setDocument}
        allowMultiple={false}
        acceptedFileTypes={
          docCode === "Applicant Image" || docCode === "Owner Image"
            ? ["image/png", "image/jpeg", "image/jpg", "image/bmp"]
            : ["application/pdf"]
        }
      />

      <div className="flex justify-end pt-4">
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          onClick={handleSubmit}
        >
          Upload
        </button>
      </div>
    </motion.div>
  );
};

export default RenderSubDoc;
