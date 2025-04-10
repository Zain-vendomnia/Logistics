import { useState, useEffect } from "react";
import EventBus from "../../common/EventBus";
import Sidebar from "../layout/Sidebar";
import Dashboard from "../driver/Dashboard";
import { getDriverBoard } from "../../services/user.service";

import WarehouseIcon from "@mui/icons-material/Warehouse";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import { Box } from "@mui/material";

const WarehouseCheckIn = () => <div>Warehouse Check-in Content</div>;
const GasManagement = () => <div>Gas Management Console..</div>;
const OrderShipping = () => <div>Order Shipping Module.</div>;

const BoardDriver = () => {
  const [content, setContent] = useState<string>("");
  const [selectedPath, setSelectedPath] = useState<string>("/dashboard");

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
      case "/gasManagement":
        return <GasManagement />;
      default:
        return <Dashboard />;
    }
  };

  const piechartData = [
    { id: 1, value: 60, label: "progress" },
    { id: 2, value: 40, label: "goal" },
  ];

  return (
    <Box display="flex" height="100%" width="100%">
      <Box flexGrow={1} overflow={"hidden"} height="100%">
        <Box height="100%">{renderContent()}</Box>
      </Box>
    </Box>
  );
};

export default BoardDriver;
