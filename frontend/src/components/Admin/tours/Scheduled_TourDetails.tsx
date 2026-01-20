import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  Backdrop,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

import PaletteIcon from "@mui/icons-material/Palette";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import { motion, AnimatePresence } from "framer-motion";

import { scrollStyles } from "../../../theme";
import { Order } from "../../../types/order.type";
import {
  rejectTour_Req,
  Tourinfo,
  UpdateTour_Req,
} from "../../../types/tour.type";
import XChip from "../../base-ui/XChip";
import PanelToggleButton from "./PanelToggleButton";
import AlertButton from "../../base-ui/AlertButton";
import CostEvaluator, { CostType } from "./CostEvaluator";
import TourImpactPreview from "./TourImpactPreview";
import CostBreakdown from "./CostBreakdown";
import SolarPanelQty from "./SolarPanelQty";
import { DynamicOrdersList } from "../dynamic_tour/DynamicOrdersList";
import MapBoard from "./MapBoard";
import { Driver, Warehouse } from "../../../types/warehouse.type";
import { useNavigate, useParams } from "react-router-dom";
import { RejectTourModal } from "../dynamic_tour/RejectTourModal";
import { getCurrentUser } from "../../../services/auth.service";
import { getAvailableDrivers } from "../../../services/driverService";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../../../store/useNotificationStore";
import { tourService } from "../../../services/tour.service";
import { generateTimeOptions } from "../../../utils/tourHelper";

const modalStyle = {
  position: "absolute",
  top: "25%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  pt: 2,
  px: 4,
  pb: 3,
};

const formStyle = {
  fieldWidth: 190,
  fontSize: "1rem",
};

const ScheduledTourDetails = () => {
  const fontsize = "1rem";
  const theme = useTheme();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { id: tourId } = useParams<{ id: string }>();

  const [xTour, setXTour] = useState<Tourinfo | null>(null);
  const [tourOrders, setTourOrders] = useState<Order[]>([]);

  const [pinboardOrders, setPinboardOrders] = useState<Order[]>([]);
  const lastFetchedAt: number | null = null;

  const [ordersToRemove, setOrdersToRemove] = useState<Order[]>([]);
  const [selectedPinbOrders, setSelectedPinbOrders] = useState<Order[]>([]);

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const loadTour = useCallback(async (tourId: number) => {
    setIsLoading(true);
    try {
      const tour: Tourinfo = await tourService.getTourDetails(tourId);
      setXTour(tour);
      setTourOrders(tour.orders || []);
      // get warehouse details
      const warehouseRes: Warehouse = await tourService.getWarehouseDetails(
        tour.warehouse_id,
      );
      setWarehouse(warehouseRes);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const orderIdxLookup = useMemo(() => {
    return new Map<number, number>(
      tourOrders.map((order, idx) => [order.order_id, idx]),
    );
  }, [xTour]);

  const loadPinboardOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const now = Date.now();
      const staleAfter = 30 * 60 * 1000; // 30 minutes
      const isStale = !lastFetchedAt || now - lastFetchedAt > staleAfter;

      if (pinboardOrders.length === 0 || isStale) {
        const orders: Order[] =
          await tourService.getPinboardOrders(lastFetchedAt);

        if (orders.length) {
          const existingIds = new Set(pinboardOrders.map((o) => o.order_id));
          const newOrders = orders.filter((o) => !existingIds.has(o.order_id));
          setPinboardOrders(newOrders);
        }
      }
    } catch (err) {
      console.error("Failed to fetch pinboard Orders", err);
    } finally {
      setIsLoading(false);
    }
  }, [pinboardOrders.length]);

  useEffect(() => {
    if (!tourId) return;
    loadTour(Number(tourId));
  }, [tourId]);

  useEffect(() => {
    loadPinboardOrders();
  }, []);

  const [shouldUpdateTourRoute, setShouldUpdateTourRoute] =
    useState<boolean>(false);
  const [shouldUpdateTourData, setShouldUpdateTourData] =
    useState<boolean>(false);

  const [orderExpanded, setOrderExpanded] = useState(false);
  const [expandDetailsPanel, setExpandDetailsPanel] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);

  const [showWarehouseDetails, setShowWarehouseDetails] = useState(false);

  const handleSelectPinbOrder = async (newValue: Order[]) => {
    if (newValue.length === 0) {
      setSelectedPinbOrders([]);
      return;
    }
    const orderIds = newValue.map((o) => o.order_id);

    const pOrders = pinboardOrders.filter((po) =>
      orderIds.includes(po.order_id),
    );

    setSelectedPinbOrders(pOrders);
  };

  function handleTourOrderRemove(orderItem: Order) {
    setTourOrders((prev) => {
      setOrdersToRemove((removed) => [orderItem, ...removed]);
      return prev.filter((o) => o.order_id !== orderItem.order_id);
    });
  }
  const restoreRemovedOrder = (reqOrder?: Order, all: boolean = false) => {
    if (all) {
      setTourOrders((prev) => {
        const restored = [...prev];
        ordersToRemove.forEach((order) => {
          const oIdx = orderIdxLookup.get(order.order_id);
          oIdx && restored.splice(oIdx, 0, order);
        });

        return restored;
      });

      setOrdersToRemove([]);
      return;
    }

    if (!reqOrder) return;

    const removed = ordersToRemove.find(
      (o) => o.order_id === reqOrder.order_id,
    );
    if (!removed) return;

    const removed_oIdx = orderIdxLookup.get(reqOrder.order_id);
    if (removed_oIdx === undefined) return;

    setTourOrders((prev) => {
      if (prev.some((o) => o.order_id === removed.order_id)) {
        return prev;
      }
      const next = [...prev];
      next.splice(removed_oIdx, 0, removed);
      return next;
    });

    setOrdersToRemove((prev) =>
      prev.filter((o) => o.order_id !== reqOrder.order_id),
    );

    // const exist_selectedOrderIds = xTour?.orderIds
    //   .split(",")
    //   .map(Number)
    //   .includes(reqOrder.order_id);
    // if (exist_selectedOrderIds) {
    //   setTourOrders((prev) => [...prev, reqOrder]);
    //   return;
    // }
  };

  const { showNotification } = useNotificationStore();
  // const { handleTourReject } = useDynamicTourService();

  const today = new Date().toISOString().split("T")[0];
  const initialFormState = {
    // driverId: "",
    driverId: "",
    tourDate: today,
    startTime: "07:30",
    routeColor: theme.palette.primary.light,
  };

  const [formData, setFormData] = useState(initialFormState);
  const formDataRef = useRef(formData);

  const handleFormChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setShouldUpdateTourData(true);
  };

  const handleUpdateTour = async () => {
    console.log("Latest formData Ref:", formDataRef.current);
    console.log("Latest formData:", formData);

    const form = formDataRef.current;

    if (!xTour) return;
    setIsLoading(true);
    try {
      const removedOrderIds = new Set(ordersToRemove.map((ro) => ro.order_id));
      let xOrdersIds = tourOrders
        .filter((to) => !removedOrderIds.has(to.order_id))
        .map((o) => o.order_id);

      xOrdersIds = [
        ...xOrdersIds,
        ...selectedPinbOrders.map((po) => po.order_id),
      ];

      const request: UpdateTour_Req = {
        id: xTour.id,
        tourName: xTour.tour_name,
        tourDate: form.tourDate,
        startTime: form.startTime,
        routeColor: form.routeColor,
        orderIds: xOrdersIds,
        driverId: Number(form.driverId),
        vehicleId: xTour.vehicle_id,
        warehouseId: warehouse?.id!, // ensure from warehouse service
        userId: getCurrentUser().email, // service helper
        comments: "",
      };
      const updatedTour = await tourService.updateTour(request);
      showNotification({
        message: `Tour ${updatedTour.tour_name} updated successfully`,
        severity: NotificationSeverity.Success,
        duration: 8000,
      });
    } catch (error: unknown) {
      console.error("Error updating tour:", error);
      showNotification({
        message: "Error accepting tour",
        severity: NotificationSeverity.Error,
        duration: 8000,
      });
    } finally {
      setOrdersToRemove([]);
      setSelectedPinbOrders([]);
      setIsLoading(false);
      setShouldUpdateTourRoute(false);
      setShouldUpdateTourData(false);
    }
  };

  const handleRouteOptimize = () => {
    if (!shouldUpdateTourRoute) return;

    showNotification({ message: "Processing Route Optimization..." });
    handleUpdateTour();
  };

  const fetchEligibleDrivers = async (date: string) => {
    if (!xTour) return;

    try {
      const res = await getAvailableDrivers(date, xTour.warehouse_id ?? 0);
      const availableDrivers = res.available || [];
      const unavailableDrivers = (res.unavailable || []).map((item: any) => ({
        id: item.driver.id,
        name: item.driver.name,
        status: 0,
        reason: item.reason,
      }));

      setDrivers([...availableDrivers, ...unavailableDrivers]);
    } catch (err) {
      console.error("Failed to fetch eligible drivers:", err);
      setDrivers([]);
    }
  };

  const handleTourReject = async (reason: string) => {
    setIsLoading(true);
    try {
      const request: rejectTour_Req = {
        tour_id: xTour?.id!,
        userId: getCurrentUser().email,
        reason,
      };

      // await tourService.rejectTourInstance(request);

      showNotification({
        message: `Tour ${xTour?.tour_name} Rejected Successfully`,
        severity: NotificationSeverity.Success,
      });
    } catch (error: unknown) {
      console.error("Error Rejecting Tour:", error);
      showNotification({
        message: "Error Rejecting Tour",
        severity: NotificationSeverity.Error,
      });
    } finally {
      setXTour(null);
      setSelectedPinbOrders([]);
      setOrdersToRemove([]);
      setIsLoading(false);
      navigate("/scheduled/tour");
    }
  };

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    if (!xTour) return;

    fetchEligibleDrivers(xTour.tour_date);

    setFormData({
      driverId: xTour.driver_id?.toString() ?? "",
      tourDate: xTour.tour_date ? xTour.tour_date.split("T")[0] : today,
      startTime: xTour.start_time
        ? xTour.start_time.slice(0, 5) // "07:00"
        : "07:30",
      routeColor: xTour.warehouse_colorCode ?? theme.palette.primary.light,
    });
  }, [xTour?.warehouse_id]);

  // To udpate driver list on selected date
  useEffect(() => {
    if (!xTour) return;
    fetchEligibleDrivers(xTour.tour_date);
  }, [formData.tourDate]);

  const tourAction = useMemo(() => {
    const orderIdsArray =
      typeof xTour?.orderIds === "string"
        ? xTour.orderIds.split(",").map(Number).length
        : 0;

    if (
      orderIdsArray !== tourOrders.length ||
      selectedPinbOrders.length > 0 ||
      shouldUpdateTourData === true
    ) {
      setShouldUpdateTourRoute(true);
      return { title: "Update Tour", onClick: handleUpdateTour };
    } else {
      setShouldUpdateTourRoute(false);
    }
    // return {
    //   title: "",
    //   onClick: () => {},
    // };
  }, [
    xTour?.orderIds,
    tourOrders.length,
    selectedPinbOrders.length,
    shouldUpdateTourData,
  ]);

  const showUpdateTourButton = shouldUpdateTourRoute || shouldUpdateTourData;

  if (!xTour) return null;

  return (
    <>
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.modal + 1 })}
        open={isLoading}
        // onClick={handleClose}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Main Content */}
      <Box display="flex" height="100%" width="100%">
        {/* Details */}
        <Box display="flex" position={"relative"} height={"100%"}>
          <Stack
            spacing={1}
            sx={{
              maxWidth: "22vw",
              width: "20vw",
              minWidth: 320,
              height: "100%",
              overflow: "hidden",
              p: 1,
              bgcolor: "background.paper",
            }}
          >
            {/* Options */}
            <Stack
              direction={"row"}
              // justifyContent={"space-between"}
              alignItems={"center"}
              sx={{ width: "100%" }}
            >
              <IconButton onClick={() => navigate(-1)} sx={{ mr: "auto" }}>
                <ArrowBackIcon sx={{ color: "primary.main", fontSize: 22 }} />
              </IconButton>

              {/* Right Actions */}
              <Stack
                spacing={2}
                direction={"row"}
                alignItems="center"
                justifyContent={"flex-end"}
                sx={{ whiteSpace: "nowrap" }}
              >
                <AlertButton
                  isActive={shouldUpdateTourRoute}
                  onClick={handleRouteOptimize}
                />
                <Button
                  variant="contained"
                  onClick={() => setShowWarehouseDetails((prev) => !prev)}
                  // onClick={tourAction.onClick}
                  sx={{
                    fontSize: "0.9rem",
                    height: "34px",
                    mr: 1,
                    textTransform: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {/* {tourAction.title} */}
                  Options
                </Button>

                <PanelToggleButton
                  expanded={expandDetailsPanel}
                  onClick={() => setExpandDetailsPanel((prev) => !prev)}
                  sx={{ top: 0, right: 0 }}
                />
              </Stack>
            </Stack>

            {/* Content */}
            <Box
              sx={{
                padding: 1,
                pt: 1.5,
                width: "100%",
                borderRadius: 2,
                marginBottom: 1,
                border: "1px solid #ccc",
                backgroundColor: "#f0f0f0",
              }}
            >
              {
                <Stack spacing={2} width={"100%"}>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      sx={{
                        height: 27,
                        width: 15,
                        bgcolor: (xTour.warehouse_colorCode as any) || "error",
                      }}
                    />

                    <Typography sx={{ fontSize: "large" }}>
                      {xTour.tour_name}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    // spacing={1}
                    flexWrap={"wrap"}
                    gap={1}
                    overflow={"hidden"}
                  >
                    <XChip
                      label={`Ziele ${xTour.orderIds.split(",").length}`}
                      color="info"
                      variant="outlined"
                    />
                    <XChip
                      label={`Menge ${xTour.matrix?.totalOrdersItemsQty}`}
                      color="success"
                      variant="outlined"
                    />
                    <XChip
                      label={`BKW ${xTour.matrix?.totalOrdersArticlesQty}`}
                      color="warning"
                      variant="outlined"
                    />
                    <XChip
                      label={`Pick-ups 3`}
                      color="#777"
                      variant="outlined"
                    />
                    <Stack direction="row" spacing={1}>
                      <XChip
                        label={`C: ${new Date(xTour.created_at!).toLocaleDateString()}`}
                        color="warning"
                        variant="outlined"
                      />
                      {xTour.updated_by && xTour.updated_at && (
                        <XChip
                          label={`M: ${xTour.updated_by.split("@")[0]} - ${new Date(xTour.updated_at).toLocaleDateString()}`}
                          color="error"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Stack>
                </Stack>
              }

              <Box
                display={"flex"}
                flexDirection={"column"}
                gap={1}
                px={1}
                pt={2}
                sx={{
                  width: "100%",
                  // height: 200,
                }}
              >
                <Divider />

                {/* Total Avgs. */}
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    "& .MuiTypography-root": {
                      variant: "body2",
                      fontSize: "0.9rem",
                    },
                  }}
                >
                  <span>
                    <Typography fontWeight={"bold"}>Total Weight</Typography>
                    <Typography>
                      {xTour?.matrix?.totalWeightKg ?? "---"}
                    </Typography>
                  </span>
                  <Divider orientation="vertical" flexItem />
                  <span>
                    <Typography fontWeight={"bold"}>Total Distance</Typography>
                    <Typography>
                      {xTour?.matrix?.totalDistanceKm ?? "---"}
                    </Typography>
                  </span>
                  <Divider orientation="vertical" flexItem />
                  <span>
                    <Typography fontWeight={"bold"}>Total Duration</Typography>
                    <Typography>
                      {xTour?.matrix?.totalDurationHrs ?? "---"}
                    </Typography>
                  </span>
                </Stack>

                <Divider />
                <Box display={"flex"} justifyContent={"space-between"} gap={1}>
                  <span>
                    <Typography variant="subtitle1" fontWeight={"bold"}>
                      Total Cost:
                    </Typography>
                    <Typography variant="subtitle1">
                      Є {xTour?.matrix?.totalCost ?? "---"}
                    </Typography>
                  </span>
                  <Stack
                    minWidth={"50%"}
                    spacing={0.2}
                    // sx={{
                    //   "& .MuiTypography-root": {
                    //     fontSize: fontsize,
                    //   },
                    // }}
                  >
                    <Box display={"flex"} justifyContent={"space-between"}>
                      <Typography variant="subtitle1">Cost/Stop:</Typography>
                      <Typography variant="subtitle1">
                        {xTour?.matrix?.costPerStop ?? "---"}
                      </Typography>
                    </Box>
                    <Box display={"flex"} justifyContent={"space-between"}>
                      <Typography variant="subtitle1">Cost/Article:</Typography>
                      <Typography variant="subtitle1">
                        {xTour?.matrix?.costPerArticle ?? "---"}
                      </Typography>
                    </Box>
                    <Box display={"flex"} justifyContent={"space-between"}>
                      <Typography variant="subtitle1">Cost/SLMD:</Typography>
                      <Typography variant="subtitle1">
                        {xTour?.matrix?.costPerSLMD ?? "---"}
                      </Typography>
                    </Box>
                  </Stack>
                  {/* CostEvaluator */}
                  <Stack spacing={0.5} ml={1}>
                    {xTour?.matrix?.costPerStop && (
                      <CostEvaluator
                        value={xTour?.matrix?.costPerStop}
                        stops={tourOrders.length}
                        costType={CostType.Stop}
                      />
                    )}
                    {xTour?.matrix?.costPerArticle && (
                      <CostEvaluator
                        value={xTour?.matrix?.costPerArticle}
                        stops={tourOrders.length}
                        costType={CostType.Article}
                      />
                    )}
                    {xTour?.matrix?.costPerSLMD && (
                      <CostEvaluator
                        value={xTour?.matrix?.costPerSLMD}
                        stops={tourOrders.length}
                        costType={CostType.Slmd}
                      />
                    )}
                  </Stack>
                </Box>
              </Box>
            </Box>

            {/* Order List */}
            <Box
              sx={{
                p: 1,
                pr: 0,
                bgcolor: "white",
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                height: "calc(100vh - 470px)",
                overflow: "hidden",
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                flexShrink={0}
                p={0}
              >
                <Typography>
                  <Box component="span" color={"primary.dark"}>
                    {tourOrders.length}
                  </Box>{" "}
                  Orders
                </Typography>

                <Box display="flex" alignItems={"center"} gap={1}>
                  <AnimatePresence mode="wait">
                    {!orderExpanded ? (
                      <motion.div
                        key="icon"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.25 }}
                      >
                        <IconButton
                          color="primary"
                          onClick={() => setOrderExpanded((prev) => !prev)}
                        >
                          <AddCircleOutlineIcon />
                        </IconButton>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="select"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "170px", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: "hidden", maxWidth: "180px" }}
                      >
                        <Autocomplete
                          multiple
                          disableCloseOnSelect
                          options={pinboardOrders}
                          getOptionLabel={(option) => option.order_number}
                          groupBy={(option) => option.warehouse_town!}
                          value={selectedPinbOrders}
                          onChange={(_, newValue) =>
                            handleSelectPinbOrder(newValue)
                          }
                          isOptionEqualToValue={(option, value) =>
                            option.order_id === value.order_id
                          }
                          renderTags={() => null} // hides chips
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              variant="standard"
                              placeholder={
                                selectedPinbOrders.length > 0
                                  ? "Selected Orders"
                                  : "Select Orders"
                              }
                              size="small"
                              sx={{
                                mt: 0,
                                top: 0,
                                pt: 0,
                                "& .MuiInputBase-input": {
                                  fontSize: "1.1rem",
                                  // padding: "4px 6px",
                                },
                              }}
                            />
                          )}
                          slotProps={{
                            listbox: {
                              sx: {
                                "& .MuiAutocomplete-groupLabel": {
                                  fontWeight: "bold",
                                  fontSize: "1.07rem",
                                  color: "primary.main",
                                  backgroundColor: "rgba(0,0,0,0.04)", // subtle bg highlight
                                  px: 1,
                                  // py: 0.2,
                                },
                                "& .MuiAutocomplete-option": {
                                  fontSize: "1rem",
                                  padding: "4px 16px",
                                },
                              },
                            },
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>
              </Box>
              <Divider flexItem />
              <Box
                sx={{
                  flex: 1,
                  // width: "100%",
                  ...scrollStyles(theme),
                }}
              >
                <List>
                  {selectedPinbOrders.length > 0 && (
                    <Stack spacing={1} width="100%">
                      <Typography color="primary">New Orders</Typography>
                      <DynamicOrdersList
                        items={selectedPinbOrders}
                        handleDelete={(orderItem) =>
                          setSelectedPinbOrders((prev) =>
                            prev.filter(
                              (po) => po.order_id !== orderItem.order_id,
                            ),
                          )
                        }
                      />
                    </Stack>
                  )}
                  {ordersToRemove.length > 0 && (
                    <Stack spacing={1} width="100%">
                      <Box
                        display={"flex"}
                        flexDirection="row"
                        alignItems={"center"}
                        justifyContent={"space-between"}
                      >
                        <Typography color="primary">Removed</Typography>
                        <IconButton>
                          <DeleteSweepIcon
                            onClick={() => restoreRemovedOrder(undefined, true)}
                            color="success"
                          />
                        </IconButton>
                      </Box>
                      <DynamicOrdersList
                        items={ordersToRemove}
                        handleDelete={(orderItem) =>
                          restoreRemovedOrder(orderItem)
                        }
                      />
                    </Stack>
                  )}{" "}
                  {(ordersToRemove.length > 0 ||
                    selectedPinbOrders.length > 0) && (
                    <>
                      <Divider />
                      <Typography color="primary" sx={{ py: 1 }}>
                        Tour Orders
                      </Typography>
                    </>
                  )}
                  <DynamicOrdersList
                    items={tourOrders}
                    handleDelete={handleTourOrderRemove}
                  />
                </List>
              </Box>
            </Box>
          </Stack>

          {/* Side Panel */}
          {expandDetailsPanel && xTour && (
            <Paper
              elevation={4}
              sx={{
                position: "absolute",
                top: 0,
                left: "100%",
                ml: 0.5,
                width: "18vw",

                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                height: "100%",
                overflow: "auto",
                py: 1,
                px: 2,

                zIndex: 500,
                bgcolor: "background.paper",
                boxShadow:
                  "0 0 0 1px rgba(0,0,0,0.08), 4px 0 12px rgba(0,0,0,0.15)",
                backdropFilter: "blur(2px)",
                pointerEvents: "auto",
                ...scrollStyles(theme),
              }}
            >
              <span>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color={"primary.dark"}
                  textAlign={"center"}
                  gutterBottom
                >
                  Details
                </Typography>
                <Divider />
              </span>
              <Stack spacing={3}>
                <Typography variant="body1" fontWeight={"bold"}>
                  {xTour.warehouse_town} - {xTour.warehouse_address}
                </Typography>

                {/* Duration */}
                <Box
                  display={"flex"}
                  justifyContent={"space-between"}
                  alignItems="flex-start"
                >
                  <span>
                    <Typography variant="body2" fontWeight={"bold"}>
                      Duration
                    </Typography>
                    <Typography variant="body2">
                      {xTour.matrix?.totalDurationHrs ?? "---"} hrs
                    </Typography>
                  </span>

                  <Paper elevation={1}>
                    <Typography
                      fontSize={fontsize}
                      sx={{
                        border: "1px solid",
                        borderColor: "grey.400",
                        borderRadius: 1,
                        px: 1,
                        py: 0.25,
                      }}
                    >
                      Day(s): 1
                    </Typography>
                  </Paper>
                </Box>
                {/* Solar Panels Qty/Wt*/}
                <SolarPanelQty tour={xTour as Tourinfo} />
                {/* Cost Breakdown */}
                <CostBreakdown tourMatrix={xTour.matrix} />
              </Stack>
            </Paper>
          )}

          {/* Warehouse Details */}
          {showWarehouseDetails && (
            <Box
              sx={{
                position: "absolute",
                left: "100%",
                ml: 0.5,
                pointerEvents: "none",
                zIndex: (theme) => theme.zIndex.drawer + 1,
              }}
            >
              <Box
                component="form"
                // onSubmit={handleTourSubmit}
                width={{ xs: "65%", sm: 480 }}
                bgcolor="white"
                borderRadius={2}
                boxShadow="0 4px 12px rgba(0,0,0,0.2)"
                p={3}
                sx={{
                  pointerEvents: "auto",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Box
                  display={"flex"}
                  justifyContent={"space-between"}
                  width="100%"
                >
                  <Stack spacing={-0.5} width={"55%"}>
                    <Box display={"flex"} position={"relative"} width={"100%"}>
                      <Typography variant="h4">{warehouse?.town}</Typography>
                      <Badge
                        sx={{ position: "absolute", top: -5, right: 70 }}
                        badgeContent={`zip:${warehouse?.zipcode}`}
                        color="primary"
                      />
                    </Box>

                    <Typography
                      variant="subtitle2"
                      sx={{
                        maxWidth: "85%",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        // display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        lineClamp: 2,
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                      }}
                    >
                      {warehouse?.zip_codes_delivering}
                    </Typography>
                  </Stack>
                  <Stack spacing={-0.5} width={"45%"}>
                    <Typography variant="subtitle2" fontSize={"small"}>
                      <strong> Name: </strong>
                      {warehouse?.name}
                    </Typography>
                    <Typography variant="subtitle2" fontSize={"small"}>
                      <strong>Address: </strong>
                      {warehouse?.address}
                    </Typography>
                  </Stack>
                </Box>

                <Box
                  width="100%"
                  display="flex"
                  alignItems="space-between"
                  justifyContent="space-between"
                  gap={2}
                >
                  <TextField
                    type="date"
                    name="tourDate"
                    value={formData.tourDate}
                    onChange={handleFormChange}
                    size="small"
                    fullWidth
                    required
                    sx={{
                      "& .MuiInputBase-input": { fontSize: formStyle.fontSize }, // input text
                      flex: "1 1 45%",
                    }}
                    slotProps={{
                      htmlInput: { min: today },
                    }}
                  />

                  <FormControl
                    sx={{ width: formStyle.fieldWidth }}
                    size="small"
                  >
                    <InputLabel
                      sx={{ fontSize: formStyle.fontSize, top: "-6px" }}
                    >
                      Start Time*
                    </InputLabel>
                    <Select
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleFormChange}
                      required
                      // sx={{ fontSize: formStyle.fontSize }}
                      input={
                        <OutlinedInput
                          label="Start Date"
                          sx={{ fontSize: formStyle.fontSize, flex: "1 1 45%" }}
                        />
                      }
                    >
                      {generateTimeOptions().map((time) => (
                        <MenuItem key={time} value={time}>
                          {time}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box display="flex" justifyContent={"flex-end"} flex="1 1 45%">
                  <Box flex="1 1 45%">
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <PaletteIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2">Route Color:</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box
                        component="input"
                        type="color"
                        name="routeColor"
                        value={formData.routeColor}
                        onChange={handleFormChange}
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: 1,
                          border: `1px solid ${theme.palette.divider}`,
                          cursor: "pointer",
                        }}
                      />
                      <Chip
                        label={formData.routeColor.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: formData.routeColor,
                          color: theme.palette.getContrastText(
                            warehouse?.colorCode || formData.routeColor,
                          ),
                          minWidth: 80,
                        }}
                      />
                    </Box>
                  </Box>

                  <FormControl
                    sx={{ width: formStyle.fieldWidth }}
                    size="small"
                  >
                    <InputLabel
                      sx={{ fontSize: formStyle.fontSize, top: "-6px" }}
                    >
                      Driver*
                    </InputLabel>
                    <Select
                      name="driverId"
                      value={formData.driverId}
                      onChange={handleFormChange}
                      input={
                        <OutlinedInput
                          label="Driver"
                          sx={{ fontSize: formStyle.fontSize }}
                        />
                      }
                      required
                    >
                      <MenuItem
                        value=""
                        disabled
                        sx={{ fontSize: formStyle.fontSize }}
                      >
                        <em>Select Driver</em>
                      </MenuItem>
                      {drivers.map((drvr, idx) => (
                        <MenuItem
                          key={idx}
                          value={drvr.id}
                          sx={{ fontSize: formStyle.fontSize }}
                          disabled={drvr.status === 0}
                        >
                          {drvr.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box
                  width="100%"
                  display="flex"
                  justifyContent="flex-end"
                  gap={3}
                  mt={0}
                >
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      setShowRejectModal(true);
                    }}
                  >
                    Reject
                  </Button>
                  {showUpdateTourButton && (
                    <Button
                      type="submit"
                      variant="contained"
                      // disabled={shouldUpdateTourRoute}
                      onClick={tourAction?.onClick}
                    >
                      {tourAction?.title}
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {/* Map View */}
        <Box display="flex" height="100%" width="100%">
          <MapBoard
            tours={[
              {
                geometry: xTour?.tour_route!,
                color: xTour.route_color,
              },
            ]}
            tourOrders={tourOrders}
          />
        </Box>
      </Box>

      {/* Tour Reject Confirmation Modal */}
      <RejectTourModal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onReject={handleTourReject}
      />

      {shouldUpdateTourRoute && (
        <TourImpactPreview
          warehouseId={xTour?.warehouse_id!}
          orders={[...tourOrders, ...selectedPinbOrders]}
        />
      )}
    </>
  );
};

export default ScheduledTourDetails;
