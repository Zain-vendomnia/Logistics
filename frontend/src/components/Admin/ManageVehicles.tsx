// pages/admin/ManageVehicles.tsx
import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  Box, Button, Snackbar, Alert, Stack, Typography, Paper, CircularProgress, TextField, InputAdornment,
  Grid, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { 
  SaveAlt, NoTransferOutlined, Edit, Add, Search, FilterList
} from "@mui/icons-material";
import ExcelJS from 'exceljs';
import {getAllDrivers} from "../../services/driverService";
import { getAllWarehouses} from "../../services/warehouseService";
import {
  getAllVehicles,
  createVehicle,
  updateVehicle,
  disableVehicle,
  disableVehiclesBulk
} from "../../services/vehiclesService";
import VehicleDialog from "./VehicleDialog";
import ConfirmDialog from "./ConfirmDialog"; 
import dayjs from "dayjs";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelIcon from "@mui/icons-material/CancelOutlined";

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

const initialFormState: Partial<Vehicle> = {
  capacity: undefined,
  license_plate: "",
  miles_driven: 0,
  next_service: null,
  warehouse_id: undefined,
  insurance_number: "",
  insurance_expiry_date: null,
  driver_id: null,
  is_active: 1,
};

// Optimized date formatting functions
const formatDate = (date: string | null): string => {
  if (!date) return "-";
  const parsed = dayjs(date);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "-";
};

// const formatDateTime = (date: string | null): string => {
//   if (!date) return "-";
//   const parsed = dayjs(date);
//   return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : "-";
// };

// // Convert date to input format (YYYY-MM-DD)
// const formatDateForInput = (date: string | null): string => {
//   if (!date) return "";
//   const parsed = dayjs(date);
//   return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
// };

const isPositiveInt = (n: any): boolean =>
  Number.isFinite(+n) && +n > 0 && Number.isInteger(+n);

const ManageVehicles: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [formData, setFormData] = useState<Partial<Vehicle>>(initialFormState);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning",
  });
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmContent, setConfirmContent] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState<() => void>(() => () => {});

  // Filter vehicles based on search query and status
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;
    
    // Apply status filter first
    if (statusFilter === "active") {
      filtered = filtered.filter(vehicle => vehicle.is_active === 1);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter(vehicle => vehicle.is_active === 0);
    }
    
    // Then apply search query filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter((vehicle) => 
        vehicle.license_plate.toLowerCase().includes(query) ||
        vehicle.insurance_number.toLowerCase().includes(query) ||
        (vehicle.warehouse_name && vehicle.warehouse_name.toLowerCase().includes(query)) ||
        (vehicle.driver_name && vehicle.driver_name.toLowerCase().includes(query)) ||
        vehicle.capacity.toString().includes(query)
      );
    }
    
    return filtered;
  }, [vehicles, searchTerm, statusFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  const showSnackbar = (message: string, severity: "success" | "error" | "warning") =>
    setSnackbar({ open: true, message, severity });

  const showConfirmDialog = (title: string, content: string, action: () => void) => {
    setConfirmTitle(title);
    setConfirmContent(content);
    setOnConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setErrors({});
    setEditMode(false);
  };

  const validateForm = (): boolean => {
    const e: Record<string, string> = {};
    
    if (!formData.license_plate?.trim()) {
      e.license_plate = "License plate is required";
    }
    
    const numericFields = [
      { key: 'capacity', label: 'Capacity', required: true },
      { key: 'warehouse_id', label: 'Warehouse ID', required: true },
    ];
    
    numericFields.forEach(({ key, label, required }) => {
      const value = formData[key as keyof Partial<Vehicle>];
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

    // Validate insurance_expiry_date format if provided
    if (formData.insurance_expiry_date && !dayjs(formData.insurance_expiry_date).isValid()) {
      e.insurance_expiry_date = "Please enter a valid date";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllVehicles();
      const data: Vehicle[] = Array.isArray(res) ? res : res?.data ?? [];
      setVehicles(data);
    } catch (err) {
      console.error("Error loading vehicles:", err);
      showSnackbar("Failed to load vehicles", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllDrivers();
      setDrivers(data);
    } catch (err) {
      console.error("Error loading drivers:", err);
      showSnackbar("Failed to load drivers", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllWarehouses();
      setWarehouses(data);
    } catch (err) {
      console.error("Error loading warehouses:", err);
      showSnackbar("Failed to load warehouses", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
    loadDrivers();
    loadWarehouses();
  }, [loadVehicles, loadDrivers, loadWarehouses]);

  const handleDialogOpen = async (vehicle?: Vehicle) => {
    setEditMode(!!vehicle);
    setFormData(vehicle || initialFormState);
    setErrors({});
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    // Prepare payload with proper date formatting
    const payload = {
      capacity: formData.capacity ? Number(formData.capacity) : undefined,
      license_plate: formData.license_plate?.trim(),
      miles_driven: Number(formData.miles_driven) || 0,
      next_service: formData.next_service || null,
      warehouse_id: formData.warehouse_id ? Number(formData.warehouse_id) : undefined,
      driver_id: formData.driver_id ? Number(formData.driver_id) : null,
      insurance_number: formData.insurance_number?.trim() || "",
      insurance_expiry_date: formData.insurance_expiry_date || null,
      is_active: formData.is_active ?? 1,
    };
    
    // Remove undefined values
    Object.keys(payload).forEach(
      (k) => payload[k as keyof typeof payload] === undefined && delete payload[k as keyof typeof payload]
    );

    setLoading(true);
    try {
      if (editMode && formData.vehicle_id != null) {
        const response = await updateVehicle(formData.vehicle_id, payload);

        if (response?.error) {
          showSnackbar(response.message || "An error occurred", "error");
          return;
        }

        showSnackbar("Vehicle updated successfully", "success");
      } else {
        const response = await createVehicle(payload);

        if (response?.error) {
          showSnackbar(response.message || "An error occurred", "error");
          return;
        }

        showSnackbar("Vehicle created successfully", "success");
      }

      handleDialogClose();
      await loadVehicles();
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to save vehicle", "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteVehicle = (id: number) => {
    showConfirmDialog(
      "Disable Vehicle?",
      "Are you sure you want to disable this vehicle? This will change their status to inactive.",
      () => handleDisable(id)
    );
  };

  const confirmBulkDelete = () => {
    showConfirmDialog(
      "Disable Vehicles?",
      "Are you sure you want to disable selected vehicles? This will change their status to inactive.",
      () => handleBulkDelete()
    );
  };

  const handleDisable = async (id: number) => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      const response = await disableVehicle(id);
      console.log(response)

     switch (response.status) {
      case "success":
        showSnackbar(response.message, "success");
        break;
      case "warning":
        showSnackbar(response.message, "warning");
        break;
      case "error":
      default:
        showSnackbar(response.message || "Failed to vehicle warehouse", "error");
        break;
    }
      await loadVehicles();
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to disable vehicle", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      await disableVehiclesBulk(selectedIds);
      showSnackbar("Selected vehicles disabled", "success");
      setSelectedIds([]);
      await loadVehicles();
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to disable selected vehicles", "error");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced export function
  const handleExport = async () => {
    try {
      // Create a new workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Vehicles', {
        properties: { tabColor: { argb: '1976D2' } }
      });

      // Set workbook properties
      workbook.creator = 'Vehicle Management System';
      workbook.lastModifiedBy = 'Vehicle Management System';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Define columns with headers
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'License Plate', key: 'license_plate', width: 18 },
        { header: 'Capacity', key: 'capacity', width: 12 },
        { header: 'Miles Driven', key: 'miles_driven', width: 15 },
        { header: 'Next Service', key: 'next_service', width: 18 },
        { header: 'Warehouse Name', key: 'warehouse_name', width: 25 },
        { header: 'Driver Name', key: 'driver_name', width: 20 },
        { header: 'Insurance Number', key: 'insurance_number', width: 20 },
        { header: 'Insurance Expiry', key: 'insurance_expiry_date', width: 18 },
        { header: 'Status', key: 'status', width: 12 }
      ];

      // Style the header row
      const headerRow = worksheet.getRow(1);
      headerRow.height = 25;
      
      headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '1976D2' } // Material Design Blue
        };
        cell.font = {
          bold: true,
          color: { argb: 'FFFFFF' },
          size: 12,
          name: 'Arial'
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        };
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } }
        };
      });

      // Add data rows
      filteredVehicles.forEach((vehicle, index) => {
        const row = worksheet.addRow({
          id: vehicle.vehicle_id,
          license_plate: vehicle.license_plate,
          capacity: vehicle.capacity,
          miles_driven: vehicle.miles_driven,
          next_service: formatDate(vehicle.next_service),
          warehouse_name: vehicle.warehouse_name || '-',
          driver_name: vehicle.driver_name || '-',
          insurance_number: vehicle.insurance_number || '-',
          insurance_expiry_date: formatDate(vehicle.insurance_expiry_date),
          status: vehicle.is_active === 1 ? 'Active' : 'Inactive'
        });

        // Style each data row
        row.height = 20;
        const isEvenRow = (index + 2) % 2 === 0; // +2 because row 1 is header

        row.eachCell((cell, colNumber) => {
          // Alternate row colors
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isEvenRow ? 'F5F5F5' : 'FFFFFF' }
          };

          // Status column special styling
          if (colNumber === 10) { // Status column
            cell.font = {
              bold: true,
              color: { 
                argb: cell.value === 'Active' ? '2E7D32' : 'D32F2F' // Green for Active, Red for Inactive
              },
              size: 11,
              name: 'Arial'
            };
            cell.alignment = {
              vertical: 'middle',
              horizontal: 'center'
            };
          } else {
            cell.font = {
              color: { argb: '000000' },
              size: 11,
              name: 'Arial'
            };
            cell.alignment = {
              vertical: 'middle',
              horizontal: 'left'
            };
          }

          // Add borders to all cells
          cell.border = {
            top: { style: 'thin', color: { argb: 'E0E0E0' } },
            left: { style: 'thin', color: { argb: 'E0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
            right: { style: 'thin', color: { argb: 'E0E0E0' } }
          };
        });
      });

      // Add a title section at the top (insert rows before existing data)
      worksheet.insertRow(1, ['Logistics Management System - Vehicles Report']);
      worksheet.insertRow(2, [`Export Date: ${new Date().toLocaleDateString()}`]);
      worksheet.insertRow(3, [`Total Records: ${filteredVehicles.length}`]);
      worksheet.insertRow(4, []); // Empty row for spacing

      // Style the title section
      const titleRow = worksheet.getRow(1);
      titleRow.height = 30;
      worksheet.mergeCells('A1:J1');
      
      const titleCell = worksheet.getCell('A1');
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0D47A1' } // Darker blue
      };
      titleCell.font = {
        bold: true,
        color: { argb: 'FFFFFF' },
        size: 14,
        name: 'Arial'
      };
      titleCell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };

      // Style export info rows
      const infoRow2 = worksheet.getRow(2);
      const infoRow3 = worksheet.getRow(3);
      
      [infoRow2, infoRow3].forEach(row => {
        row.height = 20;
        const cell = row.getCell(1);
        cell.font = {
          bold: true,
          color: { argb: '424242' },
          size: 10,
          name: 'Arial'
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'left'
        };
      });

      // Apply autofilter to the data range (excluding title rows)
      worksheet.autoFilter = {
        from: { row: 5, column: 1 },
        to: { row: worksheet.rowCount, column: 10 }
      };

      // Freeze the header row
      worksheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 5 }
      ];

      // Generate filename with current date and time
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `vehicles_export_${dateStr}_${timeStr}.xlsx`;

      // Write the file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSnackbar(`Excel file exported successfully: ${filename}`, "success");

    } catch (error) {
      console.error('Export failed:', error);
      showSnackbar("Failed to export Excel file", "error");
    }
  };

  const columns: GridColDef[] = [
    { 
      field: "vehicle_id", 
      headerName: "ID", 
      width: 80 
    },
    { 
      field: "license_plate", 
      headerName: "License Plate", 
      flex: 1
    },
    { 
      field: "capacity", 
      headerName: "Capacity", 
      flex: 1
    },
    { 
      field: "miles_driven", 
      headerName: "Miles", 
      flex: 1
    },
    {
      field: "next_service",
      headerName: "Next Service",
      flex: 1,
      valueFormatter: (value: string | null) => formatDate(value)
    },
    { 
      field: "warehouse_name", 
      headerName: "Warehouse", 
      flex: 1
    },
    {
      field: "driver_name",
      headerName: "Driver",
      flex: 1,
      valueFormatter: (value: string | null) => value || "-",
    },
    {
      field: "is_active",
      headerName: "Status",
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
      field: "actions",
      headerName: "Actions",
      width: 160,
      headerAlign: "center", 
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack height="100%" direction="row" spacing={1} alignItems="center" justifyContent="center">
          <Button
            size="small"
            variant="outlined"
            color="primary"
            onClick={() => handleDialogOpen(row)}
            disabled={loading}
            sx={(theme) => ({
              mt: 2,
              width: "36px",
              minWidth: "36px",
              height: "36px",
              background: theme.palette.primary.gradient,
              color: "#fff",
              "&:hover": {
                background: "#fff",
                color: theme.palette.primary.dark,
              }
            })}
          >
            <Edit fontSize="small" />
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => confirmDeleteVehicle(row.vehicle_id)}
            disabled={loading}
            sx={{
              mt: 2,
              width: "36px",
              minWidth: "36px",
              height: "36px",
              background: "red",
              color: "white",
              "&:hover": {
                background: "#fff",
                color: "red",
              },
            }}
          >
            <NoTransferOutlined fontSize="small" />
          </Button>
        </Stack>
      ),
    }
  ];

  return (
    <Box sx={{ p: 3, minHeight: "100vh", backgroundColor: "#f4f4f4", borderRadius: 2 }}>
      <Box sx={{ p: 3, backgroundColor: "#fff", borderRadius: 2 }}>
        <Typography variant="h5" mb={2}>Manage Vehicles</Typography>

        {/* Search and Filter Section */}
        <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <FilterList sx={{ mr: 1 }} />
            Search & Filter
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            {/* Search Input - searches across multiple fields */}
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Search by license plate, insurance number, warehouse, driver, or capacity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                size="medium"
              />
            </Grid>
            
            {/* Status Filter */}
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="medium">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active Only</MenuItem>
                  <MenuItem value="inactive">Inactive Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Clear Filters Button */}
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={clearFilters}
                disabled={!searchTerm && statusFilter === "all"}
                size="medium"
              >
                Clear Filters
              </Button>
            </Grid>
            
            {/* Results Count */}
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary" textAlign="right">
                Showing {filteredVehicles.length} of {vehicles.length} vehicles
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <Stack direction="row" spacing={2} mb={2}>
          <Button
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #f97316, #ea580c)',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              '&:hover': {
                background: 'linear-gradient(45deg, #ea580c, #dc2626)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
            startIcon={<Add />}
            onClick={() => handleDialogOpen()}
          >
            Add Vehicle
          </Button>
          <Button
            variant="contained"
            disabled={!selectedIds.length}
            onClick={confirmBulkDelete}
            startIcon={<NoTransferOutlined />}
            sx={{
              background: 'linear-gradient(45deg, #ef4444, #dc2626)',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              '&:hover': {
                background: 'linear-gradient(45deg, #dc2626, #b91c1c)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                transform: 'translateY(-1px)',
              },
              '&.Mui-disabled': {
                background: 'linear-gradient(45deg, #fca5a5, #f87171)',
                color: 'rgba(255, 255, 255, 0.6)',
                boxShadow: 'none',
                transform: 'none',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Disable Selected ({selectedIds.length})
          </Button>
         
          <Button
            variant="contained"
            onClick={handleExport}
            startIcon={<SaveAlt />}
            sx={{
              background: 'linear-gradient(45deg, #fb923c, #f97316)',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              '&:hover': {
                background: 'linear-gradient(45deg, #f97316, #ea580c)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Export ({filteredVehicles.length})
          </Button>

          {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </Stack>

        <Paper elevation={3} sx={{ borderRadius: 2 }}>
          <DataGrid
            rows={filteredVehicles.map(v => ({ id: v.vehicle_id, ...v }))}
            columns={columns}
            checkboxSelection
            autoHeight
            disableRowSelectionOnClick
            rowSelectionModel={selectedIds}
            onRowSelectionModelChange={(ids) => setSelectedIds(ids as number[])}
            slots={{ toolbar: GridToolbar }}
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

        <VehicleDialog
          open={openDialog}
          editMode={editMode}
          formData={formData}
          errors={errors}
          drivers={drivers}
          warehouses={warehouses}
          onClose={handleDialogClose}
          onSave={handleSave}
          onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
        />

        <ConfirmDialog
          open={confirmOpen}
          title={confirmTitle}
          content={confirmContent}
          onConfirm={onConfirmAction}
          onCancel={() => setConfirmOpen(false)}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
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