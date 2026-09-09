import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";
import NewApplication from "../modules/trade/pages/NewApplication";
import ApplicationPreview from "../modules/trade/pages/ApplicationPreview";
import ApplicationSearch from "../modules/trade/pages/ApplicationSearch";
import ApplicationDetails from "../modules/trade/pages/ApplicationDetails";
import TradeInbox from "../modules/trade/pages/TradeInbox";
import WorkflowDetail from "../modules/trade/pages/WorkflowDetail";
import RenewApplication from "../modules/trade/pages/RenewApplication";
import SurrendarApplication from "../modules/trade/pages/SurrendarApplication";
import AmedmentApplication from "../modules/trade/pages/AmedmentApplication";
import AdminLayout from "../layout/AdminLayout";
import ReportRoute from "../modules/trade/ReportRoute";

const TradeRoutes = () => {
  return (
    <>
      <Suspense
        fallback={
          <div className="p-6 text-center">
            <span className="inline-block border-4 border-t-transparent border-blue-600 rounded-full w-8 h-8 animate-spin loader"></span>
            <p className="mt-2">Loading...</p>
          </div>
        }
      />
      <AdminLayout title="Nagar Prishad Arval - SAF Module">
        <Routes>
          <Route path="/apply-license" element={<ProtectedRoute>
              <NewApplication/>
          </ProtectedRoute>}/>
          <Route path="/renew-license/:id" element={<ProtectedRoute>
            <RenewApplication/>
          </ProtectedRoute>}/>
          <Route path="/surrender-license/:id" element={<ProtectedRoute>
            <SurrendarApplication/>
          </ProtectedRoute>}/>
          <Route path="/amendment-license/:id" element={<ProtectedRoute>
            <AmedmentApplication/>
          </ProtectedRoute>}/>
          <Route path="/application-preview" element={<ProtectedRoute><ApplicationPreview/></ProtectedRoute>}/>
          <Route path="/search" element={<ProtectedRoute><ApplicationSearch/></ProtectedRoute>}/>
          <Route path="/details/:id" element={<ProtectedRoute>
            <ApplicationDetails/>
          </ProtectedRoute>}/>
          <Route path="/inbox" element={<ProtectedRoute>
            <TradeInbox/>
          </ProtectedRoute>}/>
          <Route path="/wf/:from/:itemId" element={<ProtectedRoute>
            <WorkflowDetail/>
          </ProtectedRoute>}/>
          <Route path="/report/*" element={<ReportRoute />} />
        </Routes>
      </AdminLayout>
    </>
  );
};

export default TradeRoutes;
