// /shared/types.ts
// Type definitions for customer list and multi-channel communication

// ==========================================
// API RESPONSE
// ==========================================

export interface ApiResponse<T = any> {
  status: 'success' | 'error' | 'warning';
  message: string;
  data: T;
}

// ==========================================
// CORE INTERFACES
// ==========================================

export interface Customer {
  order_id: number;
  order_number?: string;
  name: string;
  phone?: string;
  email?: string;
  status?: string;
  // Multi-channel fields
  last_message?: string;
  last_message_time?: string;
  last_message_at?: string; // New field from database
  last_channel?: 'whatsapp' | 'sms' | 'email' | 'none' | null;
  last_communication_channel?: 'whatsapp' | 'sms' | 'email' | 'none'; // New field from database
  unread_count?: number;
  has_unread?: boolean; // New field - indicates if customer has unread messages
}

// ==========================================
// COMPONENT PROPS
// ==========================================

export interface CustomerListProps {
  customers: Customer[];
  selectedCustomerId: number | null;
  onSelectCustomer: (id: number) => void;
  totalUnreadCount?: number;
}

export interface ChatWindowProps {
  customer: Customer;
  orderId: number;
  onClose?: () => void; 
}

// ==========================================
// MESSAGE INTERFACES
// ==========================================

export interface Message {
  id: string;
  order_id: number;
  from: string;
  to: string;
  body: string;
  sender: string;
  content: string;
  message: string; // Alternative field name
  direction: 'inbound' | 'outbound';
  message_type: 'text' | 'file' | 'media';
  communication_channel: 'whatsapp' | 'sms' | 'email'; // Multi-channel support
  created_at: string;
  updated_at?: string;
  delivery_status: DeliveryStatus;
  status?: string; // Alternative field name
  is_read: number;
  timestamp: string;
  type: MessageType;
  fileName?: string;
  twilio_sid?: string | null;
  message_id?: string;
  fileUrl?: string;
  fileType?: string;
  errorCode?: string;
  errorMessage?: string;
  error_code?: string | null;
  error_message?: string | null;
  readAt?: string | null;
  read_at?: string | null;
  send_user_id?: number;
  media_url?: string | null;
  media_content_type?: string | null;
  error?: {
    code: string;
    message: string;
  };
}

export interface MessageUpdate {
  tempId: string;
  message: Message;
}

export interface MessageRequest {
  orderId: number;
  content: string;
  type: 'text' | 'file';
  sender?: string;
  phone_number?: number;
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
}

// ==========================================
// ENUMS & TYPES
// ==========================================

export type MessageType = 'text' | 'image' | 'document' | 'voice' | 'file' | 'video' | 'audio' | 'location' | 'contacts' | 'sticker' | 'unknown';

export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'sending';

export type CommunicationChannel = 'whatsapp' | 'sms' | 'email' ;

// ==========================================
// WEBSOCKET EVENT TYPES
// ==========================================

export interface CustomerListUpdateEvent {
  customers: Customer[];
  timestamp: string;
  triggerReason?: string;
}

export interface SingleCustomerUpdateEvent {
  customer: Customer;
  updateType: 'new_message' | 'status_change' | 'new_customer';
  timestamp: string;
  additionalData?: any;
}

export interface TotalUnreadUpdateEvent {
  totalUnreadCount: number;
  timestamp: string;
}

export interface NewMessageEvent {
  orderId: number;
  message: Message;
  timestamp: string;
}

export interface MessageStatusUpdateEvent {
  messageId: string;
  orderId: number;
  status: DeliveryStatus;
  channel?: CommunicationChannel;
  timestamp: string;
}

export interface ChannelNotificationEvent {
  type: 'fallback' | 'channel_switch' | 'delivery_failure';
  originalChannel: CommunicationChannel;
  fallbackChannel?: CommunicationChannel;
  message: string;
  timestamp: string;
}