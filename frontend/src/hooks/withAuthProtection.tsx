import { Navigate } from "react-router-dom";
import * as AuthService from "../services/auth.service";

export function withAuthProtection<P>(Component: React.ComponentType<P>) {
  return (props: P & { isAuthenticated: boolean }) => {
    const { user } = AuthService.getCurrentUser();

    if (!user) {
      // Redirect to login or show an error message
      return <Navigate to="/login" replace />;
    }

    return <Component {...props} />;
  };
}
