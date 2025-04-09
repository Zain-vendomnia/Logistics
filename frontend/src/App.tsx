import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

import "./App.css";
import SnackbarProvider from "./providers/SnackbarProvider";
import GlobalChecksProvider from "./providers/GlobalChecksProvider";

import { AuthProvider } from "./providers/AuthProvider";
import AppRoutes from "./AppRoutes";
import NavBar from "./components/NavBar";
import Sidebar from "./components/Sidebar";
import { Box } from "@mui/material";

const App: React.FC = () => {
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
              <Sidebar />
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
