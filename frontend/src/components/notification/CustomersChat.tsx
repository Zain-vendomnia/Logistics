import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ThemeProvider, CssBaseline, Box, Container, Typography, Snackbar, Alert } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CustomerList from './CustomersList';
import ChatWindow from './ChatWindow';
import theme from '../../theme';
import { getAllCustomers, SearchCustomers } from '../../services/customerService';
import { updateCustomerUnreadCount, socketService } from '../../services/messageService';
import { 
  Customer, 
  CustomerStats,
} from './shared/types';
import { 
  normalizeCustomer, 
  calculateCustomerStats 
} from './shared/utils';

// ==========================================
// CONSTANTS
// ==========================================

const SIDEBAR_WIDTH = 360;

// ==========================================
// INTERFACES
// ==========================================

interface ApiResponse<T = any> {
  status: 'success' | 'error' | 'warning';
  message: string;
  data: T;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

// ==========================================
// MAIN COMPONENT
// ==========================================

const CustomersChat: React.FC = () => {
  // Core state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Loading and connection state
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Refs
  const mountedRef = useRef(true);

  // ==========================================
  // COMPUTED VALUES
  // ==========================================

  // Calculate stats
  const stats: CustomerStats = useMemo(() => {
    return calculateCustomerStats(allCustomers, customers);
  }, [allCustomers, customers]);

  // ==========================================
  // API FUNCTIONS
  // ==========================================

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getAllCustomers();
      
      if (mountedRef.current) {
        const normalized = response.map(normalizeCustomer);
        setAllCustomers(normalized);
        setCustomers(normalized);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      if (mountedRef.current) {
        setError('Failed to load customers');
        setSnackbar({
          open: true,
          message: 'Failed to load customers. Please refresh the page.',
          severity: 'error'
        });
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const performSearch = useCallback(async () => {
    // Validate query length
    if (searchQuery.trim() && searchQuery.trim().length < 2) {
      setSnackbar({
        open: true,
        message: 'Search term must be at least 2 characters long.',
        severity: 'warning'
      });
      return;
    }

    // Empty query - show all customers
    if (!searchQuery.trim()) {
      setCustomers(allCustomers);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      
      const response: ApiResponse<Customer[]> = await SearchCustomers(searchQuery);
      
      if (mountedRef.current) {
        switch (response.status) {
          case 'success':
            const normalizedResults = response.data.map(normalizeCustomer);
            setCustomers(normalizedResults);
            setSnackbar({
              open: true,
              message: `Found ${normalizedResults.length} customer(s) matching "${searchQuery}"`,
              severity: 'success'
            });
            break;

          case 'warning':
            const warningResults = response.data ? response.data.map(normalizeCustomer) : [];
            setCustomers(warningResults);
            setSnackbar({
              open: true,
              message: response.message || 'No customers found',
              severity: 'warning'
            });
            break;

          case 'error':
          default:
            console.error('Search API error:', response.message);
            setSnackbar({
              open: true,
              message: response.message || 'Search failed. Please try again.',
              severity: 'error'
            });
            setCustomers(allCustomers);
            break;
        }
      }
    } catch (err) {
      console.error('Search request failed:', err);
      if (mountedRef.current) {
        setSnackbar({
          open: true,
          message: 'Network error occurred. Please check your connection.',
          severity: 'error'
        });
        setCustomers(allCustomers);
      }
    } finally {
      if (mountedRef.current) {
        setIsSearching(false);
      }
    }
  }, [searchQuery, allCustomers]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setCustomers(allCustomers);
  }, [allCustomers]);

  // ==========================================
  // SOCKET HANDLERS
  // ==========================================

  const handleCustomerListUpdate = useCallback((data: {
    orderId: number;
    customerName: string;
    customerPhone?: string;
    message: {
      id: string;
      content: string;
      timestamp: string;
      direction: 'inbound' | 'outbound';
      type: string;
      message_type: string;
      fileName?: string;
      fileUrl?: string;
      fileType?: string;
    };
    unreadCount: number;
    lastActive: string;
  }) => {
    const updateCustomerList = (prevCustomers: Customer[]) => {
      return prevCustomers.map(customer => {
        if (customer.order_id === data.orderId) {
          let displayMessage = '';
          if (data.message.content && data.message.content.trim()) {
            displayMessage = data.message.content;
          } else {
            displayMessage = `[${data.message.type || data.message.message_type || 'message'}]`;
          }

          return {
            ...customer,
            lastMessage: displayMessage,
            timestamp: data.lastActive,
            lastActive: data.lastActive,
            unreadCount: (data.message.direction === 'inbound' && 
                         selectedCustomer?.order_id !== customer.order_id) 
                         ? data.unreadCount
                         : customer.unreadCount || 0
          };
        }
        return customer;
      }).sort((a, b) => {
        const timeA = new Date(a.timestamp || a.lastActive || 0).getTime();
        const timeB = new Date(b.timestamp || b.lastActive || 0).getTime();
        return timeB - timeA;
      });
    };

    setAllCustomers(updateCustomerList);
    setCustomers(updateCustomerList);
  }, [selectedCustomer?.order_id]);

  const handleCustomerStatusUpdate = useCallback((data: { 
    orderId: number; 
    status: 'online' | 'away' | 'busy' | 'offline' 
  }) => {
    const updateStatus = (prevCustomers: Customer[]) => {
      return prevCustomers.map(customer => {
        if (customer.order_id === data.orderId) {
          return { ...customer, status: data.status };
        }
        return customer;
      });
    };

    setAllCustomers(updateStatus);
    setCustomers(updateStatus);
  }, []);

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  const handleSelectCustomer = useCallback(async (id: number) => {
    const customer = customers.find(c => c.order_id === id);
    if (!customer) return;

    const updated = { ...customer, unreadCount: 0 };
    setSelectedCustomer(updated);
    
    const updateUnreadCount = (customers: Customer[]) => 
      customers.map(c => c.order_id === id ? updated : c);
    
    setCustomers(updateUnreadCount);
    setAllCustomers(updateUnreadCount);

    try {
      await updateCustomerUnreadCount(id, 0);
    } catch (err) {
      console.error('Failed to update unread count:', err);
    }
  }, [customers]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSnackbarClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // ==========================================
  // EFFECTS
  // ==========================================

  // Initial data fetch
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Socket setup and cleanup
  useEffect(() => {
    socketService.connect();

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socketService.onConnect(handleConnect);
    socketService.onDisconnect(handleDisconnect);
    socketService.getSocket()?.on('customer-list-update', handleCustomerListUpdate);
    socketService.getSocket()?.on('customer-status-update', handleCustomerStatusUpdate);

    if (socketService.isConnected()) {
      setConnected(true);
    }

    return () => {
      socketService.offConnect(handleConnect);
      socketService.offDisconnect(handleDisconnect);
      socketService.getSocket()?.off('customer-list-update', handleCustomerListUpdate);
      socketService.getSocket()?.off('customer-status-update', handleCustomerStatusUpdate);
    };
  }, [handleCustomerListUpdate, handleCustomerStatusUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ==========================================
  // RENDER CONDITIONS
  // ==========================================

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', height: 'calc(100vh - 60px)', alignItems: 'center', justifyContent: 'center' }}>
          <Typography>Loading customers...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  if (error && !isLoading && customers.length === 0) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', height: 'calc(100vh - 60px)', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  // ==========================================
  // MAIN RENDER
  // ==========================================

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
        <CustomerList
          customers={customers}
          selectedCustomerId={selectedCustomer?.order_id ?? null}
          onSelectCustomer={handleSelectCustomer}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onSearch={performSearch}
          onClearSearch={handleClearSearch}
          stats={stats}
          connected={connected}
          isSearching={isSearching}
        />
        
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedCustomer ? (
            <ChatWindow
              customer={selectedCustomer}
              orderId={selectedCustomer.order_id}
            />
          ) : (
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'background.default',
              }}
            >
              <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
                <PersonIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  {customers.length === 0
                    ? 'No customers available'
                    : searchQuery
                    ? 'Search results - Select a customer to start chatting'
                    : 'Select a customer to start chatting'}
                </Typography>
              </Container>
            </Box>
          )}
        </Box>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          sx={{ mt: 8, ml: `${SIDEBAR_WIDTH}px` }}
        >
          <Alert 
            onClose={handleSnackbarClose} 
            severity={snackbar.severity}
            variant="filled"
            sx={{ minWidth: 300 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default CustomersChat;