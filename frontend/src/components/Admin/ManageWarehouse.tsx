import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Snackbar,
  Alert,
  Stack,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import {
  SaveAlt,
  DomainDisabledOutlined,
  Edit,
  Add,
  DomainAddOutlined,
  Search,
  FilterList,
  CheckCircleOutline,
  CancelOutlined,
  DirectionsCar,
} from "@mui/icons-material";
import ExcelJS from "exceljs";
import {
  getAllWarehouses,
  createWarehouse,
  updateWarehouse,
  disableWarehouse,
  disableWarehousesBulk,
} from "../../services/warehouseService";
import WarehouseFormModal from "./WarehouseDialog";
import ConfirmDialog from "./ConfirmDialog";
import { Warehouse } from "../../types/warehouse.type";
import NewSolarModule from "./NewSolarModule";

// type Warehouse = {
//   warehouse_id: number;
//   warehouse_name: string;
//   clerk_name: string;
//   clerk_mob: string;
//   address: string;
//   email: string;
//   is_active: number;
//   created_at: string;
//   updated_at: string | null;
//   vehicle_license_plates?: string[]; // Added for vehicles
// };

const ManageWarehouses = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState<Warehouse[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Warehouse>>({
    clerkMob: "+49", // default German country code
  });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning",
  });

  // Simplified filter states - only two inputs
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "warning",
  ) => setSnackbar({ open: true, message, severity });

  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const loadWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllWarehouses();
      console.log("==================================");
      console.log("Fetched Warehouses:", data);
      console.log("==================================");
      setWarehouses(data);
      setFilteredWarehouses(data);
    } catch {
      showSnackbar("Failed to load warehouses", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  // Simplified filtering with only search and status
  useEffect(() => {
    let filtered = warehouses;

    // Search functionality - searches across multiple fields
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (warehouse) =>
          warehouse.name.toLowerCase().includes(searchLower) ||
          warehouse.clerkName?.toLowerCase().includes(searchLower) ||
          warehouse.clerkMob?.toLowerCase().includes(searchLower) ||
          warehouse.address?.toLowerCase().includes(searchLower) ||
          warehouse.email?.toLowerCase().includes(searchLower),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((warehouse) =>
        statusFilter === "active"
          ? warehouse.is_active === true
          : warehouse.is_active === false,
      );
    }

    setFilteredWarehouses(filtered);
  }, [warehouses, searchTerm, statusFilter]);

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
        await updateWarehouse(data.id!, data);
      } else {
        await createWarehouse(data);
      }
      showSnackbar(
        `Warehouse ${editMode ? "updated" : "created"} successfully`,
        "success",
      );
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

  const handleConfirmDisable = async () => {
    if (!deleteTargetId) return;
    setConfirmOpen(false);
    setActionLoading(true);

    try {
      const response = await disableWarehouse(deleteTargetId);
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
          showSnackbar(
            response.message || "Failed to disable warehouse",
            "error",
          );
          break;
      }

      loadWarehouses();
    } catch (err) {
      showSnackbar("Failed to disable warehouse", "error");
    } finally {
      setDeleteTargetId(null);
      setActionLoading(false);
    }
  };

  const handleGroupDelete = async () => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);

    try {
      const response = await disableWarehousesBulk(selectedIds); // API call for multiple

      switch (response.status) {
        case "success":
          showSnackbar(response.message, "success");
          break;
        case "warning":
          showSnackbar(response.message, "warning");
          break;
        case "error":
        default:
          showSnackbar(
            response.message || "Failed to disable selected warehouses",
            "error",
          );
          break;
      }

      setSelectedIds([]);
      loadWarehouses();
    } catch (err) {
      showSnackbar("Failed to disable selected warehouses", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      // Create a new workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Warehouses", {
        properties: { tabColor: { argb: "1976D2" } },
      });

      // Set workbook properties
      workbook.creator = "Warehouse Management System";
      workbook.lastModifiedBy = "Warehouse Management System";
      workbook.created = new Date();
      workbook.modified = new Date();

      // Define columns with headers
      worksheet.columns = [
        { header: "ID", key: "id", width: 8 },
        { header: "Name", key: "name", width: 25 },
        { header: "Vehicles", key: "vehicles", width: 30 },
        { header: "Address", key: "address", width: 35 },
        { header: "Contact", key: "contact", width: 18 },
        { header: "Email", key: "email", width: 30 },
        { header: "Status", key: "status", width: 12 },
        { header: "Created Date", key: "created_date", width: 15 },
        { header: "Updated Date", key: "updated_date", width: 15 },
      ];

      // Style the header row
      const headerRow = worksheet.getRow(1);
      headerRow.height = 25;

      headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "1976D2" }, // Material Design Blue
        };
        cell.font = {
          bold: true,
          color: { argb: "FFFFFF" },
          size: 12,
          name: "Arial",
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
        };
        cell.border = {
          top: { style: "thin", color: { argb: "000000" } },
          left: { style: "thin", color: { argb: "000000" } },
          bottom: { style: "thin", color: { argb: "000000" } },
          right: { style: "thin", color: { argb: "000000" } },
        };
      });

      // Add data rows
      filteredWarehouses.forEach((warehouse, index) => {
        const row = worksheet.addRow({
          id: warehouse.id,
          name: warehouse.name,
          vehicles:
            warehouse.vehicle_license_plates &&
            warehouse.vehicle_license_plates.length > 0
              ? warehouse.vehicle_license_plates.join(", ")
              : "No vehicles",
          address: warehouse.address,
          contact: warehouse.clerkMob,
          email: warehouse.email,
          status: warehouse.is_active ? "Active" : "Inactive",
          created_date: new Date(warehouse.created_at!).toLocaleDateString(),
          updated_date: warehouse.updated_at
            ? new Date(warehouse.updated_at).toLocaleDateString()
            : "-",
        });

        // Style each data row
        row.height = 20;
        const isEvenRow = (index + 2) % 2 === 0; // +2 because row 1 is header

        row.eachCell((cell, colNumber) => {
          // Alternate row colors
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: isEvenRow ? "F5F5F5" : "FFFFFF" },
          };

          // Status column special styling
          if (colNumber === 7) {
            // Status column (moved from 6 to 7)
            cell.font = {
              bold: true,
              color: {
                argb: cell.value === "Active" ? "2E7D32" : "D32F2F", // Green for Active, Red for Inactive
              },
              size: 11,
              name: "Arial",
            };
            cell.alignment = {
              vertical: "middle",
              horizontal: "center",
            };
          } else if (colNumber === 8 || colNumber === 9) {
            // Date columns
            cell.font = {
              color: { argb: "000000" },
              size: 11,
              name: "Arial",
            };
            cell.alignment = {
              vertical: "middle",
              horizontal: "center",
            };
          } else {
            cell.font = {
              color: { argb: "000000" },
              size: 11,
              name: "Arial",
            };
            cell.alignment = {
              vertical: "middle",
              horizontal: "left",
            };
          }

          // Add borders to all cells
          cell.border = {
            top: { style: "thin", color: { argb: "E0E0E0" } },
            left: { style: "thin", color: { argb: "E0E0E0" } },
            bottom: { style: "thin", color: { argb: "E0E0E0" } },
            right: { style: "thin", color: { argb: "E0E0E0" } },
          };
        });
      });

      // Add a title section at the top (insert rows before existing data)
      worksheet.insertRow(1, [
        "Logistics Management System - Warehouses Report",
      ]);
      worksheet.insertRow(2, [
        `Export Date: ${new Date().toLocaleDateString()}`,
      ]);
      worksheet.insertRow(3, [`Total Records: ${filteredWarehouses.length}`]);
      worksheet.insertRow(4, []); // Empty row for spacing

      // Style the title section
      const titleRow = worksheet.getRow(1);
      titleRow.height = 30;
      worksheet.mergeCells("A1:I1"); // Adjusted for 9 columns

      const titleCell = worksheet.getCell("A1");
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0D47A1" }, // Darker blue
      };
      titleCell.font = {
        bold: true,
        color: { argb: "FFFFFF" },
        size: 14,
        name: "Arial",
      };
      titleCell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // Style export info rows
      const infoRow2 = worksheet.getRow(2);
      const infoRow3 = worksheet.getRow(3);

      [infoRow2, infoRow3].forEach((row) => {
        row.height = 20;
        const cell = row.getCell(1);
        cell.font = {
          bold: true,
          color: { argb: "424242" },
          size: 10,
          name: "Arial",
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: "left",
        };
      });

      // Apply autofilter to the data range (excluding title rows)
      worksheet.autoFilter = {
        from: { row: 5, column: 1 },
        to: { row: worksheet.rowCount, column: 9 }, // Adjusted for 9 columns
      };

      // Freeze the header row
      worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: 5 }];

      // Generate filename with current date and time
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");
      const filename = `warehouses_export_${dateStr}_${timeStr}.xlsx`;

      // Write the file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSnackbar(`Excel file exported successfully: ${filename}`, "success");
    } catch (error) {
      console.error("Export failed:", error);
      showSnackbar("Failed to export Excel file", "error");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  const columns: GridColDef[] = [
    {
      field: "warehouse_id",
      headerName: "ID",
      width: 80,
      type: "number",
    },
    {
      field: "warehouse_name",
      headerName: "Warehouse Name",
      flex: 1.5,
      minWidth: 200,
    },
    {
      field: "vehicle_license_plates",
      headerName: "Vehicles",
      flex: 2,
      minWidth: 250,
      sortable: false,
      renderCell: (params) => {
        const vehicles = params.value as string[] | undefined;

        if (!vehicles || vehicles.length === 0) {
          return (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <DirectionsCar sx={{ fontSize: 16, color: "#9e9e9e" }} />
              <Typography
                variant="body2"
                color="text.secondary"
                fontSize="0.875rem"
              >
                No vehicles
              </Typography>
            </Stack>
          );
        }

        return (
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            flexWrap="wrap"
            sx={{ py: 1, gap: 0.5 }}
          >
            {vehicles.map((plate, index) => (
              <Chip
                key={index}
                label={plate}
                size="small"
                // icon={<DirectionsCar sx={{ fontSize: 14 }} />}
                sx={{
                  backgroundColor: "#398fd4ff",
                  color: "#edf1f1ff",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  height: "24px",
                  borderRadius: "12px",
                  "& .MuiChip-icon": {
                    color: "#1976d2",
                    fontSize: 14,
                  },
                }}
              />
            ))}
          </Stack>
        );
      },
    },
    {
      field: "clerk_name",
      headerName: "Clerk Name",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "clerk_mob",
      headerName: "Clerk Mobile",
      flex: 1,
      minWidth: 130,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "address",
      headerName: "Address",
      flex: 2,
      minWidth: 250,
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1.2,
      minWidth: 180,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "is_active",
      headerName: "Status",
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Stack
          height="100%"
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="center"
        >
          {params.value === 1 ? (
            <>
              <CheckCircleOutline color="success" />
              <Typography variant="body2" color="success.main">
                Active
              </Typography>
            </>
          ) : (
            <>
              <CancelOutlined color="error" />
              <Typography variant="body2" color="error.main">
                Inactive
              </Typography>
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
      renderCell: (params) => (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            height: "100%",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            display: "flex",
          }}
        >
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={() => handleOpenDialog(params.row)}
            disabled={actionLoading}
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
              },
            })}
          >
            <Edit fontSize="small" />
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={() => requestDeleteWarehouse(params.row.warehouse_id)}
            disabled={actionLoading}
            sx={(theme) => ({
              mt: 2,
              width: "36px",
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
            <DomainDisabledOutlined fontSize="small" />
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <Box
      sx={{
        p: 3,
        minHeight: "calc(100vh - 50px)",
        backgroundColor: "#f4f4f4",
        borderRadius: 2,
      }}
    >
      <Box sx={{ p: 3, backgroundColor: "#fff", borderRadius: 2 }}>
        <Typography variant="h5" mb={2}>
          Manage Warehouses
        </Typography>

        {/* Simplified Search and Filter Section */}
        <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, display: "flex", alignItems: "center" }}
          >
            <FilterList sx={{ mr: 1 }} />
            Search & Filter
          </Typography>

          <Grid container spacing={2} alignItems="center">
            {/* Search Input - searches across multiple fields */}
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Search by name, clerk, mobile, email, or address..."
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
                  onChange={(e) => setStatusFilter(e.target.value)}
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
              <Typography
                variant="body2"
                color="textSecondary"
                textAlign="right"
              >
                Showing {filteredWarehouses.length} of {warehouses.length}{" "}
                warehouses
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
          <Button
            sx={{
              background: "linear-gradient(45deg, #f97316, #ea580c)",
              color: "white",
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              "&:hover": {
                background: "linear-gradient(45deg, #ea580c, #dc2626)",
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                transform: "translateY(-1px)",
              },
              transition: "all 0.2s ease-in-out",
            }}
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            disabled={actionLoading}
          >
            Add Warehouse
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={!selectedIds.length || actionLoading}
            onClick={handleGroupDelete}
            startIcon={<DomainAddOutlined />}
            sx={{
              background: "linear-gradient(45deg, #ef4444, #dc2626)",
              color: "white",
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              "&:hover": {
                background: "linear-gradient(45deg, #dc2626, #b91c1c)",
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                transform: "translateY(-1px)",
              },
              "&.Mui-disabled": {
                background: "linear-gradient(45deg, #fca5a5, #f87171)",
                color: "rgba(255, 255, 255, 0.6)",
                boxShadow: "none",
                transform: "none",
              },
              transition: "all 0.2s ease-in-out",
            }}
          >
            Disable Selected ({selectedIds.length})
          </Button>

          <Button
            variant="contained"
            sx={{
              background: "linear-gradient(45deg, #fb923c, #f97316)",
              color: "white",
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              "&:hover": {
                background: "linear-gradient(45deg, #f97316, #ea580c)",
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                transform: "translateY(-1px)",
              },
              transition: "all 0.2s ease-in-out",
            }}
            startIcon={<SaveAlt />}
            onClick={handleExport}
            disabled={!filteredWarehouses.length}
          >
            Export ({filteredWarehouses.length})
          </Button>
          <NewSolarModule />
        </Stack>

        {/* Data Grid */}
        <Paper elevation={3} sx={{ borderRadius: 2 }}>
          <DataGrid
            loading={loading}
            rows={filteredWarehouses}
            columns={columns}
            getRowId={(row) => row.warehouse_id}
            checkboxSelection
            rowSelectionModel={selectedIds}
            autoHeight
            getRowHeight={() => "auto"}
            disableRowSelectionOnClick
            onRowSelectionModelChange={(ids) => setSelectedIds(ids as number[])}
            slots={{ toolbar: GridToolbar }}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 25,
                },
              },
              sorting: {
                sortModel: [{ field: "created_at", sort: "desc" }],
              },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
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
              "& .MuiDataGrid-cell": {
                display: "flex",
                alignItems: "center",
                py: 1,
              },
            }}
          />
        </Paper>

        {/* Modals */}
        <WarehouseFormModal
          open={openDialog}
          onClose={handleCloseDialog}
          onSubmit={handleSubmitWarehouse}
          initialData={formData}
          editMode={editMode}
        />

        <ConfirmDialog
          open={confirmOpen}
          title="Disable Warehouse?"
          content="Are you sure you want to disable this warehouse? This action may affect related data."
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirmDisable}
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
    </Box>
  );
};

export default ManageWarehouses;
