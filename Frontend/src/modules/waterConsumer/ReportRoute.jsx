import React from 'react'
import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import CollectionReports from './pages/CollectionReports';
import PaymentModeSummary from './pages/PaymentModeSummary';
import LevelWisePendingApp from './pages/LevelWisePendingApp';
import AppPendingList from './pages/AppPendingList';
import RoleUserWisePendingApp from './pages/RoleUserWisePendingApp';
import WardWiseConsumer from './pages/WardWiseConsumer';
import WardWiseDcb from './pages/WardWiseDcb';
import ConsumerWiseDcb from './pages/ConsumerWiseDcb';

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
                <LevelWisePendingApp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/level/user/pending"
            element={
              <ProtectedRoute>
                <AppPendingList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/level/user/wise/pending"
            element={
              <ProtectedRoute>
                <RoleUserWisePendingApp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ward/wise/consumer"
            element={
              <ProtectedRoute>
                <WardWiseConsumer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ward/wise/dcb"
            element={
              <ProtectedRoute>
                <WardWiseDcb />
              </ProtectedRoute>
            }
          />
          <Route
            path="/consumer/wise/dcb"
            element={
              <ProtectedRoute>
                <ConsumerWiseDcb />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}

export default ReportRoute
