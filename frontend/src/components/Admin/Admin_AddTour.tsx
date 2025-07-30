import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Stack,
  Divider,
  Paper,
} from "@mui/material";
import { AddRoad, LocalShipping } from "@mui/icons-material";
import AdminMultiselectCard from "./Admin_MultiselectCard";
import AdminOrderTable from "./Admin_OrderTable";
import CreateTourModal from "./Admin_CreateTourModal";
import { LogisticOrder } from "./AdminServices/latestOrderServices";
import "./css/Admin_common.css";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../../store/useNotificationStore";
import {
  LogisticsRoute,
  Stop,
  TourData,
  TourResponse,
} from "../../types/tour.type";
import Admin_HereMap from "./Admin_HereMap";

const Admin_AddTour = () => {
  const { showNotification } = useNotificationStore();
  const [selectedWarehouses, setSelectedWarehouses] = useState<number[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [ordersData, setOrdersData] = useState<LogisticOrder[]>([]);

  const [modalConfig, setModalConfig] = useState<{
    open: boolean;
    warehouseId?: number;
    orderIds?: number[];
  }>({ open: false });

  const [tourData, setTourData] = useState<TourData | null>(null);

  const selectedOrdersData = ordersData.filter((order) =>
    selectedOrders.includes(order.order_id)
  );

  const firstWarehouseId = selectedOrdersData[0]?.warehouse_id;
  const allSameWarehouse = selectedOrdersData.every(
    (order) => order.warehouse_id === firstWarehouseId
  );
  const handleCreateTourClick = () => {
    if (!selectedOrders.length)
      return showNotification({
        message: "Please select orders",
        severity: NotificationSeverity.Warning,
      });

    if (!allSameWarehouse)
      return showNotification({
        message: "Selected orders must belong to same warehouse",
        severity: NotificationSeverity.Warning,
      });

    console.log("Selected Orders:", selectedOrders);
    setModalConfig({
      open: true,
      warehouseId: firstWarehouseId,
      orderIds: selectedOrders,
    });
  };

  const handleTourData = (data: TourResponse) => {
    console.log("Tour Data from parent component", data);

    const firstRoute: LogisticsRoute = data.routes?.[0];
    const route_sections = firstRoute?.geometry.sections;
    if (!firstRoute || !Array.isArray(route_sections)) {
      console.error("❌ 'sections' not found in first route:", firstRoute);
      return;
    }

    const polylineCoords: [number, number][] = route_sections.flatMap(
      (section: any) =>
        section.coordinates.map((point: any) => [point.lat, point.lng])
    );

    const stops: Stop[] = firstRoute.geometry.stops || [];

    setTourData({
      routePolyline: polylineCoords,
      stops,
    });
  };

  return (
    <Box
      sx={{
        padding: "24px",
        minHeight: "calc(100vh - 50px)",
        backgroundColor: "#59555626",
        position: "relative",
      }}
    >
      <Stack spacing={3} maxWidth="xl" margin="0 auto">
        {/* Multiselect Card Section */}
        <Paper
          elevation={0}
          sx={{
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #e0e0e0",
          }}
        >
          <AdminMultiselectCard
            selectedWarehouses={selectedWarehouses}
            setSelectedWarehouses={setSelectedWarehouses}
          />
        </Paper>

        {/* Orders Section */}
        <Card
          elevation={0}
          sx={{
            borderRadius: "8px",
            border: "1px solid #e0e0e0",
          }}
        >
          <CardContent>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={2}
              sx={{ marginBottom: "24px" }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <LocalShipping color="primary" fontSize="medium" />
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ color: "#f7941d" }}
                >
                  Latest Orders
                </Typography>
              </Stack>

              <Button
                variant="outlined"
                startIcon={<AddRoad />}
                onClick={handleCreateTourClick}
                sx={(theme) => ({
                  padding: "8px 24px",
                  borderRadius: "4px",
                  textTransform: "none",
                  fontWeight: "500",
                  background: theme.palette.primary.gradient,
                  color: theme.palette.primary.contrastText,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    background: theme.palette.primary.dark,
                    color: theme.palette.primary.contrastText,
                  },
                })}
              >
                Create Tour
              </Button>
            </Stack>

            <Divider sx={{ marginBottom: "24px" }} />

            <AdminOrderTable
              selectedWarehouses={selectedWarehouses}
              setOrdersData={setOrdersData}
              setSelectedOrders={setSelectedOrders}
            />
          </CardContent>
        </Card>
      </Stack>

      {modalConfig.open && (
        <CreateTourModal
          open={modalConfig.open}
          warehouseId={modalConfig.warehouseId}
          orderIds={modalConfig.orderIds}
          handleClose={() => setModalConfig({ open: false })}
          onTourCreated={handleTourData}
        />
      )}

      {tourData && <Admin_HereMap tourData={tourData} />}
    </Box>
  );
};

export default Admin_AddTour;
