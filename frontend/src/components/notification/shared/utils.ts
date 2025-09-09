// /shared/utils.ts
// Consolidated utility functions - removes all duplication

import React from 'react';
import { 
  Schedule as ScheduleIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { Customer, CustomerStatus, DeliveryStatus } from './types';

// Avatar utilities (duplicated in CustomersList and ChatWindow)
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

export const getAvatarColor = (name: string): string => {
  const colors = [
    '#1976d2', '#388e3c', '#f57c00', '#7b1fa2',
    '#c2185b', '#00796b', '#5d4037', '#455a64'
  ];
  return colors[name.length % colors.length];
};

// Time formatting utility (from CustomersList)
export const formatTime = (timestamp?: string): string => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  if (mins < 10080) return `${Math.floor(mins / 1440)}d`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Status configurations with Material UI icons
export const STATUS_CONFIGS = {
  sending: {
    color: '#ff9800',
    bg: '#fff3e0',
    text: '#e65100',
    label: 'Sending...',
    icon: 'schedule'
  },
  pending: {
    color: '#ff9800',
    bg: '#fff3e0',
    text: '#e65100',
    label: 'Pending...',
    icon: 'schedule'
  },
  sent: {
    color: '#2196f3',
    bg: '#e3f2fd',
    text: '#0d47a1',
    label: 'Sent',
    icon: 'check'
  },
  delivered: {
    color: '#4caf50',
    bg: '#e8f5e8',
    text: '#2e7d32',
    label: 'Delivered',
    icon: 'done_all'
  },
  read: {
    color: '#4caf50',
    bg: '#e8f5e8',
    text: '#2e7d32',
    label: 'Read',
    icon: 'done_all'
  },
  failed: {
    color: '#f44336',
    bg: '#ffebee',
    text: '#c62828',
    label: 'Failed',
    icon: 'error'
  }
} as const;

// Helper component to render status icons properly
export const getStatusIcon = (iconName: string, color: string) => {
  const iconProps = { 
    sx: { 
      fontSize: '14px', 
      color: color 
    } 
  };
  
  switch (iconName) {
    case 'schedule':
      return React.createElement(ScheduleIcon, iconProps);
    case 'check':
      return React.createElement(CheckIcon, iconProps);
    case 'done_all':
      return React.createElement(DoneAllIcon, iconProps);
    case 'error':
      return React.createElement(ErrorIcon, iconProps);
    default:
      return React.createElement(CheckIcon, iconProps);
  }
};

// Status colors for customer online status (from CustomersList)
export const STATUS_COLORS = {
  online: '#4caf50',
  away: '#ff9800',
  busy: '#f44336',
  offline: '#9e9e9e',
} as const;

// Get status configuration helper
export const getStatusConfig = (status: DeliveryStatus) => {
  return STATUS_CONFIGS[status] || STATUS_CONFIGS.pending;
};

// Data normalization utility (from CustomersChat)
export const normalizeCustomer = (customer: any): Customer => ({
  ...customer,
  unreadCount: customer.unreadCount ?? 0,
  status: customer.status || 'offline' as CustomerStatus,
});

// Search highlighting utility (from CustomersList)
export const createSearchRegex = (query: string): RegExp => {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(${escaped})`, 'gi');
};

// Filter customers utility (extracted from CustomersChat)
export const filterCustomers = (
  customers: Customer[],
  searchQuery: string,
  filters: { showUnreadOnly: boolean; statusFilter: CustomerStatus | 'all' }
): Customer[] => {
  const query = searchQuery.trim().toLowerCase();
  
  let filtered = customers;
  
  // Search filter - now includes order_number and order_id
  if (query) {
    filtered = filtered.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.lastMessage?.toLowerCase().includes(query) ||
      c.phone?.toLowerCase().includes(query) ||
      c.order_number?.toLowerCase().includes(query) ||
      c.order_id.toString().includes(query)
    );
  }

  // Unread filter
  if (filters.showUnreadOnly) {
    filtered = filtered.filter(c => (c.unreadCount ?? 0) > 0);
  }

  // Status filter
  if (filters.statusFilter !== 'all') {
    filtered = filtered.filter(c => c.status === filters.statusFilter);
  }

  return filtered;
};

// Sort customers utility (extracted from CustomersChat)
export const sortCustomers = (customers: Customer[]): Customer[] => {
  return customers.sort((a, b) => {
    // Most recent conversation first (using timestamp or lastActive)
    const aTime = new Date(a.timestamp || a.lastActive || 0).getTime();
    const bTime = new Date(b.timestamp || b.lastActive || 0).getTime();
    
    // Sort by most recent first (desc)
    if (bTime !== aTime) return bTime - aTime;
    
    // Fallback to unread count if times are equal
    const unreadDiff = (b.unreadCount ?? 0) - (a.unreadCount ?? 0);
    if (unreadDiff !== 0) return unreadDiff;
    
    // Final fallback to name
    return a.name.localeCompare(b.name);
  });
};

// Combined filter and sort utility
export const processCustomers = (
  customers: Customer[],
  searchQuery: string,
  filters: { showUnreadOnly: boolean; statusFilter: CustomerStatus | 'all' }
): Customer[] => {
  const filtered = filterCustomers(customers, searchQuery, filters);
  return sortCustomers(filtered);
};

// Calculate customer statistics
export const calculateCustomerStats = (
  allCustomers: Customer[],
  filteredCustomers: Customer[]
) => ({
  total: allCustomers.length,
  filtered: filteredCustomers.length,
  online: allCustomers.filter(c => c.status === 'online').length,
  unread: allCustomers.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0),
});

// File validation (from ChatWindow)
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only image files (JPEG, PNG, GIF, WebP) are allowed' };
  }

  return { valid: true };
};

// Message type helpers
export const getMessageIcon = (messageType?: string) => {
  if (messageType?.includes('image')) return '📷';
  if (messageType?.includes('video')) return '🎬'; 
  if (messageType?.includes('audio')) return '🎤';
  if (messageType?.includes('document')) return '📎';
  return '💬';
};

export const getMessageDisplay = (customer: Customer): string => {
  if (customer.lastMessage) return customer.lastMessage;
  if (customer.message_type === 'image') return '📷 Image';
  if (customer.message_type === 'document') return '📎 Document';
  if (customer.message_type === 'voice') return '🎤 Voice message';
  return 'No messages yet';
};