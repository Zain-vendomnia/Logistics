import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./providers/AuthProvider";
import { isSuperAdmin, isAdmin, isDriver } from "./types/user.type";

// Pages

import AdminTourTemplates from "./components/Admin/Admin_TourTemplates";
import AdminMapComponent from "./components/Admin/Admin_MapComponent";
import AdminTourMapView from "./components/Admin/Admin_TourMapView";


import Login from "./components/pages/Login";
import Register from "./components/pages/Register";
import Home from "./components/pages/Home";
import Profile from "./components/pages/Profile";
import BoardDriver from "./components/driver/BoardDriver";
import BoardAdmin from "./components/BoardAdmin/BoardAdmin";
import SuperAdmin from "./components/SuperAdmin";
import AdminDashboard from "./components/Admin/Admin_dashboard";
import ManageDrivers from "./components/Admin/ManageDrivers";
import ManageWarehouse from "./components/Admin/ManageWarehouse";
import Admin_TourTemplates from "./components/Admin/Admin_TourTemplates";
import Admin_MapComponent from "./components/Admin/Admin_MapComponent";
import Admin_TourMapView from "./components/Admin/Admin_TourMapView";
import AdminAddTour from "./components/Admin/Admin_AddTour";

// Enhanced ProtectedRoute
const ProtectedRoute = ({
  element,
  allowedRoles,
}: {
  element: JSX.Element;
  allowedRoles?: string[];
}) => {
  const { user } = useAuth();
console.log("ProtectedRoute user", user);
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return element;
};

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
        element={<ProtectedRoute element={getUserBoard()} />}
      />

      <Route
        path="/superadmin"
        element={<ProtectedRoute element={<SuperAdmin />} allowedRoles={["superadmin"]} />}
      />
      <Route
        path="/driver"
        element={<ProtectedRoute element={<BoardDriver />} allowedRoles={["driver"]} />}
      />
      <Route
        path="/admin"
        element={<ProtectedRoute element={<BoardAdmin />} allowedRoles={["admin", "superadmin"]} />}
      />
      <Route
        path="/home"
        element={<ProtectedRoute element={<Home />} />}
      />
      <Route
        path="/profile"
        element={<ProtectedRoute element={<Profile />} />}
      />
      <Route
        path="/register"
        element={<ProtectedRoute element={<Register />} allowedRoles={["superadmin"]} />}
      />

      {/* Admin Routes */}
      <Route
        path="/admin_dashboard"
        element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={["admin", "superadmin"]} />}
      />
      <Route
        path="/admin_addtour"
        element={<ProtectedRoute element={<AdminAddTour />} allowedRoles={["admin", "superadmin"]} />}
      />
      <Route
        path="/manage_drivers"
        element={<ProtectedRoute element={<ManageDrivers />} allowedRoles={["admin", "superadmin"]} />}
      />
      <Route
        path="/manage_warehouse"
        element={<ProtectedRoute element={<ManageWarehouse />} allowedRoles={["admin", "superadmin"]} />}
      />
      <Route
        path="/admin_tourtemplates"
        element={<ProtectedRoute element={<AdminTourTemplates />} allowedRoles={["admin", "superadmin"]} />}
      />
      <Route
        path="/admin_mapcomponent/:id"
        element={<ProtectedRoute element={<AdminMapComponent />} allowedRoles={["admin", "superadmin"]} />}
      />
     <Route path="/Admin_TourMapView/:id" element={<ProtectedRoute element={<AdminTourMapView />} />} />

    </Routes>
  );
};

export default AppRoutes;
