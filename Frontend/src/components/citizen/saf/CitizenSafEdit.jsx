import { useEffect, useState } from "react";
import axios from "axios";
import { Spinner } from "@nextui-org/react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  getSafMstrDataApi,
  safApplicationDetailsApi,
} from "../../../api/endpoints";
import CitizenSafAssessment from "./CitizenSafAssessment";

const ulbId = import.meta.env.VITE_REACT_APP_ULB_ID;

const CitizenSafEdit = () => {
  const { safId } = useParams();
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
        safApplicationDetailsApi,
        { id: safId, ulbId: ulbId },
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
    if (safId) {
      fetchDetails();
    }
  }, [safId, token]);

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
      <CitizenSafAssessment
        mstrData={mstrData}
        isLoading={isLoading}
        propDetails={propDetails}
        formType={"edit"}
        token={token}
        ulbId={ulbId}
      />
    </div>
  );
};

export default CitizenSafEdit;
