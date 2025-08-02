import React, { useEffect, useState } from "react";
import { DataGrid, GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import latestOrderServices, {
  LogisticOrder,
  OrderStatus,
} from "./AdminServices/latestOrderServices";
import { Box, FormControl, Select, MenuItem } from "@mui/material";

import { formatDate } from "../../utils/formatConverter";

const columns: GridColDef[] = [
  {
    field: "order_number",
    headerName: "Order Number",
    width: 150,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "status",
    headerName: "Status",
    width: 90,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "article_order_numbers",
    headerName: "Article Name",
    width: 180,
    headerAlign: "center",
    align: "center",
  },
  // { field: 'invoice_amount', headerName: 'Amount', width: 120, headerAlign: 'center', align: 'center' },
  {
    field: "total_quantity",
    headerName: "Quantity",
    width: 100,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "order_time",
    headerName: "Order Time",
    width: 180,
    headerAlign: "center",
    align: "center",
    valueFormatter: (value: string) => formatDate(value),
  },
  {
    field: "expected_delivery_time",
    headerName: "Deadline",
    width: 200,
    headerAlign: "center",
    align: "center",
    valueFormatter: (value: string) => formatDate(value),
  },
  {
    field: "warehouse_name",
    headerName: "Warehouse",
    width: 120,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "firstname",
    headerName: "First Name",
    width: 150,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "lastname",
    headerName: "Last Name",
    width: 150,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "zipcode",
    headerName: "Zipcode",
    width: 150,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "email",
    headerName: "Email",
    width: 200,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "street",
    headerName: "Street",
    width: 200,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "city",
    headerName: "City",
    width: 130,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "phone",
    headerName: "Phone",
    width: 150,
    headerAlign: "center",
    align: "center",
  },
];

interface AdminOrderTableProps {
  selectedWarehouses: number[];
  setOrdersData: React.Dispatch<React.SetStateAction<LogisticOrder[]>>;
  setSelectedOrders: React.Dispatch<React.SetStateAction<number[]>>;
}

const AdminOrderTable: React.FC<AdminOrderTableProps> = ({
  selectedWarehouses,
  setOrdersData,
  setSelectedOrders,
}) => {
  const [orders, setOrders] = useState<LogisticOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });

  const [statusFilter, setStatusFilter] = useState<
    "all" | "initial" | "inTransit" | "delivered"
  >("all");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const orderService = latestOrderServices.getInstance();
        const data = await orderService.getOrders();
        console.log("Fetched Orders:", data);
        setOrders(data);
        setOrdersData(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [setOrdersData]);

  // filter by warehouse IDs
  const filteredOrders = orders.filter((order) => {
    const matchesWarehouse =
      selectedWarehouses.length === 0 ||
      selectedWarehouses.includes(order.warehouse_id);

    let matchesStatus = false;

    if (statusFilter === "all") {
      matchesStatus =
        order.status !== "delivered" && order.status !== "canceled";
    } else {
      matchesStatus = order.status === statusFilter;
    }

    return matchesWarehouse && matchesStatus;
  });

  // only emit the array of selected IDs
  const handleRowSelection = (selectionModel: GridRowSelectionModel) => {
    setSelectedOrders(selectionModel as number[]);
  };

  return (
    <Box sx={{ padding: 0 }}>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <FormControl size="small">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            displayEmpty
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="initial">Initial</MenuItem>
            <MenuItem value="inTransit">In Transit</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box
        sx={{
          height: 600,
          width: "100%",
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid #e0e0e0",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#f5f5f5",
            borderBottom: "1px solid #e0e0e0",
            fontWeight: "bold",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "1px solid #e0e0e0",
            backgroundColor: "#f5f5f5",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.04)",
          },
          "& .MuiDataGrid-row.Mui-selected": {
            backgroundColor: "rgba(25, 118, 210, 0.08)",
            "&:hover": {
              backgroundColor: "rgba(25, 118, 210, 0.08)",
            },
          },
        }}
      >
        <DataGrid
          rows={filteredOrders}
          columns={columns}
          getRowId={(row) => row.order_id}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50]}
          checkboxSelection
          onRowSelectionModelChange={handleRowSelection}
          disableRowSelectionOnClick
          isRowSelectable={(params) =>
            !(
              statusFilter === "all" &&
              (params.row.status === OrderStatus.assigned ||
                params.row.status === OrderStatus.inTransit)
            )
          }
        />
      </Box>
    </Box>
  );
};

export default AdminOrderTable;
