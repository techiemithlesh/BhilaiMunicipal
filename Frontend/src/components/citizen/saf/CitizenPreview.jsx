import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useLoading } from "../../../contexts/LoadingContext";
import axios from "axios";
import { reviewTaxApi, safApplyApi, safEditApi } from "../../../api/endpoints";
import toast from "react-hot-toast";
import TaxViewTab from "../../../modules/property/component/Saf/TaxViewTab";
import { normalizePayload } from "../../../utils/utils";
import SuccessModal from "../holding/SuccessModal";
import { clearForm } from "../../../store/slices/assessmentSlice";

const ulbId = import.meta.env.VITE_REACT_APP_ULB_ID;

export default function CitizenPreview() {
  const { state } = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state) => state.citizenAuth.token);

  const { setIsLoadingGable } = useLoading();
  const [taxDtl, setTaxDtl] = useState({});
  const [isModalOpen, setModalOpen] = useState(false);
  const [data, setIsData] = useState([]);

  const {
    formData,
    ownerDtl,
    floorDtl,
    swmConsumer,
    mstrData,
    newWardList,
    apartmentList,
  } = state || {};

  const buildPayload = () =>
    formData?.propTypeMstrId === 4
      ? { ...formData, newWardMstrId: "", ownerDtl }
      : { ...formData, newWardMstrId: "", ownerDtl, floorDtl };

  const taxPreview = async () => {
    setIsLoadingGable(true);
    try {
      const { data } = await axios.post(reviewTaxApi, buildPayload(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("response tax: ", data);
      setTaxDtl(data?.data || {});
    } catch (err) {
      console.error("Tax preview error", err);
    } finally {
      setIsLoadingGable(false);
    }
  };

  useEffect(() => {
    if (formData) taxPreview();
  }, [formData, ownerDtl, floorDtl]);

  if (!formData)
    return (
      <div className="mx-auto my-10 text-center container">
        <h2 className="mb-4 font-bold text-2xl">No data to preview</h2>
        <button
          onClick={() => navigate("/property/saf/apply/new")}
          className="bg-indigo-600 px-4 py-2 rounded text-white"
        >
          Go to Form
        </button>
      </div>
    );


  const handleSubmitForm = async () => {
    // build payload first
    const rawPayload = buildPayload();
    // normalize numbers/booleans and dates
    const finalPayload = normalizePayload(rawPayload);

    finalPayload.ulbId = ulbId;

    const submitApi = state?.formType === "edit" ? safEditApi : safApplyApi;

    try {
      const { data: res } = await axios.post(submitApi, finalPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.status) {
        if (res.errors) {
          // Flatten and join all error messages
          const errorMessages = Object.values(res.errors).flat().join("\n");
          toast.error(errorMessages, { duration: 8000 });
        } else {
          toast.error(res?.message);
        }
        return;
      }

      if (res.status) {
        toast.success(res.message);
        setModalOpen(true);
        setIsData(res.data);
        dispatch(clearForm());
        dispatch(clearFloorDtl());
        dispatch(clearOwnerDtl());
      } else {
        toast.error(res?.message);
      }
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  const findName = (list, id, key) => {
    return list.find((item) => String(item.id) === String(id))?.[key] || "";
  };

  return (
    <>
      <div className="flex flex-col gap-6 bg-white shadow-lg mx-auto p-6 rounded-lg w-full container-fluid">
        {/* Property Details */}
        <section className="flex flex-col gap-4 bg-gray-50 p-4 border rounded">
          <h2 className="font-semibold text-xl">Assessment Information</h2>
          <div className="gap-4 grid sm:grid-cols-2 md:grid-cols-4 bg-gray-50 rounded">
            <DetailCard
              label="Assessment Type"
              value={formData?.assessmentType || "New Assessment"}
            />
            <DetailCard
              label="Circle"
              value={findName(
                mstrData.zoneType,
                formData?.zoneMstrId,
                "zoneName"
              )}
            />
            <DetailCard
              label="Ward No"
              value={findName(
                mstrData.wardList,
                formData?.wardMstrId,
                "wardNo"
              )}
            />
            <DetailCard
              label="Ownership Type"
              value={findName(
                mstrData.ownershipType,
                formData?.ownershipTypeMstrId,
                "ownershipType"
              )}
            />
            <DetailCard
              label="Property Type"
              value={findName(
                mstrData.propertyType,
                formData?.propTypeMstrId,
                "propertyType"
              )}
            />
            {[3, 4].includes(Number(formData?.propTypeMstrId)) && (
              <DetailCard
                label="Date of Possession"
                value={formData?.landOccupationDate}
              />
            )}
            {formData?.propTypeMstrId === 1 && (
              <>
                <DetailCard
                  label="Apartment Name"
                  value={findName(
                    apartmentList,
                    formData?.appartmentDetailsId,
                    "apartmentName"
                  )}
                />
                <DetailCard
                  label="Flat Registry Date"
                  value={formData?.flatRegistryDate}
                />
              </>
            )}
            <DetailCard
              label="Road Type"
              value={findName(
                mstrData.roadType,
                formData?.roadTypeMstrId,
                "roadType"
              )}
            />
          </div>
        </section>

        {/* Owner Details */}
        <OwnerTable data={ownerDtl} />

        {/* Electricity Details */}
        <section className="flex flex-col gap-4 bg-gray-50 p-4 border rounded">
          <h2 className="font-semibold text-xl">Electricity Details</h2>
          <div className="gap-4 grid sm:grid-cols-2 md:grid-cols-4 bg-gray-50 rounded">
            <DetailCard
              label="Electricity K. No"
              value={formData?.electConsumerNo}
            />
            <DetailCard label="ACC No" value={formData?.electAccNo} />
            <DetailCard
              label="BIND/BOOK No."
              value={formData?.electBindBookNo}
            />
            <DetailCard
              label="Electricity Consumer Category"
              value={formData?.electConsCategory}
            />
          </div>
        </section>

        {/* Property Details */}
        <section className="flex flex-col gap-4 bg-gray-50 p-4 border rounded">
          <h2 className="font-semibold text-xl">Property Details</h2>
          <div className="gap-4 grid sm:grid-cols-2 md:grid-cols-4 bg-gray-50 rounded">
            <DetailCard label="Khata No." value={formData?.khataNo} />
            <DetailCard label="Plot No." value={formData?.plotNo} />
            <DetailCard
              label="Village/Mauja Name"
              value={formData?.villageMaujaName}
            />
            <DetailCard
              label="Area of Plot (in Decimal)"
              value={formData?.areaOfPlot}
            />
            <DetailCard
              label="Built Up Area (in Sqft)"
              value={formData?.builtupArea}
            />
            <DetailCard
              label="Road Width (in ft)"
              value={formData?.roadWidth}
            />
          </div>
        </section>
        {/* Water Connection Details */}
        <section className="flex flex-col gap-4 bg-gray-50 p-4 border rounded">
          <h2 className="font-semibold text-xl">Water Connection Details</h2>
          <div className="gap-4 grid sm:grid-cols-2 md:grid-cols-4 bg-gray-50 rounded">
            <DetailCard
              label="Water Connection No"
              value={formData?.waterConnNo}
            />
            <DetailCard
              label="Water Connection Date"
              value={formData?.waterConnDate}
            />
          </div>
        </section>

        {/* Property Address */}
        <section className="flex flex-col gap-4 bg-gray-50 p-4 border rounded">
          <h2 className="font-semibold text-xl">Property Address</h2>
          <div className="gap-4 grid sm:grid-cols-2 md:grid-cols-4 bg-gray-50 rounded">
            <DetailCard
              label="Property Address"
              value={formData?.propAddress}
            />
            <DetailCard label="City" value={formData?.propCity} />
            <DetailCard label="District" value={formData?.propDist} />
            <DetailCard label="State" value={formData?.propState} />
            <DetailCard label="Pincode" value={formData?.propPinCode} />
          </div>
          {formData?.isCorrAddDiffer === 1 && (
            <>
              <h3 className="mt-4 font-semibold text-lg">
                Correspondence Address
              </h3>
              <div className="gap-4 grid sm:grid-cols-2 md:grid-cols-4 bg-gray-50 rounded">
                <DetailCard
                  label="Correspondence Address"
                  value={formData?.corrAddress}
                />
                <DetailCard label="City" value={formData?.corrCity} />
                <DetailCard label="District" value={formData?.corrDist} />
                <DetailCard label="State" value={formData?.corrState} />
                <DetailCard label="Pincode" value={formData?.corrPinCode} />
              </div>
            </>
          )}
        </section>

        {/* Floor Details */}
        <FloorTable data={floorDtl} mstrData={mstrData} />

        {/* SWM */}
        {formData?.hasSwm && (
          <div className="flex flex-col gap-4 bg-white shadow p-6 border-green-500 border-t-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 text-xl">SWM Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 border border-gray-500 font-semibold text-gray-500 text-xs text-left uppercase tracking-wider">
                      Occupancy Type
                    </th>
                    <th className="px-4 py-2 border border-gray-500 font-semibold text-gray-500 text-xs text-left uppercase tracking-wider">
                      Consumer Name
                    </th>
                    <th className="px-4 py-2 border border-gray-500 font-semibold text-gray-500 text-xs text-left uppercase tracking-wider">
                      Guardian Name
                    </th>
                    <th className="px-4 py-2 border border-gray-500 font-semibold text-gray-500 text-xs text-left uppercase tracking-wider">
                      Relation
                    </th>
                    <th className="px-4 py-2 border border-gray-500 font-semibold text-gray-500 text-xs text-left uppercase tracking-wider">
                      Mobile No
                    </th>
                    <th className="px-4 py-2 border border-gray-500 font-semibold text-gray-500 text-xs text-left uppercase tracking-wider">
                      Consumer Category
                    </th>
                    <th className="px-4 py-2 border border-gray-500 font-semibold text-gray-500 text-xs text-left uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-2 border border-gray-500 font-semibold text-gray-500 text-xs text-left uppercase tracking-wider">
                      Consumer Range
                    </th>
                    <th className="px-4 py-2 border border-gray-500 font-semibold text-gray-500 text-xs text-left uppercase tracking-wider">
                      Effective From
                    </th>
                    <th className="px-4 py-2 border border-gray-500 font-semibold text-gray-500 text-xs text-left uppercase tracking-wider">
                      Monthly Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {swmConsumer?.map((app, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 border border-gray-500 font-medium text-gray-900 text-sm whitespace-nowrap">
                        {findName(
                          mstrData?.occupancyType,
                          app?.occupancyTypeMasterId,
                          "occupancyName"
                        )}
                      </td>
                      <td className="px-4 py-2 border border-gray-500 text-gray-500 text-sm whitespace-nowrap">
                        {app.ownerName}
                      </td>
                      <td className="px-4 py-2 border border-gray-500 text-gray-500 text-sm whitespace-nowrap">
                        {app.guardianName}
                      </td>
                      <td className="px-4 py-2 border border-gray-500 text-gray-500 text-sm whitespace-nowrap">
                        {app.relationType}
                      </td>
                      <td className="px-4 py-2 border border-gray-500 text-gray-500 text-sm whitespace-nowrap">
                        {app.mobileNo}
                      </td>
                      <td className="px-4 py-2 border border-gray-500 text-gray-500 text-sm whitespace-nowrap">
                        {findName(
                          mstrData?.swmConsumerType,
                          app.categoryTypeMasterId,
                          "categoryType"
                        )}
                      </td>
                      <td className="px-4 py-2 border border-gray-500 text-gray-500 text-sm whitespace-nowrap">
                        {app.category}
                      </td>
                      <td className="px-4 py-2 border border-gray-500 text-gray-500 text-sm whitespace-nowrap">
                        {findName(
                          app?.subCategoryList,
                          app.subCategoryTypeMasterId,
                          "subCategoryType"
                        )}
                      </td>
                      <td className="px-4 py-2 border border-gray-500 text-gray-500 text-sm whitespace-nowrap">
                        {app.dateOfEffective}
                      </td>
                      <td className="px-4 py-2 border border-gray-500 text-gray-500 text-sm whitespace-nowrap">
                        {app?.rate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Water Tax Details */}
        <section className="flex flex-col gap-4 bg-gray-50 p-4 border rounded">
          <h2 className="font-semibold text-xl">Water One Time Payment</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailCard
              label="Water Connection Facility"
              value={findName(
                mstrData.waterFacility,
                formData?.waterConnectionFacilityTypeId,
                "facilityType"
              )}
            />

            <DetailCard
              label="Water Tax Type"
              value={findName(
                mstrData.waterTax,
                formData?.waterTaxTypeId,
                "taxType"
              )}
            />

            {/* NOTE */}
            <div className="col-span-full mt-2">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-md">
                <p className="text-xs text-gray-700 leading-relaxed">
                  <span className="font-semibold">Note:</span> Water Tax is a
                  one-time tax and is applicable only if you are doing your
                  assessment for the first time or if you have never paid it
                  earlier.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Details */}
        <AdditionalDetails formData={formData} />

        {/* Tax Details */}
        <section className="flex flex-col gap-4 bg-gray-50 p-4 border rounded">
          <h2 className="font-semibold text-xl">Tax Details</h2>
          {Object.keys(taxDtl).length > 0 && <TaxViewTab taxDtl={taxDtl} />}
        </section>

        {/* Navigation Buttons */}
        <div className="flex justify-end gap-4">
          <button
            className="bg-gray-300 hover:bg-gray-400 px-5 py-2 rounded-full leading-4"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-full text-white leading-4"
            onClick={handleSubmitForm}
          >
            {state?.formType === "edit" ? "Update" : "Submit"}
          </button>
        </div>
      </div>

      {isModalOpen && (
        <SuccessModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          title="Application Submitted"
          message={
            <>
              Your application has been successfully received. <br />
              <strong>SAF Application No: {data.safNo}</strong>
            </>
          }
          buttonText="OK"
          onConfirm={() => navigate("/citizen/application")}
        />
      )}
    </>
  );
}

const DetailCard = ({ label, value }) => (
  <div className="flex flex-col">
    <div className="font-bold text-gray-500 text-sm capitalize">{label}</div>
    <div className="flex-grow bg-white shadow-sm p-3 border rounded text-sm">
      {value || ""}
    </div>
  </div>
);

const OwnerTable = ({ data }) =>
  data?.length ? (
    <TableSection
      title="Owner Details"
      headers={[
        "SL",
        "Name",
        "Gender",
        "DOB",
        "Guardian Name",
        "Relation",
        "Aadhar No.",
        "Mobile No.",
        "Email",
        "Pan No.",
        "Is Armed Force?",
        "Is Specially Abled?",
      ]}
      rows={data.map((o, i) => [
        i + 1,
        o.ownerName,
        o.gender,
        o.dob,
        o.guardianName,
        o.relationType,
        o.adharNo,
        o.mobileNo,
        o.email,
        o.panNo,
        o.isArmedForce === 1 ? "YES" : "NO",
        o.isSpeciallyAbled === 1 ? "YES" : "NO",
      ])}
    />
  ) : (
    <p>No owner details provided.</p>
  );

const FloorTable = ({ data, mstrData }) =>
  data?.length ? (
    <TableSection
      title="Floor Details"
      headers={[
        "SL",
        "Floor",
        "Usage Type",
        "Occupancy Type",
        "Construction Type",
        "Builtup Area",
        "Date From",
        "Date Upto",
      ]}
      rows={data.map((f, i) => [
        i + 1,
        mstrData.floorType.find((x) => String(x.id) === String(f.floorMasterId))
          ?.floorName || "",
        mstrData.usageType.find(
          (x) => String(x.id) === String(f.usageTypeMasterId)
        )?.usageType || "",
        mstrData.occupancyType.find(
          (x) => String(x.id) === String(f.occupancyTypeMasterId)
        )?.occupancyName || "",
        mstrData.constructionType.find(
          (x) => String(x.id) === String(f.constructionTypeMasterId)
        )?.constructionType || "",
        f.builtupArea,
        f.dateFrom,
        f.dateUpto,
      ])}
    />
  ) : (
    <p>No floor details provided.</p>
  );
const TableSection = ({ title, headers, rows }) => (
  <section className="flex flex-col gap-4 bg-gray-50 p-4 border rounded">
    <h2 className="font-semibold text-xl">{title}</h2>
    <div className="overflow-auto">
      <table className="bg-white border border-gray-300 w-full border-collapse table-auto">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2 border text-sm">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className="px-4 py-2 border">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const AdditionalDetails = ({ formData }) => (
  <section className="flex flex-col gap-4 bg-gray-50 p-4 border rounded">
    <h2 className="font-semibold text-xl">Additional Details</h2>
    <Detail
      label="Have Mobile Tower(s)?"
      value={formData?.isMobileTower}
      area={formData?.towerArea}
      date={formData?.towerInstallationDate}
    />
    <Detail
      label="Have Hoarding Board(s)?"
      value={formData?.isHoardingBoard}
      area={formData?.hoardingArea}
      date={formData?.hoardingInstallationDate}
    />
    {formData?.propTypeMstrId !== 4 && (
      <>
        <Detail
          label="Have Petrol Pump?"
          value={formData?.isPetrolPump}
          area={formData?.underGroundArea}
          date={formData?.petrolPumpCompletionDate}
        />
        <Detail
          label="Have Rainwater Harvesting?"
          value={formData?.isWaterHarvesting}
          date={formData?.waterHarvestingDate}
        />
      </>
    )}
  </section>
);

const Detail = ({ label, value, area, date }) => (
  <div className="flex flex-col gap-2 bg-white shadow-sm p-3 border rounded">
    <h3 className="font-semibold">
      {label} :{" "}
      <span className="font-bold text-sm">{value ? "YES" : "NO"}</span>
    </h3>
    {value && (
      <>
        {area && (
          <div>
            <strong>Area:</strong> {area}
          </div>
        )}
        {date && (
          <div>
            <strong>Date:</strong> {date}
          </div>
        )}
      </>
    )}
  </div>
);
