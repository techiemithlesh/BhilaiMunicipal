import { Spinner } from "@nextui-org/react";
import { modalVariants } from "../../utils/motionVariable";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FaTimes } from "react-icons/fa";
import { useEffect, useState } from "react";
import axios from "axios";

import RenderDocs from "./RenderDocs";
import RenderSubDoc from "./RenderSubDoc";

const DocUpload = ({
  id,
  onClose,
  fetchDataApi,
  docUploadApi,
  token,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [appDocList, setAppDocList] = useState([]);
  const [ownerDocList, setOwnerDocList] = useState([]);

  const [docCode, setDocCode] = useState("");
  const [docName, setDocName] = useState("");
  const [document, setDocument] = useState([]);

  const [selectedOwner, setSelectedOwner] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  const [isSubModal, setIsSubModal] = useState(false);

  // ✅ ESC key close
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        if (isSubModal) setIsSubModal(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isSubModal, onClose]);

  useEffect(() => {
    if (token && id) fetchData();
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!docCode) return toast.error("Document type is required.");
    if (!docName) return toast.error("Please select a document.");
    if (!document[0]?.file) return toast.error("Please select a file.");

    try {
      const form = new FormData();
      form.append("id", id);
      form.append("docCode", docCode);
      form.append("docName", docName);
      form.append("document", document[0].file);

      if (selectedOwner?.id) form.append("ownerId", selectedOwner.id);

      const response = await axios.post(docUploadApi, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response?.data?.status) {
        toast.success(response.data.message);

        setIsSubModal(false);
        setDocCode("");
        setDocName("");
        setSelectedOwner("");
        setDocument([]);

        fetchData();
      } else {
        toast.error(response?.data?.message || "Upload failed");
      }
    } catch {
      toast.error("Server error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex justify-center items-center bg-black/50 p-4"
      onClick={() => !isSubModal && onClose()}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={modalVariants}
          className={`flex flex-col bg-white shadow-lg p-6 rounded-lg w-full max-w-6xl max-h-[85vh] overflow-y-auto
            ${isSubModal ? "blur-sm pointer-events-none" : ""}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-blue-900 text-xl">
              Document Upload
            </h2>
            <button onClick={onClose}>
              <FaTimes size={20} className="text-gray-600 hover:text-red-600" />
            </button>
          </div>

          {ownerDocList.map((owner, idx) =>
            owner.docList?.length ? (
              <RenderDocs
                key={idx}
                list={owner.docList}
                title={`${owner.ownerName} Documents`}
                owner={owner}
                setSelectedOwner={setSelectedOwner}
                setDocCode={setDocCode}
                setSelectedDoc={setSelectedDoc}
                setIsSubModal={setIsSubModal}
              />
            ) : null
          )}

          <RenderDocs
            list={appDocList}
            title="App Documents"
            setSelectedOwner={setSelectedOwner}
            setDocCode={setDocCode}
            setSelectedDoc={setSelectedDoc}
            setIsSubModal={setIsSubModal}
          />
        </motion.div>
      )}

      {isSubModal && (
        <div
          className="fixed inset-0 z-[1000] flex justify-center items-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setIsSubModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <RenderSubDoc
              doc={selectedDoc}
              ownerName={selectedOwner?.ownerName}
              docCode={docCode}
              docName={docName}
              setDocName={setDocName}
              document={document}
              setDocument={setDocument}
              handleSubmit={handleSubmit}
              setIsSubModal={setIsSubModal}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DocUpload;
