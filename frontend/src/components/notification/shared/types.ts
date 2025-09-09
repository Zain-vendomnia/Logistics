// /shared/types.ts
// Consolidated type definitions - single source of truth

// Core Customer interface - consolidates all 3 variations from your components
export interface Customer {
  // Required properties
  order_id: number;
  name: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  unreadCount: number;
  
  // Optional messaging properties
  lastMessage?: string;
  avatar?: string;
  lastActive?: string;
  
  // Optional order/contact data
  phone?: string;
  order_number?: string;
  timestamp?: string;
  message_type?: 'text' | 'image' | 'document' | 'voice';
}

// Filter options interface
export interface FilterOptions {
  showUnreadOnly: boolean;
  statusFilter: 'all' | Customer['status'];
}

// Customer list statistics
export interface CustomerStats {
  total: number;
  filtered: number;
  online: number;
  unread: number;
}

// Re-export Message types from messageService to avoid duplication
export type {
  Message,
  MessageRequest,
  MessageUpdate,
  MessageStatusUpdate,
  SendMessageResponse
} from '../../../services/messageService';

// Status type unions for better type safety
export type CustomerStatus = Customer['status'];
export type MessageType = 'text' | 'image' | 'document' | 'voice' | 'file';
export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'sending';

// Component prop interfaces
export interface CustomerListProps {
  customers: Customer[];
  selectedCustomerId: number | null;
  onSelectCustomer: (id: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FilterOptions;
  onFilterChange: (filters: Partial<FilterOptions>) => void;
  onClearAll: () => void;
  stats: CustomerStats;
}

export interface ChatWindowProps {
  customer: Customer;
  orderId: number;
}