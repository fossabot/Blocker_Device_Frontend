import React, { createContext, useContext, ReactNode } from 'react';
import { useWebSocket } from './useWebSocket';

const WebSocketContext = createContext<ReturnType<typeof useWebSocket> | null>(null);

// 최근 알림 중복 표시 방지: 알림 캐시 추가
const shownNotificationIds = new Set<string>();

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const ws = useWebSocket();
  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  return ctx;
};
