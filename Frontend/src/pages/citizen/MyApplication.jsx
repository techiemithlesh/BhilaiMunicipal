import { useEffect, useState } from "react";
import { citizenApplicationListApi } from "../../api/endpoints";
import axios from "axios";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import RenderTable from "../../components/citizen/settings/RenderTable";
import { statusColor } from "../../utils/common";

export default function MyApplication() {
  const token = useSelector((state) => state.citizenAuth.token);
  const [applications, setApplications] = useState([]);
  const [isFrozen, setIsFrozen] = useState(false);

  useEffect(() => {
    if (token) {
      fetchApplications();
    }
  }, [token]);

  const fetchApplications = async () => {
    setIsFrozen(true);
    try {
      const response = await axios.post(
        citizenApplicationListApi,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.status === true) {
        setApplications(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    }finally{
      setIsFrozen(false);
    }
  };

  return (
    <div className={`${isFrozen ? "pointer-events-none filter blur-sm" : ""}`}>
      {applications &&
      (applications.saf?.length ||
        applications.property?.length ||
        applications.waterApplication?.length ||
        applications.consumer?.length ||
        applications.tradeLicense?.length) ? (
        <div className="flex flex-col gap-6">
          {applications.saf?.length > 0 && (
            <RenderTable
              title="SAF Applications"
              columns={[
                { label: "SAF No", key: "safNo" },
                { label: "Assessment Type", key: "assessmentType" },
                { label: "Apply Date", key: "applyDate" },
                { label: "Status", key: "appStatus" },
                { label: "Due Amount", key: "bueAmount" },
                { label: "ULB", key: "ulbName" },
                { label: "View", key: "view" },
              ]}
              data={applications.saf}
              renderRow={(item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50 border-b">
                  <td className="px-3 py-2 border">{item.safNo}</td>
                  <td className="px-3 py-2 border">{item.assessmentType}</td>
                  <td className="px-3 py-2 border">{item.applyDate}</td>
                  <td className={`px-3 py-2 border ${statusColor(item.appStatus)}`}>{item.appStatus}</td>
                  <td className="px-3 py-2 border">{item.bueAmount || "—"}</td>
                  <td className="px-3 py-2 border">{item.ulbName}</td>
                  <td className="px-3 py-2 border text-center">
                    <Link
                      to={`/citizen/saf/details/${item?.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              )}
            />
          )}

          {applications.property?.length > 0 && (
            <RenderTable
              title="Holding Details"
              columns={[
                { label: "New Holding No", key: "newHoldingNo" },
                { label: "Holding No", key: "holdingNo" },
                { label: "Assessment Type", key: "assessmentType" },
                { label: "Due Amount", key: "bueAmount" },
                { label: "ULB", key: "ulbName" },
                { label: "View", key: "view" },
              ]}
              data={applications.property}
              renderRow={(item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50 border-b">
                  <td className="px-3 py-2 border">{item.newHoldingNo}</td>
                  <td className="px-3 py-2 border">{item.holdingNo}</td>
                  <td className="px-3 py-2 border">{item.assessmentType}</td>
                  <td className="px-3 py-2 border">{item.bueAmount || "—"}</td>
                  <td className="px-3 py-2 border">{item.ulbName}</td>
                  <td className="px-3 py-2 border text-center">
                    <Link
                      to={`/citizen/holding/details/${item?.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              )}
            />
          )}

          {applications.waterApplication?.length > 0 && (
            <RenderTable
              title="Water Applications"
              columns={[
                { label: "Application No", key: "applicationNo" },
                { label: "Connection Type", key: "connectionType" },
                { label: "Apply Date", key: "applyDate" },
                { label: "Status", key: "appStatus" },
                { label: "Due Amount", key: "bueAmount" },
                { label: "ULB", key: "ulbName" },
                { label: "View", key: "view" },
              ]}
              data={applications.waterApplication}
              renderRow={(item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50 border-b">
                  <td className="px-3 py-2 border">{item.applicationNo}</td>
                  <td className="px-3 py-2 border">{item.connectionType}</td>
                  <td className="px-3 py-2 border">{item.applyDate}</td>
                  <td className={`px-3 py-2 border ${statusColor(item.appStatus)}`}>{item.appStatus}</td>
                  <td className="px-3 py-2 border">{item.bueAmount || "—"}</td>
                  <td className="px-3 py-2 border">{item.ulbName}</td>
                  <td className="px-3 py-2 border text-center">
                    <Link
                      to={`/citizen/water/details/${item?.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              )}
            />
          )}

          {applications.consumer?.length > 0 && (
            <RenderTable
              title="Water Consumer"
              columns={[
                { label: "Consumer No", key: "consumerNo" },
                { label: "Category Type", key: "category" },
                { label: "Holding No", key: "newHoldingNo" },
                { label: "SAF No", key: "safNo" },
                { label: "Due Amount", key: "bueAmount" },
                { label: "ULB", key: "ulbName" },
                { label: "View", key: "view" },
              ]}
              data={applications.consumer}
              renderRow={(item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50 border-b">
                  <td className="px-3 py-2 border">{item.consumerNo}</td>
                  <td className="px-3 py-2 border">{item.category}</td>
                  <td className="px-3 py-2 border">{item.newHoldingNo}</td>
                  <td className={`px-3 py-2 border`}>{item.safNo}</td>
                  <td className="px-3 py-2 border">{item.bueAmount || "—"}</td>
                  <td className="px-3 py-2 border">{item.ulbName}</td>
                  <td className="px-3 py-2 border text-center">
                    <Link
                      to={`/citizen/water/consumer/details/${item?.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              )}
            />
          )}

          {applications.tradeLicense?.length > 0 && (
            <RenderTable
              title="Trade License"
              columns={[
                { label: "Application No", key: "applicationNo" },
                { label: "Application Type", key: "applicationType" },
                { label: "License No", key: "licenseNo" },
                { label: "Apply Date", key: "applyDate" },
                { label: "Status", key: "appStatus" },                
                { label: "Due Amount", key: "bueAmount" },
                { label: "ULB", key: "ulbName" },
                { label: "View", key: "view" },
              ]}
              data={applications.tradeLicense}
              renderRow={(item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50 border-b">
                  <td className="px-3 py-2 border">{item.applicationNo}</td>
                  <td className="px-3 py-2 border">{item.applicationType}</td>
                  <td className="px-3 py-2 border">{item.licenseNo}</td>
                  <td className="px-3 py-2 border">{item.applyDate}</td>
                  <td className={`px-3 py-2 border ${statusColor(item.appStatus)}`}>{item.appStatus}</td>
                  <td className="px-3 py-2 border">{item.bueAmount || "—"}</td>
                  <td className="px-3 py-2 border">{item.ulbName}</td>
                  <td className="px-3 py-2 border text-center">
                    <Link
                      to={`/citizen/trade/search/details/${item?.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              )}
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center py-16 text-center">
          <h2 className="font-bold text-gray-800 text-2xl">
            No Applications Found
          </h2>
          <p className="mt-2 text-gray-500">
            Looks like you haven&apos;t submitted any applications yet.
          </p>
        </div>
      )}
      {isFrozen && (
        <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/60 rounded">
          <div className="font-semibold text-gray-800 text-lg">
            Processing...
          </div>
        </div>
      )}
    </div>
  );
}
