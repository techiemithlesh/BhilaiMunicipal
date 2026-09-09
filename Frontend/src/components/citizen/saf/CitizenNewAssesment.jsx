import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Spinner } from "@nextui-org/react";
import axios from "axios";
import { getSafMstrDataApi } from "../../../api/endpoints";
import CitizenSafAssessment from "./CitizenSafAssessment";

const ulbId = import.meta.env.VITE_REACT_APP_ULB_ID;

export default function CitizenNewAssesment() {
  const token = useSelector((state) => state.citizenAuth.token);
  const [isLoading, setIsLoading] = useState(true);
  const [mstrData, setMstrData] = useState([]);

  useEffect(() => {
    const fetchSafData = async () => {
      try {
        const res = await axios.post(
          getSafMstrDataApi,
          {
            ulbId: ulbId,
          },
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
    <div>
      <CitizenSafAssessment
        mstrData={mstrData}
        isLoading={isLoading}
        formType={"new assessment"}
      />
    </div>
  );
}
