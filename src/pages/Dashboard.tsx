import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { deviceApi } from '../services/deviceApi';
import UpdatesList from '../components/UpdatesList';
import Vehicle3DView from '../components/Vehicle3DView';
import DeviceInfo from '../components/DeviceInfo';
import { DeviceInfo as IDeviceInfo, Update } from '../types/device';
import ToastContainer, { ToastData } from '../components/shared/ToastContainer';

const Dashboard: React.FC = () => {
  const [deviceInfo, setDeviceInfo] = useState<IDeviceInfo>({
    id: 'Unknown',
    model: 'Unknown',
    serialNumber: 'Unknown',
    version: 'Unknown',
    status: 'normal',
    lastUpdate: undefined
  });
  const [updates, setUpdates] = useState<Update[]>([]);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const { lastNotification } = useWebSocket();

  const loadDeviceInfo = async () => {
    try {
      const info = await deviceApi.getDeviceInfo();
      setDeviceInfo(info);
    } catch (error) {
      console.error('Failed to load device info:', error);
      setDeviceInfo({
        id: 'Unknown',
        model: 'Unknown',
        serialNumber: 'Unknown',
        version: 'Unknown',
        status: 'error'
      });
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

        <DeviceInfo info={deviceInfo} />
      </div>
      
      <ToastContainer toasts={toasts} onClose={handleCloseToast} />
    </div>
  );
};

export default Dashboard;