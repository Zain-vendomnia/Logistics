// /services/messageService.ts
// Optimized version - ~40% reduction

import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import authHeader from './auth-header';
import { Message, MessageRequest, MessageUpdate } from '../components/notification/shared/types';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';
const MESSAGES_API_BASE = `${API_BASE}/api/admin/messages`;

// Socket Service
class SocketService {
  private socket: Socket | null = null;

  connect(): void {
    if (this.socket?.connected) return;

    const headers = authHeader();
    const token = headers['Authorization']?.substring(7);
    if (!token) return;

    this.socket = io(API_BASE, {
      autoConnect: true,
      reconnection: true,
      auth: { token }
    });

    this.socket.on('connect', () => {
      this.socket?.emit('join-admin-room');
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.emit('leave-admin-room');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected === true;
  }

  joinOrder(orderId: number): void {
    this.socket?.emit('join-order', orderId);
  }

  leaveOrder(orderId: number): void {
    this.socket?.emit('leave-order', orderId);
  }

  onConnect(cb: () => void): void { this.socket?.on('connect', cb); }
  offConnect(cb: () => void): void { this.socket?.off('connect', cb); }
  onDisconnect(cb: (reason: string) => void): void { this.socket?.on('disconnect', cb); }
  offDisconnect(cb: (reason: string) => void): void { this.socket?.off('disconnect', cb); }
  onNewMessage(cb: (message: Message) => void): void { this.socket?.on('new-message', cb); }
  offNewMessage(cb?: (message: Message) => void): void { this.socket?.off('new-message', cb); }
  onMessageUpdated(cb: (data: MessageUpdate) => void): void { this.socket?.on('message-updated', cb); }
  offMessageUpdated(cb?: (data: MessageUpdate) => void): void { this.socket?.off('message-updated', cb); }
  onMessageStatusUpdated(cb: (data: any) => void): void { this.socket?.on('message-status-updated', cb); }
  offMessageStatusUpdated(cb?: (data: any) => void): void { this.socket?.off('message-status-updated', cb); }

  getSocket(): Socket | null { return this.socket; }
}

export const socketService = new SocketService();

// API Functions
export const updateCustomerUnreadCount = async (orderId: number, unreadCount: number = 0): Promise<void> => {
  await axios.put(
    `${MESSAGES_API_BASE}/${orderId}/unread-count`,
    { unreadCount },
    { headers: authHeader() }
  );
};

export const getMessagesByOrderId = async (orderId: number): Promise<Message[]> => {
  try {
    const response = await axios.get(`${MESSAGES_API_BASE}/${orderId}`, { headers: authHeader() });
    return response.data.data || response.data || [];
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return [];
    throw error;
  }
};

export const uploadFile = async (
  file: File, 
  orderId: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; fileUrl?: string; error?: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('orderId', orderId);

    const response = await axios.post(`${MESSAGES_API_BASE}/upload`, formData, {
      headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      }
    });

    return response.data.success 
      ? { success: true, fileUrl: response.data.fileUrl }
      : { success: false, error: 'Upload failed' };
  } catch (error) {
    return { success: false, error: 'File upload failed' };
  }
};

export const sendMessage = async (
  orderId: number, 
  messageData: MessageRequest
): Promise<{ success: boolean; message?: Message; error?: string }> => {
  try {
    const response = await axios.post(`${MESSAGES_API_BASE}/${orderId}`, messageData, { 
      headers: authHeader()
    });
    
    return response.data.success || response.data.status === 'success'
      ? { success: true, message: response.data.message }
      : { success: false, error: 'Failed to send' };
  } catch (error) {
    return { success: false, error: 'Send failed' };
  }
};

export const updateMessageInArray = (messages: Message[], updated: Message, tempId?: string): Message[] => {
  return messages.map(msg => 
    (tempId && msg.id === tempId) || msg.id === updated.id ? updated : msg
  );
};

export const updateMessageStatus = (messages: Message[], messageId: string, statusUpdate: any): Message[] => {
  return messages.map(msg => 
    msg.id === messageId ? { ...msg, ...statusUpdate } : msg
  );
};

export const isOptimisticMessage = (message: Message): boolean => {
  return message.id.startsWith('temp_') || message.delivery_status === 'sending';
};