// /shared/types.ts
// Optimized type definitions - single source of truth

// ==========================================
// CORE INTERFACES
// ==========================================

// Consolidated Customer interface - single version for all components
export interface Customer {
  // Required core properties
  order_id: number;
  name: string;
  status: CustomerStatus;
  unreadCount: number;
  
  // Optional messaging properties
  lastMessage?: string;
  avatar?: string;
  lastActive?: string;
  timestamp?: string;
  
  // Optional contact/order data
  phone?: string;
  order_number?: string;
  message_type?: MessageType;
}

// Message interface - moved from messageService to fix circular dependency
export interface Message {
  id: string;
  order_id: number;
  from: string;
  to: string;
  body: string;
  sender: string;
  content: string;
  direction: 'inbound' | 'outbound';
  message_type: 'text' | 'file';
  created_at: string;
  updated_at?: string;
  delivery_status: DeliveryStatus;
  is_read: number;
  timestamp: string;
  type: MessageType;
  fileName?: string;
  twilio_sid?: string | null;
  fileUrl?: string;
  fileType?: string;
  errorCode?: string;
  errorMessage?: string;
  readAt?: string | null;
}

// Request/Response interfaces
export interface MessageRequest {
  sender: string;
  content: string;
  type: 'text' | 'file';
  phone_number: number;
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
}

export interface MessageUpdate {
  tempId: string;
  message: Message;
}

export interface MessageStatusUpdate {
  messageId: string;
  update: {
    delivery_status?: string;
    twilio_sid?: string;
  };
}

export interface SendMessageResponse {
  success: boolean;
  status?: 'success' | 'error';
  message?: Message;
  error?: string;
  twilioStatus?: string;
}

// ==========================================
// FILTER & STATS INTERFACES
// ==========================================

export interface FilterOptions {
  showUnreadOnly: boolean;
  statusFilter: 'all' | CustomerStatus;
}

export interface CustomerStats {
  total: number;
  filtered: number;
  online: number;
  unread: number;
}

// ==========================================
// COMPONENT PROP INTERFACES
// ==========================================

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

// ==========================================
// TYPE UNIONS - Simplified
// ==========================================

export type CustomerStatus = 'online' | 'offline' | 'away' | 'busy';
export type MessageType = 'text' | 'image' | 'document' | 'voice' | 'file' | 'video' | 'audio' | 'location' | 'contacts' | 'sticker' | 'unknown';
export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'sending';