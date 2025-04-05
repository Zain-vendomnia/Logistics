import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

import "./App.css";
import SnackbarProvider from "./providers/SnackbarProvider";
import GlobalChecksProvider from "./providers/GlobalChecksProvider";

import { AuthProvider } from "./providers/AuthProvider";
import AppRoutes from "./AppRoutes";
import NavBar from "./components/NavBar";

const App: React.FC = () => {
  return (
    <SnackbarProvider>
      <GlobalChecksProvider>
        <AuthProvider>
          <NavBar />
          <AppRoutes />
        </AuthProvider>
      </GlobalChecksProvider>
    </SnackbarProvider>
  );
};

export default App;
