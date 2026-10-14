import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import AdminLayout from "../../layout/AdminLayout";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import AddShopRent from "./pages/AddShopRent";

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
        </Routes>
      </AdminLayout>
    </Suspense>
  );
}

export default index;
