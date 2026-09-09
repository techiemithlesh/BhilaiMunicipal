import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getToken } from "../../../utils/auth";
import { Spinner } from "@nextui-org/react";
import { FaTimes } from "react-icons/fa";
import axios from "axios";
import { roleApi } from "../../../api/endpoints";
import { modalVariants } from "../../../utils/motionVariable";
import toast from "react-hot-toast";

export const RoleEditModal = ({ onClose, user }) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    roleId: [],
  });

  const token = getToken();

  useEffect(() => {
    const fetchCurrentRole = async () => {
      const userMappedRole = `${
        import.meta.env.VITE_REACT_APP_BACKEND_API
      }/api/get-user-role-map`;
      try {
        const res = await axios.post(
          userMappedRole,
          { userId: user.id },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.data.status === true) {
          const existingRoles = res.data.data;
          setFormData((prevFormData) => ({
            ...prevFormData,
            roleId: existingRoles.map((role) => ({
              id: role.id,
              lockStatus: true,
            })),
          }));
        } else {
          console.error("Failed to fetch current roles", res.data.errors);
        }
      } catch (error) {
        console.error("Error fetching current roles:", error);
      }
    };
    fetchCurrentRole();
  }, [token, user.id]);

  useEffect(() => {
    const fetchRoles = async () => {
      const res = await axios.get(roleApi, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          all: "all",
        },
      });
      if (res.data.status === true) {
        const data = res.data.data;
        setData(data);
        setIsLoading(false);
      } else {
        console.error(res.data.errors);
      }
    };
    fetchRoles();
  }, [token]);

  const handleChange = (e) => {
    const { value, checked } = e.target;
    const roleId = parseInt(value);
    const lockStatus = checked;

    setFormData((prevFormData) => {
      const updatedRoles = prevFormData.roleId.filter(
        (role) => role.id !== roleId
      );
      if (checked) {
        updatedRoles.push({ id: roleId, lockStatus });
      }
      return {
        ...prevFormData,
        roleId: updatedRoles,
      };
    });
  };

  const handleFormSubmit = async () => {
    const updateRoleApi = `${
      import.meta.env.VITE_REACT_APP_BACKEND_API
    }/api/user-role-map`;
    try {
      const res = await axios.post(
        updateRoleApi,
        {
          userId: user.id,
          roleId: formData.roleId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.status === true) {
        toast.success(res.data.message, {
          position: "top-right",
        });
        onClose();
      } else {
        console.error("Update failed", res.data.errors);
      }
    } catch (error) {
      console.error("Error updating role:", error);
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
            <h2 className="font-bold text-lg">Edit Role</h2>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={onClose}
            >
              <FaTimes size={20} />
            </button>
          </div>

          <div className="flex flex-wrap mb-4">
            <div className="flex flex-col items-center p-2 w-full">
              <img
                src={
                  user?.userImg
                    ? user.userImg
                    : "https://via.placeholder.com/150"
                }
                loading="lazy"
                alt="User"
                className="border border-red-50 rounded-full w-24 h-24 object-cover"
              />
              <p className="mt-2 font-bold text-xl text-center">
                {user?.userName ? user.userName : "NA"}
              </p>
              <p className="text-gray-600 text-center">
                {user?.role ? user.role[0] : "NA"}
              </p>
            </div>
          </div>

          <div className="p-2 w-full">
            <div className="mb-4">
              <div className="flex justify-content-between">
                <div className="flex-1">
                  <label className="block mb-2 font-semibold">Role Map</label>
                </div>

                <button
                  className="mb-4 px-4 py-2 btn btn-primary"
                  onClick={handleFormSubmit}
                >
                  Update
                </button>
              </div>

              <div className="gap-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 my-4 max-h-72 overflow-y-auto">
                {data.map((item) => (
                  <div key={item.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`role-${item.id}`}
                      value={item.id}
                      checked={formData.roleId.some(
                        (role) => role.id === item.id
                      )}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <label htmlFor={`role-${item.id}`}>{item.roleName}</label>
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
// export default RoleEditModal;
