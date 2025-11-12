// WebSocket Client for Real-Time Updates
"use client";

import { io, Socket } from "socket.io-client";
import { UserLocation } from "@/lib/domain/entities/location";

export interface SocketEvents {
  // Connection events
  "connect": () => void;
  "disconnect": () => void;
  
  // User presence events
  "user:online": (data: { userId: string; userName: string; timestamp: Date }) => void;
  "user:offline": (data: { userId: string; userName: string; timestamp: Date }) => void;
  "users:connected": (users: Array<{ userId: string; userName: string; isOnline: boolean }>) => void;
  
  // Location events
  "locations:initial": (locations: UserLocation[]) => void;
  "location:updated": (data: { userId: string; userName: string; location: any; timestamp: Date }) => void;
  "location:update:success": (data: { success: boolean }) => void;
  "location:update:error": (data: { error: string }) => void;
  
  // Activity events
  "user:activity": (data: { userId: string; userName: string; activity: any; timestamp: Date }) => void;
}

class SocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(token: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
        auth: { token },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.socket.on("connect", () => {
        console.log("Connected to socket server");
        this.reconnectAttempts = 0;
        resolve(this.socket!);
      });

      this.socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error("Failed to connect after multiple attempts"));
        }
      });

      this.socket.on("disconnect", (reason) => {
        console.log("Disconnected from socket server:", reason);
      });

      // Start heartbeat
      this.startHeartbeat();
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    if (this.socket) {
      this.socket.on(event as string, callback as any);
    }
  }

  off<K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event as string, callback as any);
      } else {
        this.socket.off(event as string);
      }
    }
  }

  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn("Socket not connected, cannot emit event:", event);
    }
  }

  // Specific methods for common actions
  updateLocation(location: {
    coordinates: { latitude: number; longitude: number };
    address: { city: string; country: string; countryCode: string };
    accuracy?: number;
  }) {
    this.emit("location:update", location);
  }

  sendActivity(activity: { type: string; data?: any }) {
    this.emit("user:activity", activity);
  }

  private startHeartbeat() {
    if (this.socket) {
      // Send heartbeat every 30 seconds
      setInterval(() => {
        if (this.socket?.connected) {
          this.emit("heartbeat");
        }
      }, 30000);
    }
  }

  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  get socketId(): string | undefined {
    return this.socket?.id;
  }
}

export const socketClient = new SocketClient();