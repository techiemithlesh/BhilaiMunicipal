import { useState } from "react";
import { FaChevronDown, FaChevronUp, FaFilePdf } from "react-icons/fa";
import { formatTimeAMPM, getShortRole } from "../../utils/common";
import ImagePreview from "./ImagePreview";

const RemarksAccordion = ({ color, title = "Level Remarks", remarks = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewImg, setPreviewImg] = useState("");
  const [isModalPreviewOpen, setIsModalPreviewOpen] = useState(false);
  const openPreviewModel = (link) => {
      setIsModalPreviewOpen(true);
      setPreviewImg(link);
  };

  const closePreviewModel = () => {
      setIsModalPreviewOpen(false);
      setPreviewImg("");
  };

  const actionStyleMap = {
    forward: "text-green-600",
    backward: "text-yellow-600",
    "back to citizen": "text-red-600",
  };

  const toTitleCase = (str) =>
    str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );

  return (
    <div className="bg-white shadow border border-blue-800 rounded-lg">
      {/* Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex justify-between items-center px-4 py-3 text-white cursor-pointer ${
          isOpen ? "rounded-t-lg" : "rounded-lg"
        }`}
        style={{ backgroundColor: color || "#1e3a8a" }} // fallback to Tailwind's bg-blue-900
      >
        <h3 className="font-semibold text-base">{title}</h3>
        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
      </div>

      {/* Body - Vertical Timeline */}
      {isOpen && (
        <div className="relative bg-gray-100 px-4 py-6 rounded-b-lg">
          <div className="ml-5 border-blue-800 border-l-2">
            {remarks.length > 0 ? (
              remarks.map((remark, idx) => (
                <div key={idx} className="relative mb-6 ml-6">
                  {/* Circle indicator */}
                  <div
                    className="top-1 left-[-18px] absolute flex justify-center items-center bg-blue-800 shadow rounded-full w-10 h-10 font-bold text-white text-xs"
                    title={remark.roleCode || "NA"}
                  >
                    {getShortRole(remark.roleCode)}
                  </div>

                  {/* Remark Box */}
                  <div className="bg-white shadow-md p-4 pl-12 rounded-lg">
                    <p className="mb-1 text-gray-800 text-sm">
                      {remark.message}
                    </p>

                    <div className="flex items-center gap-2 text-gray-600 text-xs">
                      <p>
                        {remark.receivingDate &&(
                          <span>
                            {remark.receivingDate ? formatTimeAMPM(remark.receivingDate):"-"} • {remark.receivingDate ? new Date(remark?.receivingDate).toLocaleDateString() : "-"} <span className="text-blue-400">(Receiving)</span>
                          </span>
                        )}
                      </p>
                      <span>
                        {remark.time} • {remark.date}
                      </span>
                      {remark?.action &&
                        (() => {
                          const action = remark.action.toLowerCase();
                          const color =
                            actionStyleMap[action] || "text-gray-600";
                          return (
                            <span className={`${color}`}>
                              ({toTitleCase(remark.action)})
                            </span>
                          );
                        })()}
                    </div>

                    {remark.userName && (
                      <div className="mt-1 font-semibold text-gray-900 text-sm">
                        {remark.userName}
                      </div>
                    )}
                    {remark?.docPath &&(
                        remark.docPath.toLowerCase().endsWith(".pdf") ? (
                              <FaFilePdf
                                  size={40}
                                  className="mx-auto text-red-600 cursor-pointer"
                                  onClick={() => openPreviewModel(remark.docPath)}
                                  title="Click to view PDF"
                              />
                          ) : (
                              <img
                                  src={remark.docPath}
                                  alt="document image"
                                  onClick={() => openPreviewModel(remark.docPath)}
                                  className="inline-block ml-2 border border-gray-300 rounded-full w-10 h-10 object-cover cursor-pointer"
                              />
                          )
                      )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center">
                No remarks available
              </p>
            )}
          </div>
        </div>
      )}
      {isModalPreviewOpen && (
          <ImagePreview imageSrc={previewImg} closePreview={closePreviewModel} />
      )}
    </div>
  );
};

export default RemarksAccordion;
