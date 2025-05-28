import { useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import authHeader from "../services/auth-header";
import EventBus from "../common/EventBus";
import * as AuthService from "../services/auth.service";

const useTokenValidation = () => {
  const navigate = useNavigate();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const logoutAndRedirect = () => {
      EventBus.dispatch("logout");
      navigate("/login");
    };

    const validateToken = async () => {
      // const user = AuthService.getCurrentUser();
      // if (!user) {
      //   // User not logged in; stop checking
      //   if (intervalRef.current) clearInterval(intervalRef.current);
      //   return;
      // }

      try {
        const headers = authHeader();
        if (!headers.Authorization) {
          logoutAndRedirect();
          return;
        }

        const response = await axios.get("http://localhost:8080/api/auth/validate-token", { headers });

        if (response.status !== 200) {
          logoutAndRedirect();
        }
      } catch (error) {
        logoutAndRedirect();
      }
    };

    validateToken();

    // Only start interval if user exists
    if (AuthService.getCurrentUser()) {
      intervalRef.current = setInterval(validateToken, 20000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [navigate]);
};

export default useTokenValidation;
