import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket as ClientSocket } from 'socket.io-client';
import { WebSocketNotification } from '../types/device';
import { deviceApi } from '../services/deviceApi';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<WebSocketNotification | null>(null);
  const socketRef = useRef<ClientSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  // const lastNotificationId = useRef<number | null>(null);
  // const prevIsConnected = useRef(false);

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

  // 최근 알림 중복 표시 방지: 알림 캐시 추가
  const shownNotificationKeys = useRef<Set<string>>(new Set());

  const isNotificationShown = useCallback((notification: WebSocketNotification | null) => {
    if (!notification) return false;
    // type+data를 key로 사용 (data에 id/hash가 있으면 더 정교하게)
    const key = notification.type + JSON.stringify(notification.data);
    if (shownNotificationKeys.current.has(key)) return true;
    shownNotificationKeys.current.add(key);
    return false;
  }, []);

  // useEffect(() => {
  //   if (lastNotification && (lastNotification as any).id) {
  //     lastNotificationId.current = (lastNotification as any).id;
  //   }
  // }, [lastNotification]);

  // useEffect(() => {
  //   if (isConnected && !prevIsConnected.current) {
  //     // 연결 복구 시 누락 알림 조회
  //     if (onMissedNotifications) {
  //       deviceApi.getNotifications(lastNotificationId.current ?? undefined)
  //         .then((missed) => {
  //           if (missed && missed.length > 0) {
  //             onMissedNotifications(missed);
  //           }
  //         })
  //         .catch((e) => {
  //           console.warn('누락 알림 조회 실패:', e);
  //         });
  //     }
  //   }
  //   prevIsConnected.current = isConnected;
  // }, [isConnected, onMissedNotifications]);

  return {
    isConnected,
    lastNotification,
    sendMessage,
    isNotificationShown
  };
};