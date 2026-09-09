import { useEffect, useState } from "react";
import axios from "axios";
import { Spinner } from "@nextui-org/react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { getSafMstrDataApi, propertyDetailsApi } from "../../../api/endpoints";
import AssessmentForm from "../../../modules/property/component/AssessmentForm";

const ulbId = import.meta.env.VITE_REACT_APP_ULB_ID;

const CitizenReAssesment = () => {
  const { propId } = useParams();
  const token = useSelector((state) => state.citizenAuth.token);

  const [isLoading, setIsLoading] = useState(true);
  const [mstrData, setMstrData] = useState([]);
  const [propDetails, setPropDetails] = useState(null);

  const fetchDetails = async () => {
    if (!token) {
      console.warn("No token found.");
      return;
    }

    try {
      const response = await axios.post(
        propertyDetailsApi,
        { id: propId, ulbId: ulbId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = response.data?.data;
      data.assessmentType = "Reassessment";
      setPropDetails(data);
    } catch (error) {
      console.error("Failed to fetch SAF details", error);
    }
  };

  const fetchSafData = async () => {
    try {
      const res = await axios.post(
        getSafMstrDataApi,
        { ulbId: ulbId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.status === true) {
        setMstrData(res.data.data);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching master data:", error);
    }
  };

  // ✅ First hook
  useEffect(() => {
    fetchSafData();
  }, [token]);

  // ✅ Second hook
  useEffect(() => {
    if (propId) {
      fetchDetails();
    }
  }, [propId, token]);

  // ⛔ DON'T put hooks after returns
  if (isLoading) {
    return (
      <div className="loading">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg mx-auto p-6 border rounded-lg container-fluid">
      <AssessmentForm
        mstrData={mstrData}
        isLoading={isLoading}
        propDetails={propDetails}
        formType={"Reassessment"}
        token={token}
        ulbId={ulbId}
      />
    </div>
  );
};

export default CitizenReAssesment;
