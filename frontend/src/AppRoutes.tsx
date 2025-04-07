import { Routes, Route, Navigate } from "react-router-dom";

import { useAuth } from "./providers/AuthProvider";
import { isSuperAdmin, isAdmin, isDriver } from "./types/user.type";

// Pages
import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./components/Home";
import Profile from "./components/Profile";
import BoardAdmin from "./components/BoardAdmin";
import SuperAdmin from "./components/SuperAdmin";
import BoardDriver from "./components/BoardDriver/BoardDriver";
import RouteEstimateComponent from "./components/RouteEstimateComponent";
// import NotFound from "../pages/NotFound";

const ProtectedRoute = ({ element }: { element: JSX.Element }) => {
  const { user } = useAuth();
  return user ? element : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();

  const getUserBoard = () => {
    if (user) {
      if (isSuperAdmin(user)) return <Navigate to="/superadmin" replace />;
      if (isAdmin(user)) return <Navigate to="/admin" replace />;
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

      <Route path="/register" element={<Register />} />
      <Route path="/api/estimate" element={<RouteEstimateComponent />} />

      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
};

export default AppRoutes;
