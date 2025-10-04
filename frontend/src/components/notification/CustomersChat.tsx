import React, { useState, useEffect,  useCallback, useRef } from 'react';
import { ThemeProvider, CssBaseline, Box, Container, Typography, CircularProgress } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CustomerList from './CustomersList';
import ChatWindow from './ChatWindow';
import theme from '../../theme';
import { getAllCustomers, SearchCustomers } from '../../services/customerService';
import { updateCustomerUnreadCount, socketService } from '../../services/messageService';
import { Customer } from './shared/types';
import { normalizeCustomer } from './shared/utils';

interface ApiResponse<T = any> {
  status: 'success' | 'error' | 'warning';
  message: string;
  data: T;
}

const CustomersChat: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  
  const mountedRef = useRef(true);

  const updateCustomerInList = useCallback((updatedCustomer: Customer, customerList: Customer[]) => {
    const exists = customerList.some(c => c.order_id === updatedCustomer.order_id);
    
    if (exists) {
      return customerList
        .map(customer => 
          customer.order_id === updatedCustomer.order_id 
            ? { ...customer, ...updatedCustomer }
            : customer
        )
        .sort((a, b) => {
          const timeA = new Date(a.timestamp || a.lastActive || 0).getTime();
          const timeB = new Date(b.timestamp || b.lastActive || 0).getTime();
          return timeB - timeA;
        });
    }
    return [updatedCustomer, ...customerList];
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getAllCustomers();
      
      if (mountedRef.current) {
        const normalized = response.map(normalizeCustomer);
        setAllCustomers(normalized);
        setCustomers(normalized);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setCustomers(allCustomers);
      return;
    }

    try {
      setIsSearching(true);
      const response: ApiResponse<Customer[]> = await SearchCustomers(searchQuery);
      
      if (mountedRef.current) {
        const normalizedResults = response.data?.map(normalizeCustomer) || [];
        setCustomers(normalizedResults);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setCustomers(allCustomers);
    } finally {
      if (mountedRef.current) {
        setIsSearching(false);
      }
    }
  }, [searchQuery, allCustomers]);

  const handleCustomerListUpdate = useCallback((data: any) => {
    if (!mountedRef.current || !data.customers) return;
    
    const normalized = data.customers.map(normalizeCustomer);
    setAllCustomers(normalized);
    
    if (!searchQuery.trim()) {
      setCustomers(normalized);
    }
    setIsLoading(false);
  }, [searchQuery]);

  const handleSingleCustomerUpdate = useCallback((data: any) => {
    if (!mountedRef.current) return;
    
    let normalizedCustomer: Customer;
    
    if (data.customer) {
      normalizedCustomer = normalizeCustomer(data.customer);
    } else {
      const existingCustomer = allCustomers.find(c => c.order_id === data.orderId);
      if (!existingCustomer) return;

      normalizedCustomer = {
        ...existingCustomer,
        lastMessage: data.message?.content || `[${data.message?.type || 'message'}]`,
        timestamp: data.lastActive,
        lastActive: data.lastActive,
        unreadCount: (data.message?.direction === 'inbound' && 
                     selectedCustomer?.order_id !== existingCustomer.order_id) 
                     ? data.unreadCount : existingCustomer.unreadCount || 0
      };
    }
    
    setAllCustomers(prev => updateCustomerInList(normalizedCustomer, prev));
    
    if (!searchQuery.trim()) {
      setCustomers(prev => updateCustomerInList(normalizedCustomer, prev));
    }
    
    if (selectedCustomer?.order_id === normalizedCustomer.order_id) {
      setSelectedCustomer(prev => prev ? { ...prev, ...normalizedCustomer } : prev);
    }
  }, [searchQuery, selectedCustomer?.order_id, updateCustomerInList, allCustomers]);

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

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setCustomers(allCustomers);
  }, [allCustomers]);

  useEffect(() => {
    socketService.connect();
    const socket = socketService.getSocket();
    
    socket?.on('customer-list-initial', handleCustomerListUpdate);
    socket?.on('customer-list-update', handleCustomerListUpdate);
    socket?.on('customer-single-update', handleSingleCustomerUpdate);
    
    socket?.emit('join-admin-room');

    return () => {
      socket?.emit('leave-admin-room');
      socket?.off('customer-list-initial', handleCustomerListUpdate);
      socket?.off('customer-list-update', handleCustomerListUpdate);
      socket?.off('customer-single-update', handleSingleCustomerUpdate);
    };
  }, [handleCustomerListUpdate, handleSingleCustomerUpdate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) fetchCustomers();
    }, 2000);

    return () => clearTimeout(timer);
  }, [fetchCustomers, isLoading]);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', height: 'calc(100vh - 60px)', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
        <CustomerList
          customers={customers}
          selectedCustomerId={selectedCustomer?.order_id ?? null}
          onSelectCustomer={handleSelectCustomer}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearch={performSearch}
          onClearSearch={handleClearSearch}
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
                backgroundColor: 'background.default'
              }}
            >
              <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
                <PersonIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  {customers.length === 0
                    ? 'No customers available'
                    : 'Select a customer to start chatting'}
                </Typography>
              </Container>
            </Box>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default CustomersChat;