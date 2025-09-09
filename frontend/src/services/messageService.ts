import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import authHeader from './auth-header';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';
const MESSAGES_API_BASE = `${API_BASE}/api/admin/messages`;

// Updated Message interface to match backend with all required properties
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
  fileUrl?: string;      // Added for media URLs
  fileType?: string;     // Added for media content types
  errorCode?: string;    // Added for error tracking
  errorMessage?: string; // Added for error messages
  readAt?: string | null; // Added for read timestamps
}

export interface MessageRequest {
  sender: string;
  content: string;
  type: 'text' | 'file';
  phone_number: number;
  fileName?: string;
}

// New interfaces for optimistic updates
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

// Updated response interface to match backend
export interface SendMessageResponse {
  success: boolean;
  status?: 'success' | 'error';
  message?: Message;
  error?: string;
  twilioStatus?: string;
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

// Socket.IO Service
class SocketService {
  private socket: Socket | null = null;
  private connected = false;

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
      reconnectionAttempts: 5,
      timeout: 20000,
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO connected:', this.socket?.id);
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
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
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  // ------------------------------
  // Chat room events
  // ------------------------------
  joinOrder(orderId: number): void {
    console.log(`Joining order room: ${orderId}`);
    this.socket?.emit('join-order', orderId);
  }

  leaveOrder(orderId: number): void {
    console.log(`Leaving order room: ${orderId}`);
    this.socket?.emit('leave-order', orderId);
  }

  // ------------------------------
  // Optimistic Message Events
  // ------------------------------
  
  // Listen for new messages (including optimistic ones)
  onNewMessage(callback: (message: Message) => void): void {
    this.socket?.on('new-message', (data) => {
      console.log('New message received:', data);
      callback(data);
    });
  }

  offNewMessage(callback?: (message: Message) => void): void {
    if (callback) {
      this.socket?.off('new-message', callback);
    } else {
      this.socket?.off('new-message');
    }
  }

  // Listen for message updates (when optimistic messages get real IDs)
  onMessageUpdated(callback: (data: MessageUpdate) => void): void {
    this.socket?.on('message-updated', (data) => {
      console.log('Message updated:', data);
      callback(data);
    });
  }

  offMessageUpdated(callback?: (data: MessageUpdate) => void): void {
    if (callback) {
      this.socket?.off('message-updated', callback);
    } else {
      this.socket?.off('message-updated');
    }
  }

  // Listen for status updates (from webhooks)
  onMessageStatusUpdated(callback: (data: MessageStatusUpdate) => void): void {
    this.socket?.on('message-status-updated', (data) => {
      console.log('Message status updated:', data);
      callback(data);
    });
  }

  offMessageStatusUpdated(callback?: (data: MessageStatusUpdate) => void): void {
    if (callback) {
      this.socket?.off('message-status-updated', callback);
    } else {
      this.socket?.off('message-status-updated');
    }
  }

  // LEGACY: Keep old methods for backward compatibility
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

  // ------------------------------
  // Connection wrappers
  // ------------------------------
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

// ------------------------------
// REST API Functions
// ------------------------------
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
    
    // Handle different response formats
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

// Updated to handle file uploads and match backend response format
export const sendMessage = async (
  orderId: number, 
  messageData: MessageRequest
): Promise<{ success: boolean; message?: Message; error?: string }> => {
  try {
    console.log('Sending message via API:', { orderId, messageData });
    
    const response = await axios.post(`${MESSAGES_API_BASE}/${orderId}`, messageData, { 
      headers: authHeader() 
    });

    console.log('API Response:', response.data);
    
    const data: SendMessageResponse = response.data;

    if (data.status === 'success') {
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
    
    if (axios.isAxiosError(error) && error.response?.data) {
      const responseData = error.response.data as { error?: string; message?: string };
      return {
        success: false,
        error: responseData.error || responseData.message || 'Failed to send message'
      };
    }
    
    return {
      success: false,
      error: 'Network error occurred'
    };
  }
};

// File upload function for media messages
export const uploadFile = async (file: File, orderId: string): Promise<{ success: boolean; fileUrl?: string; fileName?: string; error?: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('orderId', orderId);

    const response = await axios.post(`${MESSAGES_API_BASE}/upload`, formData, {
      headers: {
        ...authHeader(),
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      return {
        success: true,
        fileUrl: response.data.fileUrl,
        fileName: response.data.fileName,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Upload failed',
      };
    }
  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: 'File upload failed',
    };
  }
};

// Utility functions with new 'sending' status
export const getDeliveryStatusIcon = (status: string): string => {
  switch (status) {
    case 'sending':
      return '⏳';
    case 'pending':
      return '⏳';
    case 'sent':
      return '✓';
    case 'delivered':
      return '✓✓';
    case 'read':
      return '✓✓';
    case 'failed':
      return '❌';
    default:
      return '⏳';
  }
};

export const getDeliveryStatusText = (status: string): string => {
  switch (status) {
    case 'sending':
      return 'Sending...';
    case 'pending':
      return 'Pending...';
    case 'sent':
      return 'Sent';
    case 'delivered':
      return 'Delivered';
    case 'read':
      return 'Read';
    case 'failed':
      return 'Failed';
    default:
      return 'Pending';
  }
};

export const getDeliveryStatusColor = (status: string): string => {
  switch (status) {
    case 'sending':
      return '#FFA500'; // Orange
    case 'pending':
      return '#FFA500'; // Orange
    case 'sent':
      return '#0084FF'; // Blue
    case 'delivered':
      return '#0084FF'; // Blue
    case 'read':
      return '#0084FF'; // Blue
    case 'failed':
      return '#FF3B30'; // Red
    default:
      return '#999999'; // Gray
  }
};

// Helper function to check if message is temporary/optimistic
export const isOptimisticMessage = (message: Message): boolean => {
  return message.id.startsWith('temp_') || message.delivery_status === 'sending';
};

// Helper function to find message by temp ID
export const findMessageByTempId = (messages: Message[], tempId: string): Message | undefined => {
  return messages.find(msg => msg.id === tempId);
};

// Helper function to update message in array
export const updateMessageInArray = (messages: Message[], updatedMessage: Message, tempId?: string): Message[] => {
  return messages.map(msg => {
    // If we have a tempId, replace the temp message with the updated one
    if (tempId && msg.id === tempId) {
      return updatedMessage;
    }
    // Otherwise, update by matching ID
    if (msg.id === updatedMessage.id) {
      return { ...msg, ...updatedMessage };
    }
    return msg;
  });
};

// Helper function to update message status only
export const updateMessageStatus = (messages: Message[], messageId: string, statusUpdate: any): Message[] => {
  return messages.map(msg => {
    if (msg.id === messageId) {
      return { ...msg, ...statusUpdate };
    }
    return msg;
  });
};

// Helper function to determine media type from file
export const getMediaTypeFromFile = (file: File): 'image' | 'video' | 'audio' | 'document' => {
  const type = file.type.toLowerCase();
  
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  return 'document';
};

// Helper function to validate file for upload
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm',
    'audio/mp3', 'audio/wav', 'audio/ogg',
    'application/pdf', 'text/plain'
  ];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not supported' };
  }

  return { valid: true };
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