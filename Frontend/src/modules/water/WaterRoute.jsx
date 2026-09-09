import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import AdminLayout from "../../layout/AdminLayout";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import ApplyConnection from "./pages/ApplyConnection";
import PreviewPage from "./pages/PreviewPage";
import SearchApplication from "./pages/SearchApplication";
import ApplicationDetails from "./pages/ApplicationDetails";
import Inbox from "./pages/Inbox";
import WorkflowDetail from "./pages/WorkflowDetail";
import BTCInbox from "./pages/BTCInbox";
import EditApplication from "./pages/EditApplication";
import { waterAppDetailApi } from "../../api/endpoints";

const WaterRoute = () => {
  return (
    <>
      <Suspense
        fallback={
          <div className="p-6 text-center">
            <span className="inline-block border-4 border-t-transparent border-blue-600 rounded-full w-8 h-8 animate-spin loader"></span>
            <p className="mt-2">Loading...</p>
          </div>
        }
      >
        <AdminLayout>
          <Routes>
            <Route
              path="/apply-connection"
              element={
                <ProtectedRoute>
                  <ApplyConnection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/apply/preview"
              element={
                <ProtectedRoute>
                  <PreviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/search"
              element={
                <ProtectedRoute>
                  <SearchApplication />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/detail/:id"
              element={
                <ProtectedRoute>
                  <ApplicationDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/detail/:id/edit"
              element={
                <ProtectedRoute>
                  <EditApplication fetchApi={waterAppDetailApi} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/app/inbox"
              element={
                <ProtectedRoute>
                  <Inbox />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/btc/list"
              element={
                <ProtectedRoute>
                  <BTCInbox />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/wf/:from/:id"
              element={
                <ProtectedRoute>
                  <WorkflowDetail />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AdminLayout>
      </Suspense>
    </>
  );
};

export default WaterRoute;
