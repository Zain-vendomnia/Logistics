import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ThemeProvider, CssBaseline, Box, Container, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CustomerList from './CustomersList';
import ChatWindow from './ChatWindow';
import theme from '../../theme';
import { getAllCustomers } from '../../services/customerService';
import { updateCustomerUnreadCount } from '../../services/messageService';
import { 
  Customer, 
  FilterOptions, 
  CustomerStats 
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

  // Fetch customers on mount
  useEffect(() => {
    let mounted = true;

    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        const response = await getAllCustomers();
        
        if (mounted) {
          // Normalize data using shared utility
          const normalized = response.map(normalizeCustomer);
          setCustomers(normalized);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch customers:', err);
        if (mounted) {
          setError('Failed to load customers');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchCustomers();
    return () => { mounted = false; };
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

    // Optimistic update
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