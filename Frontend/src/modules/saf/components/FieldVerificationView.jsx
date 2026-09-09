import React, { useEffect, useRef, useState } from "react";
import { getToken } from "../../../utils/auth";
import axios from "axios";
import { verificationDtlApi } from "../../../api/endpoints";
import { modalVariants } from "../../../utils/motionVariable";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import ImagePreview from "../../../components/common/ImagePreview";
import defaultAvatar from "../../../assets/images/default-avatar.jpg";
import html2canvas from "html2canvas";
import {
  formatLocalDate,
  formatLocalDateTime,
  toTitleCase,
} from "../../../utils/common";

function FieldVerificationView({ id, onClose }) {
  const [verificationData, setVerificationData] = useState({});
  const [isFrozen, setIsFrozen] = useState(false);
  const [isModalPreviewOpen, setIsModalPreviewOpen] = useState(false);
  const [previewImg, setPreviewImg] = useState("");
  const token = getToken();
  const printRef = useRef();

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const fetchData = async () => {
    setIsFrozen(true);
    try {
      const response = await axios.post(
        verificationDtlApi,
        { id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        setVerificationData(response?.data?.data);
      }
    } catch (error) {
      console.error("error in fetching data:", error);
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

  const handlePrint = async () => {
    if (!printRef.current) return;

    // Generate canvas from the printRef
    const canvas = await html2canvas(printRef.current, {
      scale: 2, // Better resolution
      useCORS: true, // If you have external images
      logging: false,
    });

    const dataUrl = canvas.toDataURL("image/png");
    // Create a new window with the canvas image
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            @medial{
              @page {
                size: A4;               
                margin: 10mm 15mm;      
                padding: 0;             
              }
              .print-container > * {
                margin-bottom: 6mm;
              }

            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
        </body>
      </html>
    `);
    printWindow.document.close();

    // Wait for image to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  return (
    <div className="z-50 print:static fixed inset-0 flex justify-center items-center bg-black print:bg-transparent bg-opacity-50 p-4 print:p-0">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalVariants}
        transition={{ duration: 0.5 }}
        className="flex flex-col bg-white shadow-lg p-6 rounded-lg w-full max-w-6xl max-h-[80vh]"
      >
        <div className="flex flex-shrink-0 justify-between items-center mb-4 pb-4 border-b-2">
          <h2 className="font-bold text-lg">
            Tax Collector Verification Details
          </h2>
          <button
            onClick={handlePrint}
            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white text-sm"
          >
            Print
          </button>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="relative flex-grow pr-2 overflow-y-auto">
          <div
            className={`${
              isFrozen ? "pointer-events-none filter blur-sm" : ""
            } w-full space-y-4`}
          >
            <div className="overflow-x-auto" ref={printRef}>
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="font-bold text-xs">
                    Tax Collector Verification Details
                  </h2>
                  <p>
                    <strong>Name of Tax Collector:</strong>{" "}
                    {verificationData?.tcDtl?.userName || "-"} (
                    {verificationData?.tcDtl?.verifiedBy || "-"})
                  </p>
                  <p>
                    <strong>Date of Verification:</strong>{" "}
                    {formatLocalDateTime(
                      verificationData?.tcDtl?.verificationDate
                    ) || "-"}
                  </p>
                </div>
              </div>

              {/* Basic Details */}
              <div className="bg-white shadow mb-4 p-3 border rounded">
                <h3 className="mb-2 font-semibold text-gray-700">
                  Basic Details
                </h3>
                <div className="gap-2 grid grid-cols-1 sm:grid-cols-2">
                  <div>
                    <strong>SAF No:</strong>{" "}
                    {verificationData?.safDtl?.safNo || "-"}
                  </div>
                  <div>
                    <strong>Applied Date:</strong>{" "}
                    {formatLocalDate(verificationData?.safDtl?.applyDate) ||
                      "-"}
                  </div>
                  <div>
                    <strong>Application Type:</strong>{" "}
                    {verificationData?.safDtl?.assessmentType || "-"}
                  </div>
                  <div>
                    <strong>Property Transfer(%):</strong>{" "}
                    {verificationData?.safDtl?.propertyTransfer || "-"}
                  </div>
                  <div>
                    <strong>Ward No:</strong>{" "}
                    {verificationData?.safDtl?.wardNo || "-"}
                  </div>
                  <div>
                    <strong>Ownership Type:</strong>{" "}
                    {verificationData?.safDtl?.ownershipType || "-"}
                  </div>
                  <div>
                    <strong>Holding No:</strong>{" "}
                    {verificationData?.safDtl?.holdingNo || "-"}
                  </div>
                </div>
                <div className="mt-2 p-2 border rounded">
                  <h4 className="font-semibold">Owner(s)</h4>
                  <table className="mt-2 w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 border">Name</th>
                        <th className="px-2 border">Guardian</th>
                        <th className="px-2 border">Relation</th>
                        <th className="px-2 border">Mobile No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verificationData?.ownerDtl?.map((owner, idx) => (
                        <tr key={idx}>
                          <td className="px-2 border">
                            {owner?.ownerName || "-"}
                          </td>
                          <td className="px-2 border">
                            {owner?.guardianName || "-"}
                          </td>
                          <td className="px-2 border">
                            {owner?.relationType || "-"}
                          </td>
                          <td className="px-2 border">
                            {owner?.mobileNo || "-"}
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan="4" className="px-2 border text-center">
                            No data
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Verified Details */}
              <div className="bg-white shadow mb-4 p-3 border rounded">
                <h3 className="mb-2 font-semibold text-gray-700">
                  Verified Details
                </h3>
                <table className="w-full text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 border">#</th>
                      <th className="px-2 border">Particular</th>
                      <th className="px-2 border">Self-Assessed</th>
                      <th className="px-2 border">Check</th>
                      <th className="px-2 border">Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationData?.safComp?.map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-2 border text-center">{idx + 1}</td>
                        <td className="px-2 border">{row?.key || "-"}</td>
                        <td className="px-2 border">{row?.self || "-"}</td>
                        <td className="px-2 border text-center">
                          {row?.test ? "✅" : "❌"}
                        </td>
                        <td className="px-2 border">{row?.verify || "-"}</td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan="5" className="px-2 border text-center">
                          No data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Floor Verified Details */}
              <div className="bg-white shadow mb-4 p-3 border rounded">
                <h3 className="mb-2 font-semibold text-gray-700">
                  Floor Verified Details
                </h3>
                <table className="w-full text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 border">Type</th>
                      <th className="px-2 border">Floor No</th>
                      <th className="px-2 border">Usage</th>
                      <th className="px-2 border">Occupancy</th>
                      <th className="px-2 border">Construction</th>
                      <th className="px-2 border">Built Up Area</th>
                      <th className="px-2 border">Carpet Area</th>
                      <th className="px-2 border">Date From</th>
                      <th className="px-2 border">Date Upto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationData?.floorCom?.map((row, idx) => (
                      <React.Fragment key={idx}>
                        <tr key={`self_${idx}`}>
                          <td className="px-2 border">Self Assessed</td>
                          <td className="px-2 border" rowSpan="3">
                            {row?.floorName || "-"}
                          </td>
                          <td className="px-2 border">
                            {row?.usageType?.self || "-"}
                          </td>
                          <td className="px-2 border">
                            {row?.occupancyName?.self || "-"}
                          </td>
                          <td className="px-2 border">
                            {row?.constructionType?.self || "-"}
                          </td>
                          <td className="px-2 border">
                            {row?.builtupArea?.self || "-"}
                          </td>
                          <td className="px-2 border">
                            {row?.carpetArea?.self || "-"}
                          </td>
                          <td className="px-2 border">
                            {formatLocalDate(row?.dateFrom?.self) || "-"}
                          </td>
                          <td className="px-2 border">
                            {formatLocalDate(row?.dateUpto?.self) || "-"}
                          </td>
                        </tr>
                        <tr key={`check_${idx}`}>
                          <td className="px-2 border">Check</td>
                          <td className="px-2 border">
                            {row?.usageType?.test ? "✅" : "❌"}
                          </td>
                          <td className="px-2 border">
                            {row?.occupancyName?.test ? "✅" : "❌"}
                          </td>
                          <td className="px-2 border">
                            {row?.constructionType?.test ? "✅" : "❌"}
                          </td>
                          <td className="px-2 border">
                            {row?.builtupArea?.test ? "✅" : "❌"}
                          </td>
                          <td className="px-2 border">
                            {row?.carpetArea?.test ? "✅" : "❌"}
                          </td>
                          <td className="px-2 border">
                            {row?.dateFrom?.test ? "✅" : "❌"}
                          </td>
                          <td className="px-2 border">
                            {row?.dateUpto?.test ? "✅" : "❌"}
                          </td>
                        </tr>
                        <tr key={`verify_${idx}`}>
                          <td className="px-2 border">Verification</td>
                          <td className="px-2 border">
                            {row?.usageType?.verify || "-"}
                          </td>
                          <td className="px-2 border">
                            {row?.occupancyName?.verify || "-"}
                          </td>
                          <td className="px-2 border">
                            {row?.constructionType?.verify || "-"}
                          </td>
                          <td className="px-2 border">
                            {row?.builtupArea?.verify || "-"}
                          </td>
                          <td className="px-2 border">
                            {row?.carpetArea?.verify || "-"}
                          </td>
                          <td className="px-2 border">
                            {formatLocalDate(row?.dateFrom?.verify) || "-"}
                          </td>
                          <td className="px-2 border">
                            {formatLocalDate(row?.dateUpto?.verify) || "-"}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Extra Floor Added */}
              {verificationData?.extraFloor?.length>0&&(
                <div className="bg-red-300 shadow mb-4 p-3 border rounded">
                  <h3 className="mb-2 font-semibold text-gray-700">
                    Extra Floor Add
                  </h3>
                  <table className="w-full text-xs">
                    <thead className="bg-red-200">
                      <tr>
                        <th className="px-2 border">#</th>
                        <th className="px-2 border">Floor No</th>
                        <th className="px-2 border">Usage</th>
                        <th className="px-2 border">Occupancy</th>
                        <th className="px-2 border">Construction</th>
                        <th className="px-2 border">Built Up Area</th>
                        <th className="px-2 border">Carpet Area</th>
                        <th className="px-2 border">Date From</th>
                        <th className="px-2 border">Date Upto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verificationData?.extraFloor?.map((row, idx) => (
                        <React.Fragment key={idx}>                        
                          <tr key={`verify_${idx}`}>
                            <td className="px-2 border">{idx+1}</td>
                            <td className="px-2 border">
                              {row?.floorName || "-"}
                            </td>
                            <td className="px-2 border">
                              {row?.usageType || "-"}
                            </td>
                            <td className="px-2 border">
                              {row?.occupancyName || "-"}
                            </td>
                            <td className="px-2 border">
                              {row?.constructionType || "-"}
                            </td>
                            <td className="px-2 border">
                              {row?.builtupArea || "-"}
                            </td>
                            <td className="px-2 border">
                              {row?.carpetArea || "-"}
                            </td>
                            <td className="px-2 border">
                              {formatLocalDate(row?.dateFrom) || "-"}
                            </td>
                            <td className="px-2 border">
                              {formatLocalDate(row?.dateUpto) || "-"}
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Geo Tagging */}
              {verificationData?.tcDtl?.verifiedBy !='ULB TC'&& (
                <div className="bg-white shadow p-3 border rounded">
                  <h3 className="mb-2 font-semibold text-gray-700">
                    Geo Tagging
                  </h3>
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 border">Location</th>
                        <th className="px-2 border">Image</th>
                        <th className="px-2 border">Latitude</th>
                        <th className="px-2 border">Longitude</th>
                        <th className="px-2 border">View on Map</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verificationData?.getGeoTag?.map((tag, idx) => (
                        <tr key={idx}>
                          <td className="px-2 border">
                            {toTitleCase(tag?.directionType) || "-"}
                          </td>
                          <td className="px-2 border">
                            {tag?.imagePath ? (
                              <img
                                src={tag?.imagePath}
                                alt={tag?.directionType}
                                onClick={() =>
                                  openPreviewModel(
                                    tag?.imagePath || defaultAvatar
                                  )
                                }
                                className="w-12 h-12 object-cover cursor-pointer"
                              />
                            ) : (
                              <div className="flex justify-center items-center bg-gray-200 w-12 h-12">
                                N/A
                              </div>
                            )}
                          </td>
                          <td className="px-2 border">{tag?.latitude || "-"}</td>
                          <td className="px-2 border">{tag?.longitude || "-"}</td>
                          <td className="px-2 border">
                            <a
                              href={`https://maps.google.com/?q=${tag?.latitude},${tag?.longitude}`}
                              rel="noopener noreferrer"
                              className="inline-block bg-red-600 px-2 py-1 rounded text-white text-xs"
                            >
                              Google Map
                            </a>
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan="6" className="px-2 border text-center">
                            No geo tag data
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
              ) }

            </div>
          </div>
        </div>
        {isModalPreviewOpen && (
          <ImagePreview
            imageSrc={previewImg}
            closePreview={closePreviewModel}
          />
        )}
      </motion.div>
    </div>
  );
}

export default FieldVerificationView;
