import { useEffect, useState } from "react";
import axios from "axios";
import { Spinner } from "@nextui-org/react";
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import ImagePreview from "../../../components/common/ImagePreview";
import { FaFilePdf, FaTimes, FaUpload } from "react-icons/fa";
import FileUpload from "../../../components/common/FileUpload";
import Select from "react-select";
import toast from "react-hot-toast";

function DocUploadModal({
  id,
  onClose,
  fetchDataApi,
  docUploadApi,
  ulbId,
  token,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [appDocList, setAppDocList] = useState([]);
  const [ownerDocList, setOwnerDocList] = useState([]);
  const [docCode, setDocCode] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("");
  const [docName, setDocName] = useState("");
  const [document, setDocument] = useState([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isModalPreviewOpen, setIsModalPreviewOpen] = useState(false);
  const [previewImg, setPreviewImg] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isSubModal, setIsSubModal] = useState(false);

  useEffect(() => {
    if (token && id) fetchData();
  }, [id, token]);

  useEffect(() => {
    if (selectedDoc?.list?.length === 1) {
      setDocName(selectedDoc.list[0].docName);
    }
  }, [selectedDoc]);

  const fetchData = async () => {
    try {
      const response = await axios.post(
        fetchDataApi,
        { id, ulbId: ulbId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        setAppDocList(response.data.data?.appDoc || []);
        setOwnerDocList(response.data.data?.ownerDoc || []);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openPreviewModel = (link) => {
    setIsModalPreviewOpen(true);
    setPreviewImg(link);
  };

  const closePreviewModel = () => {
    setIsModalPreviewOpen(false);
    setPreviewImg("");
  };

  const handleSubmit = async () => {
    setIsFrozen(true);
    if (!docCode) {
      toast.error("Document type is required.");
      return;
    }
    if (!docName) {
      toast.error("Please Select a Document.");
      return;
    }
    if (!document[0]?.file) {
      toast.error("Please select a document file to upload.");
      return;
    }
    const file = document[0].file;
    const maxSizeInBytes = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSizeInBytes) {
      toast.error("File size must be less than 2MB.");
      setIsFrozen(false);
      return;
    }

    try {
      const form = new FormData();
      form.append("id", id);
      form.append("docCode", docCode);
      form.append("docName", docName);
      form.append("document", document[0]?.file);
      if (ulbId) form.append("ulbId", ulbId);
      if (selectedOwner?.id) form.append("ownerId", selectedOwner.id);

      const response = await axios.post(docUploadApi, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response?.data?.status) {
        setIsSubModal(false);
        setDocCode("");
        setDocName("");
        setSelectedOwner("");
        setDocument([]);
        toast.success(response?.data?.message);
        fetchData();
      } else {
        // Show validation error if present
        if (response?.data?.errors && response.data.errors.document) {
          toast.error(response.data.errors.document.join(", "));
        } else {
          toast.error(response?.data?.message || "Upload failed");
        }
      }
    } catch (error) {
      toast.error("Server error");
    } finally {
      setIsFrozen(false);
    }
  };

  const renderDocs = (list, title, type, owner = {}) => (
    <div className="mb-4">
      {title && (
        <h3 className="mb-2 font-bold text-blue-800 text-lg">{title}</h3>
      )}
      <table className="mb-6 border rounded min-w-full overflow-hidden text-sm">
        <thead className="top-0 z-10 sticky bg-blue-800 text-white">
          <tr>
            <th className="p-2 border">#</th>
            <th className="p-2 border">Document Type</th>
            <th className="p-2 border">Options</th>
            <th className="p-2 border">File</th>
            <th className="p-2 border">Document Name</th>
            <th className="p-2 border text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {list?.length > 0 ? (
            list.map((item, index) => (
              <tr
                key={`${type}-${index}`}
                className="even:bg-gray-50 odd:bg-white border-t"
              >
                <td className="p-2 border text-center">{index + 1}</td>
                <td className="p-2 border">
                  {item.docName || item.docCode}{" "}
                  {item?.isMadetory && <span className="text-red-600">*</span>}
                </td>
                <td className="p-2 border text-center">{item.docListNames}</td>
                <td className="p-2 border text-center">
                  {item.uploadedDoc ? (
                    item.uploadedDoc.toLowerCase().endsWith(".pdf") ? (
                      <FaFilePdf
                        size={40}
                        className="mx-auto text-red-600 cursor-pointer"
                        onClick={() => openPreviewModel(item.uploadedDoc)}
                        title="Click to view PDF"
                      />
                    ) : (
                      <img
                        src={item.uploadedDoc}
                        alt="document"
                        onClick={() => openPreviewModel(item.uploadedDoc)}
                        className="mx-auto border border-gray-300 rounded-full w-10 h-10 object-cover cursor-pointer"
                      />
                    )
                  ) : (
                    <span className="text-gray-400">No file</span>
                  )}
                </td>
                <td className="p-2 border text-center">
                  <span
                    className={`px-2 py-1 text-xs rounded font-medium ${
                      item.verifiedStatus === 1
                        ? "bg-green-100 text-green-700"
                        : item.verifiedStatus === 2
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {item.uploadedDocName}
                  </span>
                </td>
                <td className="p-2 border text-center">
                  <button
                    className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-white"
                    onClick={() => {
                      setSelectedOwner(owner);
                      setDocCode(item.docCode);
                      setSelectedDoc(item);
                      setIsSubModal(true);
                    }}
                  >
                    <FaUpload />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="p-4 text-gray-500 text-center">
                No documents found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderSubDocList = (doc, ownerName, accept = "") => {
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
        exit="hidden"
        variants={modalVariants}
        transition={{ duration: 0.5 }}
        className="flex flex-col bg-white shadow-lg p-6 rounded-lg w-full max-w-md max-h-[80vh]"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-blue-900 text-xl">
            {docCode}{" "}
            <span className="text-blue-300 text-sm">
              {ownerName ? `( ${ownerName} )` : ""}
            </span>
          </h2>
          <button
            className="text-gray-600 hover:text-red-600"
            onClick={() => setIsSubModal(false)}
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="relative flex-grow overflow-y-auto">
          <div
            className={`${
              isFrozen ? "pointer-events-none filter blur-sm" : ""
            }`}
          >
            <Select
              name="docName"
              value={options.find((opt) => opt.value === docName)}
              onChange={(selected) => setDocName(selected?.value || "")}
              options={options}
              placeholder="Select Document"
              isClearable
              menuPosition="fixed"
            />
            <FileUpload
              className="pt-1"
              name="document"
              files={document}
              setFiles={setDocument}
              allowMultiple={false}
              acceptedFileTypes={
                accept
                  ? accept.split(",")
                  : [
                      "image/png",
                      "image/jpeg",
                      "image/jpg",
                      "image/bmp",
                      "application/pdf",
                    ]
              }
            />
            <div className="flex justify-end pt-4">
              <button
                className={`bg-blue-600 text-white px-6 py-2 rounded-md ${
                  isLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-700 transition"
                }`}
                onClick={handleSubmit}
                disabled={isLoading}
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };
  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4">
      {isLoading ? (
        <Spinner />
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={modalVariants}
          transition={{ duration: 0.5 }}
          className="flex flex-col bg-white shadow-lg p-6 rounded-lg w-full max-w-6xl max-h-[80vh]"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-blue-900 text-xl">
              Document Upload
            </h2>
            <button
              className="text-gray-600 hover:text-red-600"
              onClick={onClose}
            >
              <FaTimes size={20} />
            </button>
          </div>

          <div className="relative flex-grow overflow-y-auto">
            <div
              className={`${
                isFrozen ? "pointer-events-none filter blur-sm" : ""
              }`}
            >
              {ownerDocList.map((owner, idx) =>
                owner.docList?.length > 0 ? (
                  <div key={`owner-${idx}`}>
                    {renderDocs(
                      owner.docList,
                      `${owner.ownerName} Documents`,
                      `owner-${idx}`,
                      owner
                    )}
                  </div>
                ) : null
              )}
              {renderDocs(appDocList, "App Documents", "app")}
            </div>

            {isModalPreviewOpen && (
              <ImagePreview
                imageSrc={previewImg}
                closePreview={closePreviewModel}
              />
            )}

            {isSubModal && (
              <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4">
                {renderSubDocList(
                  selectedDoc,
                  selectedOwner?.ownerName,
                  selectedDoc?.accepts
                )}
              </div>
            )}

            {isFrozen && (
              <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/60 backdrop-blur-sm">
                <div className="font-semibold text-gray-800 text-lg">
                  Processing...
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default DocUploadModal;
