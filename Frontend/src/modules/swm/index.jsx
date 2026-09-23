import { Suspense } from "react";
import AdminLayout from "../../layout/AdminLayout";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import AddConsumer from "./pages/AddConsumer";
import CategoryList from "./pages/CategoryList";
import SubCategoryList from "./pages/SubCategoryList";
import SearchConsumer from "./pages/SearchConsumer";
import ConsumerDetails from "./pages/ConsumerDetails";
import CollectionReport from "./pages/CollectionReports";
import PaymentModeSummary from './pages/PaymentModeSummary';
import WardWiseConsumer from "./pages/WardWiseConsumer";
import WardWiseDcb from "./pages/WardWiseDcb";
import ConsumerWiseDcb from "./pages/ConsumerWiseDcb";
import TeamSummary from "./pages/TeamSummary";
import DueConsumer from "./pages/DueConsumerList";
import CategoryTypeConsumer from "./pages/CategoryTypeConsumer";
import DateWiseCollection from "./pages/DateWiseCollection";
import BulkPaymentReceipt from "./pages/BulkPaymentReceipt";
import DateWiseVisitingReport from "./pages/DateWiseVisitingReport";
import VisitingReport from "./pages/VisitingReport";
import RFIDTag from "./pages/RFIDTag";
import WardWiseTodayWastCollection from "./pages/WardWiseTodayWastCollection";
import TodayWastCollection from "./pages/TodayWastCollection";
import DateWiseConsumerAdded from "./pages/DateWiseConsumerAdded";
import FeedBackMstrList from "./pages/FeedBackMstrList";


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
              path="/category"
              element={
                <ProtectedRoute>
                  <CategoryList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sub-category"
              element={
                <ProtectedRoute>
                  <SubCategoryList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <ProtectedRoute>
                  <FeedBackMstrList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add"
              element={
                <ProtectedRoute>
                  <AddConsumer />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <SearchConsumer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dtl/:id"
              element={
                <ProtectedRoute>
                  <ConsumerDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bulk/payment/receipt"
              element={
                <ProtectedRoute>
                  <BulkPaymentReceipt />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/collection"
              element={
                <ProtectedRoute>
                  <CollectionReport />
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
              path="/report/date-wise-collation"
              element={
                <ProtectedRoute>
                  <DateWiseCollection />
                </ProtectedRoute>
              }
            />
            

            <Route
              path="/report/ward/wise/consumer"
              element={
                <ProtectedRoute>
                  <WardWiseConsumer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/ward/wise/dcb"
              element={
                <ProtectedRoute>
                  <WardWiseDcb />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/consumer/wise/dcb"
              element={
                <ProtectedRoute>
                  <ConsumerWiseDcb />
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

            <Route
              path="/report/due-consumer"
              element={
                <ProtectedRoute>
                  <DueConsumer />
                </ProtectedRoute>
              }
            />

            <Route
              path="/report/consumer-type-list"
              element={
                <ProtectedRoute>
                  <CategoryTypeConsumer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/day-wise-visiting"
              element={
                <ProtectedRoute>
                  <DateWiseVisitingReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/consumer-visiting"
              element={
                <ProtectedRoute>
                  <VisitingReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/rf-id"
              element={
                <ProtectedRoute>
                  <RFIDTag />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/ward-wise-wast-collection"
              element={
                <ProtectedRoute>
                  <WardWiseTodayWastCollection />
                </ProtectedRoute>
              }
            />

            <Route
              path="/report/today-wast-collection"
              element={
                <ProtectedRoute>
                  <TodayWastCollection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/date-wise-consumer"
              element={
                <ProtectedRoute>
                  <DateWiseConsumerAdded />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AdminLayout>
      </Suspense>
    </>
  );
}

export default index;
