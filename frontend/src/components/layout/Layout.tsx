import React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLayoutNavigator } from "../../hooks/useLayoutNavigator";

import { Box } from "@mui/material";

import AppRoutes from "../../AppRoutes";
import Sidebar from "./Sidebar";

const Layout = () => {
  const { activePath, hideSidebar } = useLayoutNavigator();

  const navigate = useNavigate();

  useEffect(() => {
    navigate(activePath, { replace: true });
  }, []);

  return (
    <Box display={"flex"} overflow={"hidden"} flexGrow={1} bgcolor={"grey.100"}>
      {!hideSidebar && <Sidebar />}
      <Box flexGrow={1} p={0} overflow={"auto"}>
        <React.Suspense fallback={<div>Loading...</div>}>
          <AppRoutes />
        </React.Suspense>
      </Box>
    </Box>
  );
};

export default Layout;
