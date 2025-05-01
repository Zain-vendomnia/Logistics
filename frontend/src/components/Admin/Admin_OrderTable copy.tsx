import React, { useEffect, useState } from 'react';
import { DataGrid, GridColDef, GridRowId, GridRowSelectionModel } from '@mui/x-data-grid';
import latestOrderServices, { LogisticOrder } from './AdminServices/latestOrderServices';

const columns: GridColDef[] = [
  { field: 'order_number', headerName: 'Order Number', width: 150 },
  { field: 'article_order_numbers', headerName: 'Article Name', width: 180 },
  { field: 'invoice_amount', headerName: 'Amount', width: 120 },
  { field: 'total_quantity', headerName: 'Quantity', width: 100 },
  { field: 'order_time', headerName: 'Order Time', width: 180 },
  { field: 'expected_delivery_time', headerName: 'Expected Delivery Time', width: 180 },
  { field: 'warehouse_id', headerName: 'Warehouse', width: 180 },
  { field: 'firstname', headerName: 'First Name', width: 150 },
  { field: 'lastname', headerName: 'Last Name', width: 150 },
  { field: 'zipcode', headerName: 'Zipcode', width: 150 },
  { field: 'email', headerName: 'Email', width: 200 },
  { field: 'street', headerName: 'Street', width: 200 },
  { field: 'city', headerName: 'City', width: 130 },
  { field: 'phone', headerName: 'Phone', width: 150 },
];

interface AdminOrderTableProps {
  selectedZipcodes: string[];
  setSelectedOrders: React.Dispatch<React.SetStateAction<number[]>>;
  setOrdersData: React.Dispatch<React.SetStateAction<LogisticOrder[]>>;
}

const Admin_OrderTable: React.FC<AdminOrderTableProps> = ({ 
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
    fetchOrders();
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
    <div style={{ height: 600, width: '100%' }}>
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
      />
    </div>
  );
};

export default Admin_OrderTable;
