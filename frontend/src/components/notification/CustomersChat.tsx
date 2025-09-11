import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ThemeProvider, CssBaseline, Box, Container, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CustomerList from './CustomersList';
import ChatWindow from './ChatWindow';
import theme from '../../theme';
import { getAllCustomers } from '../../services/customerService';
import { updateCustomerUnreadCount, socketService } from '../../services/messageService';
import { 
  Customer, 
  FilterOptions, 
  CustomerStats,
  
} from './shared/types';
import { 
  normalizeCustomer, 
  processCustomers, 
  calculateCustomerStats 
} from './shared/utils';

const CustomersChat: React.FC = () => {
  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    showUnreadOnly: false,
    statusFilter: 'all',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  // Ref to track mounted state
  const mountedRef = useRef(true);

  // Fetch customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        const response = await getAllCustomers();
        
        if (mountedRef.current) {
          const normalized = response.map(normalizeCustomer);
          setCustomers(normalized);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch customers:', err);
        if (mountedRef.current) {
          setError('Failed to load customers');
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };
    
    fetchCustomers();
  }, []);

  // WebSocket setup for global customer list updates - SINGLE EVENT
  useEffect(() => {
    // Connect to socket service
    socketService.connect();

    const handleConnect = () => {
      console.log('Connected to socket service for customer updates');
      setConnected(true);
    };

    const handleDisconnect = () => {
      console.log('Disconnected from socket service');
      setConnected(false);
    };

    // SINGLE EVENT HANDLER: Replace all previous handlers with this one
    const handleCustomerListUpdate = (data: {
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
      console.log('📡 CUSTOMER LIST UPDATE:', data);
      
      setCustomers(prevCustomers => {
        console.log('📋 Previous customers before update:', 
          prevCustomers.map(c => ({
            order_id: c.order_id,
            name: c.name,
            lastMessage: c.lastMessage,
            unreadCount: c.unreadCount
          }))
        );

        const updatedCustomers = prevCustomers.map(customer => {
          if (customer.order_id === data.orderId) {
            console.log('🎯 Updating customer:', {
              name: customer.name,
              oldLastMessage: customer.lastMessage,
              newLastMessage: data.message.content,
              oldUnreadCount: customer.unreadCount,
              newUnreadCount: data.unreadCount,
              messageDirection: data.message.direction,
              selectedCustomerOrderId: selectedCustomer?.order_id
            });

            // Determine display message
            let displayMessage = '';
            if (data.message.content && data.message.content.trim()) {
              displayMessage = data.message.content;
            } else {
              displayMessage = `[${data.message.type || data.message.message_type || 'message'}]`;
            }

            const updatedCustomer = {
              ...customer,
              lastMessage: displayMessage,
              timestamp: data.lastActive,
              lastActive: data.lastActive,
              // Update unread count based on direction and selected customer
              unreadCount: (data.message.direction === 'inbound' && 
                           selectedCustomer?.order_id !== customer.order_id) 
                           ? data.unreadCount
                           : customer.unreadCount || 0
            };

            console.log('✅ Customer updated:', {
              name: updatedCustomer.name,
              lastMessage: updatedCustomer.lastMessage,
              unreadCount: updatedCustomer.unreadCount
            });

            return updatedCustomer;
          }
          return customer;
        }).sort((a, b) => {
          // Sort by timestamp to bring the most recent conversation to top
          const timeA = new Date(a.timestamp || a.lastActive || 0).getTime();
          const timeB = new Date(b.timestamp || b.lastActive || 0).getTime();
          return timeB - timeA;
        });

        console.log('🏁 Final customer list after update:', 
          updatedCustomers.map(c => ({
            order_id: c.order_id,
            name: c.name,
            lastMessage: c.lastMessage,
            unreadCount: c.unreadCount
          }))
        );

        return updatedCustomers;
      });
    };

    // Handle customer status updates (online/offline)
    const handleCustomerStatusUpdate = (data: { orderId: number; status: 'online' | 'away' | 'busy' | 'offline' }) => {
      console.log('👤 CUSTOMER STATUS UPDATE:', data);
      
      setCustomers(prevCustomers => {
        return prevCustomers.map(customer => {
          if (customer.order_id === data.orderId) {
            return {
              ...customer,
              status: data.status
            };
          }
          return customer;
        });
      });
    };

    // Set up event listeners - SIMPLIFIED TO SINGLE EVENT
    socketService.onConnect(handleConnect);
    socketService.onDisconnect(handleDisconnect);
    
    // Listen for the single customer list update event
    socketService.getSocket()?.on('customer-list-update', handleCustomerListUpdate);
    socketService.getSocket()?.on('customer-status-update', handleCustomerStatusUpdate);

    // Check initial connection status
    if (socketService.isConnected()) {
      setConnected(true);
    }

    // Cleanup - SIMPLIFIED
    return () => {
      socketService.offConnect(handleConnect);
      socketService.offDisconnect(handleDisconnect);
      socketService.getSocket()?.off('customer-list-update', handleCustomerListUpdate);
      socketService.getSocket()?.off('customer-status-update', handleCustomerStatusUpdate);
    };
  }, [selectedCustomer?.order_id]); // Re-run when selected customer changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Processed customers using shared utility
  const processedCustomers = useMemo(() => {
    return processCustomers(customers, searchQuery, filters);
  }, [customers, searchQuery, filters]);

  // Calculate stats using shared utility
  const stats: CustomerStats = useMemo(() => {
    return calculateCustomerStats(customers, processedCustomers);
  }, [customers, processedCustomers]);

  // Handlers
  const handleSelectCustomer = useCallback(async (id: number) => {
    const customer = customers.find(c => c.order_id === id);
    if (!customer) return;

    // Optimistic update - clear unread count immediately
    const updated = { ...customer, unreadCount: 0 };
    setSelectedCustomer(updated);
    setCustomers(prev => prev.map(c => c.order_id === id ? updated : c));

    try {
      await updateCustomerUnreadCount(id, 0);
    } catch (err) {
      console.error('Failed to update unread count:', err);
      // Optionally revert on error
    }
  }, [customers]);

  const handleFilterChange = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleClearAll = useCallback(() => {
    setFilters({ showUnreadOnly: false, statusFilter: 'all' });
    setSearchQuery('');
  }, []);

  // Check if selected customer is still in filtered list
  useEffect(() => {
    if (selectedCustomer && !processedCustomers.find(c => c.order_id === selectedCustomer.order_id)) {
      setSelectedCustomer(null);
    }
  }, [processedCustomers, selectedCustomer]);

  // Loading state
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

  // Error state
  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', height: 'calc(100vh - 60px)', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  // Check if filters are active
  const hasActiveFilters = filters.showUnreadOnly || filters.statusFilter !== 'all' || searchQuery;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
        <CustomerList
          customers={processedCustomers}
          selectedCustomerId={selectedCustomer?.order_id ?? null}
          onSelectCustomer={handleSelectCustomer}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearAll}
          stats={stats}
          connected={connected}
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
                  {hasActiveFilters && processedCustomers.length === 0
                    ? 'No customers match your criteria'
                    : processedCustomers.length > 0
                    ? 'Select a customer to start chatting'
                    : 'No customers available'}
                </Typography>
                {hasActiveFilters && (
                  <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                    Try adjusting your search or filters
                  </Typography>
                )}
              </Container>
            </Box>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default CustomersChat;