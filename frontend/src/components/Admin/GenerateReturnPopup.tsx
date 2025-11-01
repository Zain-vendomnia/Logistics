import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  Box,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Alert,
  Typography,
  Snackbar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import adminApiService from '../../services/adminApiService';

interface OrderItem {
  id: number;
  order_id?: number;
  order_number: string;
  slmdl_article_id: string;
  slmdl_articleordernumber: string;
  quantity: number;
  warehouse_id?: string;
  [key: string]: any;
}

interface SelectedItem {
  id: number;
  slmdl_articleordernumber: string;
  originalQuantity: number;
  returnQuantity: number;
}

interface GenerateReturnPopupProps {
  open: boolean;
  onClose: () => void;
}

const GenerateReturnPopup: React.FC<GenerateReturnPopupProps> = ({ open, onClose }) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ [key: number]: SelectedItem }>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleSearch = async () => {
    if (!invoiceNumber.trim()) {
      setErrorMessage('Please enter an invoice number');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      setOrderItems([]);
      setSelectedItems({});

      const response = await adminApiService.orderDetails(Number(invoiceNumber));
      console.log('Order Details Response:', response);

      if (response.data.status === 'success') {
        const items = response.data.data.orderItems || [];
        
        if (items.length === 0) {
          setErrorMessage('No items found for this order number');
        } else {
          setOrderItems(items);
          setSuccessMessage(`Found ${items.length} item(s) for order ${invoiceNumber}`);
        }
      } else if (response.data.status === 'warning') {
        setErrorMessage(response.data.message);
      } else {
        setErrorMessage(response.data.message || 'Failed to fetch order details');
      }
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to fetch order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setInvoiceNumber(value);
    if (errorMessage || successMessage) {
      setErrorMessage('');
      setSuccessMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
      e.preventDefault();
    }
    
    if (e.key === 'Enter' && invoiceNumber.trim()) {
      handleSearch();
    }
  };

  const handleCheckboxChange = (item: OrderItem, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => ({
        ...prev,
        [item.id]: {
          id: item.id,
          slmdl_articleordernumber: item.slmdl_articleordernumber,
          originalQuantity: item.quantity,
          returnQuantity: 0,
        },
      }));
    } else {
      setSelectedItems((prev) => {
        const newItems = { ...prev };
        delete newItems[item.id];
        return newItems;
      });
    }
  };

  const handleQuantityChange = (itemId: number, value: string) => {
    const numValue = parseInt(value) || 0;
    
    setSelectedItems((prev) => {
      const item = prev[itemId];
      if (!item) return prev;

      if (numValue > item.originalQuantity) {
        return prev;
      }

      return {
        ...prev,
        [itemId]: {
          ...item,
          returnQuantity: numValue,
        },
      };
    });
  };

  const handleCreate = async () => {
    const selectedItemsList = Object.values(selectedItems);

    if (selectedItemsList.length === 0) {
      setErrorMessage('Please select at least one item');
      return;
    }

    const hasValidQuantity = selectedItemsList.some(
      (item) => item.returnQuantity > 0
    );

    if (!hasValidQuantity) {
      setErrorMessage('Please enter return quantity for selected items');
      return;
    }

    // Prepare complete data with all required fields
    const returnData = {
      orderNumber: invoiceNumber,
      items: selectedItemsList.map((item) => {
        // Find the full item details from orderItems
        const fullItem = orderItems.find((orderItem) => orderItem.id === item.id);
        
        return {
          id: item.id,
          order_id: fullItem?.order_id || null,
          order_number: fullItem?.order_number || invoiceNumber,
          slmdl_articleordernumber: item.slmdl_articleordernumber,
          quantity: item.originalQuantity,
          returnQuantity: item.returnQuantity,
          warehouse_id: fullItem?.warehouse_id || null,
        };
      }),
    };

    console.log('Creating return with data:', returnData);
    
    try {
      setLoading(true);
      
      // Call API to create return
      const response = await adminApiService.sendReturnDetails(returnData);
      
      console.log('Return created successfully:', response);
      
      if (response.data.status === 'success') {
        showSnackbar('Return created successfully!', 'success');
        
        // Clear all data but keep popup open
        setInvoiceNumber('');
        setOrderItems([]);
        setSelectedItems({});
        setErrorMessage('');
        setSuccessMessage('');
      } else {
        setErrorMessage(response.data.message || 'Failed to create return');
        showSnackbar(response.data.message || 'Failed to create return', 'error');
      }
    } catch (error: any) {
      console.error('Error creating return:', error);
      const errorMsg = error.response?.data?.message || 'Failed to create return. Please try again.';
      setErrorMessage(errorMsg);
      showSnackbar(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setInvoiceNumber('');
    setOrderItems([]);
    setSelectedItems({});
    setErrorMessage('');
    setSuccessMessage('');
    onClose();
  };

  const isItemSelected = (itemId: number) => !!selectedItems[itemId];

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            minHeight: '375px',
          },
        }}
      >
        {/* Close Button */}
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: '#9e9e9e',
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Title */}
        <DialogTitle sx={{ pb: 1, pt: 3, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={600}>
            Create Return
          </Typography>
        </DialogTitle>

        {/* Content */}
        <DialogContent>
          {/* Search Section */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, mt: 3 }}>
            <TextField
              fullWidth
              placeholder="Enter invoice number"
              value={invoiceNumber}
              onChange={handleInvoiceChange}
              onKeyPress={handleKeyPress}
              disabled={loading}
              size="small"
              autoFocus
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading || !invoiceNumber.trim()}
              sx={{
                minWidth: '100px',
                bgcolor: '#f7941d',
                '&:hover': { bgcolor: '#f37021' },
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Search'}
            </Button>
          </Box>

          {/* Messages */}
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage('')}>
              {errorMessage}
            </Alert>
          )}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
              {successMessage}
            </Alert>
          )}

          {/* Table */}
          {orderItems.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox"></TableCell>
                      <TableCell>Article Order Number</TableCell>
                      <TableCell align="center">Qty</TableCell>
                      <TableCell align="center">Return</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderItems.map((item) => {
                      const selectedItem = selectedItems[item.id];
                      const isSelected = isItemSelected(item.id);
                      
                      return (
                        <TableRow key={item.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              size="small"
                              checked={isSelected}
                              onChange={(e) => handleCheckboxChange(item, e.target.checked)}
                            />
                          </TableCell>
                          <TableCell>{item.slmdl_articleordernumber}</TableCell>
                          <TableCell align="center">
                            <strong>{item.quantity}</strong>
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              size="small"
                              disabled={!isSelected}
                              value={selectedItem?.returnQuantity || ''}
                              onChange={(e) =>
                                handleQuantityChange(item.id, e.target.value)
                              }
                              inputProps={{
                                min: 0,
                                max: item.quantity,
                                style: { textAlign: 'center', width: '60px' },
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '& fieldset': {
                                    borderColor: isSelected ? '#000000' : '#e0e0e0',
                                    borderWidth: isSelected ? '2px' : '1px',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: isSelected ? '#333333' : '#e0e0e0',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#f7941d',
                                    borderWidth: '2px',
                                  },
                                  '&.Mui-disabled': {
                                    backgroundColor: '#f5f5f5',
                                  },
                                },
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Create Button */}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={handleCreate}
                  disabled={Object.keys(selectedItems).length === 0}
                  sx={{
                    bgcolor: '#f7941d',
                    '&:hover': { bgcolor: '#f37021' },
                  }}
                >
                  Create
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox"></TableCell>
                      <TableCell>Article Order Number</TableCell>
                      <TableCell align="center">Qty</TableCell>
                      <TableCell align="center">Return</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No data available
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default GenerateReturnPopup;