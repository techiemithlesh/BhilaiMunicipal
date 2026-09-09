import { useEffect, useState } from "react";
import { getToken } from "../../../utils/auth";
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { FaFilePdf, FaTimes } from "react-icons/fa";
import ImagePreview from "../../../components/common/ImagePreview";
import axios from "axios";
import { waterAppUploadedDocListApi } from "../../../api/endpoints";
import { formatLocalDateTime } from "../../../utils/common";

function DocViewModal({ id, onClose, token }) {
  const [docList, setDocList] = useState([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isModalPreviewOpen, setIsModalPreviewOpen] = useState(false);
  const [previewImg, setPreviewImg] = useState("");

  useEffect(() => {
    if (token && id) fetchData();
  }, [id, token]);

  const fetchData = async () => {
    setIsFrozen(true);
    try {
      const response = await axios.post(
        waterAppUploadedDocListApi,
        { id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response?.data?.status) {
        setDocList(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setIsFrozen(false);
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

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalVariants}
        transition={{ duration: 0.5 }}
        className="flex flex-col bg-white shadow-lg p-6 rounded-lg w-full max-w-6xl max-h-[80vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-blue-900 text-xl">Document View</h2>
          <button
            className="text-gray-600 hover:text-red-600"
            onClick={onClose}
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Table Content */}
        <div className="relative flex-grow overflow-y-auto">
          <div
            className={`${
              isFrozen ? "pointer-events-none filter blur-sm" : ""
            }`}
          >
            <table className="border rounded min-w-full overflow-hidden text-sm text-left">
              <thead className="top-0 z-10 sticky bg-blue-800 text-white">
                <tr>
                  <th className="p-2 border">#</th>
                  <th className="p-2 border">Document Name</th>
                  <th className="p-2 border">File</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border text-center">Remark</th>
                </tr>
              </thead>
              <tbody>
                {docList.length > 0 ? (
                  docList.map((item, index) => (
                    <tr
                      key={index}
                      className="even:bg-gray-50 odd:bg-white border-t"
                    >
                      <td className="p-2 border text-center">{index + 1}</td>
                      <td className="p-2 border">
                        {item.docName}
                        {item?.ownerName ? (
                          <>
                            <span className="text-green-300">
                              ({item?.ownerName})
                            </span>
                          </>
                        ) : (
                          ""
                        )}
                      </td>
                      <td className="p-2 border text-center">
                        {item.docPath ? (
                          <>
                            {item.docPath.toLowerCase().endsWith(".pdf") ? (
                              <FaFilePdf
                                size={40}
                                className="mx-auto text-red-600 cursor-pointer"
                                onClick={() => openPreviewModel(item?.docPath)}
                                title="Click to view PDF"
                              />
                            ) : (
                              <img
                                src={item?.docPath}
                                alt="userImage"
                                onClick={() => openPreviewModel(item?.docPath)}
                                className="inline-block ml-2 border border-gray-300 rounded-full w-10 h-10 object-cover cursor-pointer"
                              />
                            )}
                            <div className="text-blue-400 text-sm text-start">
                              {item?.uploadedBy} :-{" "}
                              {formatLocalDateTime(item?.createdAt)}
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-400">No file</span>
                        )}
                      </td>
                      <td className="p-2 border text-center">
                        <span
                          className={`px-2 py-1 text-xs rounded font-medium ${
                            item.verifiedStatus == 1
                              ? "bg-green-100 text-green-700"
                              : item.verifiedStatus == 2
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item.verifiedStatus == 1
                            ? "Verified"
                            : item.verifiedStatus == 2
                            ? "Rejected"
                            : "Pending"}
                        </span>
                      </td>
                      <td className="space-x-2 p-2 border text-center">
                        {item?.remarks}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-4 text-gray-500 text-center">
                      No documents found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {isModalPreviewOpen && (
            <ImagePreview
              imageSrc={previewImg}
              closePreview={closePreviewModel}
            />
          )}

          {/* Frozen Overlay */}
          {isFrozen && (
            <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/60 backdrop-blur-sm">
              <div className="font-semibold text-gray-800 text-lg">
                Processing...
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default DocViewModal;
