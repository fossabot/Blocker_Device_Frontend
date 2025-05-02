import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { deviceApi } from '../services/deviceApi';
import UpdatesList from '../components/UpdatesList';
import Vehicle3DView from '../components/Vehicle3DView';
import { DeviceInfo as IDeviceInfo, Update } from '../types/device';
import ToastContainer, { ToastData } from '../components/shared/ToastContainer';

const Dashboard: React.FC = () => {
  const [deviceInfo, setDeviceInfo] = useState<IDeviceInfo | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const { lastNotification } = useWebSocket();

  const loadDeviceInfo = async () => {
    try {
      const info = await deviceApi.getDeviceInfo();
      setDeviceInfo(info);
    } catch (error) {
      console.error('Failed to load device info:', error);
    }
  };

  const loadUpdates = async () => {
    try {
      const updatesData = await deviceApi.getAvailableUpdates();
      setUpdates(updatesData);
    } catch (error) {
      console.error('Failed to load updates:', error);
    }
  };

  useEffect(() => {
    loadDeviceInfo();
    loadUpdates();
  }, []);

  useEffect(() => {
    if (lastNotification?.type === 'update_progress') {
      const { uid, progress } = lastNotification.data as Update;
      
      setToasts(prev => {
        const existing = prev.find(t => t.id === uid);
        if (existing) {
          return prev.map(t => 
            t.id === uid 
              ? { ...t, percent: progress, type: progress === 100 ? 'success' : 'default' }
              : t
          );
        }
        return [...prev, {
          id: uid,
          type: 'default',
          title: 'Updating...',
          percent: progress
        }];
      });

      if (progress === 100) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== uid));
          loadUpdates(); // 업데이트 완료 후 목록 새로고침
        }, 3000);
      }
    }
  }, [lastNotification]);

  const handleUpdateInstall = () => {
    loadUpdates(); // 설치 후 목록 새로고침
  };

  const handleRefresh = () => {
    loadUpdates(); // 수동 새로고침
  };

  const handleCloseToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div className="main-frame">
      <Vehicle3DView />
      
      <div className="bottom-cards">
        <div className="card">
          <div className="card-title">Available Updates</div>
          <UpdatesList 
            updates={updates} 
            onUpdateInstall={handleUpdateInstall}
            onRefresh={handleRefresh}
          />
        </div>

        {deviceInfo && (
          <div className="card">
            <div className="card-title">Device Information</div>
            <div className="device-info-list">
              <span className="device-info-label">Device ID</span>
              <span className="device-info-value">{deviceInfo.id}</span>
              <span className="device-info-label">Model</span>
              <span className="device-info-value">{deviceInfo.model}</span>
              <span className="device-info-label">Serial Number</span>
              <span className="device-info-value">{deviceInfo.serialNumber}</span>
              <span className="device-info-label">Software Version</span>
              <span className="device-info-value">{deviceInfo.version}</span>
              <span className="device-info-label">Software Status</span>
              <span className="device-info-value">
                <span className={`status-${deviceInfo.status}`}>
                  {deviceInfo.status === 'normal' ? 'Normal' : deviceInfo.status === 'error' ? 'Error' : 'Updating'}
                </span>
              </span>
              <span className="device-info-label">Final Update</span>
              <span className="device-info-value final-update">
                {deviceInfo.lastUpdate ? new Date(deviceInfo.lastUpdate).toLocaleDateString() : 'Never'}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <ToastContainer toasts={toasts} onClose={handleCloseToast} />
    </div>
  );
};

export default Dashboard;