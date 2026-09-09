import React, { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import CollectionReports from './pages/CollectionReports';
import PaymentModeSummary from './pages/PaymentModeSummary';
import LevelWisePending from './pages/LevelWisePending';
import TradePendingList from './pages/TradePendingList';
import RoleUserWisePendingTrade from './pages/RoleUserWisePendingTrade';
import ValidAndExpired from './pages/ValidAndExpired';

function ReportRoute() {
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
        <Routes>
          <Route
            path="/collection"
            element={
              <ProtectedRoute>
                <CollectionReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/mode/summary"
            element={
              <ProtectedRoute>
                <PaymentModeSummary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/level/wise/pending"
            element={
              <ProtectedRoute>
                <LevelWisePending />
              </ProtectedRoute>
            }
          />
          <Route
            path="/level/user/pending"
            element={
              <ProtectedRoute>
                <TradePendingList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/level/user/wise/pending"
            element={
              <ProtectedRoute>
                <RoleUserWisePendingTrade />
              </ProtectedRoute>
            }
          /> 
          <Route
            path="/valid-and-expired"
            element={
              <ProtectedRoute>
                <ValidAndExpired />
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="/holding/wise/dcb"
            element={
              <ProtectedRoute>
                <PropertyWiseDcb />
              </ProtectedRoute>
            }
          /> */}
        </Routes>
      </Suspense>
    </>
  );
}

export default ReportRoute
