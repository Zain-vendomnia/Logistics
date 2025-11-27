// /services/socketService.ts
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private readonly serverUrl: string;

  constructor() {
    // 🔥 FIX: Use port 8081 (your backend port)
    this.serverUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8080';
  }

  connect() {
    if (this.socket?.connected) {
      console.log('⚠️ [SOCKET] Socket already connected');
      return;
    }

    // Extract accessToken from user object
    const userStr = localStorage.getItem('user');
    
    if (!userStr) {
      console.error('❌ [SOCKET] No user data found in localStorage.');
      console.error('💡 [SOCKET] Please login first to get authentication token.');
      return;
    }

    let token: string | null = null;
    
    try {
      const user = JSON.parse(userStr);
      token = user.accessToken;
      
      if (!token) {
        console.error('❌ [SOCKET] No accessToken found in user object.');
        console.error('📋 [SOCKET] User object:', user);
        return;
      }
      
      console.log('✅ [SOCKET] Token extracted from user object');
      console.log('🔑 [SOCKET] Token preview:', token.substring(0, 30) + '...');
      
    } catch (error) {
      console.error('❌ [SOCKET] Failed to parse user data from localStorage:', error);
      return;
    }

    console.log(`🔌 [SOCKET] Attempting to connect to: ${this.serverUrl}`);

    this.socket = io(this.serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ [SOCKET] Socket connected:', this.socket?.id);
      console.log('🎉 [SOCKET] Authentication successful!');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 [SOCKET] Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        console.log('🔄 [SOCKET] Server disconnected, attempting reconnect...');
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('❌ [SOCKET] Socket connection error:', error.message);
      console.error('📄 [SOCKET] Full error:', error);
      
      if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
        console.error('🔐 [SOCKET] Authentication failed!');
        console.error('🔑 [SOCKET] Token used:', token?.substring(0, 30) + '...');
        console.error('💡 [SOCKET] Possible issues:');
        console.error('   1. Token is expired - try logging in again');
        console.error('   2. Token format is invalid');
        console.error('   3. Backend auth middleware is rejecting it');
        console.error('   4. Token secret key mismatch');
      } else if (error.message.includes('CORS')) {
        console.error('🌐 [SOCKET] CORS error. Backend might not allow this origin.');
        console.error(`🔍 [SOCKET] Frontend origin: ${window.location.origin}`);
        console.error(`🔍 [SOCKET] Backend URL: ${this.serverUrl}`);
      } else if (error.message.includes('timeout')) {
        console.error('⏱️ [SOCKET] Connection timeout. Is the server running?');
        console.error(`🔍 [SOCKET] Trying to connect to: ${this.serverUrl}`);
      }
    });

    this.socket.on('error', (error: any) => {
      console.error('❌ [SOCKET] Socket error:', error);
    });

    this.socket.on('unauthorized', (data: any) => {
      console.error('🔐 [SOCKET] Backend rejected authentication:', data);
      this.disconnect();
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 [SOCKET] Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // ============= Admin Room Methods =============

  joinAdminRoom(): void {
    const socket = this.getSocket();
    if (socket && socket.connected) {
      socket.emit('join-admin-room');
      console.log('📥 [SOCKET] Emitted join-admin-room event');
    } else {
      console.warn('⚠️ [SOCKET] Socket not connected, cannot join admin room');
    }
  }

  leaveAdminRoom(): void {
    const socket = this.getSocket();
    if (socket && socket.connected) {
      socket.emit('leave-admin-room');
      console.log('📤 [SOCKET] Emitted leave-admin-room event');
    }
  }

  refreshCustomerList(): void {
    const socket = this.getSocket();
    if (socket && socket.connected) {
      socket.emit('refresh-customer-list');
      console.log('🔄 [SOCKET] Emitted refresh-customer-list event');
    }
  }

  requestTotalUnread(): void {
    const socket = this.getSocket();
    if (socket && socket.connected) {
      socket.emit('request-total-unread');
      console.log('🔢 [SOCKET] Emitted request-total-unread event');
    }
  }

  // ============= Order Room Methods =============

  joinOrder(orderId: number): void {
    const socket = this.getSocket();
    if (socket && socket.connected) {
      socket.emit('join-order', orderId.toString());
      console.log(`📥 [SOCKET] Emitted join-order event for order ${orderId}`);
    } else {
      console.warn(`⚠️ [SOCKET] Socket not connected, cannot join order ${orderId}`);
    }
  }

  leaveOrder(orderId: number): void {
    const socket = this.getSocket();
    if (socket && socket.connected) {
      socket.emit('leave-order', orderId.toString());
      console.log(`📤 [SOCKET] Emitted leave-order event for order ${orderId}`);
    }
  }

  sendTypingIndicator(orderId: number, isTyping: boolean): void {
    const socket = this.getSocket();
    if (socket && socket.connected) {
      socket.emit('typing', { orderId: orderId.toString(), isTyping });
    }
  }

  // ============= Event Listeners =============

  onNewMessage(callback: (message: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.on('new-message', callback);
      console.log('👂 [SOCKET] Registered listener for new-message');
    }
  }

  offNewMessage(callback: (message: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.off('new-message', callback);
    }
  }

  onMessageUpdated(callback: (update: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.on('message-updated', callback);
      console.log('👂 [SOCKET] Registered listener for message-updated');
    }
  }

  offMessageUpdated(callback: (update: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.off('message-updated', callback);
    }
  }

  onMessageStatusUpdated(callback: (update: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.on('message-status-updated', callback);
      console.log('👂 [SOCKET] Registered listener for message-status-updated');
    }
  }

  offMessageStatusUpdated(callback: (update: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.off('message-status-updated', callback);
    }
  }

  onMessagesRead(callback: (data: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.on('messages-read', callback);
      console.log('👂 [SOCKET] Registered listener for messages-read');
    }
  }

  offMessagesRead(callback: (data: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.off('messages-read', callback);
    }
  }

  onUserTyping(callback: (data: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.on('user-typing', callback);
    }
  }

  offUserTyping(callback: (data: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.off('user-typing', callback);
    }
  }

  onCustomerListUpdate(callback: (data: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.on('customer-list-update', callback);
      console.log('👂 [SOCKET] Registered listener for customer-list-update');
    }
  }

  offCustomerListUpdate(callback: (data: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.off('customer-list-update', callback);
    }
  }

  onSingleCustomerUpdate(callback: (data: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.on('customer-single-update', callback);
      console.log('👂 [SOCKET] Registered listener for customer-single-update');
    }
  }

  offSingleCustomerUpdate(callback: (data: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.off('customer-single-update', callback);
    }
  }

  onTotalUnreadUpdate(callback: (data: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.on('total-unread-update', callback);
      console.log('👂 [SOCKET] Registered listener for total-unread-update');
    }
  }

  offTotalUnreadUpdate(callback: (data: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.off('total-unread-update', callback);
    }
  }

  onGlobalMessageStatus(callback: (data: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.on('global-message-status', callback);
      console.log('👂 [SOCKET] Registered listener for global-message-status');
    }
  }

  offGlobalMessageStatus(callback: (data: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.off('global-message-status', callback);
    }
  }

  onChannelNotification(callback: (data: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.on('channel-notification', callback);
      console.log('👂 [SOCKET] Registered listener for channel-notification');
    }
  }

  offChannelNotification(callback: (data: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.off('channel-notification', callback);
    }
  }

  onAdminRoomJoined(callback: (data: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.on('admin-room-joined', callback);
      console.log('👂 [SOCKET] Registered listener for admin-room-joined');
    }
  }

  offAdminRoomJoined(callback: (data: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.off('admin-room-joined', callback);
    }
  }

  onRequestInitialCustomerList(callback: (data: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.on('request-initial-customer-list', callback);
      console.log('👂 [SOCKET] Registered listener for request-initial-customer-list');
    }
  }

  offRequestInitialCustomerList(callback: (data: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.off('request-initial-customer-list', callback);
    }
  }

  onRequestCustomerListRefresh(callback: (data: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.on('request-customer-list-refresh', callback);
      console.log('👂 [SOCKET] Registered listener for request-customer-list-refresh');
    }
  }

  offRequestCustomerListRefresh(callback: (data: any) => void): void {
    const socket = this.getSocket();
    if (socket) {
      socket.off('request-customer-list-refresh', callback);
    }
  }
}

export const socketService = new SocketService();