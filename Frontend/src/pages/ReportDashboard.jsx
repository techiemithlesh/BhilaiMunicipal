import { useEffect, useState } from "react";
import { Card, CardContent } from "../components/common/Card";
import AdminLayout from "../layout/AdminLayout";
import { getToken } from "../utils/auth";
import axios from "axios";
import {
  appliedSafApi,
  holdingDemandCollectionDueApi,
  roleWisePendingApi,
} from "../api/endpoints";
import ColorWaveLoader from "../components/common/ColorWaveLoader";
import { getShortRole } from "../utils/common";

const DashboardCard = ({ color, title, value, loading, count }) => (
  <Card
    className="shadow-md rounded-2xl"
    style={{ borderLeft: `6px solid ${color}` }}
  >
    <CardContent className="flex flex-col p-4">
      {/* Title with Badge */}
      <div className="inline-block relative w-fit">
        <span className="font-semibold text-lg">{title}</span>
        {count > 0 && (
          <span className="-top-2 -right-3 absolute bg-red-500 shadow-md px-2 py-0.5 rounded-full font-bold text-white text-xs">
            {count}
          </span>
        )}
      </div>

      {/* Value or Loader */}
      <div className="flex items-center mt-2 min-h-[32px]">
        {loading ? (
          <ColorWaveLoader bars={9} height={26} />
        ) : (
          <span className="font-bold text-2xl">{value}</span>
        )}
      </div>
    </CardContent>
  </Card>
);

const StatBox = ({ label, value, loading }) => (
  <div className="flex-1 bg-white shadow p-4 rounded-xl text-center">
    {loading ? (
      <ColorWaveLoader bars={9} height={26} />
    ) : (
      <p className="font-semibold text-lg">{value}</p>
    )}
    <p className="text-gray-500 text-sm">{label}</p>
  </div>
);

const PendingBox = ({id, role, value, loading }) => (
  <div className="flex flex-1 justify-between items-center bg-sky-100 shadow p-4 rounded-xl">
    {loading ? (
      <ColorWaveLoader bars={9} height={26} />
    ) : (
      <>
        <a href={`/Property/report/level/user/pending?roleId[]=${id}`}>
          <div className="flex items-center gap-2">
            <div className="flex justify-center items-center bg-blue-500 rounded-full w-10 h-10 text-white">
              {getShortRole(role)}
            </div>
            <span className="font-semibold">{role}</span>
          </div>
          <span className="bg-blue-900 px-3 py-1 rounded-lg text-white">
            {value}
          </span>
        </a>
      </>
    )}
  </div>
);

function ReportDashboard() {
  const [holdingDemandCollectionDue, setHoldingDemandCollectionDue] = useState(
    {}
  );
  const [isHoldingDemandLoading, setIsHoldingDemandLoading] = useState(false);
  const [appliedSaf, setAppliedSaf] = useState({});
  const [isAppliedSafLoading, setIsAppliedSafLoading] = useState(false);
  const [levelSafPending, setLevelSafPending] = useState([]);
  const token = getToken();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsHoldingDemandLoading(true);
        const response = await axios.post(
          holdingDemandCollectionDueApi,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response?.data?.status) {
          setHoldingDemandCollectionDue(response.data.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsHoldingDemandLoading(false);
      }
    };

    fetchData();
  }, [token]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsAppliedSafLoading(true);
        const response = await axios.post(
          appliedSafApi,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response?.data?.status) {
          setAppliedSaf(response.data.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsAppliedSafLoading(false);
      }
    };

    fetchData();
  }, [token]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.post(
          roleWisePendingApi,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response?.data?.status) {
          setLevelSafPending(response.data.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
      }
    };

    fetchData();
  }, [token]);

  return (
    <AdminLayout>
      <div className="space-y-6 bg-gray-50 p-6 min-h-screen">
        <div className="bg-white shadow p-6 rounded-2xl">
          <h2 className="flex justify-center items-center mb-4 font-bold text-blue-500 text-2xl">
            Property
          </h2>
          <div className="flex flex-col gap-4">
            {/* Header Cards */}
            <div className="gap-4 grid md:grid-cols-4">
              <DashboardCard
                color="#0ea5e9"
                title="Total Demand"
                count={holdingDemandCollectionDue?.totalProperty || 0}
                value={`₹ ${holdingDemandCollectionDue?.totalTax || 0}`}
                loading={isHoldingDemandLoading}
              />
              <DashboardCard
                color="#22c55e"
                title="Total Collection"
                count={holdingDemandCollectionDue?.totalCollectionProperty || 0}
                value={`₹ ${holdingDemandCollectionDue?.totalCollection || 0}`}
                loading={isHoldingDemandLoading}
              />
              <DashboardCard
                color="#f59e0b"
                title="Total Due"
                count={
                  holdingDemandCollectionDue?.totalOutstandingProperty || 0
                }
                value={`₹ ${holdingDemandCollectionDue?.totalOutstanding || 0}`}
                loading={isHoldingDemandLoading}
              />
              <DashboardCard
                color="#f59e0b"
                title="Total Advance"
                count={
                  holdingDemandCollectionDue?.totalOutstandingAdvanceProperty ||
                  0
                }
                value={`₹ ${
                  holdingDemandCollectionDue?.totalOutstandingAdvance || 0
                }`}
                loading={isHoldingDemandLoading}
              />
            </div>

            {/* Current Financial Year */}
            <div className="flex flex-col gap-4 bg-white shadow p-6 rounded-2xl">
              <h2 className="font-bold text-lg">Current Year Apply SAF</h2>
              <div className="gap-4 grid grid-cols-2 md:grid-cols-4">
                <StatBox
                  label="Total SAF"
                  value={appliedSaf?.totalProperty || 0}
                  loading={isAppliedSafLoading}
                />
                <StatBox
                  label="New Assessment"
                  value={appliedSaf?.newAssessmentProperty || 0}
                  loading={isAppliedSafLoading}
                />
                <StatBox
                  label="Reassessment"
                  value={appliedSaf?.reAssessmentProperty || 0}
                  loading={isAppliedSafLoading}
                />
                <StatBox
                  label="Mutation"
                  value={appliedSaf?.mutationProperty || 0}
                  loading={isAppliedSafLoading}
                />
              </div>
            </div>

            {/* Pending Report */}
            <div className="bg-white shadow p-6 rounded-2xl">
              <h2 className="mb-4 font-bold text-lg">Saf Level Pending</h2>
              <div className="gap-4 grid md:grid-cols-4">
                {levelSafPending?.length == 0 ? (
                  <ColorWaveLoader bars={9} height={26} />
                ) : (
                  levelSafPending?.map((level, index) => (
                    <PendingBox
                      key={index}
                      id={level?.id}
                      role={level?.roleName}
                      value={level?.totalSaf}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Last Financial Year */}
        {/* <div className="bg-white shadow p-6 rounded-2xl">
          <h2 className="mb-4 font-bold text-lg">
            Upto Last Financial Year 2021-2022
          </h2>
          <div className="gap-4 grid grid-cols-2 md:grid-cols-4">
            <StatBox label="Total SAF" value="221590" />
            <StatBox label="New Assessment" value="131689" />
            <StatBox label="Reassessment" value="62156" />
            <StatBox label="Mutation" value="27734" />
            <StatBox label="Mutation With Reassessment" value="1" />
            <StatBox label="Mutation with Reassessment" value="10" />
          </div>
        </div> */}

        {/* Pending Report - Last Year */}
        {/* <div className="bg-white shadow p-6 rounded-2xl">
          <h2 className="mb-4 font-bold text-lg">Property Pending Report</h2>
          <div className="gap-4 grid md:grid-cols-4">
            <PendingBox role="Dealing Assistant" value="14" />
            <PendingBox role="Tax Collector" value="2143" />
            <PendingBox role="Section Head" value="335" />
            <PendingBox role="Executive Officer" value="67" />
          </div>
        </div> */}
      </div>
    </AdminLayout>
  );
}

export default ReportDashboard;
