import React, { useState, useEffect } from "react";
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
  SelectChangeEvent,
  Grid,
  Snackbar,
  Alert,
} from "@mui/material";
import adminApiService from "../../services/adminApiService";
import { getAllDrivers } from "../../services/driverService";
import { UpdateTour_Req } from "../../types/tour.type";
import { getCurrentUser } from "../../services/auth.service";

const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "600px",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: "8px",
};

const generateTimeOptions = () => {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, "0");
      const minute = m.toString().padStart(2, "0");
      options.push(`${hour}:${minute}`);
    }
  }
  return options;
};

interface EditTourModalProps {
  open: boolean;
  handleClose: () => void;
  tourData: any;
  onTourUpdated: () => void;
}

interface Driver {
  id: string | number;
  name: string;
  warehouse_id?: string | number;
  status: number;
}

const EditTourModal: React.FC<EditTourModalProps> = ({
  open,
  handleClose,
  tourData,
  onTourUpdated,
}) => {
  const [tourName, setTourName] = useState("");
  const [comments, setComments] = useState("");
  const [startTime, setStartTime] = useState("");
  const [routeColor, setRouteColor] = useState("#FF5733");
  const [selectedDriver, setSelectedDriver] = useState<string | number>("");
  const [tourDate, setTourDate] = useState("");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"error" | "success">(
    "error"
  );

  const timeOptions = generateTimeOptions();

  useEffect(() => {
    if (open && tourData?.warehouseId) {
      fetchDrivers(tourData.warehouseId, tourData.driver_id);
    }
  }, [open, tourData?.warehouseId]);

  useEffect(() => {
    if (tourData) {
      const { tour_name, tour_comments, color, date, timeRange, driver_id } =
        tourData;
      setTourName(tour_name || "");
      setComments(tour_comments || "");
      setRouteColor(color || "#FF5733");
      setTourDate(date ? formatDateForInput(date) : "");
      if (timeRange) setTimeRange(timeRange);
      setSelectedDriver(driver_id || "");
    }
  }, [tourData]);

  const fetchDrivers = async (
    warehouseId: string | number,
    driver_id: number
  ) => {
    try {
      setLoading(true);
      const allDrivers = await getAllDrivers();
      const activeDrivers = allDrivers.filter(
        (driver: Driver) => driver.status === 1
      );
      const filtered = activeDrivers.filter(
        (driver: Driver) => String(driver.warehouse_id) === String(warehouseId)
      );
      setDrivers(filtered);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  const setTimeRange = (timeRange: string) => {
    const [start] = timeRange?.split(" - ") || [];
    const validStart = timeOptions.includes(start) ? start : "";
    setStartTime(validStart);
  };

  const formatDateForInput = (dateString: string) => {
    const [month, day, year] = dateString.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  const handleDriverChange = (event: SelectChangeEvent<string | number>) => {
    setSelectedDriver(event.target.value);
  };

  const handleSave = async () => {
    if (!tourName || !startTime || !selectedDriver || !tourDate) {
      setSnackbarMessage("Please fill all required fields!");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const selectedDriverObj = drivers.find((d) => d.id === selectedDriver);
    if (!selectedDriverObj) {
      setSnackbarMessage("Selected driver is invalid!");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const updatedTourData: UpdateTour_Req = {
      id: tourData?.id,
      tourName,
      tourDate: `${tourDate} 00:00:00`,
      startTime: `${startTime}:00`,
      routeColor,
      orderIds: [],
      driverId: Number(selectedDriver),
      vehicleId: tourData.vehicleId ?? 0,
      warehouseId: tourData?.warehouseId ?? 0,
      userId: getCurrentUser().email,
      comments,
    };

    try {
      setLoading(true);
      await adminApiService.updateTour(updatedTourData);
      // Success message removed - handled by parent component
      onTourUpdated();
      handleClose();
    } catch (error: any) {
      console.error("Error updating tour:", error);
      const errorMessage =
        error?.response?.data?.error || "Failed to update the tour.";
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={2}>
            Edit Tour
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Tour Name"
                required
                fullWidth
                value={tourName}
                onChange={(e) => setTourName(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Comments"
                fullWidth
                multiline
                rows={2}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Driver *</InputLabel>
                <Select
                  value={
                    drivers.some((d) => d.id === selectedDriver)
                      ? selectedDriver
                      : ""
                  }
                  onChange={handleDriverChange}
                  label="Driver *"
                  required
                  disabled={loading || drivers.length === 0}
                >
                  {drivers.length > 0 ? (
                    drivers.map((driver) => (
                      <MenuItem key={driver.id} value={driver.id}>
                        {driver.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>
                      {loading ? "Loading drivers..." : "No drivers available"}
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Working Hour From *</InputLabel>
                <Select
                  value={timeOptions.includes(startTime) ? startTime : ""}
                  onChange={(e) => setStartTime(e.target.value)}
                  label="Working Hour From *"
                  required
                >
                  {timeOptions.map((time) => (
                    <MenuItem key={time} value={time}>
                      {time}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Tour Date *"
                type="date"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                value={tourDate}
                onChange={(e) => setTourDate(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography
                  variant="body1"
                  sx={{ minWidth: "130px", fontWeight: "500" }}
                >
                  Route color:
                </Typography>
                <input
                  type="color"
                  value={routeColor}
                  onChange={(e) => setRouteColor(e.target.value)}
                  style={{ width: "50px", height: "30px" }}
                />
                <Typography
                  variant="body1"
                  sx={{ minWidth: "80px", fontWeight: "500" }}
                >
                  {routeColor.toUpperCase()}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="contained"
              size="small"
              sx={(theme) => ({
                padding: "8px 24px",
                borderRadius: "4px",
                textTransform: "none",
                fontWeight: "500",
                background: theme.palette.primary.gradient,
                color: "#fff",
                transition: "all 0.3s ease",
                "&:hover": {
                  background: "#fff",
                  color: theme.palette.primary.dark,
                },
              })}
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              color="primary"
              sx={(theme) => ({
                padding: "8px 24px",
                borderRadius: "4px",
                textTransform: "none",
                fontWeight: "500",
                background: theme.palette.primary.gradient,
                color: "#fff",
                transition: "all 0.3s ease",
                "&:hover": {
                  background: "#fff",
                  color: theme.palette.primary.dark,
                },
              })}
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EditTourModal;
