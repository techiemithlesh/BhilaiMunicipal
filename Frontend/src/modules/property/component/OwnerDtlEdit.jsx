import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import { propOwnerEditApi } from "../../../api/endpoints";
import toast from "react-hot-toast";
import { modalVariants } from "../../../utils/motionVariable";
import { FaTimes } from "react-icons/fa";
import InputCard from "./InputCard";

export default function OwnerDtlEdit({ propDetails, onClose, token }) {
  const [ownerDetails, setOwnerDetails] = useState([
    {
      ownerName: "",
      guardianName: "",
      relationType: "",
      mobileNo: "",
      aadharNo: "",
      email: "",
      panNo: "",
      document: "",
    },
  ]);

  useEffect(() => {
    if (propDetails) {
      if (Array.isArray(propDetails.owners) && propDetails.owners.length) {
        setOwnerDetails(
          propDetails.owners.map((ele) => ({
            ...ele,
            remarks: "",
            document: "",
            isArmedForce: 0,
            isSpeciallyAbled: 0,
          }))
        );
      }
    }
  }, [propDetails]);

  const handleChange = (name, value, index) => {
    setOwnerDetails((prev) =>
      prev.map((owner, i) =>
        i === index ? { ...owner, [name]: value } : owner
      )
    );
  };

  const handleOwnerDetailsSubmit = async (submittedId) => {
    const payload = ownerDetails.find((ele) => ele.id === submittedId);
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    try {
      const response = await axios.post(propOwnerEditApi, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response && response.data && response.data.status) {
        toast.success("Property details updated successfully!", { position: "top-right" });
        onClose && onClose();
      } else {
        if (response && response.data && response.data.errors) {
          const errorMessages = Object.values(response.data.errors)
            .flat()
            .join("\n");
          toast.error(errorMessages, { duration: 8000 });
        } else {
          toast.error("Failed to update property details.", {position: "top-right"});
        }
      }
      // Optionally show a toast or success message here
    } catch (error) {
      console.error("Error submitting owner details:", error);
      toast.error("An error occurred while updating property details.", {
        position: "top-right",
      });
    }
  };

  const fields = {
    ownerDetails: [
      { label: "Owner Name", type: "input", name: "ownerName" },
      { label: "Guardian Name", type: "input", name: "guardianName" },
      {
        label: "Relation",
        type: "select",
        name: "relationType",
        options: ["S/O", "D/O", "W/O", "C/O"],
      },
      { label: "Mobile", type: "input", name: "mobileNo" },
      { label: "Aadhaar No", type: "input", name: "aadharNo" },
      { label: "Email", type: "input", name: "email" },
      { label: "PAN No", type: "input", name: "panNo" },
      {label : "Remarks", type: "input", name: "remarks"},
      { label: "Supportive Document", type: "upload", name: "document" },
    ],
  };

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalVariants}
        transition={{ duration: 0.5 }}
        className="flex flex-col bg-white shadow-lg p-6 rounded-lg w-full max-w-6xl max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-blue-900 text-xl">
            Owner Detail Edit
          </h2>
          <button
            className="text-gray-600 hover:text-red-600"
            onClick={onClose}
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="flex flex-col border border-blue-900 rounded-t-xl overflow-y-auto p-6 space-y-6">
          <h1 className="bg-blue-900 px-4 py-1 rounded-t-xl font-semibold text-white text-lg">
            Owner Details
          </h1>
          {ownerDetails.length
            ? ownerDetails.map((ele, index) => (
                <div key={index}>
                  <InputCard
                    fields={fields.ownerDetails}
                    values={ele}
                    onChange={(name, value) => handleChange(name, value, index)}
                  />
                  <div className="flex justify-end mb-4 px-5">
                    <button
                      className="flex justify-center items-center bg-blue-600 hover:bg-blue-700 px-4 rounded-full h-7 font-semibold text-white"
                      onClick={() => handleOwnerDetailsSubmit(ele.id)}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              ))
            : null}
        </div>
      </motion.div>
    </div>
  );
}
