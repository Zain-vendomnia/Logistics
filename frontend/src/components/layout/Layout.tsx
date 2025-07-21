import { Box } from "@mui/material";
import React, { useEffect, useState } from "react";
import AppRoutes from "../../AppRoutes";
import Sidebar from "./Sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { useLayoutNavigator } from "../../hooks/useLayoutNavigator";

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
        <AppRoutes />
      </Box>
    </Box>
  );
};

export default Layout;
