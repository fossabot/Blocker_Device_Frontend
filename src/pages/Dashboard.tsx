import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { deviceApi } from '../services/deviceApi';
import UpdatesList from '../components/UpdatesList';
import Vehicle3DView from '../components/Vehicle3DView';
import DeviceInfo from '../components/DeviceInfo';
import { DeviceInfo as IDeviceInfo, Update, UpdateProgress } from '../types/device';
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

  // 초기 로딩 시 HTTP로 데이터 가져오기
  useEffect(() => {
    const loadInitialData = async () => {
      await loadDeviceInfo();
      try {
        const updatesData = await deviceApi.getAvailableUpdates();
        setUpdates(updatesData);
      } catch (error) {
        console.error('Failed to load updates:', error);
      }
    };
    loadInitialData();
  }, []);

  // WebSocket 알림 처리
  useEffect(() => {
    if (!lastNotification) return;
    
    const isUpdateData = (data: any): data is Update => {
      return 'uid' in data && 'version' in data;
    };

    const isUpdateProgressData = (data: any): data is UpdateProgress => {
      return 'uid' in data && 'progress' in data;
    };

    if (lastNotification.type === 'new_update' && isUpdateData(lastNotification.data)) {
      console.log('[Dashboard] Creating toast for new update:', lastNotification.data);
      
      // 즉시 토스트 생성
      const updateData = lastNotification.data;
      const toastId = `update-${updateData.uid}-${Date.now()}`;
      const newToast = {
        id: toastId,
        type: 'info' as const,
        title: `새로운 업데이트`,
        message: `버전 ${updateData.version}이 사용 가능합니다\n${updateData.description || ''}`,
        progress: 0
      };
      setToasts(prevToasts => [...prevToasts, newToast]);

      // 목록 갱신
      handleRefresh();

      // 10초 후 토스트 제거
      setTimeout(() => {
        setToasts(prevToasts => prevToasts.filter(t => t.id !== toastId));
      }, 10000);
    }

    if (lastNotification.type === 'update_progress' && isUpdateProgressData(lastNotification.data)) {
      const progressData = lastNotification.data;
      const { uid, progress = 0 } = progressData;
      
      setUpdates(prev => prev.map(update => 
        update.uid === uid 
          ? { ...update, progress, status: progress === 100 ? 'completed' : 'installing' }
          : update
      ));

      // Update existing progress toast or create new one
      const toastId = `install-${uid}`;
      setToasts(prev => {
        const existing = prev.find(t => t.id === toastId);
        if (existing) {
          return prev.map(t => 
            t.id === toastId 
              ? { 
                  ...t, 
                  type: progress === 100 ? 'success' : 'default',
                  title: progress === 100 ? '업데이트 설치 완료!' : '업데이트 설치 중',
                  message: `${Math.round(progress)}% 완료`,
                  percent: progress 
                }
              : t
          );
        }
        return prev;
      });

      if (progress === 100) {
        loadDeviceInfo();
        setTimeout(() => {
          setToasts(prevToasts => prevToasts.filter(t => t.id !== toastId));
        }, 3000);
      }
    }
  }, [lastNotification]);

  const handleRefresh = async () => {
    try {
      const updatesData = await deviceApi.getAvailableUpdates();
      setUpdates(updatesData);
    } catch (error) {
      console.error('Failed to refresh updates:', error);
      setToasts(prev => [...prev, {
        id: `error-refresh-${Date.now()}`,
        type: 'default',
        title: '오류',
        message: '업데이트 목록을 새로고침하는데 실패했습니다',
        progress: 0
      }]);
    }
  };

  const handleCloseToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div className="main-frame">
      <Vehicle3DView />
      
      <div className="bottom-cards">
        <UpdatesList 
          updates={updates} 
          onUpdateInstall={loadDeviceInfo}
          onRefresh={handleRefresh}
        />
        
        <DeviceInfo info={deviceInfo} />
      </div>
      
      <ToastContainer toasts={toasts} onClose={handleCloseToast} />
    </div>
  );
};

export default Dashboard;