import { useEffect, useState } from "react";
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
  Modal,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import PaletteIcon from "@mui/icons-material/Palette";

import { motion, AnimatePresence } from "framer-motion";

import { useDynamicTourService } from "../../../hooks/useDynamicTourService";
import { scrollStyles } from "../../../theme";
import useDynamicTourStore from "../../../store/useDynamicTourStore";
import { DynamicOrdersList } from "./DynamicOrdersList";
import { Order } from "../../../types/order.type";
import { RejectTourModal } from "./RejectTourModal";
import {
  DynamicTourPayload,
  Geometry,
  Section,
  Stop,
} from "../../../types/tour.type";
import XChip from "../../base-ui/XChip";
import PanelToggleButton from "../tours/PanelToggleButton";
import AlertButton from "../../base-ui/AlertButton";
import CostEvaluator, { CostType } from "../tours/CostEvaluator";
import TourImpactPreview from "../tours/TourImpactPreview";

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

const DynamicTourDetails = () => {
  const fontsize = "0.95rem";

  const {
    pinboard_OrderList,
    selectedTour: tour,
    setSelectedTour,
  } = useDynamicTourStore();

  const {
    showRejectModal,
    setShowRejectModal,
    loading,

    warehouse,
    drivers,
    tourOrders,
    ordersToRemove,
    shouldUpdateTourRoute,
    setShouldUpdateTourRoute,

    selectedPinbOrders,
    handleSelectPinbOrder,

    handleOrderRemove,
    restoreRemovedOrder,

    generateTimeOptions,

    formData,
    today,
    theme,

    handleFormChange,
    handleTourSubmit,
    handleTourReject,
    updateDynamicTour,
  } = useDynamicTourService();

  useEffect(() => {
    console.log("Selected Tour: ", tour);
  }, []);

  const [showWarehouse, setShowWarehouse] = useState(false);
  const [orderExpanded, setOrderExpanded] = useState(false);
  const [expandDetailsPanel, setExpandDetailsPanel] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{
    type: "torders" | "porders";
    order: Order;
  } | null>(null);

  const requestOrderRemove = (type: "torders" | "porders", order: Order) => {
    setPendingRemove({ type, order });
  };
  const confirmOrderRemove = () => {
    if (!pendingRemove) return;

    // debugger;
    handleOrderRemove(pendingRemove.type, pendingRemove.order.order_id);
    setPendingRemove(null);

    // const orderIdToRemove = pendingRemove.order.order_id;
    // updateTourRouteMap(orderIdToRemove);
  };
  // const updateTourRouteMap = (orderId: number) => {
  //   const ordersStops = new Map<number, Stop>();
  //   tour?.tour_route?.stops.forEach((stop) => {
  //     const jobIds = stop.activities.flatMap((act) => act.jobId);
  //     jobIds.forEach((id) => {
  //       const o_id = +id.split("_")[1];
  //       if (!isNaN(o_id)) ordersStops.set(o_id, stop);
  //     });
  //   });

  //   const orderStop = ordersStops.get(orderId);
  //   if (!orderStop) return;

  //   const stopIndex = tour?.tour_route?.stops.findIndex((s) => s === orderStop);
  //   if (!stopIndex || stopIndex === -1) return;

  //   let updatedSections: Section[] = [...tour?.tour_route?.sections!];
  //   if (updatedSections.length > 0) {
  //     updatedSections = updatedSections.filter((_, idx) => {
  //       return idx !== stopIndex! - 1 && idx !== stopIndex;
  //     });
  //   }

  //   if (stopIndex > 0 && stopIndex < tour?.tour_route?.stops.length! - 1) {
  //     const prevStop = tour?.tour_route?.stops[stopIndex - 1]!;
  //     const nextStop = tour?.tour_route?.stops[stopIndex + 1]!;

  //     const reconnectSection: Section = {
  //       summary: {
  //         length: 0,
  //         duration: 0,
  //         baseDuration: 0,
  //       },
  //       coordinates: [
  //         [prevStop.location.lat, prevStop.location.lng],
  //         [nextStop.location.lat, nextStop.location.lng],
  //       ],
  //     };

  //     updatedSections.splice(stopIndex - 1, 0, reconnectSection);
  //   }

  //   // Stop marker
  //   // const updateStops = tour?.tour_route?.stops.filter((stop) =>
  //   //   stop.activities.some((act) => !act.jobId.includes(orderId.toString()))
  //   // );
  //   const updatedStops = tour?.tour_route?.stops.filter(
  //     (stop) => stop !== orderStop
  //   );

  //   const tourRoute: Geometry = {
  //     ...tour?.tour_route,
  //     sections: updatedSections,
  //     stops: updatedStops!,
  //     vehicleId: tour?.tour_route?.vehicleId!,
  //   };

  //   if (tour && tourRoute) {
  //     const updatedTour = { ...tour, tour_route: tourRoute };

  //     setSelectedTour(updatedTour!);
  //   }
  // };

  const extractOrdersLength = (orderIds: string) => {
    if (!orderIds || !orderIds.includes(",")) return;

    return orderIds.split(",").length;
  };

  const handleRouteOptimize = () => {
    debugger;
    if (!shouldUpdateTourRoute) return;
    console.log("Processing Route Optimization...");

    updateDynamicTour();
    // setShouldUpdateTourRoute(false);
  };
  return (
    <>
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.modal + 1 })}
        open={loading}
        // onClick={handleClose}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Main Content */}
      <Box sx={{ position: "relative" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "20vw",
            width: "20vw",
            height: "100%",
            overflow: "hidden",
            p: 1,
            pt: tour ? 0 : 1,
          }}
        >
          <Stack spacing={0} width={"100%"}>
            {/* Options */}
            <Stack direction={"row"} justifyContent={"space-between"}>
              <IconButton onClick={() => setSelectedTour(null)}>
                <ArrowBackIcon sx={{ color: "primary.main", fontSize: 22 }} />
              </IconButton>
              <Box
                display={"flex"}
                flexDirection="row"
                alignItems="center"
                gap={1}
              >
                <Button
                  onClick={() => {
                    setShowWarehouse((prev) => !prev);
                    setExpandDetailsPanel(false);
                  }}
                  variant="contained"
                  sx={{
                    fontSize: "0.9rem",
                    height: "32px",
                    minWidth: "70px",
                    p: 0,
                    textTransform: "none",
                  }}
                >
                  Options
                </Button>

                <AlertButton
                  isActive={shouldUpdateTourRoute}
                  onClick={handleRouteOptimize}
                />
              </Box>
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
              {tour && (
                <Stack spacing={2} width={"100%"}>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      sx={{
                        height: 27,
                        width: 15,
                        bgcolor: (tour.warehouse_colorCode as any) || "error",
                      }}
                    />

                    <Typography sx={{ fontSize: "large" }}>
                      {tour.tour_name}
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
                      label={`Ziele ${extractOrdersLength(tour.orderIds)}`}
                      color="info"
                      variant="outlined"
                    />
                    <XChip
                      label={`Menge ${tour.totalOrdersItemsQty}`}
                      color="success"
                      variant="outlined"
                    />
                    <XChip
                      label={`BKW 35`}
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
                        label={`C: ${new Date(tour.created_at!).toLocaleDateString()}`}
                        color="warning"
                        variant="outlined"
                      />
                      {tour.updated_by && tour.updated_at && (
                        <XChip
                          label={`M: ${tour.updated_by.split("@")[0]} - ${new Date(tour.updated_at).toLocaleDateString()}`}
                          color="error"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Stack>
                </Stack>
              )}

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
                <PanelToggleButton
                  expanded={expandDetailsPanel}
                  onClick={() => setExpandDetailsPanel((prev) => !prev)}
                />
                {/* Total Avgs. */}
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{
                    "& .MuiTypography-root": { fontSize: fontsize },
                  }}
                >
                  <span>
                    <Typography>Total Weight</Typography>
                    <Typography>
                      {tour?.matrix?.totalWeightKg ?? "---"}
                    </Typography>
                  </span>
                  <Divider orientation="vertical" flexItem />
                  <span>
                    <Typography>Total Distance</Typography>
                    <Typography>
                      {tour?.matrix?.totalDistanceKm ?? "---"}
                    </Typography>
                  </span>
                  <Divider orientation="vertical" flexItem />
                  <span>
                    <Typography>Total Duration</Typography>
                    <Typography>
                      {tour?.matrix?.totalDurationHrs ?? "---"}
                    </Typography>
                  </span>
                </Stack>

                <Divider />
                <Box display={"flex"} justifyContent={"space-between"} gap={1}>
                  <span>
                    <Typography variant="subtitle2" fontWeight={"bold"}>
                      Total Cost:
                    </Typography>
                    <Typography variant="subtitle2">
                      Є {tour?.matrix?.totalCost ?? "---"}
                    </Typography>
                  </span>
                  <Stack
                    minWidth={"50%"}
                    spacing={0.2}
                    sx={{
                      "& .MuiTypography-root": {
                        fontSize: fontsize,
                      },
                    }}
                  >
                    <Box display={"flex"} justifyContent={"space-between"}>
                      <Typography>Cost / Stop:</Typography>
                      <Typography>
                        {tour?.matrix?.costPerStop ?? "---"}
                      </Typography>
                    </Box>
                    <Box display={"flex"} justifyContent={"space-between"}>
                      <Typography>Cost / Article:</Typography>
                      <Typography>
                        {tour?.matrix?.costPerArticle ?? "---"}
                      </Typography>
                    </Box>
                    <Box display={"flex"} justifyContent={"space-between"}>
                      <Typography>Cost / SLMD:</Typography>
                      <Typography>
                        {tour?.matrix?.costPerSLMD ?? "---"}
                      </Typography>
                    </Box>
                  </Stack>
                  {/* CostEvaluator */}
                  <Stack spacing={0.2}>
                    {tour?.matrix?.costPerStop && (
                      <CostEvaluator
                        value={tour?.matrix?.costPerStop}
                        stops={tour?.orderIds.split(",").length}
                        costType={CostType.Stop}
                      />
                    )}
                    {tour?.matrix?.costPerArticle && (
                      <CostEvaluator
                        value={tour?.matrix?.costPerArticle}
                        stops={tour?.orderIds.split(",").length}
                        costType={CostType.Article}
                      />
                    )}
                    {tour?.matrix?.costPerSLMD && (
                      <CostEvaluator
                        value={tour?.matrix?.costPerSLMD}
                        stops={tour?.orderIds.split(",").length}
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
                          options={pinboard_OrderList}
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
                          requestOrderRemove("porders", orderItem)
                        }
                      />
                    </Stack>
                  )}
                  {ordersToRemove.length > 0 && (
                    <Stack spacing={1} width="100%">
                      <Typography color="primary">Removed</Typography>
                      <DynamicOrdersList
                        items={ordersToRemove}
                        handleDelete={(orderItem) =>
                          restoreRemovedOrder(orderItem)
                        }
                      />
                    </Stack>
                  )}

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
                    handleDelete={(orderItem) =>
                      requestOrderRemove("torders", orderItem)
                    }
                  />
                </List>
              </Box>
            </Box>
          </Stack>

          {/* Tour Insights */}
          {expandDetailsPanel && tour && (
            <Paper
              elevation={2}
              sx={{
                position: "absolute",
                left: "20vw",
                width: "15vw",
                bgcolor: "background.paper",
                boxShadow: 3,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                height: "100%",
                overflow: "auto",
                py: 1,
                px: 2,
                zIndex: 1300,
                ...scrollStyles(theme),
              }}
            >
              <span>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color={"primary.dark"}
                  textAlign={"center"}
                  gutterBottom
                >
                  Insights Pane
                </Typography>
                <Divider />
              </span>

              <Typography variant="body2" fontWeight={"bold"}>
                {tour.tour_name}
              </Typography>

              {/* Duration */}
              <Box
                display={"flex"}
                justifyContent={"space-between"}
                alignItems="flex-start"
              >
                <span>
                  <Typography variant="subtitle2" fontWeight={"bold"}>
                    Duration
                  </Typography>
                  <Typography variant="subtitle1">
                    {tour.matrix?.totalDurationHrs ?? "---"} hrs
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
              <Box display={"flex"} flexDirection={"column"}>
                <Typography variant="subtitle2" fontWeight={"bold"}>
                  Solar Panels
                </Typography>

                <Table
                  size="small"
                  sx={{
                    "& td": { fontSize: fontsize, px: 0.5 },
                  }}
                >
                  <TableRow>
                    <TableCell align="left">Article</TableCell>
                    <TableCell align="center">Qty</TableCell>
                    <TableCell align="center">Wt / kg</TableCell>
                  </TableRow>
                  <TableBody>
                    {/* {ItemRows.map((row, idx) => ( */}
                    <TableRow key={0}>
                      <Tooltip
                        title="1 x SLMDL415 = 5.5kg"
                        placement="top-start"
                        arrow
                      >
                        <TableCell align="left">
                          {/* {row.article} */}
                          SLMDL415
                        </TableCell>
                      </Tooltip>
                      <TableCell align="center">
                        {/* {row.quantity} */}
                        25
                      </TableCell>
                      <TableCell align="center">
                        {/* {row.quantity} */}
                        137.5
                      </TableCell>
                    </TableRow>
                    <TableRow key={0}>
                      <Tooltip
                        title="1 x SLMDL415 = 5.0kg"
                        placement="top-start"
                        arrow
                      >
                        <TableCell align="left">
                          {/* {row.article} */}
                          SLMDL400
                        </TableCell>
                      </Tooltip>
                      <TableCell align="center">
                        {/* {row.quantity} */}
                        28
                      </TableCell>
                      <TableCell align="center">
                        {/* {row.quantity} */}
                        140
                      </TableCell>
                    </TableRow>
                    {/* total */}
                    <TableRow key={0}>
                      <TableCell align="left" sx={{ fontWeight: "bold" }}>
                        {/* {row.article} */}
                        Total
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold" }}>
                        {/* {row.quantity} */}
                        53
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold" }}>
                        {/* {row.quantity} */}
                        227.5
                      </TableCell>
                    </TableRow>
                    {/* ))} */}
                  </TableBody>
                </Table>
              </Box>

              {/* Cost Breakdown */}
              <Stack spacing={1}>
                <Typography variant="subtitle2" fontWeight={"bold"}>
                  Cost Breakdown
                </Typography>
                {SideHeaderTable(tour)}
              </Stack>
            </Paper>
          )}
        </Box>

        {/* Warehouse Details */}
        {showWarehouse && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: (theme) => theme.zIndex.drawer + 2,
            }}
          >
            <Box
              component="form"
              onSubmit={handleTourSubmit}
              position="absolute"
              top={5}
              left={"20.5vw"}
              // top={55}
              // left={"24vw"}
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

                <FormControl sx={{ width: formStyle.fieldWidth }} size="small">
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
                      value={warehouse?.colorCode || formData.routeColor}
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
                        backgroundColor:
                          warehouse?.colorCode || formData.routeColor,
                        color: theme.palette.getContrastText(
                          warehouse?.colorCode || formData.routeColor
                        ),
                        minWidth: 80,
                      }}
                    />
                  </Box>
                </Box>

                <FormControl sx={{ width: formStyle.fieldWidth }} size="small">
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
                  onClick={() => setShowRejectModal(true)}
                >
                  Reject
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={shouldUpdateTourRoute}
                >
                  Accept
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Order Remove Confirmation Modal */}
      <Modal open={!!pendingRemove} onClose={() => setPendingRemove(null)}>
        <Box sx={{ ...modalStyle, width: 450 }}>
          <Typography variant="h5" mb={2}>
            Do you want to remove{" "}
            <Box component="span" fontWeight="bold">
              Order {pendingRemove?.order?.order_number}
            </Box>{" "}
            from the Tour?
          </Typography>
          <Box display="flex" justifyContent="flex-end" gap={3}>
            <Button
              variant="contained"
              color="error"
              onClick={confirmOrderRemove}
            >
              Remove
            </Button>
            <Button variant="outlined" onClick={() => setPendingRemove(null)}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Tour Reject Confirmation Modal */}
      <RejectTourModal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onReject={handleTourReject}
      />

      {shouldUpdateTourRoute && (
        <TourImpactPreview
          warehouseId={tour?.warehouse_id!}
          orders={[...tourOrders, ...selectedPinbOrders]}
        />
      )}
    </>
  );
};

export default DynamicTourDetails;

function SideHeaderTable(tour: DynamicTourPayload) {
  const headers = [
    "Cost/Stop",
    "Cost/BKW",
    "Cost/SLMD",
    "Vehicle/Van",
    "Diesel",
    "Personnel",
    "Warehouse",
    "Infeed",
    "Hotel",
    "WE Tour",
    "WA Tour",
  ];

  console.log("selectedTour.matrix: ", tour.matrix);

  const dataSet = [
    tour.matrix?.costPerStop,
    tour.matrix?.costPerArticle,
    tour.matrix?.costPerSLMD,
    tour.matrix?.vanTourCost,
    tour.matrix?.dieselTourCost,
    tour.matrix?.personnelTourCost,
    tour.matrix?.warehouseTourCost,
    tour.matrix?.infeedTourCost,
    tour.matrix?.hotelCost,
    tour.matrix?.costWE,
    tour.matrix?.costWA,
  ];
  return (
    <TableContainer>
      <Table
        aria-label="side header table"
        size="small"
        sx={{
          "& td": { fontSize: "0.8rem", px: 0.5 },
          "& th": { fontSize: "0.8rem", fontWeight: "bold" },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell />
            {/* {rows.map((row) => (
              <TableCell key={row.name} align="center">
                {row.name}
              </TableCell>
            ))} */}
            <TableCell align="center">(Є)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {headers.map((header, i) => (
            <TableRow key={header}>
              {/* Header in the first column */}
              <TableCell component="th" scope="row" align="left">
                {header}
              </TableCell>
              {/* Values for each row */}
              <TableCell align="center">{dataSet[i]}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell component="th" scope="row" align="left">
              Total
            </TableCell>
            <TableCell align="center">Є {tour.matrix?.totalCost}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
