import React, { useEffect, useState } from "react";
import { getToken } from "../../../utils/auth";
import { useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  getNewWardByOldWardApi,
  getSafMstrDataApi,
  safForVerificationApi,
} from "../../../api/endpoints";
import { formatLocalDate } from "../../../utils/common";
import FieldVerificationPreview from "./FieldVerificationPreview";

const InputGroup = ({
  name,
  label,
  id,
  value,
  tcValue,
  hasVerification = false,
  options = [],
  inputType = "text", // "text" | "date"
  min,
  max,
  onVerifyChange,
}) => {
  const [isCorrect, setIsCorrect] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const hasOptions = Array.isArray(options) && options.length > 0;

  const [selectValue, setSelectValue] = useState("");

  useEffect(() => {
    if (isCorrect === true) {
      setInputValue(value ?? "");
      setSelectValue(id ?? "");
      if (onVerifyChange) onVerifyChange(name, value ?? "");
    }
    if (isCorrect === false) {
      setInputValue("");
      setSelectValue("");
      if (onVerifyChange) onVerifyChange(name, "");
    }
    // eslint-disable-next-line
  }, [isCorrect]);

  const handleRadioChange = (e) => {
    setIsCorrect(e.target.value === "correct");
  };

  const handleSelectChange = (e) => {
    setSelectValue(e.target.value);
    if (onVerifyChange) onVerifyChange(name, e.target.value);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (onVerifyChange) onVerifyChange(name, e.target.value);
  };

  const handleDateChange = (e) => {
    setInputValue(e.target.value);
    if (onVerifyChange) onVerifyChange(name, e.target.value);
  };

  // Render correction field
  const renderCorrection = () => {
    if (hasOptions) {
      // Dropdown
      return (
        <select
          className="p-1 border rounded w-full text-black"
          value={isCorrect ? id ?? "" : selectValue}
          onChange={handleSelectChange}
          disabled={isCorrect}
        >
          <option value="">Select</option>
          {options.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      );
    }
    // Date input
    if (inputType === "date") {
      return (
        <input
          type="date"
          className="p-1 border rounded w-full text-black"
          value={isCorrect ? value ?? "" : inputValue}
          onChange={handleDateChange}
          readOnly={isCorrect}
        />
      );
    }

    if (inputType === "month") {
      const today = new Date();
      const maxMonth = today.toISOString().slice(0, 7);
      return (
        <input
          type="month"
          className="p-1 border rounded w-full text-black"
          value={isCorrect ? value ?? "" : inputValue}
          onChange={handleDateChange}
          readOnly={isCorrect}
          min={min}
          max={max}
        />
      );
    }
    // Text input
    return (
      <input
        type="text"
        placeholder="Enter correct value"
        className="p-1 border rounded w-full text-black"
        value={isCorrect ? value ?? "" : inputValue}
        onChange={handleInputChange}
        readOnly={isCorrect}
      />
    );
  };

  return (
    <div className="mb-2">
      <label className="block font-medium text-gray-700 text-sm">{label}</label>
      <input
        type="text"
        className="bg-gray-100 mt-1 p-1 border rounded w-full text-black"
        value={value}
        readOnly
      />
      {tcValue && (
        <>
          <label className="block font-medium text-gray-700 text-sm">TC</label>
          <input
            type="text"
            className="bg-gray-100 mt-1 p-1 border rounded w-full text-black"
            value={tcValue}
            readOnly
          />
        </>
      )}
      {hasVerification && (
        <div className="space-x-2 mt-1 text-gray-600 text-sm">
          <label>
            <input
              type="radio"
              name={name}
              value="correct"
              checked={isCorrect === true}
              onChange={handleRadioChange}
            />{" "}
            Correct
          </label>
          <label>
            <input
              type="radio"
              name={name}
              value="incorrect"
              checked={isCorrect === false}
              onChange={handleRadioChange}
            />{" "}
            Incorrect
          </label>
          {isCorrect !== null && (
            <div className="flex-1 mt-2 min-w-[180px]">
              {renderCorrection()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- FieldSection (no change) ---
const FieldSection = ({ title, children }) => (
  <div className="bg-white mt-3 p-2 border border-indigo-300 rounded text-black">
    {title && (
      <div className="bg-teal-600 mb-2 px-2 py-1 rounded font-semibold text-white">
        {title}
      </div>
    )}
    {children}
  </div>
);

function FieldVerification() {
  const { safDtlId } = useParams();
  const [safData, setSafData] = useState({});
  const [constructionType, setConstructionType] = useState([]);
  const [floorType, setFloorType] = useState([]);
  const [occupancyType, setOccupancyType] = useState([]);
  const [ownershipType, setOwnershipType] = useState([]);
  const [propertyType, setPropertyType] = useState([]);
  const [roadType, setRoadType] = useState([]);
  const [transferMode, setTransferMode] = useState([]);
  const [usageType, setUsageType] = useState([]);
  const [wardList, setWardList] = useState([]);
  const [newWardList, setNewWardList] = useState([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isExtraFloor, setIsExtraFloor] = useState(false);
  const [extraFloors, setExtraFloors] = useState([]);

  const [verificationData, setVerificationData] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [remarks, setRemarks] = useState("");

  const token = getToken();

  useEffect(() => {
    if (token) fetchMasterData();
  }, [token]);
  useEffect(() => {
    if (token) fetchData();
  }, [safDtlId, token]);

  const fetchData = async () => {
    setIsFrozen(true);
    try {
      const response = await axios.post(
        safForVerificationApi,
        { id: safDtlId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        setSafData(response.data?.data);
        toast.success(response?.data?.message || "Data Fetched");
      }
    } catch (error) {
      console.error("Error fetching Saf Data:", error);
      toast.error("Server Error");
    } finally {
      setIsFrozen(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const response = await axios.post(
        getSafMstrDataApi,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        setConstructionType(
          response.data?.data?.constructionType.map((item) => ({
            id: item?.id,
            label: item?.constructionType,
          }))
        );
        setFloorType(
          response.data?.data?.floorType.map((item) => ({
            id: item?.id,
            label: item?.floorName,
          }))
        );
        setOccupancyType(
          response.data?.data?.occupancyType.map((item) => ({
            id: item?.id,
            label: item?.occupancyName,
          }))
        );
        setOwnershipType(
          response.data?.data?.ownershipType.map((item) => ({
            id: item?.id,
            label: item?.ownershipType,
          }))
        );
        setPropertyType(
          response.data?.data?.propertyType.map((item) => ({
            id: item?.id,
            label: item?.propertyType,
          }))
        );
        setRoadType(
          response.data?.data?.roadType.map((item) => ({
            id: item?.id,
            label: item?.roadType,
          }))
        );
        setTransferMode(
          response.data?.data?.transferMode.map((item) => ({
            id: item?.id,
            label: item?.transferMode,
          }))
        );
        setUsageType(
          response.data?.data?.usageType.map((item) => ({
            id: item?.id,
            label: item?.usageType,
          }))
        );
        setWardList(
          response.data?.data?.wardList.map((item) => ({
            id: item?.id,
            label: item?.wardNo,
          }))
        );
        toast.success(response?.data?.message || "Data Fetched");
      }
    } catch (error) {
      console.error("Error fetching Master Data:", error);
      toast.error("Server Error");
    }
  };

  const fetchWardListByWardId = async (wardId) => {
    setIsFrozen(true);
    try {
      const response = await axios.post(
        getNewWardByOldWardApi,
        { oldWardId: wardId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        setNewWardList(
          response.data?.data?.map((item) => ({
            id: item?.id,
            label: item?.wardNo,
          }))
        );
        toast.success("New Ward List Fetched");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching ward list");
    } finally {
      setIsFrozen(false);
    }
  };

  const handleAddExtraFloor = () => {
    setExtraFloors((prev) => [
      ...prev,
      {
        floorNo: "",
        constructionType: "",
        occupancyType: "",
        usageType: "",
        dateFrom: "",
        dateUpto: "",
      },
    ]);
  };

  const handleExtraFloorChange = (index, field, value) => {
    setExtraFloors((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleRemoveExtraFloor = (index) => {
    setExtraFloors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVerifyChange = (fieldName, value) => {
    setVerificationData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleFormPreview = () => {};

  const wardListMap = wardList.reduce(
    (acc, x) => ({ ...acc, [x.id]: x.label }),
    {}
  );
  const newWardListMap = newWardList.reduce(
    (acc, x) => ({ ...acc, [x.id]: x.label }),
    {}
  );
  const zoneMap = { 1: "Zone 1", 2: "Zone 2" };
  const propTypeMap = propertyType.reduce(
    (acc, x) => ({ ...acc, [x.id]: x.label }),
    {}
  );
  const usageTypeMap = usageType.reduce(
    (acc, x) => ({ ...acc, [x.id]: x.label }),
    {}
  );
  const occupancyTypeMap = occupancyType.reduce(
    (acc, x) => ({ ...acc, [x.id]: x.label }),
    {}
  );
  const constructionTypeMap = constructionType.reduce(
    (acc, x) => ({ ...acc, [x.id]: x.label }),
    {}
  );

  const lookupMaps = {
    wardMstrId: wardListMap,
    newWardMstrId: newWardListMap,
    zoneMstrId: zoneMap,
    propTypeMstrId: propTypeMap,
    usageTypeMasterId: usageTypeMap,
    occupancyTypeMasterId: occupancyTypeMap,
    constructionTypeMasterId: constructionTypeMap,
  };

  return (
    <>
      <div
        className={`${isFrozen ? "pointer-events-none filter blur-sm" : ""}`}
      >
        {safData && (
          <div className="bg-gradient-to-b from-blue-900 to-black p-3 min-h-screen text-white text-sm">
            {/* Header */}
            <div className="bg-red-700 px-2 py-1 rounded font-bold">
              Self Assessment - Field Survey
              <button className="float-right text-white text-xs underline">
                View Documents
              </button>
            </div>

            {/* Application Info */}
            <div className="bg-white mt-2 p-2 rounded text-black">
              <p>
                <b>Your Application No:</b> {safData?.safNo}
              </p>
              <p>
                <b>Application Type:</b> {safData?.assessmentType}
              </p>
              <p>
                <b>Applied Date:</b> {formatLocalDate(safData?.applyDate)}
              </p>
            </div>

            {/* Previous Owner Details */}
            {safData?.assessmentType === "Mutation" && (
              <FieldSection title="Previous Owner Details">
                <InputGroup label="Transfer Mode" value="Sale" />
                <table className="bg-white mt-2 border w-full text-black">
                  <thead>
                    <tr>
                      <th className="p-1 border">Owner Name</th>
                      <th className="p-1 border">Mobile No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safData?.privOwner.map((item, index) => (
                      <tr key={index}>
                        <td className="p-1 border">{item?.ownerName}</td>
                        <td className="p-1 border">{item?.mobileNo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </FieldSection>
            )}

            {/* Ward */}
            <FieldSection title="Ward No">
              <InputGroup
                name="wardMstrId"
                label="Self Assessed"
                value={safData?.wardNo}
                id={safData?.wardMstrId}
                options={wardList}
                hasVerification
                inputType="text"
                onVerifyChange={handleVerifyChange}
              />
            </FieldSection>

            {/* Other Sections */}
            <FieldSection title="New Ward No">
              <InputGroup
                name="newWardMstrId"
                label="Self Assessed"
                value={safData?.newWardNo}
                id={safData?.newWardMstrId}
                options={newWardList}
                hasVerification
                inputType="text"
                onVerifyChange={handleVerifyChange}
              />
            </FieldSection>

            <FieldSection title="Zone">
              <InputGroup
                name="zoneMstrId"
                label="Self Assessed"
                value={safData?.zone}
                id={safData?.zoneMstrId}
                options={[
                  { id: 1, label: "Zone 1" },
                  { id: 2, label: "Zone 2" },
                ]}
                hasVerification
                inputType="text"
                onVerifyChange={handleVerifyChange}
              />
            </FieldSection>

            <FieldSection title="Property Type">
              <InputGroup
                name="propTypeMstrId"
                label="Self Assessed"
                value={safData?.propertyType}
                id={safData?.propTypeMstrId}
                options={propertyType}
                hasVerification
                inputType="text"
                onVerifyChange={handleVerifyChange}
              />
            </FieldSection>

            {/* Floors Example */}
            {safData?.floor &&
              safData.floor.map((floor, index) => (
                <React.Fragment key={index}>
                  <div className="bg-gradient-to-r from-red-800 to-black mt-2 px-2 py-1 rounded font-bold text-white text-sm">
                    {floor?.floorName}
                    <FieldSection title={`Usage Type - ${floor?.floorName}`}>
                      <InputGroup
                        name="usageTypeMasterId"
                        label="Self Assessed"
                        value={floor?.usageType}
                        id={floor?.usageTypeMasterId}
                        options={usageType}
                        hasVerification
                        inputType="text"
                        onVerifyChange={handleVerifyChange}
                      />
                    </FieldSection>

                    <FieldSection
                      title={`Occupancy Type - ${floor?.floorName}`}
                    >
                      <InputGroup
                        name="occupancyTypeMasterId"
                        label="Self Assessed"
                        value={floor?.occupancyName}
                        id={floor?.occupancyTypeMasterId}
                        options={occupancyType}
                        hasVerification
                        inputType="text"
                        onVerifyChange={handleVerifyChange}
                      />
                    </FieldSection>

                    <FieldSection
                      title={`Construction Type - ${floor?.floorName}`}
                    >
                      <InputGroup
                        name="constructionTypeMasterId"
                        label="Self Assessed"
                        value={floor?.constructionType}
                        id={floor?.constructionTypeMasterId}
                        options={constructionType}
                        hasVerification
                        inputType="text"
                        onVerifyChange={handleVerifyChange}
                      />
                    </FieldSection>

                    <FieldSection title={`Buildup Area - ${floor?.floorName}`}>
                      <InputGroup
                        name="builtupArea"
                        label="Self Assessed"
                        value={floor?.builtupArea}
                        id={floor?.builtupArea}
                        hasVerification
                        inputType="text"
                        onVerifyChange={handleVerifyChange}
                      />
                    </FieldSection>

                    <FieldSection title={`Date From - ${floor?.floorName}`}>
                      <InputGroup
                        name="dateFrom"
                        label="Self Assessed"
                        value={floor?.dateFrom}
                        id={floor?.dateFrom}
                        hasVerification
                        inputType="month"
                        max={new Date().toISOString().slice(0, 7)}
                        onVerifyChange={handleVerifyChange}
                      />
                    </FieldSection>

                    <FieldSection title={`Date Upto - ${floor?.floorName}`}>
                      <InputGroup
                        name="dateUpto"
                        label="Self Assessed"
                        value={floor?.dateUpto}
                        id={floor?.dateUpto}
                        hasVerification
                        inputType="month"
                        min={floor?.dateFrom || ""}
                        max={new Date().toISOString().slice(0, 7)}
                        onVerifyChange={handleVerifyChange}
                      />
                    </FieldSection>
                  </div>
                </React.Fragment>
              ))}

            {/* Extra Floor Section */}
            <div className="bg-gradient-to-r from-red-800 to-black mt-2 px-2 py-1 rounded font-bold text-white text-sm">
              Do You Want To Add Extra Floor?
              <input
                type="checkbox"
                className="ml-2"
                checked={isExtraFloor}
                onChange={() => {
                  setIsExtraFloor(!isExtraFloor);
                  if (!isExtraFloor) {
                    setExtraFloors([
                      {
                        floorNo: "",
                        constructionType: "",
                        occupancyType: "",
                        usageType: "",
                        dateFrom: "",
                        dateUpto: "",
                      },
                    ]);
                  } else {
                    setExtraFloors([]);
                  }
                }}
              />
            </div>

            {/* Render extra floors only if checkbox is checked */}
            {isExtraFloor && (
              <>
                {extraFloors.map((floor, index) => (
                  <FieldSection key={index} title={`Extra Floor ${index + 1}`}>
                    <div className="gap-2 grid grid-cols-1">
                      <div>
                        <label className="block font-medium text-sm">
                          Floor No
                        </label>
                        <input
                          type="text"
                          className="p-1 border rounded w-full text-black"
                          value={floor.floorNo}
                          onChange={(e) =>
                            handleExtraFloorChange(
                              index,
                              "floorNo",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-sm">
                          Construction Type
                        </label>
                        <select
                          className="p-1 border rounded w-full text-black"
                          value={floor.constructionType}
                          onChange={(e) =>
                            handleExtraFloorChange(
                              index,
                              "constructionType",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select</option>
                          {constructionType.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-medium text-sm">
                          Occupancy Type
                        </label>
                        <select
                          className="p-1 border rounded w-full text-black"
                          value={floor.occupancyType}
                          onChange={(e) =>
                            handleExtraFloorChange(
                              index,
                              "occupancyType",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select</option>
                          {occupancyType.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-medium text-sm">
                          Usage Type
                        </label>
                        <select
                          className="p-1 border rounded w-full text-black"
                          value={floor.usageType}
                          onChange={(e) =>
                            handleExtraFloorChange(
                              index,
                              "usageType",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select</option>
                          {usageType.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-medium text-sm">
                          Date From
                        </label>
                        <input
                          type="month"
                          className="p-1 border rounded w-full text-black"
                          value={floor.dateFrom}
                          onChange={(e) =>
                            handleExtraFloorChange(
                              index,
                              "dateFrom",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-sm">
                          Date Upto
                        </label>
                        <input
                          type="month"
                          className="p-1 border rounded w-full text-black"
                          value={floor.dateUpto}
                          onChange={(e) =>
                            handleExtraFloorChange(
                              index,
                              "dateUpto",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    {/* Remove button for this floor */}
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        className="bg-red-600 shadow px-3 py-1 rounded text-white"
                        onClick={() => handleRemoveExtraFloor(index)}
                      >
                        Remove Floor
                      </button>
                    </div>
                  </FieldSection>
                ))}

                {/* Add Floor button after the last floor */}
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    className="bg-green-600 shadow px-4 py-1 rounded text-white"
                    onClick={handleAddExtraFloor}
                  >
                    Add Extra Floor
                  </button>
                </div>
              </>
            )}

            {/* Final */}
            <FieldSection title="Remarks">
              <textarea
                className="p-2 border rounded w-full text-black"
                rows="2"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </FieldSection>

            <div className="mt-4 text-center">
              <button
                className="bg-green-500 shadow px-6 py-2 rounded-full text-white"
                onClick={() => setShowPreview(true)}
              >
                Preview
              </button>
            </div>
          </div>
        )}
      </div>

      <FieldVerificationPreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        data={verificationData}
        safData={safData}
        lookupMaps={lookupMaps}
        extraFloors={extraFloors}
        remarks={remarks}
      />

      {isFrozen && (
        <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/60 backdrop-blur-sm">
          <div className="font-semibold text-gray-800 text-lg">
            Processing...
          </div>
        </div>
      )}
    </>
  );
}

export default FieldVerification;
