import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import AdminLayout from "../../layout/AdminLayout";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import AddShopRent from "./pages/AddShopRent";
import SearchDtl from "./pages/SearchDtl";
import ShopDetails from "./pages/ShopDetails";
import CollectionReports from "./pages/CollectionReports";
import PaymentModeSummary from "./pages/PaymentModeSummary";
import TeamSummary from "./pages/TeamSummary";

function index() {
  return (
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
            path="/add"
            element={
              <ProtectedRoute>
                <AddShopRent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchDtl />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dtl/:id"
            element={
              <ProtectedRoute>
                <ShopDetails />
              </ProtectedRoute>
            }
          />
          <Route
              path="/report/collection"
              element={
                <ProtectedRoute>
                  <CollectionReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/payment/mode/summary"
              element={
                <ProtectedRoute>
                  <PaymentModeSummary />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/team/summary"
              element={
                <ProtectedRoute>
                  <TeamSummary />
                </ProtectedRoute>
              }
            />
        </Routes>
      </AdminLayout>
    </Suspense>
  );
}

export default index;
