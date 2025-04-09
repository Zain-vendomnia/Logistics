import React, { useState, useEffect } from "react";
import { getAdminBoard } from "../../services/user.service";
import EventBus from "../../common/EventBus";
import { Link } from "react-router-dom";
import { Box, Drawer, List, ListItem, ListItemButton, ListItemText, CssBaseline } from "@mui/material";
import Admin_MapComponent from "../../components/Admin/Admin_MapComponent";

const drawerWidth = 240;
const BoardAdmin: React.FC = () => {
  return (
           <header className="jumbotron">
            <h3>Admin Dashboard</h3>
            <p>Welcome to the Admin Dashboard</p>
          </header>
  );
};

export default BoardAdmin;





