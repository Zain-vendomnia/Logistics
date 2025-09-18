// /services/messageService.ts
// Optimized message service - reduced by ~35%

import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import authHeader from './auth-header';
import { 
  Message, 
  MessageRequest, 
  MessageUpdate, 
  MessageStatusUpdate, 
  SendMessageResponse 
} from '../components/notification/shared/types'; // Fixed path

// ==========================================
// CONSTANTS & CONFIG
// ==========================================

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';
const MESSAGES_API_BASE = `${API_BASE}/api/admin/messages`;

// File size limits for Twilio WhatsApp (in MB) - Fixed typing issue
const FILE_SIZE_LIMITS: { [key: string]: number } = {
  image: 5,
  video: 16,
  audio: 16,
  document: 16,
  default: 16
};

// ==========================================
// INTERFACES
// ==========================================

export interface FileUploadResponse {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  error?: string;
}

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

export interface CustomerStatusUpdate {
  orderId: number;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: string;
}

// ==========================================
// UTILITIES
// ==========================================

const getTokenFromAuthHeader = (): string | null => {
  const headers = authHeader();
  const authHeaderValue = headers['Authorization'];
  if (authHeaderValue?.startsWith('Bearer ')) {
    return authHeaderValue.substring(7);
  }
  return authHeaderValue || null;
};

// ==========================================
// SOCKET SERVICE - Simplified
// ==========================================

class SocketService {
  private socket: Socket | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  connect(): void {
    if (this.socket?.connected) return;

    const token = getTokenFromAuthHeader();
    if (!token) {
      console.error('No authentication token found. Cannot connect to Socket.IO.');
      return;
    }

    this.socket = io(API_BASE, {
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
      this.socket?.emit('join-admin-room');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.reconnectAttempts++;
    });
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

  // Room management
  joinOrder(orderId: number): void {
    this.socket?.emit('join-order', orderId);
  }

  leaveOrder(orderId: number): void {
    this.socket?.emit('leave-order', orderId);
  }

  // Core event handlers
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

  // Message events
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

  // Customer list events
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

  // Direct socket access for advanced use
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Singleton instance
export const socketService = new SocketService();

// ==========================================
// API FUNCTIONS
// ==========================================

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
    }
    return Array.isArray(response.data) ? response.data : response.data || [];
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return [];
    console.error('Failed to fetch messages:', error);
    throw error;
  }
};

export const uploadFile = async (
  file: File, 
  orderId: string,
  onProgress?: (progress: number) => void
): Promise<FileUploadResponse> => {
  try {
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
        return { success: false, error: 'Upload timeout. File may be too large.' };
      }
      
      const responseData = error.response?.data as { error?: string };
      if (responseData?.error) {
        return { success: false, error: responseData.error };
      }
      
      if (error.response?.status === 413) {
        return { success: false, error: 'File too large. Maximum size exceeded.' };
      }
    }
    
    return { success: false, error: 'File upload failed. Please try again.' };
  }
};

export const sendMessage = async (
  orderId: number, 
  messageData: MessageRequest
): Promise<{ success: boolean; message?: Message; error?: string }> => {
  try {
    const response = await axios.post(`${MESSAGES_API_BASE}/${orderId}`, messageData, { 
      headers: authHeader(),
      timeout: 10000
    });
    
    const data: SendMessageResponse = response.data;

    if (data.status === 'success' || data.success) {
      return { success: true, message: data.message };
    } else {
      return { success: false, error: data.error || 'Failed to send message' };
    }
  } catch (error) {
    console.error('Failed to send message:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return { success: false, error: 'Request timeout. Please try again.' };
      }
      
      if (error.response?.data) {
        const responseData = error.response.data as { error?: string; message?: string };
        return {
          success: false,
          error: responseData.error || responseData.message || 'Failed to send message'
        };
      }
      
      if (error.response?.status === 400) {
        return { success: false, error: 'Invalid message data. Please check your input.' };
      }
      
      if (error.response?.status === 404) {
        return { success: false, error: 'Order not found. Please refresh and try again.' };
      }
    }
    
    return { success: false, error: 'Network error occurred. Please check your connection.' };
  }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

export const isOptimisticMessage = (message: Message): boolean => {
  return message.id.startsWith('temp_') || message.delivery_status === 'sending';
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

// Twilio file validation
export const validateFileForTwilio = (file: File): { valid: boolean; error?: string } => {
  const fileSizeMB = file.size / 1024 / 1024;
  const fileType = file.type.toLowerCase();

  // Determine size limit based on file type
  let sizeLimit = FILE_SIZE_LIMITS.default;
  if (fileType.startsWith('image/')) sizeLimit = FILE_SIZE_LIMITS.image;
  else if (fileType.startsWith('video/')) sizeLimit = FILE_SIZE_LIMITS.video;
  else if (fileType.startsWith('audio/')) sizeLimit = FILE_SIZE_LIMITS.audio;
  else if (fileType.startsWith('application/')) sizeLimit = FILE_SIZE_LIMITS.document;

  if (fileSizeMB > sizeLimit) {
    return {
      valid: false,
      error: `File too large. Maximum size for ${fileType.split('/')[0]} files is ${sizeLimit}MB`
    };
  }

  // Check supported file types
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