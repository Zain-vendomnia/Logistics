import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./providers/AuthProvider";
import { isSuperAdmin, isAdmin, isDriver } from "./types/user.type";

// Pages
import Login from "./components/pages/Login";
import Register from "./components/pages/Register";
import Home from "./components/pages/Home";
import Profile from "./components/pages/Profile";
import BoardDriver from "./components/driver/BoardDriver";

import SuperAdmin from "./components/SuperAdmin";
import AdminDashboard from "./components/Admin/Admin_dashboard";
import ManageDrivers from "./components/Admin/ManageDrivers";
import ManageVehicles from "./components/Admin/ManageVehicles";
import ManageWarehouse from "./components/Admin/ManageWarehouse";
import Admin_TourTemplates from "./components/Admin/Admin_TourTemplates";
import Admin_MapComponent from "./components/Admin/Admin_MapComponent";
import Admin_TourMapView from "./components/Admin/Admin_TourMapView";
import ParkingPermitForm from "./components/parkingPermit/ParkingPermitForm";
import AdminAddTour from "./components/Admin/Admin_AddTour";
import CompletedTour from "./components/Admin/completed_tour";
import LiveTours from "./components/Admin/live_tours";
import DriverPerformance from "./components/Admin/DriverPerformance";
import ProofdeliveryLiveloc from "./components/Admin/ProofdeliveryLiveloc";
import ProofdeliveryImage from "./components/Admin/ProofdeliveryImage";
import TestCrashRender from "./components/pages/TestCrashRender";
import TestUnhandledPromise from "./components/pages/TestUnhandledPromise";
import TestRuntimeError from "./components/pages/TestRuntimeError";
import Admin_dynamicHereMap from "./components/Admin/dynamic_tour/DynamicMapBoard";
import CustomersChat from "./components/notification/CustomersChat";
import LogViewer from "./components/LogViewer";
import ManageReturns from "./components/Admin/ManageReturns";

// Role-based route guard
const ProtectedRoute = ({
  element,
  allowedRoles,
}: {
  element: JSX.Element;
  allowedRoles?: ("admin" | "superadmin" | "driver")[];
}) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const userRole = isSuperAdmin(user)
    ? "superadmin"
    : isAdmin(user)
      ? "admin"
      : isDriver(user)
        ? "driver"
        : null;

  if (allowedRoles && (!userRole || !allowedRoles.includes(userRole))) {
    return <Navigate to="/" replace />;
  }

  return element;
};

// Role specific wrappers
const AdminRoute = ({ element }: { element: JSX.Element }) => (
  <ProtectedRoute element={element} allowedRoles={["admin"]} />
);
const SuperAdminRoute = ({ element }: { element: JSX.Element }) => (
  <ProtectedRoute element={element} allowedRoles={["superadmin"]} />
);
const DriverRoute = ({ element }: { element: JSX.Element }) => (
  <ProtectedRoute element={element} allowedRoles={["driver"]} />
);

const AppRoutes = () => {
  const { user } = useAuth();

  const getUserBoard = () => {
    if (user) {
      if (isSuperAdmin(user)) return <Navigate to="/superadmin" replace />;
      if (isAdmin(user)) return <Navigate to="/admin_dashboard" replace />;
      if (isDriver(user)) return <Navigate to="/driver" replace />;
    }
    return <Navigate to="/login" replace />;
  };

  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={getUserBoard()} />
      <Route path="/ParkingPermitForm" element={<ParkingPermitForm />} />

      {/* Auth Routes */}
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/" replace />}
      />

      {/* Logs */}
      <Route path="/logs" element={<AdminRoute element={<LogViewer />} />} />

      {/* General Protected Routes */}
      <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
      <Route
        path="/profile"
        element={<ProtectedRoute element={<Profile />} />}
      />
      <Route
        path="/dashboard"
        element={<ProtectedRoute element={getUserBoard()} />}
      />

      {/* SuperAdmin Route */}
      <Route
        path="/superadmin"
        element={<SuperAdminRoute element={<SuperAdmin />} />}
      />

      {/* Driver Route */}
      <Route
        path="/driver"
        element={<DriverRoute element={<BoardDriver />} />}
      />
      {/* Admin can register (registering drivers) */}
      <Route path="/register" element={<AdminRoute element={<Register />} />} />

      {/* Admin-only Routes */}
      <Route
        path="/admin_dashboard"
        element={<AdminRoute element={<AdminDashboard />} />}
      />
      <Route
        path="/admin_addtour"
        element={<AdminRoute element={<AdminAddTour />} />}
      />
      <Route
        path="/manage_drivers"
        element={<AdminRoute element={<ManageDrivers />} />}
      />
      <Route
        path="/manage_vehicles"
        element={<AdminRoute element={<ManageVehicles />} />}
      />
      <Route
        path="/chat"
        element={<AdminRoute element={<CustomersChat />} />}
      />
      <Route
        path="/manage_warehouse"
        element={<AdminRoute element={<ManageWarehouse />} />}
      />
      <Route
        path="/admin_tourtemplates"
        element={<AdminRoute element={<Admin_TourTemplates />} />}
      />
      <Route
        path="/admin_mapComponent/:id"
        element={<AdminRoute element={<Admin_MapComponent />} />}
      />
      <Route
        path="/mapboard/dynamic"
        element={<AdminRoute element={<Admin_dynamicHereMap />} />}
      />
      <Route
        path="/Admin_TourMapView/:tour_id"
        element={<AdminRoute element={<Admin_TourMapView />} />}
      />
      <Route
        path="/completed_tour"
        element={<AdminRoute element={<CompletedTour />} />}
      />
      <Route
        path="/live_tours"
        element={<AdminRoute element={<LiveTours />} />}
      />
      <Route
        path="/driver_performance"
        element={<AdminRoute element={<DriverPerformance />} />}
      />
      <Route
        path="/returns"
        element={<AdminRoute element={<ManageReturns />} />}
      />
      <Route
        path="/ProofdeliveryLiveloc"
        element={<AdminRoute element={<ProofdeliveryLiveloc />} />}
      />
      <Route
        path="/ProofdeliveryImage"
        element={<AdminRoute element={<ProofdeliveryImage />} />}
      />

      {/* Test Routes - Consider protecting these or removing in production */}
      <Route path="/test-crash" element={<TestCrashRender />} />
      <Route path="/test-rej" element={<TestUnhandledPromise />} />
      <Route path="/test-runtime" element={<TestRuntimeError />} />

      {/* Fallback to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
