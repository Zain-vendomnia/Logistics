import React, { useState, useEffect } from "react";
import { useRoutes, useNavigate } from "react-router-dom";
import Sidebar from "./driver/Sidebar";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import { getDriverBoard } from "../services/user.service";
import EventBus from "../common/EventBus";
import OrderShipping from "./driver/OrderShipping";
import Dashboard from "./driver/Dashboard";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from "@mui/material";

// const Dashboard = () => <div>Dashboard Content</div>;
const WarehouseCheckIn = () => <div>Warehouse Check-in Content</div>;

const BoardDriver: React.FC = () => {
  const [content, setContent] = useState<string>("");
  const [selectedPath, setSelectedPath] = useState<string>("/dashboard");
  const navigate = useNavigate();

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    {
      text: "Warehouse Check-in",
      icon: <WarehouseIcon />,
      path: "/warehouse-checkin",
    },
    {
      text: "Order Shipping",
      icon: <LocalShippingIcon />,
      path: "/order-shipping",
    },
  ];

  useEffect(() => {
    getDriverBoard().then(
      (response) => {
        setContent(response.data);
      },
      (error) => {
        const _content =
          (error.response &&
            error.response.data &&
            error.response.data.message) ||
          error.message ||
          error.toString();

        setContent(_content);

        if (error.response && error.response.status === 401) {
          EventBus.dispatch("logout");
        }
      }
    );
  }, []);

  const renderContent = () => {
    switch (selectedPath) {
      case "/dashboard":
        return <Dashboard />;
      case "/warehouse-checkin":
        return <WarehouseCheckIn />;
      case "/order-shipping":
        return <OrderShipping />;
      default:
        return <Dashboard />;
    }
  };

  const routes = useRoutes([
    { path: "/dashboard", element: <Dashboard /> },
    { path: "/warehouse-checkin", element: <WarehouseCheckIn /> },
    { path: "/order-shipping", element: <OrderShipping /> },
  ]);
  const handleMenuItemClick = (path: string) => {
    navigate(path);
  };

  return (
    <>
      <div style={{ display: "flex", height: "100vh" }}>
        <Sidebar menuItems={menuItems} onMenuItemClick={setSelectedPath} />
        <Card>
          <CardContent>
            <Typography>
              {content}
            </Typography>
          </CardContent
        </Card>
        <div style={{ flexGrow: 1, padding: "0 0 0 20px" }}>
          
          <div className="d-flex justify-content-space" style={{ height: "20vh" }}>
          <Card>
            <CardContent>
              <Typography>
                Welcome to the Driver Dashboard. Here you can check in to the
                warehouse, view orders, and ship them efficiently.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small">Check In</Button>
            </CardActions>
          </Card>
          </div>
          <div>{renderContent()}</div>
        </div>
      </div>
    </>
  );
};

export default BoardDriver;
