// pages/admin/ManageDrivers.tsx
import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  Box, Button, Snackbar, Alert, Stack, Typography, Paper, CircularProgress, TextField, InputAdornment,
  Grid, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { 
  SaveAlt, PersonOffRounded, Edit, Add, Search, FilterList
} from "@mui/icons-material";
import ExcelJS from 'exceljs';
import {
  getAllDrivers, createDriver, updateDriver,
  disableDriver, disableDriversBulk
} from "../../services/driverService";
import DriverDialog from "./DriverDialog";
import ConfirmDialog from "./ConfirmDialog"; 
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelIcon from "@mui/icons-material/CancelOutlined";

type Driver = {
  id: number;
  name: string;
  mob: string;
  address: string;
  email: string;
  warehouse_id: number;
  warehouse_name: string;
  status: number;
};

const initialFormState: Partial<Driver> = {
  mob: "+49",           // ← default mobile field value
  status: 1             // ← default driver status: Active
};

const ManageDrivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [formData, setFormData] = useState<Partial<Driver>>(initialFormState);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // Fixed: renamed from searchQuery to searchTerm
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error"| "warning",
  });
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmContent, setConfirmContent] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState<() => void>(() => () => {});

  // Filter drivers based on search query
  const filteredDrivers = useMemo(() => {
    let filtered = drivers;
    
    // Apply status filter first
    if (statusFilter === "active") {
      filtered = filtered.filter(driver => driver.status === 1);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter(driver => driver.status === 0);
    }
    
    // Then apply search query filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter((driver) => 
        driver.name.toLowerCase().includes(query) ||
        driver.mob.toLowerCase().includes(query) ||
        driver.email.toLowerCase().includes(query) ||
        driver.address.toLowerCase().includes(query) ||
        driver.warehouse_name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [drivers, searchTerm, statusFilter]);

  // Fixed: renamed function to match usage
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) newErrors.name = "Name is required";
    else if (/\d/.test(formData.name)) newErrors.name = "Name should not contain numbers";

    if (!/^\+49\d{10,12}$/.test(formData.mob || "")) {
     newErrors.mob = "Mobile must be a valid German number starting with +49 and 11–13 digits total";
    }

    if (!formData.address?.trim()) newErrors.address = "Address is required";

    if (!formData.email?.trim()) newErrors.email = "Email is required";
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) newErrors.email = "Invalid email address";

    if (!formData.warehouse_id || isNaN(+formData.warehouse_id) || +formData.warehouse_id <= 0)
      newErrors.warehouse_id = "Warehouse ID must be a positive number";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const loadDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllDrivers();
      setDrivers(data);
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to load drivers", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  const handleDialogOpen = (driver?: Driver) => {
    setEditMode(!!driver);
    setFormData(driver || initialFormState);
    setErrors({});
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!validateForm()) return;
  
    setLoading(true);
    try {
      if (editMode && formData.id != null) {
        const response = await updateDriver(formData.id, formData);
  
        if (response?.error) {
          showSnackbar(response.message || "An error occurred", "error");
          return;
        }
  
        showSnackbar("Driver updated successfully", "success");
      } else {
        const response = await createDriver(formData);
  
        if (response?.error) {
          showSnackbar(response.message || "An error occurred", "error");
          return;
        }
  
        showSnackbar("Driver created successfully", "success");
      }
  
      handleDialogClose();
      await loadDrivers();
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to save driver", "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteDriver = (id: number) => {
    showConfirmDialog(
      "Disable Driver?",
      "Are you sure you want to disable this driver? This will change their status to inactive.",
      () => handleDisable(id)
    );
  };

  const confirmBulkDelete = () => {
    showConfirmDialog(
      "Disable Driver?",
      "Are you sure you want to disable this driver? This will change their status to inactive.",
      () => handleBulkDelete()
    );
  };
const handleDisable = async (id: number) => {
  setConfirmOpen(false);
  setLoading(true);
  
  try {
    const response = await disableDriver(id);
    console.log(response);
    
    switch (response.status) {
      case "success":
        showSnackbar(response.message, "success");
        break;
      case "warning":
        showSnackbar(response.message, "warning");
        break;
      case "error":
      default:
        showSnackbar(response.message || "Failed to disable driver", "error");
        break;
    }
    
    await loadDrivers();
  } catch (err) {
    console.error(err);
    showSnackbar("Failed to disable driver", "error");
  } finally {
    setLoading(false);
  }
};
const handleBulkDelete = async () => {
  if (selectedIds.length === 0) return;
  setConfirmOpen(false);
  setLoading(true);
  
  try {
    const response = await disableDriversBulk(selectedIds);
    console.log(response);
    
    switch (response.status) {
      case "success":
        showSnackbar(response.message, "success");
        break;
      case "warning":
        showSnackbar(response.message, "warning");
        break;
      case "error":
      default:
        showSnackbar(response.message || "Failed to disable selected drivers", "error");
        break;
    }
    
    setSelectedIds([]);
    await loadDrivers();
  } catch (err) {
    console.error(err);
    showSnackbar("Failed to disable selected drivers", "error");
  } finally {
    setLoading(false);
  }
};

  // Enhanced export function
  const handleExport = async () => {
    try {
      // Create a new workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Drivers', {
        properties: { tabColor: { argb: '1976D2' } }
      });

      // Set workbook properties
      workbook.creator = 'Driver Management System';
      workbook.lastModifiedBy = 'Driver Management System';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Define columns with headers
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Mobile', key: 'mobile', width: 18 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Address', key: 'address', width: 35 },
        { header: 'Warehouse Name', key: 'warehouse_name', width: 25 },
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
      filteredDrivers.forEach((driver, index) => {
        const row = worksheet.addRow({
          id: driver.id,
          name: driver.name,
          mobile: driver.mob,
          email: driver.email,
          address: driver.address,
          warehouse_name: driver.warehouse_name,
          status: driver.status === 1 ? 'Active' : 'Inactive'
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
          if (colNumber === 7) { // Status column
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
      worksheet.insertRow(1, ['Logistics Management System - Drivers Report']);
      worksheet.insertRow(2, [`Export Date: ${new Date().toLocaleDateString()}`]);
      worksheet.insertRow(3, [`Total Records: ${filteredDrivers.length}`]);
      worksheet.insertRow(4, []); // Empty row for spacing

      // Style the title section
      const titleRow = worksheet.getRow(1);
      titleRow.height = 30;
      worksheet.mergeCells('A1:G1');
      
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
        to: { row: worksheet.rowCount, column: 7 }
      };

      // Freeze the header row
      worksheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 5 }
      ];

      // Generate filename with current date and time
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `drivers_export_${dateStr}_${timeStr}.xlsx`;

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
    { field: "id", headerName: "ID", width: 80 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "mob", headerName: "Mobile", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "address", headerName: "Address", flex: 1 },
    { field: "warehouse_name", headerName: "Warehouse name", flex: 1 },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: ({ row }) => (
        <Stack height="100%" direction="row" spacing={1} alignItems="center" justifyContent="center"> 
          {row.status === 1 ? (
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
            variant="contained"
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
            variant="contained"
            color="error"
            onClick={() => confirmDeleteDriver(row.id)}
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
            <PersonOffRounded fontSize="small" />
          </Button>
        </Stack>
      ),
    }
  ];

  return (
    <Box sx={{ p: 3, minHeight: "100vh", backgroundColor: "#f4f4f4", borderRadius: 2 }}>
      <Box sx={{ p: 3, backgroundColor: "#fff", borderRadius: 2 }}>
        <Typography variant="h5" mb={2}>Manage Drivers</Typography>

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
                placeholder="Search by name, mobile, email, address, or warehouse..."
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
                Showing {filteredDrivers.length} of {drivers.length} drivers
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
          Add Driver
        </Button>
        <Button
  variant="contained"
  disabled={!selectedIds.length}
  onClick={confirmBulkDelete}
  startIcon={<PersonOffRounded />}
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
  Export ({filteredDrivers.length})
</Button>

          {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </Stack>

        <Paper elevation={3} sx={{ borderRadius: 2 }}>
          <DataGrid
            rows={filteredDrivers}
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

        <DriverDialog
          open={openDialog}
          editMode={editMode}
          formData={formData}
          errors={errors}
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

export default ManageDrivers;