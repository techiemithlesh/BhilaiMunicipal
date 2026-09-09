import { useEffect, useState } from "react";
import {
  BASE_URL,
  getWardListApi,
  getWardMapApi,
} from "../../../api/endpoints";
import { getToken } from "../../../utils/auth";
import { motion } from "framer-motion";
import { Spinner } from "@nextui-org/react";
import { modalVariants } from "../../../utils/motionVariable";
import { FaTimes } from "react-icons/fa";
import axios, { all } from "axios";
import toast from "react-hot-toast";

export const WardMapModal = ({ user, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [wardList, setWardList] = useState([]);
  const [selectedWards, setSelectedWards] = useState({
    wardIds: [],
  });

  const { errors, setErrors } = useState({});

  const token = getToken();

  useEffect(() => {
    const fetchCurrentWardMap = async () => {
      try {
        const currentWardMapped = await axios
          .post(
            getWardMapApi,
            {
              userId: user.id,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
          .then((res) => {
            if (res.data.status === true) {
              const respData = res.data.data;
              setSelectedWards(respData.map((ward) => ward.id));
            }
          });
      } catch (error) {
        console.error("Error", error);
      }
    };
    if (user?.id) {
      fetchCurrentWardMap();
    }
  }, [token, user?.id]);

  useEffect(() => {
    const fetchAllWard = async () => {
      try {
        const response = await axios.get(getWardListApi, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            all: "all",
          },
        });

        setWardList(response.data.data);
      } catch (error) {
        console.error("Error fetching all wards:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchAllWard();
    }
  }, [token]);

  const handleCheckboxChange = (wardId) => {
    setSelectedWards((prevSelectedWards) =>
      prevSelectedWards.includes(wardId)
        ? prevSelectedWards.filter((id) => id !== wardId)
        : [...prevSelectedWards, wardId]
    );
  };

  const handleFormSubmit = async () => {
    const data = {
      userId: user.id,
      wardIds: selectedWards.map((id) => ({
        id,
        lockStatus: 0,
      })),
    };

    try {
      const updateWardApi = `${BASE_URL}/api/user-ward-map`;
      const response = await axios
        .post(updateWardApi, data, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          if (res.data.status === true) {
            toast.success(res.data.message, {
              position: "top-right",
            });
            onClose();
          } else {
            setErrors(res.data.errors);
          }
        });
    } catch (error) {
      console.error("Error", error);
    }
  };

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-75 p-4">
      {isLoading ? (
        <div className="loading">
          <Spinner />
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={modalVariants}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-lg p-6 rounded-lg w-full max-w-3xl sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">Update Ward Map</h2>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={onClose}
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* MAIN CONTAINER DIV START HERE */}

          <div className="p-2 w-full">
            <div className="mb-4">
              <div className="flex justify-content-between">
                <div className="flex-1">
                  <label className="block mb-2 font-semibold">Ward List</label>
                </div>

                <button
                  className="px-4 py-2 btn btn-primary"
                  onClick={handleFormSubmit}
                >
                  Update
                </button>
              </div>

              {errors &&
                Object.keys(errors).map((key) => (
                  <li key={key} className="text-danger-300">
                    {errors[key].join(", ")}
                  </li>
                ))}

              <div className="gap-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 my-4 max-h-72 overflow-y-auto">
                {wardList.map((ward) => (
                  <div key={ward.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`ward-${ward.id}`}
                      checked={selectedWards.includes(ward.id)}
                      onChange={() => handleCheckboxChange(ward.id)}
                      className="mr-2"
                    />
                    <label htmlFor={`ward-${ward.id}`}>{ward.wardNo}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
