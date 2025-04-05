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
// import Dashboard from "../pages/Dashboard";
// import NotFound from "../pages/NotFound";

const AppRoutes = () => {
  const { user } = useAuth();

  const getUserBoard = () => {
    if (user) {
      if (isSuperAdmin(user)) {
        return <Navigate to="/superadmin" replace />;
      } else if (isAdmin(user)) {
        return <Navigate to="/admin" replace />;
      } else if (isDriver(user)) {
        return <Navigate to="/driver" replace />;
      } else {
        return <Navigate to="/login" replace />;
      }
    }
  };

  return (
    <Routes>
      <Route
        path="/"
        element={!user ? <Navigate to="/login" replace /> : getUserBoard()}
      />
      <Route path="/login" element={!user ? <Login /> : getUserBoard()} />
      <Route
        path="/dashboard"
        element={user ? getUserBoard() : <Navigate to="/login" replace />}
      />
      <Route path="/superadmin" element={<SuperAdmin />} />
      <Route path="/driver" element={<BoardDriver />} />
      <Route path="/admin" element={<BoardAdmin />} />

      <Route path="/home" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />

      <Route path="/api/estimate" element={<RouteEstimateComponent />} />

      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
};

export default AppRoutes;
