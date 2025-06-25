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
import ManageWarehouse from "./components/Admin/ManageWarehouse";
import Admin_TourTemplates from "./components/Admin/Admin_TourTemplates";
import Admin_MapComponent from "./components/Admin/Admin_MapComponent";
import Admin_TourMapView from "./components/Admin/Admin_TourMapView";
import ParkingPermitForm from './components/parkingPermit/ParkingPermitForm';
import AdminAddTour from "./components/Admin/Admin_AddTour";
import CompletedTour from "./components/Admin/completed_tour";
import LiveTours from "./components/Admin/live_tours";
import DriverPerformance from "./components/Admin/DriverPerformance";
import ProofdeliveryLiveloc from "./components/Admin/ProofdeliveryLiveloc";
import ProofdeliveryImage from "./components/Admin/ProofdeliveryImage";

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
  // Role checks
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

// Main routes
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
      <Route path="/" element={user ? getUserBoard() : <Navigate to="/login" replace />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path = "/ParkingPermitForm" element = {<ParkingPermitForm/>}/>

      {/* SuperAdmin Route */}
      <Route path="/dashboard" element={<ProtectedRoute element={getUserBoard()} />} />
      <Route path="/superadmin"  element={<ProtectedRoute element={<SuperAdmin />} allowedRoles={["superadmin"]} />}/>

      {/* Driver Route */}
      <Route path="/driver"  element={<ProtectedRoute element={<BoardDriver />} allowedRoles={["driver"]} />}/>

    
      {/* General Protected Routes */}
      <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
      <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />

      {/* ✅ Only Admin can register (registering drivers) */}
      <Route path="/register" element={<ProtectedRoute element={<Register />} allowedRoles={["admin"]} />} />


      {/* ✅ Admin-only Routes */}

      <Route path = "/admin_dashboard" element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={["admin"]} />}/>
      <Route path = "/admin_addtour" element={<ProtectedRoute element={<AdminAddTour />} allowedRoles={["admin"]} />} />
      <Route path = "/manage_drivers"  element={<ProtectedRoute element={<ManageDrivers />} allowedRoles={["admin"]} />} />
      <Route path = "/manage_warehouse" element={<ProtectedRoute element={<ManageWarehouse />} allowedRoles={["admin"]} />} />
      <Route path = "/admin_tourtemplates" element={<ProtectedRoute element={<Admin_TourTemplates />} allowedRoles={["admin"]} />}/>
      <Route path = "/admin_mapComponent/:id" element={<ProtectedRoute element={<Admin_MapComponent />} allowedRoles={["admin"]} />} />
      <Route path = "/profile"  element={<ProtectedRoute element={<Profile />} />} />
      <Route path = "/register" element={<Register />} />
      <Route path = "/admin_dashboard" element={<AdminDashboard />} />
      <Route path = "/admin_addtour" element={<AdminAddTour/>}/>
      <Route path = "/manage_drivers" element={<ManageDrivers/>}/>
      <Route path = "/manage_warehouse" element={<ManageWarehouse/>}/>
      <Route path = "/admin_tourtemplates" element={<Admin_TourTemplates/>}/>
      <Route path = "/admin_mapComponent/:id"  element = {<Admin_MapComponent/>}/>
      <Route path = "/Admin_TourMapView/:tour_id"  element={<ProtectedRoute element={<Admin_TourMapView />} allowedRoles={["admin"]} />}/>
      <Route path = "/completed_tour" element={<ProtectedRoute element={<CompletedTour />} allowedRoles={["admin"]} />} />
      <Route path = "/live_tours" element={<ProtectedRoute element={<LiveTours />} allowedRoles={["admin"]} />} />
      <Route path = "/driver_performance" element={<ProtectedRoute element={<DriverPerformance />} allowedRoles={["admin"]} />} />
      <Route path = "/ProofdeliveryLiveloc" element={<ProtectedRoute element={<ProofdeliveryLiveloc />} allowedRoles={["admin"]} />} />
      <Route path = "/ProofdeliveryImage" element={<ProtectedRoute element={<ProofdeliveryImage />} allowedRoles={["admin"]} />} />
      {/* <Route path="/Admin_PickList" element={<Admin_PickListPage />} />  */}
   </Routes>

  );
};

export default AppRoutes;
