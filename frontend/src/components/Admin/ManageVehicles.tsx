// pages/admin/ManageVehicles.tsx
import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  Box,
  Button,
  Snackbar,
  Alert,
  Stack,
  Typography,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { SaveAlt, Edit, Add } from "@mui/icons-material";
import * as XLSX from "xlsx";
import {getAllDrivers} from "../../services/driverService";
import { getAllWarehouses} from "../../services/warehouseService";
import { MenuItem } from "@mui/material";
import {
  getAllVehicles,
  createVehicle,
  updateVehicle,
  getOneVehicle,
} from "../../services/vehiclesService";
import dayjs from "dayjs";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelIcon from "@mui/icons-material/Cancel";

export type Vehicle = {
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
  driver_name?: string;
};

type Driver = {
  id: number;
  name: string;
  mob: string;
  address: string;
  email: string;
  warehouse_id: number;
  status:number;
};

type Warehouse = {
  warehouse_id: number;
  warehouse_name: string;
 
};
type VehicleForm = Partial<Vehicle>;

const initialFormState: VehicleForm = {
  capacity: undefined,
  license_plate: "",
  miles_driven: 0,
  next_service: null,
  warehouse_id: undefined,
  driver_id: null,
  is_active: 1,
};

// Optimized date formatting functions
const formatDate = (date: string | null): string => {
  if (!date) return "-";
  const parsed = dayjs(date);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "-";
};

const formatDateTime = (date: string | null): string => {
  if (!date) return "-";
  const parsed = dayjs(date);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : "-";
};

// Convert date to input format (YYYY-MM-DD)
const formatDateForInput = (date: string | null): string => {
  if (!date) return "";
  const parsed = dayjs(date);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
};

const isPositiveInt = (n: any): boolean =>
  Number.isFinite(+n) && +n > 0 && Number.isInteger(+n);

const ManageVehicles: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [formData, setFormData] = useState<VehicleForm>(initialFormState);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const showSnackbar = useCallback((message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormState);
    setErrors({});
    setEditMode(false);
  }, []);

  const validateForm = useCallback((): boolean => {
    const e: Record<string, string> = {};
    
    if (!formData.license_plate?.trim()) {
      e.license_plate = "License plate is required";
    }
    
    const numericFields = [
      { key: 'capacity', label: 'Capacity', required: true },
      { key: 'warehouse_id', label: 'Warehouse ID', required: true },
    ];
    
    numericFields.forEach(({ key, label, required }) => {
      const value = formData[key as keyof VehicleForm];
      if (required && (value === undefined || value === null)) {
        e[key] = `${label} is required`;
      } else if (value != null && !isPositiveInt(value)) {
        e[key] = `${label} must be a positive integer`;
      }
    });

    if (formData.driver_id != null && !isPositiveInt(formData.driver_id)) {
      e.driver_id = "Driver ID must be a positive integer or left blank";
    }

    if (formData.miles_driven != null && 
        (!Number.isFinite(+formData.miles_driven) || +formData.miles_driven < 0)) {
      e.miles_driven = "Miles driven must be a non-negative number";
    }

    // Validate next_service date format if provided
    if (formData.next_service && !dayjs(formData.next_service).isValid()) {
      e.next_service = "Please enter a valid date";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [formData]);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllVehicles();
      const data: Vehicle[] = Array.isArray(res) ? res : res?.data ?? [];
      
      // Store raw data without formatting - formatting happens in columns
      setVehicles(data);
    } catch (err) {
      console.error("Error loading vehicles:", err);
      showSnackbar("Failed to load vehicles", "error");
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  const loadDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllDrivers();
      console.log("drivers data",data)
      setDrivers(data);
    } catch (err) {
      console.error("Error drivers :", err);
      showSnackbar("Failed to drivers ", "error");
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  const loadWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllWarehouses();
      console.log("warehouse data",data)
      setWarehouses(data);
    } catch (err) {
      console.error("Error warehouses vehicles:", err);
      showSnackbar("Failed to warehouses ", "error");
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    loadVehicles();
    loadDrivers();
    loadWarehouses();
  }, [loadVehicles, loadDrivers, loadWarehouses]);

  const handleDialogOpen = useCallback(async (row?: Vehicle) => {
    setErrors({});
    if (row) {
      setEditMode(true);
      try {
        const fresh = await getOneVehicle?.(row.vehicle_id);
        const vehicleData = fresh?.data ?? row;
        // Format date for form input
        setFormData({
          ...vehicleData,
          next_service: formatDateForInput(vehicleData.next_service)
        });
      } catch (error) {
        console.error("Error fetching vehicle details:", error);
        setFormData({
          ...row,
          next_service: formatDateForInput(row.next_service)
        });
      }
    } else {
      setEditMode(false);
      setFormData(initialFormState);
    }
    setOpenDialog(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setOpenDialog(false);
    resetForm();
  }, [resetForm]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;
    
    // Prepare payload with proper date formatting
    const payload = {
      capacity: formData.capacity ? Number(formData.capacity) : undefined,
      license_plate: formData.license_plate?.trim(),
      miles_driven: Number(formData.miles_driven) || 0,
      next_service: formData.next_service || null,
      warehouse_id: formData.warehouse_id ? Number(formData.warehouse_id) : undefined,
      driver_id: formData.driver_id ? Number(formData.driver_id) : null,
      is_active: formData.is_active ?? 1,
    };
    
    // Remove undefined values
    Object.keys(payload).forEach(
      (k) => payload[k as keyof typeof payload] === undefined && delete payload[k as keyof typeof payload]
    );
    
    setLoading(true);
    try {
      const isEdit = editMode && formData.vehicle_id != null;
      const resp = isEdit 
        ? await updateVehicle(formData.vehicle_id!, payload)
        : await createVehicle(payload);
      
      if (resp?.success === false || resp?.error) {
        showSnackbar(resp?.message || `Failed to ${isEdit ? 'update' : 'create'} vehicle`, "error");
        return;
      }
      
      showSnackbar(`Vehicle ${isEdit ? 'updated' : 'created'} successfully`, "success");
      handleDialogClose();
      await loadVehicles();
    } catch (err) {
      console.error("Error saving vehicle:", err);
      showSnackbar("Failed to save vehicle", "error");
    } finally {
      setLoading(false);
    }
  }, [validateForm, formData, editMode, showSnackbar, handleDialogClose, loadVehicles]);

  const handleExport = useCallback(() => {
    const exportData = vehicles.map(vehicle => ({
      ...vehicle,
      next_service: formatDate(vehicle.next_service),
      created_at: formatDateTime(vehicle.created_at),
      updated_at: formatDateTime(vehicle.updated_at),
      status: vehicle.is_active === 1 ? "Active" : "Inactive"
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vehicles");
    XLSX.writeFile(wb, `vehicles_export_${dayjs().format('YYYY-MM-DD')}.xlsx`);
  }, [vehicles]);

  // Memoized button style
  const buttonStyle = useMemo(() => (theme: any) => ({
    background: theme.palette?.primary?.gradient,
    color: theme.palette.primary.contrastText,
    "&:hover": {
      background: theme.palette.primary.dark,
      color: theme.palette.primary.contrastText,
    },
  }), []);

  // Memoized columns configuration
  const columns: GridColDef[] = useMemo(() => [
    { 
      field: "vehicle_id", 
      headerName: "ID", 
      align: "center", 
      headerAlign: "center", 
      width: 90 
    },
    { 
      field: "license_plate", 
      headerName: "License Plate", 
      align: "center", 
      headerAlign: "center", 
      minWidth: 140 
    },
    { 
      field: "capacity", 
      headerName: "Capacity", 
      align: "center", 
      headerAlign: "center", 
      width: 120 
    },
    { 
      field: "miles_driven", 
      headerName: "Miles", 
      align: "center", 
      headerAlign: "center", 
      width: 90 
    },
    {
      field: "next_service",
      headerName: "Next Service",
      headerAlign: "center",
      align: "center",
      width: 120,
      valueFormatter: (value: string | null) => formatDate(value)
    },
    { 
      field: "warehouse_name", 
      headerName: "Warehouse Name", 
      align: "center", 
      headerAlign: "center",
      minWidth: 140 
    },
    {
      field: "driver_name",
      headerName: "Driver",
      headerAlign: "center",
      align: "center",
      width: 140,
      valueFormatter: (value: string | null) => value || "-",
    },
    {
      field: "status",
      headerName: "Status",
      headerAlign: "center",
      flex: 1,
      renderCell: ({ row }) => (
        <Stack height="100%" direction="row" spacing={1} alignItems="center" justifyContent="center"> 
          {row.is_active === 1 ? (
            <>
              <CheckCircleOutlineIcon color="success" />
              <Typography variant="body2" color="success.main">Active</Typography>
            </>
          ) : (
            <>
              <CancelIcon color="error" />
              <Typography variant="body2" color="error.main">Inactive</Typography>
            </>
          )}
        </Stack>
      ),
    },
    {
      field: "created_at",
      headerName: "Created",
      headerAlign: "center",
      align: "center",
      width: 160,
      valueFormatter: (value: string | null) => formatDateTime(value)
    },
    {
      field: "updated_at",
      headerName: "Updated", 
      headerAlign: "center",
      align: "center",
      width: 160,
      valueFormatter: (value: string | null) => formatDateTime(value)
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 160,
      headerAlign: "center",
      align: "center",
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Button
          size="small"
          variant="outlined"
          color="primary"
          onClick={() => handleDialogOpen(row)}
          disabled={loading}
          sx={(theme) => ({
            height: "36px",
            background: theme.palette.primary.gradient,
            justifyContent: "center",
            color: "#fff",
            "&:hover": {
              background: "#fff",
              color: theme.palette.primary.dark,
            }
          })}
        >
          <Edit fontSize="small" />
        </Button>
      ),
    },
  ], [handleDialogOpen, loading]);

  // Memoized form fields configuration
  const formFields = useMemo(() => [
    {
      name: "license_plate",
      label: "License Plate",
      readOnly: editMode,
      transform: (value: string) => value.toUpperCase(),
    },
    {
      name: "capacity",
      label: "Capacity",
      type: "number",
    },
    {
      name: "miles_driven", 
      label: "Miles Driven",
      type: "number",
    },
    {
      name: "next_service",
      label: "Next Service",
      type: "date",
    },
    {
      name: "warehouse_id",
      label: "Warehouse ID", 
      type: "number",
    },
    {
      name: "driver_id",
      label: "Driver ID (optional)",
      type: "number",
      helperText: "Leave empty if no driver assigned",
    },
  ], [editMode]);

  // Memoized DataGrid rows
  const dataGridRows = useMemo(() => 
    vehicles.map(v => ({ id: v.vehicle_id, ...v })), 
    [vehicles]
  );

  const handleFieldChange = useCallback((name: string, value: any, type: string, transform?: (val: string) => string) => {
    let processedValue = value;
    
    if (type === "number") {
      processedValue = value === "" ? (name === "driver_id" ? null : undefined) : Number(value);
    } else if (transform && typeof value === "string") {
      processedValue = transform(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  }, []);

  const handleSnackbarClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return (
    <Box sx={{ p: 3, minHeight: "100vh", backgroundColor: "#f4f4f4", borderRadius: 2 }}>
      <Box sx={{ p: 3, backgroundColor: "#fff", borderRadius: 2 }}>
        <Typography variant="h5" mb={2}>
          Manage Vehicles
        </Typography>

        <Stack direction="row" spacing={2} mb={2}>
          <Button
            variant="outlined"
            sx={buttonStyle}
            startIcon={<Add />}
            onClick={() => handleDialogOpen()}
            disabled={loading}
          >
            Add Vehicle
          </Button>
          <Button
            variant="outlined"
            sx={buttonStyle}
            startIcon={<SaveAlt />}
            onClick={handleExport}
            disabled={loading}
          >
            Export
          </Button>
          {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </Stack>

        <Paper elevation={3} sx={{ borderRadius: 2 }}>
          <DataGrid
            rows={dataGridRows}
            columns={columns}
            checkboxSelection
            autoHeight
            disableRowSelectionOnClick
            slots={{ toolbar: GridToolbar }}
            loading={loading}
            sx={{
              "& .MuiDataGrid-columnHeaderRow": {
                backgroundColor: "#1976d2",
                "& .MuiDataGrid-columnHeaderTitle": { fontWeight: "bold", color: "white" },
              },
              "& .MuiDataGrid-row:nth-of-type(even)": { backgroundColor: "#f9f9f9" },
              "& .MuiDataGrid-row:hover": { backgroundColor: "#e3f2fd !important" },
            }}
          />
        </Paper>

        <Dialog open={openDialog} onClose={handleDialogClose} fullWidth maxWidth="sm">
          <DialogTitle>{editMode ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
          <DialogContent dividers>
  <Stack spacing={2} mt={1}>
    {/* Other common fields */}
    {formFields
      .filter(f => f.name !== "warehouse_id" && f.name !== "driver_id") // skip these two, we’ll add custom dropdowns
      .map(({ name, label, type = "text", readOnly, transform, helperText }) => (
        <TextField
          key={name}
          label={label}
          type={type}
          value={formData[name as keyof VehicleForm] ?? (name === "miles_driven" ? 0 : "")}
          error={!!errors[name]}
          helperText={errors[name] || helperText}
          InputProps={{ readOnly }}
          InputLabelProps={type === "date" ? { shrink: true } : undefined}
          onChange={(e) => handleFieldChange(name, e.target.value, type, transform)}
        />
    ))}

    {/* Warehouse dropdown */}
    <TextField
      select
      label="Warehouse"
      value={formData.warehouse_id ?? ""}
      error={!!errors.warehouse_id}
      helperText={errors.warehouse_id}
      onChange={(e) =>
        setFormData(prev => ({ ...prev, warehouse_id: Number(e.target.value) }))
      }
    >
      {warehouses.map(w => (
        <MenuItem key={w.warehouse_id} value={w.warehouse_id}>
          {w.warehouse_name}
        </MenuItem>
      ))}
    </TextField>

    {/* Driver dropdown */}
    <TextField
      select
      label="Driver (optional)"
      value={formData.driver_id ?? ""}
      error={!!errors.driver_id}
      helperText={errors.driver_id || "Leave empty if no driver assigned"}
      onChange={(e) =>
        setFormData(prev => ({
          ...prev,
          driver_id: e.target.value === "" ? null : Number(e.target.value)
        }))
      }
    >
      <MenuItem value="">None</MenuItem>
      {drivers.map(d => (
        <MenuItem key={d.id} value={d.id}>
          {d.name}
        </MenuItem>
      ))}
    </TextField>

    <FormControlLabel
      control={
        <Switch
          checked={(formData.is_active ?? 1) === 1}
          onChange={(e) =>
            setFormData(prev => ({ ...prev, is_active: e.target.checked ? 1 : 0 }))
          }
        />
      }
      label="Active"
    />
  </Stack>
</DialogContent>

          <DialogActions>
            <Button onClick={handleDialogClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : (editMode ? "Update" : "Create")}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={handleSnackbarClose}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default ManageVehicles;