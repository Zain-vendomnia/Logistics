import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { SaveAlt, Delete, Edit, Add } from "@mui/icons-material";
import * as XLSX from "xlsx";

type Driver = {
  id: number;
  name: string;
  mob: number;
  address: string;
  warehouse_id: number;
};

const initialDrivers: Driver[] = [
  { id: 1, name: "John Doe", mob: 9876543210, address: "New York", warehouse_id: 101 },
  { id: 2, name: "Alice Smith", mob: 9123456780, address: "Chicago", warehouse_id: 102 },
  { id: 3, name: "Bob Johnson", mob: 9988776655, address: "Los Angeles", warehouse_id: 103 },
];

const ManageDrivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Driver>>({});

  const handleOpenDialog = (driver?: Driver) => {
    setEditMode(!!driver);
    setFormData(driver || {});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({});
  };

  const handleSaveDriver = () => {
    if (editMode && formData.id != null) {
      setDrivers((prev) =>
        prev.map((d) => (d.id === formData.id ? (formData as Driver) : d))
      );
    } else {
      const newDriver: Driver = {
        ...(formData as Driver),
        id: drivers.length ? drivers[drivers.length - 1].id + 1 : 1,
      };
      setDrivers((prev) => [...prev, newDriver]);
    }
    handleCloseDialog();
  };

  const handleDeleteDriver = (id: number) => {
    setDrivers((prev) => prev.filter((d) => d.id !== id));
  };

  const handleGroupDelete = () => {
    setDrivers((prev) => prev.filter((d) => !selectedIds.includes(d.id)));
    setSelectedIds([]);
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
    { field: "address", headerName: "Address", flex: 1 },
    { field: "warehouse_id", headerName: "Warehouse ID", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 160,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={() => handleOpenDialog(params.row)}
          >
            <Edit fontSize="small" />
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={() => handleDeleteDriver(params.row.id)}
          >
            <Delete fontSize="small" />
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <Box  sx={{p:3, minHeight: 'calc(100vh - 50px)' , backgroundColor: "#59555626", borderRadius: 2 }}>
    <Box  sx={{p:3, backgroundColor: "#fff", borderRadius: 2 }}>
      <Typography variant="h5" mb={2}>
        Manage Drivers
      </Typography>

      <Stack direction="row" spacing={2} mb={2}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Driver
        </Button>
        <Button
          variant="outlined"
          color="error"
          disabled={!selectedIds.length}
          onClick={handleGroupDelete}
          startIcon={<Delete />}
          sx={{ color:"red" }}
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

      <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden" }}>
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
              borderRadius: 0,
              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: "bold",
                color: "white"
              }
            },
            "& .MuiDataGrid-columnSeparator": {
              visibility: "hidden"
            },
            "& .MuiDataGrid-toolbarContainer": {
              padding: 2,
              "& button": {
                marginRight: 2,
                border: "1px solid #1976d2",
                color: "#1976d2",
                "&:hover": {
                  backgroundColor: "#1976d210"
                }
              }
            },
            "& .MuiDataGrid-row": {
              "&:nth-of-type(even)": {
                backgroundColor: "#f5f5f5",
              },
              "&:hover": {
                backgroundColor: "#e3f2fd !important"
              }
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "none",
              "&:focus": {
                outline: "none"
              }
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "none"
            },
            "& .MuiCheckbox-root": {
              color: "#1976d2 !important"
            },
            "& .MuiDataGrid-virtualScroller": {
              backgroundColor: "#ffffff"
            }
          }}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editMode ? "Edit Driver" : "Add Driver"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1} minWidth={350}>
            <TextField
              label="Name"
              fullWidth
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <TextField
              label="Mobile"
              type="number"
              fullWidth
              value={formData.mob || ""}
              onChange={(e) =>
                setFormData({ ...formData, mob: +e.target.value })
              }
            />
            <TextField
              label="Address"
              fullWidth
              value={formData.address || ""}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
            <TextField
              label="Warehouse ID"
              type="number"
              fullWidth
              value={formData.warehouse_id || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  warehouse_id: +e.target.value,
                })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveDriver} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Box>
  );
};

export default ManageDrivers;