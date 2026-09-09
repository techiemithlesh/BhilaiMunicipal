import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { FaWater, FaHome, FaTrash, FaUser, FaPhone, FaEnvelope, FaChessBishop, FaStoreAlt } from "react-icons/fa";
import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "../../components/common/Card";
import { citizenDashboardApi, citizenProfileApi } from "../../api/endpoints";
import { getToken } from '../../utils/auth';
import defaultAvatar from "../../assets/images/default-avatar.jpg";
import CircularProgressAvatar from "../../assets/images/CircularProgressAvatar";
export default function CitizenDashboard() {

  const token  = getToken();

  const [citizenInfo, setCitizenInfo] = useState({});
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.post(
        citizenDashboardApi,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.status === true) {
        setDashboardData(res.data.data || {});
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const res = await axios.post(
        citizenProfileApi,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res?.data?.data) {
        setCitizenInfo(res.data.data);
      }
    } catch (err) {
      console.error("User info fetch error:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchDashboardData(), fetchUserInfo()]);
      setLoading(false);
    };
    loadData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-600">
        Loading citizen dashboard...
      </div>
    );
  }

  // console.log("citizen profile", citizenInfo);
  // console.log("dashboard", dashboardData);

  const fullName =
    citizenInfo?.name && citizenInfo.name.trim() !== ""
      ? citizenInfo.name
      : `${citizenInfo?.firstName || ""} ${citizenInfo?.middleName || ""} ${
          citizenInfo?.lastName || ""
        }`.trim();

  const taxData = [
    {
      name: "SAF Due",
      value: parseFloat(dashboardData?.safDue || 0),
      color: "#6366f1",
    },
    {
      name: "Property Due",
      value: parseFloat(dashboardData?.propertyDue || 0),
      color: "#10b981",
    },
    {
      name: "Water Application Due",
      value: parseFloat(dashboardData?.waterApplicationDue || 0),
      color: "#0ea5e9",
    },
    {
      name: "Trade License Due",
      value: parseFloat(dashboardData?.tradeLicenseDue || 0),
      color: "#f59e0b",
    },
    {
      name: "Consumer Due",
      value: parseFloat(dashboardData?.consumerDue || 0),
      color: "#ef4444",
    },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6 p-6">
      {/* <h1 className="mb-4 font-bold text-gray-800 text-3xl">
        Citizen Dashboard
      </h1> */}

      {/* Profile Info */}
      <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
        <Card>
          <CardContent className="p-2">
            <div className="flex items-center space-x-4">
              {/* <FaUser className="text-indigo-600 text-4xl" /> */}
              <div className="relative shadow rounded-full w-14 h-14 overflow-hidden cursor-pointer">
                <CircularProgressAvatar
                  progress={citizenInfo?.profileCompletion}
                  imageUrl={citizenInfo?.userImg ||defaultAvatar}
                  fallbackText="Citizen"
                  hoverText={`Progress: ${citizenInfo?.profileCompletion}%`}
                />
              </div>
              <div>
                <h2 className="font-semibold text-xl">
                  {fullName || "Citizen"}
                </h2>
                <p className="flex items-center gap-2 text-gray-600">
                  <FaPhone className="text-blue-500" />
                  <span className="font-medium">Phone:</span>
                  <span className="font-semibold">{citizenInfo?.phoneNo || "N/A"}</span>
                </p>
                <p className="flex items-center gap-2 text-gray-600">
                  <FaEnvelope className="text-blue-500" />
                  <span className="font-medium">Email:</span>
                  <span className="font-semibold">{citizenInfo?.email || "N/A"}</span>
                </p>
                <p className="flex items-center gap-2 text-gray-600">
                  <FaUser className="text-blue-500" />
                  <span className="font-medium">Parent:</span>
                  <span className="font-semibold">{citizenInfo?.guardianName || "N/A"}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Distribution Pie Chart */}
        <Card>
          <CardContent className="p-2">
            <h3 className="mb-1 font-semibold text-lg">Tax Distribution</h3>
            <ResponsiveContainer width="100%" height={240} >
              <PieChart className="h-fit">
                <Pie
                  data={taxData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {taxData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tax Cards */}
      <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center space-x-4 p-4">
            <FaWater className="text-sky-500 text-3xl" />
            <div>
              <p className="text-gray-500">Water Application Due</p>
              <h3 className="font-bold text-xl">
                ₹ {(parseFloat(dashboardData?.waterApplicationDue)+parseFloat(dashboardData?.consumerDue)) || "0.00"}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center space-x-4 p-4">
            <FaHome className="text-emerald-500 text-3xl" />
            <div>
              <p className="text-gray-500">Property Due</p>
              <h3 className="font-bold text-xl">
                ₹ {(parseFloat(dashboardData?.propertyDue) + parseFloat(dashboardData?.safDue)) || "0.00"}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center space-x-4 p-4">
            <FaStoreAlt className="text-yellow-500 text-3xl" />
            <div>
              <p className="text-gray-500">Trade Due</p>
              <h3 className="font-bold text-xl">
                ₹ {dashboardData?.tradeLicenseDue || "0.00"}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Summary */}
      <div className="mt-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-2 font-semibold text-lg">Outstanding Summary</h3>
            <p className="text-gray-700 text-lg">
              Total Due: ₹{dashboardData?.totalDue || "0.00"}
            </p>
            <p className="mt-1 text-gray-500 text-sm">
              Last payment received on{" "}
              {dashboardData?.lastPaymentDate || "N/A"} for{" "}
              {dashboardData?.module?.toUpperCase() || "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
