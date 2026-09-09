import { useEffect, useState } from "react";
import axios from "axios";
import { Spinner } from "@nextui-org/react";
import { motion } from "framer-motion";
import { FaFilePdf, FaTimes } from "react-icons/fa";
import { getToken } from "../../utils/auth";
import { modalVariants } from "../../utils/motionVariable";

function DocViewModal({ id, onClose, fetchDataApi, token }) {
  const [isLoading, setIsLoading] = useState(true);
  const [appDocList, setAppDocList] = useState([]);
  const [ownerDocList, setOwnerDocList] = useState([]);
  const [isModalPreviewOpen, setIsModalPreviewOpen] = useState(false);
  const [previewImg, setPreviewImg] = useState("");

  useEffect(() => {
    if (token && id) fetchData();
    // eslint-disable-next-line
  }, [id, token]);

  const fetchData = async () => {
    try {
      const response = await axios.post(
        fetchDataApi,
        { id },
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

  const renderDocs = (list, title, owner = {}) => (
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
            <th className="p-2 border text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {list?.length > 0 ? (
            list.map((item, index) => (
              <tr
                key={`doc-${index}`}
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
                  {item.verifiedStatus === 1
                    ? "Verified"
                    : item.verifiedStatus === 2
                    ? "Rejected"
                    : "Pending"}
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
              Document View
            </h2>
            <button
              className="text-gray-600 hover:text-red-600"
              onClick={onClose}
            >
              <FaTimes size={20} />
            </button>
          </div>

          <div className="relative flex-grow overflow-y-auto">
            {ownerDocList.map((owner, idx) =>
              owner.docList?.length > 0 ? (
                <div key={`owner-${idx}`}>
                  {renderDocs(
                    owner.docList,
                    `${owner.ownerName} Documents`,
                    owner
                  )}
                </div>
              ) : null
            )}
            {renderDocs(appDocList, "App Documents")}
            {isModalPreviewOpen && (
              <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={modalVariants}
                  transition={{ duration: 0.5 }}
                  className="bg-white shadow-lg p-6 rounded-lg w-full max-w-2xl"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-blue-900 text-lg">
                      Document Preview
                    </h3>
                    <button
                      className="text-gray-600 hover:text-red-600"
                      onClick={closePreviewModel}
                    >
                      <FaTimes size={20} />
                    </button>
                  </div>
                  <div className="flex justify-center items-center">
                    {previewImg.toLowerCase().endsWith(".pdf") ? (
                      (() => {
                        window.open(previewImg, "_blank");
                        closePreviewModel();
                        return null;
                      })()
                    ) : (
                      <img
                        src={previewImg}
                        alt="Preview"
                        className="border rounded max-w-full max-h-96"
                      />
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default DocViewModal;
