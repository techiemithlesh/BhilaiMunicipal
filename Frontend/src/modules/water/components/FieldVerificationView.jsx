import axios from "axios";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { waterAppFieldVerificationDtlApi } from "../../../api/endpoints";
import { modalVariants } from "../../../utils/motionVariable";



const FieldVerificationView = ({ id, onClose, token }) => {
  const [isFrozen, setIsFrozen] = useState(false);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (id && token) {
      const fetchData = async () => {
        setIsFrozen(true);
        try {
          const response = await axios.post(
            waterAppFieldVerificationDtlApi,
            { id },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (response?.data?.status) {
            setDetails(response.data.data || {});
          }
        } catch (error) {
          console.error("Error fetching verification data:", error);
        } finally {
          setIsFrozen(false);
        }
      };

      fetchData();
    }
  }, [id, token]);

  // console.log("details", details.appComp);

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalVariants}
        transition={{ duration: 0.4 }}
        className="flex flex-col bg-white shadow-lg p-6 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-blue-900 text-xl">
            Field Verification Details
          </h2>
          {onClose && (
            <button
              className="text-gray-600 hover:text-red-600"
              onClick={onClose}
            >
              <FaTimes size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        {isFrozen && <p className="text-gray-500">Loading...</p>}
        {!isFrozen && details && (
          <div className="space-y-6">
            {/* TC Details */}
            <div className="bg-gray-50 p-4 rounded-md shadow-sm">
              <h3 className="font-semibold mb-2">Verification Officer</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><span className="font-medium">Verified By:</span> {details.tcDtl?.verifiedBy}</p>
                <p><span className="font-medium">User:</span> {details.tcDtl?.userName}</p>
                <p><span className="font-medium">Date:</span> {details.tcDtl?.verificationDate}</p>
              </div>
            </div>

            {/* Application Details */}
            <div className="bg-gray-50 p-4 rounded-md shadow-sm">
              <h3 className="font-semibold mb-2">Application Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><span className="font-medium">Application No:</span> {details.appDtl?.applicationNo}</p>
                <p><span className="font-medium">Apply Date:</span> {details.appDtl?.applyDate}</p>
                <p><span className="font-medium">Application Type:</span> {details.appDtl?.applicationType}</p>
                <p><span className="font-medium">Property Type:</span> {details.appDtl?.propertyType}</p>
                <p><span className="font-medium">Ward No:</span> {details.appDtl?.wardNo}</p>
                <p><span className="font-medium">Ownership Type:</span> {details.appDtl?.ownershipType}</p>
              </div>
            </div>

            {/* Owner Details */}
            <div className="bg-gray-50 p-4 rounded-md shadow-sm">
              <h3 className="font-semibold mb-2">Owner Details</h3>
              {details.ownerDtl?.map((owner, idx) => (
                <div key={idx} className="border p-3 rounded-md mb-2">
                  <p><span className="font-medium">Name:</span> {owner.ownerName}</p>
                  <p><span className="font-medium">Mobile:</span> {owner.mobileNo}</p>
                  <p><span className="font-medium">Guardian:</span> {owner.guardianName || "-"}</p>
                  <p><span className="font-medium">DOB:</span> {owner.dob}</p>
                </div>
              ))}
            </div>

            {/* Comparison Table */}
            <div className="bg-white border rounded-md shadow-sm">
              <h3 className="font-semibold p-3 border-b">Field Verification Comparison</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Field</th>
                    <th className="p-2 text-left">Application Details</th>
                    <th className="p-2 text-left">Verification Details</th>
                    <th className="p-2 text-center">Check</th>
                  </tr>
                </thead>
                <tbody>
                  {details.appComp?.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2 font-medium">{item.key}</td>
                      <td className="p-2">{item.self || "-"}</td>
                      <td className="p-2">{item.verify || "-"}</td>
                      <td className="p-2 text-center">
                        {item.test ? (
                          <span className="text-green-600">✔️</span>
                        ) : 
                        (
                          item?.test==null ? (
                            <span className="text-red-600"></span>
                          )
                          :
                          (
                            <span className="text-red-600">❌</span>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default FieldVerificationView;
