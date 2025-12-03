import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ThemeProvider, CssBaseline, Box, Container, Typography, CircularProgress } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CustomerList from './CustomersList';
import ChatWindow from './ChatWindow';
import theme from '../../theme';
import { getAllCustomers } from '../../services/customerService';
import { 
  joinAdminRoom, 
  // leaveAdminRoom, // ❌ REMOVED - Don't leave admin room, NavBar needs it
  getUnreadCount,
  onCustomerUpdated,
  onCustomerReorder,
  onCustomerReadUpdated,
  onUnreadCount,
  onCustomerTimestampSync,
  onCustomerViewerUpdate,
  onCustomerViewerLeft,
  onAdminStatusChanged,
  offEvent
} from '../../socket/communicationSocket';
import { Customer } from './shared/types';

// ==========================================
// DATA MAPPING FUNCTIONS
// ==========================================

/**
 * Maps backend customer data to frontend Customer interface
 */
const mapToCustomer = (data: any): Customer => {
  return {
    order_id: data.order_id || data.orderId || data.id,
    order_number: data.order_number || data.orderNumber,
    name: data.name || data.customerName || data.customer_name || 'Unknown Customer',
    phone: data.phone || data.customerPhone || data.customer_phone || '',
    email: data.email || data.customerEmail || data.customer_email || '',
    status: data.status,
    last_message: data.last_message || data.lastMessage?.content || '',
    last_message_time: data.last_message_time || data.last_message_at || data.lastMessageTime || data.lastActive || data.last_active,
    last_message_at: data.last_message_at || data.lastMessageTime || data.lastActive,
    last_channel: data.last_channel || data.last_communication_channel || data.lastChannel || data.lastMessage?.communication_channel || 'whatsapp',
    last_communication_channel: data.last_communication_channel || data.last_channel || data.lastChannel || data.lastMessage?.communication_channel || 'none',
    unread_count: data.unread_count ?? data.unreadCount ?? 0,
    has_unread: data.has_unread ?? data.hasUnread ?? ((data.unread_count ?? data.unreadCount ?? 0) > 0),
  };
};

/**
 * Maps an array of backend customers to frontend Customer array
 */
const mapToCustomers = (dataArray: any[]): Customer[] => {
  if (!Array.isArray(dataArray)) {
    console.error('❌ Invalid customers data - not an array:', dataArray);
    return [];
  }
  
  return dataArray.map(mapToCustomer).filter(customer => {
    if (!customer.order_id) {
      console.warn('⚠️ Customer missing order_id:', customer);
      return false;
    }
    return true;
  });
};

const CustomersChat: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [adminViewingMap, setAdminViewingMap] = useState<Map<number, string>>(new Map());
  const [totalAdminsOnline, setTotalAdminsOnline] = useState(0);
  const mountedRef = useRef(true);

  // Fetch customers via REST API
  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getAllCustomers();
      
      console.log('📦 API Response:', response);
      
      if (mountedRef.current && response.status === 'success') {
        const mappedCustomers = mapToCustomers(response.data);
        console.log('✅ Mapped customers:', mappedCustomers);
        setCustomers(mappedCustomers);
      }
    } catch (err) {
      console.error('❌ Failed to fetch customers:', err);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Handle single customer update (legacy)
  const handleCustomerUpdate = useCallback((data: any) => {
    if (!mountedRef.current) return;
    
    console.log('👤 Customer update:', data);
    
    setCustomers(prev => {
      const orderId = data.orderId || data.order_id || data.id;
      
      if (!orderId) {
        console.error('❌ Customer update missing orderId:', data);
        return prev;
      }
      
      const existingIndex = prev.findIndex(c => c.order_id === orderId);
      
      if (existingIndex !== -1) {
        const updated = [...prev];
        const existingCustomer = updated[existingIndex];
        
        updated[existingIndex] = {
          ...existingCustomer,
          name: data.customerName || data.name || existingCustomer.name,
          phone: data.customerPhone || data.phone || existingCustomer.phone,
          last_message: data.lastMessage?.content || data.last_message || existingCustomer.last_message,
          last_message_time: data.lastActive || data.last_message_at || data.last_message_time || existingCustomer.last_message_time,
          last_message_at: data.last_message_at || data.lastActive || existingCustomer.last_message_at,
          // ✅ FIXED: Handle both camelCase and snake_case
          unread_count: data.unreadCount ?? data.unread_count ?? existingCustomer.unread_count,
          has_unread: (data.unreadCount ?? data.unread_count ?? 0) > 0,
          last_channel: data.lastMessage?.communication_channel || data.last_channel || data.last_communication_channel || existingCustomer.last_channel,
          last_communication_channel: data.last_communication_channel || data.lastMessage?.communication_channel || existingCustomer.last_communication_channel,
        };
        
        return updated;
      } else {
        const newCustomer = mapToCustomer(data);
        console.log('➕ Adding new customer:', newCustomer);
        return [newCustomer, ...prev];
      }
    });
  }, []);

  /**
   * Handle customer reorder event
   * Triggered when a message is sent or received - moves customer to top
   */
  const handleCustomerReorder = useCallback((data: any) => {
    if (!mountedRef.current) return;
    
    const orderId = data.orderId || data.order_id;
    console.log('🔄 Customer reorder event:', orderId, data);
    
    setCustomers(prev => {
      const existingIndex = prev.findIndex(c => c.order_id === orderId);
      
      if (existingIndex !== -1) {
        // Customer exists - update and move to top
        const updated = [...prev];
        const existingCustomer = updated[existingIndex];
        
        const updatedCustomer: Customer = {
          ...existingCustomer,
          name: data.customerName || existingCustomer.name,
          phone: data.customerPhone || existingCustomer.phone,
          email: data.customerEmail || existingCustomer.email,
          last_message: data.lastMessage?.content || existingCustomer.last_message,
          last_message_time: data.lastMessageTime || data.lastActive || existingCustomer.last_message_time,
          last_message_at: data.lastMessageTime || data.lastActive || existingCustomer.last_message_at,
          // ✅ FIXED: Handle both camelCase and snake_case
          unread_count: data.unreadCount ?? data.unread_count ?? existingCustomer.unread_count,
          has_unread: data.hasUnread !== undefined 
            ? data.hasUnread 
            : (data.has_unread !== undefined ? data.has_unread : ((data.unreadCount ?? data.unread_count ?? 0) > 0) || existingCustomer.has_unread),
          last_channel: data.lastChannel || data.lastMessage?.communication_channel || existingCustomer.last_channel,
          last_communication_channel: data.lastChannel || data.lastMessage?.communication_channel || existingCustomer.last_communication_channel,
        };
        
        // Remove from current position
        updated.splice(existingIndex, 1);
        
        // Add to top of list
        updated.unshift(updatedCustomer);
        
        console.log(`✅ Customer ${orderId} moved to top | Unread: ${updatedCustomer.unread_count}`);
        
        return updated;
      } else {
        // New customer - add to top
        const newCustomer = mapToCustomer({
          order_id: orderId,
          order_number: data.orderNumber,
          name: data.customerName,
          phone: data.customerPhone,
          email: data.customerEmail,
          status: data.status,
          last_message: data.lastMessage?.content,
          last_message_time: data.lastMessageTime || data.lastActive,
          last_message_at: data.lastMessageTime || data.lastActive,
          last_channel: data.lastChannel || data.lastMessage?.communication_channel,
          last_communication_channel: data.lastChannel || data.lastMessage?.communication_channel,
          unread_count: data.unreadCount ?? data.unread_count ?? 0,
          has_unread: data.hasUnread ?? data.has_unread ?? false,
        });
        
        console.log('➕ New customer added to top:', newCustomer);
        
        return [newCustomer, ...prev];
      }
    });
  }, []);

  /**
   * Handle customer read status update
   * ✅ FIXED: Handle both camelCase and snake_case field names
   */
  const handleCustomerReadUpdated = useCallback((data: any) => {
    if (!mountedRef.current) return;
    
    const orderId = data.orderId || data.order_id;
    console.log('✅ Customer read updated:', orderId, data);
    
    setCustomers(prev => {
      const existingIndex = prev.findIndex(c => c.order_id === orderId);
      
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          unread_count: data.unreadCount ?? data.unread_count ?? 0,
          has_unread: data.hasUnread ?? data.has_unread ?? false,
        };
        
        console.log(`✅ Customer ${orderId} read status updated | Unread: ${updated[existingIndex].unread_count}`);
        return updated;
      }
      
      return prev;
    });
  }, []);

  // Handle unread count
  const handleUnreadCountUpdate = useCallback((data: any) => {
    if (!mountedRef.current) return;
    console.log('📊 Unread count:', data.totalUnreadCount);
    setTotalUnreadCount(data.totalUnreadCount || 0);
  }, []);

  /**
   * PHASE 1: Handle periodic timestamp updates from server (every 60s)
   * Data: { updates: [{ order_id, last_message_at, unread_count }], timestamp, updateCount }
   */
  const handleTimestampSync = useCallback((data: any) => {
    if (!mountedRef.current || !data.updates) return;
    
    console.log(`🔄 Timestamp sync received | Updates: ${data.updates.length}`);
    
    setCustomers(prev => {
      let updated = false;
      const newCustomers = prev.map(customer => {
        const update = data.updates.find((u: any) => u.order_id === customer.order_id);
        if (update) {
          updated = true;
          return {
            ...customer,
            last_message_time: update.last_message_at,
            last_message_at: update.last_message_at,
            unread_count: update.unread_count ?? update.unreadCount ?? customer.unread_count,
            has_unread: (update.unread_count ?? update.unreadCount ?? 0) > 0,
          };
        }
        return customer;
      });
      
      return updated ? newCustomers : prev;
    });
  }, []);

  /**
   * PHASE 1: Handle admin viewing customer update
   * Data: { orderId, viewedBySocketId, viewedByUserId, timestamp }
   */
  const handleAdminViewing = useCallback((data: any) => {
    if (!mountedRef.current) return;
    
    console.log(`👁️ Admin viewing: ${data.orderId} | User: ${data.viewedByUserId}`);
    
    setAdminViewingMap(prev => {
      const newMap = new Map(prev);
      newMap.set(data.orderId, data.viewedByUserId);
      return newMap;
    });
  }, []);

  /**
   * PHASE 1: Handle admin left customer
   * Data: { orderId, leftByUserId, timestamp }
   */
  const handleAdminLeft = useCallback((data: any) => {
    if (!mountedRef.current) return;
    
    console.log(`👋 Admin left: ${data.orderId}`);
    
    setAdminViewingMap(prev => {
      const newMap = new Map(prev);
      newMap.delete(data.orderId);
      return newMap;
    });
  }, []);

  /**
   * PHASE 1: Handle admin room status change
   * Data: { event: 'join'|'leave', totalAdminsOnline }
   */
  const handleAdminStatusChanged = useCallback((data: any) => {
    if (!mountedRef.current) return;
    
    console.log(`👥 Admin status: ${data.event} | Total online: ${data.totalAdminsOnline}`);
    setTotalAdminsOnline(data.totalAdminsOnline || 0);
  }, []);

  // Select customer
  const handleSelectCustomer = useCallback((id: number) => {
    const customer = customers.find(c => c.order_id === id);
    if (customer) {
      console.log(`👤 Selected: ${customer.name} (ID: ${id})`);
      setSelectedCustomer(customer);
    } else {
      console.warn(`⚠️ Customer not found with ID: ${id}`);
    }
  }, [customers]);

  // Initial load
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Socket setup
  useEffect(() => {
    console.log('📡 Setting up socket...');
    
    setTimeout(() => {
      joinAdminRoom();
      getUnreadCount();
    }, 500);

    // Register socket event handlers - Legacy
    onCustomerUpdated(handleCustomerUpdate);
    onCustomerReorder(handleCustomerReorder);
    onCustomerReadUpdated(handleCustomerReadUpdated);
    onUnreadCount(handleUnreadCountUpdate);

    // Register PHASE 1 socket event handlers
    onCustomerTimestampSync(handleTimestampSync);
    onCustomerViewerUpdate(handleAdminViewing);
    onCustomerViewerLeft(handleAdminLeft);
    onAdminStatusChanged(handleAdminStatusChanged);

    // ✅ FIXED: Only remove chat-specific listeners, DON'T leave admin room
    // The NavBar's useUnreadCount hook needs to stay in the admin room
    return () => {
      console.log('🧹 Cleanup chat-specific socket listeners...');
      offEvent('customer:updated');
      offEvent('customer:reorder');
      offEvent('customer:read-updated');
      offEvent('customer:timestamp-sync');
      offEvent('customer:viewer-update');
      offEvent('customer:viewer-left');
      offEvent('admin:status-changed');
      // ❌ REMOVED: offEvent('unread:count'); - NavBar needs this
      // ❌ REMOVED: leaveAdminRoom(); - NavBar needs to stay in admin room
    };
  }, [handleCustomerUpdate, handleCustomerReorder, handleCustomerReadUpdated, handleUnreadCountUpdate, handleTimestampSync, handleAdminViewing, handleAdminLeft, handleAdminStatusChanged]);

  useEffect(() => {
    return () => { 
      mountedRef.current = false; 
    };
  }, []);

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ 
          display: 'flex', 
          height: 'calc(100vh - 60px)', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
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
          totalUnreadCount={totalUnreadCount}
          adminViewingMap={adminViewingMap}
          totalAdminsOnline={totalAdminsOnline}
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