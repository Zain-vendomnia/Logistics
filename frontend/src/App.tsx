import React from "react";
import { useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import useTokenValidation from "./utility/validateToken";
import "./App.css";
import SnackbarProvider from "./providers/SnackbarProvider";
import GlobalChecksProvider from "./providers/GlobalChecksProvider";

import { AuthProvider } from "./providers/AuthProvider";
import AppRoutes from "./AppRoutes";
import NavBar from "./components/layout/NavBar";
import Sidebar from "./components/layout/Sidebar";
import { Box } from "@mui/material";

const App: React.FC = () => {
  useTokenValidation();
  const location = useLocation();
  const hideSidebar = ["/login"].includes(
    location.pathname.toLocaleLowerCase()
  );
  return (
    <SnackbarProvider>
      <GlobalChecksProvider>
        <AuthProvider>
          <Box
            display={"flex"}
            flexDirection={"column"}
            overflow={"hidden"}
            height={"100%"}
          >
            <NavBar />
            <Box
              display={"flex"}
              overflow={"hidden"}
              flexGrow={1}
              bgcolor={"grey.100"}
            >
              {!hideSidebar && <Sidebar />}
              <Box flexGrow={1} p={0} overflow={"auto"}>
                <AppRoutes />
              </Box>
            </Box>
          </Box>
        </AuthProvider>
      </GlobalChecksProvider>
    </SnackbarProvider>
  );
};

export default App;
