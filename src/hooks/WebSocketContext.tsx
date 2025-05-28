import React, { useContext } from 'react';
import { useWebSocket } from './useWebSocket';

export const WebSocketContext = React.createContext<any>(null);

export const WebSocketProvider = ({ children, onMissedNotifications }: any) => {
  const ws = useWebSocket(onMissedNotifications);
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
