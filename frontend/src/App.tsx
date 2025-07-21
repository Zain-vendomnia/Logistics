import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import GlobalChecksProvider from "./providers/GlobalChecksProvider";
import { AuthProvider } from "./providers/AuthProvider";
import NavBar from "./components/layout/NavBar";
import { Box } from "@mui/material";
import { NotificationManager } from "./components/Notification";
import "@fontsource/raleway"; // Defaults to weight 400
import Layout from "./components/layout/Layout";

const App: React.FC = () => {
  return (
    <>
      <NotificationManager />
      <GlobalChecksProvider>
        <AuthProvider>
          <Box
            display={"flex"}
            flexDirection={"column"}
            overflow={"hidden"}
            height={"100%"}
          >
            <NavBar />
            <Layout />
          </Box>
        </AuthProvider>
      </GlobalChecksProvider>
    </>
  );
};

export default App;
