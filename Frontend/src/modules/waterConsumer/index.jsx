import { Suspense } from "react";
import AdminLayout from "../../layout/AdminLayout";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import SearchConsumer from "./pages/SearchConsumer";
import ConsumerDetails from "./pages/ConsumerDetails";
import EditApplication from "../water/pages/EditApplication";
import { waterConsumerDetailApi } from "../../api/endpoints";
import ReportRoute from "./ReportRoute";

function index() {
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
              path="/search"
              element={
                <ProtectedRoute>
                  <SearchConsumer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/detail/:id"
              element={
                <ProtectedRoute>
                  <ConsumerDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/detail/:id/edit"
              element={
                <ProtectedRoute>
                  <EditApplication fetchApi={waterConsumerDetailApi} />
                </ProtectedRoute>
              }
            />
            <Route path="/report/*" element={<ReportRoute />} />
          </Routes>
        </AdminLayout>
      </Suspense>
    </>
  );
}

export default index;
