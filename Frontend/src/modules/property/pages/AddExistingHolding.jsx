import { useEffect, useState } from "react";
import { getToken } from "../../../utils/auth";
import { getSafMstrDataApi } from "../../../api/endpoints";
import _ from "lodash";
import { Spinner } from "@nextui-org/react";
import axios from "axios";
import AddExistingForm from "../component/AddExistingForm";

const AddExistingHolding = () => {
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
    <div className="bg-white shadow-lg mx-auto p-6 border rounded-lg container-fluid">
      <AddExistingForm
        formType={"Existing"}
        mstrData={mstrData}
        isLoading={isLoading}
        // propDetails={propDetails}
        token={token}
      />
    </div>
  );
};

export default AddExistingHolding;
