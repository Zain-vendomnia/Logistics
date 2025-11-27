// /services/messageService.ts
// Updated for multi-channel communication API

import axios from 'axios';
import authHeader from './auth-header';
import { Message, MessageRequest } from '../components/notification/shared/types';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';
const COMMUNICATION_API_BASE = `${API_BASE}/api/communication`;

// Helper function to normalize message from backend to frontend format
const normalizeBackendMessage = (msg: any): Message => {
  return {
    id: msg.message_id || msg.id || `msg_${Date.now()}`,
    order_id: msg.order_id,
    from: msg.from || '',
    to: msg.to || '',
    body: msg.message || msg.body || msg.content || '',
    sender: msg.direction === 'outbound' ? 'admin' : 'customer',
    content: msg.message || msg.body || msg.content || '',
    message: msg.message || msg.body || msg.content || '',
    direction: msg.direction || 'outbound',
    message_type: msg.message_type || 'text',
    communication_channel: msg.communication_channel || 'whatsapp',
    created_at: msg.created_at || new Date().toISOString(),
    updated_at: msg.updated_at,
    delivery_status: msg.delivery_status || msg.status || 'sent',
    status: msg.status || msg.delivery_status || 'sent',
    is_read: msg.is_read ? 1 : 0,
    timestamp: msg.created_at || msg.timestamp || new Date().toISOString(),
    type: msg.message_type === 'file' ? 'file' : 'text',
    fileName: msg.fileName,
    twilio_sid: msg.twilio_sid || null,
    message_id: msg.message_id,
    fileUrl: msg.fileUrl || msg.media_url,
    fileType: msg.fileType || msg.media_content_type,
    errorCode: msg.error_code,
    errorMessage: msg.error_message,
    error_code: msg.error_code,
    error_message: msg.error_message,
    readAt: msg.read_at,
    read_at: msg.read_at,
    send_user_id: msg.send_user_id,
    media_url: msg.media_url,
    media_content_type: msg.media_content_type,
  };
};

// API Functions

/**
 * Get conversation/messages by order ID
 * GET /api/communication/:orderId
 */
export const getMessagesByOrderId = async (orderId: number): Promise<Message[]> => {
  try {
    const response = await axios.get(
      `${COMMUNICATION_API_BASE}/${orderId}`, 
      { headers: authHeader() }
    );
    
    // Handle different response structures
    const rawMessages = response.data.data?.messages || response.data.messages || response.data.data || response.data || [];
    
    // Normalize all messages
    const messages = rawMessages.map((msg: any) => normalizeBackendMessage(msg));
    
    console.log(`📨 Loaded ${messages.length} messages for order ${orderId}`);
    return messages;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log(`ℹ️ No messages found for order ${orderId}`);
      return [];
    }
    console.error('❌ Error fetching messages:', error);
    throw error;
  }
};

/**
 * Create optimistic message (shows immediately before server confirmation)
 */
export const createOptimisticMessage = (
  orderId: number,
  content: string,
  messageType: 'text' | 'file' = 'text',
  fileData?: { fileName?: string; fileUrl?: string; fileType?: string }
): Message => {
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: tempId,
    order_id: orderId,
    from: 'admin',
    to: '',
    body: content,
    sender: 'admin',
    content: content,
    message: content,
    direction: 'outbound',
    message_type: messageType,
    communication_channel: 'whatsapp',
    created_at: new Date().toISOString(),
    delivery_status: 'sending',
    status: 'sending',
    is_read: 0,
    timestamp: new Date().toISOString(),
    type: messageType === 'file' ? 'file' : 'text',
    fileName: fileData?.fileName,
    fileUrl: fileData?.fileUrl,
    fileType: fileData?.fileType,
  };
};

/**
 * Send message to customer (auto-detects channel)
 * POST /api/communication/send
 */
export const sendMessage = async (
  orderId: number, 
  messageData: MessageRequest,
  optimisticMessage?: Message
): Promise<{ success: boolean; message?: Message; error?: string; tempId?: string }> => {
  try {
    const payload = {
      orderId,
      message: messageData.content,
      message_type: messageData.type || 'text',
      userId: 1,
      ...(messageData.fileUrl && { media_url: messageData.fileUrl }),
      ...(messageData.fileType && { media_content_type: messageData.fileType }),
    };

    console.log('📤 Sending message:', payload);

    const response = await axios.post(
      `${COMMUNICATION_API_BASE}/send`, 
      payload,
      { headers: authHeader() }
    );
    
    const success = response.data.success || response.data.status === 'success';
    
    if (success) {
      console.log('✅ Message sent successfully');
      const rawMessage = response.data.data?.message || response.data.message;
      
      // Normalize the server message
      const normalizedMessage = normalizeBackendMessage(rawMessage);
      
      return { 
        success: true, 
        message: normalizedMessage,
        tempId: optimisticMessage?.id
      };
    } else {
      console.error('❌ Failed to send message:', response.data);
      return { 
        success: false, 
        error: response.data.error || 'Failed to send message',
        tempId: optimisticMessage?.id
      };
    }
  } catch (error: any) {
    console.error('❌ Error sending message:', error);
    return { 
      success: false, 
      error: axios.isAxiosError(error) 
        ? (error.response?.data as any)?.error || 'Network error. Message not sent.' 
        : 'Network error. Message not sent.',
      tempId: optimisticMessage?.id
    };
  }
};
  
/**
 * Upload file for message
 * POST /api/communication/upload
 */
export const uploadFile = async (
  file: File, 
  orderId: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; fileUrl?: string; error?: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('orderId', orderId);

    console.log(`📤 Uploading file: ${file.name}`);

    const response = await axios.post(`${COMMUNICATION_API_BASE}/upload`, formData, {
      headers: { 
        ...authHeader(), 
        'Content-Type': 'multipart/form-data' 
      },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          const progress = Math.round((e.loaded * 100) / e.total);
          onProgress(progress);
          console.log(`📊 Upload progress: ${progress}%`);
        }
      }
    });

    if (response.data.success) {
      console.log('✅ File uploaded successfully:', response.data.fileUrl);
      return { 
        success: true, 
        fileUrl: response.data.fileUrl 
      };
    } else {
      console.error('❌ File upload failed:', response.data);
      return { 
        success: false, 
        error: response.data.error || 'Upload failed' 
      };
    }
  } catch (error: any) {
    console.error('❌ Error uploading file:', error);
    return { 
      success: false, 
      error: 'File upload failed' 
    };
  }
};

/**
 * Mark messages as read
 * PUT /api/communication/:orderId/read
 */
export const markMessagesAsRead = async (orderId: number): Promise<void> => {
  try {
    await axios.put(
      `${COMMUNICATION_API_BASE}/${orderId}/read`,
      {},
      { headers: authHeader() }
    );
    console.log(`✅ Marked messages as read for order ${orderId}`);
  } catch (error: any) {
    console.error('❌ Error marking messages as read:', error);
  }
};

// Helper Functions

/**
 * Update message in array (for optimistic updates)
 */
export const updateMessageInArray = (messages: Message[], updated: Message, tempId?: string): Message[] => {
  return messages.map(msg => 
    (tempId && msg.id === tempId) || msg.id === updated.id ? updated : msg
  );
};

/**
 * Update message status
 */
export const updateMessageStatus = (messages: Message[], messageId: string, statusUpdate: any): Message[] => {
  return messages.map(msg => 
    msg.id === messageId ? { ...msg, ...statusUpdate } : msg
  );
};

/**
 * Remove message from array (for failed sends)
 */
export const removeMessageFromArray = (messages: Message[], messageId: string): Message[] => {
  return messages.filter(msg => msg.id !== messageId);
};

/**
 * Update optimistic message with error
 */
export const markMessageAsFailed = (messages: Message[], messageId: string, error: string): Message[] => {
  return messages.map(msg => 
    msg.id === messageId 
      ? { 
          ...msg, 
          delivery_status: 'failed',
          status: 'failed',
          errorMessage: error,
          error_message: error
        } 
      : msg
  );
};

/**
 * Check if message is optimistic (pending confirmation)
 */
export const isOptimisticMessage = (message: Message): boolean => {
  if (!message || !message.id) {
    return false;
  }
  
  const messageId = String(message.id);
  return messageId.startsWith('temp_') || message.delivery_status === 'sending';
};

/**
 * Format message for display (handles different field names)
 */
export const normalizeMessage = (message: any): Message => {
  return normalizeBackendMessage(message);
};