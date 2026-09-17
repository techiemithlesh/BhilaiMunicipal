import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { reviewTaxApi, safApplyApi } from "../../../api/endpoints";
import { useLoading } from "../../../contexts/LoadingContext";
import { getToken } from "../../../utils/auth";
import axios from "axios";
import TaxViewTab from "../../property/component/Saf/TaxViewTab";
import toast from "react-hot-toast";
import SuccessModal from "../../property/component/SuccessModal";
import { clearOwnerDtl } from "../../../store/slices/ownerSlice";
import { clearFloorDtl } from "../../../store/slices/floorSlice";
import { normalizePayload } from "../../../utils/utils";
import { useDispatch } from "react-redux";
import { clearForm } from "../../../store/slices/assessmentSlice";
import { clearSwmConsumerDtl } from "../../../store/slices/swmConsumerSlice";

export default function Preview() {
  const { state } = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = getToken();
  const { setIsLoadingGable } = useLoading();
  const [taxDtl, setTaxDtl] = useState({});
  const [isModalOpen, setModalOpen] = useState(false);
  const [data, setIsData] = useState([]);

  const {
    formData,
    ownerDtl,
    floorDtl,
    mstrData,
    apartmentList,
    swmConsumer,
  } = state || {};

  const buildPayload = () =>
    formData?.propTypeMstrId === 4
      ? { ...formData, ownerDtl }
      : { ...formData, ownerDtl, floorDtl };

  const taxPreview = async () => {
    setIsLoadingGable(true);
    try {
      const finalPayload = buildPayload();
      const swmDetails = formData?.hasSwm ? swmConsumer : [];
      const { data } = await axios.post(
        reviewTaxApi,
        { ...finalPayload, swmConsumer: swmDetails },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
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

  const getName = (list, id, key) => {
    if (!list || !id) return "N/A";
    const item = list.find((i) => i.id == id);
    return item ? item[key] : "N/A";
  };

  console.log("formData", formData);

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
    setIsLoadingGable(true);
    try {
      const { data: res } = await axios.post(
        safApplyApi,
        { ...finalPayload },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

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
    } finally {
      setIsLoadingGable(false);
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
              label="Application Type"
              value={formData?.applicationFrom || ""}
            />
            <DetailCard
              label="Assessment Type"
              value={formData?.assessmentType || "New Assessment"}
            />
            <DetailCard
              label="Ward No"
              value={findName(
                mstrData.wardList,
                formData?.wardMstrId,
                "wardNo",
              )}
            />

            <DetailCard
              label="Ownership Type"
              value={findName(
                mstrData.ownershipType,
                formData?.ownershipTypeMstrId,
                "ownershipType",
              )}
            />
            <DetailCard
              label="Property Type"
              value={findName(
                mstrData.propertyType,
                formData?.propTypeMstrId,
                "propertyType",
              )}
            />
            {Number(formData?.propTypeMstrId) === 1 && (
              <DetailCard
                label="Apartment Name"
                value={findName(
                  apartmentList,
                  formData?.appartmentDetailsId,
                  "apartmentName",
                )}
              />
            )}
            <DetailCard
              label="Road Type"
              value={findName(
                mstrData.roadType,
                formData?.roadTypeMstrId,
                "roadType",
              )}
            />
            <DetailCard
              label="BPL Category"
              value={formData?.isBpl ? "YES" : "NO"}
            />
          </div>
        </section>

        {/* Owner Details */}
        <OwnerTable data={ownerDtl} />


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
              label="Area of Plot (in Sqft)"
              value={formData?.areaOfPlot}
            />

            {/* Add more fields as per your PropDtl component */}
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
                        {getName(
                          mstrData?.occupancyType,
                          app?.occupancyTypeMasterId,
                          "occupancyName",
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
                        {getName(
                          mstrData?.swmConsumerType,
                          app.categoryTypeMasterId,
                          "categoryType",
                        )}
                      </td>
                      <td className="px-4 py-2 border border-gray-500 text-gray-500 text-sm whitespace-nowrap">
                        {app.category}
                      </td>
                      <td className="px-4 py-2 border border-gray-500 text-gray-500 text-sm whitespace-nowrap">
                        {getName(
                          app?.subCategoryList,
                          app.subCategoryTypeMasterId,
                          "subCategoryType",
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

        {/* Additional Details */}
        <AdditionalDetails formData={formData} />

        {/* Tax Details */}
        <section className="flex flex-col gap-4 bg-gray-50 p-4 border rounded">
          <h2 className="font-semibold text-xl">Tax Details</h2>
          {Object.keys(taxDtl).length > 0 && <TaxViewTab taxDtl={taxDtl} />}
        </section>

        {taxDtl?.lateAssessmentPenalty && (
          <section className="flex flex-col gap-4 bg-gray-50 p-4 border rounded">
            <h2 className="font-semibold text-xl">Penalty - <span>₹ {taxDtl.lateAssessmentPenalty} (Late Assessment Penalty)</span></h2>
          </section>
        )}

        {/* Navigation Buttons */}
        <div className="flex space-x-4">
          <button
            className="bg-gray-300 hover:bg-gray-400 px-5 py-2 rounded"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded text-white"
            onClick={handleSubmitForm}
          >
            Submit
          </button>
        </div>
      </div>

      {isModalOpen && (
        <SuccessModal
          isOpen={isModalOpen}
          onClose={() => {
            setModalOpen(false);
            navigate("/saf/list/");
          }}
          title="Application Submitted"
          message={
            <>
              Your application has been successfully received. <br />
              <strong>SAF Application No: {data.safNo}</strong>
            </>
          }
          buttonText="OK"
          onConfirm={() => navigate("/saf/list/")}
          // showSecondaryButton
          // secondaryButtonText="Upload Documents"
          // onSecondaryAction={() =>
          //   navigate(`/property/saf/documents/${data.safId}`)
          // }
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
        "Guardian Name",
        "Relation",
        "Mobile No.",
        "Address"
      ]}
      rows={data.map((o, i) => [
        i + 1,
        o.ownerName,
        o.gender,
        o.guardianName,
        o.relationType,
        o.mobileNo,
        o.ownerAddress
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
        "Zone",
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
        mstrData.zoneType.find((x) => String(x.id) === String(f.zoneMstrId))?.zoneName || "",
        mstrData.floorType.find((x) => String(x.id) === String(f.floorMasterId))
          ?.floorName || "",
        mstrData.usageType.find(
          (x) => String(x.id) === String(f.usageTypeMasterId),
        )?.usageType || "",
        mstrData.occupancyType.find(
          (x) => String(x.id) === String(f.occupancyTypeMasterId),
        )?.occupancyName || "",
        mstrData.constructionType.find(
          (x) => String(x.id) === String(f.constructionTypeMasterId),
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
      date={formData?.towerInstallationDate}
    />
    <Detail
      label="Widow/Abandoned/Mentally Disable/Visually Impaired?"
      value={formData?.isWidow}
    />
    <Detail
      label="Ex-Army (Income Tax Exempted)?"
      value={formData?.isExArmy}
    />
    <Detail
      label="Physically Disable?"
      value={formData?.isDisabledPerson}
    />
    <Detail
      label="Old Property waived Off In 2026-2027"
      value={formData?.isOldProperty}
    />
    <Detail label="Belongs to IHSDP?" value={formData?.isDp} />
    <Detail label="Is School?" value={formData?.isSchool} />
    <Detail label="Is Complex?" value={formData?.isComplex} />
    <Detail label="Is Chabutra?" value={formData?.isChabutra} />
    <Detail
      label="Holding Belongs To Shop?"
      value={formData?.isShopHolding}
    />
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
