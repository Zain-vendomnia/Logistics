import React from "react";
import {
  Stack,
  TextField,
  InputAdornment,
  Paper,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  GridToolbar,
  GridColDef,
} from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelIcon from "@mui/icons-material/Cancel";

interface Tour {
  id: number;
  tour_name: string;
  driver_id: number;
  tour_date: string;
  warehouse_id: number;
  start_time: string;
  end_time: string;
  item_total_qty_truck: number;
  tour_status: string;
  route_color: string;
  created_at: string;
}

interface Props {
  tours: Tour[];
  search: string;
  setSearch: (val: string) => void;
  page: number;
  setPage: (val: number) => void;
  pageSize: number;
  setPageSize: (val: number) => void;
  rowCount: number;
}

const TourTable: React.FC<Props> = ({
  tours,
  search,
  setSearch,
  page,
  setPage,
  pageSize,
  setPageSize,
  rowCount,
}) => {
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "tour_name", headerName: "Tour Name", flex: 1 },
    { field: "driver_id", headerName: "Driver ID", flex: 1 },
    {
      field: "tour_date",
      headerName: "Date",
      flex: 1,
      valueGetter: ({ value }) =>
        new Date(value).toLocaleDateString("en-GB"),
    },
    { field: "warehouse_id", headerName: "Warehouse", flex: 1 },
    { field: "start_time", headerName: "Start", flex: 1 },
    { field: "end_time", headerName: "End", flex: 1 },
    {
      field: "item_total_qty_truck",
      headerName: "Qty",
      flex: 1,
      type: "number",
    },
    {
      field: "tour_status",
      headerName: "Status",
      width:100,
      headerAlign: "center", 
      flex: 1,
      renderCell: ({ value }) => (
        <Stack direction="row" sx={{ height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
          {value === "completed" ? (
            <>
              <CheckCircleOutlineIcon color="success" />
              <Typography variant="body2" color="success.main">
                Completed
              </Typography>
            </>
          ) : (
            <>
              <CancelIcon color="error" />
              <Typography variant="body2" color="error.main">
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </Typography>
            </>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Paper elevation={3} sx={{ borderRadius: 2, p: 2 }}>
      <TextField
        fullWidth
        size="small"
        variant="outlined"
        placeholder="Search by Tour Name or ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, maxWidth: 400 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      <DataGrid
        autoHeight
        rows={tours}
        columns={columns}
        getRowId={(row) => row.id}
        rowCount={rowCount}
        paginationMode="server"
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={({ page, pageSize }) => {
          setPage(page);
          setPageSize(pageSize);
        }}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        slots={{ toolbar: GridToolbar }}
        disableRowSelectionOnClick
        sx={{
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#1976d2",
            color: "#fff",
            fontWeight: "bold",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "#f1faff",
          },
        }}
      />
    </Paper>
  );
};

export default TourTable;
