import { io, Socket } from 'socket.io-client';
import authHeader from './auth-header';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';

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


  getSocket(): Socket | null { return this.socket; }
}

export const socketService = new SocketService();