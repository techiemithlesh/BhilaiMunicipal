import { useEffect, useState } from "react";
import { getToken } from "../../../utils/auth";
import { getSafMstrDataApi, propertyDetailsApi } from "../../../api/endpoints";
import axios from "axios";
import { Spinner } from "@nextui-org/react";
import { useParams } from "react-router-dom";
import AssessmentForm from "../component/AssessmentForm";

const ReAssesment = () => {
  const { propId } = useParams();
  const token = getToken();

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
        { id: propId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = response.data?.data;
      data.assessmentType = "Reassessment";
      delete data?.taxDtl;
      delete data?.tranDtls;
      setPropDetails(data);
    } catch (error) {
      console.error("Failed to fetch SAF details", error);
    }
  };

  const fetchSafData = async () => {
    try {
      const res = await axios.post(
        getSafMstrDataApi,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.status === true) {
        setMstrData(res.data.data);
        setIsLoading(false); // safe to toggle loading here
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
      />
    </div>
  );
};

export default ReAssesment;
