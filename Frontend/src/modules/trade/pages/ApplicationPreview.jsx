import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import { applyTradeApi } from "../../../api/endpoints";
import {
  Modal,
  ModalContent,
  ModalBody,
  useDisclosure,
} from "@nextui-org/react";
import { useNavigate } from "react-router-dom";
import { getToken, getWithExpiry, removeStoreData } from "../../../utils/auth";
import PreviewFormData from "../../../components/common/PreviewFormData";
import PreviewFormTableData from "../../../components/common/PreviewFormTableData";
import { toastMsg } from "../../../utils/utils";
import AdminLayout from "../../../layout/AdminLayout";

export default function ApplicationPreview() {
  const token = getToken();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({});
  const [masterData, setMasterData] = useState({});
  const [newWardList, setNewWardList] = useState([]);
  const [natureOfBusinessItems, setNatureOfBusinessItems] = useState([]);
  const [isSubmit, setIsSubmit] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [submissionMessage, setSubmissionMessage] = useState("");

  useEffect(() => { 
      const savedFormData = getWithExpiry("tradeConnectionFormData");;
      const savedMasterData = getWithExpiry("tradeMasterData"); 
      const savedNewWardList = getWithExpiry("tradeNewWardList");
  
      if (!savedFormData) {
        navigate(-1);
        return;
      } 
  
      setFormData(savedFormData);
      setMasterData(savedMasterData);
      setNewWardList(savedNewWardList || []);
  
      
  },[token,navigate]);
  
  const getName = (list, id, key) => {
    if (!list || !id) return "N/A";
    const item = list.find((i) => i.id == id);
    return item ? item[key] : "N/A";
  };

  const fieldGroups = [
    {
      title: `Apply Licence (${formData?.applicationType})`,
      fields: [
        { label: "Application Type", value: formData?.applicationType },
        { label: "Firm Type", value: getName(masterData?.firmType,formData?.firmTypeId,"firmType") },
        {
          label: "Type of Ownership of Business Premises",
          value: getName(masterData?.ownershipType,formData?.ownershipTypeId,"ownershipType"),
        },
      ],
    },
    {
      title: "Firm Details",
      fields: [
        { label: "Holding No", value: formData?.holdingNo },
        { label: "Ward No", value: getName(masterData?.wardList,formData.wardMstrId,"wardNo") },
        { label: "New Ward No", value:getName(newWardList, formData.newWardMstrId,"wardNo") },
        { label: "Total Area (in Sq. Ft)", value: formData.areaInSqft },
        { label: "Firm Name", value: formData.firmName },
        { label: "Firm Establishment Date", value: formData.firmEstablishmentDate,},
        { label: "Business Address", value: formData.address },
        { label: "Landmark", value: formData.landmark },
        { label: "Pin Code", value: formData.pinCode },
        {
          label: "Owner of Business Premises",
          value: formData.premisesOwnerName,
        },
        { label: "Business Description", value: formData.firmDescription },
      ],
    },
  ];
  const ownerHeader = [
    {key:"sl", label:"SL No."},
    {key:"ownerName", label:"Owner Name"},
    {key:"guardianName", label:"Guardian Name"},
    {key:"mobileNo", label:"Mobile No."},
    {key:"email", label:"Email"},
  ];
  const ownerFields = formData?.ownerDtl?.map((owner, i) => ({
    sl:i+1,
    ownerName:owner?.ownerName,
    guardianName:owner?.guardianName,
    mobileNo:owner?.mobileNo,
    email:owner?.email,
  }));

  useEffect(() => {
    if (masterData.itemType?.length && formData.natureOfBusiness.length) {
      const matchedItems = formData.natureOfBusiness
        .map((ele) =>{
          const match = masterData.itemType.find(
            (item) => item.id == ele.tradeItemTypeId
          )
          return match?.tradeItem
        }
          
        )
        .filter(Boolean);

      setNatureOfBusinessItems(matchedItems);
    }
  }, [masterData.itemType, formData.natureOfBusiness]);

  const natureOfBusinessField = {
    title: "Nature of Business",
    fields: [
      {
        label: "Nature of Business",
        value: natureOfBusinessItems || [],
        colSpan: 2,
      },
    ],
  };

  const paymentFields = [
    { label: "License For Years", value: formData.licenseForYears },
    { label: "License Charge", value: formData?.taxDetails?.licenseCharge },
    { label: "Arrear", value: formData?.taxDetails?.arrearCharge },
    { label: "Penalty", value: formData?.taxDetails?.latePenalty },
    { label: "Total Amount", value: formData?.taxDetails?.totalCharge },    
  ];

  const handleSubmit = async () => {
    setIsSubmit(true);
    try{
      const res = await axios.post(applyTradeApi, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.data.status === true) {
        removeStoreData("tradeConnectionFormData");
        removeStoreData("tradeMasterData");
        removeStoreData("tradeNewWardList");
        setSubmissionMessage(res.data.data.applicationNo);
        onOpen();
        toastMsg(res.data.message,"success");
      } else if(res.data.errors) {
        for (const [field, messages] of Object.entries(res.data.errors)) {
          messages.forEach((msg) =>
            toastMsg(msg || "Something went wrong, please try again.","error")
          );
        }
      }else{
        toastMsg(res?.data?.message || "Something went wrong, please try again.","error")
      }
    }catch(error){

    }finally{
      setIsSubmit(false);
    }
    
  };

  const handelBack = () => {
    if (formData?.url) {
      navigate(formData.url, { state: { fromPriv: true } });
    } else {
      navigate(-1);
    }
  };

  if (!formData || !masterData) {
    return (
      <div className="flex flex-col gap-6 p-6 text-gray-700 text-lg">
        <h2 className="font-semibold text-xl">Loading...</h2>
        <p>Please wait while we load your application details.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 bg-gray-100">
        {fieldGroups.map((group) => (
          <PreviewFormData
            key={group.title}
            title={group.title}
            formFields={group.fields}
          />
        ))}

        {ownerFields &&(
          <PreviewFormTableData title="Owner Detail" header={ownerHeader} data={ownerFields}/>

        )}
        

        <PreviewFormData
          title={natureOfBusinessField.title}
          formFields={natureOfBusinessField.fields}
          colSpan={2}
        />

        <PreviewFormData title="Tax Details" formFields={paymentFields} />

        {/* Submit Button */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => 
              handelBack()
              // navigate("trade/apply-license/",{state:{fromPriv:true}})
          }
            className="bg-gray-600 hover:bg-gray-700 px-6 py-1 rounded-full font-semibold text-white leading-6 transition duration-300"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            className={`${isSubmit ? "bg-gray-500 hover:bg-gray-700" : "bg-blue-600 hover:bg-blue-700"} shadow-md px-6 py-2 rounded-full font-semibold text-white transition`}
            disabled={isSubmit}
          >
            Submit
          </button>
        </div>

        <Modal
          isOpen={isOpen}
          onOpenChange={(open) => {
            onOpenChange(open);
            if (!open) {
              setSubmissionMessage("");
              navigate("/trade/search");
              dispatch(clearFormData());
            }
          }}
        >
          <ModalContent>
            {() => (
              <ModalBody className="flex flex-col justify-center items-center py-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-green-100 p-4 rounded-full">
                    <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="12"
                        fill="#22c55e"
                        opacity="0.2"
                      />
                      <path
                        d="M7 13l3 3 7-7"
                        stroke="#22c55e"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h2 className="font-bold text-green-700 text-xl">
                    Application Submitted!
                  </h2>
                  <span className="text-gray-700">
                    Your Application Number is
                    <span className="ml-2 font-bold text-success-500">
                      {submissionMessage}
                    </span>
                  </span>
                  <span className="text-gray-500 text-sm">
                    Please save this number for future reference.
                  </span>
                </div>
              </ModalBody>
            )}
          </ModalContent>
        </Modal>
      </div>
    </>
  );
}
