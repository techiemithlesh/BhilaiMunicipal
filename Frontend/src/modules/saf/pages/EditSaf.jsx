import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getSafMstrDataApi,
  safApplicationDetailsApi,
} from "../../../api/endpoints";
import { getToken } from "../../../utils/auth";
import { Spinner } from "@nextui-org/react";
import AssessmentForm from "../../property/component/AssessmentForm";

export default function EditSaf() {
  const token = getToken();
  const { safDtlId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [mstrData, setMstrData] = useState([]);
  const [safDetails, setSafDetails] = useState(null);

  useEffect(() => {
    fetchSafData();
  }, [token]);

  useEffect(() => {
    if (safDtlId) {
      fetchDetails();
    }
  }, [safDtlId, token]);

  const fetchDetails = async () => {
    if (!token) {
      console.warn("No token found.");
      return;
    }

    try {
      const response = await axios.post(
        safApplicationDetailsApi,
        { id: safDtlId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = response.data?.data;
      setSafDetails(data);
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
        propDetails={safDetails}
        isEdit={true}
        token={token}
      />
    </div>
  );
}
