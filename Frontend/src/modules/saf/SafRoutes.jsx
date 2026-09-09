import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import AdminLayout from "../../layout/AdminLayout";
import List from "../saf/pages/List";
import Details from "./pages/Details";
import Inbox from "./pages/Inbox";
import Wf from "./pages/Wf";
import SafApply from "./pages/SafApply";
import Preview from "./components/Preview";
import EditSaf from "./pages/EditSaf";
import SafAutoApprove from "./pages/SafAutoApprove";

const SafRoutes = () => {
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
        <AdminLayout title="Nagar Prishad Arval - SAF Module">
          <Routes>
            <Route
              path="/list"
              element={
                <ProtectedRoute>
                  <List />
                </ProtectedRoute>
              }
            />
            <Route
              path="/apply/assesment"
              element={
                <ProtectedRoute>
                  <SafApply />
                </ProtectedRoute>
              }
            />
            <Route
              path="/apply/preview"
              element={
                <ProtectedRoute>
                  <Preview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/details/:safDtlId"
              element={
                <ProtectedRoute>
                  <Details />
                </ProtectedRoute>
              }
            />
            <Route
              path="/details/:safDtlId/edit"
              element={
                <ProtectedRoute>
                  <EditSaf />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inbox"
              element={
                <ProtectedRoute>
                  <Inbox />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wf/:from/:safDtlId"
              element={
                <ProtectedRoute>
                  <Wf />
                </ProtectedRoute>
              }
            />

            <Route
              path="/auto-forward-list"
              element={
                <ProtectedRoute>
                  <SafAutoApprove />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AdminLayout>
      </Suspense>
    </>
  );
};

export default SafRoutes;
