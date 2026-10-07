import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FaCalculator } from "react-icons/fa";
import { taxCalculatorApi, taxCalculatorMstrDataApi } from "../../../api/endpoints";
import { useLoading } from "../../../contexts/LoadingContext";
import { getUserDetails } from "../../../utils/auth";
import DataTableFullData from "../../../components/common/DataTableFullData";
import FloorDtlAdd from "./Saf/FloorDtlAdd";
import BhilaiTaxHistory, { buildEntriesFromTaxDtl } from "./Saf/BhilaiTaxHistory";

const VACANT_LAND = 4;

const initialForm = {
  applicationFrom: "",
  wardMstrId: "",
  ownershipTypeMstrId: "",
  propTypeMstrId: "",
  roadTypeMstrId: "",
  areaOfPlot: "",
  landOccupationDate: "",
  isMobileTower: false,
  towerInstallationDate: "",
  isWaterHarvesting: false,
  waterHarvestingDate: "",
  isBpl: false,
  isWidow: false,
  isExArmy: false,
  isDisabledPerson: false,
  isOldProperty: false,
  isDp: false,
  isSchool: false,
  isComplex: false,
  isChabutra: false,
  isShopHolding: false,
};

const checkboxFields = [
  { name: "isBpl", label: "Is BPL Category?" },
  {
    name: "isWidow",
    label: "Widow/Abandoned/Mentally Disable/Visually Impaired?",
  },
  { name: "isExArmy", label: "Ex-Army (Income Tax Exempted)?" },
  { name: "isDisabledPerson", label: "Physically Disable?" },
  { name: "isOldProperty", label: "Old Property waived Off In 2026-2027?" },
  { name: "isDp", label: "Belongs to IHSDP?" },
  { name: "isSchool", label: "Is School?" },
  { name: "isComplex", label: "Is Complex?" },
  { name: "isChabutra", label: "Is Chabutra?" },
  { name: "isShopHolding", label: "Holding Belongs To Shop?" },
];

const yearlyTaxHeaders = [
  { label: "#", key: "serial" },
  { label: "Financial Year", key: "year" },
  { label: "ARV", key: "aRV" },
  { label: "Rate (%)", key: "ratePercent" },
  { label: "Property Tax", key: "holdingTax" },
  { label: "Composite Tax", key: "compositeTax" },
  { label: "Water Tax", key: "waterTax" },
  { label: "Education Cess", key: "educationCessTax" },
  { label: "Yearly Tax", key: "totalTax" },
  { label: "Penal Charge", key: "arrayPenalty" },
  { label: "Other Penalty", key: "penal" },
  { label: "Net Payable", key: "netTotalTax" },
];

const money = (value) =>
  value === null || value === undefined || value === ""
    ? "-"
    : Number(value).toFixed(2);

const inputClass =
  "block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs";
const sectionTitleClass =
  "flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-400 shadow-md p-3 rounded-md font-bold text-white text-lg uppercase tracking-wide";
const sectionBodyClass =
  "bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-sm p-4 border border-blue-300 rounded-xl";

const SelectField = ({ id, label, value, onChange, options, required = true }) => (
  <div>
    <label htmlFor={id} className="block font-medium text-sm">
      {label} {required && <span className="text-red-400 text-sm">*</span>}
    </label>
    <select
      id={id}
      name={id}
      required={required}
      value={value}
      onChange={onChange}
      className={inputClass}
    >
      <option value="">Select {label}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const TaxCalculator = () => {
  const { setIsLoadingGable } = useLoading();
  const ulbId =
    getUserDetails()?.ulbId ?? import.meta.env.VITE_REACT_APP_ULB_ID;

  const [mstrData, setMstrData] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [floorDtl, setFloorDtl] = useState([]);
  const [errors, setErrors] = useState({});
  const [taxDtl, setTaxDtl] = useState(null);

  const isVacantLand = Number(formData.propTypeMstrId) === VACANT_LAND;
  const needsRwh = [1, 2, 3, 5].includes(Number(formData.propTypeMstrId));

  useEffect(() => {
    const fetchMasterData = async () => {
      setIsLoadingGable(true);
      try {
        const { data } = await axios.post(taxCalculatorMstrDataApi, { ulbId });
        if (data?.status) setMstrData(data.data);
        else toast.error(data?.message || "Unable to load master data");
      } catch (err) {
        console.error("Tax calculator master data error", err);
        toast.error("Unable to load master data");
      } finally {
        setIsLoadingGable(false);
      }
    };
    fetchMasterData();
    // eslint-disable-next-line
  }, [ulbId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setTaxDtl(null);
  };

  const handleFloorChange = (list) => {
    setFloorDtl(list);
    setTaxDtl(null);
  };

  const buildPayload = () => {
    const payload = {
      ...formData,
      ulbId,
      assessmentType: "New Assessment",
      isWaterHarvesting: needsRwh ? formData.isWaterHarvesting : false,
    };
    if (!isVacantLand) delete payload.landOccupationDate;
    if (!formData.isMobileTower) delete payload.towerInstallationDate;
    if (!payload.isWaterHarvesting) delete payload.waterHarvestingDate;
    return isVacantLand ? payload : { ...payload, floorDtl };
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setIsLoadingGable(true);
    try {
      const { data } = await axios.post(taxCalculatorApi, buildPayload());
      if (!data?.status) {
        const errorMessages = data?.errors
          ? Object.values(data.errors).flat().join("\n")
          : data?.message;
        toast.error(errorMessages || "Unable to calculate tax", {
          duration: 8000,
        });
        setTaxDtl(null);
        return;
      }
      setTaxDtl(data.data || {});
    } catch (err) {
      console.error("Tax calculator error", err);
      toast.error("Something went wrong!");
    } finally {
      setIsLoadingGable(false);
    }
  };

  const handleReset = () => {
    setFormData(initialForm);
    setFloorDtl([]);
    setErrors({});
    setTaxDtl(null);
  };

  if (!mstrData) return null;

  return (
    <div className="flex flex-col gap-4 bg-white shadow-lg mx-auto p-6 rounded-lg container-fluid">
      <form className="flex flex-col gap-4" onSubmit={handleCalculate}>
        <div className="flex flex-col gap-2 text-gray-700">
          <h2 className={sectionTitleClass}>
            <FaCalculator className="text-2xl" />
            Property Tax Calculator
          </h2>
          <div className={sectionBodyClass}>
            <div className="gap-4 grid grid-cols-1 md:grid-cols-3">
              <SelectField
                id="applicationFrom"
                label="Application Type"
                value={formData.applicationFrom}
                onChange={handleChange}
                options={(mstrData.applicationType || []).map((t) => ({
                  value: t,
                  label: t,
                }))}
              />
              <SelectField
                id="wardMstrId"
                label="Ward No"
                value={formData.wardMstrId}
                onChange={handleChange}
                options={(mstrData.wardList || []).map((w) => ({
                  value: w.id,
                  label: w.wardNo,
                }))}
              />
              <SelectField
                id="ownershipTypeMstrId"
                label="Ownership Type"
                value={formData.ownershipTypeMstrId}
                onChange={handleChange}
                options={(mstrData.ownershipType || []).map((o) => ({
                  value: o.id,
                  label: o.ownershipType,
                }))}
              />
              <SelectField
                id="propTypeMstrId"
                label="Property Type"
                value={formData.propTypeMstrId}
                onChange={handleChange}
                options={(mstrData.propertyType || []).map((p) => ({
                  value: p.id,
                  label: p.propertyType,
                }))}
              />
              <SelectField
                id="roadTypeMstrId"
                label="Road Type"
                value={formData.roadTypeMstrId}
                onChange={handleChange}
                options={(mstrData.roadType || []).map((r) => ({
                  value: r.id,
                  label: r.roadType,
                }))}
              />
              <div>
                <label htmlFor="areaOfPlot" className="block font-medium text-sm">
                  Area of Plot (in Sqft){" "}
                  <span className="text-red-400 text-sm">*</span>
                </label>
                <input
                  type="text"
                  id="areaOfPlot"
                  name="areaOfPlot"
                  required
                  value={formData.areaOfPlot}
                  onChange={(e) => {
                    const val = e.target.value
                      .replace(/[^0-9.]/g, "")
                      .replace(/^(\d*\.\d{0,2}).*$/, "$1");
                    handleChange({
                      target: { name: "areaOfPlot", value: val, type: "text" },
                    });
                  }}
                  className={inputClass}
                />
              </div>
              {isVacantLand && (
                <div>
                  <label
                    htmlFor="landOccupationDate"
                    className="block font-medium text-sm"
                  >
                    Land Occupation Date{" "}
                    <span className="text-red-400 text-sm">*</span>
                  </label>
                  <input
                    type="date"
                    id="landOccupationDate"
                    name="landOccupationDate"
                    required
                    max={new Date().toISOString().split("T")[0]}
                    value={formData.landOccupationDate}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {!isVacantLand && formData.propTypeMstrId !== "" && (
          <FloorDtlAdd
            mstrData={mstrData}
            formData={formData}
            error={errors}
            setErrors={setErrors}
            floorDtl={floorDtl}
            setFloorDtl={handleFloorChange}
            isDisabled={false}
          />
        )}

        <div className="flex flex-col gap-2 text-gray-700">
          <h2 className={sectionTitleClass}>Additional Details</h2>
          <div className={sectionBodyClass}>
            <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="isMobileTower"
                    checked={formData.isMobileTower}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  Does Property Have Mobile Tower(s)?
                </label>
                {formData.isMobileTower && (
                  <div className="mt-2">
                    <label
                      htmlFor="towerInstallationDate"
                      className="block font-medium text-sm"
                    >
                      Date of Installation{" "}
                      <span className="text-red-400 text-sm">*</span>
                    </label>
                    <input
                      type="date"
                      id="towerInstallationDate"
                      name="towerInstallationDate"
                      required
                      max={new Date().toISOString().split("T")[0]}
                      value={formData.towerInstallationDate}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                )}
              </div>

              {needsRwh && (
                <div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="isWaterHarvesting"
                      checked={formData.isWaterHarvesting}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    Has Water Harvesting?
                  </label>
                  {formData.isWaterHarvesting && (
                    <div className="mt-2">
                      <label
                        htmlFor="waterHarvestingDate"
                        className="block font-medium text-sm"
                      >
                        Water Harvesting Date{" "}
                        <span className="text-red-400 text-sm">*</span>
                      </label>
                      <input
                        type="date"
                        id="waterHarvestingDate"
                        name="waterHarvestingDate"
                        required
                        max={new Date().toISOString().split("T")[0]}
                        value={formData.waterHarvestingDate}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>
              )}

              {checkboxFields.map(({ name, label }) => (
                <label key={name} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name={name}
                    checked={formData[name]}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={handleReset}
            className="bg-gray-300 hover:bg-gray-400 px-5 py-2 rounded"
          >
            Reset
          </button>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded text-white"
          >
            Calculate Tax
          </button>
        </div>
      </form>

      {taxDtl && (
        <section className="flex flex-col gap-4 bg-gray-50 p-4 border rounded">
          <h2 className="font-semibold text-xl">Tax Details</h2>
          <BhilaiTaxHistory entries={buildEntriesFromTaxDtl(taxDtl)} />
        </section>
      )}

      {taxDtl && (
        <DataTableFullData
          title="Yearly Tax"
          headers={yearlyTaxHeaders}
          data={taxDtl.fyearWiseTax || []}
          startingItemsPerPage={25}
          renderRow={(item, index) => (
            <tr key={item.year} className="hover:bg-gray-50">
              <td className="px-3 py-2 border">{index + 1}</td>
              <td className="px-3 py-2 border">{item.year}</td>
              <td className="px-3 py-2 border">{money(item.aRV)}</td>
              <td className="px-3 py-2 border">{money(item.ratePercent)}</td>
              <td className="px-3 py-2 border">{money(item.holdingTax)}</td>
              <td className="px-3 py-2 border">{money(item.compositeTax)}</td>
              <td className="px-3 py-2 border">{money(item.waterTax)}</td>
              <td className="px-3 py-2 border">{money(item.educationCessTax)}</td>
              <td className="px-3 py-2 border font-semibold">
                {money(item.totalTax)}
              </td>
              <td className="px-3 py-2 border">{money(item.arrayPenalty)}</td>
              <td className="px-3 py-2 border">{money(item.penal)}</td>
              <td className="px-3 py-2 border font-semibold">
                {money(item.netTotalTax)}
              </td>
            </tr>
          )}
        />
      )}
    </div>
  );
};

export default TaxCalculator;
