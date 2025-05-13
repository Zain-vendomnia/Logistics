import React, { useCallback, useEffect, useState } from "react";
import {
  Box, Button, Snackbar, Alert, Stack, Typography, Paper
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { SaveAlt, Delete, Edit, Add } from "@mui/icons-material";
import * as XLSX from "xlsx";
import {
  getAllWarehouses, createWarehouse, updateWarehouse,
  deleteWarehouse, deleteWarehousesBulk
} from "../../services/warehouseService";
import WarehouseFormModal from "./WarehouseDialog";
import ConfirmDialog from "./ConfirmDialog"; // Update the path based on your folder structure

type Warehouse = {
  warehouse_id: number;
  warehouse_name: string;
  clerk_name: string;
  clerk_mob: string;
  address: string;
  email: string;
};

const ManageWarehouses = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Warehouse>>({});
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const showSnackbar = (message: string, severity: "success" | "error") =>
    setSnackbar({ open: true, message, severity });

  const closeSnackbar = () =>
    setSnackbar((prev) => ({ ...prev, open: false }));

  const loadWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllWarehouses();
      setWarehouses(data);
    } catch {
      showSnackbar("Failed to load warehouses", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  const handleOpenDialog = (warehouse?: Warehouse) => {
    setEditMode(!!warehouse);
    setFormData(warehouse || {});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleSubmitWarehouse = async (data: Partial<Warehouse>) => {
    setActionLoading(true);
    try {
      if (editMode) {
        await updateWarehouse(data.warehouse_id!, data);
      } else {
        await createWarehouse(data);
      }
      showSnackbar(`Warehouse ${editMode ? "updated" : "created"} successfully`, "success");
      handleCloseDialog();
      loadWarehouses();
    } catch {
      showSnackbar("Failed to save warehouse", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const requestDeleteWarehouse = (id: number) => {
    setDeleteTargetId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setConfirmOpen(false);
    setActionLoading(true);
    try {
      await deleteWarehouse(deleteTargetId);
      showSnackbar("Warehouse deleted successfully", "success");
      loadWarehouses();
    } catch {
      showSnackbar("Failed to delete warehouse", "error");
    } finally {
      setDeleteTargetId(null);
      setActionLoading(false);
    }
  };

  const handleGroupDelete = async () => {
    setActionLoading(true);
    try {
      await deleteWarehousesBulk(selectedIds);
      showSnackbar("Selected warehouses deleted successfully", "success");
      setSelectedIds([]);
      loadWarehouses();
    } catch {
      showSnackbar("Failed to delete selected warehouses", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(warehouses);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Warehouses");
    XLSX.writeFile(wb, "warehouses_export.xlsx");
  };

  const columns: GridColDef[] = [
    { field: "warehouse_id", headerName: "ID", width: 80 },
    { field: "warehouse_name", headerName: "Warehouse Name", flex: 1 },
    { field: "clerk_name", headerName: "Clerk Name", flex: 1 },
    { field: "clerk_mob", headerName: "Clerk Mobile", flex: 1 },
    { field: "address", headerName: "Address", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 160,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack
          direction="row"
          spacing={1}
          sx={{ height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center', display: 'flex' }}
        >
          <Button
            size="small"
            variant="outlined"
            color="primary"
            onClick={() => handleOpenDialog(params.row)}
            disabled={actionLoading}
            sx={(theme) => ({
              mt: 2,
              width: "36px", // adjust to your desired size
              minWidth: "36px",
              height: "36px",
              background: theme.palette.primary.gradient,
              color: "#fff",
              "&:hover": {
                background: "#fff", // or any solid background you prefer
                color: theme.palette.primary.dark,
              }
            })}
          >
            <Edit fontSize="small" />
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => requestDeleteWarehouse(params.row.warehouse_id)}
            disabled={actionLoading}
            sx={(theme) => ({
              mt: 2,
              width: "36px", // adjust to your desired size
              minWidth: "36px",
              height: "36px",
              background: "red",
              color: "white",
              padding: 0,
              "&:hover": {
                background: "#fff",
                color: "red",
              },
            })}
          >
            <Delete fontSize="small" />
          </Button>
        </Stack>
      ),
    }
  ];

  return (
    <Box sx={{ p: 3, minHeight: 'calc(100vh - 50px)', backgroundColor: "#f4f4f4", borderRadius: 2 }}>
      <Box sx={{ p: 3, backgroundColor: "#fff", borderRadius: 2 }}>
        <Typography variant="h5" mb={2}>Manage Warehouses</Typography>

        <Stack direction="row" spacing={2} mb={2}>
          <Button
            variant="outlined"
            sx={(theme)=>({
              background: theme.palette.primary.gradient,
              color: "#fff",
              "&:hover": {
                background: "#fff", // or any solid background you prefer
                color: theme.palette.primary.dark,
              },
            })}
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            disabled={actionLoading}

          >
            Add Warehouse
          </Button>

          <Button
            variant="outlined"
            color="error"
            disabled={!selectedIds.length || actionLoading}
            onClick={handleGroupDelete}
            startIcon={<Delete />}
            sx={{
              color: 'red',
              borderColor: 'red',
              '&.Mui-disabled': {
                color: 'rgba(255, 0, 0, 0.5)',
                borderColor: 'rgba(255, 0, 0, 0.5)',
              },
            }}
          >
            Delete Selected
          </Button>

          <Button
            variant="outlined"
            onClick={handleExport}
            startIcon={<SaveAlt />}
          >
            Export
          </Button>
        </Stack>

        <Paper elevation={3} sx={{ borderRadius: 2 }}>
          <DataGrid
            loading={loading}
            rows={warehouses}
            columns={columns}
            getRowId={(row) => row.warehouse_id}
            checkboxSelection
            autoHeight
            disableRowSelectionOnClick
            onRowSelectionModelChange={(ids) => setSelectedIds(ids as number[])}
            slots={{ toolbar: GridToolbar }}
            sx={{
              "& .MuiDataGrid-columnHeaderRow": {
                backgroundColor: "#1976d2",
                "& .MuiDataGrid-columnHeaderTitle": {
                  fontWeight: "bold",
                  color: "white",
                },
              },
              "& .MuiDataGrid-row:nth-of-type(even)": {
                backgroundColor: "#f9f9f9",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "#e3f2fd !important",
              },
            }}
          />
        </Paper>

        <WarehouseFormModal
          open={openDialog}
          onClose={handleCloseDialog}
          onSubmit={handleSubmitWarehouse}
          initialData={formData}
          editMode={editMode}
        />

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Deletion"
        content="Are you sure you want to delete this warehouse? This action may affect related data."
        onCancel={() => setConfirmOpen(false)}  
        onConfirm={handleConfirmDelete}
      />


        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={closeSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={closeSnackbar}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default ManageWarehouses;
