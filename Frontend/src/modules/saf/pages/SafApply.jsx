import { useEffect, useState } from "react";
import { getToken } from "../../../utils/auth";
import { getSafMstrDataApi } from "../../../api/endpoints";
import axios from "axios";
import { Spinner } from "@nextui-org/react";
import AssessmentForm from "../../property/component/AssessmentForm";

const SafApply = () => {
  const token = getToken();

  const [isLoading, setIsLoading] = useState(true);
  const [mstrData, setMstrData] = useState([]);

  useEffect(() => {
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
    fetchSafData();
  }, [token]);

  if (isLoading) {
    return (
      <div className="loading">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 bg-white shadow-lg mx-auto p-6 rounded-lg container-fluid">
      <AssessmentForm
        formType={"New Assessment"}
        mstrData={mstrData}
        isLoading={isLoading}
        token={token}
      />
    </div>
  );
};

export default SafApply;
