import React, { useState, useEffect } from 'react';
import { useWebSocketContext } from '../../hooks/WebSocketContext';
import { VehicleStatus } from '../../types/device';
import { CubeIcon, BellIcon } from '@heroicons/react/24/outline';
import VehicleLabels from './labels';
import { DeviceInfo } from '../../types/device';

interface UpdateLabelInfo {
  uid?: string;
  version?: string;
  description?: string;
  active: boolean;
  position: 'door' | 'engine';
}

const getUpdateLabelInfo = (deviceInfo: DeviceInfo): UpdateLabelInfo | null => {
  if (!deviceInfo.lastUpdateUid || !deviceInfo.lastUpdateDescription) return null;
  const desc = deviceInfo.lastUpdateDescription.toLowerCase();
  if (desc.includes('stop')) {
    return null;
  }
  if (desc.includes('camera') || desc.includes('obstacle')) {
    return {
      uid: deviceInfo.lastUpdateUid,
      version: deviceInfo.version,
      description: deviceInfo.lastUpdateDescription,
      active: true,
      position: 'door',
    };
  }
  if (desc.includes('zigzag') || desc.includes('straight')) {
    return {
      uid: deviceInfo.lastUpdateUid,
      version: deviceInfo.version,
      description: deviceInfo.lastUpdateDescription,
      active: true,
      position: 'engine',
    };
  }
  return null;
};

const Vehicle3DView: React.FC<{ deviceInfo?: DeviceInfo }> = ({ deviceInfo }) => {
  const [vehicleStatus, setVehicleStatus] = useState<VehicleStatus>({
    trunkOpen: false,
    doorOpen: false,
    engineOn: false,
    batteryLevel: 90
  });

  const { lastNotification, isConnected } = useWebSocketContext();

  useEffect(() => {
    if (lastNotification?.type === 'vehicle_status') {
      setVehicleStatus(prev => ({
        ...prev,
        ...lastNotification.data as VehicleStatus
      }));
    }
  }, [lastNotification]);

  // 업데이트 정보 파싱
  const updateLabelInfo = deviceInfo ? getUpdateLabelInfo(deviceInfo) : null;

  return (
    <div className="main-content">
      <div className="status-bar">
        <div className="status-row">
          <div className="gear">P R N D</div>
          <div className="battery">
            <div className="battery-bar">
              <div 
                className="battery-level"
                style={{ width: `${(vehicleStatus?.batteryLevel || 0) * 0.75}px` }}
              ></div>
            </div>
            <span className="battery-percent">{vehicleStatus?.batteryLevel || 0}%</span>
          </div>
        </div>
        <div className="status-row alarm-column">
          <div className="blockchain-status flex items-center gap-3 pl-2 pr-6 py-2 bg-gray-100 rounded-full">
            <CubeIcon className={`w-6 h-6 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`blockchain-text font-semibold ${isConnected ? 'text-gray-800' : 'text-gray-800'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="alarm pl-1">
            <BellIcon className="w-7 h-7 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="car-area relative">
        <img
          src="/automobile.svg"
          alt="Car"
          className="w-full h-auto"
        />
        <VehicleLabels 
          updateLabelInfo={updateLabelInfo}
        />
      </div>
    </div>
  );
};

export default Vehicle3DView;