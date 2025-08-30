import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, FormControl, InputLabel,
  Select, MenuItem, CircularProgress, InputAdornment, OutlinedInput, Typography,
  FormControlLabel, Switch
} from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import SpeedIcon from "@mui/icons-material/Speed";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SecurityIcon from "@mui/icons-material/Security";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import dayjs from "dayjs";

type Vehicle = {
  vehicle_id: number;
  capacity: number;
  license_plate: string;
  miles_driven: number;
  next_service: string | null;
  warehouse_id: number;
  driver_id: number | null;
  created_at: string;
  updated_at: string | null;
  is_active: number;
  warehouse_name?: string;
  insurance_number: string;
  insurance_expiry_date: string | null; 
  driver_name?: string;
};

type Driver = {
  id: number;
  name: string;
  mob: string;
  address: string;
  email: string;
  warehouse_id: number;
  status: number;
};

type Warehouse = {
  warehouse_id: number;
  warehouse_name: string;
};

type Props = {
  open: boolean;
  editMode: boolean;
  formData: Partial<Vehicle>;
  errors: { [key: string]: string };
  drivers: Driver[];
  warehouses: Warehouse[];
  onChange: (field: keyof Vehicle, value: string | number | null) => void;
  onClose: () => void;
  onSave: () => void;
};

const VehicleDialog: React.FC<Props> = ({
  open, editMode, formData, errors, drivers, warehouses, onChange, onClose, onSave
}) => {
  const [loading, setLoading] = useState(false);

  // Convert date to input format (YYYY-MM-DD)
  const formatDateForInput = (date: string | null): string => {
    if (!date) return "";
    const parsed = dayjs(date);
    return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
  };

  const renderTextField = (
    label: string,
    field: keyof Vehicle,
    icon: React.ReactNode,
    type = "text",
    multiline = false,
    autoFocus = false,
    disabled = false,
    highlight = false
  ) => {
    // Custom styling for disabled license plate field
    if (field === "license_plate" && editMode && disabled) {
      return (
        <div key={field} style={{ marginBottom: '16px' }}>
          <TextField
            label={label}
            type={type}
            fullWidth
            multiline={multiline}
            variant="outlined"
            value={formData[field] || ""}
            disabled={true}
            InputProps={{
              startAdornment: <InputAdornment position="start">{icon}</InputAdornment>,
              sx: {
                backgroundColor: '#f8f9fa',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                opacity: 1,
                color: '#6c757d',
                WebkitTextFillColor: '#6c757d',
                '&:hover': {
                  borderColor: '#dee2e6',
                },
                '& .MuiInputBase-input': {
                  color: '#6c757d',
                  fontWeight: '500',
                  fontSize: '14px',
                  WebkitTextFillColor: '#6c757d',
                },
              }
            }}
            sx={{
              '& .MuiInputLabel-root': {
                color: '#6c757d',
                fontWeight: '500',
                '&.Mui-focused': {
                  color: '#6c757d',
                },
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
            }}
          />
          <div style={{
            marginTop: '4px',
            marginLeft: '14px',
            fontSize: '12px',
            color: '#ff6b35',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#ff6b35',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>!</span>
            License plate cannot be edited
          </div>
        </div>
      );
    }

    // Handle date input fields
    const inputValue = type === "date" ? formatDateForInput(formData[field] as string) : (formData[field] || "");

    // Regular fields
    return (
      <TextField
        label={label}
        type={type}
        fullWidth
        autoFocus={autoFocus}
        multiline={multiline}
        variant="outlined"
        value={inputValue}
        onChange={(e) => {
          let value: string | number | null = e.target.value;
          if (type === "number") {
            value = value === "" ? (field === "driver_id" ? null : 0) : Number(value);
          } else if (field === "license_plate" && typeof value === "string") {
            value = value.toUpperCase();
          }
          onChange(field, value);
        }}
        error={!!errors[field]}
        helperText={errors[field]}
        disabled={disabled && field !== "license_plate"} // Don't disable license_plate field here, handled above
        InputLabelProps={type === "date" ? { shrink: true } : undefined}
        InputProps={{
          startAdornment: <InputAdornment position="start">{icon}</InputAdornment>,
          sx: {
            backgroundColor: disabled && field !== "license_plate"
              ? '#f0f0f0'
              : highlight
                ? '#fff9c4'
                : 'inherit',
            opacity: 1,
            color: 'rgba(0,0,0,0.87)',
            WebkitTextFillColor: 'rgba(0,0,0,0.87)'
          }
        }}
      />
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" align="center">
          {editMode ? "Edit Vehicle" : "Add Vehicle"}
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
          Please fill in the vehicle details carefully
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress />
            <Typography mt={2}>Loading...</Typography>
          </Stack>
        ) : (
          <Stack spacing={2} mt={1} minWidth={350}>
            {renderTextField(
              "License Plate", 
              "license_plate", 
              <DirectionsCarIcon sx={{ color: "black" }} />, 
              "text", 
              false, 
              true, 
              editMode
            )}

            {renderTextField(
              "Capacity", 
              "capacity", 
              <SpeedIcon sx={{ color: "black" }} />, 
              "number"
            )}

            {renderTextField(
              "Miles Driven", 
              "miles_driven", 
              <LocationOnIcon sx={{ color: "black" }} />, 
              "number"
            )}

            {renderTextField(
              "Next Service Date", 
              "next_service", 
              <CalendarTodayIcon sx={{ color: "black" }} />, 
              "date"
            )}

            {renderTextField(
              "Insurance Number", 
              "insurance_number", 
              <SecurityIcon sx={{ color: "black" }} />
            )}

            {renderTextField(
              "Insurance Expiry Date", 
              "insurance_expiry_date", 
              <CalendarTodayIcon sx={{ color: "black" }} />, 
              "date"
            )}

            {/* Warehouse Dropdown */}
            <FormControl fullWidth error={!!errors.warehouse_id}>
              <InputLabel id="warehouse-label">Warehouse</InputLabel>
              <Select
                labelId="warehouse-label"
                value={formData.warehouse_id ?? ""}
                onChange={(e) => onChange("warehouse_id", Number(e.target.value))}
                input={
                  <OutlinedInput
                    label="Warehouse"
                    startAdornment={
                      <InputAdornment position="start">
                        <WarehouseOutlinedIcon sx={{ color: "black" }} />
                      </InputAdornment>
                    }
                  />
                }
              >
                <MenuItem value="">
                  <em>Select warehouse</em>
                </MenuItem>
                {warehouses.map(({ warehouse_id, warehouse_name }) => (
                  <MenuItem key={warehouse_id} value={warehouse_id}>
                    {warehouse_name} - {warehouse_id}
                  </MenuItem>
                ))}
              </Select>
              {errors.warehouse_id && (
                <Typography color="error" variant="caption" mt={0.5}>
                  {errors.warehouse_id}
                </Typography>
              )}
            </FormControl>

            {/* Driver Dropdown */}
            <FormControl fullWidth error={!!errors.driver_id}>
              <InputLabel id="driver-label">Driver (Optional)</InputLabel>
              <Select
                labelId="driver-label"
                value={formData.driver_id ?? ""}
                onChange={(e) => onChange("driver_id", e.target.value === "" ? null : Number(e.target.value))}
                input={
                  <OutlinedInput
                    label="Driver (Optional)"
                    startAdornment={
                      <InputAdornment position="start">
                        <PersonOutlineIcon sx={{ color: "black" }} />
                      </InputAdornment>
                    }
                  />
                }
              >
                <MenuItem value="">
                  <em>No driver assigned</em>
                </MenuItem>
                {drivers
                  .filter(driver => driver.status === 1) // Only show active drivers
                  .map(({ id, name }) => (
                    <MenuItem key={id} value={id}>
                      {name}
                    </MenuItem>
                  ))}
              </Select>
              {errors.driver_id && (
                <Typography color="error" variant="caption" mt={0.5}>
                  {errors.driver_id}
                </Typography>
              )}
            </FormControl>

            {/* Status Switch */}
            <FormControl fullWidth>
              <FormControlLabel
                control={
                  <Switch
                    checked={(formData.is_active ?? 1) === 1}
                    onChange={(e) => onChange("is_active", e.target.checked ? 1 : 0)}
                    color="primary"
                  />
                }
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleOutlineIcon sx={{ color: "black" }} />
                    <Typography>
                      Vehicle Status: {(formData.is_active ?? 1) === 1 ? "Active" : "Inactive"}
                    </Typography>
                  </Stack>
                }
              />
            </FormControl>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {/* Cancel Button */}
        <Button
          onClick={onClose}
          size="small"
          sx={{
            padding: "8px 24px",
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 500,
            backgroundColor: "#f5f5f5",
            color: "#444",
            border: "1px solid #ccc",
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: "#e0e0e0",
              borderColor: "#999",
              color: "#222",
            },
          }}
        >
          Cancel
        </Button>

        {/* Save Button */}
        <Button
          onClick={onSave}
          size="small"
          variant="contained"
          disabled={loading}
          sx={{
            padding: "8px 24px",
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 600,
            background: 'linear-gradient(45deg, #f97316, #ea580c)',
            color: "#fff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transition: "all 0.3s ease",
            "&:hover": {
              background: 'linear-gradient(45deg, #ea580c, #dc2626)',
              boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
            },
            "&.Mui-disabled": {
              background: "#ccc",
              color: "#777",
              boxShadow: "none",
            },
          }}
        >
          {editMode ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VehicleDialog;