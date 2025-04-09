import { useState, useEffect } from "react";
import EventBus from "../../common/EventBus";
import Sidebar from "../driver/driver_Sidebar";
import OrderShipping from "../driver/driver_OrderShipping";

import Dashboard_01 from "../driver/driver_Dashboard_01";
import { getDriverBoard } from "../../services/user.service";

import WarehouseIcon from "@mui/icons-material/Warehouse";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import { Box } from "@mui/material";

const WarehouseCheckIn = () => <div>Warehouse Check-in Content</div>;
const GasManagement = () => <div>Gas Management Console..</div>;

const BoardDriver = () => {
  const [content, setContent] = useState<string>("");
  const [selectedPath, setSelectedPath] = useState<string>("/dashboard");

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon sx={{ color: "primary.main" }} />,
      path: "/dashboard",
    },
    {
      text: "Warehouse Check-in",
      icon: <WarehouseIcon sx={{ color: "primary.main" }} />,
      path: "/warehouse-checkin",
    },
    {
      text: "Order Shipping",
      icon: <LocalShippingIcon sx={{ color: "primary.main" }} />,
      path: "/order-shipping",
    },
    {
      text: "Gas Refill",
      icon: <LocalGasStationIcon sx={{ color: "primary.main" }} />,
      path: "/gasManagement",
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
    
    }
  };

  const piechartData = [
    { id: 1, value: 60, label: "progress" },
    { id: 2, value: 40, label: "goal" },
  ];

  return (
    <Box display="flex" bgcolor="white.100">
      <Sidebar menuItems={menuItems} onMenuItemClick={setSelectedPath} />

      <Box flexGrow={1} p={1}>
      

        {/* <Stack direction="row" spacing={1}>
          <Card variant="outlined" sx={styles.cardBody}>
            <CardContent>
              <Typography>
                Welcome to your work place. Make a self Check-in.
              </Typography>
              <CardActions>
                <Button size="small" variant="contained">
                  Check In
                </Button>
              </CardActions>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={styles.cardBody}>
            <CardContent>
              <Typography>
                Take a photo when items are loaded in the truck.
              </Typography>
              <CardActions>
                <Button size="small" variant="outlined">
                  Upload Photo
                </Button>
              </CardActions>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={styles.cardBody}>
            <CardContent>
              <Typography>Check vehicle status and fuel level.</Typography>
              <CardActions>
                <Button size="small" variant="outlined">
                  Upload Photo
                </Button>
              </CardActions>
            </CardContent>
          </Card>
          <PieChart
            series={[
              {
                data: piechartData,
                innerRadius: 20,
                outerRadius: 35,
                paddingAngle: 5,
                cornerRadius: 5,
                startAngle: -45,
                endAngle: 275,
                cx: 40,
                cy: 60,
              },
            ]}
            width={200}
            height={110}
          />
        </Stack> */}
      </Box>
    </Box>
  );
};

export default BoardDriver;
