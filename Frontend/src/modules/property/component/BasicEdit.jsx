import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { FaTimes } from "react-icons/fa";
import InputCard from "./InputCard";
import { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { fetchWardList } from "../../../store/slices/wardSlice";
import { propBasicEditApi } from "../../../api/endpoints";
import toast from "react-hot-toast";

export default function BasicEdit({ propDetails, onClose, token }) {
  const dispatch = useDispatch();
  const [propertyDetails, setPropertyDetails] = useState({
    id: "",
    wardMstrId: "",
    khataNo: "",
    plotNo: "",
    villageMaujaName: "",
    areaOfPlot: "",
    builtupArea: "",
    propAddress: "",
    propCity: "",
    propDist: "",
    propState: "",
    propPinCode: "",
    corrAddress: "",
    corrCity: "",
    corrDist: "",
    corrState: "",
    corrPinCode: "",
    remarks: "",
    document: "",
  });
  const [validationError,setValidationError] = useState([]);

  const [isCorrespondenceDifferent, setIsCorrespondenceDifferent] =
    useState(false);
  const { wardList = [], loading, error } = useSelector((state) => state.ward);

  const fields = {
    propertyDetails: [
      {
        label: "Ward No",
        type: "wardSelect",
        name: "wardMstrId",
        options: wardList,
        error:validationError?.wardMstrId||"",
      },
      { label: "Khata No", type: "input", name: "khataNo",error:validationError?.khataNo||"", },
      { label: "Plot No", type: "input", name: "plotNo",error:validationError?.plotNo||"", },
      { label: "Village Mauja Name", type: "input", name: "villageMaujaName" ,error:validationError?.villageMaujaName||"", },
      { label: "Area Of Plot (In Sqft)", type: "input", name: "areaOfPlot" ,error:validationError?.areaOfPlot||"",},
      { label: "Built Up Area (In Sqft)", type: "input", name: "builtupArea" ,error:validationError?.builtupArea||"",},
    ],
    propertyAddress: [
      { label: "Property Address", type: "textarea", name: "propAddress" ,error:validationError?.propAddress||"",},
      { label: "City", type: "input", name: "propCity" ,error:validationError?.propCity||"",},
      { label: "District", type: "input", name: "propDist" ,error:validationError?.propDist||"",},
      { label: "State", type: "input", name: "propState" ,error:validationError?.propState||"",},
      { label: "Pincode", type: "input", name: "propPinCode" ,error:validationError?.propPinCode||"", },
    ],
    correspondenceAddress: [
      { label: "Property Address", type: "textarea", name: "corrAddress" ,error:validationError?.corrAddress||"", },
      { label: "City", type: "input", name: "corrCity" ,error:validationError?.corrCity||"",},
      { label: "District", type: "input", name: "corrDist" ,error:validationError?.corrDist||"",},
      { label: "State", type: "input", name: "corrState" ,error:validationError?.corrState||"",},
      { label: "Pincode", type: "input", name: "corrPinCode" ,error:validationError?.corrPinCode||"",},
      
    ],
    supporgingDoc:[
      {
        label: "Reason For Update",
        type: "textarea",
        name: "remarks",
        error:validationError?.remarks||"",
      },
      {
      label: "Document", type: "upload", name: "document" ,
        error:validationError?.document||"",
      }
    ],
  };

  useEffect(() => {
    if (propDetails) {
      setPropertyDetails((prev) => ({
        ...prev,
        ...Object.keys(prev).reduce((acc, key) => {
          if (propDetails.hasOwnProperty(key)) {
            let value = propDetails[key];

            acc[key] = value;
          }
          return acc;
        }, {}),
      }));
    }
  }, [propDetails]);

  const handlePropertyDetailsSubmit = async () => {
    const formData = new FormData();
    Object.entries(propertyDetails).forEach(([key, value]) => {
     
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    try {
      const response = await axios.post(propBasicEditApi, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (response && response.data && response.data.status) {
        toast.success("Property details updated successfully!");
        onClose && onClose();
      }
      else {
        setValidationError(response?.data?.errors||[]);
        toast.error("Failed to update property details.");
      }
    } catch (error) {
      console.error("Error submitting property details:", error);
      toast.error("An error occurred while updating property details.");
    }
  };

  useEffect(() => {
    dispatch(fetchWardList());
  }, [dispatch]);

  const handlePropDetails = (name, value) => {
    setPropertyDetails((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (validationError && validationError[name]) {
      setValidationError((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
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
          <h2 className="font-semibold text-blue-900 text-xl">Basic Edit</h2>
          <button
            className="text-gray-600 hover:text-red-600"
            onClick={onClose}
          >
            <FaTimes size={20} />
          </button>
        </div>
        <div className="flex flex-col flex-grow gap-4 rounded-t-xl overflow-scroll scrollbar-hide">
          <div className="flex flex-col border border-blue-900 rounded-t-xl">
            <h1 className="bg-blue-900 px-4 py-1 rounded-t-xl font-semibold text-white text-lg">
              Property Details
            </h1>
            <InputCard
              fields={fields.propertyDetails}
              values={propertyDetails}
              onChange={handlePropDetails}
            />
            <InputCard
              fields={fields.propertyAddress}
              title={"Property Address"}
              values={propertyDetails}
              onChange={handlePropDetails}
            />
            <div className="flex items-center gap-2 px-4 py-2">
              <input
                type="checkbox"
                id="correspondence-different"
                checked={isCorrespondenceDifferent}
                onChange={(e) => setIsCorrespondenceDifferent(e.target.checked)}
              />
              <label
                htmlFor="correspondence-different"
                className="text-gray-700"
              >
                If Corresponding Address Different from Property Address
              </label>
            </div>
            {isCorrespondenceDifferent && (
              <InputCard
                fields={fields.correspondenceAddress}
                title={"Correspondence Address"}
                isSubTitle={true}
                values={propertyDetails}
                onChange={handlePropDetails}
              />
            )}
            <InputCard
              fields={fields.supporgingDoc}
              title={"Supporting Document"}
              values={propertyDetails}
              onChange={handlePropDetails}
            />
            <div className="flex justify-end mb-4 px-5">
              <button
                className="flex justify-center items-center bg-blue-600 hover:bg-blue-700 px-4 rounded-full h-7 font-semibold text-white"
                onClick={handlePropertyDetailsSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
