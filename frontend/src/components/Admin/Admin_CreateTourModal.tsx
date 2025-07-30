import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Modal,
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Stack,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Palette, Schedule, Person } from "@mui/icons-material";

import { getAvailableDrivers } from "../../services/driverService";
import {
  CreateTour,
  LogisticsRoute,
  Stop,
  TourData,
  TourResponse,
} from "../../types/tour.type";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../../store/useNotificationStore";
import adminApiService from "../../services/adminApiService";

interface Props {
  open: boolean;
  warehouseId?: number;
  orderIds?: number[];
  handleClose: () => void;
  onTourCreated: (tourData: TourResponse) => void;
}

interface Driver {
  id: number;
  name: string;
  warehouse_id?: number;
  status: number;
}

const generateTimeOptions = () =>
  Array.from(
    { length: 48 },
    (_, i) =>
      `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`
  );

const CreateTourModal = ({
  open,
  warehouseId = 0,
  orderIds = [],
  handleClose,
  onTourCreated,
}: Props) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const { showNotification } = useNotificationStore();

  const [comments, setComments] = useState("");
  const [startTime, setStartTime] = useState("");
  const [routeColor, setRouteColor] = useState(theme.palette.primary.main);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [tourDate, setTourDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const [tourData, setTourData] = useState<TourResponse | null>(null);
  // const [tourData, setTourData] = useState<TourData | null>(null);

  useEffect(() => {
    if (!warehouseId || !orderIds) {
      showNotification({
        message: `Invalid data provided`,
        severity: NotificationSeverity.Error,
      });
      console.log("Invalid data provided");
      return;
    }
  }, []);

  useEffect(() => {
    if (!tourData) return;

    handleClose();
    onTourCreated(tourData);
  }, [tourData]);

  const createTourAsync = async (payload: CreateTour) => {
    try {
      console.log(payload);
      const res = await adminApiService.getTour(16);
      // const res = await adminApiService.createTour(payload);
      // const res = await adminApiService.createtourHereApi(tourPayload);
      const rawData: TourResponse = res.data;
      const { tour, routes, unassigned } = rawData;
      console.log("✅ Full API Response:", rawData);

      const firstRoute: LogisticsRoute = routes?.[0];
      const route_sections = firstRoute?.geometry.sections;
      if (!firstRoute || !Array.isArray(route_sections)) {
        console.error("❌ 'sections' not found in first route:", firstRoute);
        return;
      }

      // Route refers to route and
      //  Section refers to coordinates in a section

      const polylineCoords: [number, number][] = route_sections.flatMap(
        (section: any) =>
          section.coordinates.map((point: any) => [point.lat, point.lng])
      );
      console.log("Polylines Coordinates", polylineCoords);

      const stops: Stop[] = firstRoute.geometry.stops || [];
      console.log("Stops", stops);

      // setTourData({
      //   routePolyline: polylineCoords,
      //   stops,
      // });
      setTourData(rawData);
    } catch (err) {
      console.error("Create tour API call failed", err);
    }
  };

  const disableInputs = !tourDate || drivers.length === 0;

  const fetchEligibleDrivers = async (date: string) => {
    try {
      const res = await getAvailableDrivers(date, warehouseId ?? 0);
      setDrivers(res.available || []);
    } catch (err) {
      console.error("Failed to fetch eligible drivers:", err);
      setDrivers([]);
    }
  };

  const validateForm = () => {
    const missing = [];
    if (!selectedDriver) missing.push("Driver");
    if (!startTime) missing.push("Start Time");
    if (!tourDate) missing.push("Tour Date");

    if (missing.length) {
      showNotification({
        message: `${missing.join(", ")} required.`,
        severity: NotificationSeverity.Error,
      });

      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || !selectedDriver) {
      showNotification({
        message: "Invalid values selected",
        severity: NotificationSeverity.Warning,
      });
      return;
    }

    setLoading(true);
    setIsSuccess(false);

    try {
      const payload: CreateTour = {
        comments,
        startTime: `${startTime}:00`,
        routeColor,
        driverId: selectedDriver,
        tourDate: `${tourDate} 00:00:00`,
        orderIds,
        warehouseId,
      };
      console.log("Payload", payload);

      createTourAsync(payload);

      // setTimeout(() => {
      //   navigate("/Admin_HereMap", { state: { payload } });
      // }, 500);
    } catch (error: any) {
      console.error("Error saving tour:", error);
      const message =
        error?.response?.data?.message ||
        "Failed to save the tour. Please try again.";
      showNotification({
        message: message,
        severity: NotificationSeverity.Error,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTourDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTourDate(value);
    setSelectedDriver(null);
    setStartTime("");
    fetchEligibleDrivers(value);
  };

  const getButtonSx = (disabled = false) => ({
    px: 3,
    py: 1,
    borderRadius: 1,
    fontWeight: 500,
    textTransform: "none",
    background: disabled ? theme.palette.grey[300] : theme.palette.primary.main,
    color: disabled
      ? theme.palette.text.disabled
      : theme.palette.primary.contrastText,
    "&:hover": {
      background: disabled
        ? theme.palette.grey[300]
        : theme.palette.primary.dark,
    },
  });

  return (
    <>
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 600 },
            bgcolor: "background.paper",
            p: 3,
            borderRadius: 2,
            boxShadow: 24,
          }}
        >
          <Typography
            variant="h6"
            mb={3}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "primary.main",
            }}
          >
            <Schedule fontSize="small" /> Create New Tour
          </Typography>

          <Stack spacing={2}>
            <TextField
              label="Comments"
              fullWidth
              multiline
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />

            <TextField
              label="Tour Date *"
              type="date"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              value={tourDate}
              onChange={handleTourDateChange}
              InputProps={{ sx: { "& input": { py: 1.5, height: "2em" } } }}
            />

            <FormControl fullWidth disabled={disableInputs}>
              <InputLabel>
                <Person fontSize="small" /> Driver *
              </InputLabel>
              <Select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(Number(e.target.value))}
                required
              >
                {drivers.map((driver) => (
                  <MenuItem key={driver.id} value={driver.id}>
                    {driver.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={disableInputs}>
              <InputLabel>Start Time *</InputLabel>
              <Select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              >
                {generateTimeOptions().map((time) => (
                  <MenuItem key={time} value={time}>
                    {time}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction="row" alignItems="center" spacing={2}>
              <Palette fontSize="small" color="action" />
              <Typography variant="body2">Route Color:</Typography>
              <Box
                component="input"
                type="color"
                value={routeColor}
                disabled={disableInputs}
                onChange={(e) => setRouteColor(e.target.value)}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`,
                  cursor: "pointer",
                }}
              />
              <Chip
                label={routeColor.toUpperCase()}
                size="small"
                sx={{
                  backgroundColor: routeColor,
                  color: theme.palette.getContrastText(routeColor),
                  minWidth: 80,
                }}
              />
            </Stack>
          </Stack>

          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={4}>
            <Button onClick={handleClose} variant="outlined" sx={getButtonSx()}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={disableInputs || loading || isSuccess}
              sx={getButtonSx(disableInputs)}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Create Tour"
              )}
            </Button>
          </Stack>
        </Box>
      </Modal>
    </>
  );
};

export default CreateTourModal;
