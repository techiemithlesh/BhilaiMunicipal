import { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { Toaster } from "react-hot-toast";
import { getBrowserInfo } from "./utils/browserInfo";
import "./index.scss";
import { LoadingProvider } from "./contexts/LoadingContext";
import LoadingOverlay from "./components/common/LoadingOverlay";
import CitizenAuth from "./pages/citizen/CitizenAuth";
import Layout from "./layout/Layout";
import { MenuProvider } from "./components/common/MenuContext";
import MaintenancePage from "./Maintenance.jsx";

const PropertyRoutes = lazy(() => import("./modules/property/PropertyRoutes"));
const UserRoutes = lazy(() => import("./modules/user/userRoutes"));
const SafRoutes = lazy(() => import("./modules/saf/SafRoutes"));
const SettingRoutes = lazy(() => import("./modules/settings"));
const SafPaymentReceipt = lazy(() => import("./modules/saf/pages/SafPaymentReceipt"));
const SafMemoReceipt = lazy(() => import("./modules/saf/pages/SafMemoReceipt"));
const CitizenRoute = lazy(() => import("./pages/citizen/CitizenRoute"));
const WaterRoute = lazy(() => import("./modules/water/WaterRoute"));
const WaterConsumerRoute = lazy(() => import("./modules/waterConsumer/index"));
const ReportDashboard = lazy(() => import("./pages/ReportDashboard"));
const WaterAppPaymentReceipt = lazy(() => import("./modules/water/pages/PaymentReceipt"));
const AccountsRoute = lazy(() => import("./modules/accounts/AccountsRoute"));
const WaterConsumerPaymentReceipt = lazy(() => import("./modules/waterConsumer/pages/PaymentReceipt"));
const TradeRoutes = lazy(() => import("./routes/TradeRoutes"));
const LicenseCertificateReceipt = lazy(() => import("./modules/trade/pages/LicenseCertificateReceipt"));
const TradePaymentReceipt = lazy(() => import("./modules/trade/pages/TradePaymentReceipt"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const SWMRoute = lazy(() => import("./modules/swm/index"));
const SwmPaymentReceipt = lazy(() => import("./modules/swm/pages/SwmPaymentReceipt"));
const SwmDemandReceipt = lazy(() => import("./modules/swm/pages/SwmDemandReceipt"));
const TaxCalculator = lazy(() => import("./modules/property/component/TaxCalculator"));

const isMaintenance = false; 

function App() {
  const [browserInfo, setBrowserInfo] = useState({
    latitude: null,
    longitude: null,
    machine: null,
    browser_name: null,
    ip: null,
  });

  useEffect(() => {
    (async () => {
      const info = await getBrowserInfo();
      setBrowserInfo(info);
      localStorage.setItem("browserInfo", JSON.stringify(info));
    })();
  }, []);

  if
  (isMaintenance) {
    return <MaintenancePage />;
  }

  return (
    <MenuProvider>
      {/* <ForceSingleTab />  */}
      <LoadingProvider>
        <Router>
          <LoadingOverlay />
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-screen">
                <span className="inline-block border-4 border-t-transparent border-blue-600 rounded-full w-10 h-10 animate-spin"></span>
              </div>
            }
          >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/user/*" element={<UserRoutes />} />
            <Route path="/settings/*" element={<SettingRoutes />} />
            <Route path="/saf/*" element={<SafRoutes />} />
            <Route path="/property/*" element={<PropertyRoutes />} />
            <Route path="/trade/*" element={<TradeRoutes />} />
            <Route path="/water/consumer/*" element={<WaterConsumerRoute />} />
            <Route path="/water/*" element={<WaterRoute />} />
            <Route path="/accounts/*" element={<AccountsRoute />} />
            <Route path="/swm/*" element={<SWMRoute />} />
            <Route
              path="/water-app/payment-receipt/:id"
              element={<WaterAppPaymentReceipt />}
            />
            <Route
              path="/water-consumer/payment-receipt/:id"
              element={<WaterConsumerPaymentReceipt />}
            />
            
            <Route
              path="/municipal-license-receipt/:id"
              element={
                  <LicenseCertificateReceipt />
              }
            />
            <Route
              path="/citizen/auth"
              element={
                <Layout>
                  <CitizenAuth />
                </Layout>
              }
            />
            <Route
              path="/tax-calculator"
              element={
                <Layout title="Property Tax Calculator - MUNICIPAL CORPORATION BHILAI">
                  <div className="px-4 md:px-8 py-6">
                    <TaxCalculator />
                  </div>
                </Layout>
              }
            />
            <Route path="/citizen/*" element={<CitizenRoute />} />
            <Route
              path="/saf/payment-receipt/:id"
              element={<SafPaymentReceipt />}
            />
            <Route
              path="/property/payment-receipt/:id"
              element={<SafPaymentReceipt />}
            />
            <Route path="/saf/sam-memo/:id/:lag" element={<SafMemoReceipt />} />
            <Route
              path="/trade/payment-receipt/:id"
              element={<TradePaymentReceipt />}
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/swm/payment-receipt/:id"
              element={<SwmPaymentReceipt />}
            />
            <Route
              path="/swm/demand-receipt/:id"
              element={<SwmDemandReceipt />}
            />
            <Route
              path="/reporting/dashboard"
              element={
                <ProtectedRoute>
                  <ReportDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
          </Suspense>
        </Router>
        <Toaster />
      </LoadingProvider>
    </MenuProvider>
  );
}

export default App;
