import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import List from "./pages/List";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import AdminLayout from "../../layout/AdminLayout";
import UserMenuIncludeExclude from "./pages/UserMenuIncludeExclude";
import MobileMenuList from "./pages/MobileMenuList";
import UserMobileMenuIncludeExclude from "./pages/UserMobileMenuIncludeExclude";
import PropertyUsageTypeList from "./pages/PropertyUsageTypeList";
import PropertyOccupancyTypeList from "./pages/PropertyOccupancyTypeList";
import PropertyConstructionTypeList from "./pages/PropertyConstructionTypeList";
import PropertyPropTypeList from "./pages/PropertyPropTypeList";
import PropertyRoadTypeList from "./pages/PropertyRoadTypeList";
import PropertyFloorTypeList from "./pages/PropertyFloorTypeList";
import PropertyOwnershipTypeList from "./pages/PropertyOwnershipTypeList";
import ModalLogView from "./pages/ModalLogView";
import WorkFlow from "./pages/WorkFlow";
import RolePermission from "./pages/RolePermission";
import UlbNoticeList from "./pages/UlbNoticeList";
import UlbOfficerList from "./pages/UlbOfficerList";
import QueryEditorUI from "./pages/QueryEditorUI";
import ApartmentList from "./pages/ApartmentList";

function SettingRoutes() {
  return (
    <Suspense fallback={<div className="loading">Loading....</div>}>
      <AdminLayout>
        <Routes>
          <Route
            path="/list"
            element={
              <ProtectedRoute>
                <List />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/list"
            element={
              <ProtectedRoute>
                <UserMenuIncludeExclude />
              </ProtectedRoute>
            }
          />
          <Route
            path="/list/mobile"
            element={
              <ProtectedRoute>
                <MobileMenuList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/list/mobile"
            element={
              <ProtectedRoute>
                <UserMobileMenuIncludeExclude />
              </ProtectedRoute>
            }
          />
          <Route
            path="/property/usage/list"
            element={
              <ProtectedRoute>
                <PropertyUsageTypeList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/property/occupancy/list"
            element={
              <ProtectedRoute>
                <PropertyOccupancyTypeList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/property/construction/list"
            element={
              <ProtectedRoute>
                <PropertyConstructionTypeList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/property/property/list"
            element={
              <ProtectedRoute>
                <PropertyPropTypeList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/property/road/list"
            element={
              <ProtectedRoute>
                <PropertyRoadTypeList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/property/floor/list"
            element={
              <ProtectedRoute>
                <PropertyFloorTypeList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/property/ownership/list"
            element={
              <ProtectedRoute>
                <PropertyOwnershipTypeList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/property/apartment/list"
            element={
              <ProtectedRoute>
                <ApartmentList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/modalLog/list"
            element={
              <ProtectedRoute>
                <ModalLogView />
              </ProtectedRoute>
            }
          />

          {/* work flow */}
          <Route
            path="/wf/list"
            element={
              <ProtectedRoute>
                <WorkFlow />
              </ProtectedRoute>
            }
          />
          {/* role module permission */}
          <Route
            path="/role-permission/list"
            element={
              <ProtectedRoute>
                <RolePermission />
              </ProtectedRoute>
            }
          />
          {/* ulb Notice */}
          <Route
            path="/ulb-notice/list"
            element={
              <ProtectedRoute>
                <UlbNoticeList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ulb-officers/list"
            element={
              <ProtectedRoute>
                <UlbOfficerList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools"
            element={
              <ProtectedRoute>
                <QueryEditorUI />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AdminLayout>
    </Suspense>
  );
}

export default SettingRoutes;
