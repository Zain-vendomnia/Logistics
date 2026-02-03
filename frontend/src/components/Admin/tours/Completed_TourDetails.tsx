import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  Backdrop,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonIcon from "@mui/icons-material/Person";
import DownloadIcon from "@mui/icons-material/Download";

import { useNavigate } from "react-router-dom";
import AlertButton from "../../base-ui/AlertButton";
import XChip from "../../base-ui/XChip";
import CostEvaluator, { CostType } from "./CostEvaluator";
import { Tourinfo } from "../../../types/tour.type";
import { Order } from "../../../types/order.type";
import { DynamicOrdersList } from "../dynamic_tour/DynamicOrdersList";
import { scrollStyles } from "../../../theme";
import MapBoard from "./MapBoard";
import { useCompletedTourDetails } from "../../../hooks/tours/useCompletedTourDetails";
import SolarPanelQty from "./SolarPanelQty";
import CostBreakdown from "./CostBreakdown";
import { grey } from "@mui/material/colors";

const CompletedTourDetails = () => {
  const fontsize = "1rem";
  const theme = useTheme();
  const navigate = useNavigate();

  const {
    xTour,
    podUrl,
    podBlob,
    tourOrders,
    loadingPod,
    isTourLoading,
    showPodModal,
    handlePreparePOD,
    handleDownloadPOD,
    closePodModal,
  } = useCompletedTourDetails();

  if (!xTour) return null;
  return (
    <>
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.modal + 1 })}
        open={isTourLoading || loadingPod}
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

              {/* Duration */}
              <Box
                display={"flex"}
                justifyContent={"space-between"}
                alignItems="center"
                width={"50%"}
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
                      px: 1,
                      py: 0.25,
                    }}
                  >
                    Day(s): 1
                  </Typography>
                </Paper>
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
                <Typography fontWeight={"bold"}>
                  <Box component="span" color={"primary.dark"}>
                    {tourOrders.length}
                  </Box>{" "}
                  Orders
                </Typography>
                <Typography fontWeight={"bold"} color={"primary.dark"} pr={1}>
                  POD
                </Typography>
              </Box>
              <Divider flexItem />
              <Box
                sx={{
                  flex: 1,
                  ...scrollStyles(theme),
                }}
              >
                <List>
                  <DynamicOrdersList
                    items={tourOrders}
                    handleDelete={() => {}}
                    onSelect={handlePreparePOD}
                  />
                </List>
              </Box>
            </Box>
          </Stack>

          {/* Side Panel */}
          <Stack spacing={2}>
            <Paper
              // elevation={0}
              sx={{
                // position: "absolute",
                top: 0,
                left: "100%",
                ml: 0.5,
                width: { s: "26vw", m: "20vw" },

                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 3,
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
              <Box>
                {/* Cost Breakdown */}
                <Typography
                  variant="h5"
                  textAlign={"center"}
                  fontWeight={"bold"}
                >
                  Cost Breakdown
                </Typography>
                <Stack
                  spacing={3}
                  direction={"row"}
                  justifyContent={"space-around"}
                >
                  <CostBreakdown
                    tourMatrix={xTour.matrix}
                    label={"Estimated"}
                  />
                  <CostBreakdown tourMatrix={xTour.matrix} label={"Actual"} />
                </Stack>
              </Box>

              {xTour.orders && (
                <SolarPanelQty
                  orderItems={xTour.orders?.flatMap((o) => o.items)}
                />
              )}
            </Paper>
            <Box>{}</Box>
          </Stack>
        </Box>

        <Stack width={"100%"} spacing={1}>
          {/* Map View */}
          <Box display="flex" height="50%">
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
          <Stack direction={"row"} height={"50%"} border={"1px red solid"}>
            <Box height={"100%"} width={"60%"} border={"1px red solid"}>
              <Typography variant="h3" fontWeight={"bold"}>
                Driver Performance
              </Typography>
            </Box>
            <Box height={"100%"} width={"40%"} border={"1px red solid"}>
              <Typography variant="h3" fontWeight={"bold"}>
                Tour Images
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Box>

      {podBlob && (
        <Dialog
          onClose={closePodModal}
          open={showPodModal}
          fullWidth
          scroll="paper"
          // maxWidth="lg"
          sx={{
            "& .MuiDialog-paper": {
              width: { xs: "90%", sm: "80%", md: "70%", lg: "60%" },
              maxWidth: { xs: "90%", sm: "600px", md: "900px", lg: "1200px" },
            },
          }}
        >
          <Box sx={{ p: 1, pt: 0 }}>
            <DialogContent>
              {podUrl && (
                <Box sx={{ height: "75vh", mt: 2 }}>
                  <iframe
                    src={podUrl}
                    width="100%"
                    height="100%"
                    style={{ border: "none" }}
                    title="POD Preview"
                  />
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={closePodModal}>Close</Button>
              <Button variant="contained" onClick={handleDownloadPOD}>
                Downlaod
                <DownloadIcon sx={{ ml: 0.5 }} />
              </Button>
            </DialogActions>
          </Box>
        </Dialog>
      )}
    </>
  );
};

export default CompletedTourDetails;
