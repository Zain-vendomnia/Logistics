import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import authHeader from './auth-header';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';
const MESSAGES_API_BASE = `${API_BASE}/api/admin/messages`;

// Updated Message interface to include file properties
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
  delivery_status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'sending';
  is_read: number;
  timestamp: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contacts' | 'sticker' | 'unknown' | 'file';
  fileName?: string;
  twilio_sid?: string | null;
  fileUrl?: string;
  fileType?: string;
  errorCode?: string;
  errorMessage?: string;
  readAt?: string | null;
}

// Updated MessageRequest to include file properties
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

// UPDATED: Single customer list update event interface
export interface CustomerListUpdate {
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
}

// DEPRECATED: These interfaces are no longer used with single event approach
export interface GlobalMessageEvent {
  message: Message;
  customerId: number;
  customerName: string;
}

export interface CustomerStatusUpdate {
  orderId: number;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: string;
}

export interface UnreadCountUpdate {
  orderId: number;
  unreadCount: number;
}

export interface SendMessageResponse {
  success: boolean;
  status?: 'success' | 'error';
  message?: Message;
  error?: string;
  twilioStatus?: string;
}

// File upload response interface
export interface FileUploadResponse {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  error?: string;
}

// Extract token helper
const getTokenFromAuthHeader = (): string | null => {
  const headers = authHeader();
  const authHeaderValue = headers['Authorization'];
  if (authHeaderValue && authHeaderValue.startsWith('Bearer ')) {
    return authHeaderValue.substring(7);
  }
  return authHeaderValue || null;
};

// Enhanced Socket.IO Service with Single Customer Update Event
class SocketService {
  private socket: Socket | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): void {
    if (this.socket?.connected) return;

    const socketUrl = API_BASE;
    const token = getTokenFromAuthHeader();

    if (!token) {
      console.error('No authentication token found. Cannot connect to Socket.IO.');
      return;
    }

    this.socket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO connected:', this.socket?.id);
      this.connected = true;
      this.reconnectAttempts = 0;
      
      // Join global admin room for customer list updates
      this.socket?.emit('join-admin-room');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });
  }

  reconnectWithFreshToken(): void {
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.emit('leave-admin-room');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  // Chat room events (existing)
  joinOrder(orderId: number): void {
    console.log(`Joining order room: ${orderId}`);
    this.socket?.emit('join-order', orderId);
  }

  leaveOrder(orderId: number): void {
    console.log(`Leaving order room: ${orderId}`);
    this.socket?.emit('leave-order', orderId);
  }

  // Individual message events (existing)
  onNewMessage(callback: (message: Message) => void): void {
    this.socket?.on('new-message', callback);
  }

  offNewMessage(callback?: (message: Message) => void): void {
    if (callback) {
      this.socket?.off('new-message', callback);
    } else {
      this.socket?.off('new-message');
    }
  }

  onMessageUpdated(callback: (data: MessageUpdate) => void): void {
    this.socket?.on('message-updated', callback);
  }

  offMessageUpdated(callback?: (data: MessageUpdate) => void): void {
    if (callback) {
      this.socket?.off('message-updated', callback);
    } else {
      this.socket?.off('message-updated');
    }
  }

  onMessageStatusUpdated(callback: (data: MessageStatusUpdate) => void): void {
    this.socket?.on('message-status-updated', callback);
  }

  offMessageStatusUpdated(callback?: (data: MessageStatusUpdate) => void): void {
    if (callback) {
      this.socket?.off('message-status-updated', callback);
    } else {
      this.socket?.off('message-status-updated');
    }
  }

  // NEW: Single customer list update event
  onCustomerListUpdate(callback: (data: CustomerListUpdate) => void): void {
    this.socket?.on('customer-list-update', callback);
  }

  offCustomerListUpdate(callback?: (data: CustomerListUpdate) => void): void {
    if (callback) {
      this.socket?.off('customer-list-update', callback);
    } else {
      this.socket?.off('customer-list-update');
    }
  }

  // Customer status updates (online/offline)
  onCustomerStatusUpdate(callback: (data: CustomerStatusUpdate) => void): void {
    this.socket?.on('customer-status-update', callback);
  }

  offCustomerStatusUpdate(callback?: (data: CustomerStatusUpdate) => void): void {
    if (callback) {
      this.socket?.off('customer-status-update', callback);
    } else {
      this.socket?.off('customer-status-update');
    }
  }

  // Emit customer status updates
  updateCustomerStatus(orderId: number, status: CustomerStatusUpdate['status']): void {
    this.socket?.emit('update-customer-status', { orderId, status });
  }

  // DEPRECATED: Old global events (kept for backward compatibility)
  onGlobalNewMessage(callback: (data: GlobalMessageEvent) => void): void {
    console.warn('onGlobalNewMessage is deprecated. Use onCustomerListUpdate instead.');
    // For backward compatibility, we can map the old event to the new one
    this.socket?.on('global-new-message', callback);
  }

  offGlobalNewMessage(callback?: (data: GlobalMessageEvent) => void): void {
    if (callback) {
      this.socket?.off('global-new-message', callback);
    } else {
      this.socket?.off('global-new-message');
    }
  }

  onUnreadCountUpdate(callback: (data: UnreadCountUpdate) => void): void {
    console.warn('onUnreadCountUpdate is deprecated. Use onCustomerListUpdate instead.');
    this.socket?.on('unread-count-update', callback);
  }

  offUnreadCountUpdate(callback?: (data: UnreadCountUpdate) => void): void {
    if (callback) {
      this.socket?.off('unread-count-update', callback);
    } else {
      this.socket?.off('unread-count-update');
    }
  }

  // Legacy compatibility methods
  onMessageStatusUpdate(callback: (data: any) => void): void {
    this.onMessageStatusUpdated(callback);
  }

  offMessageStatusUpdate(callback?: (data: any) => void): void {
    this.offMessageStatusUpdated(callback);
  }

  onMessageStatus(callback: (data: { messageId: string; status: string }) => void): void {
    this.onMessageStatusUpdated((data: MessageStatusUpdate) => {
      callback({
        messageId: data.messageId,
        status: data.update.delivery_status || 'pending'
      });
    });
  }

  offMessageStatus(callback?: (data: { messageId: string; status: string }) => void): void {
    // Handled by offMessageStatusUpdated
  }

  // Connection events
  onConnect(callback: () => void): void {
    this.socket?.on('connect', callback);
  }

  offConnect(callback: () => void): void {
    this.socket?.off('connect', callback);
  }

  onDisconnect(callback: (reason: string) => void): void {
    this.socket?.on('disconnect', callback);
  }

  offDisconnect(callback: (reason: string) => void): void {
    this.socket?.off('disconnect', callback);
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  getConnectionStatus(): { connected: boolean; socketId?: string; token?: string } {
    return {
      connected: this.connected,
      socketId: this.socket?.id,
      token: getTokenFromAuthHeader() ? 'Present' : 'Missing'
    };
  }
}

// Singleton
export const socketService = new SocketService();

// REST API Functions
export const updateCustomerUnreadCount = async (orderId: number, unreadCount: number = 0): Promise<void> => {
  try {
    await axios.put(
      `${MESSAGES_API_BASE}/${orderId}/unread-count`,
      { unreadCount },
      { headers: authHeader() }
    );
  } catch (error) {
    console.error('Failed to update unread count:', error);
    throw error;
  }
};

export const getMessagesByOrderId = async (orderId: number): Promise<Message[]> => {
  try {
    const response = await axios.get(`${MESSAGES_API_BASE}/${orderId}`, { headers: authHeader() });
    
    if (response.data.status === 'success') {
      return response.data.data || [];
    } else if (Array.isArray(response.data)) {
      return response.data;
    } else {
      return response.data || [];
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return [];
    console.error('Failed to fetch messages:', error);
    throw error;
  }
};

// File upload function with progress tracking
export const uploadFile = async (
  file: File, 
  orderId: string,
  onProgress?: (progress: number) => void
): Promise<FileUploadResponse> => {
  try {
    console.log('Starting file upload:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      orderId
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('orderId', orderId);

    const response = await axios.post(`${MESSAGES_API_BASE}/upload`, formData, {
      headers: {
        ...authHeader(),
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
      timeout: 30000,
    });

    console.log('Upload response:', response.data);

    if (response.data.success) {
      return {
        success: true,
        fileUrl: response.data.fileUrl,
        fileName: response.data.fileName || file.name,
        fileType: response.data.fileType || file.type,
        fileSize: response.data.fileSize || file.size,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Upload failed',
      };
    }
  } catch (error) {
    console.error('File upload error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Upload timeout. File may be too large.',
        };
      }
      
      const responseData = error.response?.data as { error?: string };
      if (responseData?.error) {
        return {
          success: false,
          error: responseData.error,
        };
      }
      
      if (error.response?.status === 413) {
        return {
          success: false,
          error: 'File too large. Maximum size exceeded.',
        };
      }
    }
    
    return {
      success: false,
      error: 'File upload failed. Please try again.',
    };
  }
};

// Updated sendMessage function to handle file messages
export const sendMessage = async (
  orderId: number, 
  messageData: MessageRequest
): Promise<{ success: boolean; message?: Message; error?: string }> => {
  try {
    console.log('Sending message via API:', { orderId, messageData });
    
    const response = await axios.post(`${MESSAGES_API_BASE}/${orderId}`, messageData, { 
      headers: authHeader(),
      timeout: 10000
    });

    console.log('API Response:', response.data);
    
    const data: SendMessageResponse = response.data;

    if (data.status === 'success' || data.success) {
      return {
        success: true,
        message: data.message
      };
    } else {
      return {
        success: false,
        error: data.error || 'Failed to send message'
      };
    }
  } catch (error) {
    console.error('Failed to send message:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Request timeout. Please try again.'
        };
      }
      
      if (error.response?.data) {
        const responseData = error.response.data as { error?: string; message?: string };
        return {
          success: false,
          error: responseData.error || responseData.message || 'Failed to send message'
        };
      }
      
      if (error.response?.status === 400) {
        return {
          success: false,
          error: 'Invalid message data. Please check your input.'
        };
      }
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Order not found. Please refresh and try again.'
        };
      }
    }
    
    return {
      success: false,
      error: 'Network error occurred. Please check your connection.'
    };
  }
};

// Helper functions (existing)
export const isOptimisticMessage = (message: Message): boolean => {
  return message.id.startsWith('temp_') || message.delivery_status === 'sending';
};

export const findMessageByTempId = (messages: Message[], tempId: string): Message | undefined => {
  return messages.find(msg => msg.id === tempId);
};

export const updateMessageInArray = (messages: Message[], updatedMessage: Message, tempId?: string): Message[] => {
  return messages.map(msg => {
    if (tempId && msg.id === tempId) {
      return updatedMessage;
    }
    if (msg.id === updatedMessage.id) {
      return { ...msg, ...updatedMessage };
    }
    return msg;
  });
};

export const updateMessageStatus = (messages: Message[], messageId: string, statusUpdate: any): Message[] => {
  return messages.map(msg => {
    if (msg.id === messageId) {
      return { ...msg, ...statusUpdate };
    }
    return msg;
  });
};

// Initialize and cleanup functions
export const initializeSocket = (): void => {
  socketService.connect();
};

export const cleanupSocket = (): void => {
  socketService.disconnect();
};

// Test webhook endpoint
export const testWebhookEndpoint = async (): Promise<any> => {
  try {
    const response = await axios.get(`${MESSAGES_API_BASE}/twilio/test`);
    return response.data;
  } catch (error) {
    console.error('Webhook test failed:', error);
    throw error;
  }
};

// File validation helper
export const validateFileForTwilio = (file: File): { valid: boolean; error?: string } => {
  const SIZE_LIMITS = {
    image: 5,
    video: 16,
    audio: 16,
    document: 16
  };

  const fileSizeMB = file.size / 1024 / 1024;
  const fileType = file.type.toLowerCase();

  let sizeLimit = 16;
  if (fileType.startsWith('image/')) sizeLimit = SIZE_LIMITS.image;
  else if (fileType.startsWith('video/')) sizeLimit = SIZE_LIMITS.video;
  else if (fileType.startsWith('audio/')) sizeLimit = SIZE_LIMITS.audio;
  else if (fileType.startsWith('application/')) sizeLimit = SIZE_LIMITS.document;

  if (fileSizeMB > sizeLimit) {
    return {
      valid: false,
      error: `File too large. Maximum size for ${fileType.split('/')[0]} files is ${sizeLimit}MB`
    };
  }

  const supportedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/3gpp', 'video/quicktime',
    'audio/aac', 'audio/amr', 'audio/mp3', 'audio/mpeg', 'audio/ogg',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument'
  ];

  const isSupported = supportedTypes.some(type => fileType.startsWith(type));
  if (!isSupported) {
    return {
      valid: false,
      error: 'Unsupported file type for WhatsApp messaging'
    };
  }

  return { valid: true };
};