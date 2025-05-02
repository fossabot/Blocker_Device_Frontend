import React from 'react';
import { DeviceInfo } from '../../types/device';

interface ConnectionStatusProps {
  isBlockchainConnected: boolean;
  isWebSocketConnected: boolean;
  deviceInfo: DeviceInfo | null;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isBlockchainConnected,
  isWebSocketConnected,
  deviceInfo
}) => {
  const getStatusColor = (isConnected: boolean) => 
    isConnected ? 'text-green-600' : 'text-red-600';

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">연결 상태</h2>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span>블록체인 연결</span>
          <span className={getStatusColor(isBlockchainConnected)}>
            {isBlockchainConnected ? '연결됨' : '연결 끊김'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>실시간 알림</span>
          <span className={getStatusColor(isWebSocketConnected)}>
            {isWebSocketConnected ? '연결됨' : '연결 끊김'}
          </span>
        </div>
        {deviceInfo && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span>기기 ID</span>
              <span className="text-gray-600">{deviceInfo.id}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span>현재 버전</span>
              <span className="text-gray-600">{deviceInfo.version}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;