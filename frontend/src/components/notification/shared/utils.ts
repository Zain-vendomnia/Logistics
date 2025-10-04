// /shared/utils.ts
// Optimized utility functions - reduced by ~45%

import React from 'react';
import { 
  Schedule as ScheduleIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { Customer, CustomerStatus, DeliveryStatus } from './types';

// ==========================================
// CONSTANTS
// ==========================================

const AVATAR_COLORS = [
  '#1976d2', '#388e3c', '#f57c00', '#7b1fa2',
  '#c2185b', '#00796b', '#5d4037', '#455a64'
];

const STATUS_COLORS = {
  online: '#4caf50',
  away: '#ff9800', 
  busy: '#f44336',
  offline: '#9e9e9e',
} as const;

const STATUS_CONFIGS = {
  sending: { color: '#ff9800', bg: '#fff3e0', text: '#e65100', label: 'Sending...', icon: 'schedule' },
  pending: { color: '#ff9800', bg: '#fff3e0', text: '#e65100', label: 'Pending...', icon: 'schedule' },
  sent: { color: '#2196f3', bg: '#e3f2fd', text: '#0d47a1', label: 'Sent', icon: 'check' },
  delivered: { color: '#4caf50', bg: '#e8f5e8', text: '#2e7d32', label: 'Delivered', icon: 'done_all' },
  read: { color: '#4caf50', bg: '#e8f5e8', text: '#2e7d32', label: 'Read', icon: 'done_all' },
  failed: { color: '#f44336', bg: '#ffebee', text: '#c62828', label: 'Failed', icon: 'error' }
} as const;

// ==========================================
// AVATAR UTILITIES
// ==========================================

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

export const getAvatarColor = (name: string): string => {
  return AVATAR_COLORS[name.length % AVATAR_COLORS.length];
};

// ==========================================
// TIME FORMATTING
// ==========================================

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

// ==========================================
// STATUS UTILITIES
// ==========================================

export const getStatusConfig = (status: DeliveryStatus) => {
  return STATUS_CONFIGS[status] || STATUS_CONFIGS.pending;
};

// Simplified icon rendering
export const getStatusIcon = (iconName: string, color: string) => {
  const iconProps = { sx: { fontSize: '14px', color } };
  
  switch (iconName) {
    case 'schedule': return React.createElement(ScheduleIcon, iconProps);
    case 'check': return React.createElement(CheckIcon, iconProps);
    case 'done_all': return React.createElement(DoneAllIcon, iconProps);
    case 'error': return React.createElement(ErrorIcon, iconProps);
    default: return React.createElement(CheckIcon, iconProps);
  }
};

// Export status colors for components
export { STATUS_COLORS };

// ==========================================
// CUSTOMER UTILITIES
// ==========================================

// Data normalization
export const normalizeCustomer = (customer: any): Customer => ({
  ...customer,
  unreadCount: customer.unreadCount ?? 0,
  status: customer.status || 'offline' as CustomerStatus,
});

// Combined filter and sort function
export const processCustomers = (
  customers: Customer[],
  searchQuery: string,
  filters: { showUnreadOnly: boolean; statusFilter: CustomerStatus | 'all' }
): Customer[] => {
  let filtered = customers;
  
  // Apply filters (search is now handled server-side)
  if (filters.showUnreadOnly) {
    filtered = filtered.filter(c => (c.unreadCount ?? 0) > 0);
  }

  if (filters.statusFilter !== 'all') {
    filtered = filtered.filter(c => c.status === filters.statusFilter);
  }

  // Sort by unread count (desc) then by recent activity (desc)
  return filtered.sort((a, b) => {
    const unreadDiff = (b.unreadCount ?? 0) - (a.unreadCount ?? 0);
    if (unreadDiff !== 0) return unreadDiff;

    const aTime = new Date(a.timestamp || a.lastActive || 0).getTime();
    const bTime = new Date(b.timestamp || b.lastActive || 0).getTime();
    return bTime - aTime;
  });
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

// ==========================================
// SEARCH UTILITIES
// ==========================================

// Search highlighting for client-side highlights
export const createSearchRegex = (query: string): RegExp => {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(${escaped})`, 'gi');
};

// ==========================================
// MESSAGE UTILITIES
// ==========================================

// Get message display text with fallbacks
export const getMessageDisplay = (customer: Customer): string => {
  if (customer.lastMessage) return customer.lastMessage;
  if (customer.message_type === 'image') return '📷 Image';
  if (customer.message_type === 'document') return '📎 Document';
  if (customer.message_type === 'voice') return '🎤 Voice message';
  return 'No messages yet';
};