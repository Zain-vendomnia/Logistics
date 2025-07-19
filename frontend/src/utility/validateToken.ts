import { useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import authHeader from "../services/auth-header";
import EventBus from "../common/EventBus";
import IUser from "../types/user.type";

const useTokenValidation = (user: IUser | null) => {
  const navigate = useNavigate();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return; // ✅ Do nothing if no user is logged in

    const logoutAndRedirect = () => {
      EventBus.dispatch("logout");
      navigate("/login");
    };

    const validateToken = async () => {
      try {
        const headers = authHeader();
        if (!headers.Authorization) {
          logoutAndRedirect();
          return;
        }

        const response = await axios.get(
          "http://localhost:8080/api/auth/validate-token",
          { headers }
        );

        if (response.status !== 200) {
          logoutAndRedirect();
        }
      } catch (error) {
        logoutAndRedirect();
      }
    };

    validateToken(); // ✅ Validate immediately on mount

    // ✅ Set interval for periodic validation
    intervalRef.current = setInterval(validateToken, 20000); // 20 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, navigate]); // ✅ Depend on `user` and `navigate`
};

export default useTokenValidation;
