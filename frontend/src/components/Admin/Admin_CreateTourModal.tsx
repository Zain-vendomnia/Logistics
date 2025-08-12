import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  CircularProgress,
  FormHelperText,
} from "@mui/material";
import { Palette, Schedule, Person } from "@mui/icons-material";

import { getAvailableDrivers } from "../../services/driverService";
import { CreateTour_Req, CreateTour_Res } from "../../types/tour.type";
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
  onTourCreated: (tourData: CreateTour_Res) => void;
}

interface Driver {
  id: number;
  name: string;
  warehouse_id?: number;
  status: number;
}

const generateTimeOptions = () =>
  Array.from({ length: 48 }, (_, i) => {
    const hh = String(Math.floor(i / 2)).padStart(2, "0");
    const mm = i % 2 === 0 ? "00" : "30";
    return `${hh}:${mm}`;
  });

const todayISO = () => new Date().toISOString().slice(0, 10);

const CreateTourModal = ({
  open,
  warehouseId = 0,
  orderIds = [],
  handleClose,
  onTourCreated,
}: Props) => {
  const theme = useTheme();
  const { showNotification } = useNotificationStore();

  // form state
  const [comments, setComments] = useState("");
  const [startTime, setStartTime] = useState("");
  const [routeColor, setRouteColor] = useState(theme.palette.primary.main);
  const [selectedDriver, setSelectedDriver] = useState<number | "">("");
  const [tourDate, setTourDate] = useState("");
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // ui state
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createTourRes, setCreateTourRes] = useState<CreateTour_Res | null>(null);

  // field errors (lightweight)
  const [errors, setErrors] = useState<{
    comments?: string;
    tourDate?: string;
    selectedDriver?: string;
    startTime?: string;
  }>({});

  const timeOptions = useMemo(generateTimeOptions, []);

  const disableInputs = useMemo(
    () => !tourDate || drivers.length === 0,
    [tourDate, drivers.length]
  );

  // Validate props on mount
  useEffect(() => {
    if (!warehouseId || !orderIds?.length) {
      showNotification({
        message: "Invalid data provided",
        severity: NotificationSeverity.Error,
      });
      // still allow opening to show UI, but will block submit
      // eslint-disable-next-line no-console
      console.log("Invalid data provided");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset form whenever modal opens/closes
  useEffect(() => {
    if (!open) return;
    // reset transient success & response
    setIsSuccess(false);
    setCreateTourRes(null);
    // keep comments/routeColor as-is if you want; or reset fully:
    setComments("");
    setStartTime("");
    setSelectedDriver("");
    setTourDate("");
    setDrivers([]);
    setErrors({});
  }, [open]);

  // Handle success -> bubble up, close
  useEffect(() => {
    if (!createTourRes) return;
    setLoading(false);
    onTourCreated(createTourRes);
    handleClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createTourRes]);

  const fetchEligibleDrivers = useCallback(
    async (date: string) => {
      if (!date || !warehouseId) {
        setDrivers([]);
        return;
      }

      let isActive = true;
      try {
        const res = await getAvailableDrivers(date, warehouseId ?? 0);
        if (isActive) setDrivers(res.available || []);
      } catch (err) {
        console.error("Failed to fetch eligible drivers:", err);
        if (isActive) setDrivers([]);
      }
      return () => {
        isActive = false;
      };
    },
    [warehouseId]
  );

  const validateForm = useCallback(() => {
    const nextErrors: typeof errors = {};

    if (!comments.trim()) nextErrors.comments = "Comments are required.";
    if (!tourDate) nextErrors.tourDate = "Tour date is required.";
    if (!selectedDriver) nextErrors.selectedDriver = "Driver is required.";
    if (!startTime) nextErrors.startTime = "Start time is required.";

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      showNotification({
        message: `${Object.keys(nextErrors).length} field(s) missing or invalid.`,
        severity: NotificationSeverity.Error,
      });
      return false;
    }
    return true;
  }, [comments, tourDate, selectedDriver, startTime, showNotification]);

  const createTourAsync = useCallback(
    async (payload: CreateTour_Req) => {
      try {
        setLoading(true);
        const res = await adminApiService.createTour(payload);
        console.log("---------------------------------------------------");
        console.log("Create Tour Response:", res);
        const rawData: CreateTour_Res = res.data;
        setCreateTourRes(rawData);
        setIsSuccess(true);
      } catch (err: any) {
        console.error("Create tour API call failed", err);
        const message =
          err?.response?.data?.message ||
          "Failed to save the tour. Please try again.";
        showNotification({
          message,
          severity: NotificationSeverity.Error,
        });
      } finally {
        setLoading(false);
      }
    },
    [showNotification]
  );

  const handleSave = useCallback(async () => {
    // Block obvious prop issues
    if (!orderIds?.length || !warehouseId) {
      showNotification({
        message: "Warehouse and order(s) are required.",
        severity: NotificationSeverity.Warning,
      });
      return;
    }

    if (!validateForm()) {
      // showNotification({
      //   message: "Invalid values selected.",
      //   severity: NotificationSeverity.Warning,
      // });
      return;
    }

    const payload: CreateTour_Req = {
      comments: comments.trim(),
      startTime: `${startTime}:00`,
      routeColor,
      driverId: Number(selectedDriver),
      tourDate: `${tourDate} 00:00:00`,
      orderIds,
      warehouseId,
    };

    await createTourAsync(payload);
  }, [
    orderIds,
    warehouseId,
    validateForm,
    comments,
    startTime,
    routeColor,
    selectedDriver,
    tourDate,
    createTourAsync,
    showNotification,
  ]);

  const handleTourDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setTourDate(value);
      setSelectedDriver("");
      setStartTime("");
      setErrors((prev) => ({ ...prev, tourDate: undefined }));
      fetchEligibleDrivers(value);
    },
    [fetchEligibleDrivers]
  );

  // const getButtonSx = useCallback(
  //   (disabled = false) => ({
  //     px: 3,
  //     py: 1,
  //     borderRadius: 1,
  //     fontWeight: 500,
  //     textTransform: "none",
  //     ...(disabled
  //       ? {
  //           background: theme.palette.grey[300],
  //           color: theme.palette.text.disabled,
  //           "&:hover": { background: theme.palette.grey[300] },
  //         }
  //       : {}),
  //   }),
  //   [theme.palette.grey, theme.palette.text.disabled]
  // );

  // IDs for proper MUI label association
  const driverLabelId = "driver-select-label";
  const timeLabelId = "time-select-label";

  return (
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
        {loading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              bgcolor: "rgba(255,255,255,0.6)",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 2,
            }}
          >
            <CircularProgress size={40} />
          </Box>
        )}

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
            label="Comments *"
            fullWidth
            multiline
            rows={2}
            value={comments}
            onChange={(e) => {
              setComments(e.target.value);
              if (errors.comments) setErrors((p) => ({ ...p, comments: undefined }));
            }}
            error={!!errors.comments}
            helperText={errors.comments}
          />

          <TextField
            label="Tour Date *"
            type="date"
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            value={tourDate}
            onChange={handleTourDateChange}
            inputProps={{ min: todayISO() }}
            error={!!errors.tourDate}
            helperText={errors.tourDate}
            InputProps={{ sx: { "& input": { py: 1.5, height: "2em" } } }}
          />

          <FormControl fullWidth disabled={disableInputs} error={!!errors.selectedDriver}>
            <InputLabel id={driverLabelId}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Person fontSize="small" /> Driver *
              </span>
            </InputLabel>
            <Select
              labelId={driverLabelId}
              label="Driver *"
              value={selectedDriver}
              onChange={(e) => {
                setSelectedDriver(e.target.value as number | "");
                if (errors.selectedDriver)
                  setErrors((p) => ({ ...p, selectedDriver: undefined }));
              }}
              required
            >
              {drivers.map((driver) => (
                <MenuItem key={driver.id} value={driver.id}>
                  {driver.name}
                </MenuItem>
              ))}
            </Select>
            {!!errors.selectedDriver && (
              <FormHelperText>{errors.selectedDriver}</FormHelperText>
            )}
          </FormControl>

          <FormControl fullWidth disabled={disableInputs} error={!!errors.startTime}>
            <InputLabel id={timeLabelId}>Start Time *</InputLabel>
            <Select
              labelId={timeLabelId}
              label="Start Time *"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                if (errors.startTime) setErrors((p) => ({ ...p, startTime: undefined }));
              }}
              required
            >
              {timeOptions.map((time) => (
                <MenuItem key={time} value={time}>
                  {time}
                </MenuItem>
              ))}
            </Select>
            {!!errors.startTime && <FormHelperText>{errors.startTime}</FormHelperText>}
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
                cursor: disableInputs ? "not-allowed" : "pointer",
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
  <Button
  onClick={handleClose}
  variant="outlined"
  sx={{
    borderColor: "#e53935",
    backgroundColor: "#e53935",
    color: "#fff",
    textTransform: "none",
    fontWeight: 500,
    borderRadius: 2,
    px: 3,
    py: 1,
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      backgroundColor: "#c62828",
      borderColor: "#c62828",
    },
  }}
>
  Cancel
</Button>


         <Button
  onClick={handleSave}
  variant="contained"
  disabled={disableInputs || loading || isSuccess}
  sx={{
    background: disableInputs || loading || isSuccess
      ? "linear-gradient(45deg, #b0bec5, #90a4ae)" // Disabled grey gradient
      : "linear-gradient(45deg, #43a047, #2e7d32)", // Green gradient for active
    color: "#fff",
    fontWeight: 600,
    borderRadius: 2,
    px: 3,
    py: 1,
    textTransform: "none",
    boxShadow: disableInputs || loading || isSuccess
      ? "none"
      : "0 3px 6px rgba(0,0,0,0.2)",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      transform:
        disableInputs || loading || isSuccess ? "none" : "translateY(-2px)",
      boxShadow:
        disableInputs || loading || isSuccess
          ? "none"
          : "0 6px 12px rgba(0,0,0,0.3)",
    },
  }}
>
  Create Tour
</Button>

        </Stack>
      </Box>
    </Modal>
  );
};

export default CreateTourModal;
