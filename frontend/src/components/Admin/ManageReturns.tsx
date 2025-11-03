import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Snackbar,
  Alert,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridToolbar,
} from "@mui/x-data-grid";
import {
  Search,
  Edit,
  Delete,
  SaveAlt,
} from "@mui/icons-material";
import ExcelJS from "exceljs";
import {
  getAllReturns,
  updateReturn,
  deleteReturn,
  deleteAllReturns,
} from "../../services/returnService";
import ConfirmDialog from "./ConfirmDialog"; 

interface ReturnItem {
  return_id: number;
  order_number: string;
  article_sku: string;
  original_quantity: number;
  return_quantity: number;
  created_at: string;
}

const ManageReturns = () => {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(false);
  // const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [editDialog, setEditDialog] = useState(false);
  const [editRow, setEditRow] = useState<ReturnItem | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState(false);

  // Confirm Dialog States
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    content: "",
    onConfirm: () => {},
  });

  const showSnackbar = (message: string, severity: "success" | "error" | "warning") =>
    setSnackbar({ open: true, message, severity });
  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  // Close confirm dialog
  const closeConfirmDialog = () => {
    setConfirmDialog({
      open: false,
      title: "",
      content: "",
      onConfirm: () => {},
    });
  };

  // ✅ Fetch all returns
  const loadReturns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllReturns();
      setReturns(data);
    } catch (err) {
      console.error("Error loading returns:", err);
      showSnackbar("Failed to load return data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  // ✅ Filtered data
  const filteredReturns = returns.filter((item) =>
    Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // ✅ Handle edit
  const handleEditClick = (row: ReturnItem) => {
    setEditRow(row);
    setEditQty(row.return_quantity);
    setEditDialog(true);
  };

  const handleEditSave = async () => {
    if (!editRow) return;

    // ✅ Validation: Check if return quantity is less than or equal to 0
    if (editQty <= 0) {
      showSnackbar("Return quantity must be greater than 0", "error");
      return;
    }

    // ✅ Validation: Check if return quantity exceeds original quantity
    if (editQty > editRow.original_quantity) {
      showSnackbar(
        `Return quantity cannot exceed original quantity (${editRow.original_quantity})`,
        "error"
      );
      return;
    }

    setActionLoading(true);
    try {
      await updateReturn(editRow.return_id, { return_quantity: editQty });
      showSnackbar("Return quantity updated successfully", "success");
      setEditDialog(false);
      loadReturns();
    } catch (err) {
      console.error("Update error:", err);
      showSnackbar("Failed to update return", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ Handle delete with confirm dialog
  const handleDelete = (id: number) => {
    setConfirmDialog({
      open: true,
      title: "Delete Return?",
      content: "Are you sure you want to delete this return? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await deleteReturn(id);
          showSnackbar("Return deleted successfully", "success");
          loadReturns();
          closeConfirmDialog();
        } catch (err) {
          console.error("Delete error:", err);
          showSnackbar("Failed to delete return", "error");
          closeConfirmDialog();
        }
      },
    });
  };

  // ✅ Delete all with confirm dialog
  const handleDeleteAll = () => {
    setConfirmDialog({
      open: true,
      title: "Delete All Returns?",
      content: "Are you sure you want to delete ALL returns? This action cannot be undone and will remove all return records from the system.",
      onConfirm: async () => {
        try {
          await deleteAllReturns();
          showSnackbar("All returns deleted successfully", "success");
          loadReturns();
          closeConfirmDialog();
        } catch (err) {
          console.error("Delete all error:", err);
          showSnackbar("Failed to delete all returns", "error");
          closeConfirmDialog();
        }
      },
    });
  };

  // ✅ Export Excel
  const handleExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Returns");
      worksheet.columns = [
        { header: "Return ID", key: "return_id", width: 12 },
        { header: "Order Number", key: "order_number", width: 20 },
        { header: "Article SKU", key: "article_sku", width: 25 },
        { header: "Original Qty", key: "original_quantity", width: 15 },
        { header: "Return Qty", key: "return_quantity", width: 15 },
        { header: "Created At", key: "created_at", width: 20 },
      ];
      filteredReturns.forEach((row) => worksheet.addRow(row));
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `returns_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      showSnackbar("Exported successfully!", "success");
    } catch (err) {
      console.error("Export error:", err);
      showSnackbar("Failed to export data", "error");
    }
  };

  // ✅ Columns with full width and proper styling
  const columns: GridColDef[] = [
    { 
      field: "return_id", 
      headerName: "Return ID", 
      flex: 0.8,
      minWidth: 100,
    },
    { 
      field: "order_number", 
      headerName: "Order Number", 
      flex: 1.2,
      minWidth: 150,
    },
    { 
      field: "article_sku", 
      headerName: "Article SKU", 
      flex: 2,
      minWidth: 220,
    },
    {
      field: "original_quantity",
      headerName: "Original Qty",
      flex: 1,
      minWidth: 120,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "return_quantity",
      headerName: "Return Qty",
      flex: 1,
      minWidth: 120,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "created_at",
      headerName: "Created At",
      flex: 1.5,
      minWidth: 160,
      renderCell: (params) =>
        new Date(params.value).toLocaleString("en-GB", {
          dateStyle: "short",
          timeStyle: "short",
        }),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.2,
      minWidth: 160,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            color="warning"
            variant="contained"
            onClick={() => handleEditClick(params.row)}
            sx={{ minWidth: "auto", px: 1.5 }}
          >
            <Edit fontSize="small" />
          </Button>
          <Button
            size="small"
            color="error"
            variant="contained"
            onClick={() => handleDelete(params.row.return_id)}
            sx={{ minWidth: "auto", px: 1.5 }}
          >
            <Delete fontSize="small" />
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      {/* Search Bar + Action Buttons */}
      <Box
        sx={{
          backgroundColor: "white",
          p: 2,
          mb: 2,
          borderRadius: 1,
          boxShadow: 1,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Search by order number or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            size="small"
            sx={{ flexGrow: 1, maxWidth: 400 }}
          />

          <Button
            variant="contained"
            onClick={handleExport}
            startIcon={<SaveAlt />}
            sx={{
              backgroundColor: "#ff9800",
              "&:hover": { backgroundColor: "#f57c00" },
            }}
          >
            Export Excel
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAll}
            startIcon={<Delete />}
          >
            Delete All
          </Button>
        </Stack>
      </Box>

      {/* Toolbar Section */}
      <Box
        sx={{
          backgroundColor: "white",
          px: 2,
          py: 1,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Stack direction="row" spacing={3} alignItems="center">
          <Button
            size="small"
            sx={{ color: "#ff9800", textTransform: "none" }}
          >
            |||  Columns
          </Button>
          <Button
            size="small"
            sx={{ color: "#ff9800", textTransform: "none" }}
          >
            ☰  Filters
          </Button>
          <Button
            size="small"
            sx={{ color: "#ff9800", textTransform: "none" }}
          >
            ▦  Density
          </Button>
          <Button
            size="small"
            sx={{ color: "#ff9800", textTransform: "none" }}
          >
            ⬇  Export
          </Button>
        </Stack>
      </Box>

      {/* Data Grid - Full Width */}
      <Box
        sx={{
          backgroundColor: "white",
          width: "100%",
          "& .MuiDataGrid-root": {
            border: "none",
            borderBottomLeftRadius: 4,
            borderBottomRightRadius: 4,
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#90a4ae",
            color: "white",
            fontSize: "0.95rem",
            fontWeight: 600,
          },
          "& .MuiDataGrid-columnHeader": {
            backgroundColor: "#90a4ae",
            color: "white",
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            color: "white",
            fontWeight: 600,
          },
          "& .MuiDataGrid-row:nth-of-type(even)": {
            backgroundColor: "#f5f5f5",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "#e3f2fd",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid #e0e0e0",
          },
          "& .MuiDataGrid-footerContainer": {
            backgroundColor: "#d3d3d3",
            color: "white",
          },
        }}
      >
        <DataGrid
          rows={filteredReturns}
          columns={columns}
          getRowId={(row) => row.return_id}
          loading={loading}
          checkboxSelection
          disableRowSelectionOnClick
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              sx: { display: "none" }, // Hide default toolbar since we have custom one
            },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          sx={{
            minHeight: 400,
            "& .MuiDataGrid-virtualScroller": {
              minHeight: 300,
            },
          }}
        />
      </Box>

      {/* Edit Quantity Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Return Quantity</DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={1}>
            Order: <strong>{editRow?.order_number}</strong>
          </Typography>
          <Typography variant="body2" mb={1}>
            SKU: <strong>{editRow?.article_sku}</strong>
          </Typography>
          <Typography variant="body2" mb={2} color="text.secondary">
            Original Quantity: <strong>{editRow?.original_quantity}</strong>
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="Return Quantity"
            value={editQty}
            onChange={(e) => setEditQty(Number(e.target.value))}
            inputProps={{ 
              min: 1,
              max: editRow?.original_quantity
            }}
            helperText={`Must be between 1 and ${editRow?.original_quantity}`}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setEditDialog(false)}
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #f7941d 30%, #f37021 90%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(45deg, #f37021 30%, #f7941d 90%)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            color="primary"
            disabled={actionLoading}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        content={confirmDialog.content}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
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
  );
};

export default ManageReturns;