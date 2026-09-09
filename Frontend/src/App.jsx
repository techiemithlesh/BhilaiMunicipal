import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import PropertyRoutes from "./modules/property/PropertyRoutes";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { Toaster } from "react-hot-toast";
import { getBrowserInfo } from "./utils/browserInfo";
import "./index.scss";
import { LoadingProvider } from "./contexts/LoadingContext";
import LoadingOverlay from "./components/common/LoadingOverlay";
import UserRoutes from "./modules/user/userRoutes";
import SafRoutes from "./modules/saf/SafRoutes";
import SettingRoutes from "./modules/settings";
import SafPaymentReceipt from "./modules/saf/pages/SafPaymentReceipt";
import SafMemoReceipt from "./modules/saf/pages/SafMemoReceipt";
import MobiLogin from "./pages/MobiLogin";
import MobileDashboard from "./pages/MobileDashboard";
import MobileRoutes from "./MobileRoutes";
import CitizenAuth from "./pages/citizen/CitizenAuth";
import CitizenRoute from "./pages/citizen/CitizenRoute";
import Layout from "./layout/Layout";
import WaterRoute from "./modules/water/WaterRoute";
import WaterConsumerRoute from "./modules/waterConsumer/index";
import ReportDashboard from "./pages/ReportDashboard";
import { MenuProvider } from "./components/common/MenuContext";
import WaterAppPaymentReceipt from "./modules/water/pages/PaymentReceipt";
import AccountsRoute from "./modules/accounts/AccountsRoute";
import WaterConsumerPaymentReceipt from "./modules/waterConsumer/pages/PaymentReceipt";
import TradeRoutes from './routes/TradeRoutes';
import LicenseCertificateReceipt from "./modules/trade/pages/LicenseCertificateReceipt";
import TradePaymentReceipt from "./modules/trade/pages/TradePaymentReceipt";
import MaintenancePage from "./Maintenance.jsx";

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
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/login/mobile" element={<MobiLogin />} />
            <Route path="/mobile/*" element={<MobileRoutes />} />
            <Route path="/user/*" element={<UserRoutes />} />
            <Route path="/settings/*" element={<SettingRoutes />} />
            <Route path="/saf/*" element={<SafRoutes />} />
            <Route path="/property/*" element={<PropertyRoutes />} />
            <Route path="/trade/*" element={<TradeRoutes />} />
            {/* <Route path="/trade/*" element={<TradeRoutes />} />*/}
            <Route path="/water/consumer/*" element={<WaterConsumerRoute />} />
            <Route path="/water/*" element={<WaterRoute />} />
            <Route path="/accounts/*" element={<AccountsRoute />} />
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
                  <ReportDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reporting/dashboard"
              element={
                <ProtectedRoute>
                  <ReportDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mobile/dashboard"
              element={
                <ProtectedRoute>
                  <MobileDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
        <Toaster />
      </LoadingProvider>
    </MenuProvider>
  );
}

export default App;
