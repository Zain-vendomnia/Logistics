import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./providers/AuthProvider";
import { isSuperAdmin, isAdmin, isDriver } from "./types/user.type";

// Pages
import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./components/Home";
import Profile from "./components/Profile";
import BoardAdmin from "./components/BoardAdmin/BoardAdmin";
import SuperAdmin from "./components/SuperAdmin";
import BoardDriver from "./components/BoardDriver/BoardDriver";
import AdminDashboard from "./components/Admin/Admin_dashboard";
import AdminAddTour from "./components/Admin/Admin_AddTour";
import Admin_TourTemplates from "./components/Admin/Admin_TourTemplates";
import Admin_MapComponent from "./components/Admin/Admin_MapComponent";
import Admin_TourMapView from "./components/Admin/Admin_TourMapView";
import ManageDrivers from "./components/Admin/ManageDrivers";
import ParkingPermitForm from './components/Frontend/ParkingPermitForm';


const ProtectedRoute = ({ element }: { element: JSX.Element }) => {
  const { user } = useAuth();
  return user ? element : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();

  const getUserBoard = () => {
    if (user) {
      if (isSuperAdmin(user)) return <Navigate to="/superadmin" replace />;
      if (isAdmin(user)) return <Navigate to="/Admin_dashboard" replace />;
      if (isDriver(user)) return <Navigate to="/driver" replace />;
    }
    return <Navigate to="/login" replace />;
  };

  return (
    <Routes>
      <Route
        path="/"
        element={!user ? <Navigate to="/login" replace /> : getUserBoard()}
      />
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/" replace />}
      />
      <Route
        path="/dashboard"
        element={user ? getUserBoard() : <Navigate to="/login" replace />}
      />
      <Route
        path="/superadmin"
        element={<ProtectedRoute element={<SuperAdmin />} />}
      />
      <Route
        path="/driver"
        element={<ProtectedRoute element={<BoardDriver />} />}
      />
      <Route
        path="/admin"
        element={<ProtectedRoute element={<BoardAdmin />} />}
      />
      <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
      <Route
        path="/profile"
        element={<ProtectedRoute element={<Profile />} />}
      />
      <Route path = "/register" element={<Register />} />
      <Route path = "/admin_dashboard" element={<AdminDashboard />} />
      <Route path = "/admin_addtour" element={<AdminAddTour/>}/>
      <Route path = "/manage_drivers" element={<ManageDrivers/>}/>
      <Route path = "/admin_tourtemplates" element={<Admin_TourTemplates/>}/>
      <Route path = "/admin_mapComponent/:id"  element = {<Admin_MapComponent/>}/>
      <Route path = "/Admin_TourMapView/:tour_id" element = {<Admin_TourMapView/>}/>
      <Route path = "/ParkingPermitForm" element = {<ParkingPermitForm/>}/>
      {/* <Route path="/Admin_PickList" element={<Admin_PickListPage />} />  */}
   </Routes>


  );
};

export default AppRoutes;
