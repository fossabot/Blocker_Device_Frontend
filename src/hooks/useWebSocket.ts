import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket as ClientSocket } from 'socket.io-client';
import { WebSocketNotification } from '../types/device';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<WebSocketNotification | null>(null);
  const socketRef = useRef<ClientSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  useEffect(() => {
    let isCleanedUp = false;

    const initializeSocket = () => {
      if (socketRef.current?.connected) {
        console.log('[WebSocket] 이미 연결되어 있음');
        return;
      }

      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        console.error('[WebSocket] 최대 재연결 시도 횟수 초과');
        return;
      }

      console.log('[WebSocket] 초기화 시작...', import.meta.env.VITE_API_URL);
      
      const socket = io(import.meta.env.VITE_API_URL, {
        path: '/socket.io',
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000 * Math.min(reconnectAttemptsRef.current + 1, 5),
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        timeout: 20000,
        autoConnect: true,
        forceNew: true,
        withCredentials: true
      });

      socket.on('connect', () => {
        console.log('[WebSocket] 연결됨:', socket.id);
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      });

      socket.on('connect_error', (error) => {
        console.error('[WebSocket] 연결 오류:', error);
        setIsConnected(false);
        reconnectAttemptsRef.current++;
        
        if (!isCleanedUp && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          console.log(`[WebSocket] 재연결 시도 ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`);
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('[WebSocket] 연결 해제됨, 이유:', reason);
        setIsConnected(false);

        if (!isCleanedUp && reason !== 'io client disconnect') {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[WebSocket] 재연결 시도 중...');
            socket.connect();
          }, 1000 * Math.min(reconnectAttemptsRef.current + 1, 5));
        }
      });

      socket.on('notification', (data: WebSocketNotification) => {
        if (!isCleanedUp) {
          console.log('[WebSocket] 알림 수신:', data);
          setLastNotification({ ...data }); // 항상 새로운 객체로 할당
        }
      });

      socket.on('error', (error) => {
        console.error('[WebSocket] 에러 발생:', error);
      });

      socketRef.current = socket;
    };

    initializeSocket();

    return () => {
      isCleanedUp = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        console.log('[WebSocket] 연결 정리 중...');
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const sendMessage = useCallback((type: string, data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(type, data);
    } else {
      console.warn('[WebSocket] 연결되어 있지 않음');
    }
  }, [isConnected]);

  return {
    isConnected,
    lastNotification,
    sendMessage
  };
};