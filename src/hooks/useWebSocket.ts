import { useState, useEffect, useCallback } from 'react';
import { io, Socket as ClientSocket } from 'socket.io-client';
import { WebSocketNotification } from '../types/device';

export const useWebSocket = () => {
  const [socket, setSocket] = useState<ClientSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<WebSocketNotification | null>(null);

  useEffect(() => {
    // Socket.IO 클라이언트 초기화
    const socketIo = io('http://localhost:8002', {
      path: '/socket.io',
      transports: ['polling', 'websocket'], // polling을 먼저 시도하고 websocket으로 업그레이드
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true
    });

    // 연결 이벤트 핸들러
    socketIo.on('connect', () => {
      console.log('WebSocket 연결됨');
      setIsConnected(true);
    });

    socketIo.on('connect_error', (error) => {
      console.error('WebSocket 연결 오류:', error);
      setIsConnected(false);
    });

    socketIo.on('disconnect', () => {
      console.log('WebSocket 연결 해제됨');
      setIsConnected(false);
    });

    // 알림 이벤트 핸들러
    socketIo.on('notification', (data: WebSocketNotification) => {
      console.log('알림 수신:', data);
      setLastNotification(data);
    });

    setSocket(socketIo);

    // 클린업 함수
    return () => {
      if (socketIo) {
        socketIo.disconnect();
      }
    };
  }, []);

  // 메시지 전송 함수
  const sendMessage = useCallback((type: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(type, data);
    } else {
      console.warn('WebSocket이 연결되어 있지 않습니다');
    }
  }, [socket, isConnected]);

  return {
    isConnected,
    lastNotification,
    sendMessage
  };
};