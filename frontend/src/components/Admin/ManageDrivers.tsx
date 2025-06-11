// pages/admin/ManageDrivers.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  Box, Button, Snackbar, Alert, Stack, Typography, Paper, CircularProgress
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { SaveAlt, Delete, Edit, Add } from "@mui/icons-material";
import * as XLSX from "xlsx";
import {
  getAllDrivers, createDriver, updateDriver,
  deleteDriver, deleteDriversBulk
} from "../../services/driverService";
import DriverDialog from "./DriverDialog";
import ConfirmDialog from "./ConfirmDialog"; 
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelIcon from "@mui/icons-material/Cancel";


type Driver = {
  id: number;
  name: string;
  mob: string;
  address: string;
  email: string;
  warehouse_id: number;
  status:number;
};

// const initialFormState: Partial<Driver> = {};
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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error"
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmContent, setConfirmContent] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState<() => void>(() => () => {});

  const showSnackbar = (message: string, severity: "success" | "error") =>
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

    // if (!/^\+\d{7,15}$/.test(formData.mob || "")) newErrors.mob = "Mobile must start with '+' and be 7–15 digits";
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
      "Delete Driver?",
      "This action cannot be undone and may affect related logistic records.",
      () => handleDelete(id)
    );
  };

  const confirmBulkDelete = () => {
    showConfirmDialog(
      "Delete Selected Drivers?",
      "Are you sure you want to delete all selected drivers? This cannot be undone.",
      () => handleBulkDelete()
    );
  };

  const handleDelete = async (id: number) => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      await deleteDriver(id);
      showSnackbar("Driver deleted successfully", "success");
      await loadDrivers();
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to delete driver", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      await deleteDriversBulk(selectedIds);
      showSnackbar("Selected drivers deleted", "success");
      setSelectedIds([]);
      await loadDrivers();
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to delete selected drivers", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(drivers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Drivers");
    XLSX.writeFile(wb, "drivers_export.xlsx");
  };

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 80 },
  { field: "name", headerName: "Name", flex: 1 },
  { field: "mob", headerName: "Mobile", flex: 1 },
  { field: "email", headerName: "Email", flex: 1 },
  { field: "address", headerName: "Address", flex: 1 },
  { field: "warehouse_id", headerName: "Warehouse ID", flex: 1 },
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
          <Delete fontSize="small" />
        </Button>
      </Stack>
    ),
  }
];

  return (
    <Box sx={{ p: 3, minHeight: "100vh", backgroundColor: "#f4f4f4", borderRadius: 2 }}>
      <Box sx={{ p: 3, backgroundColor: "#fff", borderRadius: 2 }}>
        <Typography variant="h5" mb={2}>Manage Drivers</Typography>

        <Stack direction="row" spacing={2} mb={2}>
          <Button variant="outlined" sx={(theme)=>({
            background: theme.palette.primary.gradient,
            color:  theme.palette.primary.contrastText,
            "&:hover": {
              background: theme.palette.primary.dark,
              color: theme.palette.primary.contrastText,
            },
          })} startIcon={<Add />} onClick={() => handleDialogOpen()}>
            Add Driver
          </Button>
          <Button
            variant="outlined"
            color="error"
            disabled={!selectedIds.length}
            onClick={confirmBulkDelete}
            startIcon={<Delete />}
            sx={{
              color: "red",
              borderColor: "red",
              backgroundColor:"rgba(255, 0, 0, 0.5)",
              "&.Mui-disabled": {
                backgroundColor:"rgba(255, 0, 0, 0.5)",
                color: "rgba(255, 0, 0, 0.5)",
                borderColor: "rgba(255, 0, 0, 0.5)",
              },
            }}
          >
            Delete Selected
          </Button>
         
          <Button variant="outlined" sx={(theme)=>({
            background: theme.palette.primary.gradient,
            color:  theme.palette.primary.contrastText,
            "&:hover": {
              background: theme.palette.primary.dark,
              color: theme.palette.primary.contrastText,
            },
          })} startIcon={<SaveAlt />} onClick={handleExport} >
            Export
          </Button>


          {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </Stack>

        <Paper elevation={3} sx={{ borderRadius: 2 }}>
          <DataGrid
            rows={drivers}
            columns={columns}
            checkboxSelection
            autoHeight
            disableRowSelectionOnClick
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
