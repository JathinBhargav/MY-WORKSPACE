// src/utils/websocket.ts
import { io, Socket } from 'socket.io-client';

// Points to backend event gateway safely
const SOCKET_SERVER_URL = (typeof process !== 'undefined' && process.env?.REACT_APP_WS_URL) 
  || ((import.meta as any).env?.VITE_WS_URL) 
  || 'http://localhost:3001';

export let socket: Socket | null = null;

export const initializeWebSocket = (userId: string, onHealthUpdate: (data: any) => void) => {
  if (!socket) {
    socket = io(SOCKET_SERVER_URL, {
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('Telemetry sync pipeline established:', socket?.id);
      // Register the active session securely on the backend worker loop
      socket?.emit('register_session', userId);
    });

    // Capture background worker events to update your Live Node Health metrics
    socket.on('NODE_HEALTH_UPDATE', (data) => {
      onHealthUpdate(data);
    });

    socket.on('disconnect', (reason) => {
      console.warn('Telemetry stream detached temporarily:', reason);
    });
  }

  return socket;
};

export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
