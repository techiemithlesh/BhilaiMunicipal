import { Suspense, useEffect } from "react";
import { Outlet, Route, Routes, useNavigate } from "react-router-dom";
import CitizenDashboard from "./CitizenDashboard";
import CitizenLayout from "../../layout/CitizenLayout";
import PropertySearch from "../../components/citizen/holding/PropertySearch";
import MyApplication from "./MyApplication";
import { useDispatch, useSelector } from "react-redux";
import CitizenDetails from "../../components/citizen/saf/CitizenDetails";
import CitizenNewAssesment from "../../components/citizen/saf/CitizenNewAssesment";
import CitizenPreview from "../../components/citizen/saf/CitizenPreview";
import CitizenMutation from "../../components/citizen/saf/CitizenMutation";
import CitizenReAssesment from "../../components/citizen/saf/CitizenReAssesment";
import RenewLicense from "../../components/citizen/trade/RenewLicense";
import ApplyLicense from "../../components/citizen/trade/ApplyLicense";
import SurrenderLicense from "../../components/citizen/trade/surrender/SurrenderLicense";
import { logoutThunk } from "../../store/slices/citizenAuthSlice";
import ApplyConnection from "../../components/citizen/water/ApplyConnection";
import PreviewLicense from "../../components/citizen/trade/PreviewLicense";
import SearchTrade from "../../components/citizen/trade/SearchTrade";
import TradeSearchDetails from "../../components/citizen/trade/TradeSearchDetails";
import PreviewPage from "../../components/citizen/water/PreviewPage";
import ApplicationDetails from "../../components/citizen/water/ApplicationDetails";
import EditApplication from "../../components/citizen/water/EditApplication";
import { waterAppDetailApi } from "../../api/endpoints";
import CitizenSafEdit from "../../components/citizen/saf/CitizenSafEdit";
import SearchWater from "../../components/citizen/water/SearchWater";
import Details from "../../components/citizen/holding/Details";
import ProtectedRouteCitizen from "../../components/common/ProtectedRouteCitizen";
import ConsumerDetails from "../../components/citizen/consumer/ConsumerDetails";

// import Preview from "./component/Preview";

export default function CitizenRoute() {
  const token = useSelector((state) => state.citizenAuth.token);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const expiry = JSON.parse(localStorage.getItem("expiry"));
    const timeout = expiry - Date.now();

    const timer = setTimeout(() => {
      dispatch(logoutThunk(token));
      navigate("/citizen/auth");
    }, timeout);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Suspense
        fallback={
          <div className="p-6 text-center">
            <span className="inline-block border-4 border-blue-600 border-t-transparent rounded-full w-8 h-8 animate-spin loader"></span>
            <p className="mt-2">Loading...</p>
          </div>
        }
      >
        <CitizenLayout>
          <Routes>
            <Route path="/" element={<ProtectedRouteCitizen><CitizenDashboard /> </ProtectedRouteCitizen>} />
            <Route path="/application" element={<ProtectedRouteCitizen><MyApplication /></ProtectedRouteCitizen>} />

            {/* SAF Routes /saf/edit/:safId */}
            <Route path="/saf" element={<ProtectedRouteCitizen><Outlet /></ProtectedRouteCitizen>}>
              <Route path="apply-saf" element={<ProtectedRouteCitizen><CitizenNewAssesment /></ProtectedRouteCitizen>} />
              <Route path="edit/:safId" element={<ProtectedRouteCitizen><CitizenSafEdit /></ProtectedRouteCitizen>} />
              <Route path="details/:safId" element={<ProtectedRouteCitizen><CitizenDetails /></ProtectedRouteCitizen>} />
              <Route path="preview" element={<ProtectedRouteCitizen><CitizenPreview /></ProtectedRouteCitizen>} />
            </Route>

            {/* Property Routes /holding/details/:propId */}
            <Route path="/holding" element={<ProtectedRouteCitizen><Outlet /></ProtectedRouteCitizen>}>
              <Route path="search" element={<ProtectedRouteCitizen><PropertySearch /></ProtectedRouteCitizen>} />
              <Route path="details/:propId" element={<ProtectedRouteCitizen><Details /></ProtectedRouteCitizen>} />
              <Route path="mutation/:propId" element={<ProtectedRouteCitizen><CitizenMutation /></ProtectedRouteCitizen>} />
              <Route
                path="reassessment/:propId"
                element={<ProtectedRouteCitizen><CitizenReAssesment /></ProtectedRouteCitizen>}
              />
            </Route>

            {/* Trade License Routes */}
            <Route path="/trade" element={<ProtectedRouteCitizen><Outlet /></ProtectedRouteCitizen>}>
              <Route path="apply-license/:id?/:applicationType?" element={<ProtectedRouteCitizen><ApplyLicense /></ProtectedRouteCitizen>} />
              
              <Route path="search" element={<ProtectedRouteCitizen><SearchTrade /></ProtectedRouteCitizen>} />
              <Route path=":licenseType" element={<ProtectedRouteCitizen><ApplyLicense /></ProtectedRouteCitizen>} />
              <Route
                path="apply-license/preview"
                element={<ProtectedRouteCitizen><PreviewLicense /></ProtectedRouteCitizen>}
              />
              <Route
                path=":licenseType/:id/:applicationType"
                element={<ProtectedRouteCitizen><RenewLicense /></ProtectedRouteCitizen>}
              />
              <Route path="surrender-license" element={<ProtectedRouteCitizen><SurrenderLicense /></ProtectedRouteCitizen>} />
              <Route
                path="search/details/:id"
                element={<ProtectedRouteCitizen><TradeSearchDetails /></ProtectedRouteCitizen>}
              />
            </Route>

            {/* Water Connection Routes */}
            <Route path="/water" element={<ProtectedRouteCitizen><Outlet /></ProtectedRouteCitizen>}>
              <Route path="search" element={<ProtectedRouteCitizen><SearchWater /></ProtectedRouteCitizen>} />
              <Route path="apply-connection" element={<ProtectedRouteCitizen><ApplyConnection /></ProtectedRouteCitizen>} />
              <Route path="apply/preview" element={<ProtectedRouteCitizen><PreviewPage /></ProtectedRouteCitizen>} />
              <Route path="details/:id" element={<ProtectedRouteCitizen><ApplicationDetails /></ProtectedRouteCitizen>} />
              <Route
                path="details/:id/edit"
                element={<ProtectedRouteCitizen><EditApplication fetchApi={waterAppDetailApi} /></ProtectedRouteCitizen>}
              />
            </Route>
            {/* Water Consumer Routes */}
            <Route path="/water/consumer" element={<ProtectedRouteCitizen><Outlet/></ProtectedRouteCitizen>}>
              <Route
                path="details/:id"
                element={
                  <ProtectedRouteCitizen>
                    <ConsumerDetails />
                  </ProtectedRouteCitizen>
                }
              />
            </Route>
          </Routes>
        </CitizenLayout>
      </Suspense>
    </>
  );
}
