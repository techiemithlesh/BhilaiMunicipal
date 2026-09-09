import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSafMstrDataApi, propertyDetailsApi } from "../../../api/endpoints";
import { getToken } from "../../../utils/auth";
import { Spinner } from "@nextui-org/react";
import AssessmentForm from "../component/AssessmentForm";

export default function EditHolding() {
  const token = getToken();
  const { propId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [mstrData, setMstrData] = useState([]);
  const [propDetails, setPropDetails] = useState(null);

  useEffect(() => {
    fetchSafData();
  }, [token]);

  useEffect(() => {
    if (propId) {
      fetchDetails();
    }
  }, [propId, token]);

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
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching master data:", error);
    }
  };

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
        token={token}
      />
    </div>
  );
}
