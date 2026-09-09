import { Suspense } from "react";
import CashVerification from "./CashVerification";
import AdminLayout from "../../layout/AdminLayout";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import CollectionDetails from "./CollectionDetails";
import BankReconciliation from "./BankReconciliation";
import ModeWiseReport from "./ModeWiseReport";
import UpdatePaymentMode from "./UpdatePaymentMode";
import TranDeactivation from "./TranDeactivation";
import TranDeactivatedList from "./TranDeactivatedList";
import DateWiseCollection from "./DateWiseCollection";

export default function AccountsRoute() {
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
              path="/cash-verification"
              element={
                <ProtectedRoute>
                  <CashVerification />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cash-verification/view"
              element={
                <ProtectedRoute>
                  <CollectionDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bank-reconciliation"
              element={
                <ProtectedRoute>
                  <BankReconciliation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/update-payment-mode"
              element={
                <ProtectedRoute>
                  <UpdatePaymentMode />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deactivate/transaction"
              element={
                <ProtectedRoute>
                  <TranDeactivation />
                </ProtectedRoute>
              }
            />

            <Route
              path="/deactivate/transaction/list"
              element={
                <ProtectedRoute>
                  <TranDeactivatedList />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/collection-summary"
              element={
                <ProtectedRoute>
                  <ModeWiseReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/date-wise/collection"
              element={
                <ProtectedRoute>
                  <DateWiseCollection />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AdminLayout>
      </Suspense>
    </>
  );
}
