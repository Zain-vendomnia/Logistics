import React, { useEffect, useState } from 'react';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import latestOrderServices, { LogisticOrder } from './AdminServices/latestOrderServices';
import { Box } from '@mui/material';

const columns: GridColDef[] = [
  { 
    field: 'order_number', 
    headerName: 'Order Number', 
    width: 150,
    headerAlign: 'center',
    align: 'center'
  },
  { 
    field: 'article_order_numbers', 
    headerName: 'Article Name', 
    width: 180,
    headerAlign: 'center',
    align: 'center'
  },
  { 
    field: 'invoice_amount', 
    headerName: 'Amount', 
    width: 120,
    headerAlign: 'center',
    align: 'center'
  },
  { 
    field: 'total_quantity', 
    headerName: 'Quantity', 
    width: 100,
    headerAlign: 'center',
    align: 'center'
  },
  { 
    field: 'order_time', 
    headerName: 'Order Time', 
    width: 180,
    headerAlign: 'center',
    align: 'center'
  },
  { 
    field: 'expected_delivery_time', 
    headerName: 'Expected Delivery Time', 
    width: 180,
    headerAlign: 'center',
    align: 'center'
  },
  { 
    field: 'warehouse_id', 
    headerName: 'Warehouse', 
    width: 180,
    headerAlign: 'center',
    align: 'center'
  },
  { 
    field: 'firstname', 
    headerName: 'First Name', 
    width: 150,
    headerAlign: 'center',
    align: 'center'
  },
  { 
    field: 'lastname', 
    headerName: 'Last Name', 
    width: 150,
    headerAlign: 'center',
    align: 'center'
  },
  { 
    field: 'zipcode', 
    headerName: 'Zipcode', 
    width: 150,
    headerAlign: 'center',
    align: 'center'
  },
  { 
    field: 'email', 
    headerName: 'Email', 
    width: 200,
    headerAlign: 'center',
    align: 'center'
  },
  { 
    field: 'street', 
    headerName: 'Street', 
    width: 200,
    headerAlign: 'center',
    align: 'center'
  },
  { 
    field: 'city', 
    headerName: 'City', 
    width: 130,
    headerAlign: 'center',
    align: 'center'
  },
  { 
    field: 'phone', 
    headerName: 'Phone', 
    width: 150,
    headerAlign: 'center',
    align: 'center'
  },
];

interface AdminOrderTableProps {
  selectedZipcodes: string[];
  setSelectedOrders: React.Dispatch<React.SetStateAction<number[]>>;
  setOrdersData: React.Dispatch<React.SetStateAction<LogisticOrder[]>>;
}

const AdminOrderTable: React.FC<AdminOrderTableProps> = ({ 
  selectedZipcodes, 
  setSelectedOrders,
  setOrdersData
}) => {
  const [orders, setOrders] = useState<LogisticOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const order = latestOrderServices.getInstance();
        const data = await order.getOrders();
        setOrders(data);
        setOrdersData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setLoading(false);
      }
    };

    fetchOrders(); // Initial fetch immediately on mount

    const intervalId = setInterval(() => {
      fetchOrders();
    }, 3000); // Poll every 3000ms (3 seconds)

    // Cleanup interval on unmount or dependencies change
    return () => clearInterval(intervalId);
  }, [setOrdersData]);

  const filteredOrders = selectedZipcodes.length === 0
    ? orders
    : orders.filter(order => selectedZipcodes.includes(order.zipcode));

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const handleCheckboxSelection = (selectionModel: GridRowSelectionModel) => {
    setSelectedOrders(selectionModel as number[]);
  };

  return (
    <Box sx={{ 
      padding: '24px', 
      borderRadius: '8px'
    }}>
      <Box sx={{ 
        height: 600, 
        width: '100%', 
        borderRadius: '8px',
        '& .MuiDataGrid-root': {
          border: 'none'
        },
        '& .MuiDataGrid-cell': {
          borderBottom: '1px solid #e0e0e0'
        },
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #e0e0e0'
        },
        '& .MuiDataGrid-footerContainer': {
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#f5f5f5'
        }
      }}>
        <DataGrid
          rows={filteredOrders}
          columns={columns}
          getRowId={(row) => row.order_id}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={(newModel) => setPaginationModel(newModel)}
          pageSizeOptions={[10, 20, 50]}
          checkboxSelection
          onRowSelectionModelChange={handleCheckboxSelection}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            },
            '& .MuiDataGrid-row.Mui-selected': {
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)'
              }
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default AdminOrderTable;